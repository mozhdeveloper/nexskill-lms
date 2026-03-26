import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import CoachAppLayout from '../../layouts/CoachAppLayout';
import StudentListTable from '../../components/coach/students/StudentListTable';
import StudentProgressOverview from '../../components/coach/students/StudentProgressOverview';
import StudentExportBar from '../../components/coach/students/StudentExportBar';
import GroupAnnouncementPanel from '../../components/coach/students/GroupAnnouncementPanel';
import StudentScoresPanel from '../../components/coach/students/StudentScoresPanel';
import { supabase } from '../../lib/supabaseClient';
import { Loader2 } from 'lucide-react';

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

  useEffect(() => {
    if (!courseId) return;
    const fetchData = async () => {
      setIsLoading(true);
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

        if (!enrollments?.length) { setStudents([]); return; }

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
            .eq('is_published', true);
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

        // 6. Quiz scores per student (published only - matches student side)
        let quizIds: string[] = [];
        if (moduleIds.length) {
          const { data: qi } = await supabase
            .from('module_content_items')
            .select('content_id')
            .in('module_id', moduleIds)
            .eq('content_type', 'quiz')
            .eq('is_published', true);
          quizIds = (qi || []).map(q => q.content_id);
        }
        let attemptRows: { user_id: string; score: number; max_score: number; created_at?: string }[] = [];
        if (quizIds.length) {
          const { data } = await supabase
            .from('quiz_attempts')
            .select('user_id, score, max_score, created_at')
            .in('user_id', studentIds)
            .in('quiz_id', quizIds)
            .in('status', ['submitted', 'graded']);
          attemptRows = data || [];
        }

        // 6b. Fetch quiz statistics for StudentScoresPanel
        let quizStatsData: QuizStat[] = [];
        if (quizIds.length > 0) {
          // Fetch quiz titles
          const { data: quizzesData } = await supabase
            .from('quizzes')
            .select('id, title')
            .in('id', quizIds);
          
          // Fetch all quiz attempts for stats
          const { data: allAttempts } = await supabase
            .from('quiz_attempts')
            .select('quiz_id, user_id, score, max_score, status')
            .in('quiz_id', quizIds);

          // Build stats per quiz
          quizStatsData = quizIds.map(quizId => {
            const quiz = quizzesData?.find(q => q.id === quizId);
            const quizAttempts = allAttempts?.filter(a => a.quiz_id === quizId) || [];
            const completedAttempts = quizAttempts.filter(a => a.status === 'submitted' || a.status === 'graded');

            // Calculate average score
            const avgScore = completedAttempts.length > 0
              ? Math.round(completedAttempts.reduce((sum, a) => sum + (a.max_score > 0 ? (a.score / a.max_score) * 100 : 0), 0) / completedAttempts.length)
              : 0;

            // Calculate completion rate (students who attempted / total enrolled)
            const studentsWhoAttempted = new Set(quizAttempts.map(a => a.user_id)).size;
            const completionRate = studentIds.length > 0
              ? Math.round((studentsWhoAttempted / studentIds.length) * 100)
              : 0;

            return {
              id: quizId,
              title: quiz?.title || 'Untitled Quiz',
              averageScore: avgScore,
              completionRate,
              totalAttempts: quizAttempts.length,
            };
          });
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

          // Calculate last active date based on course-specific activity (lesson progress or quiz attempts)
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

          // Status logic: Completed if 100% progress, Active if activity within 7 days, At risk otherwise
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
      }
    };
    fetchData();
  }, [courseId]);

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
