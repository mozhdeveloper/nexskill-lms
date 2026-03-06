import React from "react";
import { X, Clock, Award } from "lucide-react";
import ContentBlockDisplay from "../shared/ContentBlockDisplay";
import type { Quiz, QuizQuestion } from "../../types/quiz";

interface QuizPreviewProps {
    quiz: Quiz;
    questions: QuizQuestion[];
    onExitPreview: () => void;
}

const QuizPreview: React.FC<QuizPreviewProps> = ({
    quiz,
    questions,
    onExitPreview,
}) => {
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

    return (
        <div className="fixed inset-0 bg-gray-50 dark:bg-slate-900 z-50 overflow-y-auto">
            {/* Preview Header */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded">
                                    Preview Mode
                                </span>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {quiz.title || "Untitled Quiz"}
                            </h1>
                        </div>
                        <button
                            onClick={onExitPreview}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                            Exit Preview
                        </button>
                    </div>
                </div>
            </div>

            {/* Quiz Content */}
            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* Quiz Info */}
                <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    {quiz.description && (
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {quiz.description}
                        </p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Award className="w-4 h-4" />
                            <span>{totalPoints} points total</span>
                        </div>
                        {quiz.time_limit_minutes && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <Clock className="w-4 h-4" />
                                <span>{quiz.time_limit_minutes} minutes</span>
                            </div>
                        )}
                        {quiz.passing_score && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                <Award className="w-4 h-4" />
                                <span>{quiz.passing_score}% to pass</span>
                            </div>
                        )}
                    </div>

                    {quiz.instructions && (
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                                Instructions:
                            </p>
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                {quiz.instructions}
                            </p>
                        </div>
                    )}
                </div>

                {/* Questions */}
                <div className="space-y-6">
                    {questions.map((question, index) => (
                        <div
                            key={question.id}
                            className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
                        >
                            {/* Question Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-semibold">
                                        {index + 1}
                                    </span>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            Question {index + 1}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {question.points} point
                                            {question.points !== 1 ? "s" : ""}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Question Content */}
                            <div className="mb-6 space-y-4">
                                {question.question_content.map((block) => (
                                    <ContentBlockDisplay
                                        key={block.id}
                                        block={block}
                                    />
                                ))}
                            </div>

                            {/* Answer Preview (Placeholder) */}
                            <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                                    Answer input would appear here for students
                                    ({question.question_type})
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {questions.length === 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                        <p className="text-gray-500 dark:text-gray-400">
                            No questions added yet
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizPreview;
