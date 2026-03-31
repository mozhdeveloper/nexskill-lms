import React from 'react';
import { Video, FileQuestion, FileText, File, Play, BookOpen } from 'lucide-react';
import type { LessonContentItem } from '../../types/lesson-content-item';
import { VideoProgressTracker } from './VideoProgressTracker';
import { YouTubePlayer } from './YouTubePlayer';
import { HTML5VideoPlayer } from './HTML5VideoPlayer';

interface StudentContentRendererProps {
  contentItems: LessonContentItem[];
  lessonId: string;
  onQuizClick: (quizId: string) => void;
  onVideoComplete?: () => void;
}

export const StudentContentRenderer: React.FC<StudentContentRendererProps> = ({
  contentItems,
  lessonId,
  onQuizClick,
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
                videoUrl={item.metadata?.url}
                videoType={item.metadata?.video_type}
                lessonId={lessonId}
                onVideoComplete={onVideoComplete}
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
            <div key={item.id} className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-green-500" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Text Block</span>
              </div>
              <div className="text-gray-600 dark:text-gray-300 text-sm">
                {item.metadata?.content || 'Text content'}
              </div>
            </div>
          );
        }

        if (item.content_type === 'document') {
          return (
            <div key={item.id} className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2">
                <File className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {item.metadata?.file_name || 'Document'}
                </span>
              </div>
            </div>
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

// Video Content Component with Progress Tracking
const VideoContent: React.FC<{
  videoUrl?: string;
  videoType?: string;
  lessonId: string;
  onVideoComplete?: () => void;
}> = ({ videoUrl, videoType, lessonId, onVideoComplete }) => {
  if (!videoUrl) return null;

  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
  const isDirectVideo = videoUrl.includes('cloudinary.com') || videoUrl.match(/\.(mp4|webm|ogg|mov)($|\?)/i);

  if (lessonId) {
    return (
      <VideoProgressTracker
        lessonId={lessonId}
        videoUrl={videoUrl}
        onComplete={onVideoComplete}
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
          </div>
        )}
      </VideoProgressTracker>
    );
  }

  // Fallback without progress tracking
  if (isYouTube) {
    return (
      <YouTubePlayer
        videoUrl={videoUrl}
        onTimeUpdate={() => {}}
        onDurationChange={() => {}}
      />
    );
  } else if (isDirectVideo) {
    return (
      <HTML5VideoPlayer
        videoUrl={videoUrl}
        onTimeUpdate={() => {}}
        onDurationChange={() => {}}
      />
    );
  } else {
    return (
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          src={videoUrl}
          title="Video player"
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
};

export default StudentContentRenderer;
