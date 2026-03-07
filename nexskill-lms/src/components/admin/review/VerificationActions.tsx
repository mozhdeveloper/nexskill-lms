import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Clock, User, BookOpen, DollarSign, Globe } from 'lucide-react';
import type { CourseVerificationStatus } from '../../../types/db';

interface CourseInfo {
    id: string;
    title: string;
    subtitle: string | null;
    level: string | null;
    language: string | null;
    duration_hours: number;
    price: number;
    verification_status: CourseVerificationStatus;
    coach?: {
        first_name: string | null;
        last_name: string | null;
        email: string | null;
    };
    category?: {
        name: string;
    };
}

interface VerificationActionsProps {
    course: CourseInfo;
    unresolvedFeedbackCount: number;
    onUpdateStatus: (status: CourseVerificationStatus, feedback?: string) => Promise<void>;
    onAddFeedback: (lessonId: string | null, content: string) => Promise<void>;
}

const VerificationActions: React.FC<VerificationActionsProps> = ({
    course,
    unresolvedFeedbackCount,
    onUpdateStatus,
    onAddFeedback
}) => {
    const [submitting, setSubmitting] = useState<string | null>(null);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState<'reject' | 'request_changes'>('request_changes');
    const [rejectionReason, setRejectionReason] = useState('');

    const handleActionClick = (action: 'reject' | 'request_changes') => {
        setModalAction(action);
        setRejectionReason('');
        setRejectModalOpen(true);
    };

    const handleActionSubmit = async () => {
        if (!rejectionReason.trim()) return;

        try {
            const status = modalAction === 'reject' ? 'rejected' : 'changes_requested';
            setSubmitting(status);

            // 1. Add feedback to history
            const feedbackPrefix = modalAction === 'reject' ? 'REJECTED: ' : '';
            await onAddFeedback(null, `${feedbackPrefix}${rejectionReason}`);

            // 2. Update course status
            await onUpdateStatus(status, rejectionReason);

            setRejectModalOpen(false);
            setRejectionReason('');
        } catch (error) {
            console.error('Failed to update status:', error);
        } finally {
            setSubmitting(null);
        }
    };

    const handleApprove = async () => {
        try {
            setSubmitting('approved');
            await onUpdateStatus('approved');
        } catch (error) {
            console.error('Failed to approve:', error);
        } finally {
            setSubmitting(null);
        }
    };

    const getStatusBadge = (status: CourseVerificationStatus) => {
        switch (status) {
            case 'draft':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        <Clock size={12} />
                        Draft
                    </span>
                );
            case 'pending_review':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        <Clock size={12} />
                        Pending Review
                    </span>
                );
            case 'changes_requested':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        <AlertTriangle size={12} />
                        Changes Requested
                    </span>
                );
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle size={12} />
                        Approved
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <XCircle size={12} />
                        Rejected
                    </span>
                );
        }
    };

    return (
        <>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {/* Course Info Header */}
                <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-[#304DB5]/5 to-transparent">
                    <h3 className="font-semibold text-gray-900">Course Details</h3>
                </div>

                <div className="p-4 space-y-4">
                    {/* Course Title & Status */}
                    <div>
                        <h4 className="font-medium text-gray-900">{course.title}</h4>
                        {course.subtitle && (
                            <p className="text-sm text-gray-500 mt-1">{course.subtitle}</p>
                        )}
                        <div className="mt-2">
                            {getStatusBadge(course.verification_status)}
                        </div>
                    </div>

                    {/* Course Meta */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-500">
                            <User size={14} />
                            <span className="truncate">
                                {course.coach?.first_name} {course.coach?.last_name}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                            <BookOpen size={14} />
                            <span>{course.category?.name || 'No category'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                            <Clock size={14} />
                            <span>{course.duration_hours}h</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                            <DollarSign size={14} />
                            <span>₱{course.price.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                            <Globe size={14} />
                            <span>{course.language || 'English'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500">
                            <AlertTriangle size={14} />
                            <span>{course.level || 'All levels'}</span>
                        </div>
                    </div>

                    {/* Unresolved Feedback Warning */}
                    {unresolvedFeedbackCount > 0 && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-center gap-2 text-amber-700 text-sm">
                                <AlertTriangle size={16} />
                                <span>
                                    {unresolvedFeedbackCount} unresolved feedback item{unresolvedFeedbackCount !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-4 border-t border-gray-200 space-y-2">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Update Status</h4>

                        <button
                            onClick={handleApprove}
                            disabled={submitting !== null || course.verification_status === 'approved'}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <CheckCircle size={18} />
                            {submitting === 'approved' ? 'Approving...' : 'Approve Course'}
                        </button>

                        <button
                            onClick={() => handleActionClick('request_changes')}
                            disabled={submitting !== null || course.verification_status === 'changes_requested'}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <AlertTriangle size={18} />
                            Request Changes
                        </button>

                        <button
                            onClick={() => handleActionClick('reject')}
                            disabled={submitting !== null || course.verification_status === 'rejected'}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <XCircle size={18} />
                            Reject Course
                        </button>
                    </div>
                </div>
            </div>

            {/* Rejection/Request Changes Modal */}
            {rejectModalOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                        onClick={() => setRejectModalOpen(false)}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                            <h3 className="text-xl font-bold text-[#111827] mb-4">
                                {modalAction === 'reject' ? 'Reject Course' : 'Request Changes'}
                            </h3>
                            <p className="text-sm text-[#5F6473] mb-4">
                                {modalAction === 'reject'
                                    ? 'Please provide a reason for rejecting this course. This will be visible to the instructor.'
                                    : 'Please provide feedback on what needs to be changed.'}
                            </p>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder={modalAction === 'reject' ? "Enter rejection reason..." : "Enter feedback..."}
                                className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] focus:ring-2 focus:ring-[#304DB5] focus:border-transparent outline-none resize-none mb-6"
                                rows={4}
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setRejectModalOpen(false)}
                                    className="flex-1 px-4 py-2 bg-[#F5F7FF] text-[#5F6473] font-semibold rounded-full hover:bg-[#EDF0FB] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleActionSubmit}
                                    disabled={!rejectionReason.trim() || submitting !== null}
                                    className={`flex-1 px-4 py-2 font-semibold rounded-full transition-colors text-white ${rejectionReason.trim()
                                        ? modalAction === 'reject'
                                            ? 'bg-[#DC2626] hover:bg-[#B91C1C]'
                                            : 'bg-amber-500 hover:bg-amber-600'
                                        : 'bg-gray-300 cursor-not-allowed'
                                        }`}
                                >
                                    {submitting ? 'Submitting...' : (modalAction === 'reject' ? 'Reject Course' : 'Submit Request')}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default VerificationActions;
