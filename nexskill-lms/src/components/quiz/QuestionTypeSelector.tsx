import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { QuestionType } from "../../types/quiz";

interface QuestionTypeSelectorProps {
    type: QuestionType;
    onChange: (type: QuestionType) => void;
}

const QuestionTypeSelector: React.FC<QuestionTypeSelectorProps> = ({
    type,
    onChange,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const types: { value: QuestionType; label: string; description: string }[] =
        [
            {
                value: "multiple_choice",
                label: "Multiple Choice",
                description: "Students select one or more options",
            },
            {
                value: "true_false",
                label: "True/False",
                description: "Simple true or false question",
            },
            {
                value: "short_answer",
                label: "Short Answer",
                description: "Brief text response",
            },
            {
                value: "essay",
                label: "Essay",
                description: "Extended written response",
            },
            {
                value: "file_upload",
                label: "File Upload",
                description: "Students upload file(s)",
            },
            {
                value: "video_submission",
                label: "Video Submission",
                description: "Students upload video response",
            },
        ];

    const currentType = types.find((t) => t.value === type);

    return (
        <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Question Type
            </label>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white hover:border-gray-400 transition-colors"
            >
                <div className="text-left">
                    <div className="font-medium">{currentType?.label}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {currentType?.description}
                    </div>
                </div>
                <ChevronDown
                    className={`w-5 h-5 transition-transform ${
                        isOpen ? "rotate-180" : ""
                    }`}
                />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20 max-h-96 overflow-y-auto">
                        {types.map((t) => (
                            <button
                                key={t.value}
                                onClick={() => {
                                    onChange(t.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex flex-col px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left ${
                                    type === t.value
                                        ? "bg-blue-50 dark:bg-blue-900/20"
                                        : ""
                                }`}
                            >
                                <div className="font-medium text-gray-900 dark:text-white">
                                    {t.label}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {t.description}
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default QuestionTypeSelector;
