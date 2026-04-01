import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

interface UseContentItemProgressOptions {
  lessonId: string;
  contentItemId: string;
  contentType: 'video' | 'quiz' | 'text' | 'document' | 'notes';
  onComplete?: () => void; // Callback when content item is completed
}

interface ContentItemProgressState {
  isCompleted: boolean;
  progressData: any | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to track individual lesson content item progress
 * Used for videos, quizzes, text blocks, documents, and notes
 * Lesson is only marked complete when ALL content items are consumed
 */
export const useContentItemProgress = ({
  lessonId,
  contentItemId,
  contentType,
  onComplete,
}: UseContentItemProgressOptions) => {
  const { user } = useAuth();
  const [state, setState] = useState<ContentItemProgressState>({
    isCompleted: false,
    progressData: null,
    isLoading: true,
    error: null,
  });

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCompletedRef = useRef<boolean>(false);
  const isSavingRef = useRef<boolean>(false);

  // Load existing progress on mount
  useEffect(() => {
    let isMounted = true;

    const loadProgress = async () => {
      if (!user || !lessonId || !contentItemId) {
        if (isMounted) setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
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
            setState((prev) => ({
              ...prev,
              isCompleted: data.is_completed || false,
              progressData: data.progress_data || null,
              isLoading: false,
            }));
            hasCompletedRef.current = data.is_completed || false;
          } else {
            setState((prev) => ({
              ...prev,
              isLoading: false,
            }));
          }
        }
      } catch (err) {
        console.error('Error loading content item progress:', err);
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
  }, [user, lessonId, contentItemId]);

  // Save progress to database
  const saveProgress = useCallback(
    async (progressData?: any, markComplete = false) => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;

      try {
        if (!user || !lessonId || !contentItemId) {
          isSavingRef.current = false;
          return;
        }

        const updateData: any = {
          user_id: user.id,
          lesson_id: lessonId,
          content_item_id: contentItemId,
          content_type: contentType,
          is_completed: markComplete,
          completed_at: markComplete ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        };

        if (progressData) {
          updateData.progress_data = progressData;
        }

        const { error } = await supabase.from('lesson_content_item_progress').upsert(
          updateData,
          { onConflict: 'user_id,lesson_id,content_item_id' }
        );

        if (error) {
          console.error('[ContentItemProgress] Error saving progress:', error);
        } else {
          console.log('[ContentItemProgress] Progress saved successfully', { markComplete });

          // Trigger completion callback if newly completed
          if (markComplete && !hasCompletedRef.current && onComplete) {
            hasCompletedRef.current = true;
            console.log('[ContentItemProgress] Content item completed!');
            onComplete();
          }

          setState((prev) => ({
            ...prev,
            isCompleted: markComplete,
          }));
        }
      } catch (err) {
        console.error('[ContentItemProgress] Error saving progress:', err);
      } finally {
        isSavingRef.current = false;
      }
    },
    [user, lessonId, contentItemId, contentType, onComplete]
  );

  // Debounced save for progress updates (e.g., video watch time)
  const debouncedSave = useCallback(
    (progressData: any) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveProgress(progressData, false);
      }, 5000); // Save every 5 seconds
    },
    [saveProgress]
  );

  // Update progress data (for videos: current time, duration, watch time)
  const updateProgress = useCallback(
    (progressData: any) => {
      debouncedSave(progressData);
      setState((prev) => ({
        ...prev,
        progressData,
      }));
    },
    [debouncedSave]
  );

  // Mark content item as complete
  const markAsComplete = useCallback(async () => {
    if (!user || !lessonId || !contentItemId) {
      console.log('[ContentItemProgress] markAsComplete: Missing required params');
      return;
    }

    console.log('[ContentItemProgress] Marking content item as complete:', contentItemId);
    await saveProgress({}, true);
    setState((prev) => ({ ...prev, isCompleted: true }));
    hasCompletedRef.current = true;

    if (onComplete) {
      onComplete();
    }
  }, [user, lessonId, contentItemId, saveProgress, onComplete]);

  // Mark as viewed (for text/document/notes - instant completion)
  const markAsViewed = useCallback(async () => {
    if (!user || !lessonId || !contentItemId) return;

    console.log('[ContentItemProgress] Marking content item as viewed:', contentItemId);
    await saveProgress({ viewed: true }, true);
  }, [user, lessonId, contentItemId, saveProgress]);

  // Cleanup on unmount
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
    markAsComplete,
    markAsViewed,
  };
};

export default useContentItemProgress;
