import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import type { Course } from '../types/db';

export interface EnrolledCourse extends Course {
  reviewCount?: number;
  rating?: number;
  studentsCount?: number;
  totalDurationSeconds?: number;
  formattedDuration?: string;
}

// ─── YouTube / Duration Helpers ───────────────────────────────────────────────

const parseISODuration = (iso: string): number => {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (
    parseInt(m[1] || "0", 10) * 3600 +
    parseInt(m[2] || "0", 10) * 60 +
    parseInt(m[3] || "0", 10)
  );
};

const extractYouTubeId = (url: string): string | null =>
  url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  )?.[1] ?? null;

const formatTotalDuration = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return "0h";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

const fetchYouTubeDurations = async (
  videoIds: string[]
): Promise<Map<string, number>> => {
  const result = new Map<string, number>();
  if (videoIds.length === 0) return result;

  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn("[useEnrolledCourses] VITE_YOUTUBE_API_KEY not set — skipping YouTube duration fetch");
    return result;
  }

  try {
    const chunks: string[][] = [];
    for (let i = 0; i < videoIds.length; i += 50)
      chunks.push(videoIds.slice(i, i + 50));

    for (const chunk of chunks) {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${chunk.join(",")}&key=${apiKey}`
      );
      if (!res.ok) continue;
      const data = await res.json();
      for (const item of data.items ?? [])
        result.set(item.id, parseISODuration(item.contentDetails.duration));
    }
  } catch (err) {
    console.error("[useEnrolledCourses] YouTube duration fetch error:", err);
  }
  return result;
};

const resolveVideoDurations = async (
  lessonIds: string[]
): Promise<{ durationMap: Map<string, number>; totalSeconds: number }> => {
  if (lessonIds.length === 0)
    return { durationMap: new Map(), totalSeconds: 0 };

  // 1. Fetch lesson rows with content_blocks + estimated duration
  const { data: lessonsData } = await supabase
    .from("lessons")
    .select("id, content_blocks, estimated_duration_minutes")
    .in("id", lessonIds);

  // 2. Fetch watch-progress durations as fallback
  const { data: watchData } = await supabase
    .from("lesson_video_progress")
    .select("lesson_id, duration_seconds")
    .in("lesson_id", lessonIds);

  const watchedMap = new Map<string, number>();
  (watchData ?? []).forEach((v: any) => {
    if (v.duration_seconds > 0 && !watchedMap.has(v.lesson_id))
      watchedMap.set(v.lesson_id, v.duration_seconds);
  });

  // 3. Parse stored metadata and collect YouTube IDs that need API fetch
  const storedMap = new Map<string, number>();
  const estimatedMap = new Map<string, number>();
  const ytIdsToFetch: string[] = [];
  const lessonForYtId = new Map<string, string>(); // ytId → lessonId

  (lessonsData ?? []).forEach((l: any) => {
    if (l.estimated_duration_minutes)
      estimatedMap.set(l.id, l.estimated_duration_minutes * 60);

    if (!Array.isArray(l.content_blocks)) return;
    const videoBlock = l.content_blocks.find(
      (b: any) => b.type === "video" || b.block_type === "video"
    );
    if (!videoBlock) return;

    const metaDuration =
      videoBlock.attributes?.media_metadata?.duration ??
      videoBlock.attributes?.duration ??
      null;

    if (typeof metaDuration === "number" && metaDuration > 0) {
      storedMap.set(l.id, metaDuration);
      return;
    }

    const url: string = videoBlock.content ?? videoBlock.url ?? "";
    const ytId = extractYouTubeId(url);
    if (ytId) {
      ytIdsToFetch.push(ytId);
      lessonForYtId.set(ytId, l.id);
    }
  });

  // 4. Batch-fetch missing YouTube durations
  const ytDurations = await fetchYouTubeDurations([...new Set(ytIdsToFetch)]);
  const ytLessonMap = new Map<string, number>();
  lessonForYtId.forEach((lessonId, ytId) => {
    const secs = ytDurations.get(ytId);
    if (secs) ytLessonMap.set(lessonId, secs);
  });

  // 5. Build final map: YouTube > stored metadata > watch progress > estimated
  const durationMap = new Map<string, number>();
  lessonIds.forEach((id) => {
    durationMap.set(
      id,
      ytLessonMap.get(id) ??
        storedMap.get(id) ??
        watchedMap.get(id) ??
        estimatedMap.get(id) ??
        0
    );
  });

  const totalSeconds = [...durationMap.values()].reduce((a, b) => a + b, 0);
  return { durationMap, totalSeconds };
};

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

            // 2. Fetch review counts, ratings, student counts, AND total durations for all enrolled courses
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

                    // Fetch total duration for the course
                    let totalDurationSeconds = 0;
                    
                    // Get all modules for this course
                    const { data: modulesData } = await supabase
                        .from('modules')
                        .select('id')
                        .eq('course_id', course.id)
                        .eq('is_published', true);

                    if (modulesData && modulesData.length > 0) {
                        const moduleIds = modulesData.map(m => m.id);
                        
                        // Get content items for these modules
                        const { data: itemsData } = await supabase
                            .from('module_content_items')
                            .select('content_type, content_id')
                            .in('module_id', moduleIds)
                            .eq('is_published', true);

                        const lessonIds = (itemsData || [])
                            .filter(i => i.content_type === 'lesson')
                            .map(i => i.content_id);

                        if (lessonIds.length > 0) {
                            const { totalSeconds } = await resolveVideoDurations(lessonIds);
                            totalDurationSeconds = totalSeconds;
                        }
                    }

                    const formattedDuration = formatTotalDuration(totalDurationSeconds);

                    return {
                        ...course,
                        enrolled_at: item.enrolled_at,
                        reviewCount: reviewCount || 0,
                        rating: avgRating,
                        studentsCount: enrollmentCount || 0,
                        totalDurationSeconds,
                        formattedDuration,
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