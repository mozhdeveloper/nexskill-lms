import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

interface Lesson {
  id: string;
  title: string;
  duration?: string;
  type: "lesson" | "quiz";
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Review {
  id: string;
  userName: string;
  avatar?: string;
  date: string;
  rating: number;
  comment: string;
}

interface Coach {
  id: string;
  name: string;
  avatar?: string;
  bio: string;
  jobTitle?: string;
  experienceLevel?: string;
  contentAreas?: string[];
  tools?: string[];
  linkedinUrl?: string;
  portfolioUrl?: string;
  studentsCount: number;
  coursesCount: number;
  rating: number;
  ratingIsHardcoded?: boolean;
}

export interface CourseDisplay {
  id: string;
  title: string;
  category: string;
  level: string;
  rating: number;
  reviewCount: number;
  studentsCount: number;
  duration: string;
  totalDurationSeconds: number; // ← real computed total
  price: number;
  originalPrice?: number;
  description: string;
  whatYouLearn?: string[];
  tools?: string[];
  includes?: string[];
  curriculum?: Module[];
  reviews?: Review[];
  coach?: Coach | null;
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

const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

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
    console.warn("[useCourse] VITE_YOUTUBE_API_KEY not set — skipping YouTube duration fetch");
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
    console.error("[useCourse] YouTube duration fetch error:", err);
  }
  return result;
};

/**
 * Given a list of lesson IDs already fetched from DB, resolves each lesson's
 * real video duration using the same 4-step priority chain as LessonSidebar:
 *   1. YouTube API (freshest)
 *   2. content_blocks metadata (Cloudinary / previously-saved YouTube)
 *   3. lesson_video_progress watch-progress table
 *   4. estimated_duration_minutes fallback
 *
 * Returns a Map<lessonId, seconds> and the formatted per-lesson duration string.
 */
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useCourse = (courseId: string | undefined) => {
  const [course, setCourse] = useState<CourseDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;

    const fetchCourse = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Course basic details
        const { data: courseData, error: fetchError } = await supabase
          .from("courses")
          .select("*")
          .eq("id", courseId)
          .single();

        if (fetchError) throw new Error(`Supabase: ${fetchError.message} (Code: ${fetchError.code})`);

        if (!courseData) return;

        console.log("[useCourse] Course data loaded:", courseData.id, courseData.title);

        // 2. Modules (debug: log all, then filter published)
        const { data: allModulesData } = await supabase
          .from("modules")
          .select("id, title, position, is_published, course_id")
          .eq("course_id", courseId)
          .order("position", { ascending: true });
        console.log("[useCourse] All modules (including unpublished):", allModulesData);

        const { data: modulesData } = await supabase
          .from("modules")
          .select("id, title, position")
          .eq("course_id", courseId)
          .eq("is_published", true)
          .order("position", { ascending: true });
        console.log("[useCourse] Published modules only:", modulesData);

        let curriculum: Module[] = [];
        let totalDurationSeconds = 0;

        if (modulesData && modulesData.length > 0) {
          const moduleIds = modulesData.map((m) => m.id);

          console.log("[useCourse] Fetching module_content_items for modules:", moduleIds);

          const { data: itemsData, error: itemsError } = await supabase
            .from("module_content_items")
            .select("module_id, content_id, content_type, position")
            .in("module_id", moduleIds)
            .eq("is_published", true)
            .order("position", { ascending: true });

          console.log("[useCourse] module_content_items result:", { itemsData, itemsError });

          if (itemsError) {
            console.error("[useCourse] Error fetching content items:", itemsError);
          }

          if (itemsData && itemsData.length > 0) {
            const lessonIds = itemsData
              .filter((i) => i.content_type === "lesson")
              .map((i) => i.content_id);
            const quizIds = itemsData
              .filter((i) => i.content_type === "quiz")
              .map((i) => i.content_id);

            console.log("[useCourse] Lesson IDs to fetch:", lessonIds);
            console.log("[useCourse] Quiz IDs to fetch:", quizIds);

            // Fetch lesson/quiz details AND resolve video durations in parallel
            const [lessonsRes, quizzesRes, { durationMap, totalSeconds }] =
              await Promise.all([
                supabase
                  .from("lessons")
                  .select("id, title, estimated_duration_minutes")
                  .in("id", lessonIds),
                supabase
                  .from("quizzes")
                  .select("id, title, time_limit_minutes")
                  .in("id", quizIds),
                resolveVideoDurations(lessonIds),
              ]);

            totalDurationSeconds = totalSeconds;

            console.log("[useCourse] Lessons fetched:", lessonsRes.data?.length || 0);
            console.log("[useCourse] Quizzes fetched:", quizzesRes.data?.length || 0);

            const lessonsMap = new Map(
              (lessonsRes.data ?? []).map((l: any) => [l.id, l])
            );
            const quizzesMap = new Map(
              (quizzesRes.data ?? []).map((q: any) => [q.id, q])
            );

            curriculum = modulesData.map((module) => {
              const moduleItems = itemsData.filter(
                (i) => i.module_id === module.id
              );
              const lessons: Lesson[] = moduleItems
                .map((item) => {
                  if (item.content_type === "lesson") {
                    const l = lessonsMap.get(item.content_id);
                    if (!l) {
                      console.warn("[useCourse] Lesson not found for ID:", item.content_id);
                      return null;
                    }
                    // Use resolved video duration; fall back to estimated
                    const secs = durationMap.get(l.id) ?? 0;
                    const duration =
                      secs > 0
                        ? formatDuration(secs)
                        : `${l.estimated_duration_minutes || 15}m`;
                    return {
                      id: l.id,
                      title: l.title,
                      duration,
                      type: "lesson" as const,
                    };
                  }
                  if (item.content_type === "quiz") {
                    const q = quizzesMap.get(item.content_id);
                    if (!q) {
                      console.warn("[useCourse] Quiz not found for ID:", item.content_id);
                      return null;
                    }
                    return {
                      id: q.id,
                      title: q.title,
                      duration: `${q.time_limit_minutes || 30}m`,
                      type: "quiz" as const,
                    };
                  }
                  return null;
                })
                .filter(Boolean) as Lesson[];

              console.log(`[useCourse] Module "${module.title}" has ${lessons.length} lessons`);
              return { id: module.id, title: module.title, lessons };
            });

            const totalLessons = curriculum.reduce((sum, m) => sum + m.lessons.length, 0);
            console.log("[useCourse] Total curriculum built:", { modules: curriculum.length, totalLessons });
          } else {
            console.warn("[useCourse] No module_content_items found - creating empty modules");
            curriculum = modulesData.map((m) => ({
              id: m.id,
              title: m.title,
              lessons: [],
            }));
          }
        } else {
          console.warn("[useCourse] No published modules found for course:", courseId);
        }

        // 3. Coach details
        let coachDetails: Coach | null = null;
        console.log("[useCourse] Course coach_id:", courseData.coach_id);

        if (courseData.coach_id) {
          const { data: coachProfile, error: profileError } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, email, role")
            .eq("id", courseData.coach_id)
            .single();
          console.log("[useCourse] Coach profile:", coachProfile, "Error:", profileError);

          if (coachProfile) {
            const { data: coachProfileExt, error: coachExtError } = await supabase
              .from("coach_profiles")
              .select("*")
              .eq("id", courseData.coach_id)
              .maybeSingle();
            console.log("[useCourse] Coach extended profile:", coachProfileExt, "Error:", coachExtError);

            const { count: coursesCount } = await supabase
              .from("courses")
              .select("*", { count: "exact", head: true })
              .eq("coach_id", courseData.coach_id);

            const { data: coachCourses } = await supabase
              .from("courses")
              .select("id")
              .eq("coach_id", courseData.coach_id);

            let studentsCount = 0;
            let coachRating = 0;

            if (coachCourses && coachCourses.length > 0) {
              const courseIds = coachCourses.map((c) => c.id);

              const [{ count: enrollmentCount }, { data: reviewData }] =
                await Promise.all([
                  supabase
                    .from("enrollments")
                    .select("*", { count: "exact", head: true })
                    .in("course_id", courseIds),
                  supabase
                    .from("reviews")
                    .select("rating")
                    .in("course_id", courseIds),
                ]);

              studentsCount = enrollmentCount || 0;

              if (reviewData && reviewData.length > 0) {
                const sum = reviewData.reduce(
                  (acc: number, r: any) => acc + r.rating,
                  0
                );
                coachRating =
                  Math.round((sum / reviewData.length) * 10) / 10;
              }
            }

            coachDetails = {
              id: coachProfile.id,
              name:
                `${coachProfile.first_name || ""} ${coachProfile.last_name || ""}`.trim() ||
                coachProfile.email ||
                "Instructor",
              avatar: undefined,
              bio: coachProfileExt?.bio || "Expert Instructor",
              jobTitle: coachProfileExt?.job_title || undefined,
              experienceLevel: coachProfileExt?.experience_level || undefined,
              contentAreas: coachProfileExt?.content_areas || [],
              tools: coachProfileExt?.tools || [],
              linkedinUrl: coachProfileExt?.linkedin_url || undefined,
              portfolioUrl: coachProfileExt?.portfolio_url || undefined,
              studentsCount,
              coursesCount: coursesCount || 0,
              rating: coachRating,
            };
          } else {
            console.warn("[useCourse] Coach profile not found for ID:", courseData.coach_id);
          }
        } else {
          console.log("[useCourse] Course has no coach_id assigned");
        }

        // 3b. Category name
        let categoryName = "General";
        if (courseData.category_id) {
          const { data: categoryData } = await supabase
            .from("categories")
            .select("name")
            .eq("id", courseData.category_id)
            .single();
          if (categoryData) categoryName = categoryData.name;
        }

        // 4. Reviews
        const { data: reviewsData } = await supabase
          .from("reviews")
          .select(`id, rating, comment, created_at, profile:profiles(first_name, last_name)`)
          .eq("course_id", courseId)
          .order("created_at", { ascending: false })
          .limit(10);

        const reviews: Review[] = (reviewsData ?? []).map((r: any) => ({
          id: r.id.toString(),
          userName: `${r.profile?.first_name || "Student"} ${r.profile?.last_name || ""}`,
          date: new Date(r.created_at).toLocaleDateString(),
          rating: r.rating,
          comment: r.comment,
        }));

        const avgRating =
          reviews.length > 0
            ? Math.round(
                (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10
              ) / 10
            : 0;

        const { count: enrolledCount } = await supabase
          .from("enrollments")
          .select("*", { count: "exact", head: true })
          .eq("course_id", courseId);

        // 5. Learning objectives
        let whatYouLearn: string[] = [];
        const { data: objectiveLinks } = await supabase
          .from("course_learning_objectives")
          .select("objective_id")
          .eq("course_id", courseId);
        if (objectiveLinks && objectiveLinks.length > 0) {
          const objIds = objectiveLinks.map((o: any) => o.objective_id);
          const { data: objectives } = await supabase
            .from("learning_objectives")
            .select("objective_text")
            .in("id", objIds);
          whatYouLearn = (objectives ?? []).map((o: any) => o.objective_text);
        }

        // 6. Tools / topics
        let courseTools: string[] = [];
        const { data: topicLinks } = await supabase
          .from("course_topics")
          .select("topic_id")
          .eq("course_id", courseId);
        if (topicLinks && topicLinks.length > 0) {
          const topicIds = topicLinks.map((t: any) => t.topic_id);
          const { data: topics } = await supabase
            .from("topics")
            .select("name")
            .in("id", topicIds);
          courseTools = (topics ?? []).map((t: any) => t.name);
        }

        // 7. Inclusions
        let courseIncludes: string[] = [];
        const { data: inclusionLinks } = await supabase
          .from("course_inclusions")
          .select("inclusion_id")
          .eq("course_id", courseId);
        if (inclusionLinks && inclusionLinks.length > 0) {
          const inclIds = inclusionLinks.map((i: any) => i.inclusion_id);
          const { data: inclusions } = await supabase
            .from("inclusions")
            .select("name")
            .in("id", inclIds);
          courseIncludes = (inclusions ?? []).map((i: any) => i.name);
        }

        setCourse({
          id: courseData.id,
          title: courseData.title,
          category: categoryName,
          level: courseData.level || "Beginner",
          rating: avgRating,
          reviewCount: reviews.length,
          studentsCount: enrolledCount || 0,
          // Use the computed total duration for display
          duration: formatTotalDuration(totalDurationSeconds),
          totalDurationSeconds,
          price: Number(courseData.price) || 0,
          description:
            courseData.long_description ||
            courseData.short_description ||
            "No description available",
          whatYouLearn: whatYouLearn.length > 0 ? whatYouLearn : undefined,
          tools: courseTools.length > 0 ? courseTools : undefined,
          includes:
            courseIncludes.length > 0
              ? courseIncludes
              : ["Lifetime access", "Certificate of completion"],
          curriculum,
          reviews,
          coach: coachDetails,
        });
      } catch (err) {
        console.error("Error fetching course:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch course");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  return { course, loading, error };
};