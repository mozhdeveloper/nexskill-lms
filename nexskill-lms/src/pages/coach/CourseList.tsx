import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CoachAppLayout from '../../layouts/CoachAppLayout';
import CourseTable from '../../components/coach/course-builder/CourseTable';
import { useUser } from '../../context/UserContext';
import { supabase } from '../../lib/supabaseClient';
import DeleteCourseModal from '../../components/courses/DeleteCourseModal';

const CourseList: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useUser();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!profile) return;

      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*, admin_verification_feedback(content, created_at, is_resolved), modules(id, module_content_items(count))')
          .eq('coach_id', profile.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          // DEBUG: Log feedback specifically for rejected/changes_requested courses
          data.forEach((c: any) => {
            if (c.verification_status === 'changes_requested' || c.verification_status === 'rejected') {
              console.log(`[DEBUG] Feedback for ${c.title} (${c.id}):`, c.admin_verification_feedback);
            }
          });

          const mappedCourses = data.map((course: any) => {
            let status = 'draft';

            if (course.verification_status === 'approved' && course.visibility === 'public') {
              status = 'published';
            } else if (course.verification_status === 'pending_review') {
              status = 'pending';
            } else if (course.verification_status === 'changes_requested') {
              status = 'changes_requested';
            } else if (course.verification_status === 'rejected') {
              status = 'rejected';
            } else {
              status = 'draft';
            }

            // Get latest feedback if exists
            const feedbacks = course.admin_verification_feedback;
            const latestFeedback = feedbacks && feedbacks.length > 0
              ? feedbacks.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
              : null;

            // Calculate module and lesson counts
            const moduleCount = course.modules?.length || 0;
            const lessonCount = course.modules?.reduce((sum: number, m: any) => {
              const count = m.module_content_items?.[0]?.count || 0;
              return sum + count;
            }, 0) || 0;

            return {
              id: course.id,
              title: course.title,
              status: status,
              enrolledStudents: 0, // Placeholder
              moduleCount,
              lessonCount,
              rating: 0, // Placeholder
              lastUpdated: new Date(course.updated_at).toLocaleDateString(),
              adminFeedback: latestFeedback
            };
          });
          setCourses(mappedCourses);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [profile]);

  const handleEdit = (courseId: string) => {
    navigate(`/coach/courses/${courseId}/edit`);
  };

  const handlePreview = (courseId: string) => {
    navigate(`/coach/courses/${courseId}/edit`, { state: { activeSection: 'preview' } });
  };

  const handleCreateNew = () => {
    navigate('/coach/courses/new');
  };

  const handleDeleteClick = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (course) {
      setCourseToDelete({ id: course.id, title: course.title });
      setDeleteModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseToDelete.id);

      if (error) throw error;

      // Remove from local state
      setCourses(courses.filter((c) => c.id !== courseToDelete.id));
      setDeleteModalOpen(false);
      setCourseToDelete(null);
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course. Please try again.');
    }
  };

  return (
    <CoachAppLayout>
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 dark:border-gray-700 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-dark-text-primary mb-2">My courses</h1>
              <p className="text-slate-600 dark:text-dark-text-secondary">Manage your published and draft courses</p>
            </div>
            <button
              onClick={handleCreateNew}
              className="px-6 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create new course
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-5">
              <p className="text-sm text-slate-600 dark:text-dark-text-secondary mb-1">Total courses</p>
              <p className="text-3xl font-bold text-[#304DB5]">{courses.length}</p>
            </div>
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-5">
              <p className="text-sm text-slate-600 dark:text-dark-text-secondary mb-1">Published</p>
              <p className="text-3xl font-bold text-green-600">
                {courses.filter((c) => c.status === 'published').length}
              </p>
            </div>
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-5">
              <p className="text-sm text-slate-600 dark:text-dark-text-secondary mb-1">Drafts</p>
              <p className="text-3xl font-bold text-slate-600 dark:text-dark-text-secondary">
                {courses.filter((c) => c.status === 'draft').length}
              </p>
            </div>
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-sm border border-slate-200 dark:border-gray-700 p-5">
              <p className="text-sm text-slate-600 dark:text-dark-text-secondary mb-1">Total students</p>
              <p className="text-3xl font-bold text-purple-600">
                {courses.reduce((sum, c) => sum + c.enrolledStudents, 0)}
              </p>
            </div>
          </div>

          {/* Course Table */}
          {loading ? (
            <div className="text-center py-8">Loading courses...</div>
          ) : (
            <CourseTable
              courses={courses}
              onEdit={handleEdit}
              onPreview={handlePreview}
              onDelete={handleDeleteClick}
            />
          )}
        </div>
      </div>

      <DeleteCourseModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        courseName={courseToDelete?.title || ''}
      />
    </CoachAppLayout>
  );
};

export default CourseList;
