import React, { useEffect, useRef, useState } from 'react';

interface YouTubePlayerProps {
  videoUrl: string;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onDurationChange: (duration: number) => void;
  onVideoComplete?: () => void; // Callback when video ends
  isCompleted?: boolean;
  startTime?: number; // Resume position in seconds
}

/**
 * YouTube player with progress tracking using YouTube IFrame API
 */
export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoUrl,
  onTimeUpdate,
  onDurationChange,
  onVideoComplete,
  isCompleted,
  startTime = 0,
}) => {
  const playerRef = useRef<YT.Player | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const durationRef = useRef<number>(0); // Cache duration to avoid API calls
  const hasLoadedDurationRef = useRef(false);
  const lastSeekTimeRef = useRef<number>(0); // Track last seek position

  // Extract YouTube video ID
  const getVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/embed\/)([^"&?\/\s]{11})/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const videoId = getVideoId(videoUrl);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!videoId) return;

    // Check if API is already loaded
    if (typeof YT !== 'undefined' && YT.Player) {
      initPlayer();
      return;
    }

    // Load YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Initialize player when API is ready
    (window as any).onYouTubeIframeAPIReady = () => {
      initPlayer();
    };

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [videoId]);

  // Initialize YouTube player
  const initPlayer = () => {
    if (!containerRef.current || !videoId) return;

    playerRef.current = new YT.Player(containerRef.current, {
      videoId,
      playerVars: {
        autoplay: 0,
        controls: 1,
        rel: 0,
        modestbranding: 1,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
      },
    });
  };

  // Player ready callback
  const onPlayerReady = (event: YT.PlayerEvent) => {
    setIsReady(true);
    const player = event.target;
    const duration = player.getDuration();
    durationRef.current = duration; // Cache duration

    if (!hasLoadedDurationRef.current) {
      hasLoadedDurationRef.current = true;
      onDurationChange(duration);

      // Set start time if provided and non-zero
      if (startTime > 0 && startTime < duration) {
        player.seekTo(startTime, true);
        lastSeekTimeRef.current = startTime;
      }
    }
  };

  // Seek to startTime when it changes (after player is ready)
  useEffect(() => {
    if (playerRef.current && hasLoadedDurationRef.current && startTime > 0) {
      const duration = durationRef.current || playerRef.current.getDuration();
      // Only seek if startTime changed significantly (more than 2 seconds)
      if (startTime < duration && Math.abs(startTime - lastSeekTimeRef.current) > 2) {
        playerRef.current.seekTo(startTime, true);
        lastSeekTimeRef.current = startTime;
      }
    }
  }, [startTime]);

  // Player state change callback
  const onPlayerStateChange = (event: YT.OnStateChangeEvent) => {
    const player = event.target;

    // YT.PlayerState.PLAYING = 1
    // YT.PlayerState.PAUSED = 2
    // YT.PlayerState.ENDED = 0

    if (event.data === YT.PlayerState.PLAYING) {
      startTracking(player);
    } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
      stopTracking();
    }

    if (event.data === YT.PlayerState.ENDED) {
      // Video ended - mark as complete IMMEDIATELY
      const duration = durationRef.current || player.getDuration();
      onTimeUpdate(duration, duration);
      // Trigger completion callback immediately
      if (onVideoComplete) {
        onVideoComplete();
      }
    }
  };

  // Start progress tracking (poll every 5 seconds)
  const startTracking = (player?: YT.Player) => {
    if (intervalRef.current) return;

    const targetPlayer = player || playerRef.current;
    if (!targetPlayer) return;

    intervalRef.current = setInterval(() => {
      if (targetPlayer && isReady) {
        const currentTime = targetPlayer.getCurrentTime();
        const duration = durationRef.current || targetPlayer.getDuration();
        onTimeUpdate(currentTime, duration);
      }
    }, 5000);
  };

  // Stop progress tracking
  const stopTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  if (!videoId) {
    return <div className="text-red-500">Invalid YouTube URL</div>;
  }

  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default YouTubePlayer;
