import React, { useState, useCallback, useRef } from "react";
import type { EssayConfig } from "../../../types/quiz";

interface EssayEditorProps {
    config: EssayConfig;
    onChange: (config: EssayConfig) => void;
}

const EssayEditor: React.FC<EssayEditorProps> = ({ config, onChange }) => {
    // Use refs to track focus state to avoid overwriting during active editing
    const minWordsFocusedRef = useRef(false);
    const maxWordsFocusedRef = useRef(false);
    const rubricFocusedRef = useRef(false);

    // Local state for all input fields to prevent re-renders on every keystroke
    const [localMinWords, setLocalMinWords] = useState<string>(
        config.min_words?.toString() || ""
    );
    const [localMaxWords, setLocalMaxWords] = useState<string>(
        config.max_words?.toString() || ""
    );
    const [localRubric, setLocalRubric] = useState(config.rubric || "");

    // Display values: use local state when focused, parent state when not focused
    const displayMinWords = minWordsFocusedRef.current
        ? localMinWords
        : config.min_words?.toString() || "";
    const displayMaxWords = maxWordsFocusedRef.current
        ? localMaxWords
        : config.max_words?.toString() || "";
    const displayRubric = rubricFocusedRef.current
        ? localRubric
        : config.rubric || "";

    const handleMinWordsFocus = useCallback(() => {
        minWordsFocusedRef.current = true;
        setLocalMinWords(config.min_words?.toString() || "");
    }, [config.min_words]);

    const handleMinWordsBlur = useCallback(() => {
        minWordsFocusedRef.current = false;
        const newValue = localMinWords ? parseInt(localMinWords) : undefined;
        if (newValue !== config.min_words) {
            onChange({ ...config, min_words: newValue });
        }
    }, [localMinWords, config, onChange]);

    const handleMaxWordsFocus = useCallback(() => {
        maxWordsFocusedRef.current = true;
        setLocalMaxWords(config.max_words?.toString() || "");
    }, [config.max_words]);

    const handleMaxWordsBlur = useCallback(() => {
        maxWordsFocusedRef.current = false;
        const newValue = localMaxWords ? parseInt(localMaxWords) : undefined;
        if (newValue !== config.max_words) {
            onChange({ ...config, max_words: newValue });
        }
    }, [localMaxWords, config, onChange]);

    const handleRubricFocus = useCallback(() => {
        rubricFocusedRef.current = true;
        setLocalRubric(config.rubric || "");
    }, [config.rubric]);

    const handleRubricBlur = useCallback(() => {
        rubricFocusedRef.current = false;
        if (localRubric !== (config.rubric || "")) {
            onChange({ ...config, rubric: localRubric });
        }
    }, [localRubric, config, onChange]);

    return (
        <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    ℹ️ Essay questions always require manual grading
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Minimum Words
                    </label>
                    <input
                        type="number"
                        value={displayMinWords}
                        onChange={(e) => setLocalMinWords(e.target.value)}
                        onFocus={handleMinWordsFocus}
                        onBlur={handleMinWordsBlur}
                        min={0}
                        placeholder="Optional"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Maximum Words
                    </label>
                    <input
                        type="number"
                        value={displayMaxWords}
                        onChange={(e) => setLocalMaxWords(e.target.value)}
                        onFocus={handleMaxWordsFocus}
                        onBlur={handleMaxWordsBlur}
                        min={0}
                        placeholder="Optional"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Grading Rubric
                </label>
                <textarea
                    value={displayRubric}
                    onChange={(e) => setLocalRubric(e.target.value)}
                    onFocus={handleRubricFocus}
                    onBlur={handleRubricBlur}
                    placeholder="Define the criteria for grading this essay..."
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    This rubric will help graders evaluate student responses
                    consistently
                </p>
            </div>
        </div>
    );
};

export default EssayEditor;
