import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { AdminVerificationFeedback, CourseVerificationStatus } from '../types/db';

interface ModuleContentItem {
    id: string;
    module_id: string;
    content_type: 'lesson' | 'quiz';
    content_id: string;
    position: number;
    lesson_id: string | null;
    lesson_title: string | null;
    lesson_description: string | null;
    content_blocks: any[];
    estimated_duration_minutes: number | null;
    quiz_id: string | null;
    quiz_title: string | null;
}

interface ModuleWithContent {
    id: string;
    title: string;
    description: string | null;
    position: number;
    content_items: ModuleContentItem[];
}

interface CourseWithDetails {
    id: string;
    title: string;
    subtitle: string | null;
    short_description: string | null;
    long_description: string | null;
    level: string | null;
    language: string | null;
    duration_hours: number;
    price: number;
    verification_status: CourseVerificationStatus;
    created_at: string;
    updated_at: string;
    coach_id: string | null;
    coach?: {
        first_name: string | null;
        last_name: string | null;
        email: string | null;
    };
    category?: {
        name: string;
    };
    modules: ModuleWithContent[];
}

interface UseCourseVerificationReturn {
    course: CourseWithDetails | null;
    feedback: AdminVerificationFeedback[];
    loading: boolean;
    error: string | null;
    addFeedback: (lessonId: string | null, content: string) => Promise<void>;
    resolveFeedback: (feedbackId: string) => Promise<void>;
    updateVerificationStatus: (status: CourseVerificationStatus, feedback?: string) => Promise<void>;
    refetch: () => Promise<void>;
}

export const useCourseVerification = (courseId: string | undefined): UseCourseVerificationReturn => {
    const [course, setCourse] = useState<CourseWithDetails | null>(null);
    const [feedback, setFeedback] = useState<AdminVerificationFeedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCourseDetails = useCallback(async () => {
        if (!courseId) return;

        try {
            setLoading(true);
            setError(null);

            // Fetch course with coach and category
            const { data: courseData, error: courseError } = await supabase
                .from('courses')
                .select(`
          *,
          coach:profiles!courses_coach_id_fkey(first_name, last_name, email),
          category:categories(name)
        `)
                .eq('id', courseId)
                .single();

            if (courseError) throw courseError;

            // Fetch modules with their content
            const { data: modulesData, error: modulesError } = await supabase
                .from('modules')
                .select('id, title, description, position')
                .eq('course_id', courseId)
                .order('position', { ascending: true });

            if (modulesError) throw modulesError;

            // Fetch lessons for all modules
            const moduleIds = modulesData?.map(m => m.id) || [];
            let contentItems: ModuleContentItem[] = [];

            if (moduleIds.length > 0) {
                // Fetch content items linking modules to lessons/quizzes
                const { data: mciData, error: mciError } = await supabase
                    .from('module_content_items')
                    .select('id, module_id, content_type, content_id, position, is_published')
                    .in('module_id', moduleIds)
                    .order('position', { ascending: true });

                if (mciError) throw mciError;

                // Fetch lesson details for lesson-type items
                const lessonIds = (mciData || []).filter(i => i.content_type === 'lesson').map(i => i.content_id);
                let lessonsMap: Record<string, any> = {};
                if (lessonIds.length > 0) {
                    const { data: lessonsData } = await supabase
                        .from('lessons')
                        .select('id, title, description, estimated_duration_minutes')
                        .in('id', lessonIds);
                    for (const l of lessonsData || []) lessonsMap[l.id] = l;
                }

                // Fetch quiz details for quiz-type items
                const quizIds = (mciData || []).filter(i => i.content_type === 'quiz').map(i => i.content_id);
                let quizzesMap: Record<string, any> = {};
                if (quizIds.length > 0) {
                    const { data: quizzesData } = await supabase
                        .from('quizzes')
                        .select('id, title, description')
                        .in('id', quizIds);
                    for (const q of quizzesData || []) quizzesMap[q.id] = q;
                }

                // Map to content items format
                contentItems = (mciData || []).map((item: any) => {
                    const lesson = item.content_type === 'lesson' ? lessonsMap[item.content_id] : null;
                    const quiz = item.content_type === 'quiz' ? quizzesMap[item.content_id] : null;
                    return {
                        id: item.id,
                        module_id: item.module_id,
                        content_type: item.content_type,
                        content_id: item.content_id,
                        position: item.position || 0,
                        lesson_id: lesson?.id || null,
                        lesson_title: lesson?.title || null,
                        lesson_description: lesson?.description || '',
                        content_blocks: [],
                        estimated_duration_minutes: lesson?.estimated_duration_minutes || 0,
                        quiz_id: quiz?.id || null,
                        quiz_title: quiz?.title || null,
                    };
                });
            }

            // Group content by module
            const modulesWithContent: ModuleWithContent[] = (modulesData || []).map(module => ({
                ...module,
                content_items: contentItems.filter(item => item.module_id === module.id)
            }));

            // Fetch feedback for this course
            const { data: feedbackData, error: feedbackError } = await supabase
                .from('admin_verification_feedback')
                .select(`
          *,
          admin:profiles!feedback_admin_fkey(first_name, last_name)
        `)
                .eq('course_id', courseId)
                .order('created_at', { ascending: false });

            if (feedbackError) throw feedbackError;

            setCourse({
                ...courseData,
                modules: modulesWithContent
            });
            setFeedback(feedbackData || []);

        } catch (err) {
            console.error('Error fetching course verification data:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch course data');
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        fetchCourseDetails();
    }, [fetchCourseDetails]);

    const addFeedback = async (lessonId: string | null, content: string) => {
        if (!courseId) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error: insertError } = await supabase
                .from('admin_verification_feedback')
                .insert({
                    course_id: courseId,
                    lesson_id: lessonId,
                    admin_id: user.id,
                    content,
                    is_resolved: false
                });

            if (insertError) throw insertError;
            await fetchCourseDetails();
        } catch (err) {
            console.error('Error adding feedback:', err);
            throw err;
        }
    };

    const resolveFeedback = async (feedbackId: string) => {
        try {
            const { error: updateError } = await supabase
                .from('admin_verification_feedback')
                .update({ is_resolved: true })
                .eq('id', feedbackId);

            if (updateError) throw updateError;
            await fetchCourseDetails();
        } catch (err) {
            console.error('Error resolving feedback:', err);
            throw err;
        }
    };

    const updateVerificationStatus = async (status: CourseVerificationStatus, _feedback?: string) => {
        if (!courseId) return;

        try {
            const updates: any = { verification_status: status };
            // admin_feedback column does not exist on courses table, so we don't update it.
            // Feedback is stored in admin_verification_feedback table via addFeedback.

            const { error: updateError } = await supabase
                .from('courses')
                .update(updates)
                .eq('id', courseId);

            if (updateError) throw updateError;
            await fetchCourseDetails();
        } catch (err) {
            console.error('Error updating verification status:', err);
            throw err;
        }
    };

    return {
        course,
        feedback,
        loading,
        error,
        addFeedback,
        resolveFeedback,
        updateVerificationStatus,
        refetch: fetchCourseDetails
    };
};
