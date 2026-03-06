import React from "react";
import { Check, Edit2 } from "lucide-react";
import type { Lesson } from "../../../types/lesson";

interface LessonHeaderProps {
    lesson: Lesson;
    isEditing: boolean;
    onToggleEdit: () => void;
    title: string;
    description: string;
    duration: string;
    onTitleChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onDurationChange: (value: string) => void;
    onBlur: (field: "title" | "description" | "estimated_duration_minutes", value: string) => void;
    showEditButton?: boolean;
}

const LessonHeader: React.FC<LessonHeaderProps> = ({
    lesson,
    isEditing,
    onToggleEdit,
    title,
    description,
    duration,
    onTitleChange,
    onDescriptionChange,
    onDurationChange,
    onBlur,
    showEditButton = true,
}) => {
    return (
        <div className="flex items-start justify-between mb-8 group/header">
            <div className="space-y-4 flex-1 pr-4">
                {isEditing ? (
                    <div className="space-y-4 max-w-2xl">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                                Lesson Title
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={title}
                                onChange={(e) => onTitleChange(e.target.value)}
                                onBlur={(e) => onBlur("title", e.target.value)}
                                className="w-full px-0 py-1 text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-500 outline-none transition-all"
                                placeholder="Enter lesson title..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={description}
                                onChange={(e) => onDescriptionChange(e.target.value)}
                                onBlur={(e) => onBlur("description", e.target.value)}
                                rows={2}
                                className="w-full px-0 py-1 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-500 outline-none transition-all resize-none text-gray-600 dark:text-gray-300"
                                placeholder="Add a brief description..."
                            />
                        </div>
                        <div className="w-32">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                                Duration (min)
                            </label>
                            <input
                                type="number"
                                name="estimated_duration_minutes"
                                value={duration}
                                onChange={(e) => onDurationChange(e.target.value)}
                                onBlur={(e) =>
                                    onBlur(
                                        "estimated_duration_minutes",
                                        e.target.value
                                    )
                                }
                                className="w-full px-0 py-1 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-blue-500 outline-none transition-all"
                                placeholder="15"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white leading-tight">
                            {lesson.title || (
                                <span className="text-gray-300 italic">
                                    Untitled Lesson
                                </span>
                            )}
                        </h1>

                        {lesson.description && (
                            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-3xl leading-relaxed">
                                {lesson.description}
                            </p>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600 dark:bg-gray-800 dark:text-gray-400 uppercase tracking-wider">
                                {lesson.estimated_duration_minutes
                                    ? `${lesson.estimated_duration_minutes} Minutes`
                                    : "Duration not set"}
                            </span>
                            {!showEditButton && lesson.updated_at && (
                                <span className="text-xs text-gray-400 ml-2">
                                    Last updated: {new Date(lesson.updated_at).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {showEditButton && (
                <button
                    onClick={onToggleEdit}
                    className={`p-2 rounded-lg transition-all ${
                        isEditing
                            ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                            : "text-gray-400 hover:text-gray-600 hover:bg-slate-100 dark:hover:bg-gray-800 opacity-60 group-hover/header:opacity-100"
                    }`}
                    title={isEditing ? "Done editing" : "Edit details"}
                >
                    {isEditing ? (
                        <Check className="w-5 h-5" />
                    ) : (
                        <Edit2 className="w-5 h-5" />
                    )}
                </button>
            )}
        </div>
    );
};

export default LessonHeader;
