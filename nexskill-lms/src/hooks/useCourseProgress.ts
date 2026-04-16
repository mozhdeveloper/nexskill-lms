import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export interface CourseProgressData {
  courseId: string;
  totalItems: number;
  completedItems: number;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  totalTimeSpentSeconds: number;
}

/**
 * Hook that calculates real progress for enrolled courses by querying:
 *  - modules → module_content_items (lessons + quizzes) for total item count
 *  - user_lesson_progress for completed lesson count + time spent
 *  - quiz_attempts for completed quiz count
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

      // 2. Get all content items (lessons + quizzes) in these modules
      let allContentItems: { module_id: string; content_id: string; content_type: string }[] = [];
      if (moduleIds.length > 0) {
        const { data: items, error: itemError } = await supabase
          .from('module_content_items')
          .select('module_id, content_id, content_type')
          .in('module_id', moduleIds)
          .in('content_type', ['lesson', 'quiz'])
          .in('content_status', ['published', 'pending_deletion']);

        if (itemError) throw itemError;
        allContentItems = items || [];
      }

      // 3. Get user's completed lessons
      const allLessonIds = allContentItems.filter(i => i.content_type === 'lesson').map(i => i.content_id);
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

      // 4. Get user's passed quizzes
      const allQuizIds = allContentItems.filter(i => i.content_type === 'quiz').map(i => i.content_id);
      const completedQuizSet = new Set<string>();

      if (allQuizIds.length > 0) {
        const { data: quizProgress, error: qpError } = await supabase
          .from('quiz_attempts')
          .select('quiz_id')
          .eq('user_id', user.id)
          .eq('passed', true)
          .in('quiz_id', allQuizIds);

        if (qpError) throw qpError;
        for (const qp of quizProgress || []) {
          completedQuizSet.add(qp.quiz_id);
        }
      }

      // 5. Build per-course module → content item mapping
      const modulesByCourse: Record<string, string[]> = {};
      for (const m of modules || []) {
        if (!modulesByCourse[m.course_id]) modulesByCourse[m.course_id] = [];
        modulesByCourse[m.course_id].push(m.id);
      }

      const result: CourseProgressData[] = courseIds.map(courseId => {
        const courseModuleIds = modulesByCourse[courseId] || [];
        const courseItems = allContentItems.filter(i => courseModuleIds.includes(i.module_id));
        const courseLessons = courseItems.filter(i => i.content_type === 'lesson');
        const courseQuizzes = courseItems.filter(i => i.content_type === 'quiz');
        const totalItems = courseItems.length;
        const totalLessons = courseLessons.length;

        let completedLessons = 0;
        let completedQuizzes = 0;
        let totalTimeSpent = 0;

        for (const lesson of courseLessons) {
          const lp = completedMap[lesson.content_id];
          if (lp) {
            if (lp.is_completed) completedLessons++;
            totalTimeSpent += lp.time_spent_seconds;
          }
        }

        for (const quiz of courseQuizzes) {
          if (completedQuizSet.has(quiz.content_id)) completedQuizzes++;
        }

        const completedItems = completedLessons + completedQuizzes;
        const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

        return {
          courseId,
          totalItems,
          completedItems,
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
  const totalItems = progress.reduce((sum, p) => sum + p.totalItems, 0);
  const totalCompleted = progress.reduce((sum, p) => sum + p.completedItems, 0);
  const totalLessons = progress.reduce((sum, p) => sum + p.totalLessons, 0);
  const totalTimeSeconds = progress.reduce((sum, p) => sum + p.totalTimeSpentSeconds, 0);
  const overallPercent = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;

  return {
    progress,
    loading,
    error,
    refresh: fetchProgress,
    totalItems,
    totalCompleted,
    totalLessons,
    totalTimeSeconds,
    overallPercent,
  };
};
