import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

interface UseContentItemProgressOptions {
  lessonId: string;
  contentItemId: string;
  contentType: 'video' | 'quiz' | 'text' | 'document' | 'notes';
  onComplete?: () => void;
}

interface ContentItemProgressState {
  isCompleted: boolean;
  isLoading: boolean;
  progressData: any | null;
  error: string | null;
}

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
  // Tracks whether we have ever fired onComplete in this session
  const hasCompletedRef = useRef<boolean>(false);
  const isSavingRef = useRef<boolean>(false);
  // Stable ref so saveProgress closure always sees the latest callback
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

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
          const alreadyDone = data?.is_completed ?? false;
          // If the DB already shows complete, mark the session ref so we
          // never fire onComplete again for a completion that already happened.
          if (alreadyDone) hasCompletedRef.current = true;

          setState({
            isCompleted: alreadyDone,
            progressData: data?.progress_data ?? null,
            isLoading: false,
            error: null,
          });
        }
      } catch (err) {
        console.error('Error loading content item progress:', err);
        if (isMounted) {
          setState(prev => ({ ...prev, isLoading: false, error: 'Failed to load progress' }));
        }
      }
    };

    loadProgress();
    return () => { isMounted = false; };
  }, [user, lessonId, contentItemId]);

  // Core save — single source of truth for calling onComplete
  const saveProgress = useCallback(
    async (progressData?: any, markComplete = false) => {
      if (isSavingRef.current) return;
      if (!user || !lessonId || !contentItemId) return;

      isSavingRef.current = true;
      try {
        const updateData: any = {
          user_id: user.id,
          lesson_id: lessonId,
          content_item_id: contentItemId,
          content_type: contentType,
          is_completed: markComplete,
          completed_at: markComplete ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        };
        if (progressData) updateData.progress_data = progressData;

        const { error } = await supabase
          .from('lesson_content_item_progress')
          .upsert(updateData, { onConflict: 'user_id,lesson_id,content_item_id' });

        if (error) {
          console.error('[ContentItemProgress] Error saving progress:', error);
          return;
        }

        console.log('[ContentItemProgress] Progress saved', { markComplete, contentItemId });

        if (markComplete) {
          setState(prev => ({ ...prev, isCompleted: true }));

          // Fire onComplete exactly once per session — only for a *new* completion
          if (!hasCompletedRef.current) {
            hasCompletedRef.current = true;
            console.log('[ContentItemProgress] Firing onComplete for', contentItemId);
            onCompleteRef.current?.();
          }
        }
      } catch (err) {
        console.error('[ContentItemProgress] Error saving progress:', err);
      } finally {
        isSavingRef.current = false;
      }
    },
    [user, lessonId, contentItemId, contentType]
    // intentionally omit onComplete — we use the ref
  );

  const debouncedSave = useCallback(
    (progressData: any) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => saveProgress(progressData, false), 5000);
    },
    [saveProgress]
  );

  const updateProgress = useCallback(
    (progressData: any) => {
      debouncedSave(progressData);
      setState(prev => ({ ...prev, progressData }));
    },
    [debouncedSave]
  );

  // For videos — explicit complete call
  const markAsComplete = useCallback(async () => {
    if (!user || !lessonId || !contentItemId) return;
    console.log('[ContentItemProgress] markAsComplete:', contentItemId);
    await saveProgress({}, true);
  }, [user, lessonId, contentItemId, saveProgress]);

  // For text / notes — instant "viewed = complete"
  const markAsViewed = useCallback(async () => {
    if (!user || !lessonId || !contentItemId) return;
    console.log('[ContentItemProgress] markAsViewed:', contentItemId);
    await saveProgress({ viewed: true }, true);
  }, [user, lessonId, contentItemId, saveProgress]);

  useEffect(() => {
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, []);

  return { ...state, updateProgress, markAsComplete, markAsViewed };
};

export default useContentItemProgress;