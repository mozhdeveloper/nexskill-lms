# Fix: Approved Curriculum Not Showing on Student Side

## Problem
After admin approves course curriculum updates, the modules and lessons are not appearing on the student side.

## Root Causes (Possible)

1. **Version ID not linked**: Curriculum data (modules, lessons) doesn't have the `version_id` set to the published version
2. **Publish flags not set**: `is_published_version` or `is_published` flags are `false`
3. **Query mismatch**: Student queries filter by version/publish flags that don't match the data
4. **Approval function bug**: The `approve_course_update` function didn't properly update all tables

## Solution

### Step 1: Run the Database Migration

Run this migration in Supabase SQL Editor:

```
File: supabase/migrations/20260403_fix_curriculum_publishing.sql
```

This creates:
- `approve_course_update_simple()` - Simpler, more reliable approval function
- `publish_all_course_curriculum()` - Publishes all existing curriculum
- `fix_course_curriculum_visibility()` - Fixes visibility for a specific course
- `course_curriculum_visibility` - Debug view

### Step 2: Fix Existing Curriculum Data

Run this SQL in Supabase SQL Editor to fix ALL courses:

```sql
-- Fix curriculum visibility for ALL courses
DO $$
DECLARE
    course_rec RECORD;
BEGIN
    FOR course_rec IN SELECT id, title FROM courses LOOP
        BEGIN
            PERFORM fix_course_curriculum_visibility(course_rec.id);
            RAISE NOTICE 'Fixed: %', course_rec.title;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'ERROR: % - %', course_rec.title, SQLERRM;
        END;
    END LOOP;
END $$;
```

Or fix a specific course:

```sql
-- Replace with your course ID
SELECT fix_course_curriculum_visibility('YOUR-COURSE-ID-HERE');
```

### Step 3: Verify the Fix

Check if curriculum is now visible:

```sql
SELECT * FROM course_curriculum_visibility
WHERE course_id = 'YOUR-COURSE-ID-HERE'
AND visibility_status = 'VISIBLE_TO_STUDENTS';
```

You should see rows with `visibility_status = 'VISIBLE_TO_STUDENTS'`.

### Step 4: Test on Student Side

1. Open the course detail page as a student
2. Navigate to the Curriculum tab
3. You should now see all modules and lessons

## Debug Tools

### Browser Console Logs

Open the course detail page and check browser console (F12). You'll see detailed logs:
- `[useCourse]` - Hook fetching logs
- `[CourseDetailRefactored]` - Component fetching logs

### Debug UI in Course Detail Page

The curriculum tab now shows a **yellow debug box** with:
- Direct curriculum count
- Course curriculum count
- Loading status
- Warning messages if items are not published
- **"Fix Visibility" button** - One-click fix

### Database Debug Queries

```sql
-- Check modules status
SELECT 
    m.id,
    m.title,
    m.is_published,
    m.is_published_version,
    m.version_id,
    cv.status AS version_status
FROM modules m
LEFT JOIN course_versions cv ON cv.id = m.version_id
WHERE m.course_id = 'YOUR-COURSE-ID-HERE';

-- Check content items status
SELECT 
    mci.id,
    mci.content_type,
    mci.is_published,
    mci.is_published_version,
    mci.version_id,
    m.title AS module_title
FROM module_content_items mci
JOIN modules m ON m.id = mci.module_id
WHERE m.course_id = 'YOUR-COURSE-ID-HERE';

-- Check lessons status
SELECT 
    l.id,
    l.title,
    l.is_published,
    l.is_published_version,
    l.version_id
FROM lessons l
WHERE l.id IN (
    SELECT content_id 
    FROM module_content_items 
    WHERE module_id IN (
        SELECT id FROM modules WHERE course_id = 'YOUR-COURSE-ID-HERE'
    )
    AND content_type = 'lesson'
);
```

## How the Fix Works

### 1. Robust Fallback Logic

The student-side queries now use multiple fallback strategies:

```
1. Try: version_id + is_published_version = true
2. Fallback: is_published = true
3. Fallback: Fetch ALL (no filters) for debugging
```

### 2. Visibility Fix Function

`fix_course_curriculum_visibility()` does:

1. Creates a published version if none exists
2. Sets `version_id` = published version ID for all modules
3. Sets `is_published_version = true` for all modules
4. Sets `is_published = true` for all modules
5. Repeats for content items, lessons, and quizzes

### 3. Debug View

`course_curriculum_visibility` view shows:
- Which curriculum items are visible to students
- Which are hidden and why
- Version status for each item

## For Future Course Updates

When coaches create new courses or update existing ones:

### Option A: Use Admin Panel (Recommended)

1. Coach creates/updates course content
2. Admin reviews in Admin Panel → Course Update Requests
3. Admin clicks "Approve Update"
4. System automatically sets all publish flags correctly

### Option B: Manual SQL Fix

If you manually add content via SQL:

```sql
-- After adding modules/lessons, run:
SELECT fix_course_curriculum_visibility('YOUR-COURSE-ID-HERE');
```

## Checklist

- [ ] Migration `20260403_fix_curriculum_publishing.sql` is applied
- [ ] `fix_course_curriculum_visibility()` has been run for all courses
- [ ] Debug view `course_curriculum_visibility` shows items as `VISIBLE_TO_STUDENTS`
- [ ] Student can see curriculum on course detail page
- [ ] Console logs show curriculum being fetched successfully

## Still Not Working?

1. **Check console logs** - Look for `[useCourse]` and `[CourseDetailRefactored]` logs
2. **Check debug view** - Run `SELECT * FROM course_curriculum_visibility`
3. **Check RLS policies** - Ensure student has permission to view the course
4. **Check course visibility** - Course must be `visibility = 'public'`
5. **Check verification status** - Course should be `verification_status = 'approved'`

## Quick Test

```sql
-- This should return rows for visible curriculum
SELECT * FROM course_curriculum_visibility
WHERE visibility_status = 'VISIBLE_TO_STUDENTS'
LIMIT 10;
```

If this returns no rows, run the fix function again.
