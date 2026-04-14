import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Video, FileQuestion, FileText, File, Play, BookOpen } from 'lucide-react';
import DOMPurify from 'dompurify';
import type { LessonContentItem } from '../../types/lesson-content-item';
import { VideoProgressTracker } from './VideoProgressTracker';
import { YouTubePlayer } from './YouTubePlayer';
import { HTML5VideoPlayer } from './HTML5VideoPlayer';
import { useContentItemProgress } from '../../hooks/useContentItemProgress';

interface StudentContentRendererProps {
  contentItems: LessonContentItem[];
  lessonId: string;
  onQuizClick: (quizId: string) => void;
  onContentItemComplete?: (contentItemId: string) => void; // NEW: Callback when ANY content item completes
  onVideoComplete?: () => void; // DEPRECATED: Kept for backward compatibility
  // Navigation props
  prevItem?: { id: string; type: 'lesson' | 'quiz' } | null;
  nextItem?: { id: string; type: 'lesson' | 'quiz' } | null;
  onNavigate?: (item: { id: string; type: 'lesson' | 'quiz' }) => void;
  // Scroll completion trigger ref
  bottomTriggerRef?: React.RefObject<HTMLDivElement | null>;
}

export const StudentContentRenderer: React.FC<StudentContentRendererProps> = ({
  contentItems,
  lessonId,
  onQuizClick,
  onContentItemComplete, // Used for item-level progress tracking (not lesson completion)
  onVideoComplete,
  prevItem,
  nextItem,
  onNavigate,
  bottomTriggerRef,
}) => {
  if (!contentItems || contentItems.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-lg">No content available for this lesson yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {contentItems.map((item, index) => {
          if (item.content_type === 'video') {
            return (
              <VideoItem
                key={item.id}
                item={item}
                index={index}
                lessonId={lessonId}
                onComplete={() => onContentItemComplete?.(item.id)}
              />
            );
          }

          if (item.content_type === 'quiz') {
            return (
              <QuizItem
                key={item.id}
                item={item}
                index={index}
                lessonId={lessonId}
                onQuizClick={onQuizClick}
                onComplete={() => onContentItemComplete?.(item.id)}
              />
            );
          }

          if (item.content_type === 'text') {
            return (
              <TextContent
                key={item.id}
                contentItemId={item.id}
                lessonId={lessonId}
                content={item.metadata?.content}
                onComplete={() => onContentItemComplete?.(item.id)}
              />
            );
          }

          if (item.content_type === 'document') {
            return (
              <DocumentContent
                key={item.id}
                contentItemId={item.id}
                fileName={item.metadata?.file_name}
                onComplete={() => onContentItemComplete?.(item.id)}
              />
            );
          }

          if (item.content_type === 'notes') {
            return (
              <NotesItem
                key={item.id}
                item={item}
                index={index}
                lessonId={lessonId}
                onComplete={() => onContentItemComplete?.(item.id)}
              />
            );
          }

          return null;
        })}
      </div>

      {/* Next / Previous Navigation — positioned underneath last content item */}
      <div ref={bottomTriggerRef} className="flex items-center justify-between pt-6">
        {prevItem ? (
          <button
            onClick={() => onNavigate?.(prevItem)}
            className="px-5 py-2.5 text-sm font-medium text-text-secondary dark:text-dark-text-secondary border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
          >
            ← Previous {prevItem.type === 'quiz' ? 'Quiz' : 'Lesson'}
          </button>
        ) : <div />}
        {nextItem ? (
          <button
            onClick={() => onNavigate?.(nextItem)}
            className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-brand-primary to-brand-primary-light rounded-full shadow-button-primary hover:shadow-lg hover:scale-[1.02] transition-all"
          >
            Next {nextItem.type === 'quiz' ? 'Quiz' : 'Lesson'} →
          </button>
        ) : <div />}
      </div>
    </>
  );
};

// Video Item with completion checkmark in header
const VideoItem: React.FC<{
  item: LessonContentItem;
  index: number;
  lessonId: string;
  onComplete?: () => void;
}> = ({ item, index, lessonId, onComplete }) => {
  return (
    <VideoContent
      contentItemId={item.id}
      videoUrl={item.metadata?.url}
      videoType={item.metadata?.video_type}
      lessonId={lessonId}
      title={item.metadata?.title || `Video ${index + 1}`}
      onComplete={onComplete}
    />
  );
};

// Quiz Item with completion checkmark in header — styled to match VideoItem
const QuizItem: React.FC<{
  item: LessonContentItem;
  index: number;
  lessonId: string;
  onQuizClick: (quizId: string) => void;
  onComplete?: () => void;
}> = ({ item, index, lessonId, onQuizClick, onComplete }) => {
  const { isCompleted } = useContentItemProgress({
    lessonId,
    contentItemId: item.id,
    contentType: 'quiz',
    onComplete,
  });

  return (
    <div className="space-y-2">
      {/* Header — matches VideoItem: black text, purple icon, green circular checkmark */}
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
        <FileQuestion className="w-4 h-4 text-purple-500" />
        <span>{item.metadata?.title || `Quiz ${index + 1}`}</span>
        {isCompleted && (
          <span className="w-5 h-5 flex items-center justify-center bg-green-500 rounded-full text-white text-xs flex-shrink-0">
            ✓
          </span>
        )}
      </div>
      <button
        onClick={() => item.content_id && onQuizClick(item.content_id)}
        className="w-full flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl hover:border-purple-400 dark:hover:border-purple-600 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <FileQuestion className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-left">
            <p className="font-medium text-purple-900 dark:text-purple-100">
              {item.metadata?.title || 'Quiz'}
            </p>
            <p className="text-sm text-purple-600 dark:text-purple-400">
              {isCompleted ? 'Completed — retake to improve score' : 'Click to start quiz'}
            </p>
          </div>
        </div>
        <Play className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
};

// Notes Item - Simple display (no per-item auto-completion)
const NotesItem: React.FC<{
  item: LessonContentItem;
  index: number;
  lessonId: string;
  onComplete?: () => void;
}> = ({ item, index, lessonId, onComplete }) => {
  const { isCompleted, isLoading, markAsViewed } = useContentItemProgress({
    lessonId,
    contentItemId: item.id,
    contentType: 'notes',
    onComplete,
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
        <BookOpen className="w-4 h-4 text-green-600" />
        <span>{item.metadata?.title || 'Notes'}</span>
        {isCompleted && (
          <span className="w-5 h-5 flex items-center justify-center bg-green-500 rounded-full text-white text-xs flex-shrink-0">
            ✓
          </span>
        )}
      </div>
      <div className="relative">
        <div
          className="p-5 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800 max-h-[60vh] overflow-y-auto"
        >
          <div
            className="notes-content prose prose-slate dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
            dangerouslySetInnerHTML={{ __html: item.metadata?.content || '' }}
          />
          {(item.metadata?.word_count || item.metadata?.reading_time) && (
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-green-200 dark:border-green-800 text-xs text-gray-500 dark:text-gray-400">
              {item.metadata?.word_count && (
                <span>{item.metadata.word_count} words</span>
              )}
              {item.metadata?.reading_time && (
                <span>~{item.metadata.reading_time} min read</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Text Content Component - Simple display (no per-item auto-completion)
const TextContent: React.FC<{
  contentItemId: string;
  lessonId: string;
  content?: string;
  onComplete?: () => void;
}> = ({ contentItemId, lessonId, content, onComplete }) => {
  const { isCompleted } = useContentItemProgress({
    lessonId,
    contentItemId,
    contentType: 'text',
    onComplete,
  });

  return (
    <div className="relative">
      <div
        className="prose prose-slate dark:prose-invert max-w-none p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-gray-600 max-h-[60vh] overflow-y-auto"
      >
        <div
          className="text-content [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-4 [&>h1]:mt-6 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-3 [&>h2]:mt-5 [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mb-2 [&>h3]:mt-4 [&>h4]:text-base [&>h4]:font-semibold [&>h4]:mb-2 [&>h4]:mt-3 [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:my-3 [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:my-3 [&>li]:mb-1 [&>p]:mb-3 [&>p]:leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(content || 'Text content'),
          }}
        />
      </div>
    </div>
  );
};

// Document Content Component - NO auto completion tracking
const DocumentContent: React.FC<{
  contentItemId: string;
  fileName?: string;
  onComplete?: () => void;
}> = ({ contentItemId, fileName, onComplete }) => {
  // Documents don't block lesson completion
  // They're considered "available" but not required to complete

  return (
    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
      <div className="flex items-center gap-2">
        <File className="w-4 h-4 text-orange-500" />
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {fileName || 'Document'}
        </span>
      </div>
    </div>
  );
};

// Video Content Component with Progress Tracking and completion checkmark in header
const VideoContent: React.FC<{
  contentItemId: string;
  videoUrl?: string;
  videoType?: string;
  lessonId: string;
  title: string;
  onComplete?: () => void;
}> = ({ contentItemId, videoUrl, videoType, lessonId, title, onComplete }) => {
  if (!videoUrl) return null;

  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
  const isDirectVideo = videoUrl.includes('cloudinary.com') || videoUrl.match(/\.(mp4|webm|ogg|mov)($|\?)/i);

  return (
    <div className="space-y-2">
      <VideoProgressTracker
        lessonId={lessonId}
        contentItemId={contentItemId}
        videoUrl={videoUrl}
        onComplete={onComplete}
      >
        {({ onTimeUpdate, onDurationChange, onVideoComplete: playerOnComplete, isCompleted, startTime }) => (
          <>
            {/* Header with icon, title, and checkmark — uses isCompleted from VideoProgressTracker */}
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
              <Video className="w-4 h-4 text-blue-500" />
              <span>{title}</span>
              {isCompleted && (
                <span className="w-5 h-5 flex items-center justify-center bg-green-500 rounded-full text-white text-xs flex-shrink-0">
                  ✓
                </span>
              )}
            </div>
            <div>
              {isYouTube ? (
                <YouTubePlayer
                  videoUrl={videoUrl}
                  onTimeUpdate={onTimeUpdate}
                  onDurationChange={onDurationChange}
                  onVideoComplete={playerOnComplete}
                  isCompleted={isCompleted}
                  startTime={startTime}
                />
              ) : isDirectVideo ? (
                <HTML5VideoPlayer
                  videoUrl={videoUrl}
                  onTimeUpdate={onTimeUpdate}
                  onDurationChange={onDurationChange}
                  onVideoComplete={playerOnComplete}
                  isCompleted={isCompleted}
                  startTime={startTime}
                />
              ) : (
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe
                    src={videoUrl}
                    title="Video player"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          </>
        )}
      </VideoProgressTracker>
    </div>
  );
};

export default StudentContentRenderer;
