import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import CoachAppLayout from '../../layouts/CoachAppLayout';
import StudentListTable from '../../components/coach/students/StudentListTable';
import StudentProgressOverview from '../../components/coach/students/StudentProgressOverview';
import StudentExportBar from '../../components/coach/students/StudentExportBar';
import GroupAnnouncementPanel from '../../components/coach/students/GroupAnnouncementPanel';
import StudentScoresPanel from '../../components/coach/students/StudentScoresPanel';
import { supabase } from '../../lib/supabaseClient';
import { Loader2, RefreshCw } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  enrollmentDate: string;
  status: 'Active' | 'Completed' | 'At risk';
  progressPercent: number;
  lastActiveAt: string;
  averageScore: number;
}

interface QuizStat {
  id: string;
  title: string;
  averageScore: number;
  completionRate: number;
  totalAttempts: number;
}

const CourseStudents: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'at-risk' | 'completed'>('all');
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [courseTitle, setCourseTitle] = useState('Course');
  const [isLoading, setIsLoading] = useState(true);
  const [quizStats, setQuizStats] = useState<QuizStat[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchCourseData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    
    try {
      // 1. Course title
      const { data: courseRow } = await supabase
        .from('courses').select('title').eq('id', courseId).single();
      if (courseRow) setCourseTitle(courseRow.title);

      // 2. Enrollments for this course
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('profile_id, enrolled_at')
        .eq('course_id', courseId);

      if (!enrollments?.length) { 
        setStudents([]); 
        setQuizStats([]);
        return; 
      }

      const studentIds = enrollments.map(e => e.profile_id);

      // 3. Student profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, updated_at')
        .in('id', studentIds);

      // 4. Lesson ids for this course (published only - matches student side)
      const { data: modules } = await supabase
        .from('modules').select('id').eq('course_id', courseId);
      const moduleIds = (modules || []).map(m => m.id);

      let lessonIds: string[] = [];
      if (moduleIds.length) {
        const { data: items } = await supabase
          .from('module_content_items')
          .select('content_id')
          .in('module_id', moduleIds)
          .eq('content_type', 'lesson')
          .eq('content_status', 'published');
        lessonIds = (items || []).map(i => i.content_id);
      }

      // 5. Lesson progress per student
      let progressRows: { user_id: string; is_completed: boolean; updated_at?: string }[] = [];
      if (lessonIds.length) {
        const { data } = await supabase
          .from('user_lesson_progress')
          .select('user_id, is_completed, updated_at')
          .in('user_id', studentIds)
          .in('lesson_id', lessonIds);
        progressRows = data || [];
      }

      // 6. Quiz IDs for this course (published only) - MUST come from module_content_items
      let quizIds: string[] = [];

      // Get quizzes from module_content_items (this is the ONLY way quizzes are linked to courses)
      if (moduleIds.length) {
        const { data: qi, error: quizItemError } = await supabase
          .from('module_content_items')
          .select('content_id')
          .in('module_id', moduleIds)
          .eq('content_type', 'quiz')
          .eq('content_status', 'published');
        
        if (quizItemError) {
          console.error('❌ Error fetching quiz content items:', quizItemError);
        }
        
        quizIds = (qi || []).map(q => q.content_id);
      }

      console.log('📊 Module IDs:', moduleIds);
      console.log('📊 Quiz IDs from module_content_items:', quizIds);
      console.log('📝 Student IDs:', studentIds.length);
      
      // Show helpful message if no quizzes found
      if (quizIds.length === 0) {
        console.warn('⚠️ WARNING: No published quizzes found in this course\'s modules!');
        console.warn('💡 To add quizzes: Go to Course Editor → Curriculum → Add Content to a lesson → Quiz');
      }

      // 6a. Fetch quiz attempts for student average scores
      let attemptRows: { user_id: string; score: number; max_score: number; created_at?: string }[] = [];
      if (quizIds.length && studentIds.length) {
        const { data, error: attemptError } = await supabase
          .from('quiz_attempts')
          .select('user_id, score, max_score, created_at')
          .in('user_id', studentIds)
          .in('quiz_id', quizIds)
          .in('status', ['submitted', 'graded']);
        
        if (attemptError) {
          console.error('❌ Error fetching quiz attempts:', attemptError);
        }
        attemptRows = data || [];
        console.log('📝 Quiz attempts for students:', attemptRows.length, attemptRows);
      }

      // 6b. Fetch quiz statistics for StudentScoresPanel - ONLY for enrolled students in this course
      let quizStatsData: QuizStat[] = [];
      if (quizIds.length > 0) {
        console.log('\n=== QUIZ STATS DEBUG ===');
        console.log('🔍 Quiz IDs to fetch:', quizIds);
        console.log('👥 Student IDs (enrolled only):', studentIds);
        console.log('📚 Has enrolled students:', studentIds.length > 0);

        // Fetch quiz titles
        const { data: quizzesData, error: quizError } = await supabase
          .from('quizzes')
          .select('id, title')
          .in('id', quizIds);

        if (quizError) {
          console.error('❌ Error fetching quizzes:', quizError);
        }

        console.log('📚 Quizzes data:', quizzesData);

        // Fetch quiz attempts ONLY for enrolled students in this course
        let allAttempts: any[] = [];
        if (studentIds.length > 0) {
          const { data: attemptsData, error: attemptsError } = await supabase
            .from('quiz_attempts')
            .select('id, quiz_id, user_id, score, max_score, status, created_at')
            .in('quiz_id', quizIds)
            .in('user_id', studentIds); // Only enrolled students

          if (attemptsError) {
            console.error('❌ Error fetching all attempts:', attemptsError);
            console.error('Error details:', JSON.stringify(attemptsError));
          }

          allAttempts = attemptsData || [];
          console.log('📊 All quiz attempts fetched:', allAttempts.length);
          if (allAttempts.length > 0) {
            console.log('📝 Sample attempts:', allAttempts.slice(0, 3));
          }
        } else {
          console.log('⚠️ No enrolled students, skipping attempts fetch');
        }

        // Fetch ALL quiz responses for detailed scoring
        let allResponses: any[] = [];
        if (allAttempts && allAttempts.length > 0) {
          const attemptIds = allAttempts.map(a => a.id);
          console.log('🔍 Fetching responses for attempt IDs:', attemptIds);

          const { data: responsesData, error: responsesError } = await supabase
            .from('quiz_responses')
            .select('attempt_id, question_id, points_earned, points_possible, is_correct')
            .in('attempt_id', attemptIds);

          if (responsesError) {
            console.error('❌ Error fetching quiz responses:', responsesError);
          }
          allResponses = responsesData || [];
          console.log('📝 All quiz responses:', allResponses.length);
        }

        // Build stats per quiz - ONLY for enrolled students
        quizStatsData = quizIds.map(quizId => {
          const quiz = quizzesData?.find(q => q.id === quizId);
          // Filter attempts for this quiz AND enrolled students only
          const quizAttempts = allAttempts?.filter(a => 
            a.quiz_id === quizId && 
            (studentIds.length === 0 || studentIds.includes(a.user_id))
          ) || [];
          const quizAttemptIds = quizAttempts.map(a => a.id);

          // Get responses for this quiz's attempts
          const quizResponses = (allResponses || []).filter(r =>
            quizAttemptIds.includes(r.attempt_id)
          );

          // Only use submitted or graded attempts for score calculation
          const completedAttempts = quizAttempts.filter(a =>
            (a.status === 'submitted' || a.status === 'graded') &&
            a.score !== null &&
            a.max_score !== null &&
            a.max_score > 0
          );

          console.log(`\n📋 Quiz "${quiz?.title || 'Unknown'}" (${quizId}):`);
          console.log('   - Total attempts:', quizAttempts.length);
          console.log('   - Completed attempts (submitted/graded):', completedAttempts.length);
          console.log('   - Quiz responses:', quizResponses.length);
          if (quizAttempts.length > 0) {
            console.log('   - Attempt details:', quizAttempts.map(a => ({
                id: a.id,
                score: a.score,
                max: a.max_score,
                status: a.status
              })));
          } else {
            console.log('   - ⚠️ No attempts yet for this quiz');
          }

          // Total attempts count (all statuses for enrolled students)
          const totalAttemptsCount = quizAttempts.length;

          // Calculate average score from completed attempts
          let avgScore = 0;
          if (completedAttempts.length > 0) {
            const scorePercentages = completedAttempts.map(a => (a.score! / a.max_score!) * 100);
            console.log('   - Score percentages:', scorePercentages);
            avgScore = Math.round(
              scorePercentages.reduce((sum, pct) => sum + pct, 0) / completedAttempts.length
            );
          }

          // Fallback: Calculate from quiz_responses if no completed attempts
          if (completedAttempts.length === 0 && quizResponses.length > 0) {
            console.log('   - ⚠️ No completed attempts, calculating from responses...');
            const responsesByAttempt: Record<string, typeof quizResponses> = {};
            quizResponses.forEach(r => {
              if (!responsesByAttempt[r.attempt_id]) {
                responsesByAttempt[r.attempt_id] = [];
              }
              responsesByAttempt[r.attempt_id].push(r);
            });

            console.log('   - Responses by attempt:', Object.keys(responsesByAttempt).length, 'attempts');

            const attemptScores = Object.values(responsesByAttempt).map(responses => {
              const totalEarned = responses.reduce((sum, r) => sum + (r.points_earned || 0), 0);
              const totalPossible = responses.reduce((sum, r) => sum + (r.points_possible || 0), 0);
              const pct = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;
              console.log('     - Attempt score:', totalEarned, '/', totalPossible, '=', pct.toFixed(1) + '%');
              return pct;
            });

            if (attemptScores.length > 0) {
              avgScore = Math.round(
                attemptScores.reduce((sum, score) => sum + score, 0) / attemptScores.length
              );
            }
          }

          // Calculate completion rate (students who attempted / total enrolled)
          const studentsWhoAttempted = new Set(quizAttempts.map(a => a.user_id)).size;
          const completionRate = studentIds.length > 0
            ? Math.round((studentsWhoAttempted / studentIds.length) * 100)
            : 0;

          console.log('   - ✅ Final stats:', {
            totalAttempts: totalAttemptsCount,
            avgScore,
            completionRate
          });

          return {
            id: quizId,
            title: quiz?.title || 'Untitled Quiz',
            averageScore: avgScore,
            completionRate,
            totalAttempts: totalAttemptsCount,
          };
        });

        console.log('\n📊 FINAL Quiz Stats:', quizStatsData);
      } else {
        console.log('⚠️ No quiz IDs found for this course');
      }
      setQuizStats(quizStatsData);

      // 7. Map to Student shape
      const totalLessons = lessonIds.length;
      const mapped: Student[] = (profiles || []).map(p => {
        const enr = enrollments.find(e => e.profile_id === p.id);
        const pRows = progressRows.filter(r => r.user_id === p.id);
        const completed = pRows.filter(r => r.is_completed).length;
        const progress = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;

        const aRows = attemptRows.filter(r => r.user_id === p.id);
        const avgScore = aRows.length > 0
          ? Math.round(aRows.reduce((s, r) => s + (r.max_score > 0 ? (r.score / r.max_score) * 100 : 0), 0) / aRows.length)
          : 0;

        // Calculate last active date based on course-specific activity
        const lessonActivityDates = pRows
          .filter(r => r.updated_at)
          .map(r => new Date(r.updated_at!).getTime());
        const quizActivityDates = aRows
          .filter(r => r.created_at)
          .map(r => new Date(r.created_at!).getTime());
        const allActivityDates = [...lessonActivityDates, ...quizActivityDates];
        
        const lastActiveTime = allActivityDates.length > 0
          ? Math.max(...allActivityDates)
          : new Date(p.updated_at || Date.now()).getTime();
        
        const lastActive = new Date(lastActiveTime);
        const diffDays = Math.floor((Date.now() - lastActive.getTime()) / 86400000);
        const lastActiveStr = diffDays === 0 ? 'Today'
          : diffDays === 1 ? '1 day ago'
          : diffDays < 7 ? `${diffDays} days ago`
          : lastActive.toLocaleDateString();

        // Status logic
        let status: 'Active' | 'Completed' | 'At risk' = 'At risk';
        if (progress === 100) {
          status = 'Completed';
        } else if (diffDays <= 7) {
          status = 'Active';
        }

        return {
          id: p.id,
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email,
          email: p.email,
          enrollmentDate: enr ? new Date(enr.enrolled_at).toLocaleDateString() : 'N/A',
          status,
          progressPercent: progress,
          lastActiveAt: lastActiveStr,
          averageScore: avgScore,
        };
      });

      setStudents(mapped);
    } catch (err) {
      console.error('Error fetching course students:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!courseId) return;
    
    const initialFetch = async () => {
      setIsLoading(true);
      await fetchCourseData();
    };
    
    initialFetch();
  }, [courseId]);

  const handleManualRefresh = async () => {
    setIsLoading(true);
    await fetchCourseData(true);
  };

  const totalEnrolled = students.length;
  const averageCompletion = students.length > 0
    ? Math.round(students.reduce((s, st) => s + st.progressPercent, 0) / students.length) : 0;
  const averageQuizScore = students.length > 0
    ? Math.round(students.reduce((s, st) => s + st.averageScore, 0) / students.length) : 0;

  const handleExport = (payload: { type: string; format: string }) => {
    if (students.length === 0) return;
    const headers = ['Name', 'Email', 'Enrollment Date', 'Status', 'Progress %', 'Last Active', 'Avg Score %'];
    const rows = students.map(s => [
      s.name, s.email, s.enrollmentDate, s.status, s.progressPercent,
      s.lastActiveAt, s.averageScore,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${courseTitle.replace(/\s+/g, '_')}_students_${payload.type}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  const [announcementSuccess, setAnnouncementSuccess] = useState(false);

  const handleSendAnnouncement = (_payload: {
    subject: string;
    channels: { email: boolean; inApp: boolean };
    body: string;
  }) => {
    setIsAnnouncementOpen(false);
    setAnnouncementSuccess(true);
    setTimeout(() => setAnnouncementSuccess(false), 3000);
  };

  return (
    <CoachAppLayout>
      <div className="flex-1 overflow-y-auto p-8">
        {/* Header */}
        <div className="mb-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-[#5F6473] mb-3">
            <Link to="/coach/courses" className="hover:text-[#304DB5] transition-colors">
              Courses
            </Link>
            <span>→</span>
            <span>{courseTitle}</span>
            <span>→</span>
            <span className="text-[#111827] font-medium">Students</span>
          </div>

          {/* Title and Meta */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-[#111827] mb-3">{courseTitle} – Students</h1>
              <div className="flex items-center gap-3">
                <span className="px-4 py-2 bg-[#E0E5FF] text-[#304DB5] rounded-full text-sm font-semibold">
                  Enrolled: {isLoading ? '...' : totalEnrolled}
                </span>
                <span className="px-4 py-2 bg-[#E0F2FE] text-[#0284C7] rounded-full text-sm font-semibold">
                  Avg completion: {isLoading ? '...' : averageCompletion}%
                </span>
                <span className="px-4 py-2 bg-[#D1FAE5] text-[#059669] rounded-full text-sm font-semibold">
                  Avg quiz score: {isLoading ? '...' : averageQuizScore}%
                </span>
              </div>
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-[#EDF0FB] rounded-xl hover:bg-[#F5F7FF] transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 text-[#304DB5] ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium text-[#304DB5]">Refresh</span>
            </button>
          </div>
        </div>

        {/* Utility Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          {/* Left: Search and Filter */}
          <div className="flex items-center gap-3 flex-1 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-initial lg:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#EDF0FB] dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#304DB5] focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9CA3B5]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as 'all' | 'active' | 'at-risk' | 'completed')
              }
              className="px-4 py-3 rounded-xl border border-[#EDF0FB] dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#304DB5] focus:border-transparent bg-white text-[#111827] font-medium"
            >
              <option value="all">All students</option>
              <option value="active">Active</option>
              <option value="at-risk">At risk</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Right: Export and Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <StudentExportBar onExport={handleExport} />
            <button
              onClick={() => setIsAnnouncementOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                />
              </svg>
              Send group announcement
            </button>
          </div>
        </div>

        {/* Export Success Banner */}
        {exportSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <p className="text-sm font-medium text-green-900">
              Export generated successfully!
            </p>
          </div>
        )}

        {/* Announcement Success Banner */}
        {announcementSuccess && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
            <span className="text-2xl">📢</span>
            <p className="text-sm font-medium text-blue-900">
              Announcement sent successfully!
            </p>
          </div>
        )}

        {/* Main Content: Two Column Layout */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#304DB5]" />
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Student List (wider) */}
          <div className="lg:col-span-2">
            <StudentListTable
              students={students}
              searchQuery={searchQuery}
              filterStatus={filterStatus}
            />
          </div>

          {/* Right Column: Overview Cards (narrower) */}
          <div className="space-y-6">
            <StudentProgressOverview students={students} />
            <StudentScoresPanel quizzes={quizStats} />
          </div>
        </div>
        )}
      </div>

      {/* Announcement Panel */}
      <GroupAnnouncementPanel
        isOpen={isAnnouncementOpen}
        onClose={() => setIsAnnouncementOpen(false)}
        onSend={handleSendAnnouncement}
      />
    </CoachAppLayout>
  );
};

export default CourseStudents;
