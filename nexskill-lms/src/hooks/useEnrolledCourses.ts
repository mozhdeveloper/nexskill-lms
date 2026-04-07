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

            // Step 1: Fetch enrollments
            const { data: enrollments, error: enrollError } = await supabase
                .from('enrollments')
                .select('course_id, enrolled_at')
                .eq('profile_id', user.id)
                .order('enrolled_at', { ascending: false });

            if (enrollError) throw enrollError;
            if (!enrollments || enrollments.length === 0) {
                setCourses([]);
                setLoading(false);
                return;
            }

            // Step 2: Fetch course details
            const courseIds = enrollments.map(e => e.course_id);
            const { data: coursesData, error: coursesError } = await supabase
                .from('courses')
                .select('*')
                .in('id', courseIds);

            if (coursesError) throw coursesError;

            // Step 3: Fetch coach profiles
            const coachIds = [...new Set(coursesData?.map(c => c.coach_id).filter(Boolean) || [])];
            let profilesMap: Record<string, string> = {};
            if (coachIds.length > 0) {
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, first_name, last_name')
                    .in('id', coachIds);
                
                if (profilesData) {
                    profilesMap = profilesData.reduce((acc, p: any) => {
                        acc[p.id] = `${p.first_name || ''} ${p.last_name || ''}`.trim();
                        return acc;
                    }, {} as Record<string, string>);
                }
            }

            // Step 4: Fetch reviews and enrollment counts for all courses
            const reviewPromises = courseIds.map(async (courseId) => {
                const { data: reviews } = await supabase
                    .from('reviews')
                    .select('rating')
                    .eq('course_id', courseId);
                
                const { count: enrollCount } = await supabase
                    .from('enrollments')
                    .select('*', { count: 'exact', head: true })
                    .eq('course_id', courseId);

                const avgRating = reviews && reviews.length > 0
                    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
                    : 0;

                return {
                    courseId,
                    reviewCount: reviews?.length || 0,
                    rating: avgRating,
                    studentsCount: enrollCount || 0
                };
            });

            const reviewResults = await Promise.all(reviewPromises);
            const reviewsMap = reviewResults.reduce((acc, r) => {
                acc[r.courseId] = { reviewCount: r.reviewCount, rating: r.rating, studentsCount: r.studentsCount };
                return acc;
            }, {} as Record<string, { reviewCount: number; rating: number; studentsCount: number }>);

            // Step 5: Combine all data
            const enrolledCourses = (coursesData || []).map((course: any) => ({
                ...course,
                enrolled_at: enrollments.find(e => e.course_id === course.id)?.enrolled_at,
                reviewCount: reviewsMap[course.id]?.reviewCount || 0,
                rating: reviewsMap[course.id]?.rating || 0,
                studentsCount: reviewsMap[course.id]?.studentsCount || 0,
                instructor_name: profilesMap[course.coach_id] || 'Unknown Instructor',
            }));

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