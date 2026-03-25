import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import LessonSidebar from '../../components/learning/LessonSidebar';
import ContentBlockRenderer from '../../components/learning/ContentBlockRenderer';
import DownloadCenter from '../../components/learning/DownloadCenter';
import LessonNotesPanel from '../../components/learning/LessonNotesPanel';
import AISummaryDrawer from '../../components/learning/AISummaryDrawer';
import AskAIWidget from '../../components/learning/AskAIWidget';
import MarkLessonCompleteModal from '../../components/learning/MarkLessonCompleteModal';
import type { Lesson } from '../../types/lesson';

type LessonWithModule = Lesson & { moduleTitle?: string };

interface FlatItem {
  id: string;
  type: 'lesson' | 'quiz';
}

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

  const handleMarkComplete = async () => {
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
  };

  // Show graduation banner when all lessons are complete
  useEffect(() => {
    if (totalLessonsInCourse > 0 && completedLessons.length >= totalLessonsInCourse) {
      setShowGraduation(true);
    }
  }, [completedLessons, totalLessonsInCourse]);

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
              <span>Lesson {lessonId}</span>
              <span>•</span>
              <span>{currentLesson.estimated_duration_minutes} min</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-[#F5F7FF] dark:bg-gray-800 rounded-full">
              <span className="text-sm font-medium text-brand-primary">{progress}% complete</span>
            </div>
            <button
              onClick={() => setShowCompleteModal(true)}
              disabled={completedLessons.includes(lessonId || '')}
              className="px-5 py-2 bg-gradient-to-r from-brand-primary to-brand-primary-light text-white text-sm font-medium rounded-full shadow-button-primary hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {completedLessons.includes(lessonId || '') ? '✓ Completed' : 'Mark as complete'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="flex gap-6">
          {/* Left: Lesson Sidebar */}
          <aside className="w-80 flex-shrink-0">
            <LessonSidebar
              courseId={courseId || ''}
              activeLessonId={lessonId || ''}
              onSelectLesson={handleSelectLesson}
              completedLessonIds={completedLessons}
              completedQuizIds={completedQuizIds}
            />
          </aside>

          {/* Center: Main Content */}
          <div className="flex-1 min-w-0">
            {/* Render content blocks (lessons store all content as content_blocks jsonb) */}
            <div className="bg-white dark:bg-dark-background-card rounded-2xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
              <ContentBlockRenderer contentBlocks={currentLesson.content_blocks || []} />
            </div>

            {/* Next / Previous Navigation */}
            <div className="flex items-center justify-between mt-4">
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
          </div>

          {/* Right: Secondary Panels */}
          <aside className="w-80 flex-shrink-0 space-y-4">
            <DownloadCenter resources={[]} />
            <LessonNotesPanel activeLessonId={lessonId || ''} />
            <AskAIWidget activeLessonId={lessonId || ''} />

            {/* AI Summary Button */}
            <button
              onClick={() => setShowAIDrawer(true)}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-full hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <span>✨</span> View AI Summary
            </button>
          </aside>
        </div>
      </div>

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
