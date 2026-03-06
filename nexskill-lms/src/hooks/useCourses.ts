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
            // Fetch courses with related category information if possible
            // Note: we might need to adjust the query based on exact foreign key names
            // For now, simple fetch
            const { data, error } = await supabase
                .from('courses')
                .select(`
          *,
          category:categories(name)
        `)
                .eq('visibility', 'public');

            if (error) throw error;

            // Transform data if necessary, or just set it
            // Supabase returns nested data for joined tables.
            // We might want to map it to our Course interface slightly if structure differs.
            // For now, assuming strict match or tolerant UI.

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

            // Fetch course with modules and lessons
            // Assuming 'modules' table has foreign key 'course_id'
            // and 'lessons' table has foreign key 'module_id'

            const { data, error } = await supabase
                .from('courses')
                .select(`
          *,
          modules (
            *,
            lessons (*)
          )
        `)
                .eq('id', courseId)
                .single();

            if (error) throw error;

            // Sort modules and lessons by order_index if available
            if (data && data.modules) {
                data.modules.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
                data.modules.forEach((mod: any) => {
                    if (mod.lessons) {
                        mod.lessons.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
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
