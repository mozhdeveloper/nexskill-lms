# Technical Summary: Duration Calculation Fixes & Database Mapping

**Date:** April 30, 2026
**Topic:** Resolving Course/Lesson Duration Discrepancies and Clarifying Goal Table Redundancies.

---

## 1. Course & Lesson Duration Fixes

### The Issue
Courses were showing incorrect total runtimes (e.g., a 4h 25m course showing as 8h 34m, or a 5h 49m course showing as 11h 43m). Quizzes were also doubling in duration (30m appearing as 60m).

### Root Causes
1.  **Structural Doubling:** The system was summing every instance of a lesson. If a lesson was linked multiple times or appeared in multiple module versions, it was counted repeatedly.
2.  **Redundant Addition:** `LessonSidebar.tsx` was calling a utility that already summed video+quiz times, then manually adding the quiz time again.
3.  **Aggressive Defaults:** Hardcoded defaults (15m for lessons, 30m for quizzes) were added to every item missing metadata, adding hours of "ghost time."
4.  **Fallback Conflict:** The system was often summing both the "actual" video duration and the "estimated" duration for the same item.

### The Fixes
*   **Unified Engine:** Refactored `src/utils/durationUtils.ts` (`computeLessonDurations`) to be the single source of truth for all components.
*   **Aggressive De-duplication:** The engine now de-duplicates content by **YouTube ID, URL, and Content ID**. A video linked three times is now only counted once.
*   **Status Filtering:** Only content items with status `published` or `pending_deletion` are included. `draft` items no longer bloat the total.
*   **Priority Chain:** Established a strict fallback order: 
    1. YouTube API Duration 
    2. Cloudinary Metadata 
    3. User Watch Progress 
    4. Manual Estimated Duration.
*   **Zero-Defaulting:** Removed 15/30m defaults. If no duration data exists, it contributes 0m to prevent misleading totals.

---

## 2. Database Table Mapping (Goals/Objectives)

We identified three overlapping systems for "Goals" in the database.

### System A: Course Learning Outcomes (**Active**)
*   **Table:** `public.course_goals`
*   **Usage:** Used by the **Course Builder -> Goals section** (`CourseGoalsPanel.tsx`).
*   **Logic:** Stores direct text descriptions of what a student will learn in a specific course.

### System B: Student Personal Preferences
*   **Tables:** `goals` (Dictionary) and `student_goals` (User Link)
*   **Usage:** Used during **Student Onboarding** and Profile settings.
*   **Logic:** Global goals like "Get a job" or "Upskill" that students select for their own profiles.

### System C: Legacy/Duplicate System
*   **Tables:** `learning_objectives` and `course_learning_objectives`
*   **Usage:** Referenced in `useCourse.ts` and `CourseDetailRefactored.tsx`.
*   **Current State:** Partially out of sync. The Coach saves to `course_goals`, but the Student page sometimes attempts to read from this legacy system.

---

## 3. Key Files Modified

| File Path | Change Description |
| :--- | :--- |
| `src/utils/durationUtils.ts` | Refactored engine with de-duplication and status filtering. |
| `src/pages/student/CourseDetailRefactored.tsx` | Switched to unified engine; removed hardcoded defaults; fixed total runtime display. |
| `src/components/learning/LessonSidebar.tsx` | Fixed double-summing of quiz times; aligned with `durationUtils`. |
| `src/components/courses/tabs/CourseCurriculumTab.tsx` | Overwritten to use `computeLessonDurations` and match the Header's accuracy. |
| `src/hooks/useCourse.ts` | Removed legacy 15/30m defaults to ensure consistent loading states. |
| `src/utils/moduleDurationUtils.ts` | Added lesson ID de-duplication to prevent module-level doubling. |
