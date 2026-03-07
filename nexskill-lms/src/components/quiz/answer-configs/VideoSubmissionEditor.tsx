import React from "react";
import type { VideoSubmissionConfig } from "../../../types/quiz";

interface VideoSubmissionEditorProps {
    config: VideoSubmissionConfig;
    onChange: (config: VideoSubmissionConfig) => void;
}

const VideoSubmissionEditor: React.FC<VideoSubmissionEditorProps> = ({
    config,
    onChange,
}) => {
    const videoFormats = [
        { value: "mp4", label: "MP4" },
        { value: "mov", label: "MOV" },
        { value: "avi", label: "AVI" },
        { value: "webm", label: "WebM" },
    ];

    const toggleFormat = (format: string) => {
        const current = config.accepted_formats || [];
        if (current.includes(format)) {
            onChange({
                ...config,
                accepted_formats: current.filter((f) => f !== format),
            });
        } else {
            onChange({
                ...config,
                accepted_formats: [...current, format],
            });
        }
    };

    return (
        <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                    ℹ️ Video submission questions always require manual grading
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Accepted Video Formats
                </label>
                <div className="flex flex-wrap gap-2">
                    {videoFormats.map((format) => (
                        <label
                            key={format.value}
                            className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700"
                        >
                            <input
                                type="checkbox"
                                checked={(
                                    config.accepted_formats || []
                                ).includes(format.value)}
                                onChange={() => toggleFormat(format.value)}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                {format.label}
                            </span>
                        </label>
                    ))}
                </div>
                {(!config.accepted_formats ||
                    config.accepted_formats.length === 0) && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                        Please select at least one video format
                    </p>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Max Duration (minutes)
                    </label>
                    <input
                        type="number"
                        value={config.max_duration_minutes || ""}
                        onChange={(e) =>
                            onChange({
                                ...config,
                                max_duration_minutes: e.target.value
                                    ? parseInt(e.target.value)
                                    : undefined,
                            })
                        }
                        min={1}
                        max={60}
                        placeholder="Optional"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Leave empty for no limit
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Max File Size (MB)
                    </label>
                    <input
                        type="number"
                        value={config.max_file_size_mb || 100}
                        onChange={(e) =>
                            onChange({
                                ...config,
                                max_file_size_mb:
                                    parseFloat(e.target.value) || 100,
                            })
                        }
                        min={10}
                        max={500}
                        step={10}
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
                    placeholder="e.g., Record a 3-5 minute video explaining your solution..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                />
            </div>
        </div>
    );
};

export default VideoSubmissionEditor;
