import React from "react";
import { Edit2, Check } from "lucide-react";
import type { Quiz } from "../../types/quiz";

interface QuizHeaderProps {
    quiz: Quiz;
    isEditing: boolean;
    onToggleEdit: () => void;
    title: string;
    description: string;
    instructions: string;
    onTitleChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onInstructionsChange: (value: string) => void;
    onBlur: (field: keyof Quiz, value: string) => void;
}

const QuizHeader: React.FC<QuizHeaderProps> = ({
    quiz,
    isEditing,
    onToggleEdit,
    title,
    description,
    instructions,
    onTitleChange,
    onDescriptionChange,
    onInstructionsChange,
    onBlur,
}) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Quiz Information
                </h3>
                <button
                    onClick={onToggleEdit}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
                >
                    {isEditing ? (
                        <>
                            <Check className="w-4 h-4" />
                            Done
                        </>
                    ) : (
                        <>
                            <Edit2 className="w-4 h-4" />
                            Edit
                        </>
                    )}
                </button>
            </div>

            {isEditing ? (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Quiz Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => onTitleChange(e.target.value)}
                            onBlur={() => onBlur("title", title)}
                            placeholder="Enter quiz title..."
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) =>
                                onDescriptionChange(e.target.value)
                            }
                            onBlur={() => onBlur("description", description)}
                            placeholder="Brief description of the quiz..."
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Instructions for Students
                        </label>
                        <textarea
                            value={instructions}
                            onChange={(e) =>
                                onInstructionsChange(e.target.value)
                            }
                            onBlur={() => onBlur("instructions", instructions)}
                            placeholder="Provide instructions for students..."
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <div>
                        <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                            {quiz.title || "Untitled Quiz"}
                        </h4>
                        {quiz.description && (
                            <p className="text-gray-600 dark:text-gray-400">
                                {quiz.description}
                            </p>
                        )}
                    </div>

                    {quiz.instructions && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                                Instructions:
                            </p>
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                {quiz.instructions}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default QuizHeader;
