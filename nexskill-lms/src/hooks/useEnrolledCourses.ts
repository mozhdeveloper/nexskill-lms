import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import type { Course } from '../types/db';

export const useEnrolledCourses = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
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

            // 2. Transform to Course[]
            const enrolledCourses = data.map((item: any) => ({
                ...item.course,
                enrolled_at: item.enrolled_at
            }));

            setCourses(enrolledCourses as unknown as Course[]);
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
