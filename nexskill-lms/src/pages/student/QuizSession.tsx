import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import QuestionProgressBar from '../../components/quiz/QuestionProgressBar';
import QuestionMultipleChoice from '../../components/quiz/QuestionMultipleChoice';
import QuestionTrueFalse from '../../components/quiz/QuestionTrueFalse';
import QuestionImageChoice from '../../components/quiz/QuestionImageChoice';
import QuestionFileUpload from '../../components/quiz/QuestionFileUpload';
import QuestionVideoSubmission from '../../components/quiz/QuestionVideoSubmission';
import QuizAttemptHistory, { type PreviousAttempt } from '../../components/quiz/QuizAttemptHistory';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useQuizSubmission, checkQuizAttemptPermission } from '../../hooks/useQuizSubmission';
import {
  Trophy,
  AlertCircle,
  Play,
  Calendar,
  Lock,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  MessageSquare,
} from 'lucide-react';

// ============================================
// Type Definitions
// ============================================

interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'image-choice' | 'file-upload' | 'video-submission';
  questionText: string;
  options?: { id: string; label: string; helperText?: string; imageUrl?: string }[];
  correctOptionId?: string;
  correctAnswer?: boolean;
  explanation: string;
  points: number;
  requires_manual_grading?: boolean;
  answerConfig?: {
    accepted_file_types?: string[];
    max_file_size_mb?: number;
    max_files?: number;
    instructions?: string;
    max_duration_minutes?: number;
    accepted_formats?: string[];
  };
}

interface QuizMeta {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  passing_score: number;
  time_limit_minutes: number | null;
  max_attempts: number | null;
  available_from: string | null;
  due_date: string | null;
  late_submission_allowed: boolean;
  late_penalty_percent: number;
  is_published: boolean;
  requires_manual_grading: boolean;
  requires_coach_approval?: boolean;
  lesson_id: string | null;
}

interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  attempt_number: number;
  status: 'in_progress' | 'submitted' | 'graded';
  score: number | null;
  max_score: number | null;
  passed: boolean | null;
  started_at: string;
  submitted_at: string | null;
  graded_at: string | null;
  requires_manual_grading?: boolean;
}

interface QuizResponse {
  id: string;
  attempt_id: string;
  question_id: string;
  response_data: { answer: string | boolean | null };
  points_earned: number;
  points_possible: number;
  is_correct: boolean;
}

interface PreviousResponseWithQuestion {
  id: string;
  question_id: string;
  question_text: string;
  question_type: string;
  response_data: { answer: string | boolean | null };
  points_earned: number;
  points_possible: number;
  is_correct: boolean;
}

type QuizSessionState =
  | 'loading'
  | 'start_screen'
  | 'pending_review'
  | 'not_published'
  | 'not_available'
  | 'closed'
  | 'no_attempts_remaining'
  | 'show_history'
  | 'resume_or_restart'
  | 'in_progress';

// ============================================
// Helper Functions (outside component for perf)
// ============================================

const mapQuestionType = (dbType: string): 'multiple-choice' | 'true-false' | 'image-choice' | 'file-upload' | 'video-submission' => {
  switch (dbType) {
    case 'true_false': return 'true-false';
    case 'image_choice': return 'image-choice';
    case 'file_upload': return 'file-upload';
    case 'video_submission': return 'video-submission';
    default: return 'multiple-choice';
  }
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const stripHtml = (html: string): string => {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
};

const extractQuestionText = (content: any): string => {
  if (!content) return 'Untitled Question';
  const contentBlock = Array.isArray(content) ? (content[0] ?? {}) : (content ?? {});
  return contentBlock?.text || contentBlock?.content || 'Untitled Question';
};

const mapQuizQuestions = (rows: Record<string, unknown>[]): QuizQuestion[] => {
  return rows.map((r) => {
    const rawContent = r.question_content;
    const contentBlock: Record<string, unknown> = Array.isArray(rawContent)
      ? ((rawContent[0] as Record<string, unknown>) ?? {})
      : ((rawContent as Record<string, unknown>) ?? {});
    const answerConfig = r.answer_config as Record<string, unknown> | null;
    const type = mapQuestionType(r.question_type as string);

    const rawQuestionText =
      (contentBlock?.text as string) ||
      (contentBlock?.content as string) ||
      (answerConfig?.question_text as string) ||
      (answerConfig?.questionText as string) ||
      (r.question_text as string) ||
      '';

    let options = (contentBlock?.options as QuizQuestion['options']) || undefined;
    if (!options && Array.isArray(answerConfig?.options)) {
      options = (answerConfig!.options as any[]).map((o: any) => ({
        id: o.id as string,
        label: (o.text || o.label || '') as string,
      }));
    }

    let correctOptionId = (answerConfig?.correctOptionId as string) || undefined;
    if (!correctOptionId && Array.isArray(answerConfig?.options)) {
      const correctOpt = (answerConfig!.options as any[]).find((o: any) => o.is_correct);
      if (correctOpt) correctOptionId = correctOpt.id as string;
    }

    const correctAnswer =
      (answerConfig?.correctAnswer as boolean | undefined) ??
      (answerConfig?.correct_answer as boolean | undefined);

    return {
      id: r.id as string,
      type,
      questionText: stripHtml(rawQuestionText),
      options,
      correctOptionId,
      correctAnswer,
      explanation: (answerConfig?.explanation as string) || '',
      points: (r.points as number) || 1,
      requires_manual_grading: (r.requires_manual_grading as boolean) || false,
      answerConfig: answerConfig ? {
        accepted_file_types: (answerConfig.accepted_file_types as string[]) || ['pdf', 'docx', 'txt'],
        max_file_size_mb: (answerConfig.max_file_size_mb as number) || 10,
        max_files: (answerConfig.max_files as number) || 1,
        instructions: (answerConfig.instructions as string) || '',
        max_duration_minutes: (answerConfig.max_duration_minutes as number) || 5,
        accepted_formats: (answerConfig.accepted_formats as string[]) || ['mp4', 'mov', 'avi', 'webm'],
      } : undefined,
    };
  });
};

// ============================================
// Main Component
// ============================================

const QuizSession: React.FC = () => {
  const navigate = useNavigate();
  const { courseId, quizId } = useParams();
  const { user } = useAuth();

  // Quiz state
  const [quizMeta, setQuizMeta] = useState<QuizMeta | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [sessionState, setSessionState] = useState<QuizSessionState>('loading');

  // Attempt state
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null>(null);
  const [previousAttempts, setPreviousAttempts] = useState<PreviousAttempt[]>([]);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);

  // Quiz taking state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | boolean>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isLateSubmission, setIsLateSubmission] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Resume dialog state
  const [showResumeDialog, setShowResumeDialog] = useState(false);

  // File/Video upload state
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({});
  const [uploadedVideos, setUploadedVideos] = useState<Record<string, File | null>>({});
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);

  // Previous submission responses for pending review view
  const [previousResponses, setPreviousResponses] = useState<PreviousResponseWithQuestion[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch submission status for pending review check
  const { submission, loading: submissionLoading } = useQuizSubmission(quizId);

  // ============================================
  // Fetch Quiz Data (Optimized - Parallel Queries)
  // ============================================

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId || !user) return;

      try {
        // Fetch quiz first
        const { data: quiz, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .maybeSingle();

        if (quizError) {
          console.error('Error fetching quiz:', quizError);
          setSessionState('not_published');
          return;
        }

        if (!quiz) {
          console.warn('Quiz not found:', quizId);
          setSessionState('not_published');
          return;
        }

        // Fetch course approval status via lesson_id or module_content_items
        let courseIsApproved = true;

        if (quiz.lesson_id) {
          const { data: lessonData } = await supabase
            .from('lessons')
            .select('course_id')
            .eq('id', quiz.lesson_id)
            .single();

          if (lessonData?.course_id) {
            const { data: courseData } = await supabase
              .from('courses')
              .select('verification_status')
              .eq('id', lessonData.course_id)
              .single();

            courseIsApproved = courseData?.verification_status === 'approved';
          }
        } else {
          const { data: contentItem } = await supabase
            .from('module_content_items')
            .select('module_id')
            .eq('content_id', quizId)
            .eq('content_type', 'quiz')
            .single();

          if (contentItem?.module_id) {
            const { data: moduleData } = await supabase
              .from('modules')
              .select('course_id')
              .eq('id', contentItem.module_id)
              .single();

            if (moduleData?.course_id) {
              const { data: courseData } = await supabase
                .from('courses')
                .select('verification_status')
                .eq('id', moduleData.course_id)
                .single();

              courseIsApproved = courseData?.verification_status === 'approved';
            }
          }
        }

        // Fetch quiz questions
        const { data: rows, error: questionsError } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('quiz_id', quizId)
          .order('position', { ascending: true });

        if (questionsError) throw questionsError;

        setQuestionCount(rows?.length || 0);

        // Fetch attempts in parallel
        const [attemptsResult, inProgressResult] = await Promise.all([
          supabase.from('quiz_attempts')
            .select('*')
            .eq('user_id', user.id)
            .eq('quiz_id', quizId)
            .in('status', ['submitted', 'graded'])
            .order('attempt_number', { ascending: false }),
          supabase.from('quiz_attempts')
            .select('*')
            .eq('user_id', user.id)
            .eq('quiz_id', quizId)
            .eq('status', 'in_progress')
            .maybeSingle(),
        ]);

        // Set quiz meta
        setQuizMeta({
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          instructions: quiz.instructions,
          passing_score: quiz.passing_score ?? 70,
          time_limit_minutes: quiz.time_limit_minutes,
          max_attempts: quiz.max_attempts,
          available_from: quiz.available_from,
          due_date: quiz.due_date,
          late_submission_allowed: quiz.late_submission_allowed,
          late_penalty_percent: quiz.late_penalty_percent,
          is_published: courseIsApproved,
          requires_manual_grading: quiz.requires_manual_grading,
          requires_coach_approval: quiz.requires_coach_approval || false,
          lesson_id: quiz.lesson_id ?? null,
        });

        // Map and set questions
        setQuestions(mapQuizQuestions(rows || []));

        // Process attempts
        const attempts = attemptsResult.data || [];
        setAttemptCount(attempts.length);
        const submittedCount = attempts.length;

        if (quiz.max_attempts !== null) {
          setAttemptsRemaining(Math.max(0, quiz.max_attempts - submittedCount));
        } else {
          setAttemptsRemaining(null);
        }

        // Find best score
        if (attempts.length > 0) {
          const best = attempts.reduce((best, curr) => {
            const currPercent = curr.max_score ? (curr.score || 0) / curr.max_score : 0;
            const bestPercent = best.max_score ? (best.score || 0) / best.max_score : 0;
            return currPercent > bestPercent ? curr : best;
          }, attempts[0]);
          setBestScore(best.max_score ? Math.round((best.score || 0) / best.max_score * 100) : null);
        }

        // Format attempts for display
        const formattedAttempts: PreviousAttempt[] = attempts.map((a: QuizAttempt) => ({
          id: a.id,
          attempt_number: a.attempt_number,
          score: a.score || 0,
          max_score: a.max_score || 0,
          passed: a.passed,
          status: a.status,
          submitted_at: a.submitted_at,
          started_at: a.started_at,
          requires_manual_grading: a.requires_manual_grading,
        }));
        setPreviousAttempts(formattedAttempts);

        // Check if there's a pending submission that blocks new attempts
        if (quiz.requires_coach_approval && submission && submission.status === 'pending_review') {
          // Fetch previous responses for view-only mode
          if (submission.latest_attempt_id) {
            const { data: prevResponses } = await supabase
              .from('quiz_responses')
              .select(`
                *,
                quiz_questions!inner(
                  question_content,
                  question_type
                )
              `)
              .eq('attempt_id', submission.latest_attempt_id);

            if (prevResponses) {
              const mapped = prevResponses.map((r: any) => ({
                id: r.id,
                question_id: r.question_id,
                question_text: extractQuestionText(r.quiz_questions?.question_content),
                question_type: r.quiz_questions?.question_type,
                response_data: r.response_data,
                points_earned: r.points_earned,
                points_possible: r.points_possible,
                is_correct: r.is_correct,
              }));
              setPreviousResponses(mapped);
            }
          }
          setSessionState('pending_review');
          return;
        }

        // Handle in-progress attempt
        const inProgress = inProgressResult.data;
        if (inProgress) {
          if (quiz.time_limit_minutes) {
            const startedAt = new Date(inProgress.started_at).getTime();
            const now = Date.now();
            const elapsed = Math.floor((now - startedAt) / 1000);
            const totalTime = quiz.time_limit_minutes * 60;
            const remaining = totalTime - elapsed;

            if (remaining <= 0) {
              setTimeRemaining(0);
            } else {
              setTimeRemaining(remaining);
            }
          }

          // Fetch saved responses for resume
          const { data: responses } = await supabase
            .from('quiz_responses')
            .select('*')
            .eq('attempt_id', inProgress.id);

          if (responses) {
            const savedAnswers: Record<string, string | boolean> = {};
            responses.forEach((r: QuizResponse) => {
              const answer = r.response_data?.answer;
              if (answer !== null && answer !== undefined) {
                savedAnswers[r.question_id] = answer;
              }
            });
            setSelectedAnswers(savedAnswers);
          }

          setCurrentAttempt(inProgress);
          setShowResumeDialog(true);
        }

        // Determine initial state
        const now = Date.now();
        const availableFrom = quiz.available_from ? new Date(quiz.available_from).getTime() : null;
        const dueDate = quiz.due_date ? new Date(quiz.due_date).getTime() : null;

        if (availableFrom && now < availableFrom) {
          setSessionState('not_available');
        } else if (dueDate && now > dueDate && !quiz.late_submission_allowed) {
          setSessionState('closed');
        } else {
          if (dueDate && now > dueDate && quiz.late_submission_allowed) {
            setIsLateSubmission(true);
          }
          if (attemptsRemaining !== null && attemptsRemaining <= 0) {
            setSessionState('no_attempts_remaining');
          } else if (inProgress) {
            setSessionState('resume_or_restart');
          } else {
            setSessionState('start_screen');
          }
        }

      } catch (err) {
        console.error('Error fetching quiz:', err);
        setSessionState('loading');
      }
    };

    fetchQuiz();
  }, [quizId, user, submission]);

  // ============================================
  // Timer Management
  // ============================================

  useEffect(() => {
    if (sessionState !== 'in_progress' || !quizMeta?.time_limit_minutes || timeRemaining === null) {
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionState, quizMeta?.time_limit_minutes]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeRemaining === 0 && sessionState === 'in_progress' && questions.length > 0) {
      handleSubmit();
    }
  }, [timeRemaining]);

  // ============================================
  // Memoized Values (for performance)
  // ============================================

  const currentQuestion = useMemo(() =>
    questions[currentQuestionIndex],
    [questions, currentQuestionIndex]
  );

  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  // ============================================
  // Quiz Actions
  // ============================================

  const autoSubmitAttempt = async (attempt: QuizAttempt) => {
    if (!quizMeta || !user) return;

    try {
      let earnedPoints = 0;
      let totalPoints = 0;

      questions.forEach((q) => {
        const userAnswer = selectedAnswers[q.id];
        let isCorrect = false;
        totalPoints += q.points;

        if (q.type === 'true-false') {
          isCorrect = userAnswer === q.correctAnswer;
        } else {
          isCorrect = userAnswer === q.correctOptionId;
        }

        if (isCorrect) {
          earnedPoints += q.points;
        }
      });

      let finalScore = earnedPoints;
      let penalizedScore: number | undefined;

      if (isLateSubmission && quizMeta.late_penalty_percent > 0) {
        const penalty = Math.round((earnedPoints * quizMeta.late_penalty_percent) / 100);
        penalizedScore = earnedPoints - penalty;
        finalScore = Math.max(0, penalizedScore);
      }

      const scorePercent = totalPoints > 0 ? Math.round((finalScore / totalPoints) * 100) : 0;
      const passed = scorePercent >= quizMeta.passing_score;

      await supabase
        .from('quiz_attempts')
        .update({
          status: 'submitted',
          score: finalScore,
          max_score: totalPoints,
          passed,
          submitted_at: new Date().toISOString(),
        })
        .eq('id', attempt.id);

      const responses = questions.map((q) => {
        const userAnswer = selectedAnswers[q.id];
        let isCorrect = false;

        if (q.type === 'true-false') {
          isCorrect = userAnswer === q.correctAnswer;
        } else {
          isCorrect = userAnswer === q.correctOptionId;
        }

        return {
          attempt_id: attempt.id,
          question_id: q.id,
          response_data: { answer: userAnswer ?? null },
          points_earned: isCorrect ? (penalizedScore !== undefined ? Math.max(0, q.points - Math.round((q.points * quizMeta.late_penalty_percent) / 100)) : q.points) : 0,
          points_possible: q.points,
          is_correct: isCorrect,
        };
      });

      await supabase.from('quiz_responses').insert(responses);

      navigate(`/student/courses/${courseId}/quizzes/${quizId}/result`, {
        state: {
          score: scorePercent,
          correctCount: questions.filter((q, i) => {
            const userAnswer = selectedAnswers[q.id];
            if (q.type === 'true-false') {
              return userAnswer === q.correctAnswer;
            }
            return userAnswer === q.correctOptionId;
          }).length,
          totalQuestions: questions.length,
          passingScore: quizMeta.passing_score,
          questions,
          userAnswers: selectedAnswers,
          passed,
          attemptNumber: attempt.attempt_number,
          penalizedScore: penalizedScore !== undefined ? Math.round((penalizedScore / totalPoints) * 100) : undefined,
          attemptsRemaining: quizMeta.max_attempts === null
            ? null
            : Math.max(0, quizMeta.max_attempts - (previousAttempts.length + 1)),
          maxAttempts: quizMeta.max_attempts,
          timeLimitMinutes: quizMeta.time_limit_minutes,
          lessonId: quizMeta.lesson_id ?? null,
          requiresCoachApproval: quizMeta.requires_coach_approval || false,
        },
      });
    } catch (err) {
      console.error('Error auto-submitting attempt:', err);
    }
  };

  const handleStartAttempt = async (resume: boolean = false) => {
    if (!quizMeta || !user) return;

    if (quizMeta.max_attempts !== null && attemptsRemaining !== null && attemptsRemaining <= 0) {
      alert('You have used all attempts for this quiz.');
      return;
    }

    setShowResumeDialog(false);

    if (resume && currentAttempt) {
      setSessionState('in_progress');
      return;
    }

    try {
      const nextAttemptNumber = (previousAttempts.length || 0) + 1;

      const { data: newAttempt, error: aErr } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          quiz_id: quizMeta.id,
          attempt_number: nextAttemptNumber,
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (aErr) throw aErr;

      setCurrentAttempt(newAttempt);
      setTimeRemaining(quizMeta.time_limit_minutes ? quizMeta.time_limit_minutes * 60 : null);
      setSelectedAnswers({});
      setCurrentQuestionIndex(0);
      setSessionState('in_progress');
    } catch (err) {
      console.error('Error creating attempt:', err);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!quizMeta || !user || !currentAttempt || sessionState !== 'in_progress') return;

    setSubmitting(true);

    try {
      // Upload files and videos before calculating score
      setUploadingFiles(true);

      const uploadedFileUrls: Record<string, any> = {};

      for (const question of questions) {
        if (question.type === 'file-upload' && uploadedFiles[question.id]) {
          try {
            const urls = await uploadFilesToStorage(
              uploadedFiles[question.id],
              currentAttempt.id,
              question.id
            );
            uploadedFileUrls[question.id] = { type: 'files', urls };
          } catch (error: any) {
            console.error(`Failed to upload files for question ${question.id}:`, error);
            alert(`Failed to upload files: ${error.message}`);
            setUploadingFiles(false);
            setSubmitting(false);
            return;
          }
        }

        if (question.type === 'video-submission' && uploadedVideos[question.id]) {
          try {
            const url = await uploadVideoToStorage(
              uploadedVideos[question.id],
              currentAttempt.id,
              question.id
            );
            uploadedFileUrls[question.id] = {
              type: 'video',
              url,
              filename: uploadedVideos[question.id]!.name
            };
          } catch (error: any) {
            console.error(`Failed to upload video for question ${question.id}:`, error);
            alert(`Failed to upload video: ${error.message}`);
            setUploadingFiles(false);
            setSubmitting(false);
            return;
          }
        }
      }

      setUploadingFiles(false);

      // Calculate score
      let earnedPoints = 0;
      let totalPoints = 0;
      let requiresManualGrading = false;

      questions.forEach((q) => {
        if ((q.type === 'file-upload' || q.type === 'video-submission') && uploadedFileUrls[q.id]) {
          requiresManualGrading = true;
        }
      });

      questions.forEach((q) => {
        const userAnswer = selectedAnswers[q.id];
        let isCorrect = false;
        totalPoints += q.points;

        if (q.type === 'true-false') {
          isCorrect = userAnswer === q.correctAnswer;
        } else {
          isCorrect = userAnswer === q.correctOptionId;
        }

        if (isCorrect) {
          earnedPoints += q.points;
        }

        if (q.requires_manual_grading) {
          requiresManualGrading = true;
        }
      });

      let finalScore = earnedPoints;
      let penalizedScore: number | undefined;

      if (isLateSubmission && quizMeta.late_penalty_percent > 0) {
        const penalty = Math.round((earnedPoints * quizMeta.late_penalty_percent) / 100);
        penalizedScore = earnedPoints - penalty;
        finalScore = Math.max(0, penalizedScore);
      }

      const scorePercent = totalPoints > 0 ? Math.round((finalScore / totalPoints) * 100) : 0;
      const passed = scorePercent >= quizMeta.passing_score;

      let finalStatus: 'submitted' | 'graded' = requiresManualGrading ? 'submitted' : 'graded';

      const { error: updateErr } = await supabase
        .from('quiz_attempts')
        .update({
          status: finalStatus,
          score: finalScore,
          max_score: totalPoints,
          passed,
          submitted_at: new Date().toISOString(),
        })
        .eq('id', currentAttempt.id);

      if (updateErr) throw updateErr;

      const responses = questions.map((q) => {
        const userAnswer = selectedAnswers[q.id];
        let isCorrect = false;

        if (q.type === 'true-false') {
          isCorrect = userAnswer === q.correctAnswer;
        } else if (q.type === 'file-upload' || q.type === 'video-submission') {
          isCorrect = false;
        } else {
          isCorrect = userAnswer === q.correctOptionId;
        }

        let pointsEarned = isCorrect ? q.points : 0;

        if (isLateSubmission && quizMeta.late_penalty_percent > 0 && isCorrect) {
          pointsEarned = Math.max(0, q.points - Math.round((q.points * quizMeta.late_penalty_percent) / 100));
        }

        const responseData: any = {
          answer: userAnswer ?? null,
          uploaded_files: uploadedFileUrls[q.id] || null,
        };

        return {
          attempt_id: currentAttempt.id,
          question_id: q.id,
          response_data: responseData,
          points_earned: pointsEarned,
          points_possible: q.points,
          is_correct: isCorrect,
          requires_grading: q.requires_manual_grading || (q.type === 'file-upload') || (q.type === 'video-submission'),
        };
      });

      const { error: rErr } = await supabase.from('quiz_responses').insert(responses);
      if (rErr) console.error('Error saving responses:', rErr);

      if (passed) {
        try {
          const { data: quizData, error: quizErr } = await supabase
            .from('quizzes')
            .select('lesson_id')
            .eq('id', quizMeta.id)
            .single();

          if (!quizErr && quizData?.lesson_id) {
            const { data: quizContentItem } = await supabase
              .from('lesson_content_items')
              .select('id')
              .eq('lesson_id', quizData.lesson_id)
              .eq('content_type', 'quiz')
              .eq('content_id', quizMeta.id)
              .maybeSingle();

            if (quizContentItem) {
              const { error: progressErr } = await supabase
                .from('lesson_content_item_progress')
                .upsert({
                  user_id: user.id,
                  lesson_id: quizData.lesson_id,
                  content_item_id: quizContentItem.id,
                  content_type: 'quiz',
                  is_completed: true,
                  completed_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  progress_data: { quiz_score: scorePercent, passed: true },
                }, {
                  onConflict: 'user_id,lesson_id,content_item_id',
                });

              if (progressErr) {
                console.error('Failed to mark quiz content item complete:', progressErr);
              } else {
                console.log('✅ Quiz content item marked complete — DB trigger will check ALL required items');
              }
            }
          }

          // If quiz does NOT require coach approval, unlock the next lesson immediately
          if (!quizMeta.requires_coach_approval) {
            console.log('🔓 Quiz passed without coach approval requirement — unlocking next lesson');
            const { error: unlockErr } = await supabase
              .rpc('unlock_next_lesson', {
                p_user_id: user.id,
                p_quiz_id: quizMeta.id,
              });

            if (unlockErr) {
              console.error('Failed to unlock next lesson:', unlockErr);
            } else {
              console.log('✅ Next lesson unlocked successfully');
            }
          }
        } catch (err) {
          console.error('Error marking quiz completion:', err);
        }
      }

      navigate(`/student/courses/${courseId}/quizzes/${quizId}/result`, {
        state: {
          score: scorePercent,
          correctCount: questions.filter((q) => {
            const userAnswer = selectedAnswers[q.id];
            if (q.type === 'true-false') {
              return userAnswer === q.correctAnswer;
            }
            return userAnswer === q.correctOptionId;
          }).length,
          totalQuestions: questions.length,
          passingScore: quizMeta.passing_score,
          questions,
          userAnswers: selectedAnswers,
          passed,
          attemptNumber: currentAttempt.attempt_number,
          penalizedScore: penalizedScore !== undefined ? Math.round((penalizedScore / totalPoints) * 100) : undefined,
          requiresManualGrading,
          attemptsRemaining: quizMeta.max_attempts === null
            ? null
            : Math.max(0, quizMeta.max_attempts - (previousAttempts.length + 1)),
          maxAttempts: quizMeta.max_attempts,
          timeLimitMinutes: quizMeta.time_limit_minutes,
          lessonId: quizMeta.lesson_id ?? null,
        },
      });
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setSubmitting(false);
    }
  }, [quizMeta, user, currentAttempt, sessionState, questions, selectedAnswers, courseId, quizId, navigate, isLateSubmission]);

  // ============================================
  // Navigation Handlers
  // ============================================

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    } else {
      // If on first question, go back to course
      navigate(`/student/courses/${courseId}`);
    }
  };

  const handleAnswerSelect = (answer: string | boolean) => {
    if (!currentQuestion) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }));
  };

  const handleFilesChange = useCallback((questionId: string, files: File[]) => {
    setUploadedFiles((prev) => ({ ...prev, [questionId]: files }));
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: `file_upload_${files.length}_files` }));
  }, []);

  const handleVideoChange = useCallback((questionId: string, file: File | null) => {
    setUploadedVideos((prev) => ({ ...prev, [questionId]: file }));
    if (file) {
      setSelectedAnswers((prev) => ({ ...prev, [questionId]: `video_upload_${file.name}` }));
    } else {
      setSelectedAnswers((prev) => {
        const newState = { ...prev };
        delete newState[questionId];
        return newState;
      });
    }
  }, []);

  const uploadFilesToStorage = async (
    files: File[],
    attemptId: string,
    questionId: string
  ): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${attemptId}/${questionId}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('quiz-submissions')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('quiz-submissions')
        .getPublicUrl(fileName);

      uploadedUrls.push(urlData.publicUrl);
    }

    return uploadedUrls;
  };

  const uploadVideoToStorage = async (
    video: File,
    attemptId: string,
    questionId: string
  ): Promise<string> => {
    const videoExt = video.name.split('.').pop() || 'mp4';
    const fileName = `${attemptId}/${questionId}/video_${Date.now()}.${videoExt}`;

    const { error: uploadError } = await supabase.storage
      .from('quiz-submissions')
      .upload(fileName, video);

    if (uploadError) {
      console.error('Error uploading video:', uploadError);
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from('quiz-submissions')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  // ============================================
  // Render: Start Screen (replaces QuizStart)
  // ============================================

  const renderStartScreen = () => {
    if (!quizMeta) return null;
    const maxReached = quizMeta.max_attempts ? attemptCount >= quizMeta.max_attempts : false;

    return (
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(`/student/courses/${courseId}`)}
          className="flex items-center gap-2 text-text-secondary hover:text-brand-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to course
        </button>

        <div className="glass-card rounded-3xl p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-text-primary mb-2">{quizMeta.title}</h1>
          </div>

          <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b border-[color:var(--border-base)]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-secondary">📝 {questionCount} questions</span>
            </div>
            {quizMeta.time_limit_minutes && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-secondary">⏱ {quizMeta.time_limit_minutes} minutes</span>
              </div>
            )}
            {quizMeta.passing_score && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-secondary">✅ Pass: {quizMeta.passing_score}%</span>
              </div>
            )}
            {quizMeta.max_attempts && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-secondary">🔄 Attempts: {attemptCount}/{quizMeta.max_attempts}</span>
              </div>
            )}
          </div>

          {quizMeta.description && (
            <div className="mb-6">
              <h3 className="font-semibold text-text-primary mb-2">About this quiz</h3>
              <p className="text-text-secondary leading-relaxed">{quizMeta.description}</p>
            </div>
          )}

          {quizMeta.instructions && (
            <div className="mb-6 p-4 bg-brand-primary/5 rounded-2xl">
              <h3 className="font-semibold text-text-primary mb-2">Instructions</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{quizMeta.instructions}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => handleStartAttempt(false)}
              disabled={maxReached}
              className={`flex-1 font-semibold py-4 px-8 rounded-full transition-all ${
                maxReached
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-brand-neon to-brand-electric text-white hover:shadow-lg'
              }`}
            >
              {maxReached ? 'Max attempts reached' : 'Start quiz'}
            </button>
            <button
              onClick={() => navigate(`/student/courses/${courseId}`)}
              className="px-8 py-4 rounded-full font-semibold text-brand-primary border-2 border-brand-primary hover:bg-brand-primary/5 transition-all"
            >
              Review lesson first
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // Render: Pending Review (View Only - Cannot Retake)
  // ============================================

  const renderPendingReview = () => {
    if (!quizMeta || !submission) return null;

    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(`/student/courses/${courseId}`)}
          className="flex items-center gap-2 text-text-secondary hover:text-brand-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to course
        </button>

        <div className="glass-card rounded-3xl p-8 mb-6">
          <h1 className="text-3xl font-bold text-text-primary mb-4">{quizMeta.title}</h1>

          {/* Pending Review Status Banner */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <Clock className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-blue-900 mb-2">Awaiting Coach Review</h3>
                <p className="text-blue-800 mb-4">
                  Your quiz submission is currently being reviewed by your coach.
                  You cannot retake this quiz until your coach has approved or rejected your submission.
                </p>
                <div className="flex items-center gap-4 text-sm text-blue-700">
                  <span>
                    Submitted: {new Date(submission.submitted_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
                {submission.review_notes && (
                  <div className="mt-4 p-4 bg-white rounded-lg">
                    <p className="text-sm font-semibold text-blue-900 mb-1 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Coach's Note:
                    </p>
                    <p className="text-sm text-blue-800">{submission.review_notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Previous Answers (View Only) */}
          {previousResponses.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-text-primary mb-4">Your Previous Answers</h3>
              <div className="space-y-4">
                {previousResponses.map((response, index) => (
                  <div
                    key={response.id}
                    className={`p-4 rounded-lg border-2 ${
                      response.is_correct
                        ? 'bg-green-50 border-green-200'
                        : 'bg-orange-50 border-orange-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-text-primary flex-1">
                        Q{index + 1}: {response.question_text}
                      </h4>
                      {response.is_correct ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 ml-2" />
                      ) : (
                        <XCircle className="w-5 h-5 text-orange-600 flex-shrink-0 ml-2" />
                      )}
                    </div>
                    <p className="text-sm text-text-secondary">
                      Your answer:{' '}
                      <span className="font-medium text-text-primary">
                        {typeof response.response_data.answer === 'boolean'
                          ? response.response_data.answer
                            ? 'True'
                            : 'False'
                          : response.response_data.answer || 'No answer'}
                      </span>
                    </p>
                    <p className="text-sm font-medium text-text-primary mt-1">
                      Points: {response.points_earned}/{response.points_possible}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex gap-4">
            <button
              onClick={() => navigate(`/student/courses/${courseId}/quizzes/${quizId}/result`)}
              className="px-6 py-3 rounded-full font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all"
            >
              View Full Results
            </button>
            {submission.has_feedback && (
              <button
                onClick={() => navigate(`/student/courses/${courseId}/quizzes/${quizId}/feedback`)}
                className="px-6 py-3 rounded-full font-semibold text-blue-600 border-2 border-blue-600 hover:bg-blue-50 transition-all"
              >
                View Coach Feedback
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // Render: Loading State
  // ============================================

  if (sessionState === 'loading' || !quizMeta) {
    return (
      <StudentAppLayout>
        <div className="min-h-screen bg-[color:var(--bg-primary)] flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading quiz...</p>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  // ============================================
  // Render: Start Screen
  // ============================================

  if (sessionState === 'start_screen') {
    return (
      <StudentAppLayout>
        <div className="min-h-screen bg-[color:var(--bg-primary)] py-8 px-6">
          {renderStartScreen()}
        </div>
      </StudentAppLayout>
    );
  }

  // ============================================
  // Render: Pending Review
  // ============================================

  if (sessionState === 'pending_review') {
    return (
      <StudentAppLayout>
        <div className="min-h-screen bg-[color:var(--bg-primary)] py-8 px-6">
          {renderPendingReview()}
        </div>
      </StudentAppLayout>
    );
  }

  // ============================================
  // Render: Error States
  // ============================================

  if (sessionState === 'not_published') {
    return (
      <StudentAppLayout>
        <div className="min-h-screen bg-[color:var(--bg-primary)] flex items-center justify-center">
          <div className="text-center">
            <Lock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-text-primary mb-2">Quiz Not Available</h2>
            <p className="text-text-secondary">This quiz has not been published yet.</p>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  if (sessionState === 'not_available') {
    return (
      <StudentAppLayout>
        <div className="min-h-screen bg-[color:var(--bg-primary)] flex items-center justify-center">
          <div className="text-center">
            <Calendar className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-text-primary mb-2">Coming Soon</h2>
            <p className="text-text-secondary">This quiz is not yet available.</p>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  if (sessionState === 'closed') {
    return (
      <StudentAppLayout>
        <div className="min-h-screen bg-[color:var(--bg-primary)] flex items-center justify-center">
          <div className="text-center">
            <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-text-primary mb-2">Quiz Closed</h2>
            <p className="text-text-secondary">This quiz is no longer accepting submissions.</p>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  if (sessionState === 'no_attempts_remaining') {
    return (
      <StudentAppLayout>
        <div className="min-h-screen bg-[color:var(--bg-primary)] flex items-center justify-center">
          <div className="text-center">
            <XCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-text-primary mb-2">No Attempts Remaining</h2>
            <p className="text-text-secondary mb-4">You have used all your attempts for this quiz.</p>
            <button
              onClick={() => navigate(`/student/courses/${courseId}`)}
              className="px-6 py-3 rounded-full font-semibold text-brand-primary border-2 border-brand-primary hover:bg-brand-primary/5 transition-all"
            >
              Back to Course
            </button>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  // ============================================
  // Render: Attempt History / Resume
  // ============================================

  if (sessionState === 'show_history' || sessionState === 'resume_or_restart') {
    return (
      <StudentAppLayout>
        <div className="min-h-screen bg-[color:var(--bg-primary)] py-8 px-6">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => navigate(`/student/courses/${courseId}`)}
              className="flex items-center gap-2 text-text-secondary hover:text-brand-primary mb-6 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to course
            </button>

            <div className="glass-card rounded-3xl p-8 mb-6">
              <h1 className="text-3xl font-bold text-text-primary mb-2">{quizMeta.title}</h1>
              <p className="text-text-secondary mb-6">Review your previous attempts or start a new one.</p>

              <QuizAttemptHistory
                attempts={previousAttempts}
                maxAttempts={quizMeta.max_attempts}
                passingScore={quizMeta.passing_score}
                canRetake={attemptsRemaining === null || attemptsRemaining > 0}
                attemptsRemaining={attemptsRemaining}
                attemptsUsed={previousAttempts.length}
                displayMaxAttempts={quizMeta.max_attempts?.toString() || '∞'}
                onStartAttempt={() => handleStartAttempt(false)}
                timeLimitMinutes={quizMeta.time_limit_minutes}
                courseId={courseId || ''}
                lessonId={quizMeta.lesson_id ?? null}
              />
            </div>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  // ============================================
  // Render: Quiz In Progress
  // ============================================

  if (sessionState === 'in_progress' && currentQuestion) {
    return (
      <StudentAppLayout>
        <div className="min-h-screen bg-[color:var(--bg-primary)] py-8 px-6">
          <div className="max-w-4xl mx-auto">
            {/* Question Progress */}
            <QuestionProgressBar currentIndex={currentQuestionIndex} total={questions.length} />

            {/* Question Card */}
            <div className="glass-card rounded-3xl p-8 mb-6 mt-6">
              {currentQuestion.type === 'multiple-choice' && (
                <QuestionMultipleChoice
                  question={{ ...currentQuestion, options: currentQuestion.options || [] }}
                  selectedOptionId={selectedAnswers[currentQuestion.id] as string}
                  onSelect={handleAnswerSelect}
                />
              )}
              {currentQuestion.type === 'true-false' && (
                <QuestionTrueFalse
                  question={currentQuestion}
                  value={selectedAnswers[currentQuestion.id] as boolean}
                  onChange={handleAnswerSelect}
                />
              )}
              {currentQuestion.type === 'image-choice' && (
                <QuestionImageChoice
                  question={{
                    ...currentQuestion,
                    options: (currentQuestion.options || []).map((o) => ({
                      id: o.id,
                      label: o.label,
                      imageUrl: o.imageUrl || '',
                    })),
                  }}
                  selectedOptionId={selectedAnswers[currentQuestion.id] as string}
                  onSelect={handleAnswerSelect}
                />
              )}
              {currentQuestion.type === 'file-upload' && (
                <QuestionFileUpload
                  question={{
                    ...currentQuestion,
                    answerConfig: currentQuestion.answerConfig,
                  }}
                  onFilesChange={handleFilesChange}
                  existingFiles={uploadedFiles[currentQuestion.id] || []}
                />
              )}
              {currentQuestion.type === 'video-submission' && (
                <QuestionVideoSubmission
                  question={{
                    ...currentQuestion,
                    answerConfig: currentQuestion.answerConfig,
                  }}
                  onVideoChange={handleVideoChange}
                  existingVideo={uploadedVideos[currentQuestion.id] || null}
                />
              )}
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                className="px-6 py-3 rounded-full font-semibold glass-card text-text-primary border-2 border-[color:var(--border-base)] hover:shadow transition-all"
              >
                ← Previous
              </button>

              <div className="flex gap-3">
                <button
                  onClick={() => navigate(`/student/courses/${courseId}`)}
                  className="px-6 py-3 rounded-full font-semibold text-text-secondary hover:text-text-primary transition-colors"
                >
                  Exit Quiz
                </button>
                {isLastQuestion ? (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || uploadingFiles}
                    className="px-8 py-3 rounded-full font-semibold bg-gradient-to-r from-brand-neon to-brand-electric text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {uploadingFiles ? 'Uploading Files...' : submitting ? 'Submitting...' : 'Submit Quiz'}
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="px-8 py-3 rounded-full font-semibold bg-gradient-to-r from-brand-neon to-brand-electric text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  return (
    <StudentAppLayout>
      <div className="min-h-screen bg-[color:var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default QuizSession;
