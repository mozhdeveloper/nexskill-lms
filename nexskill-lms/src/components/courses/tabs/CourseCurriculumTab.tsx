import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

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
}

interface CourseCurriculumTabProps {
    curriculum: Module[];
    courseId?: string;
    isEnrolled?: boolean;
    completedLessonIds?: Set<string>;
    completedQuizIds?: Set<string>;
}

const CourseCurriculumTab: React.FC<CourseCurriculumTabProps> = ({
    curriculum,
    courseId,
    isEnrolled = false,
    completedLessonIds = new Set(),
    completedQuizIds = new Set(),
}) => {
    const navigate = useNavigate();
    // Default to expanding the first module
    const [expandedModules, setExpandedModules] = useState<string[]>(
        curriculum.length > 0 ? [curriculum[0].id] : []
    );

    const toggleModule = (moduleId: string) => {
        setExpandedModules((prev) =>
            prev.includes(moduleId)
                ? prev.filter((id) => id !== moduleId)
                : [...prev, moduleId]
        );
    };

    const handleItemClick = (lesson: Lesson) => {
        if (!isEnrolled || !courseId) return;
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

    // Calculate module progress
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

    // Overall progress
    const totalItems = curriculum.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
    const totalCompleted = curriculum.reduce(
        (sum, m) => sum + (m.lessons?.filter((l) => isCompleted(l)).length || 0),
        0
    );
    const overallPercent = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;

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
                                    className={`w-5 h-5 text-text-muted transition-transform ${expandedModules.includes(module.id) ? "rotate-90" : ""
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
                                {isEnrolled && module.lessons && module.lessons.length > 0 && (
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
                                        const clickable = isEnrolled && courseId;
                                        return (
                                            <div
                                                key={lesson.id}
                                                onClick={() => clickable && handleItemClick(lesson)}
                                                className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${clickable
                                                        ? "cursor-pointer hover:bg-white dark:hover:bg-dark-background-card"
                                                        : "cursor-default"
                                                    } ${completed ? "bg-green-50 dark:bg-green-900/10" : ""}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {/* Completion indicator */}
                                                    {isEnrolled ? (
                                                        completed ? (
                                                            <span className="w-5 h-5 flex items-center justify-center bg-green-500 rounded-full text-white text-xs">✓</span>
                                                        ) : (
                                                            <span className="w-5 h-5 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 rounded-full text-xs" />
                                                        )
                                                    ) : (
                                                        <span className="text-text-muted dark:text-dark-text-muted">
                                                            {lesson.type === "quiz" ? "❓" : "▶️"}
                                                        </span>
                                                    )}
                                                    <span className={`text-sm ${completed
                                                            ? "text-green-700 dark:text-green-400"
                                                            : "text-text-secondary dark:text-dark-text-secondary"
                                                        }`}>
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
                                                        {lesson.duration || (lesson.type === 'quiz' ? 'Quiz' : 'Lesson')}
                                                    </span>
                                                    {clickable && (
                                                        <svg className="w-4 h-4 text-text-muted dark:text-dark-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    )}
                                                    {!isEnrolled && (
                                                        <span className="text-xs text-text-muted">🔒</span>
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
