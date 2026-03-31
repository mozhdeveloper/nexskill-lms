import { supabase } from './supabaseClient';

/**
 * Deletes a course and all its related data in the correct order
 * to avoid foreign key constraint violations.
 * 
 * Delete order:
 * 1. quiz_questions (child of quizzes)
 * 2. quizzes
 * 3. lesson_content_items (child of lessons)
 * 4. lessons
 * 5. module_content_items (links)
 * 6. modules
 * 7. course_goals, enrollments, reviews, etc.
 * 8. courses (finally)
 */
export const deleteCourseById = async (courseId: string): Promise<void> => {
  // Step 1: Get all modules for this course
  const { data: mods } = await supabase
    .from('modules')
    .select('id')
    .eq('course_id', courseId);

  const modIds = (mods || []).map((m: any) => m.id);

  if (modIds.length > 0) {
    // Step 2: Get all content items to find lesson/quiz IDs
    const { data: contentItems } = await supabase
      .from('module_content_items')
      .select('content_id, content_type')
      .in('module_id', modIds);

    const lessonIds = (contentItems || [])
      .filter((ci: any) => ci.content_type === 'lesson')
      .map((ci: any) => ci.content_id);

    const quizIds = (contentItems || [])
      .filter((ci: any) => ci.content_type === 'quiz')
      .map((ci: any) => ci.content_id);

    // Step 3: Delete quiz_questions BEFORE quizzes (FK constraint)
    if (quizIds.length > 0) {
      await supabase.from('quiz_questions').delete().in('quiz_id', quizIds);
      await supabase.from('quizzes').delete().in('id', quizIds);
    }

    // Step 4: Delete lesson_content_items BEFORE lessons (FK constraint)
    if (lessonIds.length > 0) {
      await supabase.from('lesson_content_items').delete().in('lesson_id', lessonIds);
      await supabase.from('lessons').delete().in('id', lessonIds);
    }

    // Step 5: Delete module_content_items, then modules
    await supabase.from('module_content_items').delete().in('module_id', modIds);
    await supabase.from('modules').delete().in('id', modIds);
  }

  // Step 6: Delete all other course-related rows
  await supabase.from('course_goals').delete().eq('course_id', courseId);
  await supabase.from('enrollments').delete().eq('course_id', courseId);
  await supabase.from('reviews').delete().eq('course_id', courseId);
  await supabase.from('course_learning_objectives').delete().eq('course_id', courseId);
  await supabase.from('course_topics').delete().eq('course_id', courseId);
  await supabase.from('course_inclusions').delete().eq('course_id', courseId);
  await supabase.from('live_sessions').delete().eq('course_id', courseId);
  await supabase.from('student_wishlist').delete().eq('course_id', courseId);
  await supabase.from('user_lesson_progress').delete().eq('course_id', courseId);
  await supabase.from('quiz_attempts').delete().eq('course_id', courseId);

  // Step 7: Finally delete the course itself
  const { error } = await supabase.from('courses').delete().eq('id', courseId);
  if (error) throw error;
};
