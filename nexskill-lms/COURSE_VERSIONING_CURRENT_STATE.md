# Course Versioning System - Current State Documentation

**Date:** 2026-04-10
**Status:** ✅ WORKING - Initial course approval + content updates approved by admin

---

## Overview

When a coach adds/edits content on an **already approved course**:
- The course **stays visible** to students (`verification_status = 'approved'`)
- New content is saved as **hidden** (`is_published = false`)
- The course gets flagged as `pending_content = true`
- Admin sees the course in the moderation queue
- When admin approves → all new content becomes visible to students

---

## Database Layer

### 1. New Column: `courses.pending_content`
| Property | Value |
|----------|-------|
| **Table** | `courses` |
| **Column** | `pending_content BOOLEAN DEFAULT false` |
| **Purpose** | Flags courses that have unpublished changes pending admin approval |
| **Index** | `idx_courses_pending_content` |

### 2. Trigger Function: `cascade_publish_on_approval()`
| Property | Value |
|----------|-------|
| **Type** | `AFTER UPDATE` trigger on `courses` table |
| **Security** | `SECURITY DEFINER` (runs as superuser to bypass RLS) |
| **Purpose** | Publishes ALL content when course is approved |

**Fire Conditions:**
1. `verification_status` changes from non-approved → `'approved'` (initial course approval)
2. `pending_content` changes from `true` → `false` while `verification_status = 'approved'` (admin approves pending changes)

**Actions Performed:**
```sql
-- Publishes in this order:
1. UPDATE modules SET is_published = true WHERE course_id = NEW.id
2. UPDATE lessons SET is_published = true WHERE course_id = NEW.id
3. UPDATE module_content_items SET is_published = true (linked to course modules)
4. UPDATE lesson_content_items SET is_published = true (linked to course modules)
5. UPDATE quizzes SET is_published = true (linked via content items)
6. NEW.pending_content := false
```

**Location:** `supabase/migrations/20260410_phase1_5_pending_content.sql`

### 3. Removed Triggers (No Longer Active)
These were causing infinite loops and timeouts:
- ❌ `trg_modules_content_change` on `modules`
- ❌ `trg_module_content_items_change` on `module_content_items`
- ❌ `trg_lessons_change` on `lessons`
- ❌ `trg_quizzes_change` on `quizzes`
- ❌ `trg_lesson_content_items_change` on `lesson_content_items`
- ❌ `trg_cascade_publish_on_course_approval` on `courses`
- ❌ `trg_cascade_publish_pending_content` on `courses`

### 4. Remaining Triggers
| Trigger | Table | Purpose |
|---------|-------|---------|
| `trg_reset_lesson_completion_on_content_change` | `lesson_content_items` | Resets student progress when content is deleted |
| `trg_cascade_publish_on_approval` | `courses` | Publishes all content on approval (with SECURITY DEFINER) |
| Various timestamp triggers | Multiple tables | Auto-updates `updated_at` columns |

---

## Frontend Layer

### Coach Side: `CourseBuilder.tsx`

#### `handleAddLesson(moduleId, newLesson)`
- Inserts new lesson with `is_published = false` if course is already approved
- Inserts `module_content_items` link with `is_published = false`
- Sets `pending_content = true` on the course
- Shows alert: "Your changes will be visible to students after admin approval"

#### `handleSaveVideoBlock(moduleId, lessonId, videoUrl)`
- Updates `lessons.content_blocks` with new video
- If course is approved → sets `pending_content = true` on the course
- Calls `handleRefreshLesson` to update UI

#### `handleAddContentItem(lessonId, moduleId, contentType, metadata, contentId)`
- Inserts into `lesson_content_items` table
- Auto-detects course status: if approved → saves as `is_published = false`
- Frontend handles pending flag (no trigger needed)

### Admin Side: `CourseModerationPage.tsx`

#### `handleApprove(courseId)`
Publishes content in sequential steps:
```javascript
1. Fetch module IDs for the course
2. UPDATE modules SET is_published = true
3. UPDATE module_content_items SET is_published = true
4. Fetch lesson IDs → UPDATE lessons SET is_published = true
5. UPDATE lesson_content_items SET is_published = true
6. Fetch quiz IDs → UPDATE quizzes SET is_published = true
7. UPDATE courses SET verification_status='approved', pending_content=false
```

#### `CourseModerationPage` Status Mapping
- Shows courses with `pending_content = true` AND `verification_status = 'approved'` in the "Pending Review" tab
- Normal `verification_status = 'pending_review'` courses also show in "Pending Review"

---

## RLS Policies

### Admin Policies (Added During Implementation)
| Policy Name | Table | Permission |
|-------------|-------|------------|
| `admins_view_modules` | `modules` | SELECT (view unpublished modules) |
| `admins_view_module_content_items` | `module_content_items` | SELECT |
| `admins_view_lessons` | `lessons` | SELECT |
| `admins_manage_modules` | `modules` | UPDATE |
| `admins_manage_module_content_items` | `module_content_items` | UPDATE |
| `admins_manage_lessons` | `lessons` | UPDATE |
| `admins_manage_lesson_content_items` | `lesson_content_items` | UPDATE |
| `admins_manage_quizzes` | `quizzes` | UPDATE |

### Student Policies (Unchanged)
| Policy | Effect |
|--------|--------|
| `anyone_view_approved_courses` | Students only see courses where `verification_status = 'approved'` |
| `Modules are viewable by everyone` | Students only see modules where `is_published = true` |
| `public_view_module_content` | Students only see content items where `is_published = true` AND course is approved |
| `Anyone can view published lesson content items` | Students only see `lesson_content_items` where `is_published = true` |

---

## Workflow Summary

### Initial Course Approval
```
Coach submits course → verification_status = 'pending_review'
Admin approves → verification_status = 'approved'
Trigger fires → publishes ALL content (modules, lessons, items, quizzes)
Students can see everything
```

### Adding Content to Approved Course
```
Coach adds lesson/video → is_published = false
Course stays verification_status = 'approved' (students see old content)
Course.pending_content = true (admin sees "Pending" flag)
Admin approves → pending_content = false
Trigger fires → publishes new content
Students see new content
```

### Deleting Content (NOT YET IMPLEMENTED)
```
Current behavior: Deletion is instant, no pending review
Future (tomorrow): Deletion should set pending_content = true
                   Students keep seeing deleted content until admin approves removal
```

---

## Known Limitations

1. **Deletions don't trigger pending review** - Content is removed immediately when coach deletes it
2. **Admin must manually approve** - No auto-approval workflow
3. **No "reject changes" flow** - Admin can only approve or request full course changes
4. **Content items saved before migration** may have `is_published = false` but need manual fix (SQL cleanup provided)

---

## Files Modified

| File | Changes |
|------|---------|
| `supabase/migrations/20260410_phase1_5_pending_content.sql` | Migration file with trigger + column changes |
| `src/pages/admin/CourseModerationPage.tsx` | Updated handleApprove to publish content directly |
| `src/pages/coach/CourseBuilder.tsx` | Added pending_content=true on content changes |
| `src/lib/supabase/lesson-content.queries.ts` | Auto-detect course status for is_published |

---

## SQL Commands for Reference

### Fix existing approved courses (one-time cleanup)
```sql
UPDATE module_content_items mci SET is_published = true
WHERE EXISTS (SELECT 1 FROM modules m JOIN courses c ON m.id = mci.module_id AND c.id = m.course_id
  WHERE c.verification_status = 'approved') AND mci.is_published = false;

UPDATE lessons l SET is_published = true
WHERE EXISTS (SELECT 1 FROM module_content_items mci JOIN modules m ON m.id = mci.module_id
  JOIN courses c ON c.id = m.course_id
  WHERE mci.content_id = l.id AND mci.content_type = 'lesson' AND c.verification_status = 'approved')
  AND l.is_published = false;

UPDATE lesson_content_items lci SET is_published = true
WHERE EXISTS (SELECT 1 FROM modules m JOIN courses c ON m.id = lci.module_id AND c.id = m.course_id
  WHERE c.verification_status = 'approved') AND lci.is_published = false;
```

### Check course pending status
```sql
SELECT id, title, verification_status, pending_content, updated_at FROM courses;
```

### Check if content is published
```sql
SELECT 'modules' as tbl, id, title, is_published FROM modules WHERE course_id = 'COURSE_ID'
UNION ALL SELECT 'lessons', id, title, is_published FROM lessons WHERE course_id = 'COURSE_ID'
UNION ALL SELECT 'module_content_items', id, content_type::text, is_published FROM module_content_items 
  WHERE module_id IN (SELECT id FROM modules WHERE course_id = 'COURSE_ID')
UNION ALL SELECT 'lesson_content_items', id, content_type::text, is_published FROM lesson_content_items 
  WHERE module_id IN (SELECT id FROM modules WHERE course_id = 'COURSE_ID');
```

---

## Tomorrow's Tasks

1. **Implement deletion pending review** - When coach deletes content, set `pending_content = true` instead of immediate deletion
2. **Soft delete approach** - Consider using `is_deleted` flag instead of actual DELETE for pending deletions
3. **Admin reject flow** - Allow admin to reject specific content changes
4. **Testing** - Full end-to-end testing of all workflows
