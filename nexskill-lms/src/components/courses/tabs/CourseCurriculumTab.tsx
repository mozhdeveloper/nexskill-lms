import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabaseClient";
import { getSequentialLockedItemIds } from "../../../utils/sequentialLocking";

interface Lesson {
    id: string;
    title: string;
    duration?: string;
    type: "lesson" | "quiz";
}

interface Module {
    id: string;
    title: string;
    lessons: Lesson[];
    is_sequential?: boolean;
}

interface CourseCurriculumTabProps {
    curriculum: Module[];
    courseId?: string;
    isEnrolled?: boolean;
    completedLessonIds?: Set<string>;
    completedQuizIds?: Set<string>;
    onTotalDurationLoaded?: (totalSeconds: number) => void;
}

// ─── YouTube / Duration Helpers ───────────────────────────────────────────────

const parseISODuration = (isoDuration: string): number => {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    return (
        parseInt(match[1] || "0", 10) * 3600 +
        parseInt(match[2] || "0", 10) * 60 +
        parseInt(match[3] || "0", 10)
    );
};

const extractYouTubeId = (url: string): string | null =>
    url.match(
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    )?.[1] ?? null;

const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

const fetchYouTubeDurations = async (
    videoIds: string[]
): Promise<Map<string, number>> => {
    const result = new Map<string, number>();
    if (videoIds.length === 0) return result;

    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    if (!apiKey) return result;

    try {
        const chunks: string[][] = [];
        for (let i = 0; i < videoIds.length; i += 50)
            chunks.push(videoIds.slice(i, i + 50));

        for (const chunk of chunks) {
            const res = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${chunk.join(",")}&key=${apiKey}`
            );
            if (!res.ok) continue;
            const data = await res.json();
            for (const item of data.items ?? []) {
                result.set(item.id, parseISODuration(item.contentDetails.duration));
            }
        }
    } catch (err) {
        console.error("[CourseCurriculumTab] YouTube duration fetch error:", err);
    }
    return result;
};

// ─── Component ────────────────────────────────────────────────────────────────

const CourseCurriculumTab: React.FC<CourseCurriculumTabProps> = ({
    curriculum,
    courseId,
    isEnrolled = false,
    completedLessonIds = new Set(),
    completedQuizIds = new Set(),
    onTotalDurationLoaded,
}) => {
    const navigate = useNavigate();

    // Resolved durations keyed by lesson id (in seconds)
    const [durationMap, setDurationMap] = useState<Map<string, number>>(new Map());

    const [expandedModules, setExpandedModules] = useState<string[]>(
        curriculum.length > 0 ? [curriculum[0].id] : []
    );

    // ── Determine which items are locked based on sequential completion ───────
    const lockedItemIds = React.useMemo(() => {
        return getSequentialLockedItemIds(
            curriculum.map((module) => ({
                id: module.id,
                isSequential: module.is_sequential ?? false,
                items: (module.lessons || []).map((lesson) => ({
                    id: lesson.id,
                    type: lesson.type,
                    completed: lesson.type === "quiz"
                        ? completedQuizIds.has(lesson.id)
                        : completedLessonIds.has(lesson.id),
                })),
            }))
        );
    }, [curriculum, completedLessonIds, completedQuizIds]);

    // ── Fetch real durations ──────────────────────────────────────────────────
    const fetchDurations = useCallback(async () => {
        if (!courseId) return;

        // Collect all lesson ids from curriculum prop
        const allLessonIds = curriculum
            .flatMap((m) => m.lessons)
            .filter((l) => l.type === "lesson")
            .map((l) => l.id);

        if (allLessonIds.length === 0) return;

        // 1. Fetch lesson rows (content_blocks for metadata)
        const { data: lessonsData } = await supabase
            .from("lessons")
            .select("id, content_blocks, estimated_duration_minutes")
            .in("id", allLessonIds);

        // 2. Fetch watch-progress durations as fallback
        const { data: watchData } = await supabase
            .from("lesson_video_progress")
            .select("lesson_id, duration_seconds")
            .in("lesson_id", allLessonIds);

        const watchedMap = new Map<string, number>();
        (watchData ?? []).forEach((v: any) => {
            if (v.duration_seconds > 0 && !watchedMap.has(v.lesson_id))
                watchedMap.set(v.lesson_id, v.duration_seconds);
        });

        // 3. Parse stored durations & collect YouTube IDs to fetch
        const storedMap = new Map<string, number>();
        const ytIdsToFetch: string[] = [];
        const lessonForYtId = new Map<string, string>();
        const estimatedMap = new Map<string, number>();

        (lessonsData ?? []).forEach((l: any) => {
            // Store estimated as final fallback
            if (l.estimated_duration_minutes)
                estimatedMap.set(l.id, l.estimated_duration_minutes * 60);

            if (!Array.isArray(l.content_blocks)) return;
            const videoBlock = l.content_blocks.find(
                (b: any) => b.type === "video" || b.block_type === "video"
            );
            if (!videoBlock) return;

            const metaDuration =
                videoBlock.attributes?.media_metadata?.duration ??
                videoBlock.attributes?.duration ??
                null;

            if (typeof metaDuration === "number" && metaDuration > 0) {
                storedMap.set(l.id, metaDuration);
                return;
            }

            const url: string = videoBlock.content ?? videoBlock.url ?? "";
            const ytId = extractYouTubeId(url);
            if (ytId) {
                ytIdsToFetch.push(ytId);
                lessonForYtId.set(ytId, l.id);
            }
        });

        // 4. Batch-fetch YouTube durations
        const ytDurations = await fetchYouTubeDurations([...new Set(ytIdsToFetch)]);
        const ytLessonMap = new Map<string, number>();
        lessonForYtId.forEach((lessonId, ytId) => {
            const secs = ytDurations.get(ytId);
            if (secs) ytLessonMap.set(lessonId, secs);
        });

        // 5. Build final map: YouTube > stored metadata > watch progress > estimated
        const resolved = new Map<string, number>();
        allLessonIds.forEach((id) => {
            const secs =
                ytLessonMap.get(id) ??
                storedMap.get(id) ??
                watchedMap.get(id) ??
                estimatedMap.get(id) ??
                0;
            resolved.set(id, secs);
        });

        setDurationMap(resolved);

        // Notify parent of total course duration
        if (onTotalDurationLoaded) {
            const total = [...resolved.values()].reduce((a, b) => a + b, 0);
            onTotalDurationLoaded(total);
        }
    }, [courseId, curriculum, onTotalDurationLoaded]);

    useEffect(() => {
        fetchDurations();
    }, [fetchDurations]);

    // ── Helpers ───────────────────────────────────────────────────────────────

    const getLessonDuration = (lesson: Lesson): string => {
        if (lesson.type === "quiz") return lesson.duration || "Quiz";
        const secs = durationMap.get(lesson.id);
        if (secs && secs > 0) return formatDuration(secs);
        // If still loading or not found, fall back to prop duration or a dash
        return lesson.duration || "—";
    };

    const toggleModule = (moduleId: string) => {
        setExpandedModules((prev) =>
            prev.includes(moduleId)
                ? prev.filter((id) => id !== moduleId)
                : [...prev, moduleId]
        );
    };

    const handleItemClick = (lesson: Lesson) => {
        if (!isEnrolled || !courseId) return;
        if (lockedItemIds.has(lesson.id)) return; // Locked, can't click
        if (lesson.type === "quiz") {
            navigate(`/student/courses/${courseId}/quizzes/${lesson.id}`);
        } else {
            navigate(`/student/courses/${courseId}/lessons/${lesson.id}`);
        }
    };

    const isCompleted = (lesson: Lesson) => {
        if (lesson.type === "quiz") return completedQuizIds.has(lesson.id);
        return completedLessonIds.has(lesson.id);
    };

    const getModuleProgress = (mod: Module) => {
        if (!mod.lessons || mod.lessons.length === 0) return 0;
        const completed = mod.lessons.filter((l) => isCompleted(l)).length;
        return Math.round((completed / mod.lessons.length) * 100);
    };

    if (!curriculum || curriculum.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                No curriculum available yet.
            </div>
        );
    }

    const totalItems = curriculum.reduce(
        (sum, m) => sum + (m.lessons?.length || 0),
        0
    );
    const totalCompleted = curriculum.reduce(
        (sum, m) =>
            sum + (m.lessons?.filter((l) => isCompleted(l)).length || 0),
        0
    );
    const overallPercent =
        totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">
                    Course curriculum
                </h3>
                {isEnrolled && totalItems > 0 && (
                    <span className="text-sm text-text-muted dark:text-dark-text-muted">
                        {totalCompleted}/{totalItems} completed ({overallPercent}%)
                    </span>
                )}
            </div>

            {/* Overall progress bar */}
            {isEnrolled && totalItems > 0 && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                    <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${overallPercent}%` }}
                    />
                </div>
            )}

            {curriculum.map((module) => {
                const modProgress = getModuleProgress(module);
                return (
                    <div
                        key={module.id}
                        className="border border-[#EDF0FB] dark:border-gray-700 rounded-2xl overflow-hidden"
                    >
                        <button
                            onClick={() => toggleModule(module.id)}
                            className="w-full flex items-center justify-between p-4 hover:bg-[#F5F7FF] dark:hover:bg-gray-800 dark:bg-gray-800 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <svg
                                    className={`w-5 h-5 text-text-muted transition-transform ${
                                        expandedModules.includes(module.id)
                                            ? "rotate-90"
                                            : ""
                                    }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                                <span className="font-medium text-text-primary dark:text-dark-text-primary">
                                    {module.title}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                {isEnrolled &&
                                    module.lessons &&
                                    module.lessons.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                                <div
                                                    className="bg-green-500 h-1.5 rounded-full transition-all"
                                                    style={{ width: `${modProgress}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-text-muted dark:text-dark-text-muted">
                                                {modProgress}%
                                            </span>
                                        </div>
                                    )}
                                <span className="text-sm text-text-muted dark:text-dark-text-muted">
                                    {module.lessons?.length || 0} items
                                </span>
                            </div>
                        </button>

                        {expandedModules.includes(module.id) && (
                            <div className="bg-[#FAFBFF] dark:bg-gray-900/30 p-4 space-y-2">
                                {module.lessons &&
                                    module.lessons.map((lesson) => {
                                        const completed = isCompleted(lesson);
                                        const isLocked = lockedItemIds.has(lesson.id) && !completed;
                                        const clickable = isEnrolled && courseId && !isLocked;
                                        return (
                                            <div
                                                key={lesson.id}
                                                onClick={() =>
                                                    clickable && handleItemClick(lesson)
                                                }
                                                className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${
                                                    isLocked
                                                        ? "opacity-50 cursor-not-allowed"
                                                        : clickable
                                                        ? "cursor-pointer hover:bg-white dark:hover:bg-dark-background-card"
                                                        : "cursor-default"
                                                } ${
                                                    completed
                                                        ? "bg-green-50 dark:bg-green-900/10"
                                                        : ""
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {isEnrolled ? (
                                                        completed ? (
                                                            <span className="w-5 h-5 flex items-center justify-center bg-green-500 rounded-full text-white text-xs">
                                                                ✓
                                                            </span>
                                                        ) : isLocked ? (
                                                            <span className="w-5 h-5 flex items-center justify-center text-gray-400">
                                                                🔒
                                                            </span>
                                                        ) : (
                                                            <span className="w-5 h-5 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 rounded-full text-xs" />
                                                        )
                                                    ) : (
                                                        <span className="text-text-muted dark:text-dark-text-muted">
                                                            {lesson.type === "quiz" ? "❓" : "▶️"}
                                                        </span>
                                                    )}
                                                    <span
                                                        className={`text-sm ${
                                                            completed
                                                                ? "text-green-700 dark:text-green-400"
                                                                : isLocked
                                                                ? "text-gray-400 dark:text-gray-500"
                                                                : "text-text-secondary dark:text-dark-text-secondary"
                                                        }`}
                                                    >
                                                        {lesson.title}
                                                    </span>
                                                    {lesson.type === "quiz" && (
                                                        <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                                                            Quiz
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-text-muted dark:text-dark-text-muted">
                                                        {getLessonDuration(lesson)}
                                                    </span>
                                                    {clickable && (
                                                        <svg
                                                            className="w-4 h-4 text-text-muted dark:text-dark-text-muted"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M9 5l7 7-7 7"
                                                            />
                                                        </svg>
                                                    )}
                                                    {!isEnrolled && (
                                                        <span className="text-xs text-text-muted">
                                                            🔒
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default CourseCurriculumTab;