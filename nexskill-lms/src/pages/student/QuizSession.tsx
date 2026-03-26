import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import QuestionProgressBar from '../../components/quiz/QuestionProgressBar';
import QuestionMultipleChoice from '../../components/quiz/QuestionMultipleChoice';
import QuestionTrueFalse from '../../components/quiz/QuestionTrueFalse';
import QuestionImageChoice from '../../components/quiz/QuestionImageChoice';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'image-choice';
  questionText: string;
  options?: { id: string; label: string; helperText?: string; imageUrl?: string }[];
  correctOptionId?: string;
  correctAnswer?: boolean;
  explanation: string;
  points: number;
}

interface QuizMeta {
  id: string;
  title: string;
  passing_score: number;
  time_limit_minutes: number | null;
}

const mapQuestionType = (dbType: string): 'multiple-choice' | 'true-false' | 'image-choice' => {
  switch (dbType) {
    case 'true_false': return 'true-false';
    case 'image_choice': return 'image-choice';
    default: return 'multiple-choice';
  }
};

const QuizSession: React.FC = () => {
  const navigate = useNavigate();
  const { courseId, quizId } = useParams();
  const { user } = useAuth();
  const [quizMeta, setQuizMeta] = useState<QuizMeta | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | boolean>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId) return;
      try {
        const { data: quiz, error: qErr } = await supabase
          .from('quizzes')
          .select('id, title, passing_score, time_limit_minutes')
          .eq('id', quizId)
          .single();

        if (qErr) throw qErr;

        const { data: rows, error: rErr } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('quiz_id', quizId)
          .order('position', { ascending: true });

        // DEBUG LOGS
        console.log('=== QUIZ QUESTIONS DEBUG ===');
        console.log('Quiz ID from URL:', quizId);
        console.log('Course ID from URL:', courseId);
        console.log('Raw rows from DB:', rows);
        console.log('Rows length:', rows?.length);
        console.log('First row question_content:', rows?.[0]?.question_content);
        console.log('First row answer_config:', rows?.[0]?.answer_config);
        console.log('First row question_type:', rows?.[0]?.question_type);
        console.log('Error:', rErr);
        console.log('Quiz data:', quiz);

        if (rErr) throw rErr;

        setQuizMeta({
          id: quiz.id,
          title: quiz.title,
          passing_score: quiz.passing_score ?? 70,
          time_limit_minutes: quiz.time_limit_minutes,
        });

        const mapped: QuizQuestion[] = (rows || []).map((r: Record<string, unknown>) => {
          // question_content is stored as a JSON array (DB CHECK enforces this).
          // Each element is a block: { text, options? }. We use the first block.
          const rawContent = r.question_content;
          const contentBlock: Record<string, unknown> = Array.isArray(rawContent)
            ? ((rawContent[0] as Record<string, unknown>) ?? {})
            : ((rawContent as Record<string, unknown>) ?? {});
          const answer = r.answer_config as Record<string, unknown> | null;
          const type = mapQuestionType(r.question_type as string);

          // DEBUG: Log each mapped question
          console.log('Mapping question:', {
            id: r.id,
            rawContent,
            contentBlock,
            contentBlockText: contentBlock?.text,
            answer,
            type,
          });

          // Extract question text - try multiple possible locations
          const rawQuestionText = 
            (contentBlock?.text as string) ||
            (contentBlock?.content as string) ||
            (answer?.question_text as string) ||
            (answer?.questionText as string) ||
            (r.question_text as string) ||
            '';

          // Strip HTML tags and decode HTML entities to get plain text
          const questionText = rawQuestionText
            .replace(/<[^>]*>/g, '')  // Remove HTML tags
            .replace(/&lt;/g, '<')     // Decode <
            .replace(/&gt;/g, '>')     // Decode >
            .replace(/&amp;/g, '&')    // Decode &
            .replace(/&quot;/g, '"')   // Decode "
            .replace(/&#39;/g, "'")    // Decode '
            .trim();

          // Options: seed format stores them in content block; coach editor stores in answer_config.options
          let options = (contentBlock?.options as QuizQuestion['options']) || undefined;
          if (!options && Array.isArray(answer?.options) && (answer!.options as unknown[]).length > 0) {
            options = (answer!.options as any[]).map((o: any) => ({
              id: o.id as string,
              label: (o.text || o.label || '') as string,
            }));
          }

          // correctOptionId: seed stores explicit field; coach editor marks is_correct on each option
          let correctOptionId = (answer?.correctOptionId as string) || undefined;
          if (!correctOptionId && Array.isArray(answer?.options)) {
            const correctOpt = (answer!.options as any[]).find((o: any) => o.is_correct);
            if (correctOpt) correctOptionId = correctOpt.id as string;
          }

          // true/false: seed uses camelCase correctAnswer; coach editor uses snake_case correct_answer
          const correctAnswer =
            (answer?.correctAnswer as boolean | undefined) ??
            (answer?.correct_answer as boolean | undefined);

          return {
            id: r.id as string,
            type,
            questionText,
            options,
            correctOptionId,
            correctAnswer,
            explanation: (answer?.explanation as string) || '',
            points: (r.points as number) || 1,
          };
        });

        console.log('Mapped questions:', mapped);
        console.log('=== END DEBUG ===');

        setQuestions(mapped);
        if (quiz.time_limit_minutes) {
          setTimeRemaining(quiz.time_limit_minutes * 60);
        }
      } catch (err) {
        console.error('Error fetching quiz questions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  // Countdown timer
  useEffect(() => {
    if (!quizMeta || quizMeta.time_limit_minutes === null || quizMeta.time_limit_minutes === undefined) return;
    
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
  }, [quizMeta?.time_limit_minutes]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeRemaining === 0 && !submitting && questions.length > 0) {
      handleSubmit();
    }
  }, [timeRemaining]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  const handleNext = () => {
    if (!isLastQuestion) setCurrentQuestionIndex((prev) => prev + 1);
  };

  const handlePrevious = () => {
    if (!isFirstQuestion) setCurrentQuestionIndex((prev) => prev - 1);
  };

  const handleAnswerSelect = (answer: string | boolean) => {
    if (!currentQuestion) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }));
  };

  const handleSubmit = useCallback(async () => {
    if (!quizMeta || !user || submitting) return;
    setSubmitting(true);

    try {
      // Calculate score
      let correctCount = 0;
      let totalPoints = 0;
      let earnedPoints = 0;

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
          correctCount++;
          earnedPoints += q.points;
        }
      });

      const scorePercent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      const passed = scorePercent >= quizMeta.passing_score;

      // Count prior attempts
      const { count: priorCount } = await supabase
        .from('quiz_attempts')
        .select('id', { count: 'exact', head: true })
        .eq('quiz_id', quizMeta.id)
        .eq('user_id', user.id);

      const attemptNumber = (priorCount || 0) + 1;

      // Insert quiz attempt
      const { data: attempt, error: aErr } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          quiz_id: quizMeta.id,
          attempt_number: attemptNumber,
          status: 'submitted',
          score: earnedPoints,
          max_score: totalPoints,
          passed,
          started_at: new Date().toISOString(),
          submitted_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (aErr) throw aErr;

      // Insert quiz responses
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
          points_earned: isCorrect ? q.points : 0,
          points_possible: q.points,
          is_correct: isCorrect,
        };
      });

      const { error: rErr } = await supabase.from('quiz_responses').insert(responses);
      if (rErr) console.error('Error saving responses:', rErr);

      console.log('=== LESSON COMPLETION CHECK ===');
      console.log('Quiz passed:', passed);
      console.log('Quiz ID:', quizMeta.id);

      // MARK LESSON AS COMPLETE if quiz is passed
      if (passed) {
        try {
          // Get lesson_id from quiz
          const { data: quizData, error: quizErr } = await supabase
            .from('quizzes')
            .select('lesson_id')
            .eq('id', quizMeta.id)
            .single();

          console.log('Quiz data for lesson completion:', quizData);
          console.log('Quiz error:', quizErr);

          if (quizErr) {
            console.error('Error fetching lesson_id:', quizErr);
          } else if (quizData?.lesson_id) {
            // Quiz has a lesson_id - mark that lesson complete
            const { data: progressData, error: progressErr } = await supabase
              .from('user_lesson_progress')
              .upsert({
                user_id: user.id,
                lesson_id: quizData.lesson_id,
                is_completed: true,
                completed_at: new Date().toISOString(),
              }, { onConflict: 'user_id,lesson_id' })
              .select();
            
            if (progressErr) {
              console.error('Error marking lesson complete:', progressErr);
            } else {
              console.log('✅ Lesson marked as complete:', quizData.lesson_id);
              console.log('Progress data:', progressData);
            }
          } else {
            // Quiz doesn't have lesson_id - it's a standalone module quiz
            // Find the module_content_item for this quiz and mark the module as complete
            console.log('⚠️ Quiz has no lesson_id - checking for module completion...');
            
            const { data: contentItem } = await supabase
              .from('module_content_items')
              .select('module_id')
              .eq('content_id', quizMeta.id)
              .eq('content_type', 'quiz')
              .single();

            if (contentItem) {
              console.log('Quiz found in module:', contentItem.module_id);
              // Note: Module-level completion tracking would go here
              // For now, we just log that the quiz was passed
              console.log('✅ Quiz passed - module completion tracking not yet implemented');
            }
          }
        } catch (err) {
          console.error('Unexpected error in lesson completion:', err);
        }
      } else {
        console.log('⚠️ Quiz not passed, lesson not marked complete. Score:', passed);
      }

      // Navigate to result page
      navigate(`/student/courses/${courseId}/quizzes/${quizId}/result`, {
        state: {
          score: scorePercent,
          correctCount,
          totalQuestions: questions.length,
          passingScore: quizMeta.passing_score,
          questions,
          userAnswers: selectedAnswers,
          passed,
        },
      });
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setSubmitting(false);
    }
  }, [quizMeta, user, submitting, questions, selectedAnswers, courseId, quizId, navigate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // DEBUG: Log render state
  console.log('=== RENDER DEBUG ===');
  console.log('loading:', loading);
  console.log('quizMeta:', quizMeta);
  console.log('questions.length:', questions.length);
  console.log('=== END RENDER DEBUG ===');

  if (loading) {
    return (
      <StudentAppLayout>
        <div className="min-h-screen bg-[color:var(--bg-primary)] flex items-center justify-center">
          <p className="text-text-secondary">Loading quiz...</p>
        </div>
      </StudentAppLayout>
    );
  }

  if (!quizMeta || questions.length === 0) {
    console.log('SHOWING "NO QUESTIONS" SCREEN');
    console.log('quizMeta is null?', !quizMeta);
    console.log('questions.length is 0?', questions.length === 0);
    return (
      <StudentAppLayout>
        <div className="min-h-screen bg-[color:var(--bg-primary)] flex items-center justify-center">
          <div className="text-center">
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

  return (
    <StudentAppLayout>
      <div className="min-h-screen bg-[color:var(--bg-primary)] py-8 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Top bar */}
          <div className="glass-card rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-text-primary">{quizMeta.title}</h1>
              {timeRemaining !== null && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${timeRemaining < 60 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-[color:var(--bg-tertiary)]'}`}>
                  <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={`text-sm font-medium ${timeRemaining < 60 ? 'text-red-600 dark:text-red-400' : 'text-text-secondary'}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}
            </div>
            <QuestionProgressBar currentIndex={currentQuestionIndex} total={questions.length} />
          </div>

          {/* Question card */}
          <div className="glass-card rounded-3xl p-8 mb-6">
            {currentQuestion.type === 'multiple-choice' && (
              <QuestionMultipleChoice
                question={{...currentQuestion, options: currentQuestion.options || []}}
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
                question={{...currentQuestion, options: (currentQuestion.options || []).map(o => ({id: o.id, label: o.label, imageUrl: o.imageUrl || ''}))}}
                selectedOptionId={selectedAnswers[currentQuestion.id] as string}
                onSelect={handleAnswerSelect}
              />
            )}
          </div>

          {/* Navigation controls */}
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
                Exit quiz
              </button>
              {isLastQuestion ? (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-8 py-3 rounded-full font-semibold bg-gradient-to-r from-brand-neon to-brand-electric text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit quiz'}
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
};

export default QuizSession;
