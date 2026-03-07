import React, { useState } from 'react';
import { Send, MessageSquare, CheckCircle, Clock, User } from 'lucide-react';
import type { AdminVerificationFeedback } from '../../../types/db';

interface FeedbackPanelProps {
    feedback: AdminVerificationFeedback[];
    selectedLessonId: string | null;
    selectedLessonTitle: string | null;
    isCourseLevelView: boolean;
    onAddFeedback: (lessonId: string | null, content: string) => Promise<void>;
    onResolveFeedback: (feedbackId: string) => Promise<void>;
    loading?: boolean;
}

const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
    feedback,
    selectedLessonId,
    selectedLessonTitle,
    isCourseLevelView,
    onAddFeedback,
    onResolveFeedback,
    loading = false
}) => {
    const [newFeedback, setNewFeedback] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Filter feedback based on current view
    const filteredFeedback = feedback.filter(f => {
        if (isCourseLevelView) {
            return f.lesson_id === null;
        }
        return f.lesson_id === selectedLessonId;
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFeedback.trim()) return;

        try {
            setSubmitting(true);
            await onAddFeedback(isCourseLevelView ? null : selectedLessonId, newFeedback.trim());
            setNewFeedback('');
        } catch (error) {
            console.error('Failed to add feedback:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleResolve = async (feedbackId: string) => {
        try {
            await onResolveFeedback(feedbackId);
        } catch (error) {
            console.error('Failed to resolve feedback:', error);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTitle = () => {
        if (isCourseLevelView) {
            return 'Course-Level Feedback';
        }
        if (selectedLessonTitle) {
            return `Feedback: ${selectedLessonTitle}`;
        }
        return 'Select a lesson';
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden h-full flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-transparent">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <MessageSquare size={18} className="text-amber-600" />
                    {getTitle()}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                    {filteredFeedback.length} comment{filteredFeedback.length !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Feedback List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                    <div className="text-center py-8 text-gray-500">
                        Loading feedback...
                    </div>
                ) : filteredFeedback.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                        <p>No feedback yet</p>
                        <p className="text-xs mt-1">Add a comment below</p>
                    </div>
                ) : (
                    filteredFeedback.map((item) => (
                        <div
                            key={item.id}
                            className={`p-3 rounded-lg border ${item.is_resolved
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-white border-gray-200'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <User size={12} />
                                    <span>
                                        {item.admin?.first_name} {item.admin?.last_name}
                                    </span>
                                    <span>•</span>
                                    <Clock size={12} />
                                    <span>{formatDate(item.created_at)}</span>
                                </div>
                                {!item.is_resolved && (
                                    <button
                                        onClick={() => handleResolve(item.id)}
                                        className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1"
                                        title="Mark as resolved"
                                    >
                                        <CheckCircle size={14} />
                                        Resolve
                                    </button>
                                )}
                            </div>
                            <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                                {item.content}
                            </p>
                            {item.is_resolved && (
                                <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                                    <CheckCircle size={12} />
                                    Resolved
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Add Feedback Form */}
            {(isCourseLevelView || selectedLessonId) && (
                <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex gap-2">
                        <textarea
                            value={newFeedback}
                            onChange={(e) => setNewFeedback(e.target.value)}
                            placeholder={
                                isCourseLevelView
                                    ? "Add course-level feedback..."
                                    : "Add feedback for this lesson..."
                            }
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#304DB5] focus:border-transparent"
                            rows={2}
                            disabled={submitting}
                        />
                        <button
                            type="submit"
                            disabled={!newFeedback.trim() || submitting}
                            className="px-4 py-2 bg-[#304DB5] text-white rounded-lg hover:bg-[#263c91] disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default FeedbackPanel;
