import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CoachAppLayout from '../../layouts/CoachAppLayout';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Send,
  Upload,
  Image as ImageIcon,
  Video,
  FileText,
  Trash2,
  AlertCircle,
  User,
  BookOpen,
  Clock,
  MessageSquare,
  ExternalLink,
  Play,
  RefreshCw,
} from 'lucide-react';
import type { QuizFeedbackMedia } from '../../types/quiz';

interface SubmissionData {
  id: string;
  user_id: string;
  quiz_id: string;
  status: 'pending_review' | 'passed' | 'failed' | 'resubmission_required';
  submitted_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
  student_name: string;
  student_email: string;
  quiz_title: string;
  quiz_score: number | null;
  quiz_max_score: number | null;
}

interface UploadedFile {
  url: string;
  name?: string;
  type?: string;
}

interface UploadedFilesData {
  type: 'files' | 'video';
  urls?: string[];
  url?: string;
  filename?: string;
}

interface QuizResponse {
  id: string;
  question_id: string;
  question_text: string;
  response_data: { answer: string | boolean | null; uploaded_files?: UploadedFilesData | null };
  points_earned: number;
  points_possible: number;
  is_correct: boolean;
  requires_grading: boolean;
}

const QuizReviewDetail: React.FC = () => {
  const navigate = useNavigate();
  const { courseId, submissionId } = useParams<{ courseId: string; submissionId: string }>();
  const { user } = useAuth();

  const [submission, setSubmission] = useState<SubmissionData | null>(null);
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Feedback form state
  const [feedbackComment, setFeedbackComment] = useState('');
  const [mediaFiles, setMediaFiles] = useState<QuizFeedbackMedia[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<QuizFeedbackMedia | null>(null);

  // Helper to extract text from question_content JSON
  const extractQuestionText = (questionContent: any): string => {
    if (!questionContent) return 'Untitled Question';
    const contentBlock = Array.isArray(questionContent)
      ? (questionContent[0] ?? {})
      : (questionContent ?? {});
    return (
      contentBlock?.text ||
      contentBlock?.content ||
      'Untitled Question'
    );
  };

  useEffect(() => {
    const fetchSubmission = async () => {
      if (!submissionId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch submission with student and quiz info
        const { data: subData, error: subError } = await supabase
          .from('quiz_submissions')
          .select(`
            *
          `)
          .eq('id', submissionId)
          .single();

        if (subError) throw subError;

        // Fetch quiz attempt scores separately (avoid inner join failure)
        let quizScore = null;
        let quizMaxScore = null;
        
        if (subData.quiz_attempt_id) {
          const { data: attemptData } = await supabase
            .from('quiz_attempts')
            .select('score, max_score')
            .eq('id', subData.quiz_attempt_id)
            .single();
          
          if (attemptData) {
            quizScore = attemptData.score;
            quizMaxScore = attemptData.max_score;
          }
        }

        // Fetch student profile
        const { data: studentProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('id', subData.user_id)
          .single();

        // Fetch quiz title
        const { data: quizData } = await supabase
          .from('quizzes')
          .select('title')
          .eq('id', subData.quiz_id)
          .single();

        const studentName = studentProfile
          ? `${studentProfile.first_name || ''} ${studentProfile.last_name || ''}`.trim()
          : 'Unknown Student';

        setSubmission({
          id: subData.id,
          user_id: subData.user_id,
          quiz_id: subData.quiz_id,
          status: subData.status,
          submitted_at: subData.submitted_at,
          reviewed_at: subData.reviewed_at,
          review_notes: subData.review_notes,
          student_name: studentName,
          student_email: studentProfile?.email || 'Unknown',
          quiz_title: quizData?.title || 'Unknown Quiz',
          quiz_score: quizScore,
          quiz_max_score: quizMaxScore,
        });

        // Fetch quiz responses (use left join to handle missing questions)
        const { data: responseData, error: respError } = await supabase
          .from('quiz_responses')
          .select(`
            *,
            quiz_questions(
              question_content
            )
          `)
          .eq('attempt_id', subData.quiz_attempt_id);

        if (respError) throw respError;

        const mappedResponses: QuizResponse[] = (responseData || []).map((r: any) => ({
          id: r.id,
          question_id: r.question_id,
          question_text: r.quiz_questions?.question_content 
            ? extractQuestionText(r.quiz_questions.question_content)
            : 'Question not found',
          response_data: r.response_data,
          points_earned: r.points_earned,
          points_possible: r.points_possible,
          is_correct: r.is_correct,
          requires_grading: r.requires_grading || false,
        }));

        setResponses(mappedResponses);
      } catch (err: any) {
        console.error('Error fetching submission:', err);
        setError(err.message || 'Failed to fetch submission data');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [submissionId]);

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'document') => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const tempId = Math.random().toString(36).substring(7);
        
        setUploadingFiles(prev => new Set(prev).add(tempId));

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `feedback/${submissionId}/${fileName}`;

        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from('quiz-feedback')
          .upload(filePath, file);

        if (uploadError) {
          setUploadingFiles(prev => {
            const next = new Set(prev);
            next.delete(tempId);
            return next;
          });
          throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('quiz-feedback')
          .getPublicUrl(filePath);

        if (urlData?.publicUrl) {
          setMediaFiles((prev) => [
            ...prev,
            {
              url: urlData.publicUrl,
              type,
              filename: file.name,
              size: file.size,
            },
          ]);
        }
        
        setUploadingFiles(prev => {
          const next = new Set(prev);
          next.delete(tempId);
          return next;
        });
      }
    } catch (err: any) {
      console.error('Error uploading media:', err);
      setError(`Failed to upload media: ${err.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const removeMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReviewSubmit = useCallback(async (status: 'passed' | 'failed' | 'resubmission_required') => {
    if (!user || !submission) return;

    if (uploadingFiles.size > 0) {
      setError('Please wait for all files to finish uploading before submitting.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Update submission status
      const { error: updateError } = await supabase
        .from('quiz_submissions')
        .update({
          status,
          review_notes: feedbackComment || submission.review_notes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          student_read_at: null, // Reset read status for NEW notification
          updated_at: new Date().toISOString(),
        })
        .eq('id', submission.id);

      if (updateError) throw updateError;

      // If approved (passed), unlock the next lesson for the student
      if (status === 'passed') {
        console.log('🔓 Coach approved quiz — unlocking next lesson for student');
        const { error: unlockErr } = await supabase
          .rpc('unlock_next_lesson', {
            p_user_id: submission.user_id,
            p_quiz_id: submission.quiz_id,
          });

        if (unlockErr) {
          console.error('⚠️ Failed to unlock next lesson:', unlockErr);
          // Don't throw error - the review was still successful
        } else {
          console.log('✅ Next lesson unlocked successfully for student');
        }
      }

      // Create feedback record if there's a comment or media
      if (feedbackComment || mediaFiles.length > 0) {
        const { error: feedbackError } = await supabase
          .from('quiz_feedback')
          .insert({
            quiz_submission_id: submission.id,
            coach_id: user.id,
            comment: feedbackComment,
            media_urls: mediaFiles,
            is_resubmission_feedback: submission.status !== 'pending_review',
          });

        if (feedbackError) throw feedbackError;
      }

      let successMsg = '';
      if (status === 'passed') successMsg = 'Quiz approved! The next lesson has been unlocked for the student.';
      else if (status === 'resubmission_required') successMsg = 'Resubmission requested. The student will be notified.';
      else successMsg = 'Quiz marked as failed. Feedback has been sent.';

      setSuccess(successMsg);

      // Navigate back after delay
      setTimeout(() => {
        navigate(`/coach/courses/${courseId}/quiz-reviews`);
      }, 2000);
    } catch (err: any) {
      console.error('Error submitting review:', err);
      setError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  }, [user, submission, feedbackComment, mediaFiles, courseId, navigate, uploadingFiles.size]);

  const renderMediaPreview = (media: QuizFeedbackMedia, index: number) => {
    return (
      <div key={index} className="relative group cursor-pointer" onClick={() => setSelectedMedia(media)}>
        {media.type === 'image' && (
          <img
            src={media.url}
            alt={media.filename}
            className="w-full h-32 object-cover rounded-lg border border-gray-200"
          />
        )}
        {media.type === 'video' && (
          <div className="relative">
            <video
              src={media.url}
              className="w-full h-32 object-cover rounded-lg border border-gray-200"
              muted
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg group-hover:bg-black/40 transition-colors">
              <Play className="w-8 h-8 text-white" />
            </div>
          </div>
        )}
        {media.type === 'document' && (
          <div className="w-full h-32 flex flex-col items-center justify-center bg-gray-100 rounded-lg border border-gray-200">
            <FileText className="w-10 h-10 text-gray-400 mb-2" />
            <span className="text-[10px] text-text-secondary px-2 text-center truncate w-full">
              {media.filename}
            </span>
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeMedia(index);
          }}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-2 py-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity truncate">
          {media.filename}
        </div>
      </div>
    );
  };

  const renderStudentUploads = (response: QuizResponse, index: number) => {
    const uploadedFiles = response.response_data?.uploaded_files;
    if (!uploadedFiles) return null;

    if (uploadedFiles.type === 'files' && uploadedFiles.urls) {
      return (
        <div className="mt-3 p-3 bg-white/50 rounded-lg">
          <p className="text-xs font-medium text-text-primary mb-2 flex items-center gap-1">
            <Upload className="w-3 h-3" />
            Student uploaded {uploadedFiles.urls.length} file(s):
          </p>
          <div className="space-y-1.5">
            {uploadedFiles.urls.map((url: string, i: number) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-brand-primary hover:text-brand-primary-dark transition-colors"
              >
                <FileText className="w-3 h-3" />
                <span className="truncate">File {i + 1}</span>
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            ))}
          </div>
        </div>
      );
    }

    if (uploadedFiles.type === 'video' && uploadedFiles.url) {
      return (
        <div className="mt-3 p-3 bg-white/50 rounded-lg">
          <p className="text-xs font-medium text-text-primary mb-2 flex items-center gap-1">
            <Video className="w-3 h-3" />
            Student submitted a video{uploadedFiles.filename ? `: ${uploadedFiles.filename}` : ''}:
          </p>
          <div className="relative rounded-lg overflow-hidden bg-black">
            <video
              src={uploadedFiles.url}
              controls
              className="w-full max-h-64 object-contain"
            />
          </div>
          <a
            href={uploadedFiles.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-brand-primary hover:text-brand-primary-dark transition-colors mt-2"
          >
            <Play className="w-3 h-3" />
            <span>Open video in new tab</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <CoachAppLayout>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Loading submission...</h2>
          </div>
        </div>
      </CoachAppLayout>
    );
  }

  if (!submission) {
    return (
      <CoachAppLayout>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-text-secondary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-text-primary mb-2">Submission Not Found</h2>
            <button
              onClick={() => navigate(`/coach/courses/${courseId}/quiz-reviews`)}
              className="px-6 py-3 rounded-full font-semibold text-brand-primary border-2 border-brand-primary hover:bg-brand-primary/5 transition-all"
            >
              Back to Reviews
            </button>
          </div>
        </div>
      </CoachAppLayout>
    );
  }

  const scorePercent = submission.quiz_max_score && submission.quiz_score !== null
    ? Math.round((submission.quiz_score / submission.quiz_max_score) * 100)
    : 0;

  return (
    <CoachAppLayout>
      <div className="min-h-screen bg-[color:var(--bg-primary)] p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate(`/coach/courses/${courseId}/quiz-reviews`)}
              className="inline-flex items-center gap-2 text-text-secondary hover:text-brand-primary mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Reviews
            </button>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Review Submission</h1>
            <p className="text-text-secondary">{submission.quiz_title}</p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-green-800">{success}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Student Info & Responses */}
            <div className="lg:col-span-2 space-y-6">
              {/* Student Info Card */}
              <div className="glass-card rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-brand-neon to-brand-electric flex items-center justify-center text-white font-bold text-2xl">
                    {submission.student_name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-text-primary mb-1">{submission.student_name}</h2>
                    <p className="text-text-secondary mb-3">{submission.student_email}</p>
                    <div className="flex items-center gap-6 text-sm">
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
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-text-muted" />
                        <span className="text-text-primary font-semibold">
                          Score: {scorePercent}% ({submission.quiz_score}/{submission.quiz_max_score})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quiz Responses */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-xl font-bold text-text-primary mb-4">Quiz Responses ({responses.length})</h3>
                {responses.length > 0 ? (
                  <div className="space-y-4">
                    {responses.map((response, index) => (
                      <div
                        key={response.id}
                        className={`p-4 rounded-lg border-2 ${
                          response.requires_grading
                            ? 'bg-blue-50 border-blue-200'
                            : response.is_correct
                            ? 'bg-green-50 border-green-200'
                            : 'bg-orange-50 border-orange-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-text-primary flex-1">
                            Q{index + 1}: {response.question_text}
                          </h4>
                          {response.requires_grading ? (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full flex items-center gap-1">
                              <Upload className="w-3 h-3" />
                              Needs Grading
                            </span>
                          ) : response.is_correct ? (
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
                          ) : (
                            <XCircle className="w-5 h-5 text-orange-600 flex-shrink-0 ml-2" />
                          )}
                        </div>
                        <p className="text-sm text-text-secondary mb-2">
                          Student answer: <span className="font-medium text-text-primary">
                            {typeof response.response_data.answer === 'boolean'
                              ? response.response_data.answer
                                ? 'True'
                                : 'False'
                              : response.response_data.answer || 'No answer'}
                          </span>
                        </p>
                        <p className="text-sm font-medium text-text-primary">
                          Points: {response.points_earned}/{response.points_possible}
                        </p>
                        {/* Render uploaded files/videos */}
                        {renderStudentUploads(response, index)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-text-secondary text-center py-8">
                    No responses found for this attempt.
                  </p>
                )}
              </div>
            </div>

            {/* Right Column - Feedback Form */}
            <div className="space-y-6">
              {/* Review Actions */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-lg font-bold text-text-primary mb-4">Review Decision</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => handleReviewSubmit('passed')}
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {submitting ? 'Processing...' : 'Approve & Unlock Next Lesson'}
                  </button>
                  
                  <button
                    onClick={() => handleReviewSubmit('resubmission_required')}
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className="w-5 h-5" />
                    {submitting ? 'Processing...' : 'Request Resubmission'}
                  </button>

                  <button
                    onClick={() => handleReviewSubmit('failed')}
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle className="w-5 h-5" />
                    {submitting ? 'Processing...' : 'Mark as Failed'}
                  </button>
                </div>
              </div>

              {/* Feedback Form */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Feedback for Student
                </h3>

                {/* Comment */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Comments & Suggestions
                  </label>
                  <textarea
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Provide constructive feedback, highlight areas for improvement, or congratulate the student..."
                    rows={6}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
                  />
                </div>

                  {/* Media Upload */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Attachments (Optional)
                    </label>
                    <div className="flex gap-2 mb-3">
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => handleMediaUpload(e, 'image')}
                          disabled={uploading}
                          className="hidden"
                        />
                        <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-gray-300 hover:border-brand-primary transition-colors disabled:opacity-50">
                          <ImageIcon className="w-4 h-4" />
                          <span className="text-sm">Image</span>
                        </div>
                      </label>
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          accept="video/*"
                          multiple
                          onChange={(e) => handleMediaUpload(e, 'video')}
                          disabled={uploading}
                          className="hidden"
                        />
                        <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-gray-300 hover:border-brand-primary transition-colors disabled:opacity-50">
                          <Video className="w-4 h-4" />
                          <span className="text-sm">Video</span>
                        </div>
                      </label>
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          multiple
                          onChange={(e) => handleMediaUpload(e, 'document')}
                          disabled={uploading}
                          className="hidden"
                        />
                        <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-gray-300 hover:border-brand-primary transition-colors disabled:opacity-50">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm">Doc</span>
                        </div>
                      </label>
                    </div>

                    {/* Uploading Status */}
                    {uploadingFiles.size > 0 && (
                      <div className="mb-3 flex items-center gap-2 text-sm text-brand-primary animate-pulse">
                        <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                        <span>Uploading {uploadingFiles.size} file(s)...</span>
                      </div>
                    )}

                    {/* Uploaded Media Preview */}
                    {mediaFiles.length > 0 && (
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        {mediaFiles.map((media, index) => renderMediaPreview(media, index))}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-text-secondary">
                    Your feedback will be visible to the student and help them improve their understanding.
                  </p>
                </div>
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
    </CoachAppLayout>
  );
};

export default QuizReviewDetail;
