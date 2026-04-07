# Course Publishing System - Setup Guide

## Problem Solved
When you approve a course in the admin panel, the modules and lessons were NOT being published (their `is_published` flag remained `false`), so students couldn't see the curriculum.

## Solution Implemented

### Phase 1: Auto-Publish Trigger (IMMEDIATE FIX)
**File:** `supabase/migrations/20260406_fix_course_publish_trigger.sql`

**What it does:**
- Creates a database trigger that automatically sets `is_published = true` on ALL modules, content items, lessons, and quizzes when a course's `is_published` is set to `true`
- Fixes existing approved courses immediately
- Works automatically for all future course approvals

**How to run:**
1. Open Supabase SQL Editor
2. Copy and paste the entire file: `supabase/migrations/20260406_fix_course_publish_trigger.sql`
3. Click "Run"

**Expected output:**
```
✅ Published curriculum for: [Your Course Name]
```

### Phase 2: Versioning System (FUTURE-READY)
**File:** `supabase/migrations/20260407_course_versioning.sql`

**What it does:**
- Adds version tracking to modules, content items, lessons, and quizzes
- Creates `student_course_curriculum` view that shows ONLY published content
- Ensures students always see stable, approved content
- Prepares for coach edit workflow (draft → pending → published)

**How to run:**
1. After Phase 1 is complete
2. Open Supabase SQL Editor
3. Copy and paste: `supabase/migrations/20260407_course_versioning.sql`
4. Click "Run"

---

## Step-by-Step Instructions

### Step 1: Run Phase 1 Migration
```sql
-- In Supabase SQL Editor, run:
File: supabase/migrations/20260406_fix_course_publish_trigger.sql
```

This will:
- ✅ Create the auto-publish trigger
- ✅ Fix your existing course (9d18a986-155e-4e57-8e11-b03d5940d6d2)
- ✅ Show verification query results

### Step 2: Verify the Fix
After running Phase 1, check the results. You should see:

```
course_name | course_published | modules_count | content_items_count | lessons_count | quizzes_count
------------|------------------|---------------|---------------------|---------------|--------------
wewewewwewe | true             | 1             | 2                   | 2             | 0
```

### Step 3: Test Student View
1. Open your student course page
2. Navigate to Curriculum tab
3. **Modules and lessons should now appear!**

### Step 4: Run Phase 2 (Optional but Recommended)
```sql
-- In Supabase SQL Editor, run:
File: supabase/migrations/20260407_course_versioning.sql
```

This prepares your system for:
- Coach editing workflow
- Pending updates
- Admin review process

---

## How It Works Now

### When You Approve a Course:

**Before (BROKEN):**
```
1. Admin sets courses.is_published = true
2. ❌ modules.is_published stays false
3. ❌ lessons.is_published stays false
4. ❌ Students can't see curriculum
```

**After (FIXED):**
```
1. Admin sets courses.is_published = true
2. ✅ TRIGGER fires automatically
3. ✅ modules.is_published = true
4. ✅ lessons.is_published = true
5. ✅ Students see curriculum!
```

### Database Flow:
```
UPDATE courses SET is_published = true
       ↓
TRIGGER: auto_publish_course_curriculum()
       ↓
UPDATE modules SET is_published = true
UPDATE module_content_items SET is_published = true
UPDATE lessons SET is_published = true
UPDATE quizzes SET is_published = true
       ↓
✅ Students can see everything!
```

---

## Manual Fix (If Needed)

If curriculum still doesn't appear, you can manually publish:

### Option 1: SQL Query
```sql
-- Replace with your course ID
SELECT 
  UPDATE modules SET is_published = true WHERE course_id = 'YOUR-COURSE-ID';
  UPDATE module_content_items mci SET is_published = true FROM modules m WHERE mci.module_id = m.id AND m.course_id = 'YOUR-COURSE-ID';
  UPDATE lessons l SET is_published = true FROM module_content_items mci WHERE mci.content_id = l.id AND mci.content_type = 'lesson' AND mci.module_id IN (SELECT id FROM modules WHERE course_id = 'YOUR-COURSE-ID');
  UPDATE quizzes q SET is_published = true FROM module_content_items mci WHERE mci.content_id = q.id AND mci.content_type = 'quiz' AND mci.module_id IN (SELECT id FROM modules WHERE course_id = 'YOUR-COURSE-ID');
```

### Option 2: Admin Panel
1. Go to Admin Panel → Course Update Requests
2. Find your course
3. Click "Fix Curriculum" button (if available)

---

## Verification Queries

### Check if course is published:
```sql
SELECT id, title, is_published 
FROM courses 
WHERE id = '9d18a986-155e-4e57-8e11-b03d5940d6d2';
```

### Check if modules are published:
```sql
SELECT id, title, is_published 
FROM modules 
WHERE course_id = '9d18a986-155e-4e57-8e11-b03d5940d6d2';
```

### Check if lessons are published:
```sql
SELECT l.id, l.title, l.is_published
FROM lessons l
JOIN module_content_items mci ON l.id = mci.content_id
JOIN modules m ON mci.module_id = m.id
WHERE m.course_id = '9d18a986-155e-4e57-8e11-b03d5940d6d2'
AND mci.content_type = 'lesson';
```

### Check student view:
```sql
SELECT * FROM student_course_curriculum
WHERE course_id = '9d18a986-155e-4e57-8e11-b03d5940d6d2';
```

---

## Troubleshooting

### Problem: Trigger doesn't exist
**Error:** `function auto_publish_course_curriculum() does not exist`

**Solution:**
```sql
-- Re-run Phase 1 migration
File: supabase/migrations/20260406_fix_course_publish_trigger.sql
```

### Problem: Curriculum still not showing
**Check:**
```sql
-- Verify is_published flags
SELECT 
  c.title,
  c.is_published AS course_published,
  (SELECT COUNT(*) FROM modules m WHERE m.course_id = c.id AND m.is_published = true) AS modules_published,
  (SELECT COUNT(*) FROM lessons l JOIN module_content_items mci ON l.id = mci.content_id JOIN modules m ON mci.module_id = m.id WHERE m.course_id = c.id AND l.is_published = true) AS lessons_published
FROM courses c
WHERE c.id = '9d18a986-155e-4e57-8e11-b03d5940d6d2';
```

If counts are 0, run the manual fix above.

### Problem: View doesn't exist
**Error:** `relation "student_course_curriculum" does not exist`

**Solution:**
```sql
-- Run Phase 2 migration
File: supabase/migrations/20260407_course_versioning.sql
```

---

## Future Enhancements (Phase 2)

Once Phase 2 is implemented:

### Coach Workflow:
1. Coach edits course → Creates draft version
2. Students see → Published version (unchanged)
3. Coach submits → Pending review
4. Admin approves → Draft becomes published
5. Students see → New content

### Admin Workflow:
1. View pending updates in Admin Panel
2. Review changes
3. Approve → Merges draft into published
4. Reject → Deletes draft

---

## Summary

✅ **Phase 1** = Immediate fix (auto-publish trigger)
✅ **Phase 2** = Future-ready (versioning system)

**Run Phase 1 NOW to fix your curriculum visibility issue!**
