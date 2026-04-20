import React, { useCallback, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import type { DropdownConfig } from "../../../types/quiz";

interface DropdownEditorProps {
    config: DropdownConfig;
    onChange: (config: DropdownConfig) => void;
}

const generateId = () =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

interface OptionInputProps {
    option: { id: string; text: string; is_correct: boolean; is_other?: boolean };
    index: number;
    onTextChange: (id: string, text: string) => void;
    onToggleCorrect: (id: string) => void;
    onRemove: (id: string) => void;
    canRemove: boolean;
}

const OptionInput: React.FC<OptionInputProps> = React.memo(({
    option,
    index,
    onTextChange,
    onToggleCorrect,
    onRemove,
    canRemove,
}) => {
    const isFocusedRef = useRef(false);
    const [localText, setLocalText] = useState(option.text);
    const displayValue = isFocusedRef.current ? localText : option.text;

    const handleFocus = useCallback(() => {
        isFocusedRef.current = true;
        setLocalText(option.text);
    }, [option.text]);

    const handleBlur = useCallback(() => {
        isFocusedRef.current = false;
        if (!option.is_other && localText !== option.text) {
            onTextChange(option.id, localText);
        }
    }, [localText, option.text, option.id, onTextChange, option.is_other]);

    return (
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg group">
            <label className="flex items-center cursor-pointer">
                <input
                    type="radio"
                    checked={option.is_correct}
                    onChange={() => onToggleCorrect(option.id)}
                    className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                {option.is_correct && (
                    <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                        Correct
                    </span>
                )}
            </label>

            <input
                type="text"
                value={displayValue}
                onChange={(e) => setLocalText(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                readOnly={option.is_other}
                placeholder={`Option ${index + 1}`}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white read-only:bg-gray-100 dark:read-only:bg-slate-900"
            />

            {canRemove && (
                <button
                    onClick={() => onRemove(option.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove option"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </div>
    );
});

OptionInput.displayName = "DropdownOptionInput";

const DropdownEditor: React.FC<DropdownEditorProps> = ({ config, onChange }) => {
    const safeOptions = config.options || [];

    const addOption = useCallback(() => {
        onChange({
            ...config,
            options: [
                ...safeOptions,
                { id: generateId(), text: "", is_correct: false },
            ],
        });
    }, [config, onChange, safeOptions]);

    const addOtherOption = useCallback(() => {
        if (safeOptions.some((opt) => opt.is_other)) return;
        onChange({
            ...config,
            options: [
                ...safeOptions,
                { id: generateId(), text: "Other", is_correct: false, is_other: true },
            ],
        });
    }, [config, onChange, safeOptions]);

    const removeOption = useCallback((id: string) => {
        if (safeOptions.length <= 2) return;
        onChange({
            ...config,
            options: safeOptions.filter((opt) => opt.id !== id),
        });
    }, [config, onChange, safeOptions]);

    const updateOptionText = useCallback((id: string, text: string) => {
        onChange({
            ...config,
            options: safeOptions.map((opt) =>
                opt.id === id ? { ...opt, text } : opt
            ),
        });
    }, [config, onChange, safeOptions]);

    const toggleCorrect = useCallback((id: string) => {
        onChange({
            ...config,
            options: safeOptions.map((opt) => ({
                ...opt,
                is_correct: opt.id === id,
            })),
        });
    }, [config, onChange, safeOptions]);

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                {safeOptions.map((option, index) => (
                    <OptionInput
                        key={option.id}
                        option={option}
                        index={index}
                        onTextChange={updateOptionText}
                        onToggleCorrect={toggleCorrect}
                        onRemove={removeOption}
                        canRemove={safeOptions.length > 2}
                    />
                ))}
            </div>

            <div className="flex items-center gap-3 text-sm border-t border-gray-200 dark:border-gray-700 pt-3">
                <button
                    type="button"
                    onClick={addOption}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                >
                    Add option
                </button>
                <span className="text-gray-400">or</span>
                <button
                    type="button"
                    onClick={addOtherOption}
                    disabled={safeOptions.some((opt) => opt.is_other)}
                    className="text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400"
                >
                    Add "Other"
                </button>
            </div>

            {!safeOptions.some((opt) => opt.is_correct) && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        All questions must have a correct answer selected.
                    </p>
                </div>
            )}
        </div>
    );
};

export default DropdownEditor;
