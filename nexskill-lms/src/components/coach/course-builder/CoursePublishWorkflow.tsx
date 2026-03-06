import React from 'react';

interface CheckItem {
  id: string;
  label: string;
  completed: boolean;
}

interface CoursePublishWorkflowProps {
  courseStatus: 'draft' | 'published';
  verificationStatus: string;
  adminFeedback?: string;
  onPublish: () => void;
  onUnpublish: () => void;
  onSubmitForReview: () => void;
}

const CoursePublishWorkflow: React.FC<CoursePublishWorkflowProps> = ({
  courseStatus,
  verificationStatus,
  adminFeedback,
  onPublish,
  onUnpublish,
  onSubmitForReview,
}) => {
  // Simulated readiness checks
  const checks: CheckItem[] = [
    { id: '1', label: 'Course title and description added', completed: true },
    { id: '2', label: 'At least one module with lessons created', completed: true },
    { id: '3', label: 'Pricing configured', completed: true },
    { id: '4', label: 'At least one video uploaded', completed: true },
  ];

  const allComplete = checks.every((c) => c.completed);

  const getVerificationBadge = () => {
    switch (verificationStatus) {
      case 'approved':
        return { icon: '✅', text: 'Approved', color: 'text-green-600', bg: 'bg-green-50 border-green-200' };
      case 'pending_review':
        return { icon: '⏳', text: 'Pending Review', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' };
      case 'changes_requested':
        return { icon: '⚠️', text: 'Changes Requested', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' };
      case 'rejected':
        return { icon: '❌', text: 'Rejected', color: 'text-red-600', bg: 'bg-red-50 border-red-200' };
      default:
        return { icon: '📝', text: 'Draft', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' };
    }
  };

  const badge = getVerificationBadge();

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-dark-text-primary mb-2">Publish course</h2>
      <p className="text-slate-600 dark:text-dark-text-secondary mb-6">
        Submit your course for verification. Once approved, you can publish it to the catalog.
      </p>

      {/* Verification Status */}
      <div className={`mb-6 p-4 rounded-2xl border ${badge.bg}`}>
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-1">{badge.icon}</span>
          <div className="flex-1">
            <p className="font-semibold text-slate-900">Verification Status</p>
            <p className={`text-sm capitalize ${badge.color}`}>{badge.text}</p>
          </div>
        </div>
      </div>

      {/* Publish Status (only show if approved) */}
      {verificationStatus === 'approved' && (
        <div className="mb-6 p-4 bg-slate-50 dark:bg-gray-800 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {courseStatus === 'published' ? '🚀' : '📦'}
            </span>
            <div>
              <p className="font-semibold text-slate-900">Publication Status</p>
              <p className="text-sm text-slate-600 dark:text-dark-text-secondary capitalize">{courseStatus}</p>
            </div>
          </div>
        </div>
      )}

      {/* Readiness checklist */}
      <div className="mb-6">
        <h3 className="font-bold text-slate-900 dark:text-dark-text-primary mb-4">Readiness checklist</h3>
        <div className="space-y-3">
          {checks.map((check) => (
            <div
              key={check.id}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 ${check.completed
                ? 'bg-green-50 border-green-200'
                : 'bg-slate-50 dark:bg-gray-800 border-slate-200'
                }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${check.completed
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-300 text-slate-600'
                  }`}
              >
                {check.completed ? '✓' : '○'}
              </div>
              <p className={`flex-1 ${check.completed ? 'text-slate-900' : 'text-slate-600'}`}>
                {check.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {verificationStatus !== 'approved' && verificationStatus !== 'pending_review' && (
          <div className="space-y-4">
            {(verificationStatus === 'changes_requested' || verificationStatus === 'rejected') && (
              <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-sm border border-amber-200">
                <strong>Wait!</strong> Have you addressed all the feedback? Once you resubmit, the admin will be notified.
              </div>
            )}
            <button
              onClick={onSubmitForReview}
              disabled={!allComplete}
              className={`w-full py-4 px-6 font-semibold rounded-full transition-all ${allComplete
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
            >
              {allComplete
                ? (verificationStatus === 'changes_requested' ? 'Resubmit for Review' : 'Submit for Review')
                : 'Complete checklist to submit'}
            </button>
          </div>
        )}

        {verificationStatus === 'pending_review' && (
          <div className="w-full py-4 px-6 bg-blue-50 text-blue-700 text-center font-semibold rounded-full border border-blue-200">
            Fetching popcorn... Admin is reviewing your course 🍿
          </div>
        )}

        {verificationStatus === 'approved' && courseStatus === 'draft' && (
          <button
            onClick={onPublish}
            className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-full hover:shadow-lg transition-all"
          >
            🚀 Publish Course
          </button>
        )}

        {verificationStatus === 'approved' && courseStatus === 'published' && (
          <button
            onClick={onUnpublish}
            className="w-full py-4 px-6 bg-slate-200 text-slate-700 font-semibold rounded-full hover:bg-slate-300 transition-all"
          >
            Unpublish Course
          </button>
        )}
      </div>
    </div>
  );
};

export default CoursePublishWorkflow;
