import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import QuestionFeedback from '../../components/quiz/QuestionFeedback';

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

  // Fallback to dummy data if state is missing
  const {
    score = 80,
    correctCount = 8,
    totalQuestions = 10,
    passingScore = 70,
    questions = [],
    userAnswers = {},
  } = state || {};

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

  return (
    <StudentAppLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] py-8 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Score summary hero card */}
          <div className="bg-white dark:bg-dark-background-card rounded-3xl shadow-xl p-8 mb-8 text-center">
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
              <div className="text-6xl font-bold text-slate-900 mb-2">{score}%</div>
              <p className="text-lg text-slate-600">
                You answered <span className="font-semibold text-slate-900">{correctCount}</span> out of{' '}
                <span className="font-semibold text-slate-900">{totalQuestions}</span> questions correctly.
              </p>
            </div>

            {/* Breakdown */}
            <div className="flex justify-center gap-8 mb-6 pt-6 border-t border-slate-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">{correctCount}</div>
                <div className="text-sm text-slate-600">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-1">{incorrectCount}</div>
                <div className="text-sm text-slate-600">Incorrect</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-400 mb-1">{passingScore}%</div>
                <div className="text-sm text-slate-600">Passing Score</div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleRetry}
                className="px-8 py-3 rounded-full font-semibold bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white shadow-lg hover:shadow-xl transition-all"
              >
                Retry quiz
              </button>
              <button
                onClick={handleBackToCourse}
                className="px-8 py-3 rounded-full font-semibold text-[#304DB5] border-2 border-[#304DB5] hover:bg-blue-50 transition-all"
              >
                Back to course
              </button>
            </div>
          </div>

          {/* Detailed feedback section */}
          {questions.length > 0 && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Question-by-question feedback</h2>
                <p className="text-slate-600">
                  Review your answers and learn from detailed explanations below.
                </p>
              </div>

              <div className="space-y-4">
                {feedbackData.map((item, index) => (
                  <div key={item.question.id}>
                    <div className="text-sm font-semibold text-slate-500 mb-2">
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
              className="text-slate-600 hover:text-[#304DB5] font-medium transition-colors"
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
