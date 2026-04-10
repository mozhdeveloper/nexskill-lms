import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CoachAppLayout from '../../layouts/CoachAppLayout';
import { useCoachQuizSubmissions } from '../../hooks/useQuizSubmission';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  ChevronDown,
  Eye,
  Users,
  BookOpen,
} from 'lucide-react';
import type { QuizSubmissionStatus } from '../../types/quiz';

interface CourseOption {
  id: string;
  title: string;
}

const QuizReviewDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<QuizSubmissionStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  // Fetch submissions for selected course
  const { submissions, loading, refetch } = useCoachQuizSubmissions(
    selectedCourseId || undefined
  );

  // Fetch coach's courses
  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('id, title')
          .eq('coach_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCourses(data || []);
        
        // Auto-select first course if available
        if (data && data.length > 0 && !selectedCourseId) {
          setSelectedCourseId(data[0].id);
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, [user]);

  // Refetch when course changes
  useEffect(() => {
    if (selectedCourseId) {
      refetch();
    }
  }, [selectedCourseId, refetch]);

  const handleReviewSubmission = (submissionId: string) => {
    navigate(`/coach/courses/${selectedCourseId}/quiz-reviews/${submissionId}`);
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
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
            <XCircle className="w-3 h-3" />
            Failed
          </span>
        );
      case 'resubmission_required':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
            <AlertCircle className="w-3 h-3" />
            Resubmission
          </span>
        );
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    // Filter by status
    if (filterStatus !== 'all' && sub.status !== filterStatus) {
      return false;
    }

    // Filter by search
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
    failed: submissions.filter((s) => s.status === 'failed' || s.status === 'resubmission_required').length,
  };

  return (
    <CoachAppLayout>
      <div className="min-h-screen bg-[color:var(--bg-primary)] p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">Quiz Reviews</h1>
            <p className="text-text-secondary">
              Review student quiz submissions and provide feedback
            </p>
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
            <div className="glass-card rounded-xl p-4 bg-orange-50 border border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <XCircle className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-900">{stats.failed}</p>
              <p className="text-sm text-orange-700">Needs Work</p>
            </div>
          </div>

          {/* Filters */}
          <div className="glass-card rounded-xl p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Course Selector */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  <BookOpen className="w-4 h-4 inline mr-1" />
                  Course
                </label>
                {loadingCourses ? (
                  <div className="w-full px-4 py-2 rounded-lg bg-gray-100 animate-pulse">Loading...</div>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedCourseId}
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-text-primary appearance-none pr-10 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    >
                      <option value="">Select a course</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted pointer-events-none" />
                  </div>
                )}
              </div>

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
                    <option value="failed">Failed</option>
                    <option value="resubmission_required">Resubmission Required</option>
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
          {loading ? (
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
                        </div>
                        {submission.review_notes && (
                          <p className="mt-2 text-sm text-text-secondary line-clamp-2">
                            {submission.review_notes}
                          </p>
                        )}
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
                {selectedCourseId
                  ? 'No quiz submissions match your current filters.'
                  : 'Select a course to view quiz submissions.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </CoachAppLayout>
  );
};

export default QuizReviewDashboard;
