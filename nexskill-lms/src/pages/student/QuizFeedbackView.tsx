import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import { useQuizSubmission, useAllQuizFeedback } from '../../hooks/useQuizSubmission';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  Image as ImageIcon,
  FileText,
  Video,
  AlertCircle,
  MessageSquare,
  History,
} from 'lucide-react';
import type { QuizFeedbackMedia } from '../../types/quiz';

interface QuizData {
  id: string;
  title: string;
  lesson_id: string | null;
  requires_coach_approval: boolean;
}

const QuizFeedbackView: React.FC = () => {
  const navigate = useNavigate();
  const { courseId, quizId } = useParams<{ courseId: string; quizId: string }>();
  const { user } = useAuth();
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<QuizFeedbackMedia | null>(null);

  // Fetch submission status (latest)
  const { submission, loading: submissionLoading } = useQuizSubmission(quizId);
  
  // Fetch ALL feedback for this quiz (history)
  const { feedback, loading: feedbackLoading } = useAllQuizFeedback(quizId);

  useEffect(() => {
    const markAsRead = async () => {
      if (submission && !submission.student_read_at && submission.status !== 'pending_review') {
        try {
          await supabase
            .from('quiz_submissions')
            .update({ student_read_at: new Date().toISOString() })
            .eq('id', submission.submission_id);
        } catch (err) {
          console.error('Error marking submission as read:', err);
        }
      }
    };

    if (!submissionLoading) {
      markAsRead();
    }
  }, [submission, submissionLoading]);

  useEffect(() => {
    const fetchQuizData = async () => {
      if (!quizId) return;
      
      try {
        const { data, error } = await supabase
          .from('quizzes')
          .select('id, title, lesson_id, requires_coach_approval')
          .eq('id', quizId)
          .single();

        if (error) throw error;
        setQuizData(data);
      } catch (err) {
        console.error('Error fetching quiz data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [quizId]);

  const handleBackToResult = () => {
    navigate(`/student/courses/${courseId}/quizzes/${quizId}/result`);
  };

  const handleBackToCourse = () => {
    if (quizData?.lesson_id) {
      navigate(`/student/courses/${courseId}/lessons/${quizData.lesson_id}`);
    } else {
      navigate(`/student/courses/${courseId}`);
    }
  };

  const handleRetakeQuiz = () => {
    navigate(`/student/courses/${courseId}/quizzes/${quizId}/take`);
  };

  const handleContinueToNext = () => {
    if (quizData?.lesson_id) {
      navigate(`/student/courses/${courseId}/lessons/${quizData.lesson_id}`);
    } else {
      navigate(`/student/courses/${courseId}`);
    }
  };

  const renderMediaIcon = (media: QuizFeedbackMedia) => {
    switch (media.type) {
      case 'image':
        return <ImageIcon className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'document':
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const renderMediaPreview = (media: QuizFeedbackMedia) => {
    switch (media.type) {
      case 'image':
        return (
          <img
            src={media.url}
            alt={media.filename}
            className="w-full h-auto rounded-lg"
            onClick={() => setSelectedMedia(media)}
          />
        );
      case 'video':
        return (
          <video
            src={media.url}
            controls
            className="w-full rounded-lg"
            style={{ maxHeight: '400px' }}
          />
        );
      case 'document':
        return (
          <a
            href={media.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
          >
            <FileText className="w-8 h-8 text-blue-600" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{media.filename}</p>
              <p className="text-sm text-gray-500">
                {media.size ? `${(media.size / 1024).toFixed(1)} KB` : 'Open file'}
              </p>
            </div>
          </a>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    if (!submission) return null;

    switch (submission.status) {
      case 'pending_review':
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
            <Clock className="w-4 h-4" />
            Pending Review
          </div>
        );
      case 'passed':
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-700">
            <CheckCircle className="w-4 h-4" />
            Passed
          </div>
        );
      case 'failed':
      case 'resubmission_required':
        return (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-orange-100 text-orange-700">
            <XCircle className="w-4 h-4" />
            Needs Improvement
          </div>
        );
      default:
        return null;
    }
  };

  if (loading || submissionLoading) {
    return (
      <StudentAppLayout>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Loading feedback...</h2>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  if (!quizData || !submission) {
    return (
      <StudentAppLayout>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-text-secondary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-text-primary mb-2">No Feedback Available</h2>
            <p className="text-text-secondary mb-4">
              {submissionLoading
                ? 'Loading submission status...'
                : 'No feedback has been provided for this quiz yet.'}
            </p>
            <button
              onClick={handleBackToCourse}
              className="px-6 py-3 rounded-full font-semibold text-brand-primary border-2 border-brand-primary hover:bg-brand-primary/5 transition-all"
            >
              Back to Course
            </button>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  const isPassed = submission.status === 'passed';
  const isFailed = submission.status === 'failed' || submission.status === 'resubmission_required';
  const isPending = submission.status === 'pending_review';

  return (
    <StudentAppLayout>
      <div className="min-h-screen bg-[color:var(--bg-primary)] py-8 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={handleBackToResult}
              className="inline-flex items-center gap-2 text-text-secondary hover:text-brand-primary mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Quiz Result
            </button>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Coach Feedback: {quizData.title}
            </h1>
            <div className="flex items-center gap-3">
              {getStatusBadge()}
              {submission.submitted_at && (
                <span className="text-sm text-text-secondary">
                  Submitted {new Date(submission.submitted_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Pending Review Alert */}
          {isPending && (
            <div className="glass-card rounded-2xl p-6 mb-6 bg-blue-50 border-2 border-blue-200">
              <div className="flex items-start gap-3">
                <Clock className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Awaiting Coach Review</h3>
                  <p className="text-sm text-blue-800">
                    Your quiz submission is waiting for coach review. You'll be notified once your coach 
                    provides feedback and approves your submission.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Failed/Resubmission Alert */}
          {isFailed && (
            <div className="glass-card rounded-2xl p-6 mb-6 bg-orange-50 border-2 border-orange-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-orange-900 mb-1">Review the Feedback and Retry</h3>
                  <p className="text-sm text-orange-800">
                    Your coach has provided feedback on your submission. Review the comments and suggestions 
                    below, then retake the quiz when you're ready.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Passed Alert */}
          {isPassed && (
            <div className="glass-card rounded-2xl p-6 mb-6 bg-green-50 border-2 border-green-200">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-1">Congratulations! Quiz Approved</h3>
                  <p className="text-sm text-green-800">
                    Your coach has approved this quiz. You can now continue to the next lesson!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Coach Feedback History */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2 mb-6">
              <History className="w-6 h-6" />
              Feedback History {feedback.length > 0 && `(${feedback.length})`}
            </h2>

            {feedbackLoading ? (
              <div className="glass-card rounded-2xl p-6 text-center">
                <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-text-secondary">Loading feedback...</p>
              </div>
            ) : feedback.length > 0 ? (
              <div className="space-y-6">
                {feedback.map((fb, index) => (
                  <div 
                    key={fb.id} 
                    className={`glass-card rounded-2xl p-6 relative ${
                      index === 0 ? 'border-l-4 border-brand-neon' : ''
                    }`}
                  >
                    {index === 0 && (
                      <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-brand-neon text-white text-[10px] font-bold uppercase tracking-wider">
                        Latest Feedback
                      </div>
                    )}
                    
                    {/* Feedback Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-brand-neon to-brand-electric flex items-center justify-center text-white font-bold">
                          C
                        </div>
                        <div>
                          <p className="font-semibold text-text-primary">Your Coach</p>
                          <p className="text-sm text-text-secondary">
                            {new Date(fb.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      {fb.is_resubmission_feedback && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                          Resubmission Feedback
                        </span>
                      )}
                    </div>

                    {/* Comment */}
                    <div className="prose prose-sm max-w-none mb-6">
                      <div className="bg-white/50 rounded-xl p-4 border border-gray-100">
                        <p className="text-text-primary whitespace-pre-wrap leading-relaxed">{fb.comment}</p>
                      </div>
                    </div>

                    {/* Media Attachments */}
                    {fb.media_urls && fb.media_urls.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-text-primary mb-3 flex items-center gap-2 text-sm">
                          <FileText className="w-4 h-4" />
                          Attachments ({fb.media_urls.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {fb.media_urls.map((media, mediaIndex) => (
                            <div key={mediaIndex} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                              {renderMediaPreview(media)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-8 text-center">
                <MessageSquare className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-text-primary mb-2">No Feedback Yet</h3>
                <p className="text-text-secondary">
                  {isPending
                    ? 'Your coach hasn\'t provided feedback yet. Check back later.'
                    : 'No detailed feedback has been provided for this submission.'}
                </p>
              </div>
            )}
          </div>

          

          {/* Action Buttons */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">What would you like to do?</h3>
            <div className="flex flex-wrap gap-3">
              {isFailed && (
                <button
                  onClick={handleRetakeQuiz}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold bg-gradient-to-r from-brand-neon to-brand-electric text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <Play className="w-5 h-5" />
                  Retake Quiz
                </button>
              )}
              
              {isPassed && (
                <button
                  onClick={handleContinueToNext}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <CheckCircle className="w-5 h-5" />
                  Continue to Next Lesson
                </button>
              )}

              <button
                onClick={handleBackToCourse}
                className="px-6 py-3 rounded-full font-semibold text-brand-primary border-2 border-brand-primary hover:bg-brand-primary/5 transition-all"
              >
                Back to Course
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Media Preview Modal */}
      {selectedMedia && selectedMedia.type === 'image' && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <div className="relative max-w-5xl max-h-full">
            <img
              src={selectedMedia.url}
              alt={selectedMedia.filename}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
            >
              <XCircle className="w-6 h-6 text-gray-900" />
            </button>
          </div>
        </div>
      )}
    </StudentAppLayout>
  );
};

export default QuizFeedbackView;
