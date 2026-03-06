import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// Type definitions - Updated: 2026-01-27T14:12
export interface LessonItem {
    id: string;
    title: string;
    description?: string;
    estimated_duration_minutes?: number;
    is_published: boolean;
    type: 'lesson';
}

export interface QuizItem {
    id: string;
    title: string;
    description?: string;
    passing_score?: number;
    time_limit_minutes?: number;
    is_published: boolean;
    type: 'quiz';
}

export type ContentItem = LessonItem | QuizItem;

export interface ModuleWithContent {
    id: string;
    title: string;
    description?: string;
    position: number;
    is_published: boolean;
    items: ContentItem[];
}

export interface CourseInfo {
    id: string;
    title: string;
    subtitle?: string;
    short_description?: string;
    level?: string;
    duration_hours?: number;
}

export interface CourseCurriculumData {
    course: CourseInfo | null;
    modules: ModuleWithContent[];
    totalLessons: number;
    totalQuizzes: number;
    totalDurationMinutes: number;
}

/**
 * Custom hook to fetch the complete course curriculum including all modules
 * and their content items (lessons and quizzes)
 */
export const useCourseCurriculum = (courseId: string | undefined) => {
    const [data, setData] = useState<CourseCurriculumData>({
        course: null,
        modules: [],
        totalLessons: 0,
        totalQuizzes: 0,
        totalDurationMinutes: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!courseId) {
            setLoading(false);
            return;
        }

        const fetchCurriculum = async () => {
            try {
                setLoading(true);
                setError(null);

                // 1. Fetch course info
                const { data: courseData, error: courseError } = await supabase
                    .from('courses')
                    .select('id, title, subtitle, short_description, level, duration_hours')
                    .eq('id', courseId)
                    .single();

                if (courseError) throw courseError;

                // 2. Fetch all PUBLISHED modules for this course (ordered by position)
                // Only show published modules to students
                const { data: modulesData, error: modulesError } = await supabase
                    .from('modules')
                    .select('id, title, description, position, is_published')
                    .eq('course_id', courseId)
                    .eq('is_published', true)
                    .order('position', { ascending: true });

                if (modulesError) throw modulesError;

                // 3. For each module, fetch content items
                const modulesWithContent: ModuleWithContent[] = [];
                let totalLessons = 0;
                let totalQuizzes = 0;
                let totalDurationMinutes = 0;

                for (const module of modulesData || []) {
                    // Fetch PUBLISHED content items for this module
                    const { data: contentItems, error: contentError } = await supabase
                        .from('module_content_items')
                        .select('id, content_type, content_id, position, is_published')
                        .eq('module_id', module.id)
                        .eq('is_published', true)
                        .order('position', { ascending: true });

                    if (contentError) throw contentError;

                    const items: ContentItem[] = [];

                    for (const item of contentItems || []) {
                        if (item.content_type === 'lesson') {
                            // Fetch PUBLISHED lesson details
                            const { data: lesson, error: lessonError } = await supabase
                                .from('lessons')
                                .select('id, title, description, estimated_duration_minutes, is_published')
                                .eq('id', item.content_id)
                                .eq('is_published', true)
                                .single();

                            if (!lessonError && lesson) {
                                items.push({
                                    ...lesson,
                                    type: 'lesson' as const,
                                });
                                totalLessons++;
                                totalDurationMinutes += lesson.estimated_duration_minutes || 0;
                            }
                        } else if (item.content_type === 'quiz') {
                            // Fetch PUBLISHED quiz details
                            const { data: quiz, error: quizError } = await supabase
                                .from('quizzes')
                                .select('id, title, description, passing_score, time_limit_minutes, is_published')
                                .eq('id', item.content_id)
                                .eq('is_published', true)
                                .single();

                            if (!quizError && quiz) {
                                items.push({
                                    ...quiz,
                                    type: 'quiz' as const,
                                });
                                totalQuizzes++;
                                totalDurationMinutes += quiz.time_limit_minutes || 0;
                            }
                        }
                    }

                    modulesWithContent.push({
                        ...module,
                        items,
                    });
                }

                setData({
                    course: courseData,
                    modules: modulesWithContent,
                    totalLessons,
                    totalQuizzes,
                    totalDurationMinutes,
                });
            } catch (err) {
                console.error('Error fetching course curriculum:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch curriculum');
            } finally {
                setLoading(false);
            }
        };

        fetchCurriculum();
    }, [courseId]);

    return { ...data, loading, error };
};
