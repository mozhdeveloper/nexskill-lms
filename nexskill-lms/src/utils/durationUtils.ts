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
  // lessonId -> Map<De-duplicationKey, metadata>
  const lessonVideoItems = new Map<string, Map<string, any>>(); 
  const lessonQuizIds = new Map<string, Set<string>>(); // lessonId -> Set of quizIds

  // helper for extracting YouTube ID
  const extractYouTubeId = (url: string): string | null =>
    url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1] ?? null;

  (lessonContentItems || []).forEach((item) => {
    if (item.content_type === 'video') {
      if (!lessonVideoItems.has(item.lesson_id)) {
        lessonVideoItems.set(item.lesson_id, new Map());
      }
      
      // Attempt aggressive de-duplication
      // Priority: content_id > youtube_id > url > link_id
      const url = item.metadata?.url || '';
      const ytId = extractYouTubeId(url);
      const key = item.content_id || ytId || url || item.id;
      
      // Only set if not already present to prevent doubling same video
      if (!lessonVideoItems.get(item.lesson_id)!.has(key)) {
        lessonVideoItems.get(item.lesson_id)!.set(key, item.metadata || {});
      }
    }
    if (item.content_type === 'quiz' && item.content_id) {
      if (!lessonQuizIds.has(item.lesson_id)) {
        lessonQuizIds.set(item.lesson_id, new Set());
      }
      lessonQuizIds.get(item.lesson_id)!.add(item.content_id);
    }
  });

  // --- Quiz durations (0 default if no time limit) ---
  const quizDurationMap = new Map<string, number>();
  (quizzesData || []).forEach((quiz) => {
    const durationSeconds = (quiz.time_limit_minutes || 0) * 60;
    quizDurationMap.set(quiz.id, durationSeconds);
  });

  // Calculate total quiz duration per lesson
  const lessonQuizDurationMap = new Map<string, number>();
  lessonQuizIds.forEach((qIds, lessonId) => {
    const totalQuizSeconds = Array.from(qIds).reduce((sum, qid) => {
      return sum + (quizDurationMap.get(qid) || 0);
    }, 0);
    lessonQuizDurationMap.set(lessonId, totalQuizSeconds);
  });

  // --- Video durations ---
  const lessonVideoDurationMap = new Map<string, number>();
  const youtubeVideoUrls: string[] = [];
  const contentKeyToYouTubeId = new Map<string, string>();
  const lessonIdForYouTubeId = new Map<string, string>();

  // Try to get durations from lesson_content_items metadata
  lessonVideoItems.forEach((videoItems, lessonId) => {
    let lessonTotalSeconds = 0;
    let hasAllDurations = true;

    videoItems.forEach((metadata, contentKey) => {
      const duration = metadata?.duration;
      if (typeof duration === 'number' && duration > 0) {
        lessonTotalSeconds += duration;
      } else {
        hasAllDurations = false;
        const url = metadata?.url || '';
        const ytId = extractYouTubeId(url);
        if (ytId) {
          youtubeVideoUrls.push(ytId);
          contentKeyToYouTubeId.set(contentKey, ytId);
        }
      }
    });

    if (hasAllDurations && lessonTotalSeconds > 0) {
      lessonVideoDurationMap.set(lessonId, lessonTotalSeconds);
    }
  });

  // Fallback to content_blocks for lessons without lesson_content_items video data
  (lessonsData ?? []).forEach((l) => {
    if (lessonVideoDurationMap.has(l.id)) return;
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

  // Fetch YouTube durations
  const youtubeDurationMap = await fetchYouTubeDurations([...new Set(youtubeVideoUrls)]);

  // Apply YouTube durations to lesson_content_items
  lessonVideoItems.forEach((videoItems, lessonId) => {
    if (lessonVideoDurationMap.has(lessonId)) return;

    let lessonTotalSeconds = 0;
    let hasAllDurations = true;

    videoItems.forEach((metadata, contentKey) => {
      const duration = metadata?.duration;
      if (typeof duration === 'number' && duration > 0) {
        lessonTotalSeconds += duration;
      } else {
        const ytId = contentKeyToYouTubeId.get(contentKey);
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
      if (secs) lessonVideoDurationMap.set(lessonId, secs);
    }
  });

  // Fallback to watched duration
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
    let videoSeconds = lessonVideoDurationMap.get(l.id) || 0;

    // Fallback to estimated_duration_minutes if still 0
    if (videoSeconds === 0) {
      videoSeconds = (l.estimated_duration_minutes || 0) * 60;
    }

    const quizSeconds = lessonQuizDurationMap.get(l.id) || 0;
    const totalSeconds = videoSeconds + quizSeconds;
    lessonTotalDurationMap.set(l.id, totalSeconds);
  });

  return lessonTotalDurationMap;
}
