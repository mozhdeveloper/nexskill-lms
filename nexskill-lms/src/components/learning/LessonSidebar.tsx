import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Video, FileQuestion } from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  type: 'lesson' | 'quiz';
  duration: string;
  isCompleted: boolean;
  itemNumber: number; // Sequential number across all modules
}

interface SidebarModule {
  id: string;
  title: string;
  items: ContentItem[];
}

interface LessonSidebarProps {
  modules?: never; // deprecated — sidebar self-fetches
  courseId: string;
  activeLessonId: string;
  onSelectLesson: (lessonId: string) => void;
  completedLessonIds?: string[];
  completedQuizIds?: string[];
}

// ─── YouTube Duration Helpers ─────────────────────────────────────────────────

const parseISODuration = (isoDuration: string): number => {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours   = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
};

const extractYouTubeId = (url: string): string | null =>
  url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1] ?? null;

const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

/** Fetch durations for multiple YouTube video IDs in one API call. */
const fetchYouTubeDurations = async (
  videoIds: string[]
): Promise<Map<string, number>> => {
  const result = new Map<string, number>();
  if (videoIds.length === 0) return result;

  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn('[LessonSidebar] VITE_YOUTUBE_API_KEY not set — cannot fetch YouTube durations');
    return result;
  }

  try {
    // YouTube API accepts up to 50 IDs per request
    const chunks: string[][] = [];
    for (let i = 0; i < videoIds.length; i += 50) {
      chunks.push(videoIds.slice(i, i + 50));
    }

    for (const chunk of chunks) {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${chunk.join(',')}&key=${apiKey}`
      );
      if (!response.ok) continue;
      const data = await response.json();
      for (const item of data.items ?? []) {
        const secs = parseISODuration(item.contentDetails.duration);
        result.set(item.id, secs);
      }
    }
  } catch (err) {
    console.error('[LessonSidebar] Error fetching YouTube durations:', err);
  }

  return result;
};

// ─── Component ────────────────────────────────────────────────────────────────

const LessonSidebar: React.FC<LessonSidebarProps> = ({
  courseId,
  activeLessonId,
  onSelectLesson,
  completedLessonIds = [],
  completedQuizIds = [],
}) => {
  const [sidebarModules, setSidebarModules] = useState<SidebarModule[]>([]);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchModules = useCallback(async () => {
    if (!courseId) return;

    try {
      setLoading(true);

      // ── 1. Modules ────────────────────────────────────────────────────────
      const { data: modulesData } = await supabase
        .from('modules')
        .select('id, title, position')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('position', { ascending: true });

      if (!modulesData || modulesData.length === 0) {
        setSidebarModules([]);
        return;
      }

      const moduleIds = modulesData.map((m) => m.id);

      // ── 2. Content items + lessons + quizzes + watch progress ─────────────
      const { data: itemsData } = await supabase
        .from('module_content_items')
        .select('module_id, content_id, content_type, position')
        .in('module_id', moduleIds)
        .eq('is_published', true)
        .order('position', { ascending: true });

      const lessonIds = (itemsData ?? []).filter((i) => i.content_type === 'lesson').map((i) => i.content_id);
      const quizIds   = (itemsData ?? []).filter((i) => i.content_type === 'quiz').map((i) => i.content_id);

      const [lessonsRes, quizzesRes, videoProgressRes] = await Promise.all([
        lessonIds.length > 0
          ? supabase.from('lessons').select('id, title, estimated_duration_minutes, content_blocks').in('id', lessonIds)
          : Promise.resolve({ data: [] }),
        quizIds.length > 0
          ? supabase.from('quizzes').select('id, title, time_limit_minutes').in('id', quizIds)
          : Promise.resolve({ data: [] }),
        lessonIds.length > 0
          ? supabase.from('lesson_video_progress').select('lesson_id, duration_seconds').in('lesson_id', lessonIds)
          : Promise.resolve({ data: [] }),
      ]);

      const lessonsMap  = new Map((lessonsRes.data  ?? []).map((l: any) => [l.id, l]));
      const quizzesMap  = new Map((quizzesRes.data  ?? []).map((q: any) => [q.id, q]));

      // Watch-progress durations (fallback)
      const watchedDurationMap = new Map<string, number>();
      (videoProgressRes.data ?? []).forEach((v: any) => {
        if (v.duration_seconds > 0 && !watchedDurationMap.has(v.lesson_id)) {
          watchedDurationMap.set(v.lesson_id, v.duration_seconds);
        }
      });

      // ── 3. Extract durations already stored in content_blocks ─────────────
      // Covers: Cloudinary uploads (media_metadata.duration) and
      //         previously-fetched YouTube metadata stored on save.
      const storedDurationMap = new Map<string, number>();
      // Also collect YouTube video IDs that still have NO stored duration
      const youtubeIdsToFetch: string[] = []; // video IDs
      const lessonIdForYouTubeId = new Map<string, string>(); // ytId → lessonId

      (lessonsRes.data ?? []).forEach((l: any) => {
        if (!Array.isArray(l.content_blocks)) return;

        const videoBlock = l.content_blocks.find(
          (b: any) => b.type === 'video' || b.block_type === 'video'
        );
        if (!videoBlock) return;

        // A) Duration already stored in metadata (Cloudinary or previously-saved YouTube)
        const metaDuration =
          videoBlock.attributes?.media_metadata?.duration ??
          videoBlock.attributes?.duration ??
          null;

        if (typeof metaDuration === 'number' && metaDuration > 0) {
          storedDurationMap.set(l.id, metaDuration);
          return;
        }

        // B) YouTube URL with no stored duration → queue for API fetch
        const url: string = videoBlock.content ?? videoBlock.url ?? '';
        const ytId = extractYouTubeId(url);
        if (ytId) {
          youtubeIdsToFetch.push(ytId);
          lessonIdForYouTubeId.set(ytId, l.id);
        }
      });

      // ── 4. Batch-fetch missing YouTube durations ───────────────────────────
      const youtubeDurationMap = await fetchYouTubeDurations(
        // deduplicate
        [...new Set(youtubeIdsToFetch)]
      );

      // Map YouTube durations back to lesson IDs
      const youtubeLessonDurationMap = new Map<string, number>();
      lessonIdForYouTubeId.forEach((lessonId, ytId) => {
        const secs = youtubeDurationMap.get(ytId);
        if (secs) youtubeLessonDurationMap.set(lessonId, secs);
      });

      // ── 5. Build sidebar structure with sequential numbering ──────────────
      // First, collect all items in order across all modules
      let sequentialCounter = 1;
      const built: SidebarModule[] = modulesData.map((mod) => {
        const modItems = (itemsData ?? []).filter((i) => i.module_id === mod.id);

        const items: ContentItem[] = modItems
          .map((item) => {
            if (item.content_type === 'lesson') {
              const l = lessonsMap.get(item.content_id);
              if (!l) return null;

              // Priority:
              // 1. YouTube API (freshly fetched)
              // 2. Stored in content_blocks metadata (Cloudinary / prev-saved)
              // 3. Watch-progress table
              // 4. Estimated duration fallback
              const ytSecs      = youtubeLessonDurationMap.get(l.id);
              const storedSecs  = storedDurationMap.get(l.id);
              const watchedSecs = watchedDurationMap.get(l.id);
              const videoDuration = ytSecs ?? storedSecs ?? watchedSecs;

              const duration = videoDuration && videoDuration > 0
                ? formatDuration(videoDuration)
                : `${(l.estimated_duration_minutes ?? 15).toString().padStart(2, '0')}:00`;

              return {
                id:          l.id,
                title:       l.title,
                type:        'lesson' as const,
                duration,
                isCompleted: completedLessonIds.includes(l.id),
                itemNumber: sequentialCounter++, // Assign sequential number
              };
            }

            const q = quizzesMap.get(item.content_id);
            if (!q) return null;
            return {
              id:          q.id,
              title:       q.title,
              type:        'quiz' as const,
              duration:    `${q.time_limit_minutes ?? 30}m`,
              isCompleted: completedQuizIds.includes(q.id),
              itemNumber: sequentialCounter++, // Assign sequential number
            };
          })
          .filter(Boolean) as ContentItem[];

        return { id: mod.id, title: mod.title, items };
      });

      setSidebarModules(built);

      // Auto-expand the module containing the active lesson
      const activeModule = built.find((m) => m.items.some((i) => i.id === activeLessonId));
      setExpandedModules(
        activeModule ? [activeModule.id] : built.length > 0 ? [built[0].id] : []
      );
    } catch (err) {
      console.error('[LessonSidebar] Error fetching sidebar modules:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId, activeLessonId, completedLessonIds.length, completedQuizIds.length]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  const allItems      = sidebarModules.flatMap((m) => m.items);
  const completedCount = allItems.filter((i) => i.isCompleted).length;
  const totalCount     = allItems.length;
  const progress       = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="bg-white dark:bg-dark-background-card rounded-3xl shadow-card p-5 h-full">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-background-card rounded-3xl shadow-card p-5 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary mb-4">Course content</h3>

      {/* Progress Summary - moved to top under "Course content" title */}
      <div className="mb-4 pb-4 border-b border-[#EDF0FB] dark:border-gray-700">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-text-muted">Course progress</span>
          <span className="text-xs font-semibold text-text-primary dark:text-dark-text-primary">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-primary to-brand-primary-light rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {sidebarModules.map((module) => {
          const isExpanded  = expandedModules.includes(module.id);
          const modCompleted = module.items.filter((i) => i.isCompleted).length;

          return (
            <div key={module.id} className="border border-[#EDF0FB] dark:border-gray-700 rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleModule(module.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-[#F5F7FF] dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 text-left">
                  <svg
                    className={`w-4 h-4 text-text-muted transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="font-medium text-text-primary dark:text-dark-text-primary text-sm">{module.title}</span>
                </div>
                <span className="text-xs text-text-muted ml-2">{modCompleted}/{module.items.length}</span>
              </button>

              {isExpanded && (
                <div className="bg-[#FAFBFF] dark:bg-gray-800/50 px-2 py-2 space-y-1">
                  {module.items.map((item) => {
                    const isActive = item.id === activeLessonId;
                    const completed = item.isCompleted;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => onSelectLesson(item.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                          isActive
                            ? 'bg-brand-primary-soft border-2 border-brand-primary'
                            : 'hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm'
                        } ${
                          completed && !isActive
                            ? 'bg-green-50 dark:bg-green-900/10'
                            : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 text-left">
                          {/* Sequential number instead of icon */}
                          <div className="flex-shrink-0 w-6">
                            {completed ? (
                              <span className="w-5 h-5 flex items-center justify-center bg-green-500 rounded-full text-white text-xs">
                                ✓
                              </span>
                            ) : (
                              <span className={`text-sm font-semibold ${
                                isActive 
                                  ? 'text-brand-primary' 
                                  : 'text-text-muted dark:text-dark-text-muted'
                              }`}>
                                {item.itemNumber}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              completed 
                                ? 'text-green-700 dark:text-green-400'
                                : isActive 
                                  ? 'text-brand-primary' 
                                  : 'text-text-primary dark:text-dark-text-primary'
                            }`}>
                              {item.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="flex items-center gap-1">
                                {/* Video or Quiz icon next to duration */}
                                {item.type === 'lesson' ? (
                                  <Video className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                                ) : (
                                  <FileQuestion className="w-3 h-3 text-purple-500 dark:text-purple-400" />
                                )}
                                <span className="text-xs text-text-muted dark:text-dark-text-muted">
                                  {item.duration}
                                </span>
                              </div>
                              {item.type === 'quiz' && (
                                <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                                  Quiz
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Optional: Add chevron for active item */}
                        {isActive && (
                          <svg
                            className="w-4 h-4 text-brand-primary"
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
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LessonSidebar;