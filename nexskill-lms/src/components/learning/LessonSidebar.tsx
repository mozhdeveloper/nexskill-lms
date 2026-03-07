import React, { useState } from 'react';

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'pdf';
  status: 'completed' | 'current' | 'locked';
}

interface LessonSidebarProps {
  modules?: Module[];
  courseId?: string; // accepted for future DB integration
  activeLessonId: string;
  onSelectLesson: (lessonId: string) => void;
}

const LessonSidebar: React.FC<LessonSidebarProps> = ({
  modules = [],
  activeLessonId,
  onSelectLesson,
}) => {
  const [expandedModules, setExpandedModules] = useState<string[]>(['1', '2']);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="text-green-500">✓</span>;
      case 'current':
        return <span className="text-brand-primary">▶</span>;
      case 'locked':
        return <span className="text-text-muted">🔒</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-card p-5 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-text-primary mb-4">Course content</h3>

      <div className="flex-1 overflow-y-auto space-y-2">
        {modules.map((module) => {
          const isExpanded = expandedModules.includes(module.id);
          const totalLessons = module.lessons.length;
          const completedLessons = module.lessons.filter((l) => l.status === 'completed').length;

          return (
            <div key={module.id} className="border border-[#EDF0FB] rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleModule(module.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-[#F5F7FF] transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 text-left">
                  <svg
                    className={`w-4 h-4 text-text-muted transition-transform flex-shrink-0 ${
                      isExpanded ? 'rotate-90' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="font-medium text-text-primary text-sm">{module.title}</span>
                </div>
                <span className="text-xs text-text-muted ml-2">
                  {completedLessons}/{totalLessons}
                </span>
              </button>

              {isExpanded && (
                <div className="bg-[#FAFBFF] px-2 py-2 space-y-1">
                  {module.lessons.map((lesson) => {
                    const isActive = lesson.id === activeLessonId;

                    return (
                      <button
                        key={lesson.id}
                        onClick={() => onSelectLesson(lesson.id)}
                        disabled={lesson.status === 'locked'}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                          isActive
                            ? 'bg-brand-primary-soft border-2 border-brand-primary'
                            : lesson.status === 'locked'
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:bg-white hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 text-left">
                          <div className="flex-shrink-0">{getStatusIcon(lesson.status)}</div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${
                                isActive ? 'text-brand-primary' : 'text-text-primary'
                              }`}
                            >
                              {lesson.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-text-muted">
                                {lesson.type === 'video' ? '🎥' : '📄'} {lesson.duration}
                              </span>
                            </div>
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
      <div className="mt-4 pt-4 border-t border-[#EDF0FB]">
        <div className="text-xs text-text-muted">
          Course progress: <span className="font-semibold text-text-primary">45%</span>
        </div>
      </div>
    </div>
  );
};

export default LessonSidebar;
