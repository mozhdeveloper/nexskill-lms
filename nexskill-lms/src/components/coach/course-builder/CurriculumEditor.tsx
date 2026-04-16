import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
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
    FileText,
    File,
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
import type { LessonContentItem, ContentMetadata } from "../../../types/lesson-content-item";
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
    onRefreshLesson?: (moduleId: string, lessonId: string) => void;
    // Content items props (for multiple content per lesson)
    lessonContentItems?: Record<string, LessonContentItem[]>;
    loadingContentItems?: Set<string>;
    onFetchContentItems?: (lessonId: string) => Promise<void>;
    onAddContentItem?: (lessonId: string, moduleId: string, contentType: 'video' | 'quiz' | 'text' | 'document', metadata?: any, contentId?: string) => Promise<any>;
    onDeleteContentItem?: (lessonId: string, contentItemId: string) => Promise<void>;
    onMoveContentItemUp?: (lessonId: string, contentItemId: string) => Promise<void>;
    onMoveContentItemDown?: (lessonId: string, contentItemId: string) => Promise<void>;
    onUpdateContentItemMetadata?: (contentItemId: string, metadata: any) => Promise<any>;
    courseId?: string;
}

interface ActivePlusMenu {
    moduleId: string;
    lessonId: string;
}

interface ContentOptions {
    moduleId: string;
    lessonId: string;
    mode: "picker" | "video-input" | "video-upload" | "quiz-input" | "notes" | "notes-preview" | "notes-edit";
    videoUrl: string;
    quizTitle: string;
    notesContent?: string;
    notesContentItemId?: string; // ID of existing notes content item for editing
    isUploading: boolean;
    uploadProgress: number;
    uploadedVideoPreview?: string;
    uploadError?: string;
    videoDuration?: number; // Duration in seconds
    videoMetadata?: {
        duration: number;
        thumbnail_url?: string;
        cloudinary_public_id?: string;
    };
    // For multiple content items
    contentItemId?: string; // ID of existing content item being edited
    position?: number; // Position for new content item
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
                    <p className="text-xs text-blue-500 font-medium mt-2">
                      💡 To show video duration: Open the lesson preview and play the video for 2 seconds
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
    // Content items props
    lessonContentItems = {},
    loadingContentItems = new Set(),
    onFetchContentItems,
    onAddContentItem,
    onDeleteContentItem,
    onMoveContentItemUp,
    onMoveContentItemDown,
    onUpdateContentItemMetadata,
    courseId,
}) => {
    const [expandedModules, setExpandedModules] = useState<Set<string>>(
        new Set(curriculum.map((m) => m.id))
    );
    const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
    const [activePlusMenu, setActivePlusMenu]   = useState<ActivePlusMenu | null>(null);
    const [contentOptions, setContentOptions]   = useState<ContentOptions | null>(null);
    const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
    const [isFetchingDuration, setIsFetchingDuration] = useState(false);

    // Parse ISO 8601 duration format (PT1H2M10S = 1 hour 2 minutes 10 seconds)
    const parseISODuration = (isoDuration: string): number => {
        const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return 0;

        const hours = parseInt(match[1] || '0', 10);
        const minutes = parseInt(match[2] || '0', 10);
        const seconds = parseInt(match[3] || '0', 10);

        return (hours * 3600) + (minutes * 60) + seconds;
    };

    // Fetch YouTube video duration using YouTube Data API v3
    const fetchYouTubeDuration = useCallback(async (url: string): Promise<number | null> => {
        const videoId = url.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/)?.[1];
        if (!videoId) return null;

        try {
            setIsFetchingDuration(true);
            const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
            
            console.log('[CurriculumEditor] Fetching YouTube duration for:', videoId);
            console.log('[CurriculumEditor] API key present:', !!apiKey);
            
            if (!apiKey) {
                console.warn('[CurriculumEditor] YouTube API key not configured');
                return null;
            }

            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${apiKey}`
            );
            
            console.log('[CurriculumEditor] API response status:', response.status);
            
            if (!response.ok) return null;
            
            const data = await response.json();
            console.log('[CurriculumEditor] YouTube API response:', data);
            
            if (!data.items || data.items.length === 0) return null;

            const isoDuration = data.items[0].contentDetails.duration;
            const duration = parseISODuration(isoDuration);
            
            console.log('[CurriculumEditor] Parsed duration:', duration, 'seconds from ISO:', isoDuration);
            return duration;
        } catch (err) {
            console.error('[CurriculumEditor] Error fetching YouTube duration:', err);
            return null;
        } finally {
            setIsFetchingDuration(false);
        }
    }, []);

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
            content_status: 'draft',
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

    const handleSaveNotes = async (moduleId: string, lessonId: string, keepPickerOpen: boolean = false) => {
        if (!contentOptions?.notesContent?.trim()) return;

        // Calculate word count and reading time
        const text = contentOptions.notesContent.replace(/<[^>]*>/g, " ").trim();
        const words = text.split(/\s+/).filter(word => word.length > 0);
        const wordCount = words.length;
        const readingTime = Math.ceil(wordCount / 200);

        try {
            // Save to new lesson_content_items table
            if (onAddContentItem && courseId) {
                await onAddContentItem(
                    lessonId,
                    moduleId,
                    'text' as any, // Will be updated to support 'notes'
                    {
                        content: contentOptions.notesContent,
                        title: 'Notes',
                        word_count: wordCount,
                        reading_time: readingTime,
                    },
                    undefined
                );
                // Refresh content items
                if (onFetchContentItems) {
                    await onFetchContentItems(lessonId);
                }
            }

            // Clear notes content for next entry
            setContentOptions({
                ...contentOptions,
                notesContent: '',
                mode: (keepPickerOpen ? "picker" : null) as ContentOptions["mode"]
            });
        } catch (error) {
            console.error('Error creating notes content item:', error);
        }
    };

    const handleSaveVideoUrl = async (moduleId: string, lessonId: string) => {
        if (!contentOptions?.videoUrl.trim()) return;

        console.log('[CurriculumEditor] Saving video:', {
            url: contentOptions.videoUrl,
            duration: contentOptions.videoDuration,
            metadata: contentOptions.videoMetadata,
        });

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
                        attributes: contentOptions.videoMetadata ? {
                            media_metadata: contentOptions.videoMetadata,
                            is_external: true,
                            external_url: contentOptions.videoUrl,
                        } : {
                            is_external: true,
                            external_url: contentOptions.videoUrl,
                        },
                    };
                    return { ...l, content_blocks: [...blocks, newBlock] };
                }),
            } : m
        );

        onChange(updatedCurriculum);

        // Save to database (legacy - content_blocks)
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

        // ALSO save to new lesson_content_items table
        if (onAddContentItem && courseId) {
            try {
                // Fetch video title from YouTube API if it's a YouTube URL
                let videoTitle = 'Video';
                let thumbnailUrl = undefined;
                const videoId = contentOptions.videoUrl.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/)?.[1];
                
                if (videoId && contentOptions.videoUrl.includes('youtube')) {
                    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
                    if (apiKey) {
                        try {
                            const response = await fetch(
                                `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
                            );
                            const data = await response.json();
                            if (data.items && data.items.length > 0) {
                                videoTitle = data.items[0].snippet.title;
                                thumbnailUrl = data.items[0].snippet.thumbnails?.medium?.url;
                            }
                        } catch (err) {
                            console.error('Error fetching YouTube video title:', err);
                        }
                    }
                }

                await onAddContentItem(
                    lessonId,
                    moduleId,
                    'video',
                    {
                        video_type: contentOptions.videoUrl.includes('youtube') || contentOptions.videoUrl.includes('vimeo') ? 'external' : 'cloudinary',
                        url: contentOptions.videoUrl,
                        duration: contentOptions.videoDuration,
                        thumbnail_url: thumbnailUrl || contentOptions.videoMetadata?.thumbnail_url,
                        cloudinary_public_id: contentOptions.videoMetadata?.cloudinary_public_id,
                        title: videoTitle,
                    },
                    undefined
                );
                // Refresh content items
                if (onFetchContentItems) {
                    await onFetchContentItems(lessonId);
                }
            } catch (error) {
                console.error('Error creating content item:', error);
            }
        }

        setContentOptions(null);
        // Keep lesson expanded after adding content
        // setExpandedLessons((prev) => { const next = new Set(prev); next.delete(lessonId); return next; });

        // Trigger refresh to update sidebar durations

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

        // Save to database (legacy - content_blocks)
        if (!lessonId.startsWith('lesson-') && onUpdateLessonContent) {
            const updatedLesson = updatedCurriculum
                .find(m => m.id === moduleId)
                ?.lessons.find(l => l.id === lessonId);
            if (updatedLesson) {
                await onUpdateLessonContent(moduleId, lessonId, (updatedLesson as any).content_blocks || []);
            }
        }

        // ALSO save to new lesson_content_items table
        if (onAddContentItem && courseId) {
            try {
                // Fetch quiz title from database
                let quizTitle = contentOptions.quizTitle || 'Quiz';
                
                await onAddContentItem(
                    lessonId,
                    moduleId,
                    'quiz',
                    {
                        title: quizTitle,
                    },
                    quizId
                );
                // Refresh content items
                if (onFetchContentItems) {
                    await onFetchContentItems(lessonId);
                }
            } catch (error) {
                console.error('Error creating content item:', error);
            }
        }

        setContentOptions(null);
        // Keep lesson expanded after adding content
        // setExpandedLessons((prev) => {
        //     const next = new Set(prev);
        //     next.delete(lessonId);
        //     return next;
        // });

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
                                                            {/* Pending deletion badge */}
                                                            {(item as any).content_status === 'pending_deletion' && (
                                                                <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full font-medium border border-red-200 dark:border-red-800">
                                                                    <AlertCircle className="w-3 h-3" />
                                                                    Pending Deletion
                                                                </span>
                                                            )}
                                                            {!lessonExpanded && hasContent && (
                                                            <div className="flex-shrink-0 flex flex-row gap-1">
                                                                {videoBlock && (
                                                                    <span className="flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full font-medium">
                                                                        <Video className="w-3 h-3" />
                                                                    </span>
                                                                )}
                                                                {quizBlock && (
                                                                    <span className="flex items-center gap-1 text-xs text-purple-500 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full font-medium">
                                                                        <FileQuestion className="w-3 h-3" />
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                        </div>

                                                        <button
                                                            onClick={() => handleDeleteLesson(module.id, item.id)}
                                                            disabled={(item as any).content_status === 'pending_deletion'}
                                                            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 rounded-lg transition-all flex-shrink-0 disabled:opacity-25 disabled:cursor-not-allowed"
                                                            title={(item as any).content_status === 'pending_deletion' ? 'Already marked for deletion' : 'Delete lesson'}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>

                                                    {/* ── Expanded area ── */}
                                                    {lessonExpanded && (
                                                        <div className="px-12 pb-4 pt-0">
                                                            {/* Content Items List */}
                                                            {onFetchContentItems && onAddContentItem && courseId && (
                                                                <div className="mt-3 space-y-2">
                                                                    {/* Added content items */}
                                                                    {(lessonContentItems?.[item.id] || []).length > 0 && (
                                                                        <div className="space-y-1 mb-3">
                                                                            {(lessonContentItems?.[item.id] || []).map((contentItem, idx) => (
                                                                                <div
                                                                                    key={contentItem.id}
                                                                                    className={`group flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                                                                                        (contentItem as any).content_status === 'pending_deletion'
                                                                                            ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 opacity-60'
                                                                                            : ['pending_addition', 'draft'].includes((contentItem as any).content_status)
                                                                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                                                                                            : 'bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
                                                                                    }`}
                                                                                >
                                                                                    {/* Drag handle */}
                                                                                    <div className="flex-shrink-0 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                        <GripVertical className="w-4 h-4 text-gray-400" />
                                                                                    </div>
                                                                                    {/* Icon */}
                                                                                    <div className="flex-shrink-0">
                                                                                        {contentItem.content_type === 'video' && (
                                                                                            <Video className="w-4 h-4 text-blue-500" />
                                                                                        )}
                                                                                        {contentItem.content_type === 'quiz' && (
                                                                                            <FileQuestion className="w-4 h-4 text-purple-500" />
                                                                                        )}
                                                                                        {contentItem.content_type === 'text' && contentItem.metadata?.content && (
                                                                                            <FileText className="w-4 h-4 text-green-500" />
                                                                                        )}
                                                                                        {contentItem.content_type === 'text' && !contentItem.metadata?.content && (
                                                                                            <FileText className="w-4 h-4 text-green-500" />
                                                                                        )}
                                                                                        {contentItem.content_type === 'document' && (
                                                                                            <File className="w-4 h-4 text-orange-500" />
                                                                                        )}
                                                                                    </div>
                                                                                    {/* Title */}
                                                                                    <span className="text-sm text-gray-700 dark:text-gray-200 flex-1 truncate" title={contentItem.content_type === 'video' ? contentItem.metadata?.url : undefined}>
                                                                                        {contentItem.content_type === 'video' ? (contentItem.metadata?.title || 'Video') :
                                                                                         contentItem.content_type === 'quiz' ? (contentItem.metadata?.title || 'Quiz') :
                                                                                         contentItem.content_type === 'text' && contentItem.metadata?.content ? 'Notes' :
                                                                                         contentItem.content_type === 'text' ? 'Text' : 'Document'}
                                                                                    </span>
                                                                                    {/* Pending deletion badge */}
                                                                                    {(contentItem as any).content_status === 'pending_deletion' && (
                                                                                        <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full font-medium border border-red-200 dark:border-red-700">
                                                                                            <AlertCircle className="w-3 h-3" />
                                                                                            Pending Deletion
                                                                                        </span>
                                                                                    )}
                                                                                    {/* Pending addition badge */}
                                                                                    {['pending_addition', 'draft'].includes((contentItem as any).content_status) && (
                                                                                        <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full font-medium border border-blue-200 dark:border-blue-800">
                                                                                            <AlertCircle className="w-3 h-3" />
                                                                                            Pending Approval
                                                                                        </span>
                                                                                    )}
                                                                                    {/* Play button for videos */}
                                                                                    {contentItem.content_type === 'video' && contentItem.metadata?.url && (
                                                                                        <button
                                                                                            onClick={() => setPreviewVideoUrl(contentItem.metadata.url || null)}
                                                                                            className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors flex-shrink-0"
                                                                                            title="Preview video"
                                                                                        >
                                                                                            <Play className="w-4 h-4" />
                                                                                        </button>
                                                                                    )}
                                                                                    {/* Preview/Edit button for notes */}
                                                                                    {contentItem.content_type === 'text' && contentItem.metadata?.content && (
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                setContentOptions({
                                                                                                    moduleId: module.id,
                                                                                                    lessonId: item.id,
                                                                                                    mode: "notes-preview",
                                                                                                    videoUrl: "",
                                                                                                    quizTitle: "",
                                                                                                    isUploading: false,
                                                                                                    uploadProgress: 0,
                                                                                                    notesContent: contentItem.metadata?.content,
                                                                                                    notesContentItemId: contentItem.id,
                                                                                                });
                                                                                            }}
                                                                                            className="px-3 py-1.5 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors flex-shrink-0"
                                                                                            title="Preview/Edit notes"
                                                                                        >
                                                                                            Preview/Edit
                                                                                        </button>
                                                                                    )}
                                                                                    {/* Edit button for quizzes */}
                                                                                    {contentItem.content_type === 'quiz' && contentItem.content_id && onEditQuiz && (
                                                                                        <button
                                                                                            onClick={() => onEditQuiz(module.id, item.id, contentItem.content_id!)}
                                                                                            className="px-3 py-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors flex-shrink-0"
                                                                                        >
                                                                                            Edit
                                                                                        </button>
                                                                                    )}
                                                                                    {/* Delete button */}
                                                                                    {onDeleteContentItem && (contentItem as any).content_status !== 'pending_deletion' && (
                                                                                        <button
                                                                                            onClick={() => onDeleteContentItem(item.id, contentItem.id)}
                                                                                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                                                                        >
                                                                                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                    
                                                                    {/* Add content button */}
                                                                    {showingOpts ? (
                                                                        <button
                                                                            onClick={() => setContentOptions(null)}
                                                                            className="flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                                                            title="Close"
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => {
                                                                                setActivePlusMenu({ moduleId: module.id, lessonId: item.id });
                                                                                setContentOptions({
                                                                                    moduleId: module.id,
                                                                                    lessonId: item.id,
                                                                                    mode: "picker",
                                                                                    videoUrl: "",
                                                                                    quizTitle: "",
                                                                                    isUploading: false,
                                                                                    uploadProgress: 0,
                                                                                });
                                                                            }}
                                                                            className="text-xs flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                                                            title="Add content"
                                                                        >
                                                                            <Plus className="w-4 h-4 mr-1" />
                                                                             Add Content
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Picker */}
                                                            {showingOpts && contentOptions?.mode === "picker" && (
                                                                <div className="pt-2">
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
                                                                            onClick={() => {
                                                                                // Add notes content type
                                                                                setContentOptions({ ...contentOptions, mode: "notes" });
                                                                            }}
                                                                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-700 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 rounded-lg text-xs font-medium transition-all"
                                                                        >
                                                                            <FileText className="w-3.5 h-3.5" />
                                                                            Notes
                                                                        </button>
                                                                    </div>
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

                                                                                // Save to database (legacy - content_blocks)
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

                                                                                // ALSO save to new lesson_content_items table
                                                                                if (onAddContentItem && courseId) {
                                                                                    try {
                                                                                        await onAddContentItem(
                                                                                            contentOptions.lessonId,
                                                                                            contentOptions.moduleId,
                                                                                            'video',
                                                                                            {
                                                                                                video_type: 'cloudinary',
                                                                                                url: response.secure_url,
                                                                                                duration: response.duration,
                                                                                                thumbnail_url: CloudinaryVideoUploadService.generateThumbnailUrl(response.public_id),
                                                                                                cloudinary_public_id: response.public_id,
                                                                                                title: response.original_filename || file.name,
                                                                                            },
                                                                                            undefined
                                                                                        );
                                                                                        // Refresh content items
                                                                                        if (onFetchContentItems) {
                                                                                            await onFetchContentItems(contentOptions.lessonId);
                                                                                        }
                                                                                    } catch (error) {
                                                                                        console.error('Error creating content item:', error);
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
                                                                                        // Save and keep lesson expanded
                                                                                        setContentOptions(null);
                                                                                        // Keep lesson expanded - don't collapse
                                                                                        // setExpandedLessons((prev) => {
                                                                                        //     const next = new Set(prev);
                                                                                        //     next.delete(contentOptions.lessonId);
                                                                                        //     return next;
                                                                                        // });
                                                                                    }}
                                                                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                                                                                >
                                                                                    <Check className="w-3.5 h-3.5" />
                                                                                    Save & Add
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
                                                                                onChange={async (e) => {
                                                                                    const newUrl = e.target.value;
                                                                                    console.log('[CurriculumEditor] Video URL changed:', newUrl);
                                                                                    
                                                                                    // Fetch duration if it's a YouTube URL
                                                                                    if (newUrl.includes('youtube.com') || newUrl.includes('youtu.be')) {
                                                                                        const duration = await fetchYouTubeDuration(newUrl);
                                                                                        if (duration) {
                                                                                            setContentOptions((c) => c ? { 
                                                                                                ...c, 
                                                                                                videoUrl: newUrl,
                                                                                                videoDuration: duration,
                                                                                                videoMetadata: {
                                                                                                    duration,
                                                                                                    thumbnail_url: `https://img.youtube.com/vi/${newUrl.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/)?.[1]}/maxresdefault.jpg`,
                                                                                                }
                                                                                            } : c);
                                                                                            return;
                                                                                        }
                                                                                    }
                                                                                    
                                                                                    // No duration, just update URL
                                                                                    setContentOptions((c) => c ? { ...c, videoUrl: newUrl } : c);
                                                                                }}
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

                                                            {/* Notes Editor with React Quill */}
                                                            {showingOpts && contentOptions?.mode === "notes" && (
                                                                <div className="pt-2">
                                                                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
                                                                        {/* Header */}
                                                                        <div className="bg-green-50 dark:bg-green-900/20 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
                                                                            <div className="flex items-center gap-2">
                                                                                <FileText className="w-5 h-5 text-green-600" />
                                                                                <h3 className="font-semibold text-gray-700 dark:text-gray-200">Add Notes</h3>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <button
                                                                                    onClick={() => handleSaveNotes(module.id, item.id, true)}
                                                                                    disabled={!contentOptions.notesContent?.trim()}
                                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors text-sm font-medium"
                                                                                    title="Save and add another note"
                                                                                >
                                                                                    <Plus className="w-4 h-4" />
                                                                                    Save & Add Another
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleSaveNotes(module.id, item.id, false)}
                                                                                    disabled={!contentOptions.notesContent?.trim()}
                                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-md transition-colors text-sm font-medium"
                                                                                >
                                                                                    <Check className="w-4 h-4" />
                                                                                    Save Notes
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => setContentOptions((c) => c ? { ...c, mode: "picker" } : c)}
                                                                                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                                                >
                                                                                    <X className="w-4 h-4" />
                                                                                </button>
                                                                            </div>
                                                                        </div>

                                                                        {/* React Quill Editor */}
                                                                        <div className="p-4">
                                                                            <div className="notes-editor-container" style={{ height: '350px', display: 'flex', flexDirection: 'column' }}>
                                                                                <ReactQuill
                                                                                    theme="snow"
                                                                                    value={contentOptions.notesContent || ''}
                                                                                    onChange={(value) => setContentOptions((c) => c ? { ...c, notesContent: value } : c)}
                                                                                    placeholder="Write your notes here with rich formatting..."
                                                                                    modules={{
                                                                                        toolbar: [
                                                                                            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                                                                                            ['bold', 'italic', 'underline', 'strike'],
                                                                                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                                                            [{ 'indent': '-1' }, { 'indent': '+1' }],
                                                                                            [{ 'align': [] }],
                                                                                            ['link', 'blockquote', 'code-block'],
                                                                                            [{ 'color': [] }, { 'background': [] }],
                                                                                            ['clean'],
                                                                                        ],
                                                                                    }}
                                                                                    formats={[
                                                                                        'header',
                                                                                        'bold', 'italic', 'underline', 'strike',
                                                                                        'list', 'bullet',
                                                                                        'indent',
                                                                                        'align',
                                                                                        'link', 'blockquote', 'code-block',
                                                                                        'color', 'background',
                                                                                    ]}
                                                                                    style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                                                                                />
                                                                            </div>
                                                                            <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                                                                <div className="flex items-center gap-4">
                                                                                    <span className="flex items-center gap-1">
                                                                                        <FileText className="w-3.5 h-3.5" />
                                                                                        {contentOptions.notesContent?.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(w => w.length > 0).length || 0} words
                                                                                    </span>
                                                                                    <span>
                                                                                        ~{Math.ceil((contentOptions.notesContent?.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(w => w.length > 0).length || 0) / 200)} min read
                                                                                    </span>
                                                                                </div>
                                                                                <span>Rich text editor with formatting</span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Custom Styles for React Quill */}
                                                                        <style>{`
                                                                            .notes-editor-container .ql-toolbar {
                                                                                border: 1px solid #e5e7eb !important;
                                                                                border-bottom: none !important;
                                                                                border-radius: 0.375rem 0.375rem 0 0;
                                                                                background-color: #f9fafb;
                                                                            }
                                                                            .dark .notes-editor-container .ql-toolbar {
                                                                                background-color: #1e293b;
                                                                                border-color: #374151 !important;
                                                                            }
                                                                            .notes-editor-container .ql-container {
                                                                                border: 1px solid #e5e7eb !important;
                                                                                border-radius: 0 0 0.375rem 0.375rem;
                                                                                font-family: inherit;
                                                                                font-size: 0.875rem;
                                                                                background-color: white;
                                                                                flex: 1;
                                                                                overflow-y: auto;
                                                                            }
                                                                            .dark .notes-editor-container .ql-container {
                                                                                background-color: #0f172a;
                                                                                border-color: #374151 !important;
                                                                            }
                                                                            .notes-editor-container .ql-editor {
                                                                                min-height: 250px;
                                                                                line-height: 1.7;
                                                                            }
                                                                            .notes-editor-container .ql-editor p {
                                                                                margin-bottom: 1em;
                                                                            }
                                                                            .notes-editor-container .ql-editor blockquote {
                                                                                border-left: 4px solid #10b981;
                                                                                padding-left: 1em;
                                                                                margin-left: 0;
                                                                                margin-right: 0;
                                                                                font-style: italic;
                                                                                color: #6b7280;
                                                                            }
                                                                            .dark .notes-editor-container .ql-editor blockquote {
                                                                                color: #9ca3af;
                                                                            }
                                                                            .notes-editor-container .ql-editor code {
                                                                                background-color: #f3f4f6;
                                                                                padding: 0.2em 0.4em;
                                                                                border-radius: 0.25rem;
                                                                                font-size: 0.9em;
                                                                            }
                                                                            .dark .notes-editor-container .ql-editor code {
                                                                                background-color: #1e293b;
                                                                            }
                                                                            .notes-editor-container .ql-editor pre.ql-syntax {
                                                                                background-color: #1e293b;
                                                                                color: #e2e8f0;
                                                                                padding: 1em;
                                                                                border-radius: 0.375rem;
                                                                                overflow-x: auto;
                                                                            }
                                                                        `}</style>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Notes Preview/Edit Panel */}
                                                            {showingOpts && contentOptions?.mode === "notes-preview" && (
                                                                <div className="pt-2">
                                                                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
                                                                        {/* Header */}
                                                                        <div className="bg-green-50 dark:bg-green-900/20 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
                                                                            <div className="flex items-center gap-2">
                                                                                <FileText className="w-5 h-5 text-green-600" />
                                                                                <h3 className="font-semibold text-gray-700 dark:text-gray-200">Preview Notes</h3>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <button
                                                                                    onClick={() => setContentOptions((c) => c ? { ...c, mode: "notes-edit" } : c)}
                                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm font-medium"
                                                                                >
                                                                                    <PenLine className="w-4 h-4" />
                                                                                    Edit
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => setContentOptions((c) => c ? { ...c, mode: "picker" } : c)}
                                                                                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                                                >
                                                                                    <X className="w-4 h-4" />
                                                                                </button>
                                                                            </div>
                                                                        </div>

                                                                        {/* Preview Content - Rendered HTML */}
                                                                        <div className="p-4">
                                                                            <div 
                                                                                className="prose prose-slate dark:prose-invert max-w-none"
                                                                                dangerouslySetInnerHTML={{ __html: contentOptions.notesContent || '' }}
                                                                            />
                                                                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                                                                <span className="flex items-center gap-1">
                                                                                    <FileText className="w-3.5 h-3.5" />
                                                                                    {(contentOptions.notesContent || '').replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(w => w.length > 0).length} words
                                                                                </span>
                                                                                <span>
                                                                                    ~{Math.ceil(((contentOptions.notesContent || '').replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(w => w.length > 0).length || 0) / 200)} min read
                                                                                </span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Custom Styles for Preview */}
                                                                        <style>{`
                                                                            .prose {
                                                                                color: #374151;
                                                                                line-height: 1.7;
                                                                            }
                                                                            .dark .prose {
                                                                                color: #d1d5db;
                                                                            }
                                                                            .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
                                                                                font-weight: 600;
                                                                                margin-top: 1.5em;
                                                                                margin-bottom: 0.5em;
                                                                                color: #111827;
                                                                            }
                                                                            .dark .prose h1, .dark .prose h2, .dark .prose h3, .dark .prose h4, .dark .prose h5, .dark .prose h6 {
                                                                                color: #f3f4f6;
                                                                            }
                                                                            .prose p {
                                                                                margin-bottom: 1em;
                                                                            }
                                                                            .prose ul, .prose ol {
                                                                                padding-left: 1.5em;
                                                                                margin-bottom: 1em;
                                                                            }
                                                                            .prose blockquote {
                                                                                border-left: 4px solid #10b981;
                                                                                padding-left: 1em;
                                                                                margin-left: 0;
                                                                                margin-right: 0;
                                                                                font-style: italic;
                                                                                color: #6b7280;
                                                                            }
                                                                            .dark .prose blockquote {
                                                                                color: #9ca3af;
                                                                            }
                                                                            .prose code {
                                                                                background-color: #f3f4f6;
                                                                                padding: 0.2em 0.4em;
                                                                                border-radius: 0.25rem;
                                                                                font-size: 0.9em;
                                                                            }
                                                                            .dark .prose code {
                                                                                background-color: #1e293b;
                                                                            }
                                                                            .prose pre {
                                                                                background-color: #1e293b;
                                                                                color: #e2e8f0;
                                                                                padding: 1em;
                                                                                border-radius: 0.375rem;
                                                                                overflow-x: auto;
                                                                                margin-bottom: 1em;
                                                                            }
                                                                            .prose a {
                                                                                color: #10b981;
                                                                                text-decoration: underline;
                                                                            }
                                                                            .dark .prose a {
                                                                                color: #34d399;
                                                                            }
                                                                        `}</style>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Notes Edit Panel with React Quill */}
                                                            {showingOpts && contentOptions?.mode === "notes-edit" && (
                                                                <div className="pt-2">
                                                                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
                                                                        {/* Header */}
                                                                        <div className="bg-green-50 dark:bg-green-900/20 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
                                                                            <div className="flex items-center gap-2">
                                                                                <FileText className="w-5 h-5 text-green-600" />
                                                                                <h3 className="font-semibold text-gray-700 dark:text-gray-200">Edit Notes</h3>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <button
                                                                                    onClick={() => {
                                                                                        // Update the existing notes
                                                                                        if (contentOptions.notesContentItemId && onUpdateContentItemMetadata) {
                                                                                            const text = contentOptions.notesContent?.replace(/<[^>]*>/g, " ").trim() || '';
                                                                                            const words = text.split(/\s+/).filter(w => w.length > 0);
                                                                                            onUpdateContentItemMetadata(contentOptions.notesContentItemId, {
                                                                                                content: contentOptions.notesContent,
                                                                                                title: 'Notes',
                                                                                                word_count: words.length,
                                                                                                reading_time: Math.ceil(words.length / 200),
                                                                                            }).then(() => {
                                                                                                if (onFetchContentItems) {
                                                                                                    onFetchContentItems(item.id);
                                                                                                }
                                                                                                setContentOptions(null);
                                                                                            });
                                                                                        }
                                                                                    }}
                                                                                    disabled={!contentOptions.notesContent?.trim()}
                                                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-md transition-colors text-sm font-medium"
                                                                                >
                                                                                    <Check className="w-4 h-4" />
                                                                                    Save Changes
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => setContentOptions((c) => c ? { ...c, mode: "notes-preview" } : c)}
                                                                                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                                                    title="Preview"
                                                                                >
                                                                                    <Play className="w-4 h-4" />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => setContentOptions((c) => c ? { ...c, mode: "picker" } : c)}
                                                                                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                                                >
                                                                                    <X className="w-4 h-4" />
                                                                                </button>
                                                                            </div>
                                                                        </div>

                                                                        {/* React Quill Editor */}
                                                                        <div className="p-4">
                                                                            <div className="notes-editor-container" style={{ height: '350px', display: 'flex', flexDirection: 'column' }}>
                                                                                <ReactQuill
                                                                                    theme="snow"
                                                                                    value={contentOptions.notesContent || ''}
                                                                                    onChange={(value) => setContentOptions((c) => c ? { ...c, notesContent: value } : c)}
                                                                                    placeholder="Edit your notes here..."
                                                                                    modules={{
                                                                                        toolbar: [
                                                                                            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                                                                                            ['bold', 'italic', 'underline', 'strike'],
                                                                                            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                                                                            [{ 'indent': '-1' }, { 'indent': '+1' }],
                                                                                            [{ 'align': [] }],
                                                                                            ['link', 'blockquote', 'code-block'],
                                                                                            [{ 'color': [] }, { 'background': [] }],
                                                                                            ['clean'],
                                                                                        ],
                                                                                    }}
                                                                                    formats={[
                                                                                        'header',
                                                                                        'bold', 'italic', 'underline', 'strike',
                                                                                        'list', 'bullet',
                                                                                        'indent',
                                                                                        'align',
                                                                                        'link', 'blockquote', 'code-block',
                                                                                        'color', 'background',
                                                                                    ]}
                                                                                    style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                                                                                />
                                                                            </div>
                                                                            <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                                                                <div className="flex items-center gap-4">
                                                                                    <span className="flex items-center gap-1">
                                                                                        <FileText className="w-3.5 h-3.5" />
                                                                                        {contentOptions.notesContent?.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(w => w.length > 0).length || 0} words
                                                                                    </span>
                                                                                    <span>
                                                                                        ~{Math.ceil((contentOptions.notesContent?.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(w => w.length > 0).length || 0) / 200)} min read
                                                                                    </span>
                                                                                </div>
                                                                                <span>Edit existing notes - changes will be saved</span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Custom Styles for React Quill */}
                                                                        <style>{`
                                                                            .notes-editor-container .ql-toolbar {
                                                                                border: 1px solid #e5e7eb !important;
                                                                                border-bottom: none !important;
                                                                                border-radius: 0.375rem 0.375rem 0 0;
                                                                                background-color: #f9fafb;
                                                                            }
                                                                            .dark .notes-editor-container .ql-toolbar {
                                                                                background-color: #1e293b;
                                                                                border-color: #374151 !important;
                                                                            }
                                                                            .notes-editor-container .ql-container {
                                                                                border: 1px solid #e5e7eb !important;
                                                                                border-radius: 0 0 0.375rem 0.375rem;
                                                                                font-family: inherit;
                                                                                font-size: 0.875rem;
                                                                                background-color: white;
                                                                                flex: 1;
                                                                                overflow-y: auto;
                                                                            }
                                                                            .dark .notes-editor-container .ql-container {
                                                                                background-color: #0f172a;
                                                                                border-color: #374151 !important;
                                                                            }
                                                                            .notes-editor-container .ql-editor {
                                                                                min-height: 250px;
                                                                                line-height: 1.7;
                                                                            }
                                                                            .notes-editor-container .ql-editor p {
                                                                                margin-bottom: 1em;
                                                                            }
                                                                            .notes-editor-container .ql-editor blockquote {
                                                                                border-left: 4px solid #10b981;
                                                                                padding-left: 1em;
                                                                                margin-left: 0;
                                                                                margin-right: 0;
                                                                                font-style: italic;
                                                                                color: #6b7280;
                                                                            }
                                                                            .dark .notes-editor-container .ql-editor blockquote {
                                                                                color: #9ca3af;
                                                                            }
                                                                            .notes-editor-container .ql-editor code {
                                                                                background-color: #f3f4f6;
                                                                                padding: 0.2em 0.4em;
                                                                                border-radius: 0.25rem;
                                                                                font-size: 0.9em;
                                                                            }
                                                                            .dark .notes-editor-container .ql-editor code {
                                                                                background-color: #1e293b;
                                                                            }
                                                                            .notes-editor-container .ql-editor pre.ql-syntax {
                                                                                background-color: #1e293b;
                                                                                color: #e2e8f0;
                                                                                padding: 1em;
                                                                                border-radius: 0.375rem;
                                                                                overflow-x: auto;
                                                                            }
                                                                        `}</style>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Empty state - just + button */}
                                                            {!showingOpts && (!lessonContentItems?.[item.id] || lessonContentItems?.[item.id].length === 0) && (
                                                                <div className="pt-2">
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