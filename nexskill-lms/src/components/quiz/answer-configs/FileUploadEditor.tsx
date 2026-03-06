import React from "react";
import type { FileUploadConfig } from "../../../types/quiz";

interface FileUploadEditorProps {
    config: FileUploadConfig;
    onChange: (config: FileUploadConfig) => void;
}

const FileUploadEditor: React.FC<FileUploadEditorProps> = ({
    config,
    onChange,
}) => {
    const commonFileTypes = [
        { value: "pdf", label: "PDF (.pdf)" },
        { value: "docx", label: "Word (.docx)" },
        { value: "doc", label: "Word 97-2003 (.doc)" },
        { value: "txt", label: "Text (.txt)" },
        { value: "jpg", label: "JPEG (.jpg)" },
        { value: "png", label: "PNG (.png)" },
        { value: "zip", label: "ZIP (.zip)" },
        { value: "xlsx", label: "Excel (.xlsx)" },
        { value: "pptx", label: "PowerPoint (.pptx)" },
    ];

    const toggleFileType = (type: string) => {
        const current = config.accepted_file_types || [];
        if (current.includes(type)) {
            onChange({
                ...config,
                accepted_file_types: current.filter((t) => t !== type),
            });
        } else {
            onChange({
                ...config,
                accepted_file_types: [...current, type],
            });
        }
    };

    return (
        <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    ℹ️ File upload questions always require manual grading
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Accepted File Types
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {commonFileTypes.map((type) => (
                        <label
                            key={type.value}
                            className="flex items-center gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700"
                        >
                            <input
                                type="checkbox"
                                checked={(
                                    config.accepted_file_types || []
                                ).includes(type.value)}
                                onChange={() => toggleFileType(type.value)}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                {type.label}
                            </span>
                        </label>
                    ))}
                </div>
                {(!config.accepted_file_types ||
                    config.accepted_file_types.length === 0) && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                        Please select at least one file type
                    </p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Max File Size (MB)
                    </label>
                    <input
                        type="number"
                        value={config.max_file_size_mb || 10}
                        onChange={(e) =>
                            onChange({
                                ...config,
                                max_file_size_mb:
                                    parseFloat(e.target.value) || 10,
                            })
                        }
                        min={1}
                        max={100}
                        step={1}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Max Files
                    </label>
                    <input
                        type="number"
                        value={config.max_files || 1}
                        onChange={(e) =>
                            onChange({
                                ...config,
                                max_files: parseInt(e.target.value) || 1,
                            })
                        }
                        min={1}
                        max={10}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Instructions for Students
                </label>
                <textarea
                    value={config.instructions || ""}
                    onChange={(e) =>
                        onChange({ ...config, instructions: e.target.value })
                    }
                    placeholder="e.g., Upload your completed assignment as a PDF..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                />
            </div>
        </div>
    );
};

export default FileUploadEditor;
