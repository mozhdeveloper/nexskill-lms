import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import QuestionProgressBar from '../../components/quiz/QuestionProgressBar';
import QuestionMultipleChoice from '../../components/quiz/QuestionMultipleChoice';
import QuestionTrueFalse from '../../components/quiz/QuestionTrueFalse';
import QuestionImageChoice from '../../components/quiz/QuestionImageChoice';
import QuizAttemptHistory, { type PreviousAttempt } from '../../components/quiz/QuizAttemptHistory';
import QuizStatusBanner from '../../components/quiz/QuizStatusBanner';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { Trophy, AlertCircle, Play, Calendar, Lock } from 'lucide-react';

// ============================================
// Type Definitions
// ============================================

interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'image-choice';
  questionText: string;
  options?: { id: string; label: string; helperText?: string; imageUrl?: string }[];
  correctOptionId?: string;
  correctAnswer?: boolean;
  explanation: string;
  points: number;
  requires_manual_grading?: boolean;
}

interface QuizMeta {
  id: string;
  title: string;
  passing_score: number;
  time_limit_minutes: number | null;
  max_attempts: number | null;
  available_from: string | null;
  due_date: string | null;
  late_submission_allowed: boolean;
  late_penalty_percent: number;
  is_published: boolean;
  requires_manual_grading: boolean;
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

type QuizSessionState =
  | 'loading'
  | 'not_published'
  | 'not_available'
  | 'closed'
  | 'no_attempts_remaining'
  | 'show_history'
  | 'resume_or_restart'
  | 'ready_to_start'
  | 'in_progress';

// ============================================
// Helper Functions (outside component for perf)
// ============================================

const mapQuestionType = (dbType: string): 'multiple-choice' | 'true-false' | 'image-choice' => {
  switch (dbType) {
    case 'true_false': return 'true-false';
    case 'image_choice': return 'image-choice';
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

const mapQuizQuestions = (rows: Record<string, unknown>[]): QuizQuestion[] => {
  return rows.map((r) => {
    const rawContent = r.question_content;
    const contentBlock: Record<string, unknown> = Array.isArray(rawContent)
      ? ((rawContent[0] as Record<string, unknown>) ?? {})
      : ((rawContent as Record<string, unknown>) ?? {});
    const answer = r.answer_config as Record<string, unknown> | null;
    const type = mapQuestionType(r.question_type as string);

    const rawQuestionText =
      (contentBlock?.text as string) ||
      (contentBlock?.content as string) ||
      (answer?.question_text as string) ||
      (answer?.questionText as string) ||
      (r.question_text as string) ||
      '';

    let options = (contentBlock?.options as QuizQuestion['options']) || undefined;
    if (!options && Array.isArray(answer?.options)) {
      options = (answer!.options as any[]).map((o: any) => ({
        id: o.id as string,
        label: (o.text || o.label || '') as string,
      }));
    }

    let correctOptionId = (answer?.correctOptionId as string) || undefined;
    if (!correctOptionId && Array.isArray(answer?.options)) {
      const correctOpt = (answer!.options as any[]).find((o: any) => o.is_correct);
      if (correctOpt) correctOptionId = correctOpt.id as string;
    }

    const correctAnswer =
      (answer?.correctAnswer as boolean | undefined) ??
      (answer?.correct_answer as boolean | undefined);

    return {
      id: r.id as string,
      type,
      questionText: stripHtml(rawQuestionText),
      options,
      correctOptionId,
      correctAnswer,
      explanation: (answer?.explanation as string) || '',
      points: (r.points as number) || 1,
      requires_manual_grading: (r.requires_manual_grading as boolean) || false,
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
  const [sessionState, setSessionState] = useState<QuizSessionState>('loading');
  
  // Attempt state
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null>(null);
  const [previousAttempts, setPreviousAttempts] = useState<PreviousAttempt[]>([]);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [bestScore, setBestScore] = useState<number | null>(null);
  
  // Quiz taking state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | boolean>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isLateSubmission, setIsLateSubmission] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Resume dialog state
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
          .single();

        if (quizError) throw quizError;

        // Fetch course approval status via lesson_id or module_content_items
        // Note: We fetch this but don't block access - quizzes are accessible regardless
        let courseIsApproved = true; // Default to true to allow access
        
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
          // Try via module_content_items
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

        // Set quiz meta - use course approval instead of quiz.is_published
        setQuizMeta({
          id: quiz.id,
          title: quiz.title,
          passing_score: quiz.passing_score ?? 70,
          time_limit_minutes: quiz.time_limit_minutes,
          max_attempts: quiz.max_attempts,
          available_from: quiz.available_from,
          due_date: quiz.due_date,
          late_submission_allowed: quiz.late_submission_allowed,
          late_penalty_percent: quiz.late_penalty_percent,
          is_published: courseIsApproved,
          requires_manual_grading: quiz.requires_manual_grading,
        });

        // Map and set questions
        setQuestions(mapQuizQuestions(rows || []));

        // Process attempts
        const attempts = attemptsResult.data || [];
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
              // Time expired - will auto-submit on start
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

        // Determine initial state - quizzes are always accessible now
        const now = Date.now();
        const availableFrom = quiz.available_from ? new Date(quiz.available_from).getTime() : null;
        const dueDate = quiz.due_date ? new Date(quiz.due_date).getTime() : null;

        // Skip is_published check - allow access to all quizzes
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
          } else {
            setSessionState('show_history');
          }
        }

      } catch (err) {
        console.error('Error fetching quiz:', err);
        setSessionState('loading');
      }
    };

    fetchQuiz();
  }, [quizId, user]);

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

  // ============================================
  // Quiz Actions
  // ============================================

  const autoSubmitAttempt = async (attempt: QuizAttempt) => {
    if (!quizMeta || !user) return;
    
    try {
      // Calculate score from saved answers
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

      // Apply late penalty if applicable
      let finalScore = earnedPoints;
      let penalizedScore: number | undefined;

      if (isLateSubmission && quizMeta.late_penalty_percent > 0) {
        const penalty = Math.round((earnedPoints * quizMeta.late_penalty_percent) / 100);
        penalizedScore = earnedPoints - penalty;
        finalScore = Math.max(0, penalizedScore);
      }

      const scorePercent = totalPoints > 0 ? Math.round((finalScore / totalPoints) * 100) : 0;
      const passed = scorePercent >= quizMeta.passing_score;

      // Update attempt
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

      // Save responses
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

      // Navigate to result
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
        },
      });
    } catch (err) {
      console.error('Error auto-submitting attempt:', err);
    }
  };

  const handleStartAttempt = async (resume: boolean = false) => {
    if (!quizMeta || !user) return;

    // Check if attempts remaining
    if (quizMeta.max_attempts !== null && attemptsRemaining !== null && attemptsRemaining <= 0) {
      alert('You have used all attempts for this quiz.');
      return;
    }

    setShowResumeDialog(false);

    if (resume && currentAttempt) {
      // Resume existing attempt
      setSessionState('in_progress');
      return;
    }

    // Create new attempt
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
      // Calculate score
      let earnedPoints = 0;
      let totalPoints = 0;
      let requiresManualGrading = false;

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

      // Apply late penalty if applicable
      let finalScore = earnedPoints;
      let penalizedScore: number | undefined;

      if (isLateSubmission && quizMeta.late_penalty_percent > 0) {
        const penalty = Math.round((earnedPoints * quizMeta.late_penalty_percent) / 100);
        penalizedScore = earnedPoints - penalty;
        finalScore = Math.max(0, penalizedScore);
      }

      const scorePercent = totalPoints > 0 ? Math.round((finalScore / totalPoints) * 100) : 0;
      const passed = scorePercent >= quizMeta.passing_score;

      // Determine final status
      let finalStatus: 'submitted' | 'graded' = requiresManualGrading ? 'submitted' : 'graded';

      // Update attempt
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

      // Save responses
      const responses = questions.map((q) => {
        const userAnswer = selectedAnswers[q.id];
        let isCorrect = false;

        if (q.type === 'true-false') {
          isCorrect = userAnswer === q.correctAnswer;
        } else {
          isCorrect = userAnswer === q.correctOptionId;
        }

        let pointsEarned = isCorrect ? q.points : 0;
        
        // Apply penalty to individual question points if late submission
        if (isLateSubmission && quizMeta.late_penalty_percent > 0 && isCorrect) {
          pointsEarned = Math.max(0, q.points - Math.round((q.points * quizMeta.late_penalty_percent) / 100));
        }

        return {
          attempt_id: currentAttempt.id,
          question_id: q.id,
          response_data: { answer: userAnswer ?? null },
          points_earned: pointsEarned,
          points_possible: q.points,
          is_correct: isCorrect,
          requires_grading: q.requires_manual_grading || false,
        };
      });

      const { error: rErr } = await supabase.from('quiz_responses').insert(responses);
      if (rErr) console.error('Error saving responses:', rErr);

      // Mark quiz content item as complete if passed
      // FIX: Write to lesson_content_item_progress instead of directly to user_lesson_progress
      // The CoursePlayer.handleContentItemComplete will check ALL items and mark the lesson complete
      if (passed) {
        try {
          const { data: quizData, error: quizErr } = await supabase
            .from('quizzes')
            .select('lesson_id')
            .eq('id', quizMeta.id)
            .single();

          if (!quizErr && quizData?.lesson_id) {
            // Find the quiz content item in lesson_content_items
            const { data: quizContentItem } = await supabase
              .from('lesson_content_items')
              .select('id')
              .eq('lesson_id', quizData.lesson_id)
              .eq('content_type', 'quiz')
              .eq('content_id', quizMeta.id)
              .maybeSingle();

            if (quizContentItem) {
              // Mark this quiz content item as complete
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
                console.log('✅ Quiz content item marked complete — CoursePlayer will check remaining items');
              }
            }

            // Also update user_lesson_progress for backward compatibility
            // (CoursePlayer also writes here, so this is a safety net)
            const { error: lessonProgressErr } = await supabase
              .from('user_lesson_progress')
              .upsert({
                user_id: user.id,
                lesson_id: quizData.lesson_id,
                is_completed: true,
                completed_at: new Date().toISOString(),
              }, {
                onConflict: 'user_id,lesson_id',
                ignoreDuplicates: false
              });

            if (lessonProgressErr) {
              console.error('Failed to update lesson progress:', lessonProgressErr);
            }
          }
        } catch (err) {
          console.error('Error marking quiz completion:', err);
        }
      }

      // Navigate to result
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
    }
  };

  const handleAnswerSelect = (answer: string | boolean) => {
    if (!currentQuestion) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }));
  };

  // ============================================
  // Render Helpers
  // ============================================

  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const hasAnsweredCurrent = selectedAnswers[currentQuestion?.id] !== undefined;

  const canStartQuiz = sessionState === 'show_history' || sessionState === 'resume_or_restart';
  const attemptsUsed = previousAttempts.length;
  const displayMaxAttempts = quizMeta?.max_attempts || '∞';

  // ============================================
  // Render Loading State
  // ============================================

  if (sessionState === 'loading') {
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
  // Render Error States
  // ============================================

  if (!quizMeta || questions.length === 0) {
    return (
      <StudentAppLayout>
        <div className="min-h-screen bg-[color:var(--bg-primary)] flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-text-secondary mx-auto mb-4" />
            <p className="text-text-secondary mb-4">No questions found for this quiz.</p>
            <button
              onClick={() => navigate(`/student/courses/${courseId}`)}
              className="text-brand-primary hover:underline"
            >
              Back to course
            </button>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  // ============================================
  // Main Render
  // ============================================

  return (
    <StudentAppLayout>
      <div className="min-h-screen bg-[color:var(--bg-primary)] py-8 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Status Banner */}
          <QuizStatusBanner
            availableFrom={quizMeta.available_from}
            dueDate={quizMeta.due_date}
            lateSubmissionAllowed={quizMeta.late_submission_allowed}
            latePenaltyPercent={quizMeta.late_penalty_percent}
            attemptsRemaining={attemptsRemaining}
            maxAttempts={quizMeta.max_attempts}
            isPublished={quizMeta.is_published}
          />

          {/* Quiz Info Header Card */}
          <div className="glass-card rounded-2xl p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-xl font-bold text-text-primary mb-2">{quizMeta.title}</h1>
                <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                  <div>
                    <span className="font-semibold">Passing Score:</span> {quizMeta.passing_score}%
                  </div>
                  {quizMeta.time_limit_minutes && (
                    <div>
                      <span className="font-semibold">Time Limit:</span> {quizMeta.time_limit_minutes} minutes
                    </div>
                  )}
                  <div>
                    <span className="font-semibold">Attempts:</span> {attemptsUsed} of {displayMaxAttempts}
                  </div>
                </div>
                {bestScore !== null && (
                  <div className="flex items-center gap-2 mt-3 text-amber-600 dark:text-amber-400">
                    <Trophy className="w-4 h-4" />
                    <span className="text-sm font-medium">Previous Best: {bestScore}%</span>
                  </div>
                )}
              </div>
              
              {sessionState === 'in_progress' && quizMeta.time_limit_minutes && timeRemaining !== null && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                  timeRemaining < 60 
                    ? 'bg-red-100 dark:bg-red-900/30 animate-pulse' 
                    : 'bg-[color:var(--bg-tertiary)]'
                }`}>
                  <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={`text-sm font-bold font-mono ${
                    timeRemaining < 60 ? 'text-red-600 dark:text-red-400' : 'text-text-primary'
                  }`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Attempt History */}
          {previousAttempts.length > 0 && sessionState !== 'in_progress' && (
            <QuizAttemptHistory
              attempts={previousAttempts}
              maxAttempts={quizMeta.max_attempts}
              passingScore={quizMeta.passing_score}
              canRetake={attemptsRemaining === null || attemptsRemaining > 0}
              onRetake={() => handleStartAttempt(false)}
            />
          )}

          {/* No Attempts Remaining State */}
          {sessionState === 'no_attempts_remaining' && (
            <div className="glass-card rounded-2xl p-8 text-center">
              <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-text-primary mb-2">No Attempts Remaining</h2>
              <p className="text-text-secondary mb-6">
                You have used all {quizMeta.max_attempts} attempt{quizMeta.max_attempts !== 1 ? 's' : ''} for this quiz.
              </p>
              {bestScore !== null && (
                <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 px-4 py-2 rounded-full mb-6">
                  <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    Best Score: {bestScore}%
                  </span>
                </div>
              )}
              <div>
                <button
                  onClick={() => navigate(`/student/courses/${courseId}`)}
                  className="px-6 py-3 rounded-full font-semibold bg-gradient-to-r from-brand-neon to-brand-electric text-white shadow-lg hover:shadow-xl transition-all"
                >
                  Back to Course
                </button>
              </div>
            </div>
          )}

          {/* Quiz Not Published State */}
          {sessionState === 'not_published' && (
            <div className="glass-card rounded-2xl p-8 text-center">
              <Lock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-text-primary mb-2">Quiz Not Available</h2>
              <p className="text-text-secondary">This quiz has not been published yet.</p>
            </div>
          )}

          {/* Quiz Not Yet Available State */}
          {sessionState === 'not_available' && quizMeta.available_from && (
            <div className="glass-card rounded-2xl p-8 text-center">
              <Calendar className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-text-primary mb-2">Coming Soon</h2>
              <p className="text-text-secondary mb-4">
                This quiz will be available on {new Date(quizMeta.available_from).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          )}

          {/* Quiz Closed State */}
          {sessionState === 'closed' && quizMeta.due_date && (
            <div className="glass-card rounded-2xl p-8 text-center">
              <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-text-primary mb-2">Quiz Closed</h2>
              <p className="text-text-secondary">
                This quiz closed on {new Date(quizMeta.due_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          )}

          {/* Ready to Start / In Progress */}
          {(sessionState === 'show_history' || sessionState === 'in_progress') && (
            <>
              {sessionState === 'show_history' && (
                <div className="glass-card rounded-2xl p-8 text-center mb-6">
                  <div className="mb-6">
                    {isLateSubmission && (
                      <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 px-4 py-2 rounded-full mb-4">
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                          Late submission - {quizMeta.late_penalty_percent}% penalty will apply
                        </span>
                      </div>
                    )}
                    <p className="text-text-secondary mb-2">
                      {attemptsRemaining === null 
                        ? 'Unlimited attempts available'
                        : attemptsRemaining === 1
                        ? 'This is your last attempt'
                        : `You have ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining`
                      }
                    </p>
                  </div>
                  {attemptsRemaining === null || attemptsRemaining > 0 ? (
                    <button
                      onClick={() => handleStartAttempt()}
                      className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold bg-gradient-to-r from-brand-neon to-brand-electric text-white shadow-lg hover:shadow-xl transition-all"
                    >
                      <Play className="w-5 h-5" />
                      Start Attempt {attemptsUsed + 1} of {displayMaxAttempts}
                    </button>
                  ) : (
                    <div className="text-center text-text-secondary">
                      <p className="font-medium">No attempts remaining</p>
                      <p className="text-sm mt-2">You have used all {quizMeta.max_attempts} attempts for this quiz.</p>
                    </div>
                  )}
                </div>
              )}

              {sessionState === 'in_progress' && currentQuestion && (
                <>
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
                  </div>

                  {/* Navigation Controls */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handlePrevious}
                      disabled={isFirstQuestion}
                      className={`px-6 py-3 rounded-full font-semibold transition-all ${
                        isFirstQuestion
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                          : 'glass-card text-text-primary border-2 border-[color:var(--border-base)] hover:shadow'
                      }`}
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
                          disabled={submitting}
                          className="px-8 py-3 rounded-full font-semibold bg-gradient-to-r from-brand-neon to-brand-electric text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                        >
                          {submitting ? 'Submitting...' : 'Submit Quiz'}
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
                </>
              )}
            </>
          )}

          {/* Resume Dialog */}
          {showResumeDialog && currentAttempt && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="glass-card rounded-2xl p-8 max-w-md w-full">
                <h2 className="text-xl font-bold text-text-primary mb-4">Resume Quiz?</h2>
                <p className="text-text-secondary mb-6">
                  You have an in-progress attempt from {new Date(currentAttempt.started_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}.
                  {quizMeta.time_limit_minutes && timeRemaining && (
                    <span className="block mt-2 font-medium text-text-primary">
                      Time remaining: {formatTime(timeRemaining)}
                    </span>
                  )}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowResumeDialog(false);
                      handleStartAttempt(true);
                    }}
                    className="flex-1 px-6 py-3 rounded-full font-semibold bg-gradient-to-r from-brand-neon to-brand-electric text-white shadow-lg hover:shadow-xl transition-all"
                  >
                    Resume
                  </button>
                  <button
                    onClick={() => {
                      setShowResumeDialog(false);
                      handleStartAttempt(false);
                    }}
                    className="flex-1 px-6 py-3 rounded-full font-semibold glass-card text-text-primary border-2 border-[color:var(--border-base)] hover:shadow transition-all"
                  >
                    Start New
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default QuizSession;
