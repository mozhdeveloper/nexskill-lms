import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CoachAppLayout from '../../layouts/CoachAppLayout';
import { Search, Plus, Edit, Copy, Trash2, BarChart3, Users, Clock, CheckCircle, AlertCircle, FileText, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

interface Quiz {
  id: string;
  title: string;
  course: string;
  courseId: string;
  questions: number;
  passingScore: number;
  timeLimit?: number;
  attempts: number;
  avgScore: number;
  completionRate: number;
  status: 'published' | 'draft' | 'archived';
  createdDate: string;
  lastModified: string;
  totalAttempts: number;
  hasFileUpload?: boolean;
  pendingGrading?: number;
}

interface PendingSubmission {
  id: string;
  studentName: string;
  studentAvatar: string;
  quizTitle: string;
  questionTitle: string;
  submittedAt: string;
  fileName: string;
  fileSize: string;
  tentativeScore?: number;
  maxPoints: number;
}

const CoachQuizzesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [, setLoadingQuizzes] = useState(true);
  const [coachCoursesList, setCoachCoursesList] = useState<{ id: string; title: string }[]>([]);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizCourseId, setNewQuizCourseId] = useState('');

  useEffect(() => {
    const fetchQuizzes = async () => {
      if (!user) return;
      try {
        // Get coach's course IDs
        const { data: courses } = await supabase
          .from('courses')
          .select('id, title')
          .eq('coach_id', user.id);

        const courseIds = courses?.map(c => c.id) || [];
        const courseMap = Object.fromEntries((courses || []).map((c: { id: string; title: string }) => [c.id, c.title]));

        if (courseIds.length === 0) { setLoadingQuizzes(false); return; }

        // Get all module_content_items of type 'quiz' for these courses
        const { data: modules } = await supabase
          .from('modules')
          .select('id, course_id')
          .in('course_id', courseIds);

        const moduleIds = modules?.map(m => m.id) || [];
        const moduleToCourse = Object.fromEntries((modules || []).map((m: { id: number; course_id: string }) => [m.id, m.course_id]));

        if (moduleIds.length === 0) { setLoadingQuizzes(false); return; }

        const { data: contentItems } = await supabase
          .from('module_content_items')
          .select('content_id, module_id')
          .in('module_id', moduleIds)
          .eq('content_type', 'quiz');

        const quizIds = (contentItems || []).map((ci: { content_id: string }) => ci.content_id);
        const quizToCourse: Record<string, string> = {};
        (contentItems || []).forEach((ci: { content_id: string; module_id: number }) => {
          quizToCourse[ci.content_id] = moduleToCourse[ci.module_id] || '';
        });

        if (quizIds.length === 0) { setLoadingQuizzes(false); return; }

        // Fetch quizzes
        const { data: quizRows } = await supabase
          .from('quizzes')
          .select('*')
          .in('id', quizIds);

        // Fetch question counts
        const { data: questionCounts } = await supabase
          .from('quiz_questions')
          .select('quiz_id')
          .in('quiz_id', quizIds);

        const qCountMap: Record<string, number> = {};
        (questionCounts || []).forEach((q: { quiz_id: string }) => {
          qCountMap[q.quiz_id] = (qCountMap[q.quiz_id] || 0) + 1;
        });

        // Fetch attempt stats
        const { data: attempts } = await supabase
          .from('quiz_attempts')
          .select('quiz_id, score, max_score, status')
          .in('quiz_id', quizIds);

        const attemptStats: Record<string, { total: number; completed: number; totalScore: number }> = {};
        (attempts || []).forEach((a: { quiz_id: string; score: number; max_score: number; status: string }) => {
          if (!attemptStats[a.quiz_id]) attemptStats[a.quiz_id] = { total: 0, completed: 0, totalScore: 0 };
          attemptStats[a.quiz_id].total++;
          if (a.status === 'submitted' || a.status === 'graded') {
            attemptStats[a.quiz_id].completed++;
            if (a.max_score > 0) {
              attemptStats[a.quiz_id].totalScore += Math.round((a.score / a.max_score) * 100);
            }
          }
        });

        const mapped: Quiz[] = (quizRows || []).map((q: Record<string, unknown>) => {
          const stats = attemptStats[q.id as string] || { total: 0, completed: 0, totalScore: 0 };
          const avgScore = stats.completed > 0 ? Math.round(stats.totalScore / stats.completed) : 0;
          const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
          const courseId = quizToCourse[q.id as string] || '';

          return {
            id: q.id as string,
            title: q.title as string,
            course: courseMap[courseId] || 'Unknown Course',
            courseId,
            questions: qCountMap[q.id as string] || 0,
            passingScore: (q.passing_score as number) || 70,
            timeLimit: (q.time_limit_minutes as number) || undefined,
            attempts: (q.max_attempts as number) || 0,
            avgScore,
            completionRate,
            status: 'published' as const,
            createdDate: (q.created_at as string)?.split('T')[0] || '',
            lastModified: (q.updated_at as string)?.split('T')[0] || (q.created_at as string)?.split('T')[0] || '',
            totalAttempts: stats.total,
          };
        });

        setQuizzes(mapped);
      } catch (err) {
        console.error('Error fetching quizzes:', err);
      } finally {
        setLoadingQuizzes(false);
      }
    };
    fetchQuizzes();
  }, [user]);

  // No pending submissions from DB yet — placeholder for future file upload feature
  const [pendingSubmissions] = useState<PendingSubmission[]>([]);

  // Fetch coach's courses for the create modal
  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return;
      const { data } = await supabase.from('courses').select('id, title').eq('coach_id', user.id).order('title');
      setCoachCoursesList(data || []);
    };
    fetchCourses();
  }, [user]);

  const handleCreateQuiz = async () => {
    if (!newQuizTitle.trim() || !newQuizCourseId) return;
    try {
      // Create the quiz
      const { data: newQuiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({ title: newQuizTitle.trim(), passing_score: 70, is_published: false })
        .select('id')
        .single();
      if (quizError || !newQuiz) throw quizError;

      // Find the first module of the selected course to link the quiz
      const { data: firstModule } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', newQuizCourseId)
        .order('position', { ascending: true })
        .limit(1)
        .single();

      if (firstModule) {
        // Get max position in this module
        const { data: maxPos } = await supabase
          .from('module_content_items')
          .select('position')
          .eq('module_id', firstModule.id)
          .order('position', { ascending: false })
          .limit(1)
          .single();

        await supabase.from('module_content_items').insert({
          module_id: firstModule.id,
          content_type: 'quiz',
          content_id: newQuiz.id,
          position: (maxPos?.position ?? -1) + 1,
        });
      }

      setShowCreateModal(false);
      setNewQuizTitle('');
      setNewQuizCourseId('');
      // Navigate to course builder to edit the quiz
      navigate(`/coach/courses/${newQuizCourseId}/edit`);
    } catch (err) {
      console.error('Error creating quiz:', err);
      alert('Failed to create quiz. Please try again.');
    }
  };

  const handleEditQuiz = (quiz: Quiz) => {
    if (quiz.courseId) {
      navigate(`/coach/courses/${quiz.courseId}/edit`);
    }
  };

  const handleDuplicateQuiz = async (quiz: Quiz) => {
    try {
      // 1. Duplicate the quiz in the DB
      const { data: newQuiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title: `${quiz.title} (Copy)`,
          description: '',
          passing_score: quiz.passingScore,
          time_limit_minutes: quiz.timeLimit || null,
          max_attempts: quiz.attempts || null,
          is_published: false,
        })
        .select()
        .single();

      if (quizError || !newQuiz) throw quizError;

      // 2. Copy questions from original quiz
      const { data: originalQuestions } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quiz.id)
        .order('position');

      if (originalQuestions && originalQuestions.length > 0) {
        const newQuestions = originalQuestions.map(q => ({
          quiz_id: newQuiz.id,
          position: q.position,
          question_type: q.question_type,
          question_content: q.question_content,
          points: q.points,
          requires_manual_grading: q.requires_manual_grading,
          answer_config: q.answer_config,
        }));
        await supabase.from('quiz_questions').insert(newQuestions);
      }

      // 3. Add to local state
      const duplicated: Quiz = {
        ...quiz,
        id: newQuiz.id,
        title: newQuiz.title,
        status: 'draft',
        totalAttempts: 0,
        avgScore: 0,
        completionRate: 0,
        createdDate: new Date().toISOString().split('T')[0],
        lastModified: new Date().toISOString().split('T')[0],
      };
      setQuizzes(prev => [...prev, duplicated]);
    } catch (err) {
      console.error('Error duplicating quiz:', err);
      alert('Failed to duplicate quiz.');
    }
  };

  const handleDeleteQuiz = async (quiz: Quiz) => {
    if (quiz.totalAttempts > 0) return;
    try {
      await supabase.from('quizzes').delete().eq('id', quiz.id);
      setQuizzes(quizzes.filter(q => q.id !== quiz.id));
    } catch (err) {
      console.error('Error deleting quiz:', err);
    }
  };

  const handleViewAnalytics = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setShowDetailModal(true);
  };

  const handlePublishQuiz = async (quiz: Quiz) => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .update({ is_published: true })
        .eq('id', quiz.id);
      if (error) throw error;
      setQuizzes(prev => prev.map(q => q.id === quiz.id ? { ...q, status: 'published' } : q));
    } catch (err) {
      console.error('Error publishing quiz:', err);
    }
  };

  const handleArchiveQuiz = async (quiz: Quiz) => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .update({ is_published: false })
        .eq('id', quiz.id);
      if (error) throw error;
      setQuizzes(prev => prev.map(q => q.id === quiz.id ? { ...q, status: 'draft' } : q));
    } catch (err) {
      console.error('Error archiving quiz:', err);
    }
  };

  const handleGradeSubmission = (_submission: PendingSubmission) => {
    // Future: grade file upload submission
  };

  const handleDownloadSubmission = (_submission: PendingSubmission) => {
    // Future: download file upload submission
  };

  const totalPendingGrading = pendingSubmissions.filter(s => s.tentativeScore === undefined).length;

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch =
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.course.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || quiz.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalQuizzes = quizzes.length;
  const publishedQuizzes = quizzes.filter(q => q.status === 'published').length;
  const totalAttempts = quizzes.reduce((sum, q) => sum + q.totalAttempts, 0);
  const avgCompletionRate = Math.round(
    quizzes.filter(q => q.status === 'published').reduce((sum, q) => sum + q.completionRate, 0) /
      publishedQuizzes || 0
  );

  return (
    <CoachAppLayout>
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white dark:bg-dark-background-card border-b border-slate-200 dark:border-gray-700 px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-dark-text-primary mb-2">
                Quizzes & Assessments
              </h1>
              <p className="text-slate-600 dark:text-dark-text-secondary">
                Create and manage quizzes for your courses
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold"
            >
              <Plus className="w-5 h-5" />
              Create Quiz
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-4">
              <div className="text-sm text-slate-600 dark:text-dark-text-secondary mb-1">Total Quizzes</div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalQuizzes}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-4">
              <div className="text-sm text-slate-600 dark:text-dark-text-secondary mb-1">Published</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{publishedQuizzes}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-4">
              <div className="text-sm text-slate-600 dark:text-dark-text-secondary mb-1">Total Attempts</div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{totalAttempts}</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-2xl p-4">
              <div className="text-sm text-slate-600 dark:text-dark-text-secondary mb-1">Avg Completion</div>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{avgCompletionRate}%</div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-4 relative">
              <div className="text-sm text-slate-600 dark:text-dark-text-secondary mb-1">Pending Grading</div>
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{totalPendingGrading}</div>
              {totalPendingGrading > 0 && (
                <span className="absolute top-2 right-2 w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* Pending File Upload Grading Section */}
        {pendingSubmissions.length > 0 && (
          <div className="px-8 py-6 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                  <Upload className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-dark-text-primary">
                    File Uploads Awaiting Review
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-dark-text-secondary">
                    {totalPendingGrading} submissions need grading • Scores marked as "Tentative" until reviewed
                  </p>
                </div>
              </div>
              <button
                onClick={() => window.alert('📋 Opening full grading queue...\n\nThis will show all pending file submissions across all quizzes with filtering and bulk grading options.')}
                className="text-sm text-amber-700 hover:text-amber-800 font-medium"
              >
                View All →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {pendingSubmissions.slice(0, 4).map((submission) => (
                <div
                  key={submission.id}
                  className="bg-white dark:bg-dark-background-card rounded-xl p-4 border border-amber-200 dark:border-amber-800"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                      {submission.studentAvatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-dark-text-primary truncate">
                        {submission.studentName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-dark-text-muted">
                        {submission.submittedAt}
                      </p>
                    </div>
                    {submission.tentativeScore !== undefined ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        Graded
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full animate-pulse">
                        Pending
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-slate-600 dark:text-dark-text-secondary mb-2 line-clamp-1">
                    {submission.questionTitle}
                  </p>
                  
                  <div className="flex items-center gap-2 mb-3 p-2 bg-slate-50 dark:bg-gray-800 rounded-lg">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-600 dark:text-dark-text-secondary truncate flex-1">
                      {submission.fileName}
                    </span>
                    <span className="text-xs text-slate-400">{submission.fileSize}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadSubmission(submission)}
                      className="flex-1 px-3 py-1.5 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-dark-text-primary text-xs font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleGradeSubmission(submission)}
                      className="flex-1 px-3 py-1.5 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 transition-colors"
                    >
                      Grade ({submission.maxPoints} pts)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters & Search */}
        <div className="px-8 py-6 bg-slate-50 dark:bg-dark-background border-b border-slate-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search quizzes by title or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-dark-background-card rounded-lg border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 bg-white dark:bg-dark-background-card border border-slate-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Quizzes Grid */}
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredQuizzes.map(quiz => (
              <div
                key={quiz.id}
                className="bg-white dark:bg-dark-background-card rounded-2xl border border-slate-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-dark-text-primary mb-1">
                      {quiz.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-dark-text-secondary">{quiz.course}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {quiz.hasFileUpload && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs font-medium flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        File Upload
                      </span>
                    )}
                    {quiz.pendingGrading && quiz.pendingGrading > 0 && (
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-xs font-medium animate-pulse">
                        {quiz.pendingGrading} pending
                      </span>
                    )}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        quiz.status === 'published'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : quiz.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {quiz.status}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-dark-text-secondary">
                    <AlertCircle className="w-4 h-4" />
                    <span>{quiz.questions} questions</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-dark-text-secondary">
                    <Clock className="w-4 h-4" />
                    <span>{quiz.timeLimit ? `${quiz.timeLimit} min` : 'No limit'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-dark-text-secondary">
                    <Users className="w-4 h-4" />
                    <span>{quiz.totalAttempts} attempts</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-dark-text-secondary">
                    <CheckCircle className="w-4 h-4" />
                    <span>{quiz.passingScore}% to pass</span>
                  </div>
                </div>

                {/* Stats */}
                {quiz.status === 'published' && quiz.totalAttempts > 0 && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <div className="text-xs text-slate-600 dark:text-dark-text-secondary mb-1">Avg Score</div>
                      <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{quiz.avgScore}%</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                      <div className="text-xs text-slate-600 dark:text-dark-text-secondary mb-1">Completion</div>
                      <div className="text-xl font-bold text-green-600 dark:text-green-400">{quiz.completionRate}%</div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-gray-700">
                  {quiz.status === 'draft' ? (
                    <button
                      onClick={() => handlePublishQuiz(quiz)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Publish
                    </button>
                  ) : quiz.status === 'published' ? (
                    <>
                      <button
                        onClick={() => navigate(`/coach/courses/${quiz.courseId}/quiz-reviews`)}
                        className="flex-1 px-3 py-2 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                      >
                        <FileText className="w-4 h-4" />
                        Review Submissions
                      </button>
                      <button
                        onClick={() => handleViewAnalytics(quiz)}
                        className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                      >
                        <BarChart3 className="w-4 h-4" />
                        Analytics
                      </button>
                      <button
                        onClick={() => handleArchiveQuiz(quiz)}
                        className="px-3 py-2 bg-slate-100 text-slate-700 dark:bg-gray-800 dark:text-dark-text-primary rounded-lg hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                      >
                        Archive
                      </button>
                    </>
                  ) : null}
                  <button
                    onClick={() => handleEditQuiz(quiz)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-slate-600 dark:text-dark-text-secondary" />
                  </button>
                  <button
                    onClick={() => handleDuplicateQuiz(quiz)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4 text-slate-600 dark:text-dark-text-secondary" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuiz(quiz)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Quiz Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-background-card rounded-2xl max-w-lg w-full p-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-dark-text-primary mb-4">Create New Quiz</h2>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-dark-text-primary mb-2">
                  Quiz Title
                </label>
                <input
                  type="text"
                  value={newQuizTitle}
                  onChange={(e) => setNewQuizTitle(e.target.value)}
                  placeholder="e.g., JavaScript Fundamentals Quiz"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-dark-text-primary mb-2">
                  Select Course
                </label>
                <select
                  value={newQuizCourseId}
                  onChange={(e) => setNewQuizCourseId(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select a course --</option>
                  {coachCoursesList.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-dark-text-primary rounded-lg hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateQuiz}
                disabled={!newQuizTitle.trim() || !newQuizCourseId}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showDetailModal && selectedQuiz && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-background-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-dark-text-primary mb-1">
                    {selectedQuiz.title}
                  </h2>
                  <p className="text-slate-600 dark:text-dark-text-secondary">{selectedQuiz.course}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-dark-text-primary"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <div className="text-sm text-slate-600 dark:text-dark-text-secondary mb-1">Total Attempts</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedQuiz.totalAttempts}</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                  <div className="text-sm text-slate-600 dark:text-dark-text-secondary mb-1">Avg Score</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{selectedQuiz.avgScore}%</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                  <div className="text-sm text-slate-600 dark:text-dark-text-secondary mb-1">Completion</div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {selectedQuiz.completionRate}%
                  </div>
                </div>
              </div>

              {/* Quiz Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-gray-700">
                  <span className="text-slate-600 dark:text-dark-text-secondary">Questions</span>
                  <span className="font-semibold text-slate-900 dark:text-dark-text-primary">{selectedQuiz.questions}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-gray-700">
                  <span className="text-slate-600 dark:text-dark-text-secondary">Time Limit</span>
                  <span className="font-semibold text-slate-900 dark:text-dark-text-primary">
                    {selectedQuiz.timeLimit ? `${selectedQuiz.timeLimit} minutes` : 'No limit'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-gray-700">
                  <span className="text-slate-600 dark:text-dark-text-secondary">Passing Score</span>
                  <span className="font-semibold text-slate-900 dark:text-dark-text-primary">{selectedQuiz.passingScore}%</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-gray-700">
                  <span className="text-slate-600 dark:text-dark-text-secondary">Created</span>
                  <span className="font-semibold text-slate-900 dark:text-dark-text-primary">{selectedQuiz.createdDate}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-slate-600 dark:text-dark-text-secondary">Last Modified</span>
                  <span className="font-semibold text-slate-900 dark:text-dark-text-primary">{selectedQuiz.lastModified}</span>
                </div>
              </div>

              {/* Insights */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">📊 Quick Insights</h3>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
                  <li>
                    • {selectedQuiz.avgScore >= 80 ? '✅' : selectedQuiz.avgScore >= 70 ? '⚠️' : '❌'} Average score is{' '}
                    {selectedQuiz.avgScore >= 80 ? 'excellent' : selectedQuiz.avgScore >= 70 ? 'good' : 'below target'}
                  </li>
                  <li>
                    • {selectedQuiz.completionRate >= 90 ? '✅' : '⚠️'} {selectedQuiz.completionRate}% completion rate
                  </li>
                  <li>• 📈 {selectedQuiz.totalAttempts} students have taken this quiz</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </CoachAppLayout>
  );
};

export default CoachQuizzesPage;
