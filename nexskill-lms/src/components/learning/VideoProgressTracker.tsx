import React, { useEffect, useRef, useState } from 'react';
import { useVideoProgress } from '../../hooks/useVideoProgress';

interface VideoProgressTrackerProps {
  lessonId: string;
  videoUrl: string;
  onComplete?: () => void; // Callback when video is completed
  onDurationLoaded?: (duration: number) => void; // Callback when duration is loaded
  children: (props: {
    onTimeUpdate: (currentTime: number, duration: number) => void;
    onDurationChange: (duration: number) => void;
    onVideoComplete: () => void; // Pass to player
    isCompleted: boolean;
    progressPercent: number;
    startTime: number; // Resume position
  }) => React.ReactNode;
}

/**
 * Wrapper component that tracks video progress for any video player
 * Works with YouTube iframe API and HTML5 <video> elements
 */
export const VideoProgressTracker: React.FC<VideoProgressTrackerProps> = ({
  lessonId,
  videoUrl,
  onComplete,
  onDurationLoaded,
  children,
}) => {
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const hasTriggeredRef = useRef(false);

  const { updateProgress, updateDuration, markAsComplete, progressPercent } = useVideoProgress({
    lessonId,
    videoUrl,
    duration: duration || undefined,
    onComplete: () => {
      setIsCompleted(true);
      console.log('🎉 Video completed! Lesson marked as complete.');
      // Call parent callback
      if (onComplete && !hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        onComplete();
      }
    },
    threshold: 0.8, // 80% completion
    onDurationLoaded: (loadedDuration) => {
      setDuration(loadedDuration);
      if (onDurationLoaded) {
        onDurationLoaded(loadedDuration);
      }
    },
  });

  // Handle time updates from child player
  const handleTimeUpdate = (newCurrentTime: number, newDuration: number) => {
    setCurrentTime(newCurrentTime);
    if (newDuration !== duration && newDuration > 0) {
      setDuration(newDuration);
    }
    updateProgress(newCurrentTime, newDuration);
  };

  // Handle duration changes
  const handleDurationChange = (newDuration: number) => {
    if (newDuration > 0 && newDuration !== duration) {
      setDuration(newDuration);
      updateDuration(newDuration);
    }
  };

  // Handle video complete - trigger immediately
  const handleVideoComplete = () => {
    console.log('[VideoProgressTracker] Video ended - marking complete immediately');
    markAsComplete();
  };

  return (
    <>
      {children({
        onTimeUpdate: handleTimeUpdate,
        onDurationChange: handleDurationChange,
        onVideoComplete: handleVideoComplete,
        isCompleted,
        progressPercent,
        startTime: currentTime,
      })}
    </>
  );
};

export default VideoProgressTracker;
