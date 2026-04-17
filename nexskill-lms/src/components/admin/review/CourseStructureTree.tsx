import React from 'react';
import { ChevronRight, ChevronDown, FileText, HelpCircle, Plus, Trash2, Lock, AlertCircle } from 'lucide-react';

interface LessonContentItemData {
    id: string;
    lesson_id: string;
    content_type: string;
    content_status: string;
}

interface ContentItem {
    id: string;
    content_type: 'lesson' | 'quiz';
    content_id: string;
    position: number;
    content_status: string;
    lesson_id: string | null;
    lesson_title: string | null;
    quiz_id: string | null;
    quiz_title: string | null;
    lesson_content_items?: LessonContentItemData[];
}

interface Module {
    id: string;
    title: string;
    position: number;
    content_status: string;
    is_sequential?: boolean;
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
}

const isPending = (status: string) =>
    status === 'pending_addition' || status === 'pending_deletion';

const lessonHasPendingContent = (item: ContentItem): boolean => {
    if (isPending(item.content_status)) return true;
    return (item.lesson_content_items || []).some(lci => isPending(lci.content_status));
};

const moduleHasPendingContent = (module: Module): boolean => {
    if (isPending(module.content_status)) return true;
    return module.content_items.some(lessonHasPendingContent);
};

const CourseStructureTree: React.FC<CourseStructureTreeProps> = ({
    modules,
    selectedLessonId,
    onSelectLesson,
    feedbackCounts,
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

    const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
        if (status === 'pending_addition') {
            return (
                <span className="flex items-center gap-0.5 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full font-medium border border-blue-200">
                    <Plus size={10} />
                    New
                </span>
            );
        }
        if (status === 'pending_deletion') {
            return (
                <span className="flex items-center gap-0.5 text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full font-medium border border-red-200">
                    <Trash2 size={10} />
                    Delete
                </span>
            );
        }
        return null;
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-[#304DB5]/5 to-transparent">
                <h3 className="font-semibold text-gray-900">Course Structure</h3>
                {(() => {
                    let additions = 0, deletions = 0;
                    modules.forEach(m => {
                        if (m.content_status === 'pending_addition') additions++;
                        if (m.content_status === 'pending_deletion') deletions++;
                        m.content_items.forEach(ci => {
                            if (ci.content_status === 'pending_addition') additions++;
                            if (ci.content_status === 'pending_deletion') deletions++;
                        });
                    });
                    if (additions === 0 && deletions === 0) return null;
                    return (
                        <div className="flex items-center gap-2 mt-1.5">
                            {additions > 0 && (
                                <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 font-medium">
                                    +{additions} pending
                                </span>
                            )}
                            {deletions > 0 && (
                                <span className="text-[10px] text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 font-medium">
                                    −{deletions} to delete
                                </span>
                            )}
                        </div>
                    );
                })()}
            </div>

            <div className="p-2">
                <div>
                    {modules.map((module) => {
                        const showModuleAlert = moduleHasPendingContent(module);

                        return (
                            <div key={module.id} className="mb-1">
                                {/* Module Header */}
                                <button
                                    onClick={() => toggleModule(module.id)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-left ${
                                        module.content_status === 'pending_deletion' ? 'bg-red-50/50 opacity-60' :
                                        module.content_status === 'pending_addition' ? 'bg-blue-50/50' : ''
                                    }`}
                                >
                                    {expandedModules.has(module.id) ? (
                                        <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                                    ) : (
                                        <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                                    )}
                                    {module.is_sequential && (
                                        <Lock size={13} className="text-gray-400 flex-shrink-0" title="Sequential module" />
                                    )}
                                    <span className="font-medium text-gray-900 text-sm truncate flex-1">
                                        {module.title}
                                    </span>
                                    {showModuleAlert && (
                                        <AlertCircle size={14} className="text-amber-500 flex-shrink-0" />
                                    )}
                                    <StatusBadge status={module.content_status} />
                                    <span className="text-xs text-gray-400">
                                        {module.content_items.length}
                                    </span>
                                </button>

                                {expandedModules.has(module.id) && (
                                    <div className="ml-6 space-y-0.5">
                                        {module.content_items.map((item) => {
                                            const isLesson = item.content_type === 'lesson';
                                            const itemId = isLesson ? item.lesson_id : item.quiz_id;
                                            const itemTitle = isLesson ? item.lesson_title : item.quiz_title;
                                            const feedbackCount = itemId ? feedbackCounts[itemId] || 0 : 0;
                                            const isSelected = selectedLessonId === itemId;
                                            const hasPending = lessonHasPendingContent(item);

                                            return (
                                                <button
                                                    key={item.id}
                                                    onClick={() => isLesson && itemId && itemTitle && onSelectLesson(itemId, itemTitle)}
                                                    disabled={!isLesson}
                                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                                                        item.content_status === 'pending_deletion'
                                                            ? 'border-l-3 border-red-400 bg-red-50/50 opacity-60'
                                                            : item.content_status === 'pending_addition'
                                                            ? 'border-l-3 border-blue-400 bg-blue-50/50'
                                                            : ''
                                                    } ${isSelected
                                                            ? 'bg-[#304DB5]/10 text-gray-900 font-semibold'
                                                            : isLesson
                                                                ? 'hover:bg-gray-100 text-gray-700'
                                                                : 'text-gray-400 cursor-not-allowed'
                                                        }`}
                                                >
                                                    {isLesson ? (
                                                        <FileText size={14} className="flex-shrink-0" />
                                                    ) : (
                                                        <HelpCircle size={14} className="flex-shrink-0" />
                                                    )}
                                                    <span className="flex-1 truncate">{itemTitle || 'Untitled'}</span>
                                                    {hasPending && (
                                                        <AlertCircle size={14} className="text-amber-500 flex-shrink-0" />
                                                    )}
                                                    <StatusBadge status={item.content_status} />
                                                    {feedbackCount > 0 && (
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${isSelected ? 'bg-[#304DB5]/20 text-[#304DB5]' : 'bg-amber-100 text-amber-700'
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
                        );
                    })}
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
