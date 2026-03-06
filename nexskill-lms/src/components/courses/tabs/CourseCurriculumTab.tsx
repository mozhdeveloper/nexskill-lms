import React, { useState } from "react";

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
}

const CourseCurriculumTab: React.FC<CourseCurriculumTabProps> = ({ curriculum }) => {
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

    if (!curriculum || curriculum.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                No curriculum available yet.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary mb-4">
                Course curriculum
            </h3>
            {curriculum.map((module) => (
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
                        <span className="text-sm text-text-muted dark:text-dark-text-muted">
                            {module.lessons?.length || 0} items
                        </span>
                    </button>

                    {expandedModules.includes(module.id) && (
                        <div className="bg-[#FAFBFF] dark:bg-gray-900/30 p-4 space-y-2">
                            {module.lessons &&
                                module.lessons.map((lesson) => (
                                    <div
                                        key={lesson.id}
                                        className="flex items-center justify-between py-2 px-3 hover:bg-white dark:hover:bg-dark-background-card rounded-lg transition-colors cursor-default"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-text-muted dark:text-dark-text-muted">
                                                {lesson.type === "quiz" ? "❓" : "▶️"}
                                            </span>
                                            <span className="text-sm text-text-secondary dark:text-dark-text-secondary">
                                                {lesson.title}
                                            </span>
                                        </div>
                                        <span className="text-xs text-text-muted dark:text-dark-text-muted">
                                            {lesson.duration || (lesson.type === 'quiz' ? 'Quiz' : 'Lesson')}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default CourseCurriculumTab;
