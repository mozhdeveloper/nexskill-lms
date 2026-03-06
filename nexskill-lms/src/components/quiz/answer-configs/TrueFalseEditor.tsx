import React from "react";
import type { TrueFalseConfig } from "../../../types/quiz";

interface TrueFalseEditorProps {
    config: TrueFalseConfig;
    onChange: (config: TrueFalseConfig) => void;
}

const TrueFalseEditor: React.FC<TrueFalseEditorProps> = ({
    config,
    onChange,
}) => {
    return (
        <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Correct Answer
            </h4>

            <div className="flex gap-4">
                <label
                    className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all flex-1
                    {config.correct_answer
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }"
                >
                    <input
                        type="radio"
                        checked={config.correct_answer === true}
                        onChange={() => onChange({ correct_answer: true })}
                        className="w-5 h-5 text-green-600 focus:ring-green-500"
                    />
                    <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                            True
                        </div>
                        {config.correct_answer && (
                            <div className="text-xs text-green-600 dark:text-green-400">
                                ✓ Correct Answer
                            </div>
                        )}
                    </div>
                </label>

                <label
                    className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all flex-1
                    {!config.correct_answer
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }"
                >
                    <input
                        type="radio"
                        checked={config.correct_answer === false}
                        onChange={() => onChange({ correct_answer: false })}
                        className="w-5 h-5 text-green-600 focus:ring-green-500"
                    />
                    <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                            False
                        </div>
                        {!config.correct_answer && (
                            <div className="text-xs text-green-600 dark:text-green-400">
                                ✓ Correct Answer
                            </div>
                        )}
                    </div>
                </label>
            </div>
        </div>
    );
};

export default TrueFalseEditor;
