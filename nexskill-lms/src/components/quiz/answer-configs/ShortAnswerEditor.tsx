import React from "react";
import { Plus, Trash2 } from "lucide-react";
import type { ShortAnswerConfig } from "../../../types/quiz";

interface ShortAnswerEditorProps {
    config: ShortAnswerConfig;
    onChange: (config: ShortAnswerConfig) => void;
}

const ShortAnswerEditor: React.FC<ShortAnswerEditorProps> = ({
    config,
    onChange,
}) => {
    const addAcceptedAnswer = () => {
        onChange({
            ...config,
            accepted_answers: [...(config.accepted_answers || []), ""],
        });
    };

    const removeAcceptedAnswer = (index: number) => {
        onChange({
            ...config,
            accepted_answers: config.accepted_answers?.filter(
                (_, i) => i !== index
            ),
        });
    };

    const updateAcceptedAnswer = (index: number, value: string) => {
        const updated = [...(config.accepted_answers || [])];
        updated[index] = value;
        onChange({ ...config, accepted_answers: updated });
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Maximum Length (characters)
                </label>
                <input
                    type="number"
                    value={config.max_length || 500}
                    onChange={(e) =>
                        onChange({
                            ...config,
                            max_length: parseInt(e.target.value) || 500,
                        })
                    }
                    min={1}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                />
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Accepted Answers (for auto-grading)
                    </label>
                    <button
                        onClick={addAcceptedAnswer}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add Answer
                    </button>
                </div>

                {!config.accepted_answers ||
                config.accepted_answers.length === 0 ? (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            ⚠️ No accepted answers defined. This question will
                            require manual grading.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {config.accepted_answers.map((answer, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2"
                            >
                                <input
                                    type="text"
                                    value={answer}
                                    onChange={(e) =>
                                        updateAcceptedAnswer(
                                            index,
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter accepted answer..."
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                                />
                                <button
                                    onClick={() => removeAcceptedAnswer(index)}
                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                    title="Remove answer"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    checked={config.case_sensitive || false}
                    onChange={(e) =>
                        onChange({
                            ...config,
                            case_sensitive: e.target.checked,
                        })
                    }
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                    Case sensitive matching
                </span>
            </label>
        </div>
    );
};

export default ShortAnswerEditor;
