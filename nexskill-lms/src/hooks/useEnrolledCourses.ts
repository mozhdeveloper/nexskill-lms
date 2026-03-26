import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import type { Course } from '../types/db';

export interface EnrolledCourse extends Course {
  reviewCount?: number;
  rating?: number;
  studentsCount?: number;
}

export const useEnrolledCourses = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<EnrolledCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEnrolledCourses = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            setError(null);

            // 1. Fetch enrollments with course details
            const { data, error } = await supabase
                .from('enrollments')
                .select(`
                    enrolled_at,
                    course:courses (
                        *,
                        category:categories(name),
                        coach:profiles!courses_coach_id_fkey (
                            first_name,
                            last_name
                        )
                    )
                `)
                .eq('profile_id', user.id)
                .order('enrolled_at', { ascending: false });

            if (error) throw error;

            // 2. Fetch review counts, ratings, and student counts for all enrolled courses
            const enrolledCourses = await Promise.all(
                (data || []).map(async (item: any) => {
                    const course = item.course;
                    
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

                    // Fetch total enrollment count
                    const { count: enrollmentCount } = await supabase
                        .from('enrollments')
                        .select('*', { count: 'exact', head: true })
                        .eq('course_id', course.id);

                    return {
                        ...course,
                        enrolled_at: item.enrolled_at,
                        reviewCount: reviewCount || 0,
                        rating: avgRating,
                        studentsCount: enrollmentCount || 0,
                    };
                })
            );

            setCourses(enrolledCourses as unknown as EnrolledCourse[]);
        } catch (err: any) {
            console.error('Error fetching enrolled courses:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchEnrolledCourses();
    }, [fetchEnrolledCourses]);

    return { courses, loading, error, refresh: fetchEnrolledCourses };
};
