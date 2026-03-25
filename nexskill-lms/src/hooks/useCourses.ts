import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Course } from '../types/db';

export const useCourses = () => {
    const [courses, setCourses] = useState<Course[]>([]);
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
            .eq('verification_status', 'approved'); // ← ADD THIS

        if (error) throw error;
        setCourses(data as unknown as Course[]);
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
            .eq('visibility', 'public')           // ← ENSURE THIS IS PRESENT
            .eq('verification_status', 'approved') // ← ADD THIS
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
