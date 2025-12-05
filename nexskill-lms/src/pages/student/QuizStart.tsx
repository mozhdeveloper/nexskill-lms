import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';

const QuizStart: React.FC = () => {
  const navigate = useNavigate();
  const { courseId, quizId } = useParams();

  // Dummy quiz metadata
  const quizData = {
    title: 'Module 2 Knowledge Check',
    courseName: 'Advanced React Patterns',
    moduleName: 'State Management',
    numQuestions: 10,
    timeMinutes: 15,
    passingScore: 70,
    description: 'Test your understanding of state management concepts including React Context, useReducer, and advanced patterns for managing complex application state.',
  };

  const handleStartQuiz = () => {
    navigate(`/student/courses/${courseId}/quizzes/${quizId}/take`);
  };

  const handleReviewLesson = () => {
    console.log('Review lesson clicked');
    navigate(`/student/courses/${courseId}`);
  };

  return (
    <StudentAppLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#E7F0FF] via-[#F9F0FF] to-[#E3F4FF] py-8 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Back link */}
          <button
            onClick={() => navigate(`/student/courses/${courseId}`)}
            className="flex items-center gap-2 text-slate-600 hover:text-[#304DB5] mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to course
          </button>

          {/* Hero card */}
          <div className="bg-white dark:bg-dark-background-card rounded-3xl shadow-xl p-8">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {quizData.title}
              </h1>
              <div className="text-slate-600">
                {quizData.courseName} • {quizData.moduleName}
              </div>
            </div>

            {/* Metadata row */}
            <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#304DB5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium text-slate-700">
                  {quizData.numQuestions} questions
                </span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#304DB5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-slate-700">
                  {quizData.timeMinutes} minutes
                </span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#304DB5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-slate-700">
                  Pass: {quizData.passingScore}% or higher
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="font-semibold text-slate-900 mb-2">About this quiz</h3>
              <p className="text-slate-700 leading-relaxed">
                {quizData.description}
              </p>
            </div>

            {/* Checklist */}
            <div className="bg-blue-50 rounded-2xl p-6 mb-8">
              <h3 className="font-semibold text-slate-900 mb-3">Before you begin:</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-slate-700">
                    You can review detailed feedback after completing the quiz.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-slate-700">
                    This quiz does not affect your real certification yet.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-slate-700">
                    You can retake the quiz as many times as you need.
                  </span>
                </li>
              </ul>
            </div>

            {/* CTA buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleStartQuiz}
                className="flex-1 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold py-4 px-8 rounded-full hover:shadow-lg transition-all"
              >
                Start quiz
              </button>
              <button
                onClick={handleReviewLesson}
                className="px-8 py-4 rounded-full font-semibold text-[#304DB5] border-2 border-[#304DB5] hover:bg-blue-50 transition-all"
              >
                Review lesson first
              </button>
            </div>
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default QuizStart;
