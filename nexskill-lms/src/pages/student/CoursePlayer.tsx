import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import LessonSidebar from '../../components/learning/LessonSidebar';
import VideoPlayer from '../../components/learning/VideoPlayer';
import PdfReader from '../../components/learning/PdfReader';
import DownloadCenter from '../../components/learning/DownloadCenter';
import LessonNotesPanel from '../../components/learning/LessonNotesPanel';
import TranscriptPanel from '../../components/learning/TranscriptPanel';
import AISummaryDrawer from '../../components/learning/AISummaryDrawer';
import AskAIWidget from '../../components/learning/AskAIWidget';
import MarkLessonCompleteModal from '../../components/learning/MarkLessonCompleteModal';

// Dummy course data
const courseData = {
  courseId: '1',
  title: 'Advanced React Patterns',
  coachName: 'David Kim',
  totalLessons: 12,
  completedLessons: 5,
  modules: [
    {
      id: '1',
      title: 'Module 1: React Foundations',
      lessons: [
        { id: '1', title: 'Introduction to Advanced React', type: 'video' as const, duration: '10:30', status: 'completed' as const, description: 'Welcome to this comprehensive course on advanced React patterns. We\'ll explore modern techniques used by top React developers.' },
        { id: '2', title: 'Course Setup Guide', type: 'pdf' as const, duration: '5:00', status: 'completed' as const, description: 'Follow this guide to set up your development environment for the course.' },
        { id: '3', title: 'React Basics Refresher', type: 'video' as const, duration: '15:20', status: 'completed' as const, description: 'A quick refresher on fundamental React concepts before diving into advanced patterns.' },
      ],
    },
    {
      id: '2',
      title: 'Module 2: Custom Hooks',
      lessons: [
        { id: '4', title: 'Understanding Custom Hooks', type: 'video' as const, duration: '18:45', status: 'completed' as const, description: 'Learn how to create reusable custom hooks to extract component logic.' },
        { id: '5', title: 'Hook Composition Patterns', type: 'video' as const, duration: '22:15', status: 'completed' as const, description: 'Discover advanced patterns for composing multiple hooks together.' },
        { id: '6', title: 'Custom Hooks Best Practices', type: 'pdf' as const, duration: '8:00', status: 'current' as const, description: 'A comprehensive guide to best practices when building custom hooks.' },
        { id: '7', title: 'Building a useAuth Hook', type: 'video' as const, duration: '25:30', status: 'locked' as const, description: 'Practical example: Build a complete authentication hook from scratch.' },
      ],
    },
    {
      id: '3',
      title: 'Module 3: Performance Optimization',
      lessons: [
        { id: '8', title: 'React Performance Fundamentals', type: 'video' as const, duration: '20:00', status: 'locked' as const, description: 'Understanding how React renders and when to optimize.' },
        { id: '9', title: 'useMemo and useCallback', type: 'video' as const, duration: '17:30', status: 'locked' as const, description: 'Master these essential hooks for performance optimization.' },
        { id: '10', title: 'Code Splitting Strategies', type: 'pdf' as const, duration: '10:00', status: 'locked' as const, description: 'Learn when and how to split your code for optimal performance.' },
        { id: '11', title: 'React.memo Deep Dive', type: 'video' as const, duration: '19:45', status: 'locked' as const, description: 'Prevent unnecessary re-renders with React.memo.' },
        { id: '12', title: 'Final Project: Optimized Dashboard', type: 'video' as const, duration: '35:00', status: 'locked' as const, description: 'Build a fully optimized dashboard using all techniques learned.' },
      ],
    },
  ],
};

// Dummy resources
const dummyResources = [
  { id: '1', fileName: 'lesson-slides.pdf', size: '2.4 MB', type: 'pdf' as const },
  { id: '2', fileName: 'code-examples.zip', size: '1.8 MB', type: 'zip' as const },
  { id: '3', fileName: 'cheat-sheet.docx', size: '450 KB', type: 'docx' as const },
];

// Dummy transcript
const dummyTranscript = [
  { time: '00:00:15', text: 'Welcome to this lesson on custom hooks. In this video, we\'ll explore how to build reusable logic...' },
  { time: '00:01:30', text: 'Let\'s start by understanding what makes a good custom hook. The key is to extract logic that can be shared...' },
  { time: '00:03:45', text: 'Here\'s our first example. We\'ll create a useLocalStorage hook that syncs state with localStorage...' },
  { time: '00:05:20', text: 'Notice how we\'re using useEffect to handle the side effects. This is a common pattern in custom hooks...' },
  { time: '00:07:00', text: 'Now let\'s add error handling to make our hook more robust in production environments...' },
];

const CoursePlayer: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const [showAIDrawer, setShowAIDrawer] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<string[]>(['1', '2', '3', '4', '5']);

  // Find current lesson
  const currentLesson = useMemo(() => {
    for (const module of courseData.modules) {
      const lesson = module.lessons.find((l) => l.id === lessonId);
      if (lesson) {
        return { ...lesson, moduleTitle: module.title };
      }
    }
    return null;
  }, [lessonId]);

  // Calculate progress
  const progress = Math.round((completedLessons.length / courseData.totalLessons) * 100);

  const handleSelectLesson = (newLessonId: string) => {
    navigate(`/student/courses/${courseId}/lessons/${newLessonId}`);
  };

  const handleMarkComplete = () => {
    if (lessonId && !completedLessons.includes(lessonId)) {
      setCompletedLessons([...completedLessons, lessonId]);
    }
    setShowCompleteModal(false);
    
    // Show success message (could be a toast)
    alert('✓ Lesson marked as complete!');
  };

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
            <h1 className="text-xl font-bold text-text-primary dark:text-dark-text-primary mb-1">{courseData.title}</h1>
            <h2 className="text-lg text-text-secondary dark:text-dark-text-secondary mb-2">{currentLesson.title}</h2>
            <div className="flex items-center gap-4 text-sm text-text-muted dark:text-dark-text-muted">
              <span>{currentLesson.moduleTitle}</span>
              <span>•</span>
              <span>Lesson {lessonId}</span>
              <span>•</span>
              <span>{currentLesson.duration}</span>
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
              modules={courseData.modules}
              activeLessonId={lessonId || ''}
              onSelectLesson={handleSelectLesson}
            />
          </aside>

          {/* Center: Main Content */}
          <div className="flex-1 min-w-0">
            {currentLesson.type === 'video' ? (
              <VideoPlayer lesson={currentLesson} />
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
            <DownloadCenter resources={dummyResources} />
            <LessonNotesPanel activeLessonId={lessonId || ''} />
            {currentLesson.type === 'video' && <TranscriptPanel transcript={dummyTranscript} />}
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
