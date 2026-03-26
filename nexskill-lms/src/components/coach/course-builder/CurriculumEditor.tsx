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
    Play,
    ExternalLink,
    Upload,
    AlertCircle,
} from "lucide-react";
import type { Lesson, Module } from "../../../types/lesson";
import type { ContentItem } from "../../../types/content-item";
import { CloudinaryVideoUploadService } from "../../../services/cloudinaryVideoUpload.service";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CurriculumEditorProps {
    curriculum: Module[];
    onChange: (updatedCurriculum: Module[]) => void;
    onEditLesson?: (moduleId: string, lessonId: string) => void;
    onEditQuiz?: (moduleId: string, lessonId: string, quizId: string) => void;
    onCreateQuiz?: (moduleId: string, lessonId: string, quizTitle: string) => Promise<string>;
    onAddLesson?: (moduleId: string, newLesson: Lesson) => Promise<void>;
    onDeleteLesson?: (moduleId: string, lessonId: string) => Promise<void>;
    onDeleteModule?: (moduleId: string) => Promise<void>;
    onAddModule?: () => Promise<void>;
    onMoveLesson?: (moduleId: string, lessonId: string, direction: "up" | "down") => Promise<void>;
    onUpdateLessonTitle?: (moduleId: string, lessonId: string, title: string) => Promise<void>;
    onUpdateLessonContent?: (moduleId: string, lessonId: string, contentBlocks: any[]) => Promise<void>;
    onSaveVideoBlock?: (moduleId: string, lessonId: string, videoUrl: string) => Promise<void>;
}

interface ActivePlusMenu {
    moduleId: string;
    lessonId: string;
}

interface ContentOptions {
    moduleId: string;
    lessonId: string;
    mode: "picker" | "video-input" | "video-upload" | "quiz-input";
    videoUrl: string;
    quizTitle: string;
    isUploading: boolean;
    uploadProgress: number;
    uploadedVideoPreview?: string;
    uploadError?: string;
}

interface VideoPreviewModalProps {
    videoUrl: string;
    onClose: () => void;
}

// Video Preview Modal Component
const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({ videoUrl, onClose }) => {
    const getEmbedUrl = (url: string): string | null => {
        const trimmedUrl = url.trim();
        
        // YouTube
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const youtubeMatch = trimmedUrl.match(youtubeRegex);
        if (youtubeMatch) {
            return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1`;
        }
        
        // Vimeo
        const vimeoRegex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:\w+\/)?|album\/(?:\d+\/)?video\/|video\/|)(\d+)(?:[?&][^#]*)?/;
        const vimeoMatch = trimmedUrl.match(vimeoRegex);
        if (vimeoMatch) {
            return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
        }
        
        // Direct video file (mp4, webm, etc.)
        if (trimmedUrl.match(/\.(mp4|webm|ogg|mov)($|\?)/i)) {
            return trimmedUrl;
        }
        
        return trimmedUrl;
    };

    const embedUrl = getEmbedUrl(videoUrl);

    return (
        <div className="fixed inset-0 bg-black/80 dark:bg-black/90 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
                <div className="absolute -top-12 right-0 flex items-center gap-2">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors shadow-lg"
                    >
                        <X className="w-4 h-4" />
                        Close
                    </button>
                </div>
                
                <div className="bg-black rounded-xl overflow-hidden shadow-2xl">
                    <div className="aspect-video">
                        {embedUrl?.match(/\.(mp4|webm|ogg|mov)($|\?)/i) ? (
                            <video
                                controls
                                autoPlay
                                className="w-full h-full"
                                src={embedUrl}
                            >
                                Your browser does not support the video tag.
                            </video>
                        ) : (
                            <iframe
                                src={embedUrl || ''}
                                title="Video preview"
                                className="w-full h-full"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        )}
                    </div>
                </div>
                
                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-400">
                        <ExternalLink className="w-3.5 h-3.5 inline-block mr-1" />
                        Preview mode - This is how students will see the video
                    </p>
                </div>
            </div>
        </div>
    );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getBlocks = (item: ContentItem) => {
    const blocks: any[] = (item as any).content_blocks || [];
    const videoBlock = blocks.find((b: any) => b.type === "video") ?? null;
    const quizBlock  = blocks.find((b: any) => b.type === "quiz")  ?? null;
    return { videoBlock, quizBlock };
};

const getEmbedUrl = (url: string): string | null => {
    const trimmedUrl = url.trim();
    
    // YouTube
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = trimmedUrl.match(youtubeRegex);
    if (youtubeMatch) {
        return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    
    // Vimeo
    const vimeoRegex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:\w+\/)?|album\/(?:\d+\/)?video\/|video\/|)(\d+)(?:[?&][^#]*)?/;
    const vimeoMatch = trimmedUrl.match(vimeoRegex);
    if (vimeoMatch) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    
    // Direct video file (mp4, webm, etc.)
    if (trimmedUrl.match(/\.(mp4|webm|ogg|mov)($|\?)/i)) {
        return trimmedUrl;
    }
    
    return trimmedUrl;
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
    onSaveVideoBlock,
}) => {
    const [expandedModules, setExpandedModules] = useState<Set<string>>(
        new Set(curriculum.map((m) => m.id))
    );
    const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
    const [activePlusMenu, setActivePlusMenu]   = useState<ActivePlusMenu | null>(null);
    const [contentOptions, setContentOptions]   = useState<ContentOptions | null>(null);
    const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

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
        setContentOptions({ moduleId, lessonId, mode: "picker", videoUrl: "", quizTitle: "", isUploading: false, uploadProgress: 0 });
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
        
        // First update the local state
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
        
        onChange(updatedCurriculum);
        
        // Save to database
        if (!lessonId.startsWith('lesson-')) {
            if (onUpdateLessonContent) {
                const updatedLesson = updatedCurriculum
                    .find(m => m.id === moduleId)
                    ?.lessons.find(l => l.id === lessonId);
                if (updatedLesson) {
                    await onUpdateLessonContent(moduleId, lessonId, (updatedLesson as any).content_blocks || []);
                }
            }
            if (onSaveVideoBlock) {
                await onSaveVideoBlock(moduleId, lessonId, contentOptions.videoUrl);
            }
        }
        
        setContentOptions(null);
        setExpandedLessons((prev) => { const next = new Set(prev); next.delete(lessonId); return next; });
    };

    const handleSaveQuizTitle = async (moduleId: string, lessonId: string) => {
        if (!contentOptions?.quizTitle.trim()) return;

        let quizId: string = crypto.randomUUID();

        if (onCreateQuiz) {
            try {
                quizId = await onCreateQuiz(moduleId, lessonId, contentOptions.quizTitle);
            } catch (err) {
                console.error("Failed to create quiz:", err);
                return;
            }
        }

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

        onChange(updatedCurriculum);
        
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
        
        onChange(updatedCurriculum);
        
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
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <button
                                                                            onClick={handleVideoLinkClick}
                                                                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-xs font-medium transition-all"
                                                                        >
                                                                            <Link className="w-3.5 h-3.5" />
                                                                            Video Link
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setContentOptions({ ...contentOptions, mode: "video-upload" })}
                                                                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-xs font-medium transition-all"
                                                                        >
                                                                            <Upload className="w-3.5 h-3.5" />
                                                                            Upload Video
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
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                                        Add video content via YouTube/Vimeo link or upload video file directly
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {/* Video Upload with Progress and Preview */}
                                                            {showingOpts && contentOptions?.mode === "video-upload" && (
                                                                <div className="pt-2">
                                                                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                                                                        Upload Video
                                                                    </p>

                                                                    {/* File Input (hidden) */}
                                                                    <input
                                                                        type="file"
                                                                        accept="video/*"
                                                                        id="video-upload-input"
                                                                        className="hidden"
                                                                        onChange={async (e) => {
                                                                            const file = e.target.files?.[0];
                                                                            if (!file) return;

                                                                            // Validate file
                                                                            const validation = CloudinaryVideoUploadService.validateVideoFile(file);
                                                                            if (!validation.valid) {
                                                                                setContentOptions({
                                                                                    ...contentOptions,
                                                                                    uploadError: validation.error || "Invalid video file"
                                                                                });
                                                                                return;
                                                                            }

                                                                            setContentOptions({
                                                                                ...contentOptions,
                                                                                isUploading: true,
                                                                                uploadProgress: 0,
                                                                                uploadError: undefined
                                                                            });

                                                                            try {
                                                                                // Upload to Cloudinary
                                                                                const response = await CloudinaryVideoUploadService.uploadVideo(file, (progress) => {
                                                                                    setContentOptions(prev => prev ? {
                                                                                        ...prev,
                                                                                        uploadProgress: progress.percentage
                                                                                    } : null);
                                                                                });

                                                                                // Add video to lesson
                                                                                const updatedCurriculum = curriculum.map((m) =>
                                                                                    m.id === contentOptions.moduleId ? {
                                                                                        ...m,
                                                                                        lessons: m.lessons.map((l) => {
                                                                                            if (l.id !== contentOptions.lessonId) return l;
                                                                                            const blocks: any[] = (l as any).content_blocks || [];
                                                                                            const newBlock = {
                                                                                                id: crypto.randomUUID(),
                                                                                                type: "video",
                                                                                                content: response.secure_url,
                                                                                                position: blocks.length,
                                                                                                title: "",
                                                                                                attributes: {
                                                                                                    source_url: response.secure_url,
                                                                                                    is_external: false,
                                                                                                    media_metadata: {
                                                                                                        cloudinary_id: response.public_id,
                                                                                                        public_id: response.public_id,
                                                                                                        secure_url: response.secure_url,
                                                                                                        resource_type: "video",
                                                                                                        format: response.format,
                                                                                                        bytes: response.bytes,
                                                                                                        original_filename: response.original_filename || file.name,
                                                                                                        width: response.width,
                                                                                                        height: response.height,
                                                                                                        duration: response.duration,
                                                                                                        thumbnail_url: CloudinaryVideoUploadService.generateThumbnailUrl(response.public_id),
                                                                                                    },
                                                                                                },
                                                                                            };
                                                                                            return { ...l, content_blocks: [...blocks, newBlock] };
                                                                                        }),
                                                                                    } : m
                                                                                );

                                                                                onChange(updatedCurriculum);

                                                                                // Save to database
                                                                                if (!contentOptions.lessonId.startsWith('lesson-')) {
                                                                                    if (onUpdateLessonContent) {
                                                                                        const updatedLesson = updatedCurriculum
                                                                                            .find(m => m.id === contentOptions.moduleId)
                                                                                            ?.lessons.find(l => l.id === contentOptions.lessonId);
                                                                                        if (updatedLesson) {
                                                                                            await onUpdateLessonContent(contentOptions.moduleId, contentOptions.lessonId, (updatedLesson as any).content_blocks || []);
                                                                                        }
                                                                                    }
                                                                                }

                                                                                // Set preview
                                                                                setContentOptions({
                                                                                    ...contentOptions,
                                                                                    isUploading: false,
                                                                                    uploadProgress: 100,
                                                                                    uploadedVideoPreview: response.secure_url
                                                                                });
                                                                            } catch (error) {
                                                                                console.error("Video upload error:", error);
                                                                                setContentOptions({
                                                                                    ...contentOptions,
                                                                                    isUploading: false,
                                                                                    uploadProgress: 0,
                                                                                    uploadError: error instanceof Error ? error.message : "Upload failed. Please try again."
                                                                                });
                                                                            }

                                                                            // Reset file input
                                                                            e.target.value = "";
                                                                        }}
                                                                    />

                                                                    {/* Upload Progress */}
                                                                    {contentOptions.isUploading && (
                                                                        <div className="mb-4">
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2">
                                                                                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                                                                    Uploading video...
                                                                                </span>
                                                                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                                                    {Math.round(contentOptions.uploadProgress)}%
                                                                                </span>
                                                                            </div>
                                                                            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                                <div
                                                                                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
                                                                                    style={{ width: `${contentOptions.uploadProgress}%` }}
                                                                                />
                                                                            </div>
                                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                                                Please wait while your video is being uploaded to Cloudinary...
                                                                            </p>
                                                                        </div>
                                                                    )}

                                                                    {/* Uploaded Video Preview */}
                                                                    {contentOptions.uploadedVideoPreview && (
                                                                        <div className="mb-4">
                                                                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-slate-800">
                                                                                <div className="px-3 py-2 bg-gray-100 dark:bg-slate-700 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
                                                                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                                                                        <Check className="w-3.5 h-3.5 text-green-600" />
                                                                                        Video Uploaded Successfully
                                                                                    </span>
                                                                                </div>
                                                                                <div className="aspect-video bg-black">
                                                                                    <video
                                                                                        controls
                                                                                        className="w-full h-full"
                                                                                        src={contentOptions.uploadedVideoPreview}
                                                                                    >
                                                                                        Your browser does not support the video tag.
                                                                                    </video>
                                                                                </div>
                                                                                <div className="px-3 py-2 bg-gray-50 dark:bg-slate-800">
                                                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                                        Preview your uploaded video
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-2 mt-3">
                                                                                <button
                                                                                    onClick={() => {
                                                                                        // Save and close
                                                                                        setContentOptions(null);
                                                                                        setExpandedLessons((prev) => {
                                                                                            const next = new Set(prev);
                                                                                            next.delete(contentOptions.lessonId);
                                                                                            return next;
                                                                                        });
                                                                                    }}
                                                                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                                                                                >
                                                                                    <Check className="w-3.5 h-3.5" />
                                                                                    Save & Close
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        // Re-upload
                                                                                        setContentOptions({
                                                                                            ...contentOptions,
                                                                                            isUploading: false,
                                                                                            uploadProgress: 0,
                                                                                            uploadedVideoPreview: undefined
                                                                                        });
                                                                                        // Trigger file input
                                                                                        setTimeout(() => {
                                                                                            document.getElementById('video-upload-input')?.click();
                                                                                        }, 100);
                                                                                    }}
                                                                                    className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-xs font-medium transition-colors"
                                                                                >
                                                                                    Upload Different Video
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Upload Instructions */}
                                                                    {!contentOptions.isUploading && !contentOptions.uploadedVideoPreview && (
                                                                        <div className="space-y-3">
                                                                            {contentOptions.uploadError && (
                                                                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                                                                                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                                                                    <div className="flex-1">
                                                                                        <p className="text-sm text-red-600 dark:text-red-400">{contentOptions.uploadError}</p>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => document.getElementById('video-upload-input')?.click()}
                                                                                className="w-full py-3 bg-[#304DB5] hover:bg-[#2540a3] text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                                                            >
                                                                                <Upload className="w-5 h-5" />
                                                                                Choose Video File
                                                                            </button>
                                                                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                                                <Video className="w-3.5 h-3.5" />
                                                                                <span>Select a video file to upload (MP4, MOV, AVI, WebM - max 100MB)</span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Video URL input with preview */}
                                                            {showingOpts && contentOptions?.mode === "video-input" && (
                                                                <div className="pt-2">
                                                                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                                                                        Video URL
                                                                    </p>
                                                                    <div className="flex items-center gap-2 mb-3">
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
                                                                            title="Save video"
                                                                        >
                                                                            <Check className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setContentOptions((c) => c ? { ...c, mode: "picker" } : c)}
                                                                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg transition-colors"
                                                                            title="Cancel"
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                    
                                                                    {/* Video Preview */}
                                                                    {contentOptions.videoUrl.trim() && getEmbedUrl(contentOptions.videoUrl) && (
                                                                        <div className="mt-3 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-800">
                                                                            <div className="px-3 py-2 bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
                                                                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                                                                                    <Video className="w-3.5 h-3.5" />
                                                                                    Video Preview
                                                                                </span>
                                                                                <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                                                                    <Check className="w-3 h-3" />
                                                                                    Valid URL
                                                                                </span>
                                                                            </div>
                                                                            <div className="aspect-video bg-black">
                                                                                {(() => {
                                                                                    const embedUrl = getEmbedUrl(contentOptions.videoUrl);
                                                                                    if (!embedUrl) return null;
                                                                                    
                                                                                    if (embedUrl.match(/\.(mp4|webm|ogg|mov)($|\?)/i)) {
                                                                                        return (
                                                                                            <video
                                                                                                controls
                                                                                                className="w-full h-full"
                                                                                                src={embedUrl}
                                                                                            >
                                                                                                Your browser does not support the video tag.
                                                                                            </video>
                                                                                        );
                                                                                    }
                                                                                    
                                                                                    return (
                                                                                        <iframe
                                                                                            src={embedUrl}
                                                                                            title="Video preview"
                                                                                            className="w-full h-full"
                                                                                            frameBorder="0"
                                                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                                            allowFullScreen
                                                                                        />
                                                                                    );
                                                                                })()}
                                                                            </div>
                                                                            <p className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700">
                                                                                Preview only — Click ✓ to save to lesson
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                    
                                                                    {/* Invalid URL warning */}
                                                                    {contentOptions.videoUrl.trim() && !getEmbedUrl(contentOptions.videoUrl) && (
                                                                        <div className="mt-2 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                                                                            <X className="w-3.5 h-3.5 flex-shrink-0" />
                                                                            <span>Unable to preview this URL. Make sure it's a valid YouTube, Vimeo, or direct video file URL.</span>
                                                                        </div>
                                                                    )}
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

                                                            {/* Video block display with preview button */}
                                                            {!showingOpts && videoBlock && (
                                                                <div className="pt-2">
                                                                    {/* Check if this is an uploaded Cloudinary video or external link */}
                                                                    {videoBlock.content?.includes('cloudinary.com') && videoBlock.content?.includes('/video/upload/') ? (
                                                                        // UPLOADED VIDEO (Cloudinary) - Show inline video player
                                                                        <div className="rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 bg-black">
                                                                            <video
                                                                                src={videoBlock.content}
                                                                                controls
                                                                                className="w-full aspect-video"
                                                                                poster={videoBlock.attributes?.media_metadata?.thumbnail_url}
                                                                                preload="metadata"
                                                                            >
                                                                                <track kind="captions" />
                                                                                Your browser does not support the video tag.
                                                                            </video>
                                                                            {videoBlock.attributes?.caption && (
                                                                                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2 italic px-4 pb-3">
                                                                                    {videoBlock.attributes.caption}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        // EXTERNAL VIDEO (YouTube/Vimeo) - Show URL with play button
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="flex items-center gap-2 flex-1 min-w-0 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2">
                                                                                <Video className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                                                                <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                                                                                    {videoBlock.content || "No URL"}
                                                                                </span>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => setPreviewVideoUrl(videoBlock.content)}
                                                                                className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors flex-shrink-0"
                                                                                title="Preview video"
                                                                            >
                                                                                <Play className="w-4 h-4" />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDeleteBlock(module.id, item.id, videoBlock.id)}
                                                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                                                                                title="Remove video"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                    )}
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

            {/* Video Preview Modal */}
            {previewVideoUrl && (
                <VideoPreviewModal
                    videoUrl={previewVideoUrl}
                    onClose={() => setPreviewVideoUrl(null)}
                />
            )}
        </div>
    );
};

export default CurriculumEditor;