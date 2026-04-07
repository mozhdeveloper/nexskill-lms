# Course Versioning System - Complete Implementation

## Overview

This system ensures:
- ✅ Students always see the **last approved (stable) version** of a course
- ✅ Coaches can edit courses without affecting what students see
- ✅ Changes require **admin approval** before becoming visible
- ✅ **Only modified content** is merged when approved
- ✅ **Published content remains unchanged** during review

---

## Database Schema

### Key Tables:

1. **`course_versions`** - Tracks each version of a course
   - `status`: 'draft', 'pending_review', 'approved', 'published', 'rejected'
   - Each course has ONE 'published' version at a time

2. **`pending_course_updates`** - Update requests awaiting admin approval

3. **`modules`, `module_content_items`, `lessons`, `quizzes`**
   - `version_id`: Which version this item belongs to
   - `is_published_version`: Is this part of the published version?
   - `is_published`: Legacy flag for backward compatibility

---

## How It Works

### Flow Diagram:

```
┌─────────────┐
│   Coach     │
│   Edits     │
│   Course    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│ Create Draft Version    │
│ - Copy published content│
│ - Status: draft         │
│ - Students DON'T see    │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Coach Makes Changes     │
│ - Add modules/lessons   │
│ - Edit existing content │
│ - All in draft version  │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│ Submit for Review       │
│ - Status: pending_review│
│ - Appears in admin panel│
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│   Admin Reviews         │
│ - See all changes       │
│ - Compare versions      │
└──────┬──────────────────┘
       │
       ├─────────────┬──────────────┐
       ▼             ▼              ▼
   APPROVE       REJECT       REQUEST CHANGES
       │             │              │
       ▼             ▼              ▼
┌─────────────┐ ┌──────────┐  ┌────────────┐
│ Merge draft │ │ Delete   │  │ Keep in    │
│ into        │ │ draft    │  │ draft      │
│ published   │ │ version  │  │ for edits  │
│ Mark as     │ │ Coach    │  │            │
│ published   │ │ notified │  │            │
└─────────────┘ └──────────┘  └────────────┘
```

---

## For Coaches: How to Update a Course

### Step 1: Start Editing

```typescript
// System automatically creates draft version
const draftVersionId = await supabase.rpc('get_or_create_draft_version', {
  p_course_id: courseId,
  p_coach_id: coachId
});
```

### Step 2: Make Changes

All changes are saved to the **draft version**:
- Add new modules → `version_id = draftVersionId`
- Edit lessons → Updates in draft version only
- Delete content → Marked for deletion in draft

**Students continue to see the published version!**

### Step 3: Submit for Review

```typescript
const { data: pendingId } = await supabase.rpc('start_course_update', {
  p_course_id: courseId,
  p_coach_id: coachId,
  p_change_description: 'Added 3 new React lessons'
});
```

### Step 4: Wait for Approval

- Status: `pending_review`
- Appears in Admin Panel → Course Update Requests
- Students still see published version

### Step 5: After Approval

- **If Approved**: Draft becomes published, students see changes
- **If Rejected**: Draft deleted, coach notified with reason

---

## For Admins: Reviewing Updates

### View Pending Updates

Navigate to: **Admin Panel → Course Update Requests**

See:
- Course name
- Coach name
- Change description
- Number of module/content changes
- Submitted date

### Review Changes

Click "Review Update" to see:
- Modules being added/modified/deleted
- Content items being changed
- Comparison with current published version

### Approve

```typescript
const { error } = await supabase.rpc('approve_course_update', {
  p_pending_update_id: pendingUpdateId,
  p_admin_id: adminId,
  p_review_notes: 'Looks good!'
});
```

**What happens:**
1. Previous published version → marked as 'approved'
2. Draft version → marked as 'published'
3. All draft modules/content → `is_published_version = true`
4. **Students immediately see new content**

### Reject

```typescript
const { error } = await supabase.rpc('reject_course_update', {
  p_pending_update_id: pendingUpdateId,
  p_admin_id: adminId,
  p_rejection_reason: 'Please add more details to lesson 3'
});
```

**What happens:**
1. Draft version → marked as 'rejected'
2. Draft modules/content → deleted
3. Coach notified with reason
4. Students continue seeing published version

---

## For Students: Viewing Courses

Students **automatically** see only the published version:

```typescript
// useCourse hook automatically fetches published version
const { course } = useCourse(courseId);

// Returns ONLY published modules/lessons
// Draft/pending changes are NOT visible
```

**No extra code needed!** The system handles it.

---

## Database Functions Reference

### `get_published_course_version(p_course_id UUID)` → UUID
Returns the published version ID for a course.

### `get_or_create_draft_version(p_course_id UUID, p_coach_id UUID)` → UUID
Creates or returns existing draft version for editing.

### `start_course_update(p_course_id, p_coach_id, p_change_description)` → UUID
Creates draft version and pending update request.

### `approve_course_update(p_pending_update_id, p_admin_id, p_review_notes)` → boolean
Merges draft into published, makes changes visible.

### `reject_course_update(p_pending_update_id, p_admin_id, p_rejection_reason)` → boolean
Deletes draft, notifies coach.

---

## SQL Queries

### Check Publishing Status

```sql
SELECT * FROM curriculum_publishing_status
WHERE course_id = 'YOUR-COURSE-ID';
```

### View Pending Updates

```sql
SELECT * FROM admin_pending_updates;
```

### View Student Curriculum (Published Only)

```sql
SELECT * FROM student_course_curriculum
WHERE course_id = 'YOUR-COURSE-ID';
```

### Manually Publish (Emergency Fix)

```sql
SELECT manually_publish_curriculum('YOUR-COURSE-ID');
```

---

## Migration Steps

### Step 1: Run Migration

```
File: supabase/migrations/20260405_proper_course_versioning.sql
```

This:
- Adds `version_id` and `is_published_version` columns
- Creates version management functions
- Initializes existing courses with published versions
- Creates views for students and admins

### Step 2: Initialize Existing Courses

The migration automatically:
- Creates `v1.0 - Initial` published version for all courses
- Marks existing modules/content as published
- Students continue to see current content

### Step 3: Test

1. **Student View**: Open course detail → See curriculum ✓
2. **Coach Edit**: Start editing → Creates draft ✓
3. **Admin Approve**: Review and approve → Changes visible ✓

---

## Troubleshooting

### Problem: Students can't see curriculum

**Solution:**
```sql
-- Check if course has published version
SELECT * FROM course_versions
WHERE course_id = 'YOUR-COURSE-ID'
AND status = 'published';

-- If no published version, initialize
SELECT manually_publish_curriculum('YOUR-COURSE-ID');
```

### Problem: Draft changes visible to students

**Check:**
```sql
-- Ensure draft version is not marked as published
SELECT id, status, version_number
FROM course_versions
WHERE course_id = 'YOUR-COURSE-ID'
AND status != 'published';

-- These should have is_published_version = false
SELECT COUNT(*) FROM modules
WHERE course_id = 'YOUR-COURSE-ID'
AND is_published_version = true;
-- Should equal count in published version only
```

### Problem: Admin can't see pending updates

**Check:**
```sql
-- Verify pending updates exist
SELECT * FROM pending_course_updates
WHERE status = 'pending';

-- Check view
SELECT * FROM admin_pending_updates;
```

---

## Best Practices

### For Coaches:

✅ **DO:**
- Submit clear change descriptions
- Test changes in draft before submitting
- Wait for approval before promising content
- Use "urgent" priority only for emergencies

❌ **DON'T:**
- Submit incomplete changes
- Make multiple overlapping updates
- Edit while update is pending (creates conflicts)

### For Admins:

✅ **DO:**
- Review all changes before approving
- Provide clear feedback when rejecting
- Check for broken links/media
- Test critical changes before approving

❌ **DON'T:**
- Approve without reviewing
- Leave updates pending for too long
- Reject without explanation

### For Developers:

✅ **DO:**
- Use provided database functions
- Test with draft/published versions
- Check `is_published_version` flags
- Log version operations

❌ **DON'T:**
- Directly update `is_published` flags
- Bypass version system
- Mix draft and published data
- Delete versions manually

---

## API Examples

### Coach: Start Editing

```typescript
// Get draft version (creates if doesn't exist)
const { data: draftVersionId } = await supabase.rpc(
  'get_or_create_draft_version',
  { p_course_id: courseId, p_coach_id: coachId }
);

// Now all edits should use this version_id
await supabase.from('modules').insert({
  course_id: courseId,
  title: 'New Module',
  version_id: draftVersionId, // Important!
  is_published_version: false
});
```

### Coach: Submit for Review

```typescript
const { data: pendingId } = await supabase.rpc(
  'start_course_update',
  {
    p_course_id: courseId,
    p_coach_id: coachId,
    p_change_description: 'Added advanced React patterns module'
  }
);
```

### Admin: Approve Update

```typescript
const { data: success } = await supabase.rpc(
  'approve_course_update',
  {
    p_pending_update_id: pendingUpdateId,
    p_admin_id: adminId,
    p_review_notes: 'Approved - looks great!'
  }
);
```

### Student: View Course

```typescript
// Automatically gets published version only
const { course, loading, error } = useCourse(courseId);

// course.curriculum contains only published modules/lessons
```

---

## Summary

| Action | Who | What Happens |
|--------|-----|--------------|
| Edit Course | Coach | Creates draft version, changes saved to draft |
| Submit Update | Coach | Creates pending request, admin notified |
| Review Update | Admin | See all changes in draft version |
| Approve | Admin | Draft → Published, students see changes |
| Reject | Admin | Draft deleted, coach notified |
| View Course | Student | Always sees published version only |

**Key Principle:** Students ALWAYS see the last approved (stable) version. Changes are isolated in draft versions until approved.
