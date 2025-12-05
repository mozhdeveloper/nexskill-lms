import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import QuestionProgressBar from '../../components/quiz/QuestionProgressBar';
import QuestionMultipleChoice from '../../components/quiz/QuestionMultipleChoice';
import QuestionTrueFalse from '../../components/quiz/QuestionTrueFalse';
import QuestionImageChoice from '../../components/quiz/QuestionImageChoice';

// Dummy quiz data
const dummyQuiz = {
  id: '1',
  title: 'Module 2 Knowledge Check',
  courseName: 'Advanced React Patterns',
  moduleName: 'State Management',
  totalQuestions: 10,
  timeMinutes: 15,
  passingScore: 70,
  questions: [
    {
      id: 'q1',
      type: 'multiple-choice' as const,
      questionText: 'What is the primary purpose of React Context API?',
      options: [
        { id: 'a', label: 'To manage component lifecycle', helperText: 'Lifecycle is managed by hooks and class methods' },
        { id: 'b', label: 'To share data across components without prop drilling', helperText: 'Correct - Context provides global state' },
        { id: 'c', label: 'To optimize rendering performance', helperText: 'That\'s more related to React.memo' },
        { id: 'd', label: 'To handle routing in applications', helperText: 'That\'s React Router\'s job' },
      ],
      correctOptionId: 'b',
      explanation: 'React Context API is designed to share data that can be considered"global" for a tree of React components, avoiding prop drilling.',
    },
    {
      id: 'q2',
      type: 'true-false' as const,
      questionText: 'useReducer is always better than useState for managing state.',
      correctAnswer: false,
      explanation: 'useReducer is better for complex state logic, but useState is simpler and more appropriate for basic state management.',
    },
    {
      id: 'q3',
      type: 'image-choice' as const,
      questionText: 'Which diagram correctly represents the React component tree structure?',
      options: [
        { id: 'img1', imageUrl: 'https://via.placeholder.com/400x300/304DB5/ffffff?text=Tree+A', label: 'Tree A' },
        { id: 'img2', imageUrl: 'https://via.placeholder.com/400x300/5E7BFF/ffffff?text=Tree+B', label: 'Tree B' },
        { id: 'img3', imageUrl: 'https://via.placeholder.com/400x300/8B9EFF/ffffff?text=Tree+C', label: 'Tree C' },
        { id: 'img4', imageUrl: 'https://via.placeholder.com/400x300/A8B8FF/ffffff?text=Tree+D', label: 'Tree D' },
      ],
      correctOptionId: 'img2',
      explanation: 'Tree B shows the correct hierarchical structure with proper parent-child relationships.',
    },
    {
      id: 'q4',
      type: 'multiple-choice' as const,
      questionText: 'Which hook should you use to store a value that persists between renders but doesn\'t trigger re-renders when changed?',
      options: [
        { id: 'a', label: 'useState' },
        { id: 'b', label: 'useEffect' },
        { id: 'c', label: 'useRef' },
        { id: 'd', label: 'useMemo' },
      ],
      correctOptionId: 'c',
      explanation: 'useRef returns a mutable ref object that persists for the full lifetime of the component without causing re-renders when mutated.',
    },
    {
      id: 'q5',
      type: 'true-false' as const,
      questionText: 'Context Providers should be placed as low as possible in the component tree to minimize unnecessary re-renders.',
      correctAnswer: true,
      explanation: 'Placing Context Providers closer to the components that need them reduces the scope of re-renders when context values change.',
    },
    {
      id: 'q6',
      type: 'multiple-choice' as const,
      questionText: 'What does the"reducer" function in useReducer accept as parameters?',
      options: [
        { id: 'a', label: 'Only the new state' },
        { id: 'b', label: 'Previous state and action' },
        { id: 'c', label: 'Component props and state' },
        { id: 'd', label: 'Action type only' },
      ],
      correctOptionId: 'b',
      explanation: 'A reducer function takes two parameters: the current state and an action object, and returns the new state.',
    },
    {
      id: 'q7',
      type: 'true-false' as const,
      questionText: 'React automatically batches multiple setState calls in event handlers for better performance.',
      correctAnswer: true,
      explanation: 'React batches state updates in event handlers to minimize re-renders. In React 18+, automatic batching extends to promises, timeouts, and native event handlers.',
    },
    {
      id: 'q8',
      type: 'multiple-choice' as const,
      questionText: 'Which pattern is recommended for updating state based on the previous state?',
      options: [
        { id: 'a', label: 'setState(newValue)' },
        { id: 'b', label: 'setState(prevState => newValue)' },
        { id: 'c', label: 'setState(this.state.value + 1)' },
        { id: 'd', label: 'Direct mutation of state' },
      ],
      correctOptionId: 'b',
      explanation: 'Using the functional form setState(prevState => ...) ensures you\'re working with the most current state, especially important with batched updates.',
    },
    {
      id: 'q9',
      type: 'image-choice' as const,
      questionText: 'Which state flow diagram represents the correct Redux-style unidirectional data flow?',
      options: [
        { id: 'flow1', imageUrl: 'https://via.placeholder.com/400x300/FF6B6B/ffffff?text=Flow+1', label: 'Flow 1' },
        { id: 'flow2', imageUrl: 'https://via.placeholder.com/400x300/4ECDC4/ffffff?text=Flow+2', label: 'Flow 2' },
        { id: 'flow3', imageUrl: 'https://via.placeholder.com/400x300/45B7D1/ffffff?text=Flow+3', label: 'Flow 3' },
        { id: 'flow4', imageUrl: 'https://via.placeholder.com/400x300/96CEB4/ffffff?text=Flow+4', label: 'Flow 4' },
      ],
      correctOptionId: 'flow2',
      explanation: 'Flow 2 correctly shows: Action → Reducer → Store → View → Action (unidirectional cycle).',
    },
    {
      id: 'q10',
      type: 'true-false' as const,
      questionText: 'When using Context, all components consuming the context will re-render whenever any part of the context value changes.',
      correctAnswer: true,
      explanation: 'This is a common performance gotcha. To optimize, you can split contexts or use memoization techniques to prevent unnecessary re-renders.',
    },
  ],
};

const QuizSession: React.FC = () => {
  const navigate = useNavigate();
  const { courseId, quizId } = useParams();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string | boolean>>({});
  const [timeRemaining] = useState(dummyQuiz.timeMinutes * 60); // seconds

  const currentQuestion = dummyQuiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === dummyQuiz.questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleAnswerSelect = (answer: string | boolean) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.id]: answer,
    });
  };

  const handleSubmit = () => {
    // Calculate score
    let correctCount = 0;
    dummyQuiz.questions.forEach((q) => {
      const userAnswer = selectedAnswers[q.id];
      let isCorrect = false;

      if (q.type === 'true-false') {
        isCorrect = userAnswer === q.correctAnswer;
      } else if (q.type === 'multiple-choice' || q.type === 'image-choice') {
        isCorrect = userAnswer === q.correctOptionId;
      }

      if (isCorrect) correctCount++;
    });

    const scorePercent = Math.round((correctCount / dummyQuiz.questions.length) * 100);

    // Navigate to result page with state
    navigate(`/student/courses/${courseId}/quizzes/${quizId}/result`, {
      state: {
        score: scorePercent,
        correctCount,
        totalQuestions: dummyQuiz.questions.length,
        passingScore: dummyQuiz.passingScore,
        questions: dummyQuiz.questions,
        userAnswers: selectedAnswers,
      },
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <StudentAppLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] py-8 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Top bar */}
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-slate-900">{dummyQuiz.title}</h1>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full">
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-slate-700">
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
            <QuestionProgressBar currentIndex={currentQuestionIndex} total={dummyQuiz.questions.length} />
          </div>

          {/* Question card */}
          <div className="bg-white rounded-3xl shadow-md p-8 mb-6">
            {currentQuestion.type === 'multiple-choice' && (
              <QuestionMultipleChoice
                question={currentQuestion}
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
                question={currentQuestion}
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
              className={`
                px-6 py-3 rounded-full font-semibold transition-all
                ${
                  isFirstQuestion
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-white text-slate-700 border-2 border-slate-300 hover:border-slate-400 shadow-sm hover:shadow'
                }
              `}
            >
              ← Previous
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/student/courses/${courseId}`)}
                className="px-6 py-3 rounded-full font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Exit quiz
              </button>
              {isLastQuestion ? (
                <button
                  onClick={handleSubmit}
                  className="px-8 py-3 rounded-full font-semibold bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white shadow-lg hover:shadow-xl transition-all"
                >
                  Submit quiz
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-8 py-3 rounded-full font-semibold bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white shadow-lg hover:shadow-xl transition-all"
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
