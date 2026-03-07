import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, BookOpen, Play } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface CourseOverview {
  id: string;
  title: string;
  level: string;
  moduleCount: number;
  lessonCount: number;
  progress: number;
}

interface EnrolledCoursesOverviewProps {
  maxCourses?: number;
}

const EnrolledCoursesOverview: React.FC<EnrolledCoursesOverviewProps> = ({ maxCourses = 4 }) => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseOverview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      setLoading(true);
      // This would typically fetch from auth context
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch enrolled courses
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('profile_id', user.id)
        .limit(maxCourses);

      if (!enrollments || enrollments.length === 0) {
        setCourses([]);
        return;
      }

      const courseIds = enrollments.map(e => e.course_id);

      // Fetch course details
      const { data: courseData } = await supabase
        .from('courses')
        .select('id, title, level')
        .in('id', courseIds);

      if (!courseData) {
        setCourses([]);
        return;
      }

      // For each course, fetch module and lesson counts
      const coursesWithCounts = await Promise.all(
        courseData.map(async (course) => {
          const { count: moduleCount } = await supabase
            .from('modules')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);

          const { data: modules } = await supabase
            .from('modules')
            .select('id')
            .eq('course_id', course.id);

          let lessonCount = 0;
          if (modules && modules.length > 0) {
            const moduleIds = modules.map(m => m.id);
            const { count } = await supabase
              .from('module_content_items')
              .select('*', { count: 'exact', head: true })
              .in('module_id', moduleIds)
              .eq('content_type', 'lesson');
            lessonCount = count || 0;
          }

          return {
            id: course.id,
            title: course.title,
            level: course.level || 'Beginner',
            moduleCount: moduleCount || 0,
            lessonCount,
            progress: Math.floor(Math.random() * 100), // Placeholder - should be calculated from user_module_progress
          };
        })
      );

      setCourses(coursesWithCounts);
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-8 bg-slate-50 dark:bg-slate-800 rounded-2xl">
        <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <p className="text-slate-600 dark:text-slate-400 font-medium">No enrolled courses yet</p>
        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Explore our course catalog to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {courses.map((course) => (
        <div
          key={course.id}
          className="bg-white dark:bg-dark-background-card rounded-2xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-all group cursor-pointer"
          onClick={() => navigate(`/student/courses/${course.id}/curriculum`)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary group-hover:text-brand-primary transition-colors">
                  {course.title}
                </h4>
                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-xs font-medium text-blue-700 dark:text-blue-300 rounded">
                  {course.level}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-3">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {course.moduleCount} modules
                </span>
                <span className="flex items-center gap-1">
                  <Play className="w-3 h-3" />
                  {course.lessonCount} lessons
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-primary to-brand-primary-light rounded-full transition-all duration-300"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {course.progress}% complete
                </p>
              </div>
            </div>

            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all mt-1 flex-shrink-0 ml-3" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default EnrolledCoursesOverview;
