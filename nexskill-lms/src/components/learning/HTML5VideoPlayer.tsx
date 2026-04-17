import React, { useRef, useEffect } from 'react';
import { useVideoProtection } from '../../hooks/useVideoProtection';

interface HTML5VideoPlayerProps {
  videoUrl: string;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onDurationChange: (duration: number) => void;
  onVideoComplete?: () => void; // Callback when video ends
  isCompleted?: boolean;
  startTime?: number; // Resume position in seconds
}

/**
 * HTML5 video player with progress tracking
 * For direct video uploads (mp4, webm, etc.)
 */
export const HTML5VideoPlayer: React.FC<HTML5VideoPlayerProps> = ({
  videoUrl,
  onTimeUpdate,
  onDurationChange,
  onVideoComplete,
  isCompleted,
  startTime = 0,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSaveTimeRef = useRef<number>(0);
  const hasLoadedMetadataRef = useRef(false);
  const lastSeekTimeRef = useRef<number>(0); // Track last seek position

  // Content protection: blur on screenshot/recording/devtools
  useVideoProtection(containerRef);

  // Handle duration change and seek to start time
  const handleDurationChange = () => {
    if (videoRef.current && !hasLoadedMetadataRef.current) {
      const duration = videoRef.current.duration;
      hasLoadedMetadataRef.current = true;
      onDurationChange(duration);

      // Set start time if provided and non-zero
      if (startTime > 0 && startTime < duration) {
        videoRef.current.currentTime = startTime;
        lastSeekTimeRef.current = startTime;
      }
    }
  };

  // Seek to startTime when it changes (after metadata is loaded)
  useEffect(() => {
    if (videoRef.current && hasLoadedMetadataRef.current && startTime > 0) {
      const duration = videoRef.current.duration;
      // Only seek if startTime changed significantly (more than 2 seconds)
      if (startTime < duration && Math.abs(startTime - lastSeekTimeRef.current) > 2) {
        videoRef.current.currentTime = startTime;
        lastSeekTimeRef.current = startTime;
      }
    }
  }, [startTime]);

  // Handle time update (save every 5 seconds)
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration;

      // Only save every 5 seconds to avoid too many updates
      if (Math.abs(currentTime - lastSaveTimeRef.current) >= 5) {
        onTimeUpdate(currentTime, duration);
        lastSaveTimeRef.current = currentTime;
      }
    }
  };

  // Handle video ended - trigger completion IMMEDIATELY
  const handleEnded = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      // Save final progress immediately
      onTimeUpdate(duration, duration);
      // Trigger completion callback immediately
      if (onVideoComplete) {
        onVideoComplete();
      }
    }
  };

  // Save progress on pause
  const handlePause = () => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      onTimeUpdate(currentTime, duration);
    }
  };

  return (
    <div
      ref={containerRef}
      className="aspect-video bg-black rounded-lg overflow-hidden relative"
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        controlsList="nodownload"
        disablePictureInPicture
        className="w-full h-full"
        style={{ pointerEvents: 'auto' }}
        onDurationChange={handleDurationChange}
        onLoadedMetadata={handleDurationChange}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPause={handlePause}
        preload="metadata"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default HTML5VideoPlayer;
