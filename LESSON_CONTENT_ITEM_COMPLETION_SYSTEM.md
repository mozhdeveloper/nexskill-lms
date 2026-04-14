# NexSkill LMS - Lesson Content Item Completion System

> **Architecture documentation for recreating seamless completion tracking across the website.**

---

## System Overview

The completion system uses a **layered approach** with three tiers of tracking:
1. **Content Item Level** — Each video, quiz, text, notes, or document item tracked individually
2. **Lesson Level** — Lesson marked complete when ALL required content items are consumed
3. **Course Level** — Course progress computed from completed lesson count

The system combines **DB-side triggers** with **client-side optimistic updates** for seamless UI updates without page refresh.

---

## Database Schema

### Central Table: `lesson_content_item_progress`

**Migration:** `supabase/migrations/20260331_create_content_item_progress_tracking.sql`

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid | Primary key |
| `user_id` | uuid | Auth user reference |
| `lesson_id` | uuid | Which lesson |
| `content_item_id` | uuid | Which specific content item |
| `content_type` | text | Enum: video/quiz/text/document/notes |
| `is_completed` | boolean | Completion flag |
| `progress_data` | jsonb | Per-type metadata (e.g., `{current_time_seconds, duration_seconds, watch_time_seconds}`) |
| `completed_at` | timestamptz | When completed |
| `updated_at` | timestamptz | Last update time |

**Unique constraint:** `(user_id, lesson_id, content_item_id)` — one record per user per content item.

### Auto-Completion Trigger

```sql
TRIGGER trg_mark_lesson_complete_on_content_done
  AFTER INSERT OR UPDATE ON lesson_content_item_progress
  FOR EACH ROW
  WHEN (NEW.is_completed = true)
  EXECUTE FUNCTION mark_lesson_complete_if_all_content_done()
```

**How it works:**
1. Fires whenever ANY row is set to `is_completed = true`
2. Calls `check_lesson_all_content_completed(user_id, lesson_id)` which counts:
   - Total content items in the lesson (from `lesson_content_items` table)
   - Completed items for that user (from `lesson_content_item_progress`)
3. If `total == completed`, upserts into `user_lesson_progress` with `is_completed = true`

**Critical design decision:** The trigger ONLY fires on `is_completed = true` transitions. It cannot self-heal a downgrade from true to false. This is why the frontend has multiple guards (`isLoadedRef`, `hasCompletedRef`) to prevent accidental overwrites.

---

## Completion Flows by Content Type

### 1. Video Completion

**Files:**
- `src/hooks/useVideoProgress.ts` — Core hook
- `src/components/learning/VideoProgressTracker.tsx` — Wrapper component
- `src/components/learning/YouTubePlayer.tsx` — YouTube IFrame API player
- `src/components/learning/HTML5VideoPlayer.tsx` — HTML5 `<video>` element player

**Flow:**

```
User watches video
  → Player fires onTimeUpdate events (every few seconds)
    → useVideoProgress.updateProgress(currentTime, duration)
      → Debounced save every 5 seconds (only if progressed ≥5s)
        → Upserts lesson_content_item_progress
          → If currentTime >= duration * 0.8: is_completed = true
            → DB trigger fires, checks ALL items

OR

User watches to end
  → Player fires onEnded / YT.PlayerState.ENDED
    → useVideoProgress.markAsComplete()
      → saveProgress(markComplete=true) — IMMEDIATE save
        → Upserts lesson_content_item_progress with is_completed = true
          → DB trigger fires, checks ALL items
          → Calls onComplete() callback
            → StudentContentRenderer → onContentItemComplete(item.id)
              → CoursePlayer.setLastCompletedContentItemId(item.id)
                → LessonSidebar optimistic update
```

**Key guards in `useVideoProgress`:**

| Guard | Purpose |
|-------|---------|
| `isLoadedRef` | Blocks saves until initial `loadProgress` query resolves. Prevents `updateDuration()` (which fires immediately on mount with `currentTime=0`) from writing `is_completed: false` and overwriting a previously completed status. |
| `hasCompletedRef` | Once completed, never downgrades. When navigating back to a completed video, `updateDuration()` fires with `currentTime=0` — this guard preserves the completed status. |
| `isSavingRef` | Prevents concurrent database writes. |
| `finalIsCompleted = isCompleted \|\| markComplete \|\| hasCompletedRef.current` | Ensures completion is monotonic — never flips back to false. |

**Completion threshold:** 80% (`threshold = 0.8`). Video considered complete when user watched 80% of its duration.

---

### 2. Quiz Completion

**Files:**
- `src/pages/student/QuizSession.tsx` — Quiz taking page
- `src/components/learning/StudentContentRenderer.tsx` — QuizItem component
- `src/hooks/useContentItemProgress.ts` — Generic progress hook

**Flow:**

```
Student submits quiz
  → QuizSession calculates score and pass/fail
    → If passed:
      1. Looks up quiz's lesson_id from quizzes table
      2. Finds quiz content item ID from lesson_content_items
         (WHERE content_type='quiz' AND content_id = quiz_id)
      3. Upserts lesson_content_item_progress:
         { is_completed: true, content_type: 'quiz',
           progress_data: { quiz_score, passed: true } }
      4. DB trigger fires, checks ALL items in lesson
         → If all done: upserts user_lesson_progress
```

**Key design decision:** Quiz completion writes directly to `lesson_content_item_progress` from `QuizSession.tsx` — it does NOT use a client-side `onComplete` callback chain like videos do. The sidebar will only reflect quiz completion on the next full data fetch (navigation or refresh). The `QuizItem` component uses `useContentItemProgress` to display the green checkmark, which loads from DB on mount.

---

### 3. Text / Notes Completion

**Files:**
- `src/hooks/useContentItemProgress.ts` — Generic progress hook
- `src/components/learning/StudentContentRenderer.tsx` — TextContent, NotesItem components

**Flow:**

```
User views text/notes content
  → useContentItemProgress.markAsViewed() called
    → saveProgress({ viewed: true }, markComplete=true)
      → Upserts lesson_content_item_progress with is_completed = true
        → DB trigger fires, checks ALL items in lesson
        → Calls onComplete() callback
          → StudentContentRenderer → onContentItemComplete(item.id)
            → CoursePlayer.setLastCompletedContentItemId(item.id)
              → LessonSidebar optimistic update
```

**Important:** Text and notes items use `markAsViewed()` which instantly marks them complete. There's no reading time threshold — viewing the content is enough.

---

### 4. Notes-Only Lesson Completion (Scroll-to-Complete)

**Files:**
- `src/hooks/usePageScrollCompletion.ts` — IntersectionObserver hook
- `src/pages/student/CoursePlayer.tsx` — Main lesson page

**Detection:**
```typescript
const hasVideosOrQuizzes = lessonContentItems.some(item =>
  item.content_type === 'video' || item.content_type === 'quiz'
);
const isNotesOnlyLesson = lessonContentItems.length > 0 && !hasVideosOrQuizzes;
```

**Flow:**

```
Lesson has only text/notes/document items (no videos or quizzes)
  → usePageScrollCompletion hook enabled
    → IntersectionObserver watches bottomTriggerRef div
      → User scrolls to bottom (near "Next Lesson" button)
        → IntersectionObserver fires (threshold: 0.1)
          → handlePageScrollComplete() fires ONCE (hasTriggeredRef guard)
            1. setCurrentLessonMarkedComplete(true)
            2. setCompletedLessons(prev => [...prev, lessonId]) // OPTIMISTIC
            3. Upserts user_lesson_progress directly (bypasses content item system)
```

**Critical design decision:** Notes-only lessons bypass `lesson_content_item_progress` entirely. The scroll completion writes directly to `user_lesson_progress`. This means the DB trigger `trg_mark_lesson_complete_on_content_done` is NEVER involved for notes-only lessons.

**Guard:** `hasTriggeredRef` ensures the observer only fires ONCE per lesson. After firing, it disconnects.

---

### 5. Documents

**Behavior:** Documents are NOT required for lesson completion. They're considered "available" resources. The `check_lesson_all_content_completed()` function counts ALL content items in the lesson, so documents should either be excluded from the required items list or handled separately.

**Current status:** Document component in `StudentContentRenderer` does NOT call `markAsViewed()`. Documents have no auto-completion.

---

## The Seamless Update System (No Page Refresh)

### Layer 1: Content Item Completion Event

When any content item completes, it calls its `onComplete` callback:

```
Video completes → VideoProgressTracker.onComplete → StudentContentRenderer.onContentItemComplete
Text/Notes viewed → useContentItemProgress.onComplete → StudentContentRenderer.onContentItemComplete
```

### Layer 2: CoursePlayer State Update

`CoursePlayer.handleContentItemComplete`:
```typescript
const handleContentItemComplete = useCallback(async (completedContentItemId: string) => {
  setLastCompletedContentItemId(completedContentItemId);
}, []);
```

This sets a single-string state that flows to `LessonSidebar` as a prop.

### Layer 3: LessonSidebar Optimistic Update

`LessonSidebar` has a `useEffect` watching `lastCompletedContentItemId`:

```typescript
useEffect(() => {
  if (!lastCompletedContentItemId) return;
  
  setSidebarModules((prev) => {
    const targetLessonId = activeLessonId;
    return prev.map((mod) => ({
      ...mod,
      items: mod.items.map((item) => {
        if (item.type !== 'lesson') return item;
        if (item.id !== targetLessonId) return item;
        
        const pc = item.progressCount;
        if (!pc) return { ...item, isCompleted: true };
        
        const newCompleted = Math.min(pc.completed + 1, pc.total);
        const lessonComplete = newCompleted >= pc.total;
        
        return {
          ...item,
          progressCount: { ...pc, completed: newCompleted },
          isCompleted: lessonComplete || item.isCompleted,
        };
      }),
    }));
  });
}, [lastCompletedContentItemId, activeLessonId]);
```

This **immediately** updates the sidebar UI — increments the progress counter, sets the green checkmark, updates the progress bar — without any DB fetch.

### Layer 4: Ref-Based Stale State Prevention

`LessonSidebar` maintains refs to prevent stale closures during async operations:

```typescript
const completedLessonIdsRef = useRef(completedLessonIds);
const completedQuizIdsRef = useRef(completedQuizIds);

useEffect(() => { completedLessonIdsRef.current = completedLessonIds; }, [completedLessonIds]);
useEffect(() => { completedQuizIdsRef.current = completedQuizIds; }, [completedQuizIds]);
```

Both `fetchModules` (async) and the sync completion effect read from these refs at call time:

```typescript
// In fetchModules, after building the module list:
const currentCompletedIds = completedLessonIdsRef.current;
const currentCompletedQuizIds = completedQuizIdsRef.current;

const builtWithCompletions = built.map((mod) => ({
  ...mod,
  items: mod.items.map((item) => {
    if (item.type === 'lesson' && currentCompletedIds.includes(item.id)) {
      return { ...item, isCompleted: true };
    }
    // ...
  }),
}));
setSidebarModules(builtWithCompletions);
```

### Layer 5: CoursePlayer Completion Merging

When `CoursePlayer` fetches completed lessons from DB, it **merges** with existing optimistic state instead of replacing:

```typescript
setCompletedLessons(prev => {
  const merged = new Set([...dbCompleted, ...prev]);
  return Array.from(merged);
});
```

This prevents race conditions where a DB fetch could wipe out an optimistic completion that hasn't been persisted yet.

---

## Race Condition Prevention Patterns

### Pattern 1: Ref-Based Latest Value Access

**Problem:** Async functions capture stale closure values.

**Solution:** Use refs that always hold the latest value.

```typescript
const valueRef = useRef(value);
useEffect(() => { valueRef.current = value; }, [value]);

// In async function:
const currentValue = valueRef.current; // Always latest
```

**Applied in:** `LessonSidebar` for `completedLessonIds`, `completedQuizIds`.

### Pattern 2: isLoadedRef Guard

**Problem:** `saveProgress` fires before `loadProgress` resolves, writing `is_completed: false` and overwriting completed status.

**Solution:** Block all saves until initial load completes.

```typescript
const isLoadedRef = useRef(false);

// In loadProgress (after DB query resolves):
isLoadedRef.current = true;

// In saveProgress (at top):
if (!isLoadedRef.current) return; // Block premature saves
```

**Applied in:** `useVideoProgress`, `useContentItemProgress`.

### Pattern 3: hasCompletedRef Guard

**Problem:** Completion is downgraded when navigating back to completed content (e.g., video seek to 0:00 triggers `updateDuration(0)`).

**Solution:** Once completed, never set `is_completed` back to false.

```typescript
const hasCompletedRef = useRef(false);

// In loadProgress:
if (data?.is_completed) hasCompletedRef.current = true;

// In saveProgress:
const finalIsCompleted = isCompleted || markComplete || hasCompletedRef.current;

// In onComplete callback:
if (markComplete && !hasCompletedRef.current) {
  hasCompletedRef.current = true;
  onCompleteRef.current?.(); // Fire exactly once per session
}
```

**Applied in:** `useVideoProgress`, `useContentItemProgress`.

### Pattern 4: isSavingRef Mutex

**Problem:** Concurrent database writes cause race conditions and duplicate data.

**Solution:** Simple boolean mutex.

```typescript
const isSavingRef = useRef(false);

// In saveProgress:
if (isSavingRef.current) return;
isSavingRef.current = true;
try { /* DB operation */ }
finally { isSavingRef.current = false; }
```

**Applied in:** `useVideoProgress`, `useContentItemProgress`.

### Pattern 5: Cancelled Flag for Async Effects

**Problem:** Component unmounts while async operation is in flight, causing setState on unmounted component or stale data overwrite.

**Solution:** Cancellation flag.

```typescript
useEffect(() => {
  let cancelled = false;
  
  const fetchData = async () => {
    const result = await someAsyncOperation();
    if (cancelled) return; // Don't setState if already unmounted
    setState(result);
  };
  
  fetchData();
  return () => { cancelled = true; };
}, [deps]);
```

**Applied in:** `CoursePlayer` lesson data fetch.

### Pattern 6: hasTriggeredRef for One-Shot Events

**Problem:** `IntersectionObserver` fires multiple times, triggering duplicate completions.

**Solution:** Fire exactly once.

```typescript
const hasTriggeredRef = useRef(false);

const observer = new IntersectionObserver((entries) => {
  if (hasTriggeredRef.current) return; // Already fired
  if (entries[0].isIntersecting) {
    hasTriggeredRef.current = true;
    observer.disconnect();
    onComplete();
  }
}, { threshold: 0.1 });
```

**Applied in:** `usePageScrollCompletion`.

---

## Key Files Reference

| File | Role |
|------|------|
| `supabase/migrations/20260331_create_content_item_progress_tracking.sql` | DB table, trigger, and completion functions |
| `src/hooks/useVideoProgress.ts` | Video progress tracking (load, debounced save, complete, guards) |
| `src/hooks/useContentItemProgress.ts` | Generic content item progress (video/quiz/text/notes/document) |
| `src/hooks/usePageScrollCompletion.ts` | IntersectionObserver for notes-only lessons |
| `src/components/learning/VideoProgressTracker.tsx` | Connects useVideoProgress to video players |
| `src/components/learning/YouTubePlayer.tsx` | YouTube IFrame API player |
| `src/components/learning/HTML5VideoPlayer.tsx` | HTML5 `<video>` player |
| `src/components/learning/StudentContentRenderer.tsx` | Renders all content types, wires onComplete callbacks |
| `src/components/learning/LessonSidebar.tsx` | Sidebar with progress bars, checkmarks, optimistic updates, ref-based stale prevention |
| `src/pages/student/CoursePlayer.tsx` | Main lesson orchestrator, completion merging, scroll-to-complete |
| `src/pages/student/QuizSession.tsx` | Quiz taking, writes quiz completion to DB |

---

## Reusable Patterns Summary

### To recreate seamless completion tracking elsewhere:

1. **Use `useContentItemProgress` hook** — It handles load, save, mark complete, and all race condition guards. Just provide `lessonId`, `contentItemId`, `contentType`, and `onComplete`.

2. **Wire `onComplete` callbacks up the tree** — Each content item fires its own `onComplete`. The parent collects these and propagates them via state (`lastCompletedContentItemId`).

3. **Use optimistic updates in the UI** — Don't wait for the DB. When `onComplete` fires, update the UI immediately. The DB trigger will persist it in the background.

4. **Use refs for latest values in async functions** — Never rely on closure values in async callbacks. Use `useRef` + `useEffect` to keep the ref fresh.

5. **Merge DB state with optimistic state** — When refreshing from DB, merge instead of replace. This preserves in-flight optimistic updates.

6. **Guard against downgrades** — Use `hasCompletedRef` to ensure completion is always monotonic (once true, never false).

7. **Guard against premature saves** — Use `isLoadedRef` to block saves until initial data loads.

8. **Prevent concurrent saves** — Use `isSavingRef` as a simple mutex.

9. **One-shot events** — Use `hasTriggeredRef` for events that should only fire once (like scroll completion).
