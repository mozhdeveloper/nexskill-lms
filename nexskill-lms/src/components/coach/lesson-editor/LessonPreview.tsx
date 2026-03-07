import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { Lesson } from '../../../types/lesson';
import ContentBlockRenderer from './ContentBlockRenderer';
import LessonHeader from './LessonHeader';

interface LessonPreviewProps {
  lesson: Lesson;
  onExitPreview: () => void;
}

const LessonPreview: React.FC<LessonPreviewProps> = ({ lesson, onExitPreview }) => {
  
  // Keyboard shortcut to exit preview
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Shift + P
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        onExitPreview();
      }
      // ESC key
      if (e.key === 'Escape') {
        e.preventDefault();
        onExitPreview();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExitPreview]);

  return (
    <div className="min-h-full bg-white dark:bg-gray-900 w-full overflow-y-auto animate-in fade-in zoom-in-95 duration-300">
      {/* Preview Header / Navbar */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-end">
          <button
            onClick={onExitPreview}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Exit Preview
          </button>
        </div>
      </div>

      {/* Lesson Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Lesson Metadata */}
        <LessonHeader
          lesson={lesson}
          isEditing={false}
          onToggleEdit={() => {}}
          title={lesson.title}
          description={lesson.description || ''}
          duration={lesson.estimated_duration_minutes?.toString() || ''}
          onTitleChange={() => {}}
          onDescriptionChange={() => {}}
          onDurationChange={() => {}}
          onBlur={() => {}}
          showEditButton={false}
        />

        {/* Content Blocks */}
        <div className="space-y-6">
          {(!lesson.content_blocks || lesson.content_blocks.length === 0) ? (
            <div className="text-center py-16 px-4 rounded-2xl bg-gray-50 dark:bg-gray-800/30 border border-dashed border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 font-medium text-lg">No content added yet.</p>
              <p className="text-sm text-gray-400 mt-2">Switch to edit mode to add content blocks.</p>
            </div>
          ) : (
            lesson.content_blocks
              .sort((a, b) => a.position - b.position)
              .map((block) => (
                <div key={block.id} className="animate-in fade-in duration-700">
                  <ContentBlockRenderer block={block} />
                </div>
              ))
          )}
        </div>

        {/* Navigation Footer */}
        <div className="mt-16 pt-8 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-sm">
            <button disabled className="opacity-50 cursor-not-allowed flex items-center gap-2 text-gray-500 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                <ArrowLeft className="w-4 h-4" />
                Previous Lesson
            </button>
            <button disabled className="opacity-50 cursor-not-allowed flex items-center gap-2 text-gray-500 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                Next Lesson
                <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default LessonPreview;
