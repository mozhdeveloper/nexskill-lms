import React, { useState, useCallback, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { MultipleChoiceConfig } from "../../../types/quiz";

interface MultipleChoiceEditorProps {
    config: MultipleChoiceConfig;
    onChange: (config: MultipleChoiceConfig) => void;
}

const generateId = () =>
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Individual option input component with local state
interface OptionInputProps {
    option: { id: string; text: string; is_correct: boolean };
    index: number;
    onTextChange: (id: string, text: string) => void;
    onToggleCorrect: (id: string) => void;
    onRemove: (id: string) => void;
    canRemove: boolean;
    allowMultiple: boolean;
}

const OptionInput: React.FC<OptionInputProps> = React.memo(({
    option,
    index,
    onTextChange,
    onToggleCorrect,
    onRemove,
    canRemove,
    allowMultiple,
}) => {
    // Use ref to track if input is focused to avoid overwriting during active editing
    const isFocusedRef = useRef(false);
    const [localText, setLocalText] = useState(option.text);

    // Sync local state when option.text changes from parent (only when not focused)
    const displayValue = isFocusedRef.current ? localText : option.text;

    const handleFocus = useCallback(() => {
        isFocusedRef.current = true;
        setLocalText(option.text);
    }, [option.text]);

    const handleBlur = useCallback(() => {
        isFocusedRef.current = false;
        if (localText !== option.text) {
            onTextChange(option.id, localText);
        }
    }, [localText, option.text, option.id, onTextChange]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalText(e.target.value);
    }, []);

    return (
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg group">
            <label className="flex items-center cursor-pointer">
                <input
                    type={allowMultiple ? "checkbox" : "radio"}
                    checked={option.is_correct}
                    onChange={() => onToggleCorrect(option.id)}
                    className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
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
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={`Option ${index + 1}`}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

OptionInput.displayName = "OptionInput";

const MultipleChoiceEditor: React.FC<MultipleChoiceEditorProps> = ({
    config,
    onChange,
}) => {
    const addOption = useCallback(() => {
        onChange({
            ...config,
            options: [
                ...config.options,
                { id: generateId(), text: "", is_correct: false },
            ],
        });
    }, [config, onChange]);

    const removeOption = useCallback((id: string) => {
        if (config.options.length <= 2) return;
        onChange({
            ...config,
            options: config.options.filter((opt) => opt.id !== id),
        });
    }, [config, onChange]);

    const updateOptionText = useCallback((id: string, text: string) => {
        onChange({
            ...config,
            options: config.options.map((opt) =>
                opt.id === id ? { ...opt, text } : opt
            ),
        });
    }, [config, onChange]);

    const toggleCorrect = useCallback((id: string) => {
        if (config.allow_multiple) {
            onChange({
                ...config,
                options: config.options.map((opt) =>
                    opt.id === id ? { ...opt, is_correct: !opt.is_correct } : opt
                ),
            });
        } else {
            onChange({
                ...config,
                options: config.options.map((opt) => ({
                    ...opt,
                    is_correct: opt.id === id,
                })),
            });
        }
    }, [config, onChange]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Answer Options
                </h4>
                <button
                    onClick={addOption}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Option
                </button>
            </div>

            <div className="space-y-2">
                {config.options.map((option, index) => (
                    <OptionInput
                        key={option.id}
                        option={option}
                        index={index}
                        onTextChange={updateOptionText}
                        onToggleCorrect={toggleCorrect}
                        onRemove={removeOption}
                        canRemove={config.options.length > 2}
                        allowMultiple={config.allow_multiple}
                    />
                ))}
            </div>

            <div className="flex flex-col gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={config.allow_multiple}
                        onChange={(e) =>
                            onChange({
                                ...config,
                                allow_multiple: e.target.checked,
                            })
                        }
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        Allow multiple selections
                    </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={config.randomize_options}
                        onChange={(e) =>
                            onChange({
                                ...config,
                                randomize_options: e.target.checked,
                            })
                        }
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                        Randomize option order
                    </span>
                </label>
            </div>

            {!config.options.some((opt) => opt.is_correct) && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        ⚠️ Please mark at least one option as correct
                    </p>
                </div>
            )}
        </div>
    );
};

export default MultipleChoiceEditor;
