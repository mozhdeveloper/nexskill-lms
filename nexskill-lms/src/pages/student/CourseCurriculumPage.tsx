import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import { useCourseCurriculum } from '../../hooks/useCourseCurriculum';
import type { ModuleWithContent, ContentItem } from '../../hooks/useCourseCurriculum';

/**
 * CourseCurriculumPage - Displays full course curriculum with all modules and lessons
 * Route: /student/courses/:courseId/curriculum
 */
const CourseCurriculumPage: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const { course, modules, totalLessons, totalQuizzes, totalDurationMinutes, loading, error } = useCourseCurriculum(courseId);
    const [expandedModules, setExpandedModules] = useState<string[]>([]);

    // Toggle module accordion
    const toggleModule = (moduleId: string) => {
        setExpandedModules(prev =>
            prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
        );
    };

    // Expand all modules
    const expandAll = () => {
        setExpandedModules(modules.map(m => m.id));
    };

    // Collapse all modules
    const collapseAll = () => {
        setExpandedModules([]);
    };

    // Navigate to first lesson
    const handleStartLearning = () => {
        if (modules.length > 0 && modules[0].items.length > 0) {
            const firstItem = modules[0].items[0];
            if (firstItem.type === 'lesson') {
                navigate(`/student/courses/${courseId}/lessons/${firstItem.id}`);
            } else {
                navigate(`/student/courses/${courseId}/quiz/${firstItem.id}`);
            }
        }
    };

    // Get icon for content type
    const getContentIcon = (item: ContentItem) => {
        if (item.type === 'quiz') return '📝';
        return '🎥'; // Default to video for lessons
    };

    // Format duration
    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const remainingMins = minutes % 60;
        return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
    };

    if (loading) {
        return (
            <StudentAppLayout>
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                        <div className="text-6xl mb-4 animate-pulse">📚</div>
                        <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-2">Loading curriculum...</h2>
                        <p className="text-text-secondary dark:text-dark-text-secondary">Please wait while we load the course content.</p>
                    </div>
                </div>
            </StudentAppLayout>
        );
    }

    if (error || !course) {
        return (
            <StudentAppLayout>
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                        <div className="text-6xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-2">Error loading curriculum</h2>
                        <p className="text-text-secondary dark:text-dark-text-secondary mb-6">{error || 'Course not found'}</p>
                        <button
                            onClick={() => navigate('/student/courses')}
                            className="px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-primary-light text-white font-medium rounded-full hover:shadow-lg transition-all"
                        >
                            Back to courses
                        </button>
                    </div>
                </div>
            </StudentAppLayout>
        );
    }

    return (
        <StudentAppLayout>
            <div className="min-h-full bg-gray-50 dark:bg-gray-900">
                {/* Header */}
                <div className="bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
                    <div className="max-w-5xl mx-auto px-6 py-8">
                        {/* Breadcrumb */}
                        <nav className="flex items-center gap-2 text-sm text-text-muted dark:text-slate-400 mb-4">
                            <Link to="/student/courses" className="hover:text-brand-primary transition-colors">Courses</Link>
                            <span>/</span>
                            <Link to={`/student/courses/${courseId}`} className="hover:text-brand-primary transition-colors">{course.title}</Link>
                            <span>/</span>
                            <span className="text-text-primary dark:text-white">Curriculum</span>
                        </nav>

                        {/* Course Info */}
                        <h1 className="text-3xl font-bold text-text-primary dark:text-white mb-2">{course.title}</h1>
                        {course.subtitle && (
                            <p className="text-lg text-text-secondary dark:text-slate-400 mb-4">{course.subtitle}</p>
                        )}

                        {/* Stats */}
                        <div className="flex flex-wrap items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">📖</span>
                                <span className="text-text-secondary dark:text-slate-400">
                                    <strong className="text-text-primary dark:text-white">{modules.length}</strong> modules
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xl">🎥</span>
                                <span className="text-text-secondary dark:text-slate-400">
                                    <strong className="text-text-primary dark:text-white">{totalLessons}</strong> lessons
                                </span>
                            </div>
                            {totalQuizzes > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">📝</span>
                                    <span className="text-text-secondary dark:text-slate-400">
                                        <strong className="text-text-primary dark:text-white">{totalQuizzes}</strong> quizzes
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <span className="text-xl">⏱️</span>
                                <span className="text-text-secondary dark:text-slate-400">
                                    <strong className="text-text-primary dark:text-white">{formatDuration(totalDurationMinutes)}</strong> total
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4 mt-6">
                            <button
                                onClick={handleStartLearning}
                                className="px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-primary-light text-white font-semibold rounded-full shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                            >
                                ▶ Start Learning
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={expandAll}
                                    className="px-4 py-2 text-sm text-brand-primary bg-brand-primary-soft dark:bg-blue-900/30 rounded-full hover:bg-brand-primary hover:text-white transition-all"
                                >
                                    Expand All
                                </button>
                                <button
                                    onClick={collapseAll}
                                    className="px-4 py-2 text-sm text-text-secondary dark:text-slate-400 bg-gray-100 dark:bg-slate-700 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition-all"
                                >
                                    Collapse All
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modules List */}
                <div className="max-w-5xl mx-auto px-6 py-8">
                    <div className="space-y-4">
                        {modules.map((module, moduleIndex) => (
                            <ModuleAccordion
                                key={module.id}
                                module={module}
                                moduleIndex={moduleIndex}
                                isExpanded={expandedModules.includes(module.id)}
                                onToggle={() => toggleModule(module.id)}
                                courseId={courseId || ''}
                                getContentIcon={getContentIcon}
                                formatDuration={formatDuration}
                            />
                        ))}

                        {modules.length === 0 && (
                            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                                <div className="text-6xl mb-4">📭</div>
                                <h3 className="text-xl font-semibold text-text-primary dark:text-white mb-2">No content yet</h3>
                                <p className="text-text-secondary dark:text-slate-400">
                                    This course doesn't have any modules or lessons yet.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </StudentAppLayout>
    );
};

// Module Accordion Component
interface ModuleAccordionProps {
    module: ModuleWithContent;
    moduleIndex: number;
    isExpanded: boolean;
    onToggle: () => void;
    courseId: string;
    getContentIcon: (item: ContentItem) => string;
    formatDuration: (minutes: number) => string;
}

const ModuleAccordion: React.FC<ModuleAccordionProps> = ({
    module,
    moduleIndex,
    isExpanded,
    onToggle,
    courseId,
    getContentIcon,
    formatDuration,
}) => {
    const navigate = useNavigate();

    const handleItemClick = (item: ContentItem) => {
        if (item.type === 'lesson') {
            navigate(`/student/courses/${courseId}/lessons/${item.id}`);
        } else {
            navigate(`/student/courses/${courseId}/quiz/${item.id}`);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm">
            {/* Module Header */}
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-primary-soft dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-brand-primary font-bold">
                        {moduleIndex + 1}
                    </div>
                    <div className="text-left">
                        <h3 className="font-semibold text-text-primary dark:text-white">{module.title}</h3>
                        <p className="text-sm text-text-muted dark:text-slate-400">
                            {module.items.length} {module.items.length === 1 ? 'item' : 'items'}
                        </p>
                    </div>
                </div>
                <svg
                    className={`w-5 h-5 text-text-muted dark:text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Module Content */}
            {isExpanded && (
                <div className="border-t border-gray-100 dark:border-slate-700">
                    {module.items.map((item, itemIndex) => (
                        <button
                            key={item.id}
                            onClick={() => handleItemClick(item)}
                            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors border-b border-gray-50 dark:border-slate-700/50 last:border-b-0"
                        >
                            <div className="w-8 h-8 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-sm">
                                {getContentIcon(item)}
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-medium text-text-primary dark:text-white text-sm">
                                    {moduleIndex + 1}.{itemIndex + 1} {item.title}
                                </p>
                                {item.description && (
                                    <p className="text-xs text-text-muted dark:text-slate-400 line-clamp-1">{item.description}</p>
                                )}
                            </div>
                            <div className="text-xs text-text-muted dark:text-slate-400">
                                {item.type === 'lesson' && (item as any).estimated_duration_minutes && (
                                    <span>{formatDuration((item as any).estimated_duration_minutes)}</span>
                                )}
                                {item.type === 'quiz' && (item as any).time_limit_minutes && (
                                    <span>{formatDuration((item as any).time_limit_minutes)}</span>
                                )}
                            </div>
                            <svg className="w-4 h-4 text-text-muted dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    ))}

                    {module.items.length === 0 && (
                        <div className="p-6 text-center text-text-muted dark:text-slate-400 text-sm">
                            No content in this module yet
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CourseCurriculumPage;
