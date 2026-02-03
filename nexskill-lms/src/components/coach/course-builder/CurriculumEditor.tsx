import React, { useState } from "react";
import {
    BookOpen,
    Plus,
    ChevronRight,
    GripVertical,
    ChevronUp,
    ChevronDown,
    Edit2,
    Trash2,
    FileText,
    Image,
    Video,
    Code,
    Heading,
    FileQuestion,
    Lock,
    Unlock,
} from "lucide-react";
import type { Lesson, Module } from "../../../types/lesson";
import type { ContentItem } from "../../../types/content-item";

interface CurriculumEditorProps {
    curriculum: Module[];
    onChange: (updatedCurriculum: Module[]) => void;
    onEditLesson: (moduleId: string, lessonId: string) => void;
    onEditQuiz?: (moduleId: string, quizId: string) => void; // New handler for quizzes
    onAddQuiz?: (moduleId: string) => void;
    onAddLesson?: (moduleId: string, newLesson: Lesson) => Promise<void>;
    onDeleteLesson?: (moduleId: string, lessonId: string) => Promise<void>;
    onDeleteModule?: (moduleId: string) => Promise<void>;
    onAddModule?: () => Promise<void>;
    onMoveLesson?: (
        moduleId: string,
        lessonId: string,
        direction: "up" | "down"
    ) => Promise<void>;
}

const CurriculumEditor: React.FC<CurriculumEditorProps> = ({
    curriculum,
    onChange,
    onEditLesson,
    onEditQuiz,
    onAddQuiz,
    onAddLesson,
    onDeleteLesson,
    onDeleteModule,
    onAddModule,
    onMoveLesson,
}) => {
    const [expandedModules, setExpandedModules] = useState<Set<string>>(
        new Set(curriculum.map((m) => m.id))
    );

    const toggleModule = (moduleId: string) => {
        setExpandedModules((prev) => {
            const next = new Set(prev);
            if (next.has(moduleId)) {
                next.delete(moduleId);
            } else {
                next.add(moduleId);
            }
            return next;
        });
    };

    const handleAddModule = () => {
        if (onAddModule) {
            onAddModule();
            return;
        }
        const newModule: Module = {
            id: `module-${Date.now()}`,
            title: `Module ${curriculum.length + 1}`,
            lessons: [],
        };
        onChange([...curriculum, newModule]);
    };

    const handleDeleteModule = async (moduleId: string) => {
        if (
            !confirm(
                "Are you sure you want to delete this module and all its lessons?"
            )
        ) {
            return;
        }

        if (onDeleteModule) {
            await onDeleteModule(moduleId);
        } else {
            const updatedCurriculum = curriculum.filter(
                (m) => m.id !== moduleId
            );
            onChange(updatedCurriculum);
        }
    };

    const handleAddLesson = async (moduleId: string) => {
        // Find the module to get the lesson count
        const module = curriculum.find((m) => m.id === moduleId);

        const newLesson: Lesson = {
            id: "", // Will be replaced with UUID in CourseBuilder
            title: `Lesson ${(module?.lessons?.length ?? 0) + 1}`,
            type: "text",
            duration: "0 min",
            summary: "",
            content_blocks: [],
            is_published: false,
        };

        // If onAddLesson callback is provided, use it to create the lesson in the database
        if (onAddLesson) {
            await onAddLesson(moduleId, newLesson);
        } else {
            // Fallback to local state update only
            // Generate a temporary ID for local use only
            const lessonWithTempId = {
                ...newLesson,
                id: `lesson-${Date.now()}`,
            };
            const updatedCurriculum = curriculum.map((module) => {
                if (module.id === moduleId) {
                    return {
                        ...module,
                        lessons: [...module.lessons, { ...lessonWithTempId, type: 'lesson' } as ContentItem],
                    };
                }
                return module;
            });
            onChange(updatedCurriculum);
        }
    };

    const handleModuleTitleChange = (moduleId: string, newTitle: string) => {
        const updatedCurriculum = curriculum.map((module) =>
            module.id === moduleId ? { ...module, title: newTitle } : module
        );
        onChange(updatedCurriculum);
    };

    const handleToggleSequential = (moduleId: string) => {
        const updatedCurriculum = curriculum.map((module) =>
            module.id === moduleId ? { ...module, is_sequential: !module.is_sequential } : module
        );
        onChange(updatedCurriculum);
    };

    const handleDeleteLesson = async (moduleId: string, lessonId: string) => {
        // If onDeleteLesson callback is provided, use it to delete the lesson from the database
        if (onDeleteLesson) {
            await onDeleteLesson(moduleId, lessonId);
        } else {
            // Fallback to local state update only
            const updatedCurriculum = curriculum.map((module) => {
                if (module.id === moduleId) {
                    return {
                        ...module,
                        lessons: module.lessons.filter(
                            (l) => l.id !== lessonId
                        ),
                    };
                }
                return module;
            });
            onChange(updatedCurriculum);
        }
    };

    const handleMoveLesson = async (
        moduleId: string,
        lessonId: string,
        direction: "up" | "down"
    ) => {
        // If onMoveLesson callback is provided, use it to update positions in the database
        if (onMoveLesson) {
            await onMoveLesson(moduleId, lessonId, direction);
        } else {
            // Fallback to local state update only
            const updatedCurriculum = curriculum.map((module) => {
                if (module.id === moduleId) {
                    const lessons = [...module.lessons];
                    const index = lessons.findIndex((l) => l.id === lessonId);
                    if (direction === "up" && index > 0) {
                        [lessons[index], lessons[index - 1]] = [
                            lessons[index - 1],
                            lessons[index],
                        ];
                    } else if (
                        direction === "down" &&
                        index < lessons.length - 1
                    ) {
                        [lessons[index], lessons[index + 1]] = [
                            lessons[index + 1],
                            lessons[index],
                        ];
                    }
                    return { ...module, lessons };
                }
                return module;
            });
            onChange(updatedCurriculum);
        }
    };

    // Calculate content block statistics for a lesson
    const getContentStats = (item: ContentItem) => {
        // If it's a quiz, return empty stats or quiz-specific stats
        if (item.type === 'quiz') {
            // This is a quiz
            return [{
                label: 'Quiz',
                icon: <FileQuestion className="w-3 h-3" />,
                count: 1,
            }];
        }

        // If it's a lesson, calculate stats normally
        const lesson = item as unknown as Lesson; // Cast to Lesson for content_blocks access if properties differ strictly
        const blocks = lesson.content_blocks || [];
        const stats: { label: string; icon: React.ReactNode; count: number }[] =
            [];

        // Count text blocks and calculate word count
        const textBlocks = blocks.filter((b) => b.type === "text");
        if (textBlocks.length > 0) {
            const totalWords = textBlocks.reduce((sum, block) => {
                const text = block.content.replace(/<[^>]*>/g, ""); // Strip HTML
                const words = text
                    .trim()
                    .split(/\s+/)
                    .filter((w) => w.length > 0);
                return sum + words.length;
            }, 0);
            if (totalWords > 0) {
                stats.push({
                    label: `${totalWords} Words`,
                    icon: <FileText className="w-3 h-3" />,
                    count: totalWords,
                });
            }
        }

        // Count images
        const imageCount = blocks.filter((b) => b.type === "image").length;
        if (imageCount > 0) {
            stats.push({
                label: `${imageCount} Image${imageCount > 1 ? "s" : ""}`,
                icon: <Image className="w-3 h-3" />,
                count: imageCount,
            });
        }

        // Count videos
        const videoCount = blocks.filter((b) => b.type === "video").length;
        if (videoCount > 0) {
            stats.push({
                label: `${videoCount} Video${videoCount > 1 ? "s" : ""}`,
                icon: <Video className="w-3 h-3" />,
                count: videoCount,
            });
        }

        // Count code blocks
        const codeCount = blocks.filter((b) => b.type === "code").length;
        if (codeCount > 0) {
            stats.push({
                label: `${codeCount} Code`,
                icon: <Code className="w-3 h-3" />,
                count: codeCount,
            });
        }

        // Count headings
        const headingCount = blocks.filter((b) => b.type === "heading").length;
        if (headingCount > 0) {
            stats.push({
                label: `${headingCount} Heading${headingCount > 1 ? "s" : ""}`,
                icon: <Heading className="w-3 h-3" />,
                count: headingCount,
            });
        }

        return stats;
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 border-b border-gray-200 dark:border-gray-700 px-8 py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white dark:bg-slate-700 rounded-xl shadow-sm">
                            <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Course Curriculum
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                {curriculum.length}{" "}
                                {curriculum.length === 1 ? "Module" : "Modules"}{" "}
                                •{" "}
                                {curriculum.reduce(
                                    (sum, m) => sum + m.lessons.length,
                                    0
                                )}{" "}
                                Items
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleAddModule}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                    >
                        <Plus className="w-5 h-5" />
                        Add Module
                    </button>
                </div>
            </div>

            {/* Modules List */}
            <div className="p-6 space-y-4">
                {curriculum.map((module, moduleIndex) => (
                    <div
                        key={module.id}
                        className="border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200"
                    >
                        {/* Module Header */}
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-900 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-4 px-5 py-4">
                                <button
                                    onClick={() => toggleModule(module.id)}
                                    className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    aria-label={
                                        expandedModules.has(module.id)
                                            ? "Collapse module"
                                            : "Expand module"
                                    }
                                >
                                    <ChevronRight
                                        className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${expandedModules.has(module.id)
                                            ? "rotate-90"
                                            : ""
                                            }`}
                                    />
                                </button>

                                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white font-bold shadow-sm">
                                    {moduleIndex + 1}
                                </div>

                                <input
                                    type="text"
                                    value={module.title}
                                    onChange={(e) =>
                                        handleModuleTitleChange(
                                            module.id,
                                            e.target.value
                                        )
                                    }
                                    className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-700 rounded-lg border-2 border-gray-200 dark:border-gray-600 font-semibold text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all"
                                    placeholder="Module title..."
                                />

                                <div className="flex items-center gap-2">
                                    <span className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400">
                                        {module.lessons.length}{" "}
                                        {module.lessons.length === 1
                                            ? "Item"
                                            : "Items"}
                                    </span>

                                    <button
                                        onClick={() =>
                                            handleAddLesson(module.id)
                                        }
                                        className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 text-blue-600 dark:text-blue-400 font-medium rounded-lg transition-all text-sm"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Lesson
                                    </button>

                                    {onAddQuiz && (
                                        <button
                                            onClick={() => onAddQuiz(module.id)}
                                            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600 text-purple-600 dark:text-purple-400 font-medium rounded-lg transition-all text-sm"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Quiz
                                        </button>
                                    )}

                                    <button
                                        onClick={() =>
                                            handleDeleteModule(module.id)
                                        }
                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                                        aria-label="Delete module"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Module Settings Bar */}
                            <div className="px-5 py-2 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleSequential(module.id);
                                    }}
                                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${module.is_sequential
                                        ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                                        : "bg-white text-gray-500 border-gray-200 dark:bg-slate-700 dark:text-gray-400 dark:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300"
                                        }`}
                                    title="Enforce sequential access for students"
                                >
                                    {module.is_sequential ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                    {module.is_sequential ? "Sequential Order On" : "Sequential Order Off"}
                                </button>
                            </div>
                        </div>

                        {/* Lessons List */}
                        {expandedModules.has(module.id) && (
                            <div className="bg-white dark:bg-slate-800">
                                {module.lessons.length === 0 ? (
                                    <div className="px-5 py-12 text-center">
                                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full mb-4">
                                            <BookOpen className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">
                                            No content yet
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-500">
                                            Click "Add Lesson" or "Add Quiz" to
                                            get started
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {module.lessons.map(
                                            (item, itemIndex) => {
                                                const contentStats =
                                                    getContentStats(item);

                                                return (
                                                    <div
                                                        key={item.id}
                                                        className="group px-5 py-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                                                    >
                                                        <div className="flex items-start gap-4">
                                                            {/* Reorder Controls */}
                                                            <div className="flex flex-col gap-0.5 pt-1">
                                                                <button
                                                                    onClick={() =>
                                                                        handleMoveLesson(
                                                                            module.id,
                                                                            item.id,
                                                                            "up"
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        itemIndex ===
                                                                        0
                                                                    }
                                                                    className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                                    aria-label="Move item up"
                                                                >
                                                                    <ChevronUp className="w-4 h-4" />
                                                                </button>
                                                                <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                                                                <button
                                                                    onClick={() =>
                                                                        handleMoveLesson(
                                                                            module.id,
                                                                            item.id,
                                                                            "down"
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        itemIndex ===
                                                                        module
                                                                            .lessons
                                                                            .length -
                                                                        1
                                                                    }
                                                                    className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                                    aria-label="Move item down"
                                                                >
                                                                    <ChevronDown className="w-4 h-4" />
                                                                </button>
                                                            </div>

                                                            {/* Item Number */}
                                                            <div className="flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-slate-700 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-400 flex-shrink-0 mt-1">
                                                                {itemIndex +
                                                                    1}
                                                            </div>

                                                            {/* Item Content */}
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                                    {
                                                                        item.title
                                                                    }
                                                                </h4>

                                                                {/* Content Statistics */}
                                                                {contentStats.length >
                                                                    0 && (
                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                            {contentStats.map(
                                                                                (
                                                                                    stat,
                                                                                    idx
                                                                                ) => (
                                                                                    <React.Fragment
                                                                                        key={
                                                                                            idx
                                                                                        }
                                                                                    >
                                                                                        {idx >
                                                                                            0 && (
                                                                                                <span className="text-gray-300 dark:text-gray-600">
                                                                                                    •
                                                                                                </span>
                                                                                            )}
                                                                                        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                                                                                            {
                                                                                                stat.icon
                                                                                            }
                                                                                            <span>
                                                                                                {
                                                                                                    stat.label
                                                                                                }
                                                                                            </span>
                                                                                        </div>
                                                                                    </React.Fragment>
                                                                                )
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                {contentStats.length ===
                                                                    0 && (
                                                                        <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                                                                            No
                                                                            content
                                                                            yet
                                                                        </p>
                                                                    )}
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => {
                                                                        // Check if the item is a quiz or lesson
                                                                        if (item.type === 'quiz') {
                                                                            // This is a quiz
                                                                            if (onEditQuiz) {
                                                                                onEditQuiz(module.id, item.id);
                                                                            }
                                                                        } else {
                                                                            // This is a lesson
                                                                            onEditLesson(module.id, item.id);
                                                                        }
                                                                    }}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 font-medium rounded-lg transition-all text-sm"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        handleDeleteLesson(
                                                                            module.id,
                                                                            item.id
                                                                        )
                                                                    }
                                                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                                                                    aria-label="Delete item"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {/* Empty State */}
                {curriculum.length === 0 && (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl mb-5">
                            <BookOpen className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            No modules yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                            Start building your course curriculum by adding your
                            first module
                        </p>
                        <button
                            onClick={handleAddModule}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                        >
                            <Plus className="w-5 h-5" />
                            Add Your First Module
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CurriculumEditor;
