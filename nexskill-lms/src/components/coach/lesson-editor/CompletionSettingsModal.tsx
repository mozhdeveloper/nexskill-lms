import React, { useState } from 'react';
import { X, Clock, HelpCircle, CheckSquare } from 'lucide-react';
import type { CompletionCriteria } from '../../../types/lesson';

interface CompletionSettingsModalProps {
    currentCriteria?: CompletionCriteria;
    onSave: (criteria: CompletionCriteria) => void;
    onClose: () => void;
    hasQuiz?: boolean; // If there's a quiz content block or linked quiz
}

const CompletionSettingsModal: React.FC<CompletionSettingsModalProps> = ({
    currentCriteria = { type: 'view' },
    onSave,
    onClose,
    hasQuiz = false
}) => {
    const [type, setType] = useState<CompletionCriteria['type']>(currentCriteria.type);
    const [minTime, setMinTime] = useState(
        currentCriteria.type === 'view' ? currentCriteria.min_time_seconds || 0 : 0
    );
    // Quiz specific stats would go here if we supported selecting specific quizzes, 
    // but for now keeping it simple based on lesson type

    const handleSave = () => {
        if (type === 'view') {
            onSave({ type: 'view', min_time_seconds: minTime });
        } else if (type === 'manual') {
            onSave({ type: 'manual' });
        } else {
            // Validation for quiz could go here
            onSave({ type: 'quiz' });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Completion Settings</h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                            When is this lesson marked complete?
                        </label>

                        <div className="space-y-3">
                            <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${type === 'view'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                }`}>
                                <input
                                    type="radio"
                                    name="completionType"
                                    checked={type === 'view'}
                                    onChange={() => setType('view')}
                                    className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                                        <Clock className="w-4 h-4" />
                                        Student views lesson
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Lesson completes after student spends time on page
                                    </p>

                                    {type === 'view' && (
                                        <div className="mt-3">
                                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1.5">
                                                Minimum time (seconds)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={minTime}
                                                onChange={(e) => setMinTime(parseInt(e.target.value) || 0)}
                                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:border-blue-500 focus:outline-none transition-colors"
                                                placeholder="e.g. 60"
                                            />
                                            <p className="text-[10px] text-gray-400 mt-1">Set 0 for immediate completion on load</p>
                                        </div>
                                    )}
                                </div>
                            </label>

                            <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${type === 'manual'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                }`}>
                                <input
                                    type="radio"
                                    name="completionType"
                                    checked={type === 'manual'}
                                    onChange={() => setType('manual')}
                                    className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                                        <CheckSquare className="w-4 h-4" />
                                        Manual check
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Student must click a "Mark as Complete" button
                                    </p>
                                </div>
                            </label>

                            {/* Quiz option - disabled if not applicable, or enabled if generalized */}
                            <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all opacity-50 ${type === 'quiz'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700' // Keeping it simple/disabled for now as logic is complex
                                }`}>
                                <input
                                    type="radio"
                                    name="completionType"
                                    checked={type === 'quiz'}
                                    onChange={() => setType('quiz')}
                                    disabled={!hasQuiz} // Only allow if has quiz
                                    className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                                        <HelpCircle className="w-4 h-4" />
                                        Pass a quiz
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Requires passing score on associated quiz (Coming Soon)
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                    >
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CompletionSettingsModal;
