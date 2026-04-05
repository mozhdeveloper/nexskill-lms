import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export interface LessonProgressItem {
  id: string;
  content_type: 'video' | 'quiz' | 'text' | 'document' | 'notes';
  isRequired: boolean; // notes are NOT required
  isCompleted: boolean;
  title?: string;
}

export interface UseLessonProgressResult {
  totalRequired: number;
  completedCount: number;
  isLessonComplete: boolean;
  items: LessonProgressItem[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook that returns per-lesson progress for showing checkmarks and progress counts.
 * Notes are excluded from completion requirements unless the lesson has ONLY notes.
 */
export const useLessonProgress = (lessonId: string): UseLessonProgressResult => {
  const { user } = useAuth();
  const [result, setResult] = useState<UseLessonProgressResult>({
    totalRequired: 0,
    completedCount: 0,
    isLessonComplete: false,
    items: [],
    isLoading: true,
    refresh: async () => {},
  });

  const fetchProgress = useCallback(async () => {
    if (!user || !lessonId) {
      setResult(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      // Get all content items for this lesson
      const { data: allItems, error: itemsError } = await supabase
        .from('lesson_content_items')
        .select('id, content_type, metadata')
        .eq('lesson_id', lessonId)
        .order('position', { ascending: true });

      if (itemsError) throw itemsError;

      if (!allItems || allItems.length === 0) {
        setResult({
          totalRequired: 0,
          completedCount: 0,
          isLessonComplete: false,
          items: [],
          isLoading: false,
          refresh: fetchProgress,
        });
        return;
      }

      // Get completed items from lesson_content_item_progress
      const { data: completedItems, error: progressError } = await supabase
        .from('lesson_content_item_progress')
        .select('content_item_id')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .eq('is_completed', true);

      if (progressError) throw progressError;

      const completedIds = new Set((completedItems || []).map((item: any) => item.content_item_id));

      // Determine required items (videos and quizzes only)
      const requiredItems = allItems.filter(
        (item: any) => item.content_type === 'video' || item.content_type === 'quiz'
      );

      // Build items list with completion status
      const items: LessonProgressItem[] = allItems.map((item: any) => ({
        id: item.id,
        content_type: item.content_type,
        isRequired: item.content_type === 'video' || item.content_type === 'quiz',
        isCompleted: completedIds.has(item.id),
        title: item.metadata?.title,
      }));

      // If lesson has ONLY notes (no videos/quizzes), it auto-completes when opened
      // In that case, all items are "completed" if any progress exists
      const isNotesOnly = requiredItems.length === 0;

      const totalRequired = isNotesOnly ? 0 : requiredItems.length;
      const completedCount = isNotesOnly
        ? (completedIds.size > 0 ? 1 : 0) // notes-only: completed if any progress exists
        : requiredItems.filter((item: any) => completedIds.has(item.id)).length;

      const isLessonComplete = isNotesOnly
        ? completedIds.size > 0
        : completedCount >= totalRequired && totalRequired > 0;

      setResult({
        totalRequired,
        completedCount,
        isLessonComplete,
        items,
        isLoading: false,
        refresh: fetchProgress,
      });
    } catch (err) {
      console.error('[useLessonProgress] Error fetching progress:', err);
      setResult(prev => ({ ...prev, isLoading: false }));
    }
  }, [user, lessonId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return { ...result, refresh: fetchProgress };
};

export default useLessonProgress;
