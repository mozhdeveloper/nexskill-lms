import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface ContentItem {
  id: string;
  title: string;
  type: 'lesson' | 'quiz';
  duration: string;
  isCompleted: boolean;
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

  useEffect(() => {
    if (!courseId) return;
    const fetchModules = async () => {
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

        const lessonIds = (itemsData || []).filter((i) => i.content_type === 'lesson').map((i) => i.content_id);
        const quizIds = (itemsData || []).filter((i) => i.content_type === 'quiz').map((i) => i.content_id);

        const [lessonsRes, quizzesRes] = await Promise.all([
          lessonIds.length > 0
            ? supabase.from('lessons').select('id, title, estimated_duration_minutes').in('id', lessonIds)
            : Promise.resolve({ data: [] }),
          quizIds.length > 0
            ? supabase.from('quizzes').select('id, title, time_limit_minutes').in('id', quizIds)
            : Promise.resolve({ data: [] }),
        ]);

        const lessonsMap = new Map((lessonsRes.data || []).map((l: any) => [l.id, l]));
        const quizzesMap = new Map((quizzesRes.data || []).map((q: any) => [q.id, q]));

        const built: SidebarModule[] = modulesData.map((mod) => {
          const modItems = (itemsData || []).filter((i) => i.module_id === mod.id);
          const items: ContentItem[] = modItems
            .map((item) => {
              if (item.content_type === 'lesson') {
                const l = lessonsMap.get(item.content_id);
                if (!l) return null;
                return {
                  id: l.id,
                  title: l.title,
                  type: 'lesson' as const,
                  duration: `${l.estimated_duration_minutes || 15}m`,
                  isCompleted: completedLessonIds.includes(l.id),
                };
              }
              const q = quizzesMap.get(item.content_id);
              if (!q) return null;
              return {
                id: q.id,
                title: q.title,
                type: 'quiz' as const,
                duration: `${q.time_limit_minutes || 30}m`,
                isCompleted: completedQuizIds.includes(q.id),
              };
            })
            .filter(Boolean) as ContentItem[];
          return { id: mod.id, title: mod.title, items };
        });

        setSidebarModules(built);
        // expand module containing active lesson by default
        const activeModule = built.find((m) => m.items.some((i) => i.id === activeLessonId));
        setExpandedModules(activeModule ? [activeModule.id] : built.length > 0 ? [built[0].id] : []);
      } catch (err) {
        console.error('Error fetching sidebar modules:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchModules();
  }, [courseId, activeLessonId, completedLessonIds.length, completedQuizIds.length]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  const allItems = sidebarModules.flatMap((m) => m.items);
  const completedCount = allItems.filter((i) => i.isCompleted).length;
  const totalCount = allItems.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

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

      <div className="flex-1 overflow-y-auto space-y-2">
        {sidebarModules.map((module) => {
          const isExpanded = expandedModules.includes(module.id);
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
                    return (
                      <button
                        key={item.id}
                        onClick={() => onSelectLesson(item.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                          isActive
                            ? 'bg-brand-primary-soft border-2 border-brand-primary'
                            : 'hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 text-left">
                          <div className="flex-shrink-0">
                            {item.isCompleted ? (
                              <span className="text-green-500">✓</span>
                            ) : isActive ? (
                              <span className="text-brand-primary">▶</span>
                            ) : (
                              <span className="text-text-muted">{item.type === 'quiz' ? '📝' : '📄'}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isActive ? 'text-brand-primary' : 'text-text-primary dark:text-dark-text-primary'}`}>
                              {item.title}
                            </p>
                            <span className="text-xs text-text-muted">{item.type === 'quiz' ? '📝' : '📄'} {item.duration}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Summary */}
      <div className="mt-4 pt-4 border-t border-[#EDF0FB] dark:border-gray-700">
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
    </div>
  );
};

export default LessonSidebar;
