import React from "react";
import type { ParagraphConfig } from "../../../types/quiz";

interface ParagraphEditorProps {
    config: ParagraphConfig;
    onChange: (config: ParagraphConfig) => void;
}

const ParagraphEditor: React.FC<ParagraphEditorProps> = ({
    config,
    onChange,
}) => {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Placeholder
                </label>
                <input
                    type="text"
                    value={config.placeholder || "Type your answer..."}
                    onChange={(e) =>
                        onChange({
                            ...config,
                            placeholder: e.target.value,
                        })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Maximum Length (characters)
                </label>
                <input
                    type="number"
                    min={100}
                    value={config.max_length || 2000}
                    onChange={(e) =>
                        onChange({
                            ...config,
                            max_length: parseInt(e.target.value, 10) || 2000,
                        })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                />
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    Paragraph questions are open-ended and typically require manual grading.
                </p>
            </div>
        </div>
    );
};

export default ParagraphEditor;
