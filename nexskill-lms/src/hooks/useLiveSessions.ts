import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { LiveSession } from '../types/db';
import { useAuth } from '../context/AuthContext';

export const useLiveSessions = (courseId?: string) => {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<LiveSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSessions = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            setError(null);

            let targetCourseIds: string[] = [];

            if (courseId) {
                // If courseId is provided, filter by it directly (Coach view)
                targetCourseIds = [courseId];
            } else {
                // 1. Get enrolled course IDs (Student view dashboard)
                const { data: enrollments, error: enrollmentError } = await supabase
                    .from('enrollments')
                    .select('course_id')
                    .eq('profile_id', user.id);

                if (enrollmentError) throw enrollmentError;

                targetCourseIds = enrollments.map(e => e.course_id);
            }

            // If no courses to check, return empty
            if (targetCourseIds.length === 0) {
                setSessions([]);
                return;
            }

            // 2. Fetch live sessions for these courses
            const { data, error: sessionError } = await supabase
                .from('live_sessions')
                .select(`
                    *,
                    courses!live_sessions_course_id_fkey (
                        title,
                        category:categories(name)
                    ),
                    coach:profiles!live_sessions_coach_id_fkey (
                        first_name,
                        last_name,
                        username
                    )
                `)
                .in('course_id', targetCourseIds)
                .order('scheduled_at', { ascending: true });

            if (sessionError) {
                console.error('Supabase session fetch error:', sessionError);
                throw sessionError;
            }

            // 3. Sanitize data (hide link if not live)
            const sanitizedData = data.map((session: any) => {
                const showLink = session.is_live || session.status === 'in_progress' || session.status === 'live';
                return {
                    ...session,
                    meeting_link: showLink ? session.meeting_link : undefined
                };
            });

            setSessions(sanitizedData as LiveSession[]);
        } catch (err: any) {
            console.error('Error fetching live sessions:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user, courseId]);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    const createSession = async (sessionData: Partial<LiveSession>) => {
        try {
            const { error: createError } = await supabase
                .from('live_sessions')
                .insert([sessionData]);

            if (createError) throw createError;
            await fetchSessions();
        } catch (err: any) {
            console.error('Error creating session:', err);
            throw err;
        }
    };

    const updateSession = async (sessionId: string, updates: Partial<LiveSession>) => {
        try {
            const { error: updateError } = await supabase
                .from('live_sessions')
                .update(updates)
                .eq('id', sessionId);

            if (updateError) throw updateError;
            await fetchSessions();
        } catch (err: any) {
            console.error('Error updating session:', err);
            throw err;
        }
    };

    const deleteSession = async (sessionId: string) => {
        try {
            const { error: deleteError } = await supabase
                .from('live_sessions')
                .delete()
                .eq('id', sessionId);

            if (deleteError) throw deleteError;
            await fetchSessions();
        } catch (err: any) {
            console.error('Error deleting session:', err);
            throw err;
        }
    };

    const upcomingSessions = sessions.filter(s =>
        (s.status === 'scheduled' || s.status === 'in_progress' || s.status === 'live') &&
        !s.recording_url
    ).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

    const completedSessions = sessions.filter(s =>
        s.status === 'completed' || s.status === 'cancelled'
    ).sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

    const recordedSessions = sessions.filter(s =>
        s.recording_url && s.recording_url.length > 0
    ).sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

    return {
        sessions,
        upcomingSessions,
        completedSessions,
        recordedSessions,
        loading,
        error,
        refresh: fetchSessions,
        createSession,
        updateSession,
        deleteSession
    };
};

export const useLiveSession = (sessionId?: string) => {
    const { user } = useAuth();
    const [session, setSession] = useState<LiveSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSession = async () => {
            if (!user || !sessionId) return;
            try {
                setLoading(true);
                // Fetch specific session
                const { data, error: sessionError } = await supabase
                    .from('live_sessions')
                    .select(`
                    *,
                    courses!live_sessions_course_id_fkey (
                        title,
                        category:categories(name)
                    ),
                    coach:profiles!live_sessions_coach_id_fkey (
                        first_name,
                        last_name,
                        username
                    )
                `)
                    .eq('id', sessionId)
                    .single();

                if (sessionError) throw sessionError;

                // Sanitize
                const showLink = data.is_live || data.status === 'in_progress' || data.status === 'live';
                const sanitized = {
                    ...data,
                    meeting_link: showLink ? data.meeting_link : undefined
                };

                setSession(sanitized as LiveSession);
            } catch (err: any) {
                console.error('Error fetching live session:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSession();
    }, [user, sessionId]);

    return { session, loading, error };
};
