import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import LessonSidebar from '../../components/learning/LessonSidebar';
import ContentBlockRenderer from '../../components/learning/ContentBlockRenderer';
import StudentContentRenderer from '../../components/learning/StudentContentRenderer';
import DownloadCenter from '../../components/learning/DownloadCenter';
import LessonNotesPanel from '../../components/learning/LessonNotesPanel';
import AISummaryDrawer from '../../components/learning/AISummaryDrawer';
import AskAIWidget from '../../components/learning/AskAIWidget';
import MarkLessonCompleteModal from '../../components/learning/MarkLessonCompleteModal';
import type { Lesson } from '../../types/lesson';
import type { LessonContentItem } from '../../types/lesson-content-item';
import { fetchLessonContentItems } from '../../lib/supabase/lesson-content.queries';
import { usePageScrollCompletion } from '../../hooks/usePageScrollCompletion';
import { useLessonAccessStatus } from '../../hooks/useQuizSubmission';

type LessonWithModule = Lesson & { moduleTitle?: string };

interface FlatItem {
  id: string;
  type: 'lesson' | 'quiz';
}

type BottomTab = 'downloads' | 'notes' | 'ask-ai' | 'ai-summary';

const CoursePlayer: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();
  const [showAIDrawer, setShowAIDrawer] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showGraduation, setShowGraduation] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [completedQuizIds, setCompletedQuizIds] = useState<string[]>([]);
  const [lastCompletedContentItemId, setLastCompletedContentItemId] = useState<string | null>(null);
  const [totalLessonsInCourse, setTotalLessonsInCourse] = useState(0);
  const [courseTitle, setCourseTitle] = useState('');
  const [currentLesson, setCurrentLesson] = useState<LessonWithModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flatItemList, setFlatItemList] = useState<FlatItem[]>([]);
  const [lessonContentItems, setLessonContentItems] = useState<LessonContentItem[]>([]);
  const [lockedLessonIds, setLockedLessonIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<BottomTab | null>(null);

  // Ref to track completed content items locally to avoid DB fetch race conditions
  const completedContentItemsRef = useRef<Set<string>>(new Set());

  // Track if current lesson has been marked complete (state to trigger re-renders)
  const [currentLessonMarkedComplete, setCurrentLessonMarkedComplete] = useState(false);

  // Hook to detect when user scrolls to bottom of page (near Next Lesson button)
  const handlePageScrollComplete = useCallback(() => {
    if (currentLessonMarkedComplete || !lessonId || !courseId) return;

    console.log('[CoursePlayer] User scrolled to bottom of page, marking lesson complete');
    setCurrentLessonMarkedComplete(true);

    // Update UI immediately (optimistic update)
    setCompletedLessons(prev => prev.includes(lessonId) ? prev : [...prev, lessonId]);

    // Mark lesson as complete in DB
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      supabase
        .from('user_lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          is_completed: true,
          completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,lesson_id' })
        .then(({ error }) => {
          if (error) {
            console.error('[CoursePlayer] Error marking lesson complete:', error);
          } else {
            console.log('[CoursePlayer] Lesson marked complete in DB');
          }
        });
    });
  }, [lessonId, courseId, currentLessonMarkedComplete]);

  // Check if lesson is notes-only (no videos/quizzes)
  const hasVideosOrQuizzes = lessonContentItems.some(item => 
    item.content_type === 'video' || item.content_type === 'quiz'
  );
  const isNotesOnlyLesson = lessonContentItems.length > 0 && !hasVideosOrQuizzes;

  // Only enable scroll completion for notes-only lessons
  // Video/quizzes lessons should only complete via their own progress tracking
  const { triggerRef: bottomTriggerRef } = usePageScrollCompletion({
  onComplete: handlePageScrollComplete,
  enabled: !!lessonId && !!courseId && !currentLessonMarkedComplete && isNotesOnlyLesson,
  resetKey: `${lessonId}-${isNotesOnlyLesson}`,
});

  // Fetch lesson access status (locked/unlocked)
  const { isLessonLocked } = useLessonAccessStatus(courseId);

  useEffect(() => {
    let cancelled = false;

    const fetchLessonData = async () => {
      if (!courseId || !lessonId) return;

      try {
        setLoading(true);
        setError(null);

        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('title')
          .eq('id', courseId)
          .single();

        if (courseError) throw courseError;
        if (cancelled) return;
        setCourseTitle(courseData.title);

        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .select('id, title, description, content_blocks, estimated_duration_minutes, content_status, created_at, updated_at')
          .eq('id', lessonId)
          .single();

        if (lessonError) throw lessonError;

        const { data: moduleData, error: moduleError } = await supabase
          .from('module_content_items')
          .select(`
            module_id,
            modules(title)
          `)
          .eq('content_id', lessonId)
          .eq('content_type', 'lesson')
          .single();

        if (moduleError) throw moduleError;

        const lessonWithModule = {
          ...lessonData,
          moduleTitle: (moduleData.modules as unknown as { title: string } | null)?.title || ''
        };

        if (cancelled) return;
        setCurrentLesson(lessonWithModule);

        try {
          const contentItems = await fetchLessonContentItems(lessonId);
          console.log('[CoursePlayer] Fetched lessonContentItems for lesson', lessonId, ':', contentItems);
          console.log('[CoursePlayer] lessonContentItems.length:', contentItems.length);
          console.log('[CoursePlayer] lessonContentItems types:', contentItems.map(item => item.content_type));
          
          if (cancelled) return;
          setLessonContentItems(contentItems);
        } catch (contentError) {
          console.error('[CoursePlayer] Error fetching lesson content items:', contentError);
          if (cancelled) return;
          setLessonContentItems([]);
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: mods } = await supabase
            .from('modules')
            .select('id, position')
            .eq('course_id', courseId)
            .eq('content_status', 'published')
            .order('position', { ascending: true });

          const moduleIds = (mods || []).map((m: any) => m.id);

          if (moduleIds.length > 0) {
            const { data: contentItems } = await supabase
              .from('module_content_items')
              .select('module_id, content_id, content_type, position')
              .in('module_id', moduleIds)
              .eq('content_status', 'published')
              .order('position', { ascending: true });

            const moduleOrder = new Map((mods || []).map((m: any, i: number) => [m.id, i]));
            const sorted = [...(contentItems || [])].sort((a, b) => {
              const modDiff = (moduleOrder.get(a.module_id) ?? 0) - (moduleOrder.get(b.module_id) ?? 0);
              return modDiff !== 0 ? modDiff : a.position - b.position;
            });

            if (cancelled) return;
            setFlatItemList(sorted.map((ci) => ({ id: ci.content_id, type: ci.content_type as 'lesson' | 'quiz' })));

            const lessonIds = sorted.filter((ci) => ci.content_type === 'lesson').map((ci) => ci.content_id);
            const quizIdsInCourse = sorted.filter((ci) => ci.content_type === 'quiz').map((ci) => ci.content_id);

            if (cancelled) return;
            setTotalLessonsInCourse(lessonIds.length);

            if (lessonIds.length > 0) {
              const { data: progressRows } = await supabase
                .from('user_lesson_progress')
                .select('lesson_id')
                .eq('user_id', user.id)
                .eq('is_completed', true)
                .in('lesson_id', lessonIds);

              const dbCompleted = (progressRows || []).map((r: any) => r.lesson_id);

              // Merge with existing optimistic completions instead of replacing
              // This prevents double-fetches or race conditions from wiping out optimistic state
              if (cancelled) return;
              setCompletedLessons(prev => {
                const merged = new Set([...dbCompleted, ...prev]);
                return Array.from(merged);
              });
            }

            if (quizIdsInCourse.length > 0) {
              const { data: quizRows } = await supabase
                .from('quiz_attempts')
                .select('quiz_id')
                .eq('user_id', user.id)
                .eq('passed', true)
                .in('quiz_id', quizIdsInCourse);

              const dbQuizCompleted = (quizRows || []).map((r: any) => r.quiz_id);

              // Merge with existing optimistic completions
              if (cancelled) return;
              setCompletedQuizIds(prev => {
                const merged = new Set([...dbQuizCompleted, ...prev]);
                return Array.from(merged);
              });
            }
          }
        }
      } catch (err) {
        if (cancelled) return;
        console.error('Error fetching lesson data:', err);
        setError('Failed to load lesson data');
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    };

    fetchLessonData();

    return () => {
      cancelled = true;
    };
  }, [courseId, lessonId]);

  const lessonNumber = flatItemList
    .filter(item => item.type === 'lesson')
    .findIndex(item => item.id === lessonId) + 1;

  const progress = totalLessonsInCourse > 0
    ? Math.min(100, Math.round((completedLessons.length / totalLessonsInCourse) * 100))
    : 0;

  const handleSelectLesson = (newLessonId: string) => {
    const item = flatItemList.find((i) => i.id === newLessonId);
    if (item?.type === 'quiz') {
      navigate(`/student/courses/${courseId}/quizzes/${newLessonId}/take`);
    } else {
      // Check if lesson is locked
      if (isLessonLocked(newLessonId)) {
        alert('This lesson is locked. Complete the previous quiz to unlock it.');
        return;
      }
      navigate(`/student/courses/${courseId}/lessons/${newLessonId}`);
    }
  };

  const currentIndex = flatItemList.findIndex((i) => i.id === lessonId);
  const prevItem = currentIndex > 0 ? flatItemList[currentIndex - 1] : null;
  const nextItem = currentIndex >= 0 && currentIndex < flatItemList.length - 1 ? flatItemList[currentIndex + 1] : null;

  // Check if current lesson is complete (for Next button)
  const isCurrentLessonComplete = completedLessons.includes(lessonId || '');
  
  // FIXED: Next button ONLY depends on whether current lesson is complete
  // Do NOT check lesson_access_status table - it's separate from user_lesson_progress
  // Source of truth: completedLessons state (backed by user_lesson_progress database)
  const isNextItemLocked = useMemo(() => {
    // If there's no next item, nothing to lock
    if (!nextItem) return false;
    
    // If current lesson IS complete → Next button enabled
    if (isCurrentLessonComplete) return false;
    
    // Current lesson NOT complete → Next button locked
    return true;
  }, [nextItem, isCurrentLessonComplete]);

  // Previous navigation - ALWAYS allowed, no validation
  const handleNavigatePrevious = useCallback((item: { id: string; type: 'lesson' | 'quiz' }) => {
    if (item.type === 'quiz') {
      navigate(`/student/courses/${courseId}/quizzes/${item.id}/take`);
    } else {
      navigate(`/student/courses/${courseId}/lessons/${item.id}`);
    }
  }, [courseId, navigate]);

  // Next navigation - requires current lesson to be complete
  const handleNavigateNext = useCallback((item: { id: string; type: 'lesson' | 'quiz' }) => {
    if (!isCurrentLessonComplete) {
      alert('🔒 Please complete all videos and quizzes in the current lesson before proceeding.');
      return;
    }
    if (item.type === 'quiz') {
      navigate(`/student/courses/${courseId}/quizzes/${item.id}/take`);
    } else {
      navigate(`/student/courses/${courseId}/lessons/${item.id}`);
    }
  }, [courseId, navigate, isCurrentLessonComplete]);

  const handleMarkComplete = useCallback(async () => {
    if (!lessonId || !courseId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_lesson_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          is_completed: true,
          completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,lesson_id' });

      if (error) throw error;

      setCompletedLessons(prev => prev.includes(lessonId) ? prev : [...prev, lessonId]);
      setShowCompleteModal(false);
    } catch (err) {
      console.error('Error marking lesson as complete:', err);
      alert('Failed to mark lesson as complete. Please try again.');
    }
  }, [lessonId, courseId]);

  // Helper function to check and mark lesson complete
  // This is the CORE backend validation function that determines lesson completion
  const checkAndMarkLessonComplete = useCallback(async (userId: string, currentLessonId: string, justCompletedItemId?: string) => {
    console.log('[CoursePlayer] ========== Checking lesson completion ==========');
    console.log('[CoursePlayer] Lesson ID:', currentLessonId);
    console.log('[CoursePlayer] User ID:', userId);
    console.log('[CoursePlayer] Just completed item:', justCompletedItemId);
    
    // WAIT 500ms to ensure database saves are complete (race condition fix)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // STEP 1: Check if lesson uses new lesson_content_items system
    const { data: allContentItems } = await supabase
      .from('lesson_content_items')
      .select('id, content_type, content_id')
      .eq('lesson_id', currentLessonId);

    console.log('[CoursePlayer] Content items found:', allContentItems?.length || 0);

    // If lesson has content items (new system)
    if (allContentItems && allContentItems.length > 0) {
      console.log('[CoursePlayer] ✅ Using NEW lesson_content_items system');
      
      // Filter to only "required" content types (videos and quizzes)
      const requiredItems = allContentItems.filter(
        (item: any) => item.content_type === 'video' || item.content_type === 'quiz'
      );

      console.log('[CoursePlayer] Required items:', requiredItems.length);
      console.log('[CoursePlayer] Required item IDs:', requiredItems.map((i: any) => i.id));

      // SPECIAL CASE: If no required items (only text/notes/documents), auto-complete lesson
      if (requiredItems.length === 0) {
        console.log('[CoursePlayer] ⚡ No required items - auto-completing lesson');
        const { error } = await supabase
          .from('user_lesson_progress')
          .upsert({
            user_id: userId,
            lesson_id: currentLessonId,
            is_completed: true,
            completed_at: new Date().toISOString(),
          }, { onConflict: 'user_id,lesson_id' });

        if (!error) {
          console.log('[CoursePlayer] ✅ Lesson auto-completed!');
          setCompletedLessons(prev => prev.includes(currentLessonId) ? prev : [...prev, currentLessonId]);
        } else {
          console.error('[CoursePlayer] ❌ Error:', error);
        }
        return;
      }

      // Get completed REQUIRED content items
      const { data: completedItems } = await supabase
        .from('lesson_content_item_progress')
        .select('content_item_id')
        .eq('user_id', userId)
        .eq('lesson_id', currentLessonId)
        .eq('is_completed', true);

      console.log('[CoursePlayer] Completed items from DB:', completedItems?.length || 0);
      console.log('[CoursePlayer] Completed item IDs:', completedItems?.map((i: any) => i.content_item_id));

      // Build completed set - INCLUDE the just-completed item if provided
      const completedIds = new Set((completedItems || []).map((item: any) => item.content_item_id));
      if (justCompletedItemId) {
        completedIds.add(justCompletedItemId);
        console.log('[CoursePlayer] ➕ Added just-completed item to set:', justCompletedItemId);
      }
      
      console.log('[CoursePlayer] Total completed IDs (including pending):', completedIds.size);
      
      // Check if ALL REQUIRED content items are completed
      const allContentCompleted = requiredItems.every((item: any) => completedIds.has(item.id));
      
      console.log('[CoursePlayer] All content completed?', allContentCompleted);
      console.log('[CoursePlayer] Progress:', completedIds.size, '/', requiredItems.length);

      // STEP 2: Check quiz completion status (if lesson has quizzes)
      const quizItems = requiredItems.filter((item: any) => item.content_type === 'quiz');
      let allQuizzesPassed = true;

      if (quizItems.length > 0) {
        console.log('[CoursePlayer] 🔍 Checking quiz completion status...');
        
        for (const quizItem of quizItems) {
          const quizId = quizItem.content_id;
          console.log('[CoursePlayer] Checking quiz:', quizId);
          
          // Check if quiz is completed and passed
          const { data: quizAttempts } = await supabase
            .from('quiz_attempts')
            .select('passed, status')
            .eq('user_id', userId)
            .eq('quiz_id', quizId)
            .eq('status', 'graded')
            .order('attempt_number', { ascending: false })
            .limit(1);

          const latestAttempt = quizAttempts?.[0];
          const quizPassed = latestAttempt?.passed === true;
          
          console.log('[CoursePlayer] Quiz', quizId, '- Passed:', quizPassed, '- Attempt:', latestAttempt);
          
          if (!quizPassed) {
            allQuizzesPassed = false;
            console.log('[CoursePlayer] ❌ Quiz not passed - blocking lesson completion');
            break;
          }
        }
      }

      console.log('[CoursePlayer] All quizzes passed?', allQuizzesPassed);

      // LESSON IS COMPLETE ONLY IF: All content completed AND all quizzes passed
      if (allContentCompleted && allQuizzesPassed) {
        console.log('[CoursePlayer] 🎉 LESSON FULLY COMPLETE! Marking in database...');

        const { error } = await supabase
          .from('user_lesson_progress')
          .upsert({
            user_id: userId,
            lesson_id: currentLessonId,
            is_completed: true,
            completed_at: new Date().toISOString(),
          }, { onConflict: 'user_id,lesson_id' });

        if (error) {
          console.error('[CoursePlayer] ❌ Error marking lesson complete:', error);
        } else {
          console.log('[CoursePlayer] ✅ SUCCESS! Lesson marked as complete in database!');
          setCompletedLessons(prev => {
            const updated = prev.includes(currentLessonId) ? prev : [...prev, currentLessonId];
            console.log('[CoursePlayer] Updated completedLessons:', updated);
            return updated;
          });
        }
      } else {
        console.log('[CoursePlayer] ⚠️ Lesson NOT complete yet:');
        if (!allContentCompleted) {
          const remaining = requiredItems.filter((item: any) => !completedIds.has(item.id));
          console.log('[CoursePlayer]   - Content items remaining:', remaining.length, remaining.map((i: any) => i.id));
        }
        if (!allQuizzesPassed) {
          console.log('[CoursePlayer]   - Not all quizzes passed');
        }
      }
      return;
    }

    // STEP 3: Fallback to legacy content_blocks system
    console.log('[CoursePlayer] 🔄 Falling back to LEGACY content_blocks system');
    
    // Get lesson data to check content_blocks
    const { data: lessonData } = await supabase
      .from('lessons')
      .select('content_blocks')
      .eq('id', currentLessonId)
      .single();

    console.log('[CoursePlayer] Lesson data:', lessonData ? 'Found' : 'Not found');
    console.log('[CoursePlayer] Content blocks:', lessonData?.content_blocks ? JSON.stringify(lessonData.content_blocks).substring(0, 100) : 'None');

    if (!lessonData?.content_blocks || lessonData.content_blocks.length === 0) {
      console.log('[CoursePlayer] ⚡ No content blocks - auto-completing');
      const { error } = await supabase
        .from('user_lesson_progress')
        .upsert({
          user_id: userId,
          lesson_id: currentLessonId,
          is_completed: true,
          completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,lesson_id' });

      if (!error) {
        setCompletedLessons(prev => prev.includes(currentLessonId) ? prev : [...prev, currentLessonId]);
      }
      return;
    }

    // Check if lesson has video blocks
    const videoBlocks = lessonData.content_blocks.filter((block: any) => 
      block.type === 'video' || block.block_type === 'video'
    );

    console.log('[CoursePlayer] Video blocks found:', videoBlocks.length);

    if (videoBlocks.length === 0) {
      // No videos, mark as complete
      console.log('[CoursePlayer] ⚡ No video blocks - auto-completing');
      const { error } = await supabase
        .from('user_lesson_progress')
        .upsert({
          user_id: userId,
          lesson_id: currentLessonId,
          is_completed: true,
          completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,lesson_id' });

      if (!error) {
        setCompletedLessons(prev => prev.includes(currentLessonId) ? prev : [...prev, currentLessonId]);
      }
      return;
    }

    // Check video completion from lesson_video_progress table
    console.log('[CoursePlayer] Querying lesson_video_progress...');
    const { data: videoProgress } = await supabase
      .from('lesson_video_progress')
      .select('video_url, is_completed')
      .eq('user_id', userId)
      .eq('lesson_id', currentLessonId)
      .eq('is_completed', true);

    console.log('[CoursePlayer] Completed videos from DB:', videoProgress?.length || 0);
    console.log('[CoursePlayer] Completed video URLs:', videoProgress?.map((vp: any) => vp.video_url));

    const completedVideoUrls = new Set((videoProgress || []).map((vp: any) => vp.video_url));
    
    // Check if all videos are completed
    const allVideosCompleted = videoBlocks.every((block: any) => {
      const videoUrl = block.content || block.url || block.attributes?.external_url || block.attributes?.media_url;
      const isCompleted = completedVideoUrls.has(videoUrl);
      console.log('[CoursePlayer] Video block URL:', videoUrl, '- Completed:', isCompleted);
      return isCompleted;
    });

    console.log('[CoursePlayer] Legacy system - All videos completed?', allVideosCompleted);

    if (allVideosCompleted) {
      console.log('[CoursePlayer] 🎉 LESSON COMPLETE (legacy system)! Marking in database...');
      const { error } = await supabase
        .from('user_lesson_progress')
        .upsert({
          user_id: userId,
          lesson_id: currentLessonId,
          is_completed: true,
          completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,lesson_id' });

      if (!error) {
        console.log('[CoursePlayer] ✅ SUCCESS! Lesson marked complete!');
        setCompletedLessons(prev => prev.includes(currentLessonId) ? prev : [...prev, currentLessonId]);
      } else {
        console.error('[CoursePlayer] ❌ Error:', error);
      }
    } else {
      console.log('[CoursePlayer] ⚠️ Not all videos completed in legacy system');
    }
  }, []);

  const handleVideoComplete = useCallback(() => {
    console.log('[CoursePlayer] Video complete - checking lesson completion');

    // Check and mark lesson complete if all content is done
    const checkLessonCompletion = async () => {
      if (!courseId || !lessonId) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await checkAndMarkLessonComplete(user.id, lessonId);
      
      // Also refresh completed lessons list
      const { data: mods } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', courseId)
        .eq('content_status', 'published');

      const moduleIds = (mods || []).map((m: any) => m.id);

      if (moduleIds.length > 0) {
        const { data: contentItems } = await supabase
          .from('module_content_items')
          .select('content_id, content_type')
          .in('module_id', moduleIds)
          .eq('content_type', 'lesson');

        const lessonIds = (contentItems || []).map((ci: any) => ci.content_id);

        if (lessonIds.length > 0) {
          const { data: progressRows } = await supabase
            .from('user_lesson_progress')
            .select('lesson_id')
            .eq('user_id', user.id)
            .eq('is_completed', true)
            .in('lesson_id', lessonIds);

          setCompletedLessons((progressRows || []).map((r: any) => r.lesson_id));
        }
      }
    };

    refreshCompletedLessons();
    // Removed completedLessons from deps to prevent race condition where stale DB fetch overwrites optimistic update
  }, [courseId, lessonId]);

  // Handle individual content item completion
  const handleContentItemComplete = useCallback(async (completedContentItemId: string) => {
    console.log('[CoursePlayer] Content item completed:', completedContentItemId);
    // Only update sidebar optimistically - don't check for lesson completion
    setLastCompletedContentItemId(completedContentItemId);
  }, []);

  // Reset the completion tracking ref when the lesson changes
  useEffect(() => {
    completedContentItemsRef.current = new Set();
  }, [lessonId]);

  // Reset lesson completion state when navigating to a new lesson
  // This ensures scroll-to-complete works for EVERY lesson, not just the first one
  useEffect(() => {
    setCurrentLessonMarkedComplete(false);
  }, [lessonId]);

  // Show graduation banner when all lessons are complete
  useEffect(() => {
    if (totalLessonsInCourse > 0 && completedLessons.length >= totalLessonsInCourse) {
      setShowGraduation(true);
    }
  }, [completedLessons, totalLessonsInCourse]);

  // NEW: Check lesson completion on mount (fixes issue where lesson was already complete but not marked)
  useEffect(() => {
    if (!lessonId || !courseId) return;
    
    console.log('[CoursePlayer] 📋 Checking lesson completion on mount from database...');
    
    const checkOnMount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Wait a bit for any pending saves
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if lesson is already complete in database
      const { data: existingCompletion, error } = await supabase
        .from('user_lesson_progress')
        .select('is_completed')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .eq('is_completed', true)
        .single();

      console.log('[CoursePlayer] Database query result:', existingCompletion);
      console.log('[CoursePlayer] Database error:', error);

      if (existingCompletion && existingCompletion.is_completed === true) {
        console.log('[CoursePlayer] ✅ Lesson is COMPLETE in database - unlocking Next button');
        // Update the component state so the Next button unlocks
        setCompletedLessons(prev => {
          const alreadyThere = prev.includes(lessonId);
          console.log('[CoursePlayer] Current completedLessons:', prev);
          console.log('[CoursePlayer] LessonId already in state?', alreadyThere);
          if (alreadyThere) return prev;
          const updated = [...prev, lessonId];
          console.log('[CoursePlayer] ➕ Updated completedLessons to:', updated);
          return updated;
        });
        return;
      }

      // If not complete, run the full check
      console.log('[CoursePlayer] ⏳ Lesson not complete yet in database - running full check...');
      await checkAndMarkLessonComplete(user.id, lessonId);
    };

    checkOnMount();
  }, [lessonId, courseId, checkAndMarkLessonComplete]);

  // Debug function to manually check completion status
  const handleDebugCheck = useCallback(async () => {
    console.log('[CoursePlayer] 🔧 Manual debug check triggered');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !lessonId) return;

    console.log('[CoursePlayer] User:', user.id);
    console.log('[CoursePlayer] Lesson:', lessonId);

    // Check content items
    const { data: contentItems } = await supabase
      .from('lesson_content_items')
      .select('id, content_type, content_id')
      .eq('lesson_id', lessonId);

    console.log('[CoursePlayer] Content items:', contentItems);

    // Check completed items
    const { data: completedItems } = await supabase
      .from('lesson_content_item_progress')
      .select('content_item_id, is_completed')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId);

    console.log('[CoursePlayer] Completed items:', completedItems);

    // Check lesson progress
    const { data: lessonProgress } = await supabase
      .from('user_lesson_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId);

    console.log('[CoursePlayer] Lesson progress:', lessonProgress);

    // Check lesson data
    const { data: lessonData } = await supabase
      .from('lessons')
      .select('content_blocks')
      .eq('id', lessonId)
      .single();

    console.log('[CoursePlayer] Lesson content_blocks:', lessonData?.content_blocks ? JSON.stringify(lessonData.content_blocks).substring(0, 200) : 'None');

    // Check video progress
    const { data: videoProgress } = await supabase
      .from('lesson_video_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId);

    console.log('[CoursePlayer] Video progress:', videoProgress);

    // Now run the actual check
    await checkAndMarkLessonComplete(user.id, lessonId);
    
    alert('Debug check complete! Check browser console for details.');
  }, [lessonId, checkAndMarkLessonComplete]);

  // NEW: Check lesson completion on mount (fixes issue where lesson was already complete but not marked)
  useEffect(() => {
    if (!lessonId || !courseId) return;
    
    console.log('[CoursePlayer] 📋 Checking lesson completion on mount from database...');
    
    const checkOnMount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Wait a bit for any pending saves
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if lesson is already complete in database
      const { data: existingCompletion, error } = await supabase
        .from('user_lesson_progress')
        .select('is_completed')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .eq('is_completed', true)
        .single();

      console.log('[CoursePlayer] Database query result:', existingCompletion);
      console.log('[CoursePlayer] Database error:', error);

      if (existingCompletion && existingCompletion.is_completed === true) {
        console.log('[CoursePlayer] ✅ Lesson is COMPLETE in database - unlocking Next button');
        // Update the component state so the Next button unlocks
        setCompletedLessons(prev => {
          const alreadyThere = prev.includes(lessonId);
          console.log('[CoursePlayer] Current completedLessons:', prev);
          console.log('[CoursePlayer] LessonId already in state?', alreadyThere);
          if (alreadyThere) return prev;
          const updated = [...prev, lessonId];
          console.log('[CoursePlayer] ➕ Updated completedLessons to:', updated);
          return updated;
        });
        return;
      }

      // If not complete, run the full check
      console.log('[CoursePlayer] ⏳ Lesson not complete yet in database - running full check...');
      await checkAndMarkLessonComplete(user.id, lessonId);
    };

    checkOnMount();
  }, [lessonId, courseId, checkAndMarkLessonComplete]);

  const handleTabClick = (tab: BottomTab) => {
    if (tab === 'ai-summary') {
      setShowAIDrawer(true);
      return;
    }
    setActiveTab(prev => prev === tab ? null : tab);
  };

  const bottomTabs: { id: BottomTab; label: string; icon: string }[] = [
    { id: 'downloads', label: 'Downloads', icon: '📥' },
    { id: 'notes', label: 'Notes', icon: '📝' },
    { id: 'ask-ai', label: 'Ask AI', icon: '🤖' },
    { id: 'ai-summary', label: 'AI Summary', icon: '✨' },
    { id: 'debug', label: 'Debug', icon: '🔧' },
  ];

  if (loading) {
    return (
      <StudentAppLayout>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-2">Loading lesson...</h2>
            <p className="text-text-secondary dark:text-dark-text-secondary">Please wait while we load your content.</p>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  if (error) {
    return (
      <StudentAppLayout>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-2">Error loading lesson</h2>
            <p className="text-text-secondary dark:text-dark-text-secondary mb-6">{error}</p>
            <button
              onClick={() => navigate('/student/courses')}
              className="px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-primary-light text-white font-medium rounded-full hover:shadow-lg transition-all"
            >
              Back to courses
            </button>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  if (!currentLesson) {
    return (
      <StudentAppLayout>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-2">Lesson not found</h2>
            <p className="text-text-secondary dark:text-dark-text-secondary mb-6">The lesson you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/student/courses')}
              className="px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-primary-light text-white font-medium rounded-full hover:shadow-lg transition-all"
            >
              Back to courses
            </button>
          </div>
        </div>
      </StudentAppLayout>
    );
  }

  // Custom header content to pass to StudentAppLayout
  const customHeader = (
    <div className="flex items-center justify-between w-full">
      <h1 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary truncate max-w-md">
        {courseTitle}
      </h1>
      <div className="flex items-center gap-4">
        {/* You can add other nav items here if needed */}
      </div>
    </div>
  );

  return (
    <StudentAppLayout customHeader={customHeader} hideSearch={true}>
      {/* Main Content — Udemy-style 2-column layout */}
      <div className="flex-1 overflow-y-auto px-8 py-6 pt-4">
        <div className="flex gap-6 items-start">
          {/* Left: Main content area (expanded) */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            {/* Content renderer */}
            <div className="bg-white dark:bg-dark-background-card rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
              {lessonContentItems && lessonContentItems.length > 0 ? (
                <StudentContentRenderer
                  contentItems={lessonContentItems}
                  lessonId={lessonId || ''}
                  onQuizClick={(quizId) => navigate(`/student/courses/${courseId}/quizzes/${quizId}/take`)}
                  onContentItemComplete={handleContentItemComplete}
                  onVideoComplete={handleVideoComplete}
                  prevItem={prevItem}
                  nextItem={nextItem}
                  onNavigatePrevious={handleNavigatePrevious}
                  onNavigateNext={handleNavigateNext}
                  isNextItemLocked={isNextItemLocked}
                  bottomTriggerRef={bottomTriggerRef}
                />
              ) : (
                <ContentBlockRenderer
                  contentBlocks={currentLesson.content_blocks || []}
                  lessonId={lessonId || ''}
                  onQuizClick={(quizId) => navigate(`/student/courses/${courseId}/quizzes/${quizId}/take`)}
                  onVideoComplete={handleVideoComplete}
                />
              )}
            </div>

            {/* Bottom tools section */}
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                {bottomTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-all duration-300 ease-in-out
                      ${activeTab === tab.id
                        ? 'text-brand-primary border-b-2 border-brand-primary bg-[#F5F7FF] dark:bg-gray-800'
                        : 'text-text-secondary dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                  >
                    <span>{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>

              {activeTab && activeTab !== 'ai-summary' && (
                <div
                  className="p-6 transition-all duration-300 ease-in-out"
                  style={{ animation: 'fadeSlideIn 0.3s ease forwards' }}
                >
                  {activeTab === 'downloads' && (
                    <DownloadCenter resources={[]} />
                  )}
                  {activeTab === 'notes' && (
                    <LessonNotesPanel activeLessonId={lessonId || ''} />
                  )}
                  {activeTab === 'ask-ai' && (
                    <AskAIWidget activeLessonId={lessonId || ''} />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Course content sidebar - Fixed position */}
          <div className="w-80 xl:w-96 flex-shrink-0 self-start">
            <div className="fixed w-80 xl:w-96 max-h-[calc(100vh-105px)] rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 shadow-sm overflow-y-auto
              [&::-webkit-scrollbar]:w-1.5
              [&::-webkit-scrollbar-track]:bg-transparent
              [&::-webkit-scrollbar-thumb]:bg-gray-300
              dark:[&::-webkit-scrollbar-thumb]:bg-gray-700
              [&::-webkit-scrollbar-thumb]:rounded-full">
              <LessonSidebar
                courseId={courseId || ''}
                activeLessonId={lessonId || ''}
                onSelectLesson={handleSelectLesson}
                completedLessonIds={completedLessons}
                completedQuizIds={completedQuizIds}
                lastCompletedContentItemId={lastCompletedContentItemId}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Inline fade-slide animation for tab content */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* AI Summary Drawer */}
      <AISummaryDrawer
        isOpen={showAIDrawer}
        onClose={() => setShowAIDrawer(false)}
        lessonTitle={currentLesson.title}
      />

      {/* Mark Complete Modal */}
      <MarkLessonCompleteModal
        isOpen={showCompleteModal}
        lessonTitle={currentLesson.title}
        onConfirm={handleMarkComplete}
        onCancel={() => setShowCompleteModal(false)}
      />

      {/* Graduation Banner */}
      {showGraduation && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl shadow-2xl p-5 flex items-start gap-4">
            <span className="text-3xl flex-shrink-0">🎓</span>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-lg mb-1">Course Complete!</div>
              <div className="text-sm text-green-100 mb-3">
                You've completed all lessons in <span className="font-semibold">{courseTitle}</span>. Your certificate is ready!
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/student/certificates/${courseId}`)}
                  className="px-4 py-1.5 bg-white text-green-700 font-semibold rounded-full text-sm hover:bg-green-50 transition-colors"
                >
                  Get Certificate
                </button>
                <button
                  onClick={() => setShowGraduation(false)}
                  className="px-4 py-1.5 bg-green-700/40 text-white font-medium rounded-full text-sm hover:bg-green-700/60 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </StudentAppLayout>
  );
};

export default CoursePlayer;
