import React, { useEffect } from 'react';
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
}

export const StudentContentRenderer: React.FC<StudentContentRendererProps> = ({
  contentItems,
  lessonId,
  onQuizClick,
  onContentItemComplete,
  onVideoComplete,
}) => {
  if (!contentItems || contentItems.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p className="text-lg">No content available for this lesson yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {contentItems.map((item, index) => {
        if (item.content_type === 'video') {
          return (
            <div key={item.id} className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                <Video className="w-4 h-4 text-blue-500" />
                <span>{item.metadata?.title || `Video ${index + 1}`}</span>
              </div>
              <VideoContent
                contentItemId={item.id} // NEW: Pass content item ID
                videoUrl={item.metadata?.url}
                videoType={item.metadata?.video_type}
                lessonId={lessonId}
                onComplete={() => onContentItemComplete?.(item.id)} // NEW: Notify parent
              />
            </div>
          );
        }

        if (item.content_type === 'quiz') {
          return (
            <div key={item.id} className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                <FileQuestion className="w-4 h-4 text-purple-500" />
                <span>{item.metadata?.title || `Quiz ${index + 1}`}</span>
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
                      Click to start quiz
                    </p>
                  </div>
                </div>
                <Play className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          );
        }

        if (item.content_type === 'text') {
          return (
            <TextContent
              key={item.id}
              contentItemId={item.id}
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
            <div key={item.id} className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                <BookOpen className="w-4 h-4 text-green-600" />
                <span>{item.metadata?.title || 'Notes'}</span>
              </div>
              <div className="p-5 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
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
          );
        }

        return null;
      })}
    </div>
  );
};

// Text Content Component - NO auto completion tracking
// Text blocks are considered "consumed" when viewed, but don't block lesson completion
const TextContent: React.FC<{
  contentItemId: string;
  content?: string;
  onComplete?: () => void;
}> = ({ contentItemId, content, onComplete }) => {
  // Only track completion if this is the ONLY content in the lesson
  // Parent will handle the "only content" logic
  useEffect(() => {
    // Just notify parent that this text was viewed (for analytics/logging if needed)
    // But DON'T mark as completed in database
    const timer = setTimeout(() => {
      console.log('[TextContent] Text viewed (not marking complete):', contentItemId);
      // Optionally call onComplete for tracking, but it won't affect lesson completion
      // onComplete?.(); 
    }, 2000);

    return () => clearTimeout(timer);
  }, [contentItemId, onComplete]);

  return (
    <div className="prose prose-slate dark:prose-invert max-w-none p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
      <div
        className="text-content [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-4 [&>h1]:mt-6 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-3 [&>h2]:mt-5 [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mb-2 [&>h3]:mt-4 [&>h4]:text-base [&>h4]:font-semibold [&>h4]:mb-2 [&>h4]:mt-3 [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:my-3 [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:my-3 [&>li]:mb-1 [&>p]:mb-3 [&>p]:leading-relaxed"
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(content || 'Text content'),
        }}
      />
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

// Video Content Component with Progress Tracking
const VideoContent: React.FC<{
  contentItemId: string; // NEW
  videoUrl?: string;
  videoType?: string;
  lessonId: string;
  onComplete?: () => void;
}> = ({ contentItemId, videoUrl, videoType, lessonId, onComplete }) => {
  if (!videoUrl) return null;

  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
  const isDirectVideo = videoUrl.includes('cloudinary.com') || videoUrl.match(/\.(mp4|webm|ogg|mov)($|\?)/i);

  return (
    <VideoProgressTracker
      lessonId={lessonId}
      contentItemId={contentItemId} // NEW: Track per content item
      videoUrl={videoUrl}
      onComplete={onComplete}
    >
      {({ onTimeUpdate, onDurationChange, onVideoComplete: playerOnComplete, isCompleted, startTime }) => (
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
          {isCompleted && (
            <div className="flex items-center gap-2 mt-2 text-green-600 dark:text-green-400 text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Video completed</span>
            </div>
          )}
        </div>
      )}
    </VideoProgressTracker>
  );
};

export default StudentContentRenderer;
