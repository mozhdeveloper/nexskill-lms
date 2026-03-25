import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import CoachAppLayout from "../../layouts/CoachAppLayout";
import CourseBuilderSidebar from "../../components/coach/course-builder/CourseBuilderSidebar";
import CourseSettingsForm from "../../components/coach/course-builder/CourseSettingsForm";
import CurriculumEditor from "../../components/coach/course-builder/CurriculumEditor";
import DripSchedulePanel from "../../components/coach/course-builder/DripSchedulePanel";
import CoursePricingForm from "../../components/coach/course-builder/CoursePricingForm";
import CoursePublishWorkflow from "../../components/coach/course-builder/CoursePublishWorkflow";
import CoursePreviewPane from "../../components/coach/course-builder/CoursePreviewPane";
import DeleteCourseModal from "../../components/courses/DeleteCourseModal";
import LessonEditorPanel from "../../components/coach/lesson-editor/LessonEditorPanel";
import LiveSessionManager from "../../components/coach/live-sessions/LiveSessionManager";
import QuizEditorPanel from "../../components/quiz/QuizEditorPanel";
import CourseGoalsPanel from "../../components/coach/course-builder/CourseGoalsPanel";
import type { Lesson, Module } from "../../types/lesson";
import type { Quiz, QuizQuestion } from "../../types/quiz";
import type { ContentItem } from "../../types/content-item";
import { supabase } from "../../lib/supabaseClient";

type SectionKey =
  | "settings"
  | "curriculum"
  | "live-sessions"
  | "drip"
  | "pricing"
  | "goals"
  | "publish"
  | "preview";

interface CourseSettings {
  title: string;
  subtitle: string;
  category: string;
  level: string;
  language: string;
  shortDescription: string;
  longDescription: string;
  visibility: "public" | "unlisted" | "private";
  topics: number[];
  learningObjectives?: string[];
}

interface ModuleDrip {
  moduleId: string;
  moduleTitle: string;
  mode: "immediate" | "days-after-enrollment" | "specific-date" | "after-previous";
  daysAfter?: number;
  specificDate?: string;
}

interface PricingData {
  mode: "free" | "one-time" | "subscription";
  price: number;
  currency: string;
  salePrice?: number;
  subscriptionInterval?: "monthly" | "yearly";
}

const CourseBuilder: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const saveQuizQuestionsTimeoutRef = useRef<any>(null);
  const saveLessonTimeoutRef = useRef<any>(null);
  const saveCurriculumTimeoutRef = useRef<any>(null);

  const initialData = location.state as CourseSettings | undefined;

  const [activeSection, setActiveSection] = useState<SectionKey>("settings");
  const [courseStatus, setCourseStatus] = useState<"draft" | "published">("draft");
  const [verificationStatus, setVerificationStatus] = useState<string>("draft");
  const [adminFeedback, setAdminFeedback] = useState<string>("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [instructorName, setInstructorName] = useState<string>("Instructor");

  const [settings, setSettings] = useState<CourseSettings>({
    title: initialData?.title || "",
    subtitle: initialData?.subtitle || "",
    category: initialData?.category || "",
    level: initialData?.level || "Beginner",
    language: initialData?.language || "English",
    shortDescription: "",
    longDescription: "",
    visibility: "public",
    topics: [],
    learningObjectives: [],
  });

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single();
        if (profile) {
          setInstructorName(`${profile.first_name} ${profile.last_name || ''}`.trim());
        }
      }

      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select(`
          *,
          category:categories(name),
          course_topics(topic_id),
          admin_verification_feedback(content, created_at, is_resolved)
        `)
        .eq("id", courseId)
        .single();

      if (courseError) {
        console.error("Error fetching course:", courseError);
      } else if (courseData) {
        setSettings((prev) => ({
          ...prev,
          title: courseData.title,
          subtitle: courseData.subtitle || "",
          shortDescription: courseData.short_description || "",
          longDescription: courseData.long_description || "",
          visibility: courseData.visibility || "public",
          language: courseData.language || "English",
          level: courseData.level,
          category: courseData.category?.name || "",
          topics: courseData.course_topics?.map((ct: any) => ct.topic_id) || [],
          learningObjectives: [],
        }));

        // Only set to published if verification_status is approved
        const isPublished = courseData.verification_status === 'approved';
        setCourseStatus(isPublished ? "published" : "draft");
        setVerificationStatus(courseData.verification_status || "draft");

        const dbPrice = courseData.price ?? 0;
        const pricingMode: 'free' | 'one-time' | 'subscription' = dbPrice === 0 ? 'free' : 'one-time';
        setPricing({ mode: pricingMode, price: dbPrice, currency: 'PHP', salePrice: undefined, subscriptionInterval: undefined });

        const feedbacks = courseData.admin_verification_feedback;
        const latestFeedback = feedbacks && feedbacks.length > 0
          ? feedbacks.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
          : null;
        setAdminFeedback(latestFeedback?.content || "");

        const { data: modulesData, error: modulesError } = await supabase
          .from("modules")
          .select("*")
          .eq("course_id", courseId)
          .order("position", { ascending: true });

        if (modulesError) {
          console.error("Error fetching modules:", modulesError);
        } else if (modulesData) {
          const modulesWithContent = await Promise.all(
            modulesData.map(async (module) => {
              const { data: contentData, error: contentError } = await supabase
                .from("module_content_with_data")
                .select("*")
                .eq("module_id", module.id)
                .order("position", { ascending: true });

              if (contentError) {
                console.error("Error fetching content items for module:", module.id, contentError);
                return { ...module, lessons: [] };
              }

              const contentItems = contentData
                .map((item) => {
                  if (item.content_type === 'lesson' && item.lesson_id) {
                    const contentBlocks = item.content_blocks || [];
                    const lessonType = contentBlocks.length > 0 ? contentBlocks[0].type : "text";
                    const duration = item.lesson_estimated_duration_minutes 
                      ? `${item.lesson_estimated_duration_minutes} min` 
                      : "Lesson";
                    return {
                      id: item.lesson_id,
                      type: "lesson" as const,
                      title: item.lesson_title,
                      description: item.lesson_description,
                      content_blocks: contentBlocks,
                      estimated_duration_minutes: item.lesson_estimated_duration_minutes,
                      is_published: item.lesson_is_published || item.item_is_published,
                      created_at: item.lesson_created_at,
                      updated_at: item.lesson_updated_at,
                      type_attr: lessonType,
                      duration: duration,
                      summary: item.lesson_summary || "",
                    };
                  } else if (item.content_type === 'quiz' && item.quiz_id) {
                    return {
                      id: item.quiz_id,
                      type: "quiz" as const,
                      title: item.quiz_title,
                      description: item.quiz_description,
                      instructions: item.instructions,
                      passing_score: item.passing_score,
                      time_limit_minutes: item.time_limit_minutes,
                      max_attempts: item.quiz_max_attempts,
                      requires_manual_grading: item.quiz_requires_manual_grading,
                      is_published: item.quiz_is_published || item.item_is_published,
                      created_at: item.quiz_created_at,
                      updated_at: item.quiz_updated_at,
                      available_from: item.available_from,
                      due_date: item.due_date,
                      late_submission_allowed: item.late_submission_allowed,
                      late_penalty_percent: item.late_penalty_percent,
                      duration: "Quiz",
                    };
                  }
                  return null;
                })
                .filter(item => item !== null);

              return { ...module, lessons: contentItems };
            })
          );
          setCurriculum(modulesWithContent);
        }
      }
    };
    fetchCourse();
  }, [courseId]);

  useEffect(() => {
    return () => {
      if (saveQuizQuestionsTimeoutRef.current) clearTimeout(saveQuizQuestionsTimeoutRef.current);
      if (saveLessonTimeoutRef.current) clearTimeout(saveLessonTimeoutRef.current);
      if (saveCurriculumTimeoutRef.current) clearTimeout(saveCurriculumTimeoutRef.current);
    };
  }, []);

  const [curriculum, setCurriculum] = useState<Module[]>([]);

  const handleCurriculumChange = (updatedCurriculum: Module[]) => {
    setCurriculum(updatedCurriculum);

    if (saveCurriculumTimeoutRef.current) clearTimeout(saveCurriculumTimeoutRef.current);

    saveCurriculumTimeoutRef.current = setTimeout(async () => {
      try {
        const validModules = updatedCurriculum.filter(m => !m.id.startsWith('module-'));
        if (validModules.length === 0) return;

        const updates = validModules.map((m, index) => ({
          id: m.id,
          title: m.title,
          is_sequential: m.is_sequential,
          course_id: courseId,
          position: m.position ?? index,
        }));

        const { error } = await supabase.from('modules').upsert(updates);
        if (error) console.error("Error saving modules:", error);
      } catch (err) {
        console.error("Error in module auto-save:", err);
      }
    }, 1000);
  };

  const [editingLesson, setEditingLesson] = useState<{ moduleId: string; lesson: Lesson } | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<{ moduleId: string; lessonId: string; quiz: Quiz; questions: QuizQuestion[] } | null>(null);
  const [drip, setDrip] = useState<ModuleDrip[]>([]);

  useEffect(() => {
    setDrip((prevDrip) => {
      const existingMap = new Map(prevDrip.map(d => [d.moduleId, d]));
      return curriculum.map((mod) => {
        const existing = existingMap.get(mod.id);
        return {
          moduleId: mod.id,
          moduleTitle: mod.title,
          mode: existing?.mode || mod.drip_mode || "immediate",
          daysAfter: existing?.daysAfter || mod.drip_days,
          specificDate: existing?.specificDate || mod.drip_date,
        };
      });
    });
  }, [curriculum]);

  const [pricing, setPricing] = useState<PricingData>({ mode: "one-time", price: 99, currency: "USD" });

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const resolveModuleId = async (tempModuleId: string): Promise<string> => {
    if (tempModuleId.startsWith("module-")) {
      const tempModule = curriculum.find((m) => m.id === tempModuleId);
      if (tempModule) {
        const { data: existingModule } = await supabase
          .from("modules").select("id").eq("course_id", courseId).eq("title", tempModule.title).single();

        if (existingModule) {
          setCurriculum(curriculum.map((m) => m.id === tempModuleId ? { ...m, id: existingModule.id } : m));
          return existingModule.id;
        } else {
          const moduleUuid = uuidv4();
          const { data: maxPositionData } = await supabase
            .from("modules").select("position").eq("course_id", courseId).order("position", { ascending: false }).limit(1);
          const newPosition = maxPositionData && maxPositionData.length > 0 ? maxPositionData[0].position + 1 : 0;

          const { error: moduleError } = await supabase.from("modules").insert([{
            id: moduleUuid, course_id: courseId, title: tempModule.title,
            position: newPosition, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
          }]);

          if (moduleError) throw new Error(`Failed to create module: ${moduleError.message}`);

          setCurriculum(curriculum.map((m) => m.id === tempModuleId ? { ...m, id: moduleUuid } : m));
          return moduleUuid;
        }
      }
    }
    return tempModuleId;
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleDeleteLesson = async (moduleId: string, contentId: string) => {
    const module = curriculum.find(m => m.id === moduleId);
    const contentItem = module?.lessons.find(l => l.id === contentId);
    if (!contentItem || !contentId) return;

    const contentType = 'instructions' in contentItem ? 'quiz' : 'lesson';
    let resolvedModuleId = moduleId;
    try { resolvedModuleId = await resolveModuleId(moduleId); }
    catch (error) { alert(`Error resolving module: ${(error as Error).message}`); return; }

    const itemName = contentType === 'quiz' ? 'quiz' : 'lesson';
    if (!window.confirm(`Are you sure you want to delete this ${itemName}? This action cannot be undone.`)) return;

    try {
      const { error: unlinkError } = await supabase.from("module_content_items").delete()
        .match({ module_id: resolvedModuleId, content_id: contentId, content_type: contentType });
      if (unlinkError) { alert(`Error unlinking ${itemName}: ${unlinkError.message}`); return; }

      const table = contentType === 'lesson' ? 'lessons' : 'quizzes';
      const { error: deletionError } = await supabase.from(table).delete().eq("id", contentId);
      if (deletionError) { alert(`Error deleting ${itemName}: ${deletionError.message}`); return; }

      setCurriculum(curriculum.map((m) =>
        m.id === moduleId ? { ...m, lessons: m.lessons.filter((l) => l.id !== contentId) } : m
      ));
    } catch (err) {
      alert(`An unexpected error occurred while deleting the ${itemName}`);
    }
  };

  const handleAddLesson = async (moduleId: string, newLesson: Lesson) => {
    let resolvedModuleId = moduleId;
    try { 
      resolvedModuleId = await resolveModuleId(moduleId); 
    } catch (error) { 
      alert(`Error resolving module: ${(error as Error).message}`); 
      return; 
    }

    const lessonId = uuidv4();
    
    try {
      const { error: lessonError } = await supabase.from("lessons").insert([{
        id: lessonId, 
        title: newLesson.title || "Untitled Lesson", 
        description: newLesson.description || "",
        content_blocks: newLesson.content_blocks || [],
        estimated_duration_minutes: newLesson.estimated_duration_minutes || 15, 
        is_published: newLesson.is_published || false,
      }]);
      
      if (lessonError) { 
        alert(`Error adding lesson: ${lessonError.message}`); 
        return; 
      }

      const { data: maxPositionData } = await supabase
        .from("module_content_items")
        .select("position")
        .eq("module_id", resolvedModuleId)
        .order("position", { ascending: false })
        .limit(1);
      
      const newPosition = maxPositionData && maxPositionData.length > 0 
        ? maxPositionData[0].position + 1 
        : 0;

      const { error: linkError } = await supabase
        .from("module_content_items")
        .insert([{
          module_id: resolvedModuleId, 
          content_type: "lesson", 
          content_id: lessonId,
          position: newPosition, 
          is_published: newLesson.is_published || false,
        }]);

      if (linkError) {
        await supabase.from("lessons").delete().eq("id", lessonId);
        alert(`Error linking lesson: ${linkError.message}`);
        return;
      }

      const updatedNewLesson: ContentItem = { 
        ...newLesson, 
        id: lessonId, 
        type: 'lesson',
        title: newLesson.title || "Untitled Lesson",
        content_blocks: newLesson.content_blocks || [],
        duration: `${newLesson.estimated_duration_minutes || 15} min`,
        summary: newLesson.summary || "",
      };
      
      setCurriculum(curriculum.map((m) =>
        m.id === moduleId ? { ...m, lessons: [...m.lessons, updatedNewLesson] } : m
      ));
      
    } catch (err) {
      console.error("Error adding lesson:", err);
      alert("An unexpected error occurred while adding the lesson");
    }
  };

  const handleMoveLesson = async (moduleId: string, contentId: string, direction: "up" | "down") => {
    if (!contentId) return;
    const module = curriculum.find(m => m.id === moduleId);
    const contentItem = module?.lessons.find(l => l.id === contentId);
    if (!contentItem) return;

    const contentType = 'instructions' in contentItem ? 'quiz' : 'lesson';
    let resolvedModuleId = moduleId;
    try { resolvedModuleId = await resolveModuleId(moduleId); }
    catch (error) { alert(`Error resolving module: ${(error as Error).message}`); return; }

    try {
      const { data: contentItemsData, error: contentItemsError } = await supabase
        .from("module_content_items").select("id, content_id, position")
        .eq("module_id", resolvedModuleId).eq("content_type", contentType).order("position", { ascending: true });

      if (contentItemsError || !contentItemsData) return;

      const currentItem = contentItemsData.find((item) => item.content_id === contentId);
      if (!currentItem) return;

      const currentPosition = currentItem.position;
      const targetPosition = direction === "up" ? currentPosition - 1 : currentPosition + 1;
      const targetItem = contentItemsData.find((item) => item.position === targetPosition);
      if (!targetItem) return;

      await Promise.all([
        supabase.from("module_content_items").update({ position: targetPosition }).eq("id", currentItem.id),
        supabase.from("module_content_items").update({ position: currentPosition }).eq("id", targetItem.id),
      ]);

      const { data: allContentItemsData } = await supabase
        .from("module_content_items").select("content_id, content_type")
        .eq("module_id", resolvedModuleId).order("position", { ascending: true });

      if (allContentItemsData) {
        const lessonIds = allContentItemsData.filter(i => i.content_type === 'lesson').map(i => i.content_id);
        const quizIds = allContentItemsData.filter(i => i.content_type === 'quiz').map(i => i.content_id);

        let allContent: ContentItem[] = [];
        if (lessonIds.length > 0) {
          const { data: lData } = await supabase.from("lessons").select("*").in("id", lessonIds);
          if (lData) allContent = allContent.concat(lData.map(l => ({ 
            ...l, 
            type: 'lesson' as const,
            duration: `${l.estimated_duration_minutes || 15} min`,
            summary: l.summary || "",
          })));
        }
        if (quizIds.length > 0) {
          const { data: qData } = await supabase.from("quizzes").select("*").in("id", quizIds);
          if (qData) allContent = allContent.concat(qData.map(q => ({ 
            ...q, 
            type: 'quiz' as const,
            duration: "Quiz",
          })));
        }

        const sortedContent = allContentItemsData
          .map(item => allContent.find(c => c.id === item.content_id))
          .filter(Boolean) as ContentItem[];

        setCurriculum(prev => prev.map(m => m.id === moduleId ? { ...m, lessons: sortedContent } : m));
      }
    } catch (err) {
      alert(`An unexpected error occurred while moving the ${contentType}`);
    }
  };

  const handleEditLesson = (moduleId: string, lessonId: string) => {
    const module = curriculum.find((m) => m.id === moduleId);
    const lesson = module?.lessons.find((l) => l.id === lessonId && !('instructions' in l));
    if (lesson) setEditingLesson({ moduleId, lesson: lesson as Lesson });
  };

  const handleEditQuiz = (moduleId: string, lessonId: string, quizId: string) => {
    const fetchAndOpenQuiz = async () => {
      try {
        const { data: quizData, error: quizError } = await supabase
          .from("quizzes").select("*").eq("id", quizId).single();

        if (quizError || !quizData) {
          console.error("Error fetching quiz:", quizError);
          alert("Could not load quiz. Please try again.");
          return;
        }

        const { data: questionsData } = await supabase
          .from("quiz_questions").select("*").eq("quiz_id", quizId).order("position", { ascending: true });

        setEditingQuiz({
          moduleId,
          lessonId,
          quiz: quizData as Quiz,
          questions: questionsData || [],
        });
      } catch (err) {
        console.error("Error opening quiz editor:", err);
      }
    };
    fetchAndOpenQuiz();
  };

  const handleSaveLesson = async (updatedLesson: Lesson) => {
    if (!editingLesson || !updatedLesson.id) return;

    const lessonWithDuration = {
      ...updatedLesson,
      duration: `${updatedLesson.estimated_duration_minutes || 15} min`,
    };

    setEditingLesson({ ...editingLesson, lesson: lessonWithDuration });
    setCurriculum(curriculum.map((mod) =>
      mod.id === editingLesson.moduleId
        ? { 
            ...mod, 
            lessons: mod.lessons.map((l) => l.id === updatedLesson.id ? { ...lessonWithDuration, type: 'lesson' } as ContentItem : l) 
          }
        : mod
    ));

    if (saveLessonTimeoutRef.current) clearTimeout(saveLessonTimeoutRef.current);

    try {
      const { error } = await supabase.from("lessons").upsert({
        id: updatedLesson.id, 
        title: updatedLesson.title, 
        description: updatedLesson.description,
        content_blocks: updatedLesson.content_blocks || [],
        estimated_duration_minutes: updatedLesson.estimated_duration_minutes, 
        is_published: updatedLesson.is_published,
        summary: updatedLesson.summary || "",
      }, { onConflict: "id" });
      
      if (error) throw error;

      await supabase.from("module_content_items").update({ is_published: updatedLesson.is_published })
        .match({ module_id: editingLesson.moduleId, content_id: updatedLesson.id, content_type: "lesson" });
    } catch (err) {
      console.error("Error saving lesson:", err);
    }
  };

  const handleUpdateLessonTitle = async (_moduleId: string, lessonId: string, title: string) => {
    if (!lessonId || lessonId.startsWith('lesson-')) return;

    try {
      const { error } = await supabase
        .from("lessons")
        .update({ title: title, updated_at: new Date().toISOString() })
        .eq("id", lessonId);

      if (error) {
        console.error("Error updating lesson title:", error);
      }
    } catch (err) {
      console.error("Error in handleUpdateLessonTitle:", err);
    }
  };

  const handleUpdateLessonContent = async (_moduleId: string, lessonId: string, contentBlocks: any[]) => {
    if (!lessonId || lessonId.startsWith('lesson-')) return;

    try {
      const { error } = await supabase
        .from("lessons")
        .update({
          content_blocks: contentBlocks, 
          updated_at: new Date().toISOString() 
        })
        .eq("id", lessonId);
      
      if (error) {
        console.error("Error updating lesson content:", error);
      }
    } catch (err) {
      console.error("Error in handleUpdateLessonContent:", err);
    }
  };

  const handleSaveVideoBlock = async (moduleId: string, lessonId: string, videoUrl: string) => {
    try {
      const module = curriculum.find(m => m.id === moduleId);
      const lesson = module?.lessons.find(l => l.id === lessonId);
      
      if (!lesson) {
        console.error("[CourseBuilder] Lesson not found:", lessonId);
        return;
      }

      const currentBlocks = (lesson as any).content_blocks || [];
      const newBlock = {
        id: crypto.randomUUID(),
        type: "video",
        content: videoUrl,
        position: currentBlocks.length,
        title: "",
      };
      const updatedBlocks = [...currentBlocks, newBlock];

      const { error } = await supabase.from("lessons").update({
        content_blocks: updatedBlocks,
        updated_at: new Date().toISOString(),
      }).eq("id", lessonId);

      if (error) {
        console.error("[CourseBuilder] Error saving video block:", error);
        alert(`Failed to save video: ${error.message}`);
      }
    } catch (err) {
      console.error("[CourseBuilder] Error saving video block:", err);
    }
  };

  const handleAddModule = async () => {
    try {
      const position = curriculum.length;
      const { data, error } = await supabase.from('modules').insert({
        course_id: courseId, title: `Module ${position + 1}`,
        position, is_published: false, is_sequential: false,
      }).select().single();

      if (error) throw error;
      if (data) setCurriculum([...curriculum, { ...data, lessons: [] }]);
    } catch (error) {
      console.error("Error creating module:", error);
      alert("Failed to create module");
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    try {
      if (moduleId.startsWith('module-')) {
        setCurriculum(curriculum.filter(m => m.id !== moduleId));
        return;
      }
      const { error } = await supabase.from('modules').delete().eq('id', moduleId);
      if (error) throw error;
      setCurriculum(curriculum.filter(m => m.id !== moduleId));
    } catch (error) {
      console.error("Error deleting module:", error);
      alert("Failed to delete module");
    }
  };

  const handleAddQuiz = async (_moduleId: string) => {
    let resolvedModuleId = _moduleId;
    try { resolvedModuleId = await resolveModuleId(_moduleId); } catch (e) { return; }

    const newQuiz: Quiz = {
      id: uuidv4(), title: "New Quiz", description: "", instructions: "",
      passing_score: 70, time_limit_minutes: 30, max_attempts: 3,
      requires_manual_grading: false, is_published: false,
      late_submission_allowed: true, late_penalty_percent: 10,
    };

    try {
      const { error: quizError } = await supabase.from("quizzes").insert([newQuiz]);
      if (quizError) throw quizError;

      const { data: maxPositionData } = await supabase.from("module_content_items")
        .select("position").eq("module_id", resolvedModuleId).order("position", { ascending: false }).limit(1);
      const newPosition = maxPositionData && maxPositionData.length > 0 ? maxPositionData[0].position + 1 : 0;

      await supabase.from("module_content_items").insert([{
        module_id: resolvedModuleId, content_type: "quiz", content_id: newQuiz.id,
        position: newPosition, is_published: newQuiz.is_published,
      }]);

      const newQuizItem: ContentItem = { ...newQuiz, type: 'quiz', duration: "Quiz" };
      setCurriculum(curriculum.map((m) => m.id === _moduleId ? { ...m, lessons: [...m.lessons, newQuizItem] } : m));
      setEditingQuiz({ moduleId: _moduleId, lessonId: "", quiz: newQuiz, questions: [] });
    } catch (err) {
      alert("Error adding quiz");
    }
  };

  const handleCreateQuizWithTitle = async (moduleId: string, _lessonId: string, quizTitle: string): Promise<string> => {
    let resolvedModuleId = moduleId;
    try { resolvedModuleId = await resolveModuleId(moduleId); } catch (e) { throw new Error("Failed to resolve module"); }

    const quizId = uuidv4();

    const newQuiz: Quiz = {
      id: quizId, title: quizTitle, description: "", instructions: "",
      passing_score: 70, time_limit_minutes: 30, max_attempts: 3,
      requires_manual_grading: false, is_published: false,
      late_submission_allowed: true, late_penalty_percent: 10,
    };

    const { error: quizError } = await supabase.from("quizzes").insert([newQuiz]);
    if (quizError) throw new Error(quizError.message);

    return quizId;
  };

  const handleSaveQuiz = async (updatedQuiz: Quiz) => {
    if (!editingQuiz || !updatedQuiz.id) return;
    try {
      const { type, ...quizDataToSave } = updatedQuiz as any;
      const { error } = await supabase.from("quizzes").upsert(quizDataToSave, { onConflict: "id" });
      if (error) throw error;

      await supabase.from("module_content_items").update({ is_published: updatedQuiz.is_published })
        .match({ module_id: editingQuiz.moduleId, content_id: updatedQuiz.id, content_type: "quiz" });

      setCurriculum(curriculum.map((mod) =>
        mod.id === editingQuiz.moduleId
          ? { ...mod, lessons: mod.lessons.map((l) => l.id === updatedQuiz.id ? { ...updatedQuiz, type: 'quiz', duration: "Quiz" } as ContentItem : l) }
          : mod
      ));
      setEditingQuiz({ ...editingQuiz, quiz: updatedQuiz });
    } catch (err) {
      console.error("Error saving quiz:", err);
      alert("Error saving quiz");
    }
  };

  const handleSaveQuizQuestions = async (updatedQuestions: QuizQuestion[]) => {
    if (!editingQuiz) return;

    setEditingQuiz({ ...editingQuiz, questions: updatedQuestions });

    if (saveQuizQuestionsTimeoutRef.current) clearTimeout(saveQuizQuestionsTimeoutRef.current);

    saveQuizQuestionsTimeoutRef.current = setTimeout(async () => {
      try {
        const questionsToSave = updatedQuestions.map((q, index) => ({
          ...q, quiz_id: editingQuiz.quiz.id, position: index,
        }));

        const { error } = await supabase.from("quiz_questions").upsert(questionsToSave, { onConflict: 'id' });
        if (error) throw error;

        const currentIds = updatedQuestions.map(q => q.id).filter(Boolean);
        if (currentIds.length > 0) {
          await supabase.from("quiz_questions").delete()
            .eq('quiz_id', editingQuiz.quiz.id)
            .not('id', 'in', `(${currentIds.join(',')})`);
        } else if (updatedQuestions.length === 0) {
          await supabase.from("quiz_questions").delete().eq('quiz_id', editingQuiz.quiz.id);
        }
      } catch (err) {
        console.error("Error saving quiz questions:", err);
      }
    }, 1000);
  };

  const handleCloseQuizEditor = () => setEditingQuiz(null);

  const handlePublish = async () => {
    try {
        const { error } = await supabase.from('courses').update({
            verification_status: 'pending_review', // ← CHANGED from 'approved'
            visibility: 'public', 
            updated_at: new Date().toISOString(),
        }).eq('id', courseId);
        
        if (error) throw error;
        
        setVerificationStatus('pending_review'); // ← Update local state
        setCourseStatus("draft"); // ← Keep as draft until actually approved
        
        alert("Course submitted for admin review! It will be visible to students once approved.");
    } catch (error: any) {
        alert(`Failed to submit for review: ${error.message}`);
    }
};

  const handleUnpublish = async () => {
    try {
      const { error } = await supabase.from('courses').update({
        verification_status: 'draft',
        visibility: 'private',
        updated_at: new Date().toISOString(),
      }).eq('id', courseId);
      
      if (error) throw error;
      
      setVerificationStatus('draft');
      setCourseStatus("draft");
      alert("Course Unpublished. Students can no longer access the course.");
    } catch (error: any) {
      alert(`Failed to unpublish: ${error.message}`);
    }
  };

  const handleSavePricing = async () => {
    if (!courseId) return;
    const { error } = await supabase.from('courses').update({
      price: pricing.mode === 'free' ? 0 : pricing.price,
      updated_at: new Date().toISOString(),
    }).eq('id', courseId);
    if (error) throw error;
  };

  const handleSubmitForReview = async () => {
    try {
      // Check if course has required content before submitting
      if (!settings.title.trim()) {
        alert("Please add a course title before submitting for review.");
        return;
      }
      
      if (curriculum.length === 0) {
        alert("Please add at least one module before submitting for review.");
        return;
      }
      
      const hasLessons = curriculum.some(m => m.lessons && m.lessons.length > 0);
      if (!hasLessons) {
        alert("Please add at least one lesson or quiz before submitting for review.");
        return;
      }
      
      const { error } = await supabase.from('courses').update({
        verification_status: 'pending_review',
        updated_at: new Date().toISOString(),
      }).eq('id', courseId);
      
      if (error) throw error;
      
      setVerificationStatus('pending_review');
      alert("Course submitted for review successfully! The admin will review your course and notify you once approved.");
    } catch (error: any) {
      alert(`Failed to submit: ${error.message}`);
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseId) return;
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;
    try {
      const { data: mods } = await supabase.from('modules').select('id').eq('course_id', courseId);
      const modIds = (mods || []).map((m: any) => m.id);
      if (modIds.length > 0) {
        await supabase.from('module_content_items').delete().in('module_id', modIds);
        await supabase.from('modules').delete().in('id', modIds);
      }
      await supabase.from('enrollments').delete().eq('course_id', courseId);
      await supabase.from('reviews').delete().eq('course_id', courseId);
      await supabase.from('course_learning_objectives').delete().eq('course_id', courseId);
      await supabase.from('course_topics').delete().eq('course_id', courseId);
      await supabase.from('course_inclusions').delete().eq('course_id', courseId);
      await supabase.from('live_sessions').delete().eq('course_id', courseId);

      const { error } = await supabase.from('courses').delete().eq('id', courseId);
      if (error) throw error;
      navigate('/coach/courses');
    } catch (error) {
      alert('Failed to delete course. Please try again.');
    }
  };

  const handleSaveSettings = async () => {
    if (!courseId) return;
    try {
      let categoryId = null;
      if (settings.category) {
        const { data: catData } = await supabase.from("categories").select("id").eq("name", settings.category).single();
        if (catData) categoryId = catData.id;
      }

      await supabase.from("courses").update({
        title: settings.title,
        subtitle: settings.subtitle,
        short_description: settings.shortDescription,
        long_description: settings.longDescription,
        visibility: settings.visibility,
        language: settings.language,
        category_id: categoryId,
        level: settings.level,
        updated_at: new Date().toISOString(),
      }).eq("id", courseId);

      // Only set to published if verification is approved
      if (verificationStatus === 'approved' && settings.visibility === 'public') {
        setCourseStatus("published");
      } else {
        setCourseStatus("draft");
      }
      
      alert("Settings saved successfully");
    } catch (error) {
      alert("Failed to save settings");
    }
  };

  const handleSaveDrip = async () => {
    try {
      const updates = drip.map(async (dripModule) => {
        const { error } = await supabase.from("modules").update({
          drip_mode: dripModule.mode,
          drip_days: dripModule.daysAfter,
          drip_date: dripModule.specificDate,
        }).eq("id", dripModule.moduleId);
        if (error) throw error;
      });
      await Promise.all(updates);
      alert("Drip schedule saved successfully!");
    } catch (error) {
      console.error("Error saving drip schedule:", error);
      alert("Failed to save drip schedule");
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case "settings":
        return (
          <CourseSettingsForm
            settings={settings}
            onChange={setSettings}
            onSave={handleSaveSettings}
            onDelete={async () => setIsDeleteModalOpen(true)}
          />
        );
      case "curriculum":
        return (
          <CurriculumEditor
            curriculum={curriculum}
            onChange={handleCurriculumChange}
            onEditLesson={handleEditLesson}
            onEditQuiz={handleEditQuiz}
            onCreateQuiz={handleCreateQuizWithTitle}
            onAddLesson={handleAddLesson}
            onDeleteLesson={handleDeleteLesson}
            onMoveLesson={handleMoveLesson}
            onAddModule={handleAddModule}
            onDeleteModule={handleDeleteModule}
            onUpdateLessonTitle={handleUpdateLessonTitle}
            onUpdateLessonContent={handleUpdateLessonContent}
            onSaveVideoBlock={handleSaveVideoBlock}
          />
        );
      case "live-sessions":
        return <LiveSessionManager />;
      case "drip":
        return <DripSchedulePanel modules={drip} onChange={setDrip} onSave={handleSaveDrip} />;
      case "pricing":
        return <CoursePricingForm pricing={pricing} onChange={setPricing} onSave={handleSavePricing} />;
      case "goals":
        return <CourseGoalsPanel courseId={courseId!} />;
     case "publish":
    return (
        <CoursePublishWorkflow
            courseStatus={courseStatus}
            verificationStatus={verificationStatus} // ← ADD THIS PROP
            adminFeedback={adminFeedback}
            onPublish={handlePublish}
            onUnpublish={handleUnpublish}
            onSubmitForReview={handleSubmitForReview}
            hasTitle={!!settings.title.trim()}
            hasModules={curriculum.length > 0}
            hasLessons={curriculum.some(m => m.lessons && m.lessons.length > 0)}
            hasPricing={pricing.mode === 'free' || pricing.price > 0}
        />
    );
      case "preview":
        return (
          <CoursePreviewPane
            courseTitle={settings.title}
            courseSubtitle={settings.subtitle}
            courseDescription={settings.longDescription}
            instructorName={instructorName}
          />
        );
      default:
        return null;
    }
  };

  return (
    <CoachAppLayout>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate("/coach/courses")}
            className="text-sm text-slate-600 dark:text-dark-text-secondary hover:text-slate-900 dark:hover:text-dark-text-primary transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to courses
          </button>
        </div>

        <div className="flex gap-6">
          <CourseBuilderSidebar
            activeSection={activeSection}
            onChangeSection={(section) => setActiveSection(section as SectionKey)}
            courseTitle={settings.title || "Untitled course"}
            courseStatus={courseStatus}
          />
          <div className="flex-1">
            <div className="bg-white dark:bg-dark-background-card rounded-3xl shadow-lg p-8">
              {renderSection()}
            </div>
          </div>
        </div>
      </div>

      {editingLesson && (
        <LessonEditorPanel
          lesson={editingLesson.lesson}
          onChange={handleSaveLesson}
          onClose={() => setEditingLesson(null)}
        />
      )}

      {editingQuiz && (
        <QuizEditorPanel
          quiz={editingQuiz.quiz}
          questions={editingQuiz.questions}
          onChange={handleSaveQuiz}
          onQuestionsChange={handleSaveQuizQuestions}
          onClose={handleCloseQuizEditor}
        />
      )}

      <DeleteCourseModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteCourse}
        courseName={settings.title}
      />
    </CoachAppLayout>
  );
};

export default CourseBuilder;