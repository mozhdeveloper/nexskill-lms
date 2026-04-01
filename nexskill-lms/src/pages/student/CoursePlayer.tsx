import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import LessonSidebar from '../../components/learning/LessonSidebar';
import ContentBlockRenderer from '../../components/learning/ContentBlockRenderer';
import StudentContentRenderer from '../../components/learning/StudentContentRenderer';
import DownloadCenter from '../../components/learning/DownloadCenter';
import LessonNotesPanel from '../../components/learning/LessonNotesPanel';
import AISummaryDrawer from '../../components/learning/AISummaryDrawer';
import AskAIWidget from '../../components/learning/AskAIWidget';
import MarkLessonCompleteModal from '../../components/learning/MarkLessonCompleteModal';
import type { Lesson } from '../../types/lesson';
import type { LessonContentItem } from '../../types/lesson-content-item';
import { fetchLessonContentItems } from '../../lib/supabase/lesson-content.queries';

type LessonWithModule = Lesson & { moduleTitle?: string };

interface FlatItem {
  id: string;
  type: 'lesson' | 'quiz';
}

type BottomTab = 'downloads' | 'notes' | 'ask-ai' | 'ai-summary';

const CoursePlayer: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const [showAIDrawer, setShowAIDrawer] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showGraduation, setShowGraduation] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [completedQuizIds, setCompletedQuizIds] = useState<string[]>([]);
  const [totalLessonsInCourse, setTotalLessonsInCourse] = useState(0);
  const [courseTitle, setCourseTitle] = useState('');
  const [currentLesson, setCurrentLesson] = useState<LessonWithModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flatItemList, setFlatItemList] = useState<FlatItem[]>([]);
  const [lessonContentItems, setLessonContentItems] = useState<LessonContentItem[]>([]);

  // New state: active bottom tab
  const [activeTab, setActiveTab] = useState<BottomTab | null>(null);

  useEffect(() => {
    const fetchLessonData = async () => {
      if (!courseId || !lessonId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch course title
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('title')
          .eq('id', courseId)
          .single();

        if (courseError) throw courseError;
        setCourseTitle(courseData.title);

        // Fetch lesson data including content_blocks
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select('id, title, description, content_blocks, estimated_duration_minutes, is_published, created_at, updated_at')
          .eq('id', lessonId)
          .single();

        if (lessonError) throw lessonError;

        // Also fetch module information for the lesson
        const { data: moduleData, error: moduleError } = await supabase
          .from('module_content_items')
          .select(`
            module_id,
            modules(title)
          `)
          .eq('content_id', lessonId)
          .eq('content_type', 'lesson')
          .single();

        if (moduleError) throw moduleError;

        const lessonWithModule = {
          ...lessonData,
          moduleTitle: (moduleData.modules as unknown as { title: string } | null)?.title || ''
        };

        setCurrentLesson(lessonWithModule);

        // Fetch content items for this lesson
        try {
          const contentItems = await fetchLessonContentItems(lessonId);
          setLessonContentItems(contentItems);
        } catch (contentError) {
          console.error('Error fetching lesson content items:', contentError);
          setLessonContentItems([]);
        }

        // Fetch completed lessons using user_lesson_progress
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Get all modules for this course
          const { data: mods } = await supabase
            .from('modules')
            .select('id, position')
            .eq('course_id', courseId)
            .eq('is_published', true)
            .order('position', { ascending: true });

          const moduleIds = (mods || []).map((m: any) => m.id);

          if (moduleIds.length > 0) {
            const { data: contentItems } = await supabase
              .from('module_content_items')
              .select('module_id, content_id, content_type, position')
              .in('module_id', moduleIds)
              .eq('is_published', true)
              .order('position', { ascending: true });

            // Build flat ordered item list (modules ordered by position, items within by position)
            const moduleOrder = new Map((mods || []).map((m: any, i: number) => [m.id, i]));
            const sorted = [...(contentItems || [])].sort((a, b) => {
              const modDiff = (moduleOrder.get(a.module_id) ?? 0) - (moduleOrder.get(b.module_id) ?? 0);
              return modDiff !== 0 ? modDiff : a.position - b.position;
            });
            setFlatItemList(sorted.map((ci) => ({ id: ci.content_id, type: ci.content_type as 'lesson' | 'quiz' })));

            const lessonIds = sorted.filter((ci) => ci.content_type === 'lesson').map((ci) => ci.content_id);
            const quizIdsInCourse = sorted.filter((ci) => ci.content_type === 'quiz').map((ci) => ci.content_id);

            setTotalLessonsInCourse(lessonIds.length);

            // Fetch lesson completion
            if (lessonIds.length > 0) {
              const { data: progressRows } = await supabase
                .from('user_lesson_progress')
                .select('lesson_id')
                .eq('user_id', user.id)
                .eq('is_completed', true)
                .in('lesson_id', lessonIds);
              setCompletedLessons((progressRows || []).map((r: any) => r.lesson_id));
            }

            // Fetch quiz completion
            if (quizIdsInCourse.length > 0) {
              const { data: quizRows } = await supabase
                .from('quiz_attempts')
                .select('quiz_id')
                .eq('user_id', user.id)
                .eq('passed', true)
                .in('quiz_id', quizIdsInCourse);
              setCompletedQuizIds([...new Set((quizRows || []).map((r: any) => r.quiz_id))]);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching lesson data:', err);
        setError('Failed to load lesson data');
      } finally {
        setLoading(false);
      }
    };

    fetchLessonData();
  }, [courseId, lessonId]);

  // Calculate lesson number (1-based index of lessons only)
  const lessonNumber = flatItemList
    .filter(item => item.type === 'lesson')
    .findIndex(item => item.id === lessonId) + 1;

  // Calculate progress based on completed lessons
  const progress = totalLessonsInCourse > 0
    ? Math.min(100, Math.round((completedLessons.length / totalLessonsInCourse) * 100))
    : 0;

  const handleSelectLesson = (newLessonId: string) => {
    // Check if this is a quiz or a lesson
    const item = flatItemList.find((i) => i.id === newLessonId);
    if (item?.type === 'quiz') {
      navigate(`/student/courses/${courseId}/quizzes/${newLessonId}/take`);
    } else {
      navigate(`/student/courses/${courseId}/lessons/${newLessonId}`);
    }
  };

  // Next / Previous navigation helpers
  const currentIndex = flatItemList.findIndex((i) => i.id === lessonId);
  const prevItem = currentIndex > 0 ? flatItemList[currentIndex - 1] : null;
  const nextItem = currentIndex >= 0 && currentIndex < flatItemList.length - 1 ? flatItemList[currentIndex + 1] : null;

  const navigateToItem = (item: FlatItem) => {
    if (item.type === 'quiz') {
      navigate(`/student/courses/${courseId}/quizzes/${item.id}/take`);
    } else {
      navigate(`/student/courses/${courseId}/lessons/${item.id}`);
    }
  };

  const handleMarkComplete = useCallback(async () => {
    if (!lessonId || !courseId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upsert into user_lesson_progress
      const { error } = await supabase
        .from('user_lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          is_completed: true,
          completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,lesson_id' });

      if (error) throw error;

      // Optimistically update local state
      setCompletedLessons(prev => prev.includes(lessonId) ? prev : [...prev, lessonId]);
      setShowCompleteModal(false);
    } catch (err) {
      console.error('Error marking lesson as complete:', err);
      alert('Failed to mark lesson as complete. Please try again.');
    }
  }, [lessonId, courseId]);

  // Callback for video completion - refreshes the completed lessons list
  const handleVideoComplete = useCallback(() => {
    console.log('[CoursePlayer] Video complete - refreshing completion status');

    // Re-fetch completed lessons to update UI (background refresh)
    const refreshCompletedLessons = async () => {
      if (!courseId) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all modules for this course
      const { data: mods } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', courseId)
        .eq('is_published', true);

      const moduleIds = (mods || []).map((m: any) => m.id);

      if (moduleIds.length > 0) {
        const { data: contentItems } = await supabase
          .from('module_content_items')
          .select('content_id, content_type')
          .in('module_id', moduleIds)
          .eq('content_type', 'lesson');

        const lessonIds = (contentItems || []).map((ci: any) => ci.content_id);

        if (lessonIds.length > 0) {
          const { data: progressRows } = await supabase
            .from('user_lesson_progress')
            .select('lesson_id')
            .eq('user_id', user.id)
            .eq('is_completed', true)
            .in('lesson_id', lessonIds);

          setCompletedLessons((progressRows || []).map((r: any) => r.lesson_id));
          console.log('[CoursePlayer] Completed lessons updated:', progressRows);
        }
      }
    };

    refreshCompletedLessons();
  }, [courseId, lessonId, completedLessons]);

  // NEW: Handle individual content item completion
  // Only videos and quizzes count toward lesson completion
  // Text/notes/documents are "supplementary" and don't block completion
  // EXCEPTION: If lesson has ONLY text/notes (no videos/quizzes), viewing it auto-completes the lesson
  const handleContentItemComplete = useCallback(async (completedContentItemId: string) => {
    console.log('[CoursePlayer] Content item completed:', completedContentItemId);

    if (!courseId || !lessonId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get ALL content items for this lesson
    const { data: allContentItems } = await supabase
      .from('lesson_content_items')
      .select('id, content_type')
      .eq('lesson_id', lessonId);

    if (!allContentItems || allContentItems.length === 0) {
      console.log('[CoursePlayer] No content items found for this lesson');
      return;
    }

    console.log('[CoursePlayer] All content items:', allContentItems);

    // Filter to only "required" content types (videos and quizzes)
    const requiredItems = allContentItems.filter(
      (item: any) => item.content_type === 'video' || item.content_type === 'quiz'
    );

    console.log('[CoursePlayer] Required content items (videos/quizzes):', requiredItems);

    // SPECIAL CASE: If no required items (only text/notes/documents), auto-complete lesson
    if (requiredItems.length === 0) {
      console.log('[CoursePlayer] Lesson has only supplementary content (text/notes/docs) - auto-completing');
      
      const { error } = await supabase
        .from('user_lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          is_completed: true,
          completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,lesson_id' });

      if (error) {
        console.error('[CoursePlayer] Error auto-completing lesson:', error);
      } else {
        console.log('[CoursePlayer] Lesson auto-completed (supplementary-only content)!');
        setCompletedLessons(prev => prev.includes(lessonId) ? prev : [...prev, lessonId]);
      }
      return;
    }

    // Get completed REQUIRED content items for this lesson
    const { data: completedItems } = await supabase
      .from('lesson_content_item_progress')
      .select('content_item_id')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .eq('is_completed', true);

    const completedIds = new Set((completedItems || []).map((item: any) => item.content_item_id));
    console.log('[CoursePlayer] Completed content items:', completedIds.size);

    // Check if ALL REQUIRED content items are completed
    const allRequiredCompleted = requiredItems.every((item: any) => completedIds.has(item.id));

    console.log('[CoursePlayer] All required items completed?', allRequiredCompleted);

    if (allRequiredCompleted) {
      console.log('[CoursePlayer] All required content items completed! Marking lesson as complete...');

      // Mark lesson as complete in user_lesson_progress
      const { error } = await supabase
        .from('user_lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          is_completed: true,
          completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,lesson_id' });

      if (error) {
        console.error('[CoursePlayer] Error marking lesson complete:', error);
      } else {
        console.log('[CoursePlayer] Lesson marked as complete!');
        // Update UI
        setCompletedLessons(prev => prev.includes(lessonId) ? prev : [...prev, lessonId]);
      }
    } else {
      const remaining = requiredItems.filter((item: any) => !completedIds.has(item.id));
      console.log('[CoursePlayer] Required items remaining:', remaining.length);
    }
  }, [courseId, lessonId]);
  // Show graduation banner when all lessons are complete
  useEffect(() => {
    if (totalLessonsInCourse > 0 && completedLessons.length >= totalLessonsInCourse) {
      setShowGraduation(true);
    }
  }, [completedLessons, totalLessonsInCourse]);

  // Handle AI Summary tab — opens drawer instead of inline panel
  const handleTabClick = (tab: BottomTab) => {
    if (tab === 'ai-summary') {
      setShowAIDrawer(true);
      return;
    }
    setActiveTab(prev => prev === tab ? null : tab);
  };

  const bottomTabs: { id: BottomTab; label: string; icon: string }[] = [
    { id: 'downloads', label: 'Downloads', icon: '📥' },
    { id: 'notes', label: 'Notes', icon: '📝' },
    { id: 'ask-ai', label: 'Ask AI', icon: '🤖' },
    { id: 'ai-summary', label: 'AI Summary', icon: '✨' },
  ];

  if (loading) {
    return (
      <StudentAppLayout>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-2">Loading lesson...</h2>
            <p className="text-text-secondary dark:text-dark-text-secondary">Please wait while we load your content.</p>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  if (error) {
    return (
      <StudentAppLayout>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-2">Error loading lesson</h2>
            <p className="text-text-secondary dark:text-dark-text-secondary mb-6">{error}</p>
            <button
              onClick={() => navigate('/student/courses')}
              className="px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-primary-light text-white font-medium rounded-full hover:shadow-lg transition-all"
            >
              Back to courses
            </button>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  if (!currentLesson) {
    return (
      <StudentAppLayout>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-2">Lesson not found</h2>
            <p className="text-text-secondary dark:text-dark-text-secondary mb-6">The lesson you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/student/courses')}
              className="px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-primary-light text-white font-medium rounded-full hover:shadow-lg transition-all"
            >
              Back to courses
            </button>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  return (
    <StudentAppLayout>
      {/* Header */}
      <div className="px-8 py-4 border-b border-[#EDF0FB] dark:border-gray-700">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-text-primary dark:text-dark-text-primary mb-1">{courseTitle}</h1>
            <h2 className="text-lg text-text-secondary dark:text-dark-text-secondary mb-2">{currentLesson.title}</h2>
            <div className="flex items-center gap-4 text-sm text-text-muted dark:text-dark-text-muted">
              <span>{currentLesson.moduleTitle ?? ''}</span>
              <span>•</span>
              <span>Lesson {lessonNumber > 0 ? lessonNumber : 1}</span>
              <span>•</span>
              <span>{currentLesson.estimated_duration_minutes} min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content — Udemy-style 2-column layout */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="flex gap-6 h-full">

          {/* Left: Main content area (expanded) */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">

            {/* Content renderer — larger, more padded */}
            <div className="bg-white dark:bg-dark-background-card rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
              {lessonContentItems && lessonContentItems.length > 0 ? (
                <StudentContentRenderer
                  contentItems={lessonContentItems}
                  lessonId={lessonId || ''}
                  onQuizClick={(quizId) => navigate(`/student/courses/${courseId}/quizzes/${quizId}/take`)}
                  onContentItemComplete={handleContentItemComplete}
                  onVideoComplete={handleVideoComplete}
                />
              ) : (
                <ContentBlockRenderer
                  contentBlocks={currentLesson.content_blocks || []}
                  lessonId={lessonId || ''}
                  onQuizClick={(quizId) => navigate(`/student/courses/${courseId}/quizzes/${quizId}/take`)}
                  onVideoComplete={handleVideoComplete}
                />
              )}
            </div>

            {/* Next / Previous Navigation */}
            <div className="flex items-center justify-between">
              {prevItem ? (
                <button
                  onClick={() => navigateToItem(prevItem)}
                  className="px-5 py-2.5 text-sm font-medium text-text-secondary dark:text-dark-text-secondary border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  ← Previous {prevItem.type === 'quiz' ? 'Quiz' : 'Lesson'}
                </button>
              ) : <div />}
              {nextItem ? (
                <button
                  onClick={() => navigateToItem(nextItem)}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-brand-primary to-brand-primary-light rounded-full shadow-button-primary hover:shadow-lg hover:scale-[1.02] transition-all"
                >
                  Next {nextItem.type === 'quiz' ? 'Quiz' : 'Lesson'} →
                </button>
              ) : <div />}
            </div>

            {/* Bottom tools section — horizontal tab bar */}
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
              {/* Tab headers */}
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                {bottomTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-all duration-300 ease-in-out
                      ${activeTab === tab.id
                        ? 'text-brand-primary border-b-2 border-brand-primary bg-[#F5F7FF] dark:bg-gray-800'
                        : 'text-text-secondary dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                  >
                    <span>{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Active tab content — smooth transition */}
              {activeTab && activeTab !== 'ai-summary' && (
                <div
                  className="p-6 transition-all duration-300 ease-in-out"
                  style={{ animation: 'fadeSlideIn 0.3s ease forwards' }}
                >
                  {activeTab === 'downloads' && (
                    <DownloadCenter resources={[]} />
                  )}
                  {activeTab === 'notes' && (
                    <LessonNotesPanel activeLessonId={lessonId || ''} />
                  )}
                  {activeTab === 'ask-ai' && (
                    <AskAIWidget activeLessonId={lessonId || ''} />
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Right: Course content sidebar (Udemy-style, full height, sticky) */}
          <aside className="w-80 xl:w-96 flex-shrink-0 h-[calc(100vh-200px)] sticky top-4 overflow-y-auto rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 shadow-sm
            [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-gray-300
            dark:[&::-webkit-scrollbar-thumb]:bg-gray-700
            [&::-webkit-scrollbar-thumb]:rounded-full">
            <LessonSidebar
              courseId={courseId || ''}
              activeLessonId={lessonId || ''}
              onSelectLesson={handleSelectLesson}
              completedLessonIds={completedLessons}
              completedQuizIds={completedQuizIds}
            />
          </aside>

        </div>
      </div>

      {/* Inline fade-slide animation for tab content */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* AI Summary Drawer */}
      <AISummaryDrawer
        isOpen={showAIDrawer}
        onClose={() => setShowAIDrawer(false)}
        lessonTitle={currentLesson.title}
      />

      {/* Mark Complete Modal */}
      <MarkLessonCompleteModal
        isOpen={showCompleteModal}
        lessonTitle={currentLesson.title}
        onConfirm={handleMarkComplete}
        onCancel={() => setShowCompleteModal(false)}
      />

      {/* Graduation Banner */}
      {showGraduation && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl shadow-2xl p-5 flex items-start gap-4">
            <span className="text-3xl flex-shrink-0">🎓</span>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-lg mb-1">Course Complete!</div>
              <div className="text-sm text-green-100 mb-3">
                You've completed all lessons in <span className="font-semibold">{courseTitle}</span>. Your certificate is ready!
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/student/certificates/${courseId}`)}
                  className="px-4 py-1.5 bg-white text-green-700 font-semibold rounded-full text-sm hover:bg-green-50 transition-colors"
                >
                  Get Certificate
                </button>
                <button
                  onClick={() => setShowGraduation(false)}
                  className="px-4 py-1.5 bg-green-700/40 text-white font-medium rounded-full text-sm hover:bg-green-700/60 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </StudentAppLayout>
  );
};

export default CoursePlayer;