import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Course {
  id: string;
  title: string;
  instructorName: string;
  instructorEmail: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  submittedAt: string;
  qualityScore: number;
  qualityFlags: string[];
  reportsCount: number;
}

interface CourseApprovalTableProps {
  courses: Course[];
  onSelect: (courseId: string) => void;
  onApprove: (courseId: string) => void;
  onReject: (courseId: string, reason: string) => void;
  onRequestChanges: (courseId: string, reason: string) => void;
}

const CourseApprovalTable: React.FC<CourseApprovalTableProps> = ({
  courses,
  onSelect,
  onApprove,
  onReject,
  onRequestChanges,
}) => {
  const navigate = useNavigate();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<'reject' | 'request_changes'>('request_changes');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const getQualityConfig = (score: number) => {
    if (score >= 80) {
      return {
        label: `${score}/100`,
        bg: 'bg-[#D1FAE5]',
        text: 'text-[#059669]',
        border: 'border-[#6EE7B7]',
      };
    } else if (score >= 60) {
      return {
        label: `${score}/100`,
        bg: 'bg-[#FEF3C7]',
        text: 'text-[#D97706]',
        border: 'border-[#FCD34D]',
      };
    } else {
      return {
        label: `${score}/100`,
        bg: 'bg-[#FEE2E2]',
        text: 'text-[#DC2626]',
        border: 'border-[#FCA5A5]',
      };
    }
  };

  const getStatusConfig = (status: Course['status']) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending',
          bg: 'bg-[#DBEAFE]',
          text: 'text-[#1E40AF]',
          border: 'border-[#93C5FD]',
        };
      case 'approved':
        return {
          label: 'Approved',
          bg: 'bg-[#D1FAE5]',
          text: 'text-[#059669]',
          border: 'border-[#6EE7B7]',
        };
      case 'rejected':
        return {
          label: 'Rejected',
          bg: 'bg-[#FEE2E2]',
          text: 'text-[#DC2626]',
          border: 'border-[#FCA5A5]',
        };
      case 'changes_requested':
        return {
          label: 'Changes Req.',
          bg: 'bg-amber-100',
          text: 'text-amber-700',
          border: 'border-amber-200',
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleActionClick = (courseId: string, action: 'reject' | 'request_changes') => {
    setSelectedCourseId(courseId);
    setModalAction(action);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleActionSubmit = () => {
    if (selectedCourseId && rejectionReason.trim()) {
      if (modalAction === 'reject') {
        onReject(selectedCourseId, rejectionReason);
      } else if (onRequestChanges) {
        onRequestChanges(selectedCourseId, rejectionReason);
      }
      setRejectModalOpen(false);
      setSelectedCourseId(null);
      setRejectionReason('');
    }
  };

  const pendingCount = courses.filter((c) => c.status === 'pending').length;

  if (courses.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#EDF0FB] p-12 shadow-md text-center">
        <div className="text-6xl mb-4">✅</div>
        <p className="text-lg font-semibold text-[#111827] mb-2">No courses found</p>
        <p className="text-sm text-[#5F6473]">
          Try adjusting your filters or check back later
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-[#EDF0FB] shadow-md overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EDF0FB] bg-[#F5F7FF] flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#111827]">Courses Pending Approval</h2>
          {pendingCount > 0 && (
            <span className="px-3 py-1 bg-[#DBEAFE] text-[#1E40AF] text-sm font-semibold rounded-full border border-[#93C5FD]">
              {pendingCount} pending
            </span>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F9FAFB] border-b border-[#EDF0FB]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                  Instructor
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                  Quality
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                  Reports
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[#5F6473] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDF0FB]">
              {courses.map((course) => {
                const qualityConfig = getQualityConfig(course.qualityScore);
                const statusConfig = getStatusConfig(course.status);
                return (
                  <tr
                    key={course.id}
                    className="hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                    onClick={() => onSelect(course.id)}
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-[#111827]">{course.title}</p>
                      <p className="text-xs text-[#9CA3B5] capitalize">{course.category}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-[#111827]">{course.instructorName}</p>
                      <p className="text-xs text-[#9CA3B5]">{course.instructorEmail}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#5F6473]">{formatDate(course.submittedAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${qualityConfig.bg} ${qualityConfig.text} ${qualityConfig.border}`}
                        >
                          {qualityConfig.label}
                        </span>
                        {course.qualityFlags.length > 0 && (
                          <span className="text-xs text-[#9CA3B5]">
                            {course.qualityFlags.length} flag{course.qualityFlags.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {course.reportsCount > 0 ? (
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]">
                          {course.reportsCount}
                        </span>
                      ) : (
                        <span className="text-xs text-[#9CA3B5]">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                      >
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        {course.status === 'pending' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onApprove(course.id);
                              }}
                              className="px-3 py-1 text-xs font-semibold text-[#059669] hover:bg-[#D1FAE5] rounded-full transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActionClick(course.id, 'request_changes');
                              }}
                              className="px-3 py-1 text-xs font-semibold text-amber-600 hover:bg-amber-50 rounded-full transition-colors"
                            >
                              Request Changes
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActionClick(course.id, 'reject');
                              }}
                              className="px-3 py-1 text-xs font-semibold text-[#DC2626] hover:bg-[#FEE2E2] rounded-full transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/courses/review/${course.id}`);
                          }}
                          className="px-3 py-1 text-xs font-semibold text-white bg-[#304DB5] hover:bg-[#263c91] rounded-full transition-colors"
                        >
                          Review
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(course.id);
                          }}
                          className="px-3 py-1 text-xs font-semibold text-[#304DB5] hover:bg-[#F5F7FF] rounded-full transition-colors"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden divide-y divide-[#EDF0FB]">
          {courses.map((course) => {
            const qualityConfig = getQualityConfig(course.qualityScore);
            const statusConfig = getStatusConfig(course.status);
            return (
              <div
                key={course.id}
                className="p-4 hover:bg-[#F9FAFB] transition-colors"
                onClick={() => onSelect(course.id)}
              >
                <div className="mb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-[#111827] mb-1">{course.title}</p>
                      <p className="text-xs text-[#9CA3B5] capitalize mb-2">{course.category}</p>
                      <p className="text-sm text-[#5F6473]">{course.instructorName}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                    >
                      {statusConfig.label}
                    </span>
                  </div>
                  <div className="flex gap-2 items-center mb-2">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${qualityConfig.bg} ${qualityConfig.text} ${qualityConfig.border}`}
                    >
                      {qualityConfig.label}
                    </span>
                    {course.reportsCount > 0 && (
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FEE2E2] text-[#DC2626]">
                        {course.reportsCount} report{course.reportsCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 pt-3 border-t border-[#EDF0FB]">
                  {course.status === 'pending' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onApprove(course.id);
                        }}
                        className="flex-1 px-3 py-2 text-sm font-semibold text-[#059669] bg-[#D1FAE5] rounded-full"
                      >
                        Approve
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActionClick(course.id, 'request_changes');
                        }}
                        className="flex-1 px-3 py-2 text-sm font-semibold text-amber-600 bg-amber-50 rounded-full"
                      >
                        Req. Changes
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleActionClick(course.id, 'reject');
                        }}
                        className="flex-1 px-3 py-2 text-sm font-semibold text-[#DC2626] bg-[#FEE2E2] rounded-full"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/courses/review/${course.id}`);
                    }}
                    className="flex-1 px-3 py-2 text-sm font-semibold text-white bg-[#304DB5] rounded-full"
                  >
                    Review
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(course.id);
                    }}
                    className="flex-1 px-3 py-2 text-sm font-semibold text-[#304DB5] bg-[#F5F7FF] rounded-full"
                  >
                    Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rejection Modal */}
      {rejectModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setRejectModalOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
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
                className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] focus:ring-2 focus:ring-[#304DB5] focus:border-transparent outline-none resize-none"
                rows={4}
              />
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setRejectModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-[#F5F7FF] text-[#5F6473] font-semibold rounded-full hover:bg-[#EDF0FB] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleActionSubmit}
                  disabled={!rejectionReason.trim()}
                  className={`flex-1 px-4 py-2 font-semibold rounded-full transition-colors ${rejectionReason.trim()
                    ? modalAction === 'reject'
                      ? 'bg-[#DC2626] text-white hover:bg-[#B91C1C]'
                      : 'bg-amber-500 text-white hover:bg-amber-600'
                    : 'bg-[#E5E7EB] text-[#9CA3B5] cursor-not-allowed'
                    }`}
                >
                  {modalAction === 'reject' ? 'Reject Course' : 'Request Changes'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default CourseApprovalTable;
