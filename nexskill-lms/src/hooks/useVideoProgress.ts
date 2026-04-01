import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

interface UseVideoProgressOptions {
  lessonId: string;
  contentItemId?: string; // NEW: Optional content item ID for granular tracking
  videoUrl: string;
  duration?: number; // Optional: if known from metadata
  onComplete?: () => void; // Callback when video is completed
  threshold?: number; // Completion threshold (default: 80%)
  onDurationLoaded?: (duration: number) => void; // Callback when duration is loaded
}

interface VideoProgressState {
  currentTime: number;
  duration: number;
  watchTime: number;
  isCompleted: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to track video watch progress and auto-complete lessons
 * Supports YouTube and direct video uploads (mp4, webm, etc.)
 * NOW SUPPORTS: Per-content-item tracking (contentItemId) OR legacy per-lesson tracking
 */
export const useVideoProgress = ({
  lessonId,
  contentItemId, // NEW
  videoUrl,
  duration: initialDuration,
  onComplete,
  threshold = 0.8, // 80% completion threshold
  onDurationLoaded,
}: UseVideoProgressOptions) => {
  const { user } = useAuth();
  const [state, setState] = useState<VideoProgressState>({
    currentTime: 0,
    duration: initialDuration || 0,
    watchTime: 0,
    isCompleted: false,
    isLoading: true,
    error: null,
  });

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedTimeRef = useRef<number>(0);
  const hasCompletedRef = useRef<boolean>(false);
  const isSavingRef = useRef<boolean>(false); // Prevent concurrent saves

  // Load existing progress on mount (only once)
  useEffect(() => {
    let isMounted = true;

    const loadProgress = async () => {
      if (!user || !lessonId || !videoUrl) {
        if (isMounted) setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        // NEW: If contentItemId provided, use lesson_content_item_progress table
        if (contentItemId) {
          const { data, error } = await supabase
            .from('lesson_content_item_progress')
            .select('current_time_seconds, duration_seconds, watch_time_seconds, is_completed')
            .eq('user_id', user.id)
            .eq('lesson_id', lessonId)
            .eq('content_item_id', contentItemId)
            .maybeSingle();

          if (error) throw error;

          if (isMounted) {
            if (data) {
              setState((prev) => ({
                ...prev,
                currentTime: data.current_time_seconds || 0,
                duration: data.duration_seconds || initialDuration || 0,
                watchTime: data.watch_time_seconds || 0,
                isCompleted: data.is_completed || false,
                isLoading: false,
              }));
              hasCompletedRef.current = data.is_completed || false;

              if (data.duration_seconds && onDurationLoaded) {
                onDurationLoaded(data.duration_seconds);
              }
            } else {
              setState((prev) => ({
                ...prev,
                duration: initialDuration || 0,
                isLoading: false,
              }));
            }
          }
        } else {
          // LEGACY: Use lesson_video_progress table
          const { data, error } = await supabase
            .from('lesson_video_progress')
            .select('current_time_seconds, duration_seconds, watch_time_seconds, is_completed')
            .eq('user_id', user.id)
            .eq('lesson_id', lessonId)
            .eq('video_url', videoUrl)
            .maybeSingle();

          if (error) throw error;

          if (isMounted) {
            if (data) {
              setState((prev) => ({
                ...prev,
                currentTime: data.current_time_seconds || 0,
                duration: data.duration_seconds || initialDuration || 0,
                watchTime: data.watch_time_seconds || 0,
                isCompleted: data.is_completed || false,
                isLoading: false,
              }));
              hasCompletedRef.current = data.is_completed || false;

              if (data.duration_seconds && onDurationLoaded) {
                onDurationLoaded(data.duration_seconds);
              }
            } else {
              setState((prev) => ({
                ...prev,
                duration: initialDuration || 0,
                isLoading: false,
              }));
            }
          }
        }
      } catch (err) {
        console.error('Error loading video progress:', err);
        if (isMounted) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: 'Failed to load progress',
          }));
        }
      }
    };

    loadProgress();

    return () => {
      isMounted = false;
    };
  }, [user, lessonId, videoUrl, contentItemId, initialDuration]); // Added contentItemId to deps

  // Save progress to database (debounced)
  const saveProgress = useCallback(
    async (currentTime: number, duration: number, watchTime: number, markLessonComplete = false, saveDuration = false) => {
      // Prevent concurrent saves
      if (isSavingRef.current) return;
      isSavingRef.current = true;

      try {
        if (!user || !lessonId || !videoUrl || duration === 0) {
          isSavingRef.current = false;
          return;
        }

        const isCompleted = currentTime >= duration * threshold;

        console.log('[VideoProgress] Saving progress:', {
          currentTime,
          duration,
          watchTime,
          isCompleted,
          markLessonComplete,
          saveDuration,
          threshold,
        });

        // Build update object
        const updateData: any = {
          user_id: user.id,
          lesson_id: lessonId,
          video_url: videoUrl,
          current_time_seconds: Math.floor(currentTime),
          watch_time_seconds: Math.floor(watchTime),
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
          last_watched_at: new Date().toISOString(),
        };

        // Only save duration if it changed or explicitly requested
        if (saveDuration || duration > 0) {
          updateData.duration_seconds = Math.floor(duration);
        }

        // Save video progress
        const { error: videoError } = await supabase.from('lesson_video_progress').upsert(
          updateData,
          { onConflict: 'user_id,lesson_id,video_url' }
        );

        if (videoError) {
          console.error('[VideoProgress] Error saving video progress:', videoError);
        } else {
          console.log('[VideoProgress] Video progress saved successfully');

          // Mark lesson as complete if threshold reached
          if (isCompleted && markLessonComplete) {
            console.log('[VideoProgress] Marking lesson as complete...');
            const { error: lessonError, data: lessonData } = await supabase
              .from('user_lesson_progress')
              .upsert(
                {
                  user_id: user.id,
                  lesson_id: lessonId,
                  is_completed: true,
                  completed_at: new Date().toISOString(),
                },
                { onConflict: 'user_id,lesson_id' }
              )
              .select();

            if (lessonError) {
              console.error('[VideoProgress] Error marking lesson complete:', lessonError);
            } else {
              console.log('[VideoProgress] Lesson marked complete!', lessonData);
            }
          }

          // Trigger completion callback
          // Only trigger if newly completed (not if already completed before)
          if (isCompleted && !hasCompletedRef.current && onComplete) {
            hasCompletedRef.current = true;
            console.log('[VideoProgress] Calling onComplete callback (debounced save)');
            onComplete();
          }

          setState((prev) => ({
            ...prev,
            isCompleted,
          }));
        }
      } catch (err) {
        console.error('[VideoProgress] Error saving progress:', err);
      } finally {
        isSavingRef.current = false;
      }
    },
    [user, lessonId, videoUrl, threshold, onComplete]
  );

  // Debounced save (every 5 seconds)
  const debouncedSave = useCallback(
    (currentTime: number, duration: number, watchTime: number) => {
      // Only save if we've progressed at least 5 seconds since last save
      if (Math.abs(currentTime - lastSavedTimeRef.current) < 5) return;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        // Mark lesson complete if we've reached threshold
        const shouldMarkComplete = currentTime >= duration * threshold;
        saveProgress(currentTime, duration, watchTime, shouldMarkComplete, false);
        lastSavedTimeRef.current = currentTime;
      }, 5000); // Changed to 5 seconds
    },
    [saveProgress, threshold]
  );

  // Update progress (called from video player events)
  const updateProgress = useCallback(
    (currentTime: number, duration: number) => {
      if (duration === 0) return;

      setState((prev) => {
        const timeDelta = currentTime - prev.currentTime;
        const newWatchTime = prev.watchTime + Math.max(0, timeDelta); // Only count forward progress

        // Debounced save
        debouncedSave(currentTime, duration, newWatchTime);

        return {
          ...prev,
          currentTime,
          duration,
          watchTime: newWatchTime,
        };
      });
    },
    [debouncedSave]
  );

  // Update duration (called when video metadata loads) - SAVE IT IMMEDIATELY
  const updateDuration = useCallback((duration: number) => {
    if (duration <= 0) return;
    
    setState((prev) => ({
      ...prev,
      duration,
    }));
    
    // Save duration to database immediately (one-time save)
    saveProgress(0, duration, 0, false, true);
    
    // Notify parent
    if (onDurationLoaded) {
      onDurationLoaded(duration);
    }
  }, [onDurationLoaded, saveProgress]);

  // Mark as complete manually (called when video ends - should ALWAYS trigger completion)
  const markAsComplete = useCallback(async () => {
    if (!user || !lessonId || !videoUrl) {
      console.log('[VideoProgress] markAsComplete: Missing required params');
      return;
    }

    console.log('[VideoProgress] markAsComplete called - current state:', state);
    console.log('[VideoProgress] markAsComplete: hasCompletedRef =', hasCompletedRef.current);
    
    // Use the actual duration from the player, not state
    const finalDuration = state.duration || 1; // Fallback to 1 to avoid division by zero
    const finalTime = finalDuration; // Set to end of video
    
    // ALWAYS save and mark complete, even if already completed before
    // This ensures the lesson gets marked complete even if the debounced save didn't trigger it
    await saveProgress(finalTime, finalDuration, finalDuration, true, false);
    
    setState((prev) => ({ ...prev, isCompleted: true }));
    hasCompletedRef.current = true;
    
    console.log('[VideoProgress] markAsComplete - calling onComplete');
    // Always call onComplete when video ends (don't check hasCompletedRef)
    if (onComplete) {
      onComplete();
    }
  }, [user, lessonId, videoUrl, saveProgress, state.duration, onComplete]);

  // Cleanup on unmount (NO save on cleanup to prevent infinite loops)
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    updateProgress,
    updateDuration,
    markAsComplete,
    progressPercent: state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0,
  };
};

export default useVideoProgress;
