import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import QuestionFeedback from '../../components/quiz/QuestionFeedback';
import { supabase } from '../../lib/supabaseClient';

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
  const [loadingDb, setLoadingDb] = useState(!state);

  // If no state (page refresh), fetch the latest attempt from DB
  useEffect(() => {
    if (state || !quizId) return;
    const fetchLatestAttempt = async () => {
      try {
        setLoadingDb(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

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

        const { data: quiz } = await supabase
          .from('quizzes')
          .select('passing_score')
          .eq('id', quizId)
          .single();
        if (quiz) setDbPassing(quiz.passing_score || 70);
      } catch (err) {
        console.error('Error fetching quiz result:', err);
      } finally {
        setLoadingDb(false);
      }
    };
    fetchLatestAttempt();
  }, [quizId, state]);

  const score = state?.score ?? dbScore ?? 0;
  const correctCount = state?.correctCount ?? dbCorrect ?? 0;
  const totalQuestions = state?.totalQuestions ?? dbTotal ?? 0;
  const passingScore = state?.passingScore ?? dbPassing ?? 70;
  const questions = state?.questions ?? [];
  const userAnswers = state?.userAnswers ?? {};

  const passed = score >= passingScore;
  const incorrectCount = totalQuestions - correctCount;

  const handleRetry = () => {
    navigate(`/student/courses/${courseId}/quizzes/${quizId}/take`);
  };

  const handleBackToCourse = () => {
    navigate(`/student/courses/${courseId}`);
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

  if (loadingDb) {
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
              <div
                className={`
                  inline-flex px-4 py-2 rounded-full text-sm font-semibold mb-4
                  ${passed ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}
                `}
              >
                {passed ? '✓ Passed' : '⚠ Needs Review'}
              </div>
            </div>

            <div className="mb-4">
              <div className="text-6xl font-bold text-text-primary mb-2">{score}%</div>
              <p className="text-lg text-text-secondary">
                You answered <span className="font-semibold text-text-primary">{correctCount}</span> out of{' '}
                <span className="font-semibold text-text-primary">{totalQuestions}</span> questions correctly.
              </p>
            </div>

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
              <div className="text-center">
                <div className="text-3xl font-bold text-text-muted mb-1">{passingScore}%</div>
                <div className="text-sm text-text-secondary">Passing Score</div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleRetry}
                className="px-8 py-3 rounded-full font-semibold bg-gradient-to-r from-brand-neon to-brand-electric text-white shadow-lg hover:shadow-xl transition-all"
              >
                Retry quiz
              </button>
              <button
                onClick={handleBackToCourse}
                className="px-8 py-3 rounded-full font-semibold text-brand-primary border-2 border-brand-primary hover:bg-brand-primary/5 transition-all"
              >
                Back to course
              </button>
            </div>
          </div>

          {/* Detailed feedback section */}
          {questions.length > 0 && (
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
              ← Return to course overview
            </button>
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default QuizResult;
