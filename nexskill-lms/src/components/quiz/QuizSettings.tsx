import React, { useState } from "react";
import { Settings, ChevronDown, ChevronUp } from "lucide-react";
import type { Quiz } from "../../types/quiz";

interface QuizSettingsProps {
    quiz: Quiz;
    onChange: (updates: Partial<Quiz>) => void;
}

const QuizSettings: React.FC<QuizSettingsProps> = ({ quiz, onChange }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Quiz Settings
                    </h3>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
            </button>

            {isExpanded && (
                <div className="px-6 pb-6 space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="grid grid-cols-2 gap-6">
                        {/* Passing Score */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Passing Score (%)
                            </label>
                            <input
                                type="number"
                                value={quiz.passing_score || ""}
                                onChange={(e) =>
                                    onChange({
                                        passing_score: e.target.value
                                            ? parseInt(e.target.value)
                                            : undefined,
                                    })
                                }
                                min={0}
                                max={100}
                                placeholder="Optional (e.g., 70)"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                            />
                        </div>

                        {/* Time Limit */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Time Limit (minutes)
                            </label>
                            <input
                                type="number"
                                value={quiz.time_limit_minutes || ""}
                                onChange={(e) =>
                                    onChange({
                                        time_limit_minutes: e.target.value
                                            ? parseInt(e.target.value)
                                            : undefined,
                                    })
                                }
                                min={1}
                                placeholder="Optional"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                            />
                        </div>

                        {/* Max Attempts */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Maximum Attempts
                            </label>
                            <input
                                type="number"
                                value={quiz.max_attempts || ""}
                                onChange={(e) =>
                                    onChange({
                                        max_attempts: e.target.value
                                            ? parseInt(e.target.value)
                                            : undefined,
                                    })
                                }
                                min={1}
                                placeholder="Unlimited"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                            />
                        </div>

                        {/* Late Penalty */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Late Penalty (%)
                            </label>
                            <input
                                type="number"
                                value={quiz.late_penalty_percent || ""}
                                onChange={(e) =>
                                    onChange({
                                        late_penalty_percent:
                                            parseInt(e.target.value) || 0,
                                    })
                                }
                                min={0}
                                max={100}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Date Fields */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Available From
                            </label>
                            <input
                                type="datetime-local"
                                value={
                                    quiz.available_from
                                        ? (() => {
                                            const date = new Date(
                                                quiz.available_from
                                            );
                                            const pad = (num: number) =>
                                                num.toString().padStart(2, "0");
                                            const year = date.getFullYear();
                                            const month = pad(
                                                date.getMonth() + 1
                                            );
                                            const day = pad(date.getDate());
                                            const hours = pad(date.getHours());
                                            const minutes = pad(
                                                date.getMinutes()
                                            );
                                            return `${year}-${month}-${day}T${hours}:${minutes}`;
                                        })()
                                        : ""
                                }
                                onChange={(e) => {
                                    if (!e.target.value) {
                                        onChange({ available_from: undefined });
                                        return;
                                    }
                                    const date = new Date(e.target.value);
                                    onChange({
                                        available_from: date.toISOString(),
                                    });
                                }}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Due Date
                            </label>
                            <input
                                type="datetime-local"
                                value={
                                    quiz.due_date
                                        ? (() => {
                                            const date = new Date(
                                                quiz.due_date
                                            );
                                            const pad = (num: number) =>
                                                num.toString().padStart(2, "0");
                                            const year = date.getFullYear();
                                            const month = pad(
                                                date.getMonth() + 1
                                            );
                                            const day = pad(date.getDate());
                                            const hours = pad(date.getHours());
                                            const minutes = pad(
                                                date.getMinutes()
                                            );
                                            return `${year}-${month}-${day}T${hours}:${minutes}`;
                                        })()
                                        : ""
                                }
                                onChange={(e) => {
                                    if (!e.target.value) {
                                        onChange({ due_date: undefined });
                                        return;
                                    }
                                    const date = new Date(e.target.value);
                                    onChange({
                                        due_date: date.toISOString(),
                                    });
                                }}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Checkboxes */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={quiz.late_submission_allowed}
                                onChange={(e) =>
                                    onChange({
                                        late_submission_allowed:
                                            e.target.checked,
                                    })
                                }
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                Allow late submissions
                            </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={quiz.requires_manual_grading}
                                onChange={(e) =>
                                    onChange({
                                        requires_manual_grading:
                                            e.target.checked,
                                    })
                                }
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                Requires manual grading
                            </span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={quiz.is_published}
                                onChange={(e) =>
                                    onChange({ is_published: e.target.checked })
                                }
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                Published (visible to students)
                            </span>
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizSettings;
