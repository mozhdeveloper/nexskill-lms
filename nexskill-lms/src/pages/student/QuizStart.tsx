import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

interface QuizData {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  passing_score: number | null;
  time_limit_minutes: number | null;
  max_attempts: number | null;
  questionCount: number;
}

const QuizStart: React.FC = () => {
  const navigate = useNavigate();
  const { courseId, quizId } = useParams();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [attemptCount, setAttemptCount] = useState(0);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!quizId || !user) return;
      try {
        // Fetch quiz metadata
        const { data: quizRow, error: qError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .single();

        if (qError) throw qError;

        // Fetch question count
        const { count, error: countErr } = await supabase
          .from('quiz_questions')
          .select('id', { count: 'exact', head: true })
          .eq('quiz_id', quizId);

        if (countErr) throw countErr;

        // Fetch existing attempts
        const { count: attempts, error: attErr } = await supabase
          .from('quiz_attempts')
          .select('id', { count: 'exact', head: true })
          .eq('quiz_id', quizId)
          .eq('user_id', user.id);

        if (attErr) throw attErr;

        setQuiz({
          id: quizRow.id,
          title: quizRow.title,
          description: quizRow.description,
          instructions: quizRow.instructions,
          passing_score: quizRow.passing_score,
          time_limit_minutes: quizRow.time_limit_minutes,
          max_attempts: quizRow.max_attempts,
          questionCount: count || 0,
        });
        setAttemptCount(attempts || 0);
      } catch (err) {
        console.error('Error fetching quiz:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId, user]);

  const handleStartQuiz = () => {
    navigate(`/student/courses/${courseId}/quizzes/${quizId}/take`);
  };

  const handleReviewLesson = () => {
    navigate(`/student/courses/${courseId}`);
  };

  const maxReached = quiz?.max_attempts ? attemptCount >= quiz.max_attempts : false;

  return (
    <StudentAppLayout>
      <div className="min-h-screen bg-[color:var(--bg-primary)] py-8 px-6">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate(`/student/courses/${courseId}`)}
            className="flex items-center gap-2 text-text-secondary hover:text-brand-primary mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to course
          </button>

          <div className="glass-card rounded-3xl p-8">
            {loading ? (
              <p className="text-text-secondary text-center py-8">Loading quiz...</p>
            ) : !quiz ? (
              <p className="text-text-secondary text-center py-8">Quiz not found.</p>
            ) : (
              <>
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-text-primary mb-2">{quiz.title}</h1>
                </div>

                <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b border-[color:var(--border-base)]">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-secondary">📝 {quiz.questionCount} questions</span>
                  </div>
                  {quiz.time_limit_minutes && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-secondary">⏱ {quiz.time_limit_minutes} minutes</span>
                    </div>
                  )}
                  {quiz.passing_score && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-secondary">✅ Pass: {quiz.passing_score}%</span>
                    </div>
                  )}
                  {quiz.max_attempts && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-secondary">🔄 Attempts: {attemptCount}/{quiz.max_attempts}</span>
                    </div>
                  )}
                </div>

                {quiz.description && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-text-primary mb-2">About this quiz</h3>
                    <p className="text-text-secondary leading-relaxed">{quiz.description}</p>
                  </div>
                )}

                {quiz.instructions && (
                  <div className="mb-6 p-4 bg-brand-primary/5 rounded-2xl">
                    <h3 className="font-semibold text-text-primary mb-2">Instructions</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">{quiz.instructions}</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={handleStartQuiz}
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
                    onClick={handleReviewLesson}
                    className="px-8 py-4 rounded-full font-semibold text-brand-primary border-2 border-brand-primary hover:bg-brand-primary/5 transition-all"
                  >
                    Review lesson first
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default QuizStart;
