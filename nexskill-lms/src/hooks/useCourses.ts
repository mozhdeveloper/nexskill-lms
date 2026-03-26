import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Course } from '../types/db';

export interface CourseWithReviews extends Course {
  reviewCount?: number;
  rating?: number;
  studentsCount?: number;
}

export const useCourses = () => {
    const [courses, setCourses] = useState<CourseWithReviews[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
    try {
        setLoading(true);
        const { data, error } = await supabase
            .from('courses')
            .select(`
                *,
                category:categories(name)
            `)
            .eq('visibility', 'public')
            .eq('verification_status', 'approved');

        if (error) throw error;

        // Fetch review counts and enrollment counts for all courses
        const coursesWithReviews = await Promise.all(
            (data || []).map(async (course: any) => {
                // Fetch review count and rating
                const { count: reviewCount } = await supabase
                    .from('reviews')
                    .select('*', { count: 'exact', head: true })
                    .eq('course_id', course.id);

                const { data: reviewsData } = await supabase
                    .from('reviews')
                    .select('rating')
                    .eq('course_id', course.id);

                const avgRating = reviewsData && reviewsData.length > 0
                    ? Math.round((reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length) * 10) / 10
                    : 0;

                // Fetch enrollment count
                const { count: enrollmentCount } = await supabase
                    .from('enrollments')
                    .select('*', { count: 'exact', head: true })
                    .eq('course_id', course.id);

                return {
                    ...course,
                    reviewCount: reviewCount || 0,
                    rating: avgRating,
                    studentsCount: enrollmentCount || 0,
                };
            })
        );

        setCourses(coursesWithReviews as unknown as CourseWithReviews[]);
    } catch (err: any) {
        console.error('Error fetching courses:', err);
        setError(err.message);
    } finally {
        setLoading(false);
    }
};

    return { courses, loading, error, refetch: fetchCourses };
};

export const useCourse = (courseId: string | undefined) => {
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!courseId) return;
        fetchCourse();
    }, [courseId]);

    const fetchCourse = async () => {
    if (!courseId) return;

    try {
        setLoading(true);

        const { data, error } = await supabase
            .from('courses')
            .select(`
                *,
                modules (
                    *,
                    module_content_items (*)
                )
            `)
            .eq('id', courseId)
            .eq('visibility', 'public')
            .eq('verification_status', 'approved')
            .single();

        if (error) throw error;

        // Sort modules by position
        if (data && data.modules) {
            data.modules.sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
            data.modules.forEach((mod: any) => {
                if (mod.module_content_items) {
                    mod.module_content_items.sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
                }
            });
        }

        setCourse(data as unknown as Course);
    } catch (err: any) {
        console.error('Error fetching course:', err);
        setError(err.message);
    } finally {
        setLoading(false);
    }
};

    return { course, loading, error };
};
