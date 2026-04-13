import React, { useState } from "react";
import { Settings, ChevronDown, ChevronUp, Shield, FileQuestion, ToggleLeft, ToggleRight, Lock } from "lucide-react";
import type { Quiz } from "../../types/quiz";

interface QuizSettingsProps {
    quiz: Quiz;
    onChange: (updates: Partial<Quiz>) => void;
}

const QuizSettings: React.FC<QuizSettingsProps> = ({ quiz, onChange }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Determine quiz type based on quiz_type field or fallback to requires_coach_approval
    const quizType = quiz.quiz_type || (quiz.requires_coach_approval ? "coach_reviewed" : "standard");

    const handleQuizTypeChange = (type: "standard" | "coach_reviewed") => {
        if (type === "coach_reviewed") {
            // Coach-Reviewed Quiz: Requires manual review, unlimited attempts
            onChange({
                quiz_type: "coach_reviewed",
                requires_coach_approval: true,
                attempt_control_enabled: false,
                max_attempts: undefined,
            });
        } else {
            // Standard Quiz: Auto-graded, with attempt control
            onChange({
                quiz_type: "standard",
                requires_coach_approval: false,
                attempt_control_enabled: false, // Default to OFF (1 attempt)
                max_attempts: 1, // Default to 1 attempt
            });
        }
    };

    const handleAttemptControlToggle = () => {
        const newValue = !quiz.attempt_control_enabled;
        
        if (newValue) {
            // Turn ON custom attempt control
            onChange({
                attempt_control_enabled: true,
                max_attempts: quiz.max_attempts || 3, // Default to 3 when enabling
            });
        } else {
            // Turn OFF custom attempt control (default to 1 attempt)
            onChange({
                attempt_control_enabled: false,
                max_attempts: 1,
            });
        }
    };

    const handleSkippedQuestionsToggle = () => {
        const newValue = !quiz.allow_skipped_questions;
        onChange({ allow_skipped_questions: newValue });
    };

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
                    {/* Quiz Type Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Quiz Type
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {/* Type 1: Coach-Reviewed Quiz */}
                            <button
                                type="button"
                                onClick={() => handleQuizTypeChange("coach_reviewed")}
                                className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                                    quizType === "coach_reviewed"
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400"
                                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <Shield className={`w-5 h-5 ${
                                        quizType === "coach_reviewed"
                                            ? "text-blue-600 dark:text-blue-400"
                                            : "text-gray-400"
                                    }`} />
                                    <span className={`font-semibold text-sm ${
                                        quizType === "coach_reviewed"
                                            ? "text-blue-900 dark:text-blue-300"
                                            : "text-gray-700 dark:text-gray-300"
                                    }`}>
                                        Coach-Reviewed
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Requires manual review. Students retake until passing.
                                </p>
                                {quizType === "coach_reviewed" && (
                                    <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </button>

                            {/* Type 2: Standard Quiz */}
                            <button
                                type="button"
                                onClick={() => handleQuizTypeChange("standard")}
                                className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                                    quizType === "standard"
                                        ? "border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-400"
                                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <FileQuestion className={`w-5 h-5 ${
                                        quizType === "standard"
                                            ? "text-green-600 dark:text-green-400"
                                            : "text-gray-400"
                                    }`} />
                                    <span className={`font-semibold text-sm ${
                                        quizType === "standard"
                                            ? "text-green-900 dark:text-green-300"
                                            : "text-gray-700 dark:text-gray-300"
                                    }`}>
                                        Standard
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Auto-graded. Configurable attempt limits.
                                </p>
                                {quizType === "standard" && (
                                    <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Attempt Control Toggle - Only for Standard Quiz */}
                    {quizType === "standard" && (
                        <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            Attempt Control
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {quiz.attempt_control_enabled 
                                                ? `Custom attempt limit: ${quiz.max_attempts || 3}` 
                                                : "Default: 1 attempt only"}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAttemptControlToggle}
                                    className="flex items-center gap-2 transition-colors"
                                >
                                    {quiz.attempt_control_enabled ? (
                                        <ToggleRight className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                    ) : (
                                        <ToggleLeft className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                    )}
                                    <span className={`text-sm font-medium ${
                                        quiz.attempt_control_enabled 
                                            ? "text-blue-600 dark:text-blue-400" 
                                            : "text-gray-500 dark:text-gray-400"
                                    }`}>
                                        {quiz.attempt_control_enabled ? "ON" : "OFF"}
                                    </span>
                                </button>
                            </div>
                            
                            {/* Custom Attempts Input - Only visible when enabled */}
                            {quiz.attempt_control_enabled && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
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
                                        max={100}
                                        placeholder="Enter custom limit (e.g., 3, 5)"
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Set custom number of attempts allowed
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Skipped Questions Toggle */}
                    <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                <div>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        Allow Skipped Questions
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {quiz.allow_skipped_questions 
                                            ? "Students can skip and return to questions" 
                                            : "All questions must be answered before submission"}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleSkippedQuestionsToggle}
                                className="flex items-center gap-2 transition-colors"
                            >
                                {quiz.allow_skipped_questions !== false ? (
                                    <ToggleRight className="w-8 h-8 text-green-600 dark:text-green-400" />
                                ) : (
                                    <ToggleLeft className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                )}
                                <span className={`text-sm font-medium ${
                                    quiz.allow_skipped_questions !== false
                                        ? "text-green-600 dark:text-green-400" 
                                        : "text-gray-500 dark:text-gray-400"
                                }`}>
                                    {quiz.allow_skipped_questions !== false ? "ALLOW" : "BLOCK"}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Quiz Configuration Grid */}
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

                    {/* Coach-Reviewed Info Banner */}
                    {quizType === "coach_reviewed" && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <div className="flex items-start gap-3">
                                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                                        Coach-Reviewed Quiz Mode
                                    </p>
                                    <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
                                        <li>• Students must wait for your review after submission</li>
                                        <li>• Unlimited attempts - students retake until they pass</li>
                                        <li>• You can provide detailed feedback on each attempt</li>
                                        <li>• Next lesson unlocks automatically when you approve</li>
                                        <li>• Students see status: Pending Review / Passed / Needs Retake</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Standard Quiz Info Banner */}
                    {quizType === "standard" && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="flex items-start gap-3">
                                <FileQuestion className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-green-900 dark:text-green-300 mb-1">
                                        Standard Quiz Mode
                                    </p>
                                    <ul className="text-xs text-green-800 dark:text-green-400 space-y-1">
                                        <li>• Auto-graded immediately upon submission</li>
                                        <li>• {quiz.attempt_control_enabled ? `Custom attempt limit: ${quiz.max_attempts || 3}` : "Default: 1 attempt only"}</li>
                                        <li>• Students pass/fail based on passing score threshold</li>
                                        <li>• Next lesson unlocks automatically on pass</li>
                                        {quiz.allow_skipped_questions === false && (
                                            <li>• All questions must be answered before submission</li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default QuizSettings;
