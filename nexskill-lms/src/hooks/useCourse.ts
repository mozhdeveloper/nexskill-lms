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

        // 1. Fetch Course Basic Details (simplified query for debugging)
        const { data: courseData, error: fetchError } = await supabase
          .from("courses")
          .select("*")
          .eq("id", courseId)
          .single();

        if (fetchError) {
          console.error("Supabase error:", fetchError);
          throw new Error(`Supabase: ${fetchError.message} (Code: ${fetchError.code})`);
        }

        if (courseData) {
          // 2. Fetch Curriculum (Modules -> ModuleContentItems -> Lessons/Quizzes)
          const { data: modulesData } = await supabase
            .from("modules")
            .select("id, title, position")
            .eq("course_id", courseId)
            .order("position", { ascending: true });

          let curriculum: Module[] = [];
          if (modulesData && modulesData.length > 0) {
            // Retrieve all module items for these modules
            const moduleIds = modulesData.map((m) => m.id);
            const { data: itemsData } = await supabase
              .from("module_content_items")
              .select("module_id, content_id, content_type, position")
              .in("module_id", moduleIds)
              .eq("is_published", true)
              .order("position", { ascending: true });

            if (itemsData && itemsData.length > 0) {
              // Separate IDs by type to fetch details
              const lessonIds = itemsData
                .filter((i) => i.content_type === "lesson")
                .map((i) => i.content_id);
              const quizIds = itemsData
                .filter((i) => i.content_type === "quiz")
                .map((i) => i.content_id);

              // Fetch details
              const [lessonsRes, quizzesRes] = await Promise.all([
                supabase
                  .from("lessons")
                  .select("id, title, estimated_duration_minutes")
                  .in("id", lessonIds),
                supabase
                  .from("quizzes")
                  .select("id, title, time_limit_minutes")
                  .in("id", quizIds),
              ]);

              const lessonsMap = new Map(
                lessonsRes.data?.map((l) => [l.id, l]) || []
              );
              const quizzesMap = new Map(
                quizzesRes.data?.map((q) => [q.id, q]) || []
              );

              // Build Curriculum Structure
              curriculum = modulesData.map((module) => {
                const moduleItems = itemsData.filter(
                  (i) => i.module_id === module.id
                );
                const lessons: Lesson[] = moduleItems
                  .map((item) => {
                    if (item.content_type === "lesson") {
                      const l = lessonsMap.get(item.content_id);
                      return l
                        ? {
                          id: l.id,
                          title: l.title,
                          duration: `${l.estimated_duration_minutes || 15}m`,
                          type: "lesson" as const,
                        }
                        : null;
                    } else if (item.content_type === "quiz") {
                      const q = quizzesMap.get(item.content_id);
                      return q
                        ? {
                          id: q.id,
                          title: q.title,
                          duration: `${q.time_limit_minutes || 30}m`,
                          type: "quiz" as const,
                        }
                        : null;
                    }
                    return null;
                  })
                  .filter((l) => l !== null) as Lesson[];

                return {
                  id: module.id,
                  title: module.title,
                  lessons,
                };
              });
            } else {
              // No content items, just empty modules
              curriculum = modulesData.map((m) => ({
                id: m.id,
                title: m.title,
                lessons: [],
              }));
            }
          }

          // 3. Fetch Coach Extra Details
          let coachDetails: Coach | null = null;
          console.log("[useCourse] Course coach_id:", courseData.coach_id);

          if (courseData.coach_id) {
            // First get basic profile
            const { data: coachProfile, error: profileError } = await supabase
              .from("profiles")
              .select("id, first_name, last_name, email, role")
              .eq("id", courseData.coach_id)
              .single();

            console.log("[useCourse] Coach profile result:", coachProfile, "Error:", profileError);

            if (coachProfile) {
              // Get extended coach profile (may not exist)
              const { data: coachProfileExt, error: coachExtError } = await supabase
                .from("coach_profiles")
                .select("*")
                .eq("id", courseData.coach_id)
                .maybeSingle();

              console.log("[useCourse] Coach extended profile:", coachProfileExt, "Error:", coachExtError);

              // Fetch real course count for this coach
              const { count: coursesCount } = await supabase
                .from("courses")
                .select("*", { count: "exact", head: true })
                .eq("coach_id", courseData.coach_id);

              // Fetch real student count (enrollments across all coach's courses)
              const { data: coachCourses } = await supabase
                .from("courses")
                .select("id")
                .eq("coach_id", courseData.coach_id);

              let studentsCount = 0;
              if (coachCourses && coachCourses.length > 0) {
                const courseIds = coachCourses.map(c => c.id);
                const { count: enrollmentCount } = await supabase
                  .from("enrollments")
                  .select("*", { count: "exact", head: true })
                  .in("course_id", courseIds);
                studentsCount = enrollmentCount || 0;
              }

              coachDetails = {
                id: coachProfile.id,
                name: `${coachProfile.first_name || ""} ${coachProfile.last_name || ""}`.trim() || coachProfile.email || "Instructor",
                avatar: undefined,
                bio: coachProfileExt?.bio || "Expert Instructor",
                jobTitle: coachProfileExt?.job_title || undefined,
                experienceLevel: coachProfileExt?.experience_level || undefined,
                contentAreas: coachProfileExt?.content_areas || [],
                tools: coachProfileExt?.tools || [],
                linkedinUrl: coachProfileExt?.linkedin_url || undefined,
                portfolioUrl: coachProfileExt?.portfolio_url || undefined,
                studentsCount: studentsCount,
                coursesCount: coursesCount || 0,
                rating: 4.9,
                ratingIsHardcoded: true,
              };
            } else {
              // Profile not found but coach_id exists - create minimal coach from ID
              console.warn("[useCourse] Coach profile not found for ID:", courseData.coach_id);
            }
          } else {
            console.log("[useCourse] Course has no coach_id assigned");
          }

          // 3b. Fetch Category name
          let categoryName = "General";
          if (courseData.category_id) {
            const { data: categoryData } = await supabase
              .from("categories")
              .select("name")
              .eq("id", courseData.category_id)
              .single();
            if (categoryData) {
              categoryName = categoryData.name;
            }
          }

          // 4. Fetch Reviews
          const { data: reviewsData } = await supabase
            .from("reviews")
            .select(`
              id,
              rating,
              comment,
              created_at,
              profile:profiles(first_name, last_name)
            `)
            .eq("course_id", courseId)
            .order("created_at", { ascending: false })
            .limit(10);

          const reviews: Review[] = reviewsData
            ? reviewsData.map((r: any) => ({
              id: r.id.toString(),
              userName: `${r.profile?.first_name || "Student"} ${r.profile?.last_name || ""}`,
              date: new Date(r.created_at).toLocaleDateString(),
              rating: r.rating,
              comment: r.comment,
            }))
            : [];

          const mappedCourse: CourseDisplay = {
            id: courseData.id,
            title: courseData.title,
            category: categoryName,
            level: courseData.level || "Beginner",
            rating: 4.8, // Calculate average
            reviewCount: reviews.length,
            studentsCount: 12450, // Count from enrollments
            duration: `${courseData.duration_hours || 0}h`,
            price: Number(courseData.price) || 0,
            description:
              courseData.long_description ||
              courseData.short_description ||
              "No description available",
            whatYouLearn: [
              "Master key concepts",
              "Build real-world projects",
              "Get job-ready skills"
            ], // These could be in `course_learning_objectives`
            tools: ["VS Code", "Figma", "React"], // These could be in `course_topics`
            includes: ["Lifetime access", "Certificate of completion"],
            curriculum,
            reviews,
            coach: coachDetails,
          };

          setCourse(mappedCourse);
        }
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
