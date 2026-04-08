import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { Video, FileQuestion, Check } from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  type: 'lesson' | 'quiz';
  duration: string;
  isCompleted: boolean;
  itemNumber: number;
  progressCount?: { completed: number; total: number };
  hasVideo?: boolean;
  hasQuiz?: boolean;
}

interface SidebarModule {
  id: string;
  title: string;
  items: ContentItem[];
}

interface LessonSidebarProps {
  modules?: never;
  courseId: string;
  activeLessonId: string;
  onSelectLesson: (lessonId: string) => void;
  completedLessonIds?: string[];
  completedQuizIds?: string[];
  lastCompletedContentItemId?: string | null;
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

const fetchYouTubeDurations = async (
  videoIds: string[]
): Promise<Map<string, number>> => {
  const result = new Map<string, number>();
  if (videoIds.length === 0) return result;

  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn('[LessonSidebar] VITE_YOUTUBE_API_KEY not set');
    return result;
  }

  try {
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
  lastCompletedContentItemId,
}) => {
  const [sidebarModules, setSidebarModules] = useState<SidebarModule[]>([]);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const hasFetchedRef = useRef(false);

  const fetchModules = useCallback(async () => {
    if (!courseId) return;

    try {
      setLoading(true);

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

      let lessonContentProgressMap: Record<string, { completed: number; total: number }> = {};
      let lessonContentTypesMap: Record<string, { hasVideo: boolean; hasQuiz: boolean }> = {};
      
      if (lessonIds.length > 0 && user) {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          const { data: lessonContentItems } = await supabase
            .from('lesson_content_items')
            .select('id, lesson_id, content_type')
            .in('lesson_id', lessonIds);

          if (lessonContentItems) {
            lessonContentItems.forEach((item: any) => {
              if (!lessonContentTypesMap[item.lesson_id]) {
                lessonContentTypesMap[item.lesson_id] = { hasVideo: false, hasQuiz: false };
              }
              if (item.content_type === 'video') {
                lessonContentTypesMap[item.lesson_id].hasVideo = true;
              }
              if (item.content_type === 'quiz') {
                lessonContentTypesMap[item.lesson_id].hasQuiz = true;
              }
            });

            const requiredItemIds = lessonContentItems
              .filter((item: any) => item.content_type === 'video' || item.content_type === 'quiz')
              .map((item: any) => item.id);

            const totalByLesson: Record<string, number> = {};
            lessonContentItems.forEach((item: any) => {
              if (item.content_type === 'video' || item.content_type === 'quiz') {
                totalByLesson[item.lesson_id] = (totalByLesson[item.lesson_id] || 0) + 1;
              }
            });

            if (requiredItemIds.length > 0) {
              const { data: completedItems } = await supabase
                .from('lesson_content_item_progress')
                .select('content_item_id, lesson_id')
                .eq('user_id', currentUser.id)
                .in('content_item_id', requiredItemIds)
                .eq('is_completed', true);

              const completedByLesson: Record<string, number> = {};
              (completedItems || []).forEach((item: any) => {
                completedByLesson[item.lesson_id] = (completedByLesson[item.lesson_id] || 0) + 1;
              });

              lessonIds.forEach((lid: string) => {
                const total = totalByLesson[lid] || 0;
                const completed = completedByLesson[lid] || 0;
                if (total > 0) {
                  lessonContentProgressMap[lid] = { completed, total };
                }
              });

              lessonContentItems.forEach((item: any) => {
                if (!totalByLesson[item.lesson_id]) {
                  lessonContentProgressMap[item.lesson_id] = { completed: 1, total: 1 };
                }
              });
            }
          }
        }
      }

      const lessonsMap  = new Map((lessonsRes.data  ?? []).map((l: any) => [l.id, l]));
      const quizzesMap  = new Map((quizzesRes.data  ?? []).map((q: any) => [q.id, q]));

      const watchedDurationMap = new Map<string, number>();
      (videoProgressRes.data ?? []).forEach((v: any) => {
        if (v.duration_seconds > 0 && !watchedDurationMap.has(v.lesson_id)) {
          watchedDurationMap.set(v.lesson_id, v.duration_seconds);
        }
      });

      let completedQuizContentItemIds: string[] = [];
      if (quizIds.length > 0 && user) {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          const { data: quizContentItems } = await supabase
            .from('lesson_content_items')
            .select('content_id')
            .eq('content_type', 'quiz')
            .in('content_id', quizIds);

          if (quizContentItems && quizContentItems.length > 0) {
            const quizContentItemIds = quizContentItems.map((qi: any) => qi.content_id);

            const { data: completedQuizItems } = await supabase
              .from('lesson_content_item_progress')
              .select('content_item_id')
              .eq('user_id', currentUser.id)
              .eq('is_completed', true);

            if (completedQuizItems && completedQuizItems.length > 0) {
              const completedItemIds = completedQuizItems.map((ci: any) => ci.content_item_id);
              const { data: quizItems } = await supabase
                .from('lesson_content_items')
                .select('content_id')
                .eq('content_type', 'quiz')
                .in('id', completedItemIds);

              if (quizItems) {
                completedQuizContentItemIds = quizItems.map((qi: any) => qi.content_id);
              }
            }
          }
        }
      }

      const allCompletedQuizIds = [...new Set([...completedQuizIds, ...completedQuizContentItemIds])];

      const storedDurationMap = new Map<string, number>();
      const youtubeIdsToFetch: string[] = [];
      const lessonIdForYouTubeId = new Map<string, string>();

      (lessonsRes.data ?? []).forEach((l: any) => {
        if (!Array.isArray(l.content_blocks)) return;

        const videoBlock = l.content_blocks.find(
          (b: any) => b.type === 'video' || b.block_type === 'video'
        );
        if (!videoBlock) return;

        const metaDuration =
          videoBlock.attributes?.media_metadata?.duration ??
          videoBlock.attributes?.duration ??
          null;

        if (typeof metaDuration === 'number' && metaDuration > 0) {
          storedDurationMap.set(l.id, metaDuration);
          return;
        }

        const url: string = videoBlock.content ?? videoBlock.url ?? '';
        const ytId = extractYouTubeId(url);
        if (ytId) {
          youtubeIdsToFetch.push(ytId);
          lessonIdForYouTubeId.set(ytId, l.id);
        }
      });

      const youtubeDurationMap = await fetchYouTubeDurations(
        [...new Set(youtubeIdsToFetch)]
      );

      const youtubeLessonDurationMap = new Map<string, number>();
      lessonIdForYouTubeId.forEach((lessonId, ytId) => {
        const secs = youtubeDurationMap.get(ytId);
        if (secs) youtubeLessonDurationMap.set(lessonId, secs);
      });

      let sequentialCounter = 1;
      const built: SidebarModule[] = modulesData.map((mod) => {
        const modItems = (itemsData ?? []).filter((i) => i.module_id === mod.id);

        const items: ContentItem[] = modItems
          .map((item) => {
            if (item.content_type === 'lesson') {
              const l = lessonsMap.get(item.content_id);
              if (!l) return null;

              const ytSecs      = youtubeLessonDurationMap.get(l.id);
              const storedSecs  = storedDurationMap.get(l.id);
              const watchedSecs = watchedDurationMap.get(l.id);
              const videoDuration = ytSecs ?? storedSecs ?? watchedSecs;

              const duration = videoDuration && videoDuration > 0
                ? formatDuration(videoDuration)
                : `${(l.estimated_duration_minutes ?? 15).toString().padStart(2, '0')}:00`;

              const contentTypes = lessonContentTypesMap[l.id] || { hasVideo: false, hasQuiz: false };

              return {
                id:          l.id,
                title:       l.title,
                type:        'lesson' as const,
                duration,
                isCompleted: completedLessonIds.includes(l.id),
                itemNumber: sequentialCounter++,
                progressCount: lessonContentProgressMap[l.id],
                hasVideo: contentTypes.hasVideo,
                hasQuiz: contentTypes.hasQuiz,
              };
            }

            const q = quizzesMap.get(item.content_id);
            if (!q) return null;
            return {
              id:          q.id,
              title:       q.title,
              type:        'quiz' as const,
              duration:    `${q.time_limit_minutes ?? 30}m`,
              isCompleted: allCompletedQuizIds.includes(q.id),
              itemNumber: sequentialCounter++,
            };
          })
          .filter(Boolean) as ContentItem[];

        return { id: mod.id, title: mod.title, items };
      });

      setSidebarModules(built);

      const activeModule = built.find((m) => m.items.some((i) => i.id === activeLessonId));
      setExpandedModules(
        activeModule ? [activeModule.id] : built.length > 0 ? [built[0].id] : []
      );
    } catch (err) {
      console.error('[LessonSidebar] Error fetching sidebar modules:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  // Only fetch once on mount
  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchModules();
    }
  }, []);

  // Optimistically update sidebar when a content item is completed
  useEffect(() => {
    if (!lastCompletedContentItemId) return;

    setSidebarModules((prev) => {
      const targetLessonId = activeLessonId;
      if (!targetLessonId) return prev;

      return prev.map((mod) => ({
        ...mod,
        items: mod.items.map((item) => {
          if (item.type !== 'lesson') return item;
          if (item.id !== targetLessonId) return item;

          const pc = item.progressCount;
          if (!pc) return item;

          const newCompleted = Math.min(pc.completed + 1, pc.total);
          const lessonComplete = newCompleted >= pc.total;

          return {
            ...item,
            progressCount: { ...pc, completed: newCompleted },
            isCompleted: lessonComplete || item.isCompleted,
          };
        }),
      }));
    });
  }, [lastCompletedContentItemId, activeLessonId]);

  // Optimistically update sidebar when a lesson is marked complete
  useEffect(() => {
    if (!completedLessonIds || completedLessonIds.length === 0) return;

    setSidebarModules((prev) =>
      prev.map((mod) => ({
        ...mod,
        items: mod.items.map((item) => {
          if (item.type !== 'lesson') return item;
          if (completedLessonIds.includes(item.id) && !item.isCompleted) {
            const pc = item.progressCount;
            return { 
              ...item, 
              isCompleted: true,
              // Sync progressCount to show complete
              progressCount: pc ? { ...pc, completed: pc.total } : undefined,
            };
          }
          return item;
        }),
      }))
    );
  }, [completedLessonIds]);

  // Optimistically update sidebar when a quiz is completed
  useEffect(() => {
    if (!completedQuizIds || completedQuizIds.length === 0) return;

    setSidebarModules((prev) =>
      prev.map((mod) => ({
        ...mod,
        items: mod.items.map((item) => {
          if (item.type !== 'quiz') return item;
          if (completedQuizIds.includes(item.id) && !item.isCompleted) {
            return { ...item, isCompleted: true };
          }
          return item;
        }),
      }))
    );
  }, [completedQuizIds]);

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
                          {/* Lesson number - always visible */}
                          <div className="flex-shrink-0 w-6">
                            <span className={`text-sm font-semibold ${
                              isActive 
                                ? 'text-brand-primary' 
                                : completed
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-text-muted dark:text-dark-text-muted'
                            }`}>
                              {item.itemNumber}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            {/* UPDATED: Checkmark on LEFT side of lesson title */}
                            <div className="flex items-center gap-2">
                              {/* Checkmark BEFORE the lesson title when completed */}
                              {completed && (
                                <span className="flex-shrink-0 w-3 h-3 flex items-center justify-center bg-green-500 rounded-full text-white">
                                  <Check className="w-3 h-3" />
                                </span>
                              )}
                              <p className={`text-sm font-medium truncate ${
                                completed
                                  ? 'text-green-700 dark:text-green-400'
                                  : isActive
                                    ? 'text-brand-primary'
                                    : 'text-text-primary dark:text-dark-text-primary'
                              }`}>
                                {item.title}
                              </p>
                              {item.progressCount && (
                                <span className={`text-xs font-medium flex-shrink-0 ${
                                  completed
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-text-muted dark:text-dark-text-muted'
                                }`}>
                                  {item.progressCount.completed}/{item.progressCount.total}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="flex items-center gap-1">
                                {item.type === 'lesson' ? (
                                  <div className="flex items-center gap-1">
                                    {(item.hasVideo || (!item.hasQuiz && !item.hasVideo)) && (
                                      <Video className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                                    )}
                                    {item.hasQuiz && (
                                      <FileQuestion className="w-3 h-3 text-purple-500 dark:text-purple-400" />
                                    )}
                                  </div>
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