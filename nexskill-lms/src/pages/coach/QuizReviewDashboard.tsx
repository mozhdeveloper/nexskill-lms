import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CoachAppLayout from '../../layouts/CoachAppLayout';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Clock, CheckCircle, XCircle, Users, ArrowRight, ArrowLeft, Eye, Search, Filter, ChevronDown } from 'lucide-react';
import type { QuizSubmissionStatus } from '../../types/quiz';
import { useCoachQuizSubmissions } from '../../hooks/useQuizSubmission';

interface CourseWithStats {
  id: string;
  title: string;
  totalPending: number;
  totalSubmissions: number;
}

interface SubmissionWithStudent {
  id: string;
  status: QuizSubmissionStatus;
  submitted_at: string;
  student_name?: string;
  student_email?: string;
  quiz_title?: string;
  quiz_score?: number;
  quiz_max_score?: number;
}

const QuizReviewDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { courseId } = useParams<{ courseId?: string }>();

  const [courses, setCourses] = useState<CourseWithStats[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [filterStatus, setFilterStatus] = useState<QuizSubmissionStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch submissions for selected course
  const { submissions, loading: loadingSubmissions } = useCoachQuizSubmissions(
    courseId || undefined
  );

  // Fetch coach's courses
  useEffect(() => {
    const fetchCoursesWithStats = async () => {
      if (!user) return;

      try {
        setLoadingCourses(true);

        // Get coach's courses
        const { data: coursesData } = await supabase
          .from('courses')
          .select('id, title')
          .eq('coach_id', user.id)
          .order('created_at', { ascending: false });

        if (!coursesData || coursesData.length === 0) {
          setCourses([]);
          setLoadingCourses(false);
          return;
        }

        // For each course, get quiz submissions count
        const coursesWithStats = await Promise.all(
          coursesData.map(async (course) => {
            // Get quiz IDs for this course
            const { data: modules } = await supabase
              .from('modules')
              .select('id')
              .eq('course_id', course.id);

            const moduleIds = modules?.map(m => m.id) || [];

            if (moduleIds.length === 0) {
              return { id: course.id, title: course.title, totalPending: 0, totalSubmissions: 0 };
            }

            // Collect quiz IDs from both module_content_items and lesson_content_items
            const quizIds = new Set<string>();

            // 1. Check module_content_items for direct quizzes
            const { data: contentItems } = await supabase
              .from('module_content_items')
              .select('content_id')
              .in('module_id', moduleIds)
              .eq('content_type', 'quiz');

            contentItems?.forEach(ci => quizIds.add(ci.content_id));

            // 2. Get lessons from module_content_items (content_type = 'lesson')
            const { data: lessonContentRefs } = await supabase
              .from('module_content_items')
              .select('content_id')
              .in('module_id', moduleIds)
              .eq('content_type', 'lesson');

            if (lessonContentRefs && lessonContentRefs.length > 0) {
              const lessonIds = lessonContentRefs.map(l => l.content_id);

              // Get quizzes from lesson_content_items
              const { data: lessonContentItems } = await supabase
                .from('lesson_content_items')
                .select('content_id')
                .eq('content_type', 'quiz')
                .in('lesson_id', lessonIds);

              lessonContentItems?.forEach(lci => quizIds.add(lci.content_id));
            }

            const uniqueQuizIds = Array.from(quizIds);

            if (uniqueQuizIds.length === 0) {
              return { id: course.id, title: course.title, totalPending: 0, totalSubmissions: 0 };
            }

            // Get submissions
            const { data: submissions } = await supabase
              .from('quiz_submissions')
              .select('status')
              .in('quiz_id', uniqueQuizIds);

            const totalSubmissions = submissions?.length || 0;
            const totalPending = submissions?.filter(s => s.status === 'pending_review').length || 0;

            return {
              id: course.id,
              title: course.title,
              totalPending,
              totalSubmissions,
            };
          })
        );

        setCourses(coursesWithStats);
      } catch (err) {
        console.error('Error fetching courses:', err);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCoursesWithStats();
  }, [user]);

  const handleViewCourse = (id: string) => {
    navigate(`/coach/courses/${id}/quiz-reviews`);
  };

  const handleReviewSubmission = (submissionId: string) => {
    navigate(`/coach/courses/${courseId}/quiz-reviews/${submissionId}`);
  };

  const getStatusBadge = (status: QuizSubmissionStatus) => {
    switch (status) {
      case 'pending_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'passed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            Passed
          </span>
        );
    }
  };

  // Filter submissions
  const filteredSubmissions = (submissions as SubmissionWithStudent[]).filter((sub) => {
    if (filterStatus !== 'all' && sub.status !== filterStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        sub.student_name?.toLowerCase().includes(query) ||
        sub.student_email?.toLowerCase().includes(query) ||
        sub.quiz_title?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const stats = {
    total: submissions.length,
    pending: submissions.filter((s) => s.status === 'pending_review').length,
    passed: submissions.filter((s) => s.status === 'passed').length,
  };

  // ===================== VIEW: Course Submissions List =====================
  if (courseId) {
    const selectedCourse = courses.find(c => c.id === courseId);

    return (
      <CoachAppLayout>
        <div className="min-h-screen bg-[color:var(--bg-primary)] p-6">
          <div className="max-w-7xl mx-auto">
            {/* Back Button & Header */}
            <div className="mb-6">
              <button
                onClick={() => navigate('/coach/quiz-reviews')}
                className="inline-flex items-center gap-2 text-text-secondary hover:text-brand-primary mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Courses
              </button>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                {selectedCourse?.title || 'Course Quiz Reviews'}
              </h1>
              <p className="text-text-secondary">Review student quiz submissions</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="glass-card rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <BookOpen className="w-5 h-5 text-text-muted" />
                </div>
                <p className="text-2xl font-bold text-text-primary">{stats.total}</p>
                <p className="text-sm text-text-secondary">Total Submissions</p>
              </div>
              <div className="glass-card rounded-xl p-4 bg-blue-50 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-blue-900">{stats.pending}</p>
                <p className="text-sm text-blue-700">Pending Review</p>
              </div>
              <div className="glass-card rounded-xl p-4 bg-green-50 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-900">{stats.passed}</p>
                <p className="text-sm text-green-700">Approved</p>
              </div>
            </div>

            {/* Filters */}
            <div className="glass-card rounded-xl p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Status Filter */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    <Filter className="w-4 h-4 inline mr-1" />
                    Status
                  </label>
                  <div className="relative">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as QuizSubmissionStatus | 'all')}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-text-primary appearance-none pr-10 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending_review">Pending Review</option>
                      <option value="passed">Passed</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" />
                  </div>
                </div>

                {/* Search */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    <Search className="w-4 h-4 inline mr-1" />
                    Search
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Student name or quiz..."
                      className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300 bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  </div>
                </div>
              </div>
            </div>

            {/* Submissions List */}
            {loadingSubmissions ? (
              <div className="glass-card rounded-xl p-8 text-center">
                <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-text-secondary">Loading submissions...</p>
              </div>
            ) : filteredSubmissions.length > 0 ? (
              <div className="space-y-4">
                {filteredSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="glass-card rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleReviewSubmission(submission.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Student Info */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-brand-neon to-brand-electric flex items-center justify-center text-white font-bold text-lg">
                            {submission.student_name?.charAt(0) || submission.student_email?.charAt(0) || 'S'}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-text-primary text-lg">
                              {submission.student_name || 'Unknown Student'}
                            </h3>
                            <p className="text-sm text-text-secondary">{submission.student_email}</p>
                          </div>
                        </div>

                        {/* Quiz Info */}
                        <div className="ml-15 pl-15">
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-text-muted" />
                              <span className="text-text-primary font-medium">{submission.quiz_title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-text-muted" />
                              <span className="text-text-secondary">
                                Submitted {new Date(submission.submitted_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            {submission.quiz_score !== undefined && submission.quiz_max_score !== undefined && (
                              <div className="flex items-center gap-2">
                                <span className="text-text-primary font-semibold">
                                  Score: {Math.round((submission.quiz_score / submission.quiz_max_score) * 100)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status & Action */}
                      <div className="flex flex-col items-end gap-2 ml-4">
                        {getStatusBadge(submission.status)}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReviewSubmission(submission.id);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-gradient-to-r from-brand-neon to-brand-electric text-white hover:shadow-lg transition-all"
                        >
                          <Eye className="w-4 h-4" />
                          {submission.status === 'pending_review' ? 'Review' : 'View'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card rounded-xl p-12 text-center">
                <Users className="w-16 h-16 text-text-muted mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-text-primary mb-2">No Submissions Found</h3>
                <p className="text-text-secondary">
                  No quiz submissions match your current filters.
                </p>
              </div>
            )}
          </div>
        </div>
      </CoachAppLayout>
    );
  }

  // ===================== VIEW: Course List =====================
  return (
    <CoachAppLayout>
      <div className="min-h-screen bg-[color:var(--bg-primary)] p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">Quiz Reviews</h1>
            <p className="text-text-secondary">
              Select a course to review student quiz submissions
            </p>
          </div>

          {/* Courses Grid */}
          {loadingCourses ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-text-secondary">Loading courses...</p>
            </div>
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="glass-card rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-brand-primary"
                  onClick={() => handleViewCourse(course.id)}
                >
                  {/* Course Icon & Title */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-neon to-brand-electric flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    {course.totalPending > 0 && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {course.totalPending} pending
                      </span>
                    )}
                  </div>

                  {/* Course Name */}
                  <h3 className="text-lg font-bold text-text-primary mb-3 line-clamp-2">
                    {course.title}
                  </h3>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mb-4 pt-4 border-t border-[color:var(--border-base)]">
                    <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                      <Users className="w-4 h-4" />
                      <span>{course.totalSubmissions} submissions</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewCourse(course.id);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm bg-gradient-to-r from-brand-neon to-brand-electric text-white hover:shadow-lg transition-all"
                  >
                    View Submissions
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-xl p-12 text-center">
              <BookOpen className="w-16 h-16 text-text-muted mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">No Courses Found</h3>
              <p className="text-text-secondary">
                You haven't created any courses yet. Create a course to start receiving quiz submissions.
              </p>
            </div>
          )}
        </div>
      </div>
    </CoachAppLayout>
  );
};

export default QuizReviewDashboard;
