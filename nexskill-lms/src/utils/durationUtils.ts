// Shared utility for accurate lesson/module duration calculation
// This logic is extracted from LessonSidebar and can be used by both sidebar and course detail page

export interface LessonContentItem {
  id: string;
  lesson_id: string;
  content_type: string;
  content_id?: string;
  metadata?: any;
}

export interface QuizData {
  id: string;
  time_limit_minutes?: number;
}

export interface LessonData {
  id: string;
  estimated_duration_minutes?: number;
  content_blocks?: any[];
}

export interface VideoProgressData {
  lesson_id: string;
  duration_seconds: number;
}

export interface DurationUtilsInput {
  lessonContentItems: LessonContentItem[];
  quizzesData: QuizData[];
  lessonsData: LessonData[];
  videoProgressData: VideoProgressData[];
  fetchYouTubeDurations: (videoIds: string[]) => Promise<Map<string, number>>;
}

export async function computeLessonDurations({
  lessonContentItems,
  quizzesData,
  lessonsData,
  videoProgressData,
  fetchYouTubeDurations,
}: DurationUtilsInput): Promise<Map<string, number>> {
  // --- Build maps for lesson content types and quiz content IDs ---
  const lessonVideoContentItems: Record<string, Array<{ id: string; metadata: any }>> = {};
  const lessonQuizContentIds: Record<string, string[]> = {};

  (lessonContentItems || []).forEach((item) => {
    if (item.content_type === 'video') {
      if (!lessonVideoContentItems[item.lesson_id]) {
        lessonVideoContentItems[item.lesson_id] = [];
      }
      lessonVideoContentItems[item.lesson_id].push({
        id: item.id,
        metadata: item.metadata || {},
      });
    }
    if (item.content_type === 'quiz' && item.content_id) {
      if (!lessonQuizContentIds[item.lesson_id]) {
        lessonQuizContentIds[item.lesson_id] = [];
      }
      lessonQuizContentIds[item.lesson_id].push(item.content_id);
    }
  });

  // --- Quiz durations ---
  const quizDurationMap = new Map<string, number>();
  (quizzesData || []).forEach((quiz) => {
    const durationSeconds = (quiz.time_limit_minutes || 15) * 60;
    quizDurationMap.set(quiz.id, durationSeconds);
  });

  // Calculate total quiz duration per lesson (ONLY for quizzes inside lessons)
  const lessonQuizDurationMap = new Map<string, number>();
  Object.entries(lessonQuizContentIds).forEach(([lessonId, quizIdsInLesson]) => {
    const totalQuizSeconds = quizIdsInLesson.reduce((sum, quizId) => {
      return sum + (quizDurationMap.get(quizId) || 15 * 60);
    }, 0);
    lessonQuizDurationMap.set(lessonId, totalQuizSeconds);
  });

  // --- Video durations ---
  const lessonVideoDurationMap = new Map<string, number>();
  const youtubeVideoUrls: string[] = [];
  const contentItemIdToYouTubeId = new Map<string, string>();
  const lessonIdForYouTubeId = new Map<string, string>();

  // Helper for extracting YouTube ID
  const extractYouTubeId = (url: string): string | null =>
    url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1] ?? null;

  // Try to get durations from lesson_content_items metadata
  Object.entries(lessonVideoContentItems).forEach(([lessonId, videoItems]) => {
    let lessonTotalSeconds = 0;
    let hasAllDurations = true;

    videoItems.forEach((videoItem) => {
      const duration = videoItem.metadata?.duration;
      if (typeof duration === 'number' && duration > 0) {
        lessonTotalSeconds += duration;
      } else {
        hasAllDurations = false;
        // Check if it's a YouTube video
        const url = videoItem.metadata?.url || '';
        const ytId = extractYouTubeId(url);
        if (ytId) {
          youtubeVideoUrls.push(ytId);
          contentItemIdToYouTubeId.set(videoItem.id, ytId);
        }
      }
    });

    if (hasAllDurations) {
      lessonVideoDurationMap.set(lessonId, lessonTotalSeconds);
    }
  });

  // Fallback to content_blocks for lessons without lesson_content_items video data
  (lessonsData ?? []).forEach((l) => {
    if (lessonVideoDurationMap.has(l.id)) return; // Already have duration from lesson_content_items
    if (!Array.isArray(l.content_blocks)) return;

    const videoBlock = l.content_blocks.find(
      (b: any) => b.type === 'video' || b.block_type === 'video'
    );
    if (!videoBlock) return;

    const metaDuration =
      videoBlock.attributes?.media_metadata?.duration ??
      videoBlock.attributes?.duration ??
      null;

    if (typeof metaDuration === 'number' && metaDuration > 0) {
      lessonVideoDurationMap.set(l.id, metaDuration);
      return;
    }

    const url: string = videoBlock.content ?? videoBlock.url ?? '';
    const ytId = extractYouTubeId(url);
    if (ytId) {
      youtubeVideoUrls.push(ytId);
      lessonIdForYouTubeId.set(ytId, l.id);
    }
  });

  // Fetch YouTube durations for all videos
  const youtubeDurationMap = await fetchYouTubeDurations(
    [...new Set(youtubeVideoUrls)]
  );

  // Apply YouTube durations to lesson_content_items
  Object.entries(lessonVideoContentItems).forEach(([lessonId, videoItems]) => {
    if (lessonVideoDurationMap.has(lessonId)) return; // Already have duration

    let lessonTotalSeconds = 0;
    let hasAllDurations = true;

    videoItems.forEach((videoItem) => {
      const duration = videoItem.metadata?.duration;
      if (typeof duration === 'number' && duration > 0) {
        lessonTotalSeconds += duration;
      } else {
        const ytId = contentItemIdToYouTubeId.get(videoItem.id);
        if (ytId && youtubeDurationMap.has(ytId)) {
          lessonTotalSeconds += youtubeDurationMap.get(ytId)!;
        } else {
          hasAllDurations = false;
        }
      }
    });

    if (hasAllDurations && lessonTotalSeconds > 0) {
      lessonVideoDurationMap.set(lessonId, lessonTotalSeconds);
    }
  });

  // Apply YouTube durations to content_blocks fallback
  lessonIdForYouTubeId.forEach((lessonId, ytId) => {
    if (!lessonVideoDurationMap.has(lessonId)) {
      const secs = youtubeDurationMap.get(ytId);
      if (secs) {
        lessonVideoDurationMap.set(lessonId, secs);
      }
    }
  });

  // If still no video duration, fallback to watched duration
  (lessonsData ?? []).forEach((l) => {
    if (!lessonVideoDurationMap.has(l.id)) {
      const watched = videoProgressData.find((v) => v.lesson_id === l.id);
      if (watched && watched.duration_seconds > 0) {
        lessonVideoDurationMap.set(l.id, watched.duration_seconds);
      }
    }
  });

  // --- Compose final lesson duration map (videos + quizzes) ---
  const lessonTotalDurationMap = new Map<string, number>();
  (lessonsData ?? []).forEach((l) => {
    const videoSeconds = lessonVideoDurationMap.get(l.id) || 0;
    const quizSeconds = lessonQuizDurationMap.get(l.id) || 0;
    const totalSeconds = videoSeconds + quizSeconds;
    lessonTotalDurationMap.set(l.id, totalSeconds);
  });

  return lessonTotalDurationMap;
}
