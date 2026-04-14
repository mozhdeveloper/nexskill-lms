import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StudentAppLayout from "../../layouts/StudentAppLayout";
import { supabase } from "../../lib/supabaseClient";
import { useCourse } from "../../hooks/useCourse";
import { useEnrollment } from "../../hooks/useEnrollment";
import CourseDetailContent from "../../components/courses/CourseDetailContent";
import CourseEnrollmentCard from "../../components/courses/CourseEnrollmentCard";
import CourseCurriculumTab from "../../components/courses/tabs/CourseCurriculumTab";
import CourseReviewsTab from "../../components/courses/tabs/CourseReviewsTab";
import CourseCoachTab from "../../components/courses/tabs/CourseCoachTab";

// ─── Duration formatting ──────────────────────────────────────────────────────

const formatTotalDuration = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return "0h";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

// ─── Component ────────────────────────────────────────────────────────────────

const CourseDetailRefactored: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [userId, setUserId] = useState<string>("");
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const [activeTab, setActiveTab] = useState<
    "overview" | "curriculum" | "reviews" | "coach"
  >("overview");

  // useCourse now resolves totalDurationSeconds on load — no tab dependency
  const { course, loading: loadingCourse, error } = useCourse(courseId);

  // Debug: Log curriculum data whenever it changes
  useEffect(() => {
    if (course?.curriculum) {
      console.log("[CourseDetailRefactored] Curriculum data:", course.curriculum);
      course.curriculum.forEach((module, idx) => {
        console.log(`[CourseDetailRefactored] Module ${idx + 1}: "${module.title}" has ${module.lessons?.length || 0} lessons`, module.lessons);
      });
    } else {
      console.log("[CourseDetailRefactored] No curriculum data available");
    }
  }, [course?.curriculum]);

  // Fetch curriculum directly on page load
  const [directCurriculum, setDirectCurriculum] = useState<any[]>([]);
  const [directCurriculumLoading, setDirectCurriculumLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string>("");
  
  useEffect(() => {
    if (!courseId) return;
    
    const fetchCurriculumDirectly = async () => {
      setDirectCurriculumLoading(true);
      setDebugInfo("");
      console.log("[CourseDetailRefactored] Fetching curriculum directly for courseId:", courseId);
      
      // 1. Fetch ALL modules (ignore is_published for maximum compatibility)
      const { data: modules } = await supabase
        .from("modules")
        .select("id, title, position, is_published")
        .eq("course_id", courseId)
        .order("position", { ascending: true });
      
      console.log("[CourseDetailRefactored] Modules fetched:", modules);
      
      if (modules && modules.length > 0) {
        const moduleIds = modules.map(m => m.id);
        console.log("[CourseDetailRefactored] Module IDs:", moduleIds);
        
        // 2. Fetch ALL content items (ignore is_published)
        const { data: contentItems } = await supabase
          .from("module_content_items")
          .select("module_id, content_id, content_type, position, is_published")
          .in("module_id", moduleIds)
          .order("position", { ascending: true });
        
        console.log("[CourseDetailRefactored] Content items:", contentItems);
        
        // Check publishing status for debugging
        const publishedModules = modules.filter(m => m.is_published);
        const publishedContent = contentItems?.filter(c => c.is_published);
        
        if (publishedModules.length !== modules.length) {
          setDebugInfo(`⚠️ ${modules.length - publishedModules.length} modules are not published`);
        }
        if ((publishedContent?.length || 0) !== (contentItems?.length || 0)) {
          setDebugInfo(prev => prev + ` | ⚠️ ${(contentItems?.length || 0) - (publishedContent?.length || 0)} content items are not published`);
        }
        
        if (contentItems && contentItems.length > 0) {
          const lessonIds = contentItems
            .filter(i => i.content_type === "lesson")
            .map(i => i.content_id);
          const quizIds = contentItems
            .filter(i => i.content_type === "quiz")
            .map(i => i.content_id);
          
          console.log("[CourseDetailRefactored] Lesson IDs to fetch:", lessonIds);
          console.log("[CourseDetailRefactored] Quiz IDs to fetch:", quizIds);
          
          // 3. Fetch lessons and quizzes
          const [lessonsRes, quizzesRes] = await Promise.all([
            lessonIds.length > 0 
              ? supabase.from("lessons").select("id, title, estimated_duration_minutes, is_published").in("id", lessonIds)
              : Promise.resolve({ data: [] }),
            quizIds.length > 0
              ? supabase.from("quizzes").select("id, title, time_limit_minutes, is_published").in("id", quizIds)
              : Promise.resolve({ data: [] })
          ]);
          
          console.log("[CourseDetailRefactored] Lessons response:", lessonsRes);
          console.log("[CourseDetailRefactored] Quizzes response:", quizzesRes);
          
          const lessonsMap = new Map((lessonsRes.data || []).map(l => [l.id, l]));
          const quizzesMap = new Map((quizzesRes.data || []).map(q => [q.id, q]));
          
          // 4. Build curriculum
          const curriculumData = modules.map(module => {
            const moduleItems = contentItems.filter(i => i.module_id === module.id);
            console.log(`[CourseDetailRefactored] Module "${module.title}" has ${moduleItems.length} content items`);
            
            const lessons = moduleItems.map(item => {
              if (item.content_type === "lesson") {
                const lesson = lessonsMap.get(item.content_id);
                if (!lesson) {
                  console.warn("[CourseDetailRefactored] Lesson not found for ID:", item.content_id);
                  return null;
                }
                return {
                  id: lesson.id,
                  title: lesson.title,
                  duration: `${lesson.estimated_duration_minutes || 15}m`,
                  type: "lesson" as const
                };
              }
              if (item.content_type === "quiz") {
                const quiz = quizzesMap.get(item.content_id);
                if (!quiz) {
                  console.warn("[CourseDetailRefactored] Quiz not found for ID:", item.content_id);
                  return null;
                }
                return {
                  id: quiz.id,
                  title: quiz.title,
                  duration: `${quiz.time_limit_minutes || 30}m`,
                  type: "quiz" as const
                };
              }
              return null;
            }).filter(Boolean);
            
            console.log(`[CourseDetailRefactored] Module "${module.title}" built with ${lessons?.length || 0} lessons`);
            return {
              id: module.id,
              title: module.title,
              lessons: lessons || []
            };
          });
          
          console.log("[CourseDetailRefactored] Final curriculum:", curriculumData);
          setDirectCurriculum(curriculumData);
        } else {
          console.warn("[CourseDetailRefactored] No content items found for modules:", moduleIds);
          setDebugInfo("⚠️ No content items found - modules may be empty");
          // Create empty modules
          setDirectCurriculum(modules.map(m => ({ id: m.id, title: m.title, lessons: [] })));
        }
      } else {
        console.warn("[CourseDetailRefactored] No modules found for courseId:", courseId);
        setDebugInfo("⚠️ No modules found for this course");
        setDirectCurriculum([]);
      }
      
      setDirectCurriculumLoading(false);
    };
    
    fetchCurriculumDirectly();
  }, [courseId]);
  
  // Function to fix curriculum visibility (simple version - just updates is_published flags)
  const handleFixVisibility = async () => {
    if (!courseId) return;
    
    try {
      // Update modules to published
      await supabase
        .from("modules")
        .update({ is_published: true })
        .eq("course_id", courseId);
      
      // Update content items to published
      await supabase
        .from("module_content_items")
        .update({ is_published: true })
        .in("module_id", (await supabase.from("modules").select("id").eq("course_id", courseId)).data?.map(m => m.id) || []);
      
      // Update lessons to published
      await supabase
        .from("lessons")
        .update({ is_published: true })
        .in("id", 
          (await supabase.from("module_content_items")
            .select("content_id")
            .in("module_id", (await supabase.from("modules").select("id").eq("course_id", courseId)).data?.map(m => m.id) || [])
            .eq("content_type", "lesson")
          ).data?.map(l => l.content_id) || []
        );
      
      // Update quizzes to published
      await supabase
        .from("quizzes")
        .update({ is_published: true })
        .in("id", 
          (await supabase.from("module_content_items")
            .select("content_id")
            .in("module_id", (await supabase.from("modules").select("id").eq("course_id", courseId)).data?.map(m => m.id) || [])
            .eq("content_type", "quiz")
          ).data?.map(q => q.content_id) || []
        );
      
      setDebugInfo("✅ Curriculum published successfully!");
      alert("Curriculum visibility fixed! Refreshing...");
      
      // Refresh curriculum
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      console.error("Error fixing visibility:", err);
      alert("Failed to fix visibility: " + err.message);
    }
  };

  const {
    isEnrolled,
    checking,
    loading: enrolling,
    enroll,
    unenroll,
  } = useEnrollment(courseId);

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [completedQuizIds, setCompletedQuizIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkWishlist = async () => {
      if (!courseId) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("student_wishlist")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .maybeSingle();
      if (data) setIsWishlisted(true);
    };
    checkWishlist();
  }, [courseId]);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!courseId || !isEnrolled) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: modules } = await supabase
        .from("modules")
        .select("id")
        .eq("course_id", courseId);
      if (!modules || modules.length === 0) return;

      const moduleIds = modules.map((m: { id: string }) => m.id);

      const { data: contentItems } = await supabase
        .from("module_content_items")
        .select("content_type, content_id")
        .in("module_id", moduleIds)
        .eq("is_published", true);

      const lessonIds = (contentItems || [])
        .filter((i: { content_type: string }) => i.content_type === "lesson")
        .map((i: { content_id: string }) => i.content_id);
      const quizIds = (contentItems || [])
        .filter((i: { content_type: string }) => i.content_type === "quiz")
        .map((i: { content_id: string }) => i.content_id);

      if (lessonIds.length > 0) {
        const { data: lessonProgress } = await supabase
          .from("user_lesson_progress")
          .select("lesson_id")
          .eq("user_id", user.id)
          .eq("is_completed", true)
          .in("lesson_id", lessonIds);
        setCompletedLessonIds(
          new Set((lessonProgress || []).map((p: { lesson_id: string }) => p.lesson_id))
        );
      }

      if (quizIds.length > 0) {
        const { data: quizAttempts } = await supabase
          .from("quiz_attempts")
          .select("quiz_id")
          .eq("user_id", user.id)
          .eq("passed", true)
          .in("quiz_id", quizIds);
        setCompletedQuizIds(
          new Set((quizAttempts || []).map((a: { quiz_id: string }) => a.quiz_id))
        );
      }
    };
    fetchProgress();
  }, [courseId, isEnrolled]);

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleEnroll = async () => {
    const result = await enroll();
    if (result.success) {
      showFeedback("success", `Successfully enrolled in ${course?.title}!`);
    } else {
      showFeedback("error", `Failed to enroll: ${result.error}`);
    }
  };

  const handleUnenroll = async () => {
    const confirmed = window.confirm(
      `⚠️ WARNING: Leave ${course?.title}?\n\n` +
        "By leaving this course, you will:\n" +
        "• Lose ALL your progress (lessons completed, quiz attempts, scores)\n" +
        "• Lose all your quiz answers and submissions\n" +
        "• Lose access to Course Circle discussions\n" +
        "• Lose all feedback and coach review history\n\n" +
        "This action CANNOT be undone. If you re-enroll later, you'll start from scratch.\n\n" +
        "Are you sure you want to continue?"
    );
    if (!confirmed) return;

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser || !course) return;

      console.log('🗑️ LEAVE: Cleaning up course', course.id);

      // Get modules
      const { data: modules } = await supabase.from('modules').select('id').eq('course_id', course.id);
      const moduleIds = modules?.map(m => m.id) || [];

      if (moduleIds.length > 0) {
        // Get lessons
        const { data: lessonRefs } = await supabase.from('module_content_items').select('content_id').in('module_id', moduleIds).eq('content_type', 'lesson');
        const lessonIds = lessonRefs?.map(l => l.content_id) || [];

        // Get quizzes
        const { data: modQuizzes } = await supabase.from('module_content_items').select('content_id').in('module_id', moduleIds).eq('content_type', 'quiz');
        const { data: lessonQuizRefs } = await supabase.from('lesson_content_items').select('content_id').in('lesson_id', lessonIds).eq('content_type', 'quiz');
        const allQuizIds = [...(modQuizzes?.map(q => q.content_id) || []), ...(lessonQuizRefs?.map(q => q.content_id) || [])];

        // Get attempts
        let attemptIds: string[] = [];
        if (allQuizIds.length > 0) {
          const { data: attempts } = await supabase.from('quiz_attempts').select('id').eq('user_id', authUser.id).in('quiz_id', allQuizIds);
          attemptIds = attempts?.map(a => a.id) || [];
        }

        // Delete quiz data
        if (attemptIds.length > 0) {
          const { data: subs } = await supabase.from('quiz_submissions').select('id').in('quiz_attempt_id', attemptIds);
          if (subs?.length) await supabase.from('quiz_feedback').delete().in('quiz_submission_id', subs.map(s => s.id));
          await supabase.from('quiz_submissions').delete().in('quiz_attempt_id', attemptIds);
          await supabase.from('quiz_responses').delete().in('attempt_id', attemptIds);
          await supabase.from('quiz_attempts').delete().in('id', attemptIds);
        }

        // Delete lesson progress
        if (lessonIds.length > 0) {
          await supabase.from('lesson_content_item_progress').delete().eq('user_id', authUser.id).in('lesson_id', lessonIds);
          await supabase.from('user_lesson_progress').delete().eq('user_id', authUser.id).in('lesson_id', lessonIds);
          await supabase.from('lesson_access_status').delete().eq('user_id', authUser.id).in('lesson_id', lessonIds);
        }

        // Delete module progress
        try { await supabase.from('user_module_progress').delete().eq('user_id', authUser.id).in('module_id', moduleIds); } catch {}
      }

      // Delete enrollment
      const { error } = await supabase.from('enrollments').delete().match({ profile_id: authUser.id, course_id: course.id });
      if (error) throw error;

      showFeedback("success", `You have left ${course?.title}. All progress removed.`);
      window.location.reload();
    } catch (err) {
      console.error('❌ Leave failed:', err);
      showFeedback("error", "Failed to leave course. Check console.");
    }
  };

  const handleAddToWishlist = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser || !course) return;
      if (isWishlisted) {
        await supabase
          .from("student_wishlist")
          .delete()
          .match({ user_id: authUser.id, course_id: course.id });
        setIsWishlisted(false);
      } else {
        await supabase
          .from("student_wishlist")
          .insert({ user_id: authUser.id, course_id: course.id });
        setIsWishlisted(true);
      }
    } catch (err) {
      console.error("Error updating wishlist:", err);
    }
  };

  // ── Duration label — resolved on page load, no tab click needed ────────────
  const durationLabel =
    course && course.totalDurationSeconds > 0
      ? formatTotalDuration(course.totalDurationSeconds)
      : course?.duration ?? "—";

  // ── Loading / error / not-found states ────────────────────────────────────

  if (loadingCourse) {
    return (
      <StudentAppLayout>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-text-secondary">Loading course...</p>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  if (error) {
    return (
      <StudentAppLayout>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-red-500">
            <h2 className="text-2xl font-bold mb-2">Error Loading Course</h2>
            <p className="mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-black"
            >
              Retry
            </button>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  if (!course) {
    return (
      <StudentAppLayout>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-2">
              Course not found
            </h2>
            <p className="text-text-secondary dark:text-dark-text-secondary mb-6">
              The course you're looking for doesn't exist.
            </p>
            <p className="text-xs text-gray-400 mb-4">Course ID: {courseId}</p>
            <button
              onClick={() => navigate("/student/courses")}
              className="px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-primary-light text-white font-medium rounded-full hover:shadow-lg transition-all"
            >
              Browse courses
            </button>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  return (
    <StudentAppLayout>
      {feedbackMessage && (
        <div
          className={`px-8 py-3 text-sm font-medium ${
            feedbackMessage.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
          }`}
        >
          {feedbackMessage.text}
        </div>
      )}

      {/* Header */}
      <div className="px-8 py-6 border-b border-[#EDF0FB] dark:border-gray-700">
        <button
          onClick={() => navigate("/student/courses")}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-brand-primary mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to catalog
        </button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">
                {course.title}
              </h1>
              <span className="px-3 py-1 bg-brand-primary-soft text-brand-primary rounded-full text-xs font-medium">
                {course.level}
              </span>
            </div>
            <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-3">
              {course.category}
            </p>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">★</span>
                <span className="font-semibold text-text-primary dark:text-dark-text-primary">
                  {course.rating.toFixed(1)}
                </span>
                <span className="text-text-muted dark:text-dark-text-muted">
                  ({course.reviewCount} reviews)
                </span>
              </div>
              <div className="flex items-center gap-1 text-text-secondary dark:text-dark-text-secondary">
                <span>👥</span>
                <span>{course.studentsCount.toLocaleString()} students</span>
              </div>
              {/* ⏱️ — populated on page load via useCourse, no tab click needed */}
              <div className="flex items-center gap-1 text-text-secondary dark:text-dark-text-secondary">
                <span>⏱️</span>
                <span>{durationLabel}</span>
              </div>
            </div>

            {/* Progress bar (enrolled students) */}
            {isEnrolled && course.curriculum && course.curriculum.length > 0 && (() => {
              const totalItems = course.curriculum.reduce(
                (sum: number, m: { lessons?: unknown[] }) => sum + (m.lessons?.length || 0),
                0
              );
              const totalDone = course.curriculum.reduce(
                (sum: number, m: { lessons?: Array<{ id: string; type: string }> }) =>
                  sum +
                  (m.lessons?.filter((l) =>
                    l.type === "quiz"
                      ? completedQuizIds.has(l.id)
                      : completedLessonIds.has(l.id)
                  ).length || 0),
                0
              );
              const pct = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;
              return (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-text-primary dark:text-dark-text-primary">
                      Your Progress
                    </span>
                    <span className="text-text-muted dark:text-dark-text-muted">
                      {totalDone}/{totalItems} lessons · {pct}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        pct === 100 ? "bg-green-500" : "bg-brand-primary"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {pct === 100 && (
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-1">
                      🎉 Course completed! View your certificate.
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            {/* Tab Bar */}
            <div className="flex gap-4 mb-6 border-b border-[#EDF0FB] dark:border-gray-700">
              {(["overview", "curriculum", "reviews", "coach"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-medium capitalize transition-all border-b-2 ${
                    activeTab === tab
                      ? "text-brand-primary border-brand-primary"
                      : "text-text-secondary border-transparent hover:text-brand-primary"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="bg-white dark:bg-dark-background-card rounded-3xl shadow-card p-8">
              {activeTab === "overview" && (
                <CourseDetailContent
                  description={course.description}
                  whatYouLearn={course.whatYouLearn}
                  tools={course.tools}
                  isEnrolled={isEnrolled}
                />
              )}
              {activeTab === "curriculum" && (
                <div>
                  {/* Debug Info & Fix Button */}
                  <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                          Curriculum Debug Info
                        </h4>
                        <div className="text-xs text-yellow-700 dark:text-yellow-400 space-y-1">
                          <div>Direct Curriculum: {directCurriculum.length} modules</div>
                          <div>Course Curriculum: {course.curriculum?.length || 0} modules</div>
                          <div>Loading: {directCurriculumLoading ? "Yes" : "No"}</div>
                          {debugInfo && <div className="font-medium">{debugInfo}</div>}
                        </div>
                      </div>
                      <button
                        onClick={handleFixVisibility}
                        disabled={directCurriculumLoading}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                      >
                        🔧 Fix Visibility
                      </button>
                    </div>
                  </div>
                  
                  <CourseCurriculumTab
                    curriculum={directCurriculum.length > 0 ? directCurriculum : (course.curriculum || [])}
                    courseId={courseId}
                    isEnrolled={isEnrolled}
                    completedLessonIds={completedLessonIds}
                    completedQuizIds={completedQuizIds}
                  />
                </div>
              )}
              {activeTab === "reviews" && (
                <CourseReviewsTab
                  courseId={course.id}
                  isEnrolled={isEnrolled}
                  initialRating={course.rating}
                  initialReviewCount={course.reviewCount}
                />
              )}
              {activeTab === "coach" && (
                <CourseCoachTab coach={course.coach || null} />
              )}
            </div>
          </div>

          {/* Enrollment Card */}
          <div className="w-80 flex-shrink-0">
            <CourseEnrollmentCard
              courseId={course.id}
              courseTitle={course.title}
              userId={userId}
              price={course.price}
              originalPrice={course.originalPrice}
              includes={course.includes}
              isEnrolled={isEnrolled}
              checking={checking}
              enrolling={enrolling}
              onEnroll={handleEnroll}
              onUnenroll={handleUnenroll}
              onAddToWishlist={handleAddToWishlist}
            />
          </div>
        </div>
      </div>
    </StudentAppLayout>
  );
};

export default CourseDetailRefactored;