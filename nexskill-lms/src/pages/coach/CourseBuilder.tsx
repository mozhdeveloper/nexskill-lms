import React, { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import CoachAppLayout from '../../layouts/CoachAppLayout';
import CourseBuilderSidebar from '../../components/coach/CourseBuilderSidebar';
import CourseSettingsForm from '../../components/coach/CourseSettingsForm';
import CurriculumEditor from '../../components/coach/CurriculumEditor';
import QuizBuilderPanel from '../../components/coach/QuizBuilderPanel';
import DripSchedulePanel from '../../components/coach/DripSchedulePanel';
import CoursePricingForm from '../../components/coach/CoursePricingForm';
import CoursePublishWorkflow from '../../components/coach/CoursePublishWorkflow';
import CoursePreviewPane from '../../components/coach/CoursePreviewPane';
import LessonEditorPanel from '../../components/coach/LessonEditorPanel';

type SectionKey = 'settings' | 'curriculum' | 'lessons' | 'quizzes' | 'drip' | 'pricing' | 'publish' | 'preview';

interface CourseSettings {
  title: string;
  subtitle: string;
  category: string;
  level: string;
  language: string;
  shortDescription: string;
  longDescription: string;
  tags: string;
  visibility: 'public' | 'unlisted' | 'private';
}

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'quiz' | 'live';
  duration: string;
  summary: string;
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'image-choice';
  question: string;
  options: Array<{ id: string; text: string; isCorrect: boolean }>;
  explanation: string;
}

interface ModuleDrip {
  moduleId: string;
  moduleTitle: string;
  mode: 'immediate' | 'days-after-enrollment' | 'specific-date';
  daysAfter?: number;
  specificDate?: string;
}

interface PricingData {
  mode: 'free' | 'one-time' | 'subscription';
  price: number;
  currency: string;
  salePrice?: number;
  subscriptionInterval?: 'monthly' | 'yearly';
}

const CourseBuilder: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const initialData = location.state as CourseSettings | undefined;

  const [activeSection, setActiveSection] = useState<SectionKey>('settings');
  const [courseStatus, setCourseStatus] = useState<'draft' | 'published'>('draft');

  // Settings state
  const [settings, setSettings] = useState<CourseSettings>({
    title: initialData?.title || '',
    subtitle: initialData?.subtitle || '',
    category: initialData?.category || '',
    level: initialData?.level || 'beginner',
    language: initialData?.language || 'English',
    shortDescription: '',
    longDescription: '',
    tags: '',
    visibility: 'public',
  });

  // Curriculum state
  const [curriculum, setCurriculum] = useState<Module[]>([
    {
      id: 'm-1',
      title: 'Introduction',
      lessons: [
        { id: 'l-1', title: 'Welcome', type: 'video', duration: '5 min', summary: 'Introduction to the course' },
      ],
    },
  ]);

  // Lesson editor state
  const [editingLesson, setEditingLesson] = useState<{ moduleId: string; lesson: Lesson } | null>(null);

  // Quiz state
  const [questions, setQuestions] = useState<Question[]>([]);

  // Drip schedule state (derived from curriculum modules)
  const dripModules: ModuleDrip[] = curriculum.map((mod) => ({
    moduleId: mod.id,
    moduleTitle: mod.title,
    mode: 'immediate',
  }));
  const [drip, setDrip] = useState<ModuleDrip[]>(dripModules);

  // Pricing state
  const [pricing, setPricing] = useState<PricingData>({
    mode: 'one-time',
    price: 99,
    currency: 'USD',
  });

  const handleEditLesson = (moduleId: string, lessonId: string) => {
    const module = curriculum.find((m) => m.id === moduleId);
    const lesson = module?.lessons.find((l) => l.id === lessonId);
    if (lesson) {
      setEditingLesson({ moduleId, lesson });
    }
  };

  const handleSaveLesson = (updatedLesson: Lesson) => {
    if (!editingLesson) return;

    setCurriculum(
      curriculum.map((mod) =>
        mod.id === editingLesson.moduleId
          ? {
              ...mod,
              lessons: mod.lessons.map((l) => (l.id === updatedLesson.id ? updatedLesson : l)),
            }
          : mod
      )
    );
    setEditingLesson(null);
  };

  const handlePublish = () => {
    setCourseStatus('published');
    window.alert(`🚀 Course Published Successfully\n\nCourse ID: ${courseId}\nStatus: Live\n\n✅ Publishing Checklist Completed:\n• Course content: Complete\n• Pricing: Set\n• Thumbnail: Uploaded\n• Description: Added\n• Learning objectives: Defined\n\n🌍 Course Visibility:\n• Public course catalog: Yes\n• Search engines: Indexed\n• Course page: Active\n• Enrollment: Open\n\n📊 What's Next:\n• Monitor enrollments\n• Engage with students\n• Respond to questions\n• Gather feedback\n• Update content as needed\n\n🎉 Congratulations on launching your course!`);
  };

  const handleUnpublish = () => {
    setCourseStatus('draft');
    window.alert(`📝 Course Unpublished\n\nCourse ID: ${courseId}\nStatus: Draft\n\n⚠️ Impact of Unpublishing:\n• Course removed from catalog\n• New enrollments: Disabled\n• Existing students: Still have access\n• Course page: Private\n• Search visibility: Hidden\n\n✅ Current Students:\n• Can continue learning\n• Access to all materials maintained\n• Progress preserved\n\n🔄 To Re-publish:\n• Review and update content\n• Check settings and pricing\n• Click 'Publish' when ready\n\n💡 Use draft mode to make major updates without affecting student experience.`);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'settings':
        return <CourseSettingsForm settings={settings} onChange={setSettings} />;
      case 'curriculum':
        return (
          <CurriculumEditor
            curriculum={curriculum}
            onChange={setCurriculum}
            onEditLesson={handleEditLesson}
          />
        );
      case 'lessons':
        return (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎬</div>
            <p className="text-xl font-semibold text-slate-900 dark:text-dark-text-primary mb-2">Lesson content</p>
            <p className="text-slate-600 dark:text-dark-text-secondary mb-6">
              Edit individual lessons from the Curriculum section
            </p>
            <button
              onClick={() => setActiveSection('curriculum')}
              className="px-6 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all"
            >
              Go to Curriculum
            </button>
          </div>
        );
      case 'quizzes':
        return <QuizBuilderPanel questions={questions} onChange={setQuestions} />;
      case 'drip':
        return <DripSchedulePanel modules={drip} onChange={setDrip} />;
      case 'pricing':
        return <CoursePricingForm pricing={pricing} onChange={setPricing} />;
      case 'publish':
        return (
          <CoursePublishWorkflow
            courseStatus={courseStatus}
            onPublish={handlePublish}
            onUnpublish={handleUnpublish}
          />
        );
      case 'preview':
        return (
          <CoursePreviewPane
            courseTitle={settings.title}
            courseSubtitle={settings.subtitle}
            courseDescription={settings.longDescription}
            instructorName="Your Name"
          />
        );
      default:
        return null;
    }
  };

  return (
    <CoachAppLayout>
      <div className="max-w-[1400px] mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/coach/courses')}
            className="text-sm text-slate-600 dark:text-dark-text-secondary hover:text-slate-900 dark:hover:text-dark-text-primary transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to courses
          </button>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <CourseBuilderSidebar
            activeSection={activeSection}
            onChangeSection={(section) => setActiveSection(section as SectionKey)}
            courseTitle={settings.title || 'Untitled course'}
            courseStatus={courseStatus}
          />

          {/* Main content area */}
          <div className="flex-1">
            <div className="bg-white dark:bg-dark-background-card rounded-3xl shadow-lg p-8">{renderSection()}</div>
          </div>
        </div>
      </div>

      {/* Lesson editor modal */}
      {editingLesson && (
        <LessonEditorPanel
          lesson={editingLesson.lesson}
          onChange={handleSaveLesson}
          onClose={() => setEditingLesson(null)}
        />
      )}
    </CoachAppLayout>
  );
};

export default CourseBuilder;
