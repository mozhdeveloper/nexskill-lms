import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export interface CourseProgressData {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  totalTimeSpentSeconds: number;
}

/**
 * Hook that calculates real progress for enrolled courses by querying:
 *  - modules → module_content_items (lessons) for total lesson count
 *  - user_lesson_progress for completed lesson count + time spent
 */
export const useCourseProgress = (courseIds?: string[]) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<CourseProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!user || !courseIds || courseIds.length === 0) {
      setProgress([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Get all modules for these courses
      const { data: modules, error: modError } = await supabase
        .from('modules')
        .select('id, course_id')
        .in('course_id', courseIds);

      if (modError) throw modError;

      const moduleIds = modules?.map(m => m.id) || [];

      // 2. Get all lesson content items in these modules
      let allContentItems: { module_id: string; content_id: string; content_type: string }[] = [];
      if (moduleIds.length > 0) {
        const { data: items, error: itemError } = await supabase
          .from('module_content_items')
          .select('module_id, content_id, content_type')
          .in('module_id', moduleIds)
          .eq('content_type', 'lesson');

        if (itemError) throw itemError;
        allContentItems = items || [];
      }

      // 3. Get user's completed lessons
      const allLessonIds = allContentItems.map(i => i.content_id);
      let completedMap: Record<string, { is_completed: boolean; time_spent_seconds: number }> = {};

      if (allLessonIds.length > 0) {
        const { data: lessonProgress, error: lpError } = await supabase
          .from('user_lesson_progress')
          .select('lesson_id, is_completed, time_spent_seconds')
          .eq('user_id', user.id)
          .in('lesson_id', allLessonIds);

        if (lpError) throw lpError;

        for (const lp of lessonProgress || []) {
          completedMap[lp.lesson_id] = {
            is_completed: lp.is_completed,
            time_spent_seconds: lp.time_spent_seconds || 0,
          };
        }
      }

      // 4. Build per-course module → lesson mapping
      const modulesByCourse: Record<string, string[]> = {};
      for (const m of modules || []) {
        if (!modulesByCourse[m.course_id]) modulesByCourse[m.course_id] = [];
        modulesByCourse[m.course_id].push(m.id);
      }

      const result: CourseProgressData[] = courseIds.map(courseId => {
        const courseModuleIds = modulesByCourse[courseId] || [];
        const courseLessons = allContentItems.filter(i => courseModuleIds.includes(i.module_id));
        const totalLessons = courseLessons.length;

        let completedLessons = 0;
        let totalTimeSpent = 0;

        for (const lesson of courseLessons) {
          const lp = completedMap[lesson.content_id];
          if (lp) {
            if (lp.is_completed) completedLessons++;
            totalTimeSpent += lp.time_spent_seconds;
          }
        }

        const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

        return {
          courseId,
          totalLessons,
          completedLessons,
          progressPercent,
          totalTimeSpentSeconds: totalTimeSpent,
        };
      });

      setProgress(result);
    } catch (err: any) {
      console.error('Error fetching course progress:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, courseIds?.join(',')]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Aggregate stats across all courses
  const totalLessons = progress.reduce((sum, p) => sum + p.totalLessons, 0);
  const totalCompleted = progress.reduce((sum, p) => sum + p.completedLessons, 0);
  const totalTimeSeconds = progress.reduce((sum, p) => sum + p.totalTimeSpentSeconds, 0);
  const overallPercent = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  return {
    progress,
    loading,
    error,
    refresh: fetchProgress,
    totalLessons,
    totalCompleted,
    totalTimeSeconds,
    overallPercent,
  };
};
