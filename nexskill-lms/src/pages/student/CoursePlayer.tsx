import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import LessonSidebar from '../../components/learning/LessonSidebar';
import VideoPlayer from '../../components/learning/VideoPlayer';
import PdfReader from '../../components/learning/PdfReader';
import ContentBlockRenderer from '../../components/learning/ContentBlockRenderer';
import DownloadCenter from '../../components/learning/DownloadCenter';
import LessonNotesPanel from '../../components/learning/LessonNotesPanel';
import TranscriptPanel from '../../components/learning/TranscriptPanel';
import AISummaryDrawer from '../../components/learning/AISummaryDrawer';
import AskAIWidget from '../../components/learning/AskAIWidget';
import MarkLessonCompleteModal from '../../components/learning/MarkLessonCompleteModal';
import type { Lesson } from '../../types/lesson';

const CoursePlayer: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const [showAIDrawer, setShowAIDrawer] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [courseTitle, setCourseTitle] = useState('');
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          .select('id, title, description, content_blocks, estimated_duration_minutes, is_published, created_at, updated_at, type')
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
          moduleTitle: moduleData.modules?.title || ''
        };

        setCurrentLesson(lessonWithModule);

        // Fetch completed lessons for this course
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('enrollments')
          .select('completed_lessons')
          .eq('course_id', courseId)
          .single(); // Assuming single enrollment record per student per course

        if (enrollmentError) {
          // If no enrollment found, initialize with empty array
          setCompletedLessons([]);
        } else {
          setCompletedLessons(enrollmentData.completed_lessons || []);
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
  const progress = currentLesson ? Math.round((completedLessons.length / 1) * 100) : 0; // Simplified for now

  const handleSelectLesson = (newLessonId: string) => {
    navigate(`/student/courses/${courseId}/lessons/${newLessonId}`);
  };

  const handleMarkComplete = async () => {
    if (!lessonId || !courseId) return;

    try {
      // Add lesson to completed lessons
      const updatedCompletedLessons = [...completedLessons, lessonId];
      setCompletedLessons(updatedCompletedLessons);

      // Update in Supabase
      const { error } = await supabase
        .from('enrollments')
        .upsert({
          course_id: courseId,
          completed_lessons: updatedCompletedLessons,
          enrollment_date: new Date().toISOString(),
          status: 'active'
        }, { onConflict: ['course_id'] }); // Assuming one enrollment per course

      if (error) throw error;

      setShowCompleteModal(false);
      alert('✓ Lesson marked as complete!');
    } catch (err) {
      console.error('Error marking lesson as complete:', err);
      alert('Failed to mark lesson as complete');
    }
  };

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
              <span>{currentLesson.moduleTitle}</span>
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
            />
          </aside>

          {/* Center: Main Content */}
          <div className="flex-1 min-w-0">
            {currentLesson.type === 'video' ? (
              <VideoPlayer lesson={currentLesson} />
            ) : currentLesson.type === 'text' || currentLesson.type === 'article' ? (
              <div className="bg-white dark:bg-dark-background-card rounded-2xl p-6 shadow-md border border-gray-100 dark:border-gray-700">
                <ContentBlockRenderer contentBlocks={currentLesson.content_blocks || []} />
              </div>
            ) : (
              <PdfReader
                pdf={{
                  title: currentLesson.title,
                  fileName: `${currentLesson.title.toLowerCase().replace(/\s+/g, '-')}.pdf`,
                  totalPages: 12,
                }}
              />
            )}
          </div>

          {/* Right: Secondary Panels */}
          <aside className="w-80 flex-shrink-0 space-y-4">
            <DownloadCenter resources={[]} />
            <LessonNotesPanel activeLessonId={lessonId || ''} />
            {currentLesson.type === 'video' && <TranscriptPanel transcript={[]} />}
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
    </StudentAppLayout>
  );
};

export default CoursePlayer;
