import React from 'react';
import { ChevronRight, ChevronDown, FileText, HelpCircle, MessageSquare } from 'lucide-react';

interface ContentItem {
    id: string;
    content_type: 'lesson' | 'quiz';
    content_id: string;
    position: number;
    lesson_id: string | null;
    lesson_title: string | null;
    quiz_id: string | null;
    quiz_title: string | null;
}

interface Module {
    id: string;
    title: string;
    position: number;
    content_items: ContentItem[];
}

interface FeedbackCount {
    [lessonId: string]: number;
}

interface CourseStructureTreeProps {
    modules: Module[];
    selectedLessonId: string | null;
    onSelectLesson: (lessonId: string, lessonTitle: string) => void;
    feedbackCounts: FeedbackCount;
    courseLevelFeedbackCount: number;
    onSelectCourseFeedback: () => void;
    isCourseFeedbackSelected: boolean;
}

const CourseStructureTree: React.FC<CourseStructureTreeProps> = ({
    modules,
    selectedLessonId,
    onSelectLesson,
    feedbackCounts,
    courseLevelFeedbackCount,
    onSelectCourseFeedback,
    isCourseFeedbackSelected
}) => {
    const [expandedModules, setExpandedModules] = React.useState<Set<string>>(
        new Set(modules.map(m => m.id))
    );

    const toggleModule = (moduleId: string) => {
        setExpandedModules(prev => {
            const newSet = new Set(prev);
            if (newSet.has(moduleId)) {
                newSet.delete(moduleId);
            } else {
                newSet.add(moduleId);
            }
            return newSet;
        });
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-[#304DB5]/5 to-transparent">
                <h3 className="font-semibold text-gray-900">Course Structure</h3>
            </div>

            <div className="p-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                {/* Course-level feedback option */}
                <button
                    onClick={onSelectCourseFeedback}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors mb-2 ${isCourseFeedbackSelected
                            ? 'bg-[#304DB5] text-white'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                >
                    <MessageSquare size={16} />
                    <span className="flex-1">Course-Level Feedback</span>
                    {courseLevelFeedbackCount > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isCourseFeedbackSelected ? 'bg-white/20' : 'bg-amber-100 text-amber-700'
                            }`}>
                            {courseLevelFeedbackCount}
                        </span>
                    )}
                </button>

                <div className="border-t border-gray-100 pt-2">
                    {modules.map((module) => (
                        <div key={module.id} className="mb-1">
                            {/* Module Header */}
                            <button
                                onClick={() => toggleModule(module.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-left"
                            >
                                {expandedModules.has(module.id) ? (
                                    <ChevronDown size={16} className="text-gray-400" />
                                ) : (
                                    <ChevronRight size={16} className="text-gray-400" />
                                )}
                                <span className="font-medium text-gray-900 text-sm truncate flex-1">
                                    {module.title}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {module.content_items.length} items
                                </span>
                            </button>

                            {/* Content Items */}
                            {expandedModules.has(module.id) && (
                                <div className="ml-6 space-y-0.5">
                                    {module.content_items.map((item) => {
                                        const isLesson = item.content_type === 'lesson';
                                        const itemId = isLesson ? item.lesson_id : item.quiz_id;
                                        const itemTitle = isLesson ? item.lesson_title : item.quiz_title;
                                        const feedbackCount = itemId ? feedbackCounts[itemId] || 0 : 0;
                                        const isSelected = selectedLessonId === itemId;

                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => isLesson && itemId && itemTitle && onSelectLesson(itemId, itemTitle)}
                                                disabled={!isLesson}
                                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${isSelected
                                                        ? 'bg-[#304DB5] text-white'
                                                        : isLesson
                                                            ? 'hover:bg-gray-100 text-gray-700'
                                                            : 'text-gray-400 cursor-not-allowed'
                                                    }`}
                                            >
                                                {isLesson ? (
                                                    <FileText size={14} />
                                                ) : (
                                                    <HelpCircle size={14} />
                                                )}
                                                <span className="flex-1 truncate">{itemTitle || 'Untitled'}</span>
                                                {feedbackCount > 0 && (
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20' : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        {feedbackCount}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {modules.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        No modules in this course yet
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseStructureTree;
