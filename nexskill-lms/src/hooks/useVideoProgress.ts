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
  const isLoadedRef = useRef<boolean>(false); // Guard: block saves until initial loadProgress finishes

  // Load existing progress on mount (only once)
  useEffect(() => {
    let isMounted = true;

    const loadProgress = async () => {
      if (!user || !lessonId || !videoUrl) {
        if (isMounted) {
          setState(prev => ({ ...prev, isLoading: false }));
          isLoadedRef.current = true; // unblock saves even on early exit
        }
        return;
      }

      try {
        // NEW: If contentItemId provided, use lesson_content_item_progress table
        if (contentItemId) {
          const { data, error } = await supabase
            .from('lesson_content_item_progress')
            .select('is_completed, progress_data, completed_at')
            .eq('user_id', user.id)
            .eq('lesson_id', lessonId)
            .eq('content_item_id', contentItemId)
            .maybeSingle();

          if (error) throw error;

          if (isMounted) {
            if (data) {
              // Extract timing data from progress_data JSONB field
              const progressData = data.progress_data || {};
              setState((prev) => ({
                ...prev,
                currentTime: progressData.current_time_seconds || 0,
                duration: progressData.duration_seconds || initialDuration || 0,
                watchTime: progressData.watch_time_seconds || 0,
                isCompleted: data.is_completed || false,
                isLoading: false,
              }));
              hasCompletedRef.current = data.is_completed || false;
              isLoadedRef.current = true;

              if (progressData.duration_seconds && onDurationLoaded) {
                onDurationLoaded(progressData.duration_seconds);
              }
            } else {
              setState((prev) => ({
                ...prev,
                duration: initialDuration || 0,
                isLoading: false,
              }));
              isLoadedRef.current = true;
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
              isLoadedRef.current = true; // ADD THIS

              if (data.duration_seconds && onDurationLoaded) {
                onDurationLoaded(data.duration_seconds);
              }
            } else {
              setState((prev) => ({
                ...prev,
                duration: initialDuration || 0,
                isLoading: false,
              }));
              isLoadedRef.current = true; // ADD THIS
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
          isLoadedRef.current = true; // unblock saves even if load fails
        }
      }
    };

    loadProgress();

    return () => {
      isMounted = false;
    };
  }, [user, lessonId, videoUrl, contentItemId, initialDuration]); // Added contentItemId to deps

  // Save progress to database (debounced)
  // FIX: No longer writes directly to user_lesson_progress.
  // When contentItemId is provided, saves to lesson_content_item_progress so the DB trigger
  // (trg_mark_lesson_complete_on_content_done) handles lesson-level completion.
  // The parent component (CoursePlayer) is the single source of truth for marking lessons complete.
  const saveProgress = useCallback(
    async (currentTime: number, duration: number, watchTime: number, markComplete = false, saveDuration = false) => {
      // Prevent concurrent saves
      if (isSavingRef.current) {
        console.log('[VideoProgress] saveProgress BLOCKED - concurrent save already in progress');
        return;
      }

      console.log('[VideoProgress] saveProgress called | isLoadedRef:', isLoadedRef.current, '| hasCompletedRef:', hasCompletedRef.current, '| currentTime:', currentTime, '| markComplete:', markComplete, '| caller:', new Error().stack?.split('\n')[2]?.trim());

      // Block any saves until the initial DB load has completed.
      // updateDuration fires from onLoadedMetadata almost immediately on mount,
      // often before the async loadProgress query resolves. Without this guard,
      // it writes is_completed: false, overwriting a previously completed status.
      // The DB trigger won't self-heal this because it only fires on is_completed = true.
      if (!isLoadedRef.current) {
        console.log('[VideoProgress] saveProgress BLOCKED by isLoadedRef guard — premature call prevented');
        return;
      }

      isSavingRef.current = true;

      try {
        if (!user || !lessonId || !videoUrl || duration === 0) {
          console.log('[VideoProgress] saveProgress EARLY RETURN — missing required params:', { user: !!user, lessonId, videoUrl: !!videoUrl, duration });
          isSavingRef.current = false;
          return;
        }

        const isCompleted = currentTime >= duration * threshold;

        // FIX: Never downgrade is_completed from true to false on progress updates.
        // When navigating back, updateDuration() fires with currentTime=0, which would
        // normally set is_completed=false and overwrite the completed status.
        // If already completed (hasCompletedRef), preserve it.
        const finalIsCompleted = isCompleted || markComplete || hasCompletedRef.current;

        console.log('[VideoProgress] Saving progress:', {
          currentTime,
          duration,
          watchTime,
          isCompleted,
          markComplete,
          saveDuration,
          contentItemId,
          threshold,
        });

        if (contentItemId) {
          // NEW PATH: Save to lesson_content_item_progress table
          // The DB trigger will handle lesson-level completion when ALL items are done
          const updateData: any = {
            user_id: user.id,
            lesson_id: lessonId,
            content_item_id: contentItemId,
            content_type: 'video',
            is_completed: finalIsCompleted,
            completed_at: finalIsCompleted ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
            progress_data: {
              current_time_seconds: Math.floor(currentTime),
              duration_seconds: Math.floor(duration),
              watch_time_seconds: Math.floor(watchTime),
            },
          };

          const { error } = await supabase.from('lesson_content_item_progress').upsert(
            updateData,
            { onConflict: 'user_id,lesson_id,content_item_id' }
          );

          if (error) {
            console.error('[VideoProgress] Error saving content item progress:', error);
          } else {
            console.log('[VideoProgress] Content item progress saved successfully');

            // Trigger completion callback for parent to check ALL items
            if (finalIsCompleted && !hasCompletedRef.current && onComplete) {
              hasCompletedRef.current = true;
              console.log('[VideoProgress] Video content item completed — parent will check remaining items');
              onComplete();
            }

            setState((prev) => ({
              ...prev,
              isCompleted: finalIsCompleted,
            }));
          }
        } else {
          // LEGACY PATH: Save to lesson_video_progress table
          // Does NOT mark lesson complete — parent component handles that
          const updateData: any = {
            user_id: user.id,
            lesson_id: lessonId,
            video_url: videoUrl,
            current_time_seconds: Math.floor(currentTime),
            watch_time_seconds: Math.floor(watchTime),
            is_completed: finalIsCompleted,
            completed_at: finalIsCompleted ? new Date().toISOString() : null,
            last_watched_at: new Date().toISOString(),
          };

          if (saveDuration || duration > 0) {
            updateData.duration_seconds = Math.floor(duration);
          }

          const { error: videoError } = await supabase.from('lesson_video_progress').upsert(
            updateData,
            { onConflict: 'user_id,lesson_id,video_url' }
          );

          if (videoError) {
            console.error('[VideoProgress] Error saving video progress:', videoError);
          } else {
            console.log('[VideoProgress] Video progress saved successfully (legacy path)');

            // Trigger completion callback for parent to handle
            if (finalIsCompleted && !hasCompletedRef.current && onComplete) {
              hasCompletedRef.current = true;
              console.log('[VideoProgress] Video completed (legacy) — parent will handle lesson completion');
              onComplete();
            }

            setState((prev) => ({
              ...prev,
              isCompleted: finalIsCompleted,
            }));
          }
        }
      } catch (err) {
        console.error('[VideoProgress] Error saving progress:', err);
      } finally {
        isSavingRef.current = false;
      }
    },
    [user, lessonId, videoUrl, contentItemId, threshold, onComplete]
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
