import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import { useQuizSubmission, useQuizFeedback } from '../../hooks/useQuizSubmission';
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
  ExternalLink,
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

  // Fetch submission status
  const { submission, loading: submissionLoading } = useQuizSubmission(quizId);
  
  // Fetch feedback if submission exists
  const { feedback, loading: feedbackLoading } = useQuizFeedback(
    submission?.submission_id
  );

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
          <div className="relative group cursor-pointer" onClick={() => setSelectedMedia(media)}>
            <img
              src={media.url}
              alt={media.filename}
              className="w-full h-40 object-cover rounded-lg border border-gray-200"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center rounded-lg">
              <ImageIcon className="text-white opacity-0 group-hover:opacity-100 w-8 h-8" />
            </div>
            <p className="text-[10px] text-text-secondary mt-1 truncate">{media.filename}</p>
          </div>
        );
      case 'video':
        return (
          <div className="relative group cursor-pointer" onClick={() => setSelectedMedia(media)}>
            <video
              src={media.url}
              className="w-full h-40 object-cover rounded-lg border border-gray-200"
              muted
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors rounded-lg">
              <Play className="w-10 h-10 text-white" />
            </div>
            <p className="text-[10px] text-text-secondary mt-1 truncate">{media.filename}</p>
          </div>
        );
      case 'document':
        return (
          <a
            href={media.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center h-40 bg-gray-50 rounded-lg border border-gray-200 hover:border-brand-primary hover:bg-white transition-all group"
          >
            <FileText className="w-12 h-12 text-gray-400 group-hover:text-brand-primary mb-2 transition-colors" />
            <p className="text-xs font-medium text-text-primary px-3 text-center line-clamp-2">{media.filename}</p>
            <p className="text-[10px] text-text-secondary mt-1">
              {media.size ? `${(media.size / 1024).toFixed(1)} KB` : 'Open file'}
            </p>
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

          {/* Coach Feedback */}
          {feedbackLoading ? (
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-text-secondary">Loading feedback...</p>
            </div>
          ) : feedback.length > 0 ? (
            <div className="space-y-6 mb-6">
              <h2 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                <MessageSquare className="w-6 h-6" />
                Coach Feedback ({feedback.length})
              </h2>

              {feedback.map((fb, index) => (
                <div key={fb.id} className="glass-card rounded-2xl p-6">
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
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-text-primary whitespace-pre-wrap">{fb.comment}</p>
                    </div>
                  </div>

                  {/* Media Attachments */}
                  {fb.media_urls && fb.media_urls.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Attachments ({fb.media_urls.length})
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {fb.media_urls.map((media, mediaIndex) => (
                          <div key={mediaIndex}>
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
            <div className="glass-card rounded-2xl p-8 mb-6 text-center">
              <MessageSquare className="w-12 h-12 text-text-secondary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">No Feedback Yet</h3>
              <p className="text-text-secondary">
                {isPending
                  ? 'Your coach hasn\'t provided feedback yet. Check back later.'
                  : 'No detailed feedback has been provided for this submission.'}
              </p>
            </div>
          )}

          

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
      {selectedMedia && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <div className="relative max-w-5xl max-h-full" onClick={(e) => e.stopPropagation()}>
            {selectedMedia.type === 'image' && (
              <img
                src={selectedMedia.url}
                alt={selectedMedia.filename}
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              />
            )}
            {selectedMedia.type === 'video' && (
              <video
                src={selectedMedia.url}
                controls
                autoPlay
                className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
              />
            )}
            {selectedMedia.type === 'document' && (
              <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center">
                <FileText className="w-24 h-24 text-brand-primary mb-4" />
                <h3 className="text-xl font-bold text-text-primary mb-2">{selectedMedia.filename}</h3>
                <p className="text-text-secondary mb-6">
                  {selectedMedia.size ? `${(selectedMedia.size / 1024 / 1024).toFixed(2)} MB` : 'Size unknown'}
                </p>
                <a
                  href={selectedMedia.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold bg-brand-primary text-white hover:bg-brand-primary-dark transition-all"
                >
                  <ExternalLink className="w-5 h-5" />
                  Open Document
                </a>
              </div>
            )}
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-100 transition-colors shadow-xl"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </StudentAppLayout>
  );
};

export default QuizFeedbackView;
