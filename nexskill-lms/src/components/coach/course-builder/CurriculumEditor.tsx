import React, { useState, useRef, useEffect } from "react";
import {
    BookOpen,
    Plus,
    ChevronRight,
    ChevronDown,
    GripVertical,
    Trash2,
    Lock,
    Unlock,
    Video,
    FileQuestion,
    AlignLeft,
    FolderOpen,
    X,
    Link,
    Check,
    PenLine,
} from "lucide-react";
import type { Lesson, Module } from "../../../types/lesson";
import type { ContentItem } from "../../../types/content-item";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CurriculumEditorProps {
    curriculum: Module[];
    onChange: (updatedCurriculum: Module[]) => void;
    onEditLesson: (moduleId: string, lessonId: string) => void;
    onEditQuiz?: (moduleId: string, lessonId: string, quizId: string) => void;
    onCreateQuiz?: (moduleId: string, lessonId: string, quizTitle: string) => Promise<string>;
    onAddLesson?: (moduleId: string, newLesson: Lesson) => Promise<void>;
    onDeleteLesson?: (moduleId: string, lessonId: string) => Promise<void>;
    onDeleteModule?: (moduleId: string) => Promise<void>;
    onAddModule?: () => Promise<void>;
    onMoveLesson?: (moduleId: string, lessonId: string, direction: "up" | "down") => Promise<void>;
    onUpdateLessonTitle?: (moduleId: string, lessonId: string, title: string) => Promise<void>;
    onUpdateLessonContent?: (moduleId: string, lessonId: string, contentBlocks: any[]) => Promise<void>;
}

interface ActivePlusMenu {
    moduleId: string;
    lessonId: string;
}

interface ContentOptions {
    moduleId: string;
    lessonId: string;
    mode: "picker" | "video-input" | "quiz-input";
    videoUrl: string;
    quizTitle: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getBlocks = (item: ContentItem) => {
    const blocks: any[] = (item as any).content_blocks || [];
    const videoBlock = blocks.find((b: any) => b.type === "video") ?? null;
    const quizBlock  = blocks.find((b: any) => b.type === "quiz")  ?? null;
    return { videoBlock, quizBlock };
};

// ─── Component ────────────────────────────────────────────────────────────────

const CurriculumEditor: React.FC<CurriculumEditorProps> = ({
    curriculum,
    onChange,
    onEditLesson,
    onEditQuiz,
    onCreateQuiz,
    onAddLesson,
    onDeleteLesson,
    onDeleteModule,
    onAddModule,
    onMoveLesson,
    onUpdateLessonTitle,
    onUpdateLessonContent,
}) => {
    const [expandedModules, setExpandedModules] = useState<Set<string>>(
        new Set(curriculum.map((m) => m.id))
    );
    const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
    const [activePlusMenu, setActivePlusMenu]   = useState<ActivePlusMenu | null>(null);
    const [contentOptions, setContentOptions]   = useState<ContentOptions | null>(null);

    const plusMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
                setActivePlusMenu(null);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // ── Module handlers ───────────────────────────────────────────────────────

    const toggleModule = (moduleId: string) =>
        setExpandedModules((prev) => {
            const next = new Set(prev);
            next.has(moduleId) ? next.delete(moduleId) : next.add(moduleId);
            return next;
        });

    const handleAddModule = () => {
        if (onAddModule) { onAddModule(); return; }
        onChange([...curriculum, { id: `module-${Date.now()}`, title: "", lessons: [] }]);
    };

    const handleDeleteModule = async (moduleId: string) => {
        if (curriculum.length <= 1) return;
        if (!confirm("Delete this module and all its lessons?")) return;
        if (onDeleteModule) await onDeleteModule(moduleId);
        else onChange(curriculum.filter((m) => m.id !== moduleId));
    };

    const handleModuleTitleChange = (moduleId: string, title: string) =>
        onChange(curriculum.map((m) => m.id === moduleId ? { ...m, title } : m));

    const handleToggleSequential = (moduleId: string) =>
        onChange(curriculum.map((m) => m.id === moduleId ? { ...m, is_sequential: !m.is_sequential } : m));

    // ── Lesson handlers ───────────────────────────────────────────────────────

    const toggleLesson = (lessonId: string) =>
        setExpandedLessons((prev) => {
            const next = new Set(prev);
            next.has(lessonId) ? next.delete(lessonId) : next.add(lessonId);
            return next;
        });

    const handleAddLesson = async (moduleId: string) => {
        const newLesson: Lesson = {
            id: "",
            title: "",
            type: "text",
            duration: "0 min",
            summary: "",
            content_blocks: [],
            is_published: false,
        };
        if (onAddLesson) {
            await onAddLesson(moduleId, newLesson);
        } else {
            const withId = { ...newLesson, id: `lesson-${Date.now()}` };
            onChange(curriculum.map((m) =>
                m.id === moduleId
                    ? { ...m, lessons: [...m.lessons, { ...withId, type: "lesson" } as ContentItem] }
                    : m
            ));
        }
    };

    const handleLessonTitleChange = async (moduleId: string, lessonId: string, title: string) => {
        // Update local state immediately
        onChange(curriculum.map((m) =>
            m.id === moduleId
                ? { ...m, lessons: m.lessons.map((l) => l.id === lessonId ? { ...l, title } : l) }
                : m
        ));
        
        // Save to database if the lesson has a real ID (not temporary)
        if (!lessonId.startsWith('lesson-') && onUpdateLessonTitle) {
            await onUpdateLessonTitle(moduleId, lessonId, title);
        }
    };

    const handleDeleteLesson = async (moduleId: string, lessonId: string) => {
        if (onDeleteLesson) await onDeleteLesson(moduleId, lessonId);
        else onChange(curriculum.map((m) =>
            m.id === moduleId ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) } : m
        ));
    };

    const handleMoveLesson = async (moduleId: string, lessonId: string, direction: "up" | "down") => {
        if (onMoveLesson) { await onMoveLesson(moduleId, lessonId, direction); return; }
        onChange(curriculum.map((m) => {
            if (m.id !== moduleId) return m;
            const lessons = [...m.lessons];
            const i = lessons.findIndex((l) => l.id === lessonId);
            if (direction === "up" && i > 0)
                [lessons[i], lessons[i - 1]] = [lessons[i - 1], lessons[i]];
            else if (direction === "down" && i < lessons.length - 1)
                [lessons[i], lessons[i + 1]] = [lessons[i + 1], lessons[i]];
            return { ...m, lessons };
        }));
    };

    // ── Content handlers ──────────────────────────────────────────────────────

    const handleContentClick = (moduleId: string, lessonId: string) => {
        setActivePlusMenu(null);
        setExpandedLessons((prev) => new Set([...prev, lessonId]));
        setContentOptions({ moduleId, lessonId, mode: "picker", videoUrl: "", quizTitle: "" });
    };

    const handleVideoLinkClick = () => {
        if (!contentOptions) return;
        setContentOptions({ ...contentOptions, mode: "video-input", videoUrl: "" });
    };

    const handleQuizPickerClick = () => {
        if (!contentOptions) return;
        setContentOptions({ ...contentOptions, mode: "quiz-input", quizTitle: "" });
    };

    const handleSaveVideoUrl = async (moduleId: string, lessonId: string) => {
        if (!contentOptions?.videoUrl.trim()) return;
        
        // Find the lesson and update its content_blocks
        const updatedCurriculum = curriculum.map((m) =>
            m.id === moduleId ? {
                ...m,
                lessons: m.lessons.map((l) => {
                    if (l.id !== lessonId) return l;
                    const blocks: any[] = (l as any).content_blocks || [];
                    const newBlock = {
                        id: crypto.randomUUID(),
                        type: "video",
                        content: contentOptions.videoUrl,
                        position: blocks.length,
                        title: "",
                    };
                    return { ...l, content_blocks: [...blocks, newBlock] };
                }),
            } : m
        );
        
        // Update local state
        onChange(updatedCurriculum);
        
        // Save to database if the lesson has a real ID
        if (!lessonId.startsWith('lesson-') && onUpdateLessonContent) {
            const updatedLesson = updatedCurriculum
                .find(m => m.id === moduleId)
                ?.lessons.find(l => l.id === lessonId);
            if (updatedLesson) {
                await onUpdateLessonContent(moduleId, lessonId, (updatedLesson as any).content_blocks || []);
            }
        }
        
        setContentOptions(null);
        setExpandedLessons((prev) => { const next = new Set(prev); next.delete(lessonId); return next; });
    };

    const handleSaveQuizTitle = async (moduleId: string, lessonId: string) => {
        if (!contentOptions?.quizTitle.trim()) return;

        let quizId = crypto.randomUUID();

        if (onCreateQuiz) {
            try {
                quizId = await onCreateQuiz(moduleId, lessonId, contentOptions.quizTitle);
            } catch (err) {
                console.error("Failed to create quiz:", err);
                return;
            }
        }

        // Find the lesson and update its content_blocks
        const updatedCurriculum = curriculum.map((m) =>
            m.id === moduleId ? {
                ...m,
                lessons: m.lessons.map((l) => {
                    if (l.id !== lessonId) return l;
                    const blocks: any[] = (l as any).content_blocks || [];
                    const newBlock = {
                        id: crypto.randomUUID(),
                        type: "quiz",
                        quizId: quizId,
                        title: contentOptions.quizTitle,
                        position: blocks.length,
                    };
                    return { ...l, content_blocks: [...blocks, newBlock] };
                }),
            } : m
        );

        // Update local state
        onChange(updatedCurriculum);
        
        // Save to database if the lesson has a real ID
        if (!lessonId.startsWith('lesson-') && onUpdateLessonContent) {
            const updatedLesson = updatedCurriculum
                .find(m => m.id === moduleId)
                ?.lessons.find(l => l.id === lessonId);
            if (updatedLesson) {
                await onUpdateLessonContent(moduleId, lessonId, (updatedLesson as any).content_blocks || []);
            }
        }

        setContentOptions(null);
        setExpandedLessons((prev) => {
            const next = new Set(prev);
            next.delete(lessonId);
            return next;
        });

        if (onEditQuiz) onEditQuiz(moduleId, lessonId, quizId);
    };

    const handleDeleteBlock = async (moduleId: string, lessonId: string, blockId: string) => {
        // Find the lesson and remove the block
        const updatedCurriculum = curriculum.map((m) =>
            m.id === moduleId ? {
                ...m,
                lessons: m.lessons.map((l) => {
                    if (l.id !== lessonId) return l;
                    const blocks: any[] = (l as any).content_blocks || [];
                    return { ...l, content_blocks: blocks.filter((b: any) => b.id !== blockId) };
                }),
            } : m
        );
        
        // Update local state
        onChange(updatedCurriculum);
        
        // Save to database if the lesson has a real ID
        if (!lessonId.startsWith('lesson-') && onUpdateLessonContent) {
            const updatedLesson = updatedCurriculum
                .find(m => m.id === moduleId)
                ?.lessons.find(l => l.id === lessonId);
            if (updatedLesson) {
                await onUpdateLessonContent(moduleId, lessonId, (updatedLesson as any).content_blocks || []);
            }
        }
    };

    // ── Helpers ───────────────────────────────────────────────────────────────

    const isPlusMenuOpen = (moduleId: string, lessonId: string) =>
        activePlusMenu?.moduleId === moduleId && activePlusMenu?.lessonId === lessonId;

    const isShowingOptions = (moduleId: string, lessonId: string) =>
        contentOptions?.moduleId === moduleId && contentOptions?.lessonId === lessonId;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 border-b border-gray-200 dark:border-gray-700 px-8 py-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white dark:bg-slate-700 rounded-xl shadow-sm">
                        <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Course Curriculum</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                            {curriculum.length} {curriculum.length === 1 ? "Module" : "Modules"} •{" "}
                            {curriculum.reduce((s, m) => s + m.lessons.length, 0)} Items
                        </p>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">

                {curriculum.length === 0 && (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl mb-5">
                            <BookOpen className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No modules yet</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                            Start building your course curriculum by adding your first module
                        </p>
                    </div>
                )}

                {curriculum.map((module, moduleIndex) => (
                    <div
                        key={module.id}
                        className="border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:border-blue-200 dark:hover:border-blue-700 transition-colors duration-200"
                    >
                        {/* ── Module header ── */}
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-900 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-3 px-5 py-3.5">
                                <button
                                    onClick={() => toggleModule(module.id)}
                                    className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
                                >
                                    <ChevronRight className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${expandedModules.has(module.id) ? "rotate-90" : ""}`} />
                                </button>

                                <div className="flex flex-col flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap flex-shrink-0 select-none">
                                            Module {moduleIndex + 1}:
                                        </span>
                                        <input
                                            type="text"
                                            value={module.title}
                                            onChange={(e) => handleModuleTitleChange(module.id, e.target.value)}
                                            className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none font-semibold text-gray-900 dark:text-white placeholder-gray-400 text-sm min-w-0"
                                            placeholder="Module title..."
                                        />
                                    </div>
                                    <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                        {module.lessons.length} {module.lessons.length === 1 ? "item" : "items"}
                                    </span>
                                </div>

                                <button
                                    onClick={(e) => { e.stopPropagation(); handleToggleSequential(module.id); }}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors flex-shrink-0 ${
                                        module.is_sequential
                                            ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                                            : "bg-white text-gray-500 border-gray-200 dark:bg-slate-700 dark:text-gray-400 dark:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300"
                                    }`}
                                >
                                    {module.is_sequential ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                    {module.is_sequential ? "Sequential On" : "Sequential Off"}
                                </button>

                                <button
                                    onClick={() => handleDeleteModule(module.id)}
                                    disabled={curriculum.length <= 1}
                                    title={curriculum.length <= 1 ? "Cannot delete the only module" : "Delete module"}
                                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 rounded-lg transition-colors disabled:opacity-25 disabled:cursor-not-allowed flex-shrink-0"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* ── Lessons list ── */}
                        {expandedModules.has(module.id) && (
                            <div className="bg-white dark:bg-slate-800">
                                {module.lessons.length === 0 ? (
                                    <div className="px-5 py-10 text-center">
                                        <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-slate-700 rounded-full mb-3">
                                            <BookOpen className="w-6 h-6 text-gray-400" />
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No lessons yet</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Add your first lesson below</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
                                        {module.lessons.map((item, itemIndex) => {
                                            const { videoBlock, quizBlock } = getBlocks(item);
                                            const hasContent     = !!videoBlock || !!quizBlock;
                                            const lessonExpanded = expandedLessons.has(item.id);
                                            const showingOpts    = isShowingOptions(module.id, item.id);

                                            return (
                                                <div key={item.id} className="group">
                                                    {/* ── Lesson row ── */}
                                                    <div className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors">
                                                        <div className="flex-shrink-0 cursor-grab active:cursor-grabbing">
                                                            <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                                                        </div>

                                                        <button
                                                            onClick={() => toggleLesson(item.id)}
                                                            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors flex-shrink-0"
                                                        >
                                                            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${lessonExpanded ? "" : "-rotate-90"}`} />
                                                        </button>

                                                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                                            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0 select-none">
                                                                Lesson {itemIndex + 1}:
                                                            </span>
                                                            <input
                                                                type="text"
                                                                value={item.title}
                                                                onChange={(e) => handleLessonTitleChange(module.id, item.id, e.target.value)}
                                                                className="flex-1 min-w-0 bg-transparent border-none focus:ring-0 focus:outline-none text-sm font-medium text-gray-800 dark:text-white placeholder-gray-400"
                                                                placeholder="Lesson title..."
                                                            />
                                                            {!lessonExpanded && hasContent && (
                                                                <div className="flex-shrink-0">
                                                                    {videoBlock && (
                                                                        <span className="flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full font-medium">
                                                                            <Video className="w-3 h-3" />Video
                                                                        </span>
                                                                    )}
                                                                    {quizBlock && (
                                                                        <span className="flex items-center gap-1 text-xs text-purple-500 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full font-medium">
                                                                            <FileQuestion className="w-3 h-3" />Quiz
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Plus button + popover */}
                                                        <div
                                                            className="relative flex-shrink-0"
                                                            ref={isPlusMenuOpen(module.id, item.id) ? plusMenuRef : undefined}
                                                        >
                                                            <button
                                                                onClick={() =>
                                                                    isPlusMenuOpen(module.id, item.id)
                                                                        ? setActivePlusMenu(null)
                                                                        : setActivePlusMenu({ moduleId: module.id, lessonId: item.id })
                                                                }
                                                                className={`p-1.5 rounded-lg border transition-colors ${
                                                                    isPlusMenuOpen(module.id, item.id)
                                                                        ? "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700"
                                                                        : "text-gray-400 border-transparent hover:text-blue-500 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                                                                }`}
                                                            >
                                                                {isPlusMenuOpen(module.id, item.id)
                                                                    ? <X className="w-3.5 h-3.5" />
                                                                    : <Plus className="w-3.5 h-3.5" />
                                                                }
                                                            </button>

                                                            {isPlusMenuOpen(module.id, item.id) && (
                                                                <div className="absolute right-0 top-9 z-30 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-1.5 min-w-[170px]">
                                                                    <button
                                                                        onClick={() => handleContentClick(module.id, item.id)}
                                                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors font-medium"
                                                                    >
                                                                        <Video className="w-4 h-4" />
                                                                        Content
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { console.log("Description — coming soon"); setActivePlusMenu(null); }}
                                                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium"
                                                                    >
                                                                        <AlignLeft className="w-4 h-4" />
                                                                        Description
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { console.log("Resources — coming soon"); setActivePlusMenu(null); }}
                                                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium"
                                                                    >
                                                                        <FolderOpen className="w-4 h-4" />
                                                                        Resources
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <button
                                                            onClick={() => handleDeleteLesson(module.id, item.id)}
                                                            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 rounded-lg transition-all flex-shrink-0"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>

                                                    {/* ── Expanded area ── */}
                                                    {lessonExpanded && (
                                                        <div className="px-12 pb-4 pt-0">

                                                            {/* Picker */}
                                                            {showingOpts && contentOptions?.mode === "picker" && (
                                                                <div className="pt-2">
                                                                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                                                                        Add content
                                                                    </p>
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={handleVideoLinkClick}
                                                                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-xs font-medium transition-all"
                                                                        >
                                                                            <Link className="w-3.5 h-3.5" />
                                                                            Video Link
                                                                        </button>
                                                                        <button
                                                                            onClick={handleQuizPickerClick}
                                                                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-700 dark:text-gray-200 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg text-xs font-medium transition-all"
                                                                        >
                                                                            <FileQuestion className="w-3.5 h-3.5" />
                                                                            Quiz
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setContentOptions(null)}
                                                                            className="ml-auto p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                                        >
                                                                            <X className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Video URL input */}
                                                            {showingOpts && contentOptions?.mode === "video-input" && (
                                                                <div className="pt-2">
                                                                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                                                                        Video URL
                                                                    </p>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 focus-within:border-blue-400 dark:focus-within:border-blue-500 rounded-lg px-3 py-2 transition-colors">
                                                                            <Video className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                                            <input
                                                                                type="text"
                                                                                value={contentOptions.videoUrl}
                                                                                onChange={(e) =>
                                                                                    setContentOptions((c) => c ? { ...c, videoUrl: e.target.value } : c)
                                                                                }
                                                                                className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400"
                                                                                placeholder="Paste YouTube, Vimeo, or direct video URL..."
                                                                                autoFocus
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === "Enter") handleSaveVideoUrl(module.id, item.id);
                                                                                    if (e.key === "Escape") setContentOptions((c) => c ? { ...c, mode: "picker" } : c);
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <button
                                                                            onClick={() => handleSaveVideoUrl(module.id, item.id)}
                                                                            disabled={!contentOptions.videoUrl.trim()}
                                                                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                                        >
                                                                            <Check className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setContentOptions((c) => c ? { ...c, mode: "picker" } : c)}
                                                                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg transition-colors"
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Quiz title input */}
                                                            {showingOpts && contentOptions?.mode === "quiz-input" && (
                                                                <div className="pt-2">
                                                                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                                                                        Quiz Title
                                                                    </p>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 focus-within:border-purple-400 dark:focus-within:border-purple-500 rounded-lg px-3 py-2 transition-colors">
                                                                            <PenLine className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                                            <input
                                                                                type="text"
                                                                                value={contentOptions.quizTitle}
                                                                                onChange={(e) =>
                                                                                    setContentOptions((c) => c ? { ...c, quizTitle: e.target.value } : c)
                                                                                }
                                                                                className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400"
                                                                                placeholder="Enter quiz title..."
                                                                                autoFocus
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === "Enter") handleSaveQuizTitle(module.id, item.id);
                                                                                    if (e.key === "Escape") setContentOptions((c) => c ? { ...c, mode: "picker" } : c);
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <button
                                                                            onClick={() => handleSaveQuizTitle(module.id, item.id)}
                                                                            disabled={!contentOptions.quizTitle.trim()}
                                                                            className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                                        >
                                                                            <Check className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setContentOptions((c) => c ? { ...c, mode: "picker" } : c)}
                                                                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg transition-colors"
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Video block display */}
                                                            {!showingOpts && videoBlock && (
                                                                <div className="pt-2 flex items-center gap-2">
                                                                    <div className="flex items-center gap-2 flex-1 min-w-0 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2">
                                                                        <Video className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                                        <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                                                                            {videoBlock.content || "No URL"}
                                                                        </span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleDeleteBlock(module.id, item.id, videoBlock.id)}
                                                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                                                                        title="Remove video"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {/* Quiz block display */}
                                                            {!showingOpts && quizBlock && (
                                                                <div className="pt-2 flex items-center gap-2">
                                                                    <div className="flex items-center gap-2 flex-1 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2">
                                                                        <FileQuestion className="w-4 h-4 text-purple-500 flex-shrink-0" />
                                                                        <span className="text-sm text-gray-600 dark:text-gray-300">
                                                                            {quizBlock.title ? `Quiz: ${quizBlock.title}` : "Quiz"}
                                                                        </span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => onEditQuiz && onEditQuiz(module.id, item.id, quizBlock.quizId)}
                                                                        className="px-3 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors flex-shrink-0"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteBlock(module.id, item.id, quizBlock.id)}
                                                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                                                                        title="Remove quiz"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {/* Empty nudge */}
                                                            {!showingOpts && !hasContent && (
                                                                <div className="pt-2">
                                                                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                                                                        No content yet —{" "}
                                                                        <button
                                                                            onClick={() => handleContentClick(module.id, item.id)}
                                                                            className="not-italic font-medium text-blue-500 hover:underline"
                                                                        >
                                                                            + add content
                                                                        </button>
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700/60">
                                    <button
                                        onClick={() => handleAddLesson(module.id)}
                                        className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Lesson
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                <button
                    onClick={handleAddModule}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3.5 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-semibold rounded-xl transition-all duration-200 text-sm group"
                >
                    <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Add Module
                </button>
            </div>
        </div>
    );
};

export default CurriculumEditor;