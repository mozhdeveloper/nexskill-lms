# Video Progress Tracking Feature

## Overview
Tracks student video watch progress, auto-completes lessons when videos finish, and resumes videos from last watched position.

---

## Database Schema

### `lesson_video_progress` Table
```sql
CREATE TABLE public.lesson_video_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  lesson_id UUID NOT NULL REFERENCES lessons(id),
  video_url TEXT NOT NULL,
  duration_seconds INTEGER NULL,          -- Total video duration
  current_time_seconds INTEGER NOT NULL DEFAULT 0,  -- Last watched position
  watch_time_seconds INTEGER NOT NULL DEFAULT 0,    -- Cumulative watch time
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT lesson_video_progress_user_lesson_video_unique 
    UNIQUE (user_id, lesson_id, video_url)
);
```

### Key Fields
| Field | Purpose | Example |
|-------|---------|---------|
| `duration_seconds` | Total video length | `240` = 4 minutes |
| `current_time_seconds` | Last position | `120` = left off at 2:00 |
| `watch_time_seconds` | Total time watched | `180` = watched 3 minutes total |
| `is_completed` | Video finished | `true` when ≥80% watched |

---

## Completion Threshold

**Current: 80%** (configurable)

Change in:
- `src/hooks/useVideoProgress.ts` line 27: `threshold = 0.8`
- `src/components/learning/VideoProgressTracker.tsx` line 44: `threshold: 0.8`

Options:
- `0.8` = 80% (current)
- `0.9` = 90%
- `1.0` = 100% (must watch entire video)

---

## File Architecture

```
src/
├── hooks/
│   └── useVideoProgress.ts          # Core logic, DB operations
├── components/learning/
│   ├── VideoProgressTracker.tsx     # Wrapper component
│   ├── YouTubePlayer.tsx            # YouTube player with tracking
│   ├── HTML5VideoPlayer.tsx         # Direct upload player
│   └── ContentBlockRenderer.tsx     # Renders video blocks
└── pages/student/
    └── CoursePlayer.tsx             # Main lesson page
```

---

## Data Flow

```
CoursePlayer
  └─> ContentBlockRenderer (renders video)
       └─> VideoProgressTracker (manages state)
            └─> useVideoProgress (hook - DB operations)
                 └─> YouTubePlayer / HTML5VideoPlayer
```

### Callback Chain (Video Complete)
```
Video Ends
  └─> onVideoComplete() called
       └─> markAsComplete() in hook
            └─> Saves to lesson_video_progress
            └─> Saves to user_lesson_progress
            └─> Triggers UI update
```

---

## Key Features

### 1. Auto-Resume Video
- Loads `current_time_seconds` from DB on mount
- Seeks video to saved position when metadata loads
- Only seeks if position changed by >2 seconds (prevents conflicts)

### 2. Progress Saving
- Saves every 5 seconds while watching
- Saves immediately on pause
- Saves immediately when video ends
- Saves duration when video metadata loads

### 3. Auto-Complete
- Triggers when video reaches 80% threshold
- Updates `user_lesson_progress` table
- Shows "Video completed" message immediately
- No 5-second delay on completion

### 4. Completion Detection
- **HTML5 Video**: `onEnded` event triggers immediately
- **YouTube**: `YT.PlayerState.ENDED` event triggers immediately
- Both call `markAsComplete()` which updates DB

---

## Implementation Details

### useVideoProgress Hook

**State:**
```typescript
{
  currentTime: number,      // Current playback position
  duration: number,         // Total video duration
  watchTime: number,        // Cumulative watch time
  isCompleted: boolean,     // Whether video is completed
  isLoading: boolean,       // Loading from DB
  error: string | null
}
```

**Methods:**
- `updateProgress(currentTime, duration)` - Called on timeupdate
- `updateDuration(duration)` - Called when metadata loads (saves to DB)
- `markAsComplete()` - Manually mark complete
- `progressPercent` - Calculated: `(currentTime / duration) * 100`

### VideoProgressTracker Component

**Props:**
- `lessonId` - Current lesson ID
- `videoUrl` - Video URL (for DB lookup)
- `onComplete` - Parent callback when video completes
- `onDurationLoaded` - Parent callback when duration loads

**Render Props:**
```typescript
{
  onTimeUpdate: (currentTime, duration) => void,
  onDurationChange: (duration) => void,
  onVideoComplete: () => void,  // Pass to player
  isCompleted: boolean,
  progressPercent: number,
  startTime: number  // For resume
}
```

### YouTubePlayer

**Key Methods:**
- `seekTo(time, true)` - Seek to position
- `getCurrentTime()` - Get current position
- `getDuration()` - Get video duration

**Events:**
- `onPlayerReady` - Seek to startTime if provided
- `onPlayerStateChange` - Track play/pause/ended
- `useEffect([startTime])` - Seek when startTime updates

### HTML5VideoPlayer

**Key Methods:**
- `video.currentTime = time` - Seek to position
- `video.duration` - Get video duration

**Events:**
- `onLoadedMetadata` - Seek to startTime if provided
- `onTimeUpdate` - Save progress every 5 seconds
- `onEnded` - Trigger completion immediately
- `onPause` - Save progress

---

## Testing Checklist

### Resume Functionality
- [ ] Watch video to 50%
- [ ] Navigate away
- [ ] Come back - video should resume from ~50%
- [ ] Check console: `[VideoProgress] Saving progress: {..., saveDuration: true}`

### Completion
- [ ] Watch video to end
- [ ] Completion should trigger immediately (no delay)
- [ ] Check console: `[VideoProgress] Lesson marked complete!`
- [ ] Check DB: `is_completed = true`

### Duration Saving
- [ ] Run SQL: `SELECT duration_seconds FROM lesson_video_progress WHERE lesson_id = '...'`
- [ ] Should NOT be NULL after watching

---

## Common Issues & Fixes

### Issue: Video doesn't resume
**Cause:** `duration_seconds` is NULL in database

**Fix:** Check console for:
```
[VideoProgress] Saving progress: {..., saveDuration: true, ...}
```
If missing, `updateDuration()` isn't being called.

### Issue: Completion delayed
**Cause:** Waiting for 5-second poll instead of `onEnded` event

**Fix:** Ensure `onVideoComplete` is passed to players and called in `handleEnded`

### Issue: Infinite DB requests (ERR_INSUFFICIENT_RESOURCES)
**Cause:** `beforeunload` handler or cleanup effect triggering saves

**Fix:** Removed `beforeunload` listener, only save on explicit events

### Issue: Seek not working
**Cause:** `hasSeekedRef` prevents multiple seeks

**Fix:** Changed to `lastSeekTimeRef` - only seeks if position changed by >2 seconds

---

## SQL Queries for Debugging

### Check Progress
```sql
SELECT 
  lesson_id,
  video_url,
  duration_seconds,
  current_time_seconds,
  watch_time_seconds,
  is_completed,
  last_watched_at
FROM lesson_video_progress
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 10;
```

### Check Lesson Completion
```sql
SELECT 
  lesson_id,
  is_completed,
  completed_at
FROM user_lesson_progress
WHERE user_id = 'YOUR_USER_ID'
  AND lesson_id = 'YOUR_LESSON_ID';
```

### Clear Progress (for testing)
```sql
DELETE FROM lesson_video_progress
WHERE user_id = 'YOUR_USER_ID'
  AND lesson_id = 'YOUR_LESSON_ID';

DELETE FROM user_lesson_progress
WHERE user_id = 'YOUR_USER_ID'
  AND lesson_id = 'YOUR_LESSON_ID';
```

---

## Future Enhancements

### Not Implemented (Yet)
- [ ] Display actual video duration in UI (replace "15 min" placeholder)
- [ ] Show resume tooltip on hover ("Resume at 2:30")
- [ ] Anti-cheat: Track watch time vs video length
- [ ] Multiple videos per lesson support
- [ ] Progress sync across devices

### To Add Duration Display
1. Fetch duration from `lesson_video_progress` or video metadata
2. Update lesson header to show actual duration
3. Format: `Math.floor(duration / 60) + ":" + String(duration % 60).padStart(2, '0')`

---

## Last Updated
2025-03-25
