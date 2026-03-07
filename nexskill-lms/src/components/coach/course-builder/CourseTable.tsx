import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Course {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'scheduled' | 'pending' | 'changes_requested' | 'rejected';
  enrolledStudents: number;
  moduleCount: number;
  lessonCount: number;
  rating: number;
  lastUpdated: string;
  adminFeedback?: {
    content: string;
    created_at: string;
  } | null;
}

interface CourseTableProps {
  courses: Course[];
  onEdit: (courseId: string) => void;
  onPreview: (courseId: string) => void;
  onDelete: (courseId: string) => void;
}

const CourseTable: React.FC<CourseTableProps> = ({ courses, onEdit, onPreview, onDelete }) => {
  const navigate = useNavigate();
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<{ title: string; content: string; date: string } | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'changes_requested':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'draft':
        return 'bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-dark-text-primary border-slate-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-dark-text-primary border-slate-200';
    }
  };

  const handleViewFeedback = (course: Course) => {
    if (course.adminFeedback) {
      setSelectedFeedback({
        title: course.title,
        content: course.adminFeedback.content,
        date: new Date(course.adminFeedback.created_at).toLocaleDateString()
      });
      setFeedbackModalOpen(true);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700">
              <tr>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700 dark:text-dark-text-primary">Course</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700 dark:text-dark-text-primary">Status</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700 dark:text-dark-text-primary">Modules / Lessons</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700 dark:text-dark-text-primary">Students</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700 dark:text-dark-text-primary">Rating</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700 dark:text-dark-text-primary">Last updated</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-slate-700 dark:text-dark-text-primary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id} className="border-b border-slate-100 hover:bg-slate-50 dark:hover:bg-gray-800 dark:bg-gray-800 transition-colors">
                  <td className="py-4 px-6">
                    <p className="font-semibold text-slate-900">{course.title}</p>
                    {(course.status === 'rejected' || course.status === 'changes_requested') && course.adminFeedback && (
                      <button
                        onClick={() => handleViewFeedback(course)}
                        className="text-xs text-red-600 hover:text-red-800 hover:underline mt-1 flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        View Admin Feedback
                      </button>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(
                        course.status
                      )}`}
                    >
                      {course.status.replace('_', ' ').charAt(0).toUpperCase() + course.status.replace('_', ' ').slice(1)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col text-sm">
                      <span className="text-slate-700 dark:text-dark-text-primary font-medium">{course.moduleCount} Modules</span>
                      <span className="text-slate-500 text-xs">{course.lessonCount} Lessons</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-slate-700">{course.enrolledStudents}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">⭐</span>
                      <span className="text-sm font-medium text-slate-700">{course.rating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-slate-600">{course.lastUpdated}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(course.id)}
                        className="px-4 py-2 text-sm font-medium text-[#304DB5] hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(course.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete course"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      {course.status === 'published' && course.enrolledStudents > 0 && (
                        <button
                          onClick={() => navigate(`/coach/courses/${course.id}/students`)}
                          className="px-4 py-2 text-sm font-medium text-[#304DB5] hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          View students
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-slate-200">
          {courses.map((course) => (
            <div key={course.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-dark-text-primary mb-2">{course.title}</h3>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span
                      className={`inline-block px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(
                        course.status
                      )}`}
                    >
                      {course.status.replace('_', ' ').charAt(0).toUpperCase() + course.status.replace('_', ' ').slice(1)}
                    </span>
                    {(course.status === 'rejected' || course.status === 'changes_requested') && course.adminFeedback && (
                      <button
                        onClick={() => handleViewFeedback(course)}
                        className="text-xs text-red-600 hover:text-red-800 hover:underline flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Feedback
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
                <div>
                  <p className="text-slate-600 dark:text-dark-text-secondary text-xs mb-1">Students</p>
                  <p className="font-medium text-slate-900">{course.enrolledStudents}</p>
                </div>
                <div>
                  <p className="text-slate-600 dark:text-dark-text-secondary text-xs mb-1">Rating</p>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">⭐</span>
                    <span className="font-medium text-slate-900">{course.rating.toFixed(1)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-slate-600 dark:text-dark-text-secondary text-xs mb-1">Updated</p>
                  <p className="font-medium text-slate-900 dark:text-dark-text-primary text-xs">{course.lastUpdated}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(course.id)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] rounded-full"
                >
                  Edit
                </button>
                <button
                  onClick={() => onPreview(course.id)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-dark-text-primary border border-slate-300 dark:border-gray-600 rounded-full"
                >
                  Preview
                </button>
                <button
                  onClick={() => onDelete(course.id)}
                  className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 bg-red-50 rounded-full hover:bg-red-100 transition-colors"
                >
                  Delete
                </button>
                {course.status === 'published' && course.enrolledStudents > 0 && (
                  <button
                    onClick={() => navigate(`/coach/courses/${course.id}/students`)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-[#304DB5] border border-[#304DB5] rounded-full hover:bg-blue-50 transition-colors"
                  >
                    Students
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {courses.length === 0 && (
          <div className="py-12 text-center">
            <div className="text-slate-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <p className="text-lg text-slate-600 dark:text-dark-text-secondary mb-2">No courses yet</p>
            <p className="text-sm text-slate-500">Create your first course to get started</p>
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {feedbackModalOpen && selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-red-50 dark:bg-red-900/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Admin Feedback</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{selectedFeedback.title}</p>
                </div>
              </div>
              <button
                onClick={() => setFeedbackModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-4">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</span>
                <p className="text-sm text-gray-700 dark:text-gray-300">{selectedFeedback.date}</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</span>
                <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  {selectedFeedback.content}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setFeedbackModalOpen(false)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CourseTable;
