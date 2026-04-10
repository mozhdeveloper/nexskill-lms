import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import QuestionFeedback from '../../components/quiz/QuestionFeedback';
import { supabase } from '../../lib/supabaseClient';
import { useQuizSubmission } from '../../hooks/useQuizSubmission';
import { Play, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'image-choice';
  questionText: string;
  options?: { id: string; label: string }[];
  correctOptionId?: string;
  correctAnswer?: boolean;
  explanation: string;
}

interface LocationState {
  score: number;
  correctCount: number;
  totalQuestions: number;
  passingScore: number;
  questions: Question[];
  userAnswers: Record<string, string | boolean>;
  attemptsRemaining: number | null;
  maxAttempts: number | null;
  timeLimitMinutes: number | null;
  lessonId?: string | null;
  requiresCoachApproval?: boolean;
}

const QuizResult: React.FC = () => {
  const navigate = useNavigate();
  const { courseId, quizId } = useParams();
  const location = useLocation();
  const state = location.state as LocationState;

  const [dbScore, setDbScore] = useState<number | null>(null);
  const [dbCorrect, setDbCorrect] = useState<number | null>(null);
  const [dbTotal, setDbTotal] = useState<number | null>(null);
  const [dbPassing, setDbPassing] = useState<number | null>(null);
  const [lessonId, setLessonId] = useState<string | null>(state?.lessonId ?? null);
  const [loadingDb, setLoadingDb] = useState(!state);
  const [requiresCoachApproval, setRequiresCoachApproval] = useState(
    state?.requiresCoachApproval ?? false
  );

  // Fetch submission status
  const { submission, loading: submissionLoading } = useQuizSubmission(quizId);

  // Fetch data from DB if no state (page refresh) OR if lessonId is missing OR if requiresCoachApproval is missing
  useEffect(() => {
    if (!quizId) return;

    const shouldFetch = !state || !lessonId || requiresCoachApproval === undefined;
    if (!shouldFetch) return;

    const fetchData = async () => {
      try {
        setLoadingDb(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch attempt data only if no state
        if (!state) {
          const { data: attempt } = await supabase
            .from('quiz_attempts')
            .select('score, max_score, passed')
            .eq('user_id', user.id)
            .eq('quiz_id', quizId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (attempt) {
            const pct = attempt.max_score > 0 ? Math.round((attempt.score / attempt.max_score) * 100) : 0;
            setDbScore(pct);
            setDbCorrect(attempt.score);
            setDbTotal(attempt.max_score);
          }
        }

        // Always fetch quiz data to get lesson_id if missing
        const { data: quiz } = await supabase
          .from('quizzes')
          .select('passing_score, lesson_id, requires_coach_approval')
          .eq('id', quizId)
          .single();
        if (quiz) {
          setDbPassing(quiz.passing_score || 70);
          setRequiresCoachApproval(quiz.requires_coach_approval || false);
          if (!lessonId) {
            setLessonId(quiz.lesson_id ?? null);
          }
        }
      } catch (err) {
        console.error('Error fetching quiz result:', err);
      } finally {
        setLoadingDb(false);
      }
    };
    fetchData();
  }, [quizId, state, lessonId]);

  const score = state?.score ?? dbScore ?? 0;
  const correctCount = state?.correctCount ?? dbCorrect ?? 0;
  const totalQuestions = state?.totalQuestions ?? dbTotal ?? 0;
  const passingScore = state?.passingScore ?? dbPassing ?? 70;
  const questions = state?.questions ?? [];
  const userAnswers = state?.userAnswers ?? {};
  const attemptsRemaining = state?.attemptsRemaining ?? null;
  const maxAttempts = state?.maxAttempts ?? null;
  const timeLimitMinutes = state?.timeLimitMinutes ?? null;

  const passed = score >= passingScore;
  const incorrectCount = totalQuestions - correctCount;

  // Calculate the next attempt number (completed attempts + 1)
  const completedAttempts = maxAttempts !== null && attemptsRemaining !== null
    ? maxAttempts - attemptsRemaining
    : null;
  const nextAttemptNumber = completedAttempts !== null ? completedAttempts + 1 : null;

  // Determine display status based on coach approval
  const displayStatus = requiresCoachApproval && submission
    ? submission.status
    : passed
    ? 'passed'
    : 'failed';

  const isPendingReview = displayStatus === 'pending_review';
  const isFailed = displayStatus === 'failed' || displayStatus === 'resubmission_required';
  const isPassed = displayStatus === 'passed';

  const handleRetry = () => {
    navigate(`/student/courses/${courseId}/quizzes/${quizId}/take`);
  };

  const handleBackToCourse = () => {
    if (lessonId) {
      navigate(`/student/courses/${courseId}/lessons/${lessonId}`);
    } else {
      navigate(`/student/courses/${courseId}`);
    }
  };

  const handleViewFeedback = () => {
    if (submission?.submission_id) {
      navigate(`/student/courses/${courseId}/quizzes/${quizId}/feedback`);
    }
  };

  // Generate feedback data for each question
  const feedbackData = questions.map((q) => {
    const userAnswer = userAnswers[q.id];
    let isCorrect = false;

    if (q.type === 'true-false') {
      isCorrect = userAnswer === q.correctAnswer;
    } else if (q.type === 'multiple-choice' || q.type === 'image-choice') {
      isCorrect = userAnswer === q.correctOptionId;
    }

    return {
      question: q,
      userAnswer: {
        optionId: typeof userAnswer === 'string' ? userAnswer : undefined,
        value: typeof userAnswer === 'boolean' ? userAnswer : undefined,
        isCorrect,
      },
    };
  });

  if (loadingDb || submissionLoading) {
    return (
      <StudentAppLayout>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Loading quiz result...</h2>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  return (
    <StudentAppLayout>
      <div className="min-h-screen bg-[color:var(--bg-primary)] py-8 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Score summary hero card */}
          <div className="glass-card rounded-3xl p-8 mb-8 text-center">
            <div className="mb-4">
              {isPendingReview ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4 bg-blue-100 text-blue-700">
                  <Clock className="w-4 h-4" />
                  Pending Coach Review
                </div>
              ) : isPassed ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4 bg-green-100 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  ✓ Passed & Approved
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-4 bg-orange-100 text-orange-700">
                  <XCircle className="w-4 h-4" />
                  ⚠ Needs Improvement
                </div>
              )}
            </div>

            <div className="mb-4">
              <div className="text-6xl font-bold text-text-primary mb-2">{score}%</div>
              <p className="text-lg text-text-secondary">
                You answered <span className="font-semibold text-text-primary">{correctCount}</span> out of{' '}
                <span className="font-semibold text-text-primary">{totalQuestions}</span> questions correctly.
              </p>
            </div>

            {/* Pending Review Alert */}
            {isPendingReview && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6 text-left">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">Quiz Submitted for Review</h3>
                    <p className="text-sm text-blue-800">
                      Your quiz has been submitted and is awaiting review by your coach. 
                      You'll be notified once they review it and provide feedback. 
                      The next lesson will be unlocked once your coach approves your submission.
                    </p>
                    {submission?.review_notes && (
                      <div className="mt-3 p-3 bg-white rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-1">Coach's Note:</p>
                        <p className="text-sm text-blue-800">{submission.review_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Breakdown */}
            <div className="flex justify-center gap-8 mb-6 pt-6 border-t border-[color:var(--border-base)]">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">{correctCount}</div>
                <div className="text-sm text-text-secondary">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-1">{incorrectCount}</div>
                <div className="text-sm text-text-secondary">Incorrect</div>
              </div>
              {timeLimitMinutes && (
                <div className="text-center">
                  <div className="text-3xl font-bold text-text-muted mb-1">{timeLimitMinutes}m</div>
                  <div className="text-sm text-text-secondary">Time Limit</div>
                </div>
              )}
              <div className="text-center">
                <div className="text-3xl font-bold text-text-muted mb-1">{passingScore}%</div>
                <div className="text-sm text-text-secondary">Passing Score</div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 justify-center flex-wrap">
              {isPendingReview ? (
                <>
                  {submission?.has_feedback && (
                    <button
                      onClick={handleViewFeedback}
                      className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all"
                    >
                      View Coach Feedback
                    </button>
                  )}
                  <button
                    onClick={handleBackToCourse}
                    className="px-8 py-3 rounded-full font-semibold text-brand-primary border-2 border-brand-primary hover:bg-brand-primary/5 transition-all"
                  >
                    Back to Course
                  </button>
                </>
              ) : isFailed ? (
                <>
                  {(attemptsRemaining === null || attemptsRemaining > 0) && (
                    <button
                      onClick={handleRetry}
                      className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold bg-gradient-to-r from-brand-neon to-brand-electric text-white shadow-lg hover:shadow-xl transition-all"
                    >
                      <Play className="w-5 h-5" />
                      Retry Quiz {attemptsRemaining === null ? '' : `(${attemptsRemaining} attempts left)`}
                    </button>
                  )}
                  {submission?.has_feedback && (
                    <button
                      onClick={handleViewFeedback}
                      className="px-8 py-3 rounded-full font-semibold text-blue-600 border-2 border-blue-600 hover:bg-blue-50 transition-all"
                    >
                      View Feedback
                    </button>
                  )}
                  <button
                    onClick={handleBackToCourse}
                    className="px-8 py-3 rounded-full font-semibold text-brand-primary border-2 border-brand-primary hover:bg-brand-primary/5 transition-all"
                  >
                    Back to lesson
                  </button>
                </>
              ) : (
                <>
                  {(attemptsRemaining === null || attemptsRemaining > 0) && (
                    <button
                      onClick={handleRetry}
                      className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold bg-gradient-to-r from-brand-neon to-brand-electric text-white shadow-lg hover:shadow-xl transition-all"
                    >
                      <Play className="w-5 h-5" />
                      Start Attempt {attemptsRemaining === null ? '∞' : nextAttemptNumber} of {maxAttempts ?? '∞'}
                    </button>
                  )}
                  <button
                    onClick={handleBackToCourse}
                    className="px-8 py-3 rounded-full font-semibold text-brand-primary border-2 border-brand-primary hover:bg-brand-primary/5 transition-all"
                  >
                    Back to lesson
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Detailed feedback section */}
          {!isPendingReview && questions.length > 0 && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-text-primary mb-2">Question-by-question feedback</h2>
                <p className="text-text-secondary">
                  Review your answers and learn from detailed explanations below.
                </p>
              </div>

              <div className="space-y-4">
                {feedbackData.map((item, index) => (
                  <div key={item.question.id}>
                    <div className="text-sm font-semibold text-text-muted mb-2">
                      Question {index + 1} of {totalQuestions}
                    </div>
                    <QuestionFeedback question={item.question} userAnswer={item.userAnswer} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom actions */}
          <div className="mt-8 text-center">
            <button
              onClick={handleBackToCourse}
              className="text-text-secondary hover:text-brand-primary font-medium transition-colors"
            >
              ← Return to lesson
            </button>
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default QuizResult;
