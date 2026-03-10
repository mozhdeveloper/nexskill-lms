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

// Note: useCourse (single course detail) is in hooks/useCourse.ts — do not import from here.
