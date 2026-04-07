# Course Update Workflow - Simple Implementation

## How It Works

### Current Flow (BROKEN):
```
Coach edits course → modules.is_published = true → Students see immediately ❌
```

### New Flow (FIXED):
```
1. Coach edits PUBLISHED course
   → modules.is_published = false (pending)
   → lessons.is_published = false (pending)
   → Students DON'T see changes ✅

2. Admin reviews in Course Moderation
   → Shows courses with unpublished modules/lessons

3. Admin approves
   → modules.is_published = true
   → lessons.is_published = true
   → Students NOW see changes ✅
```

## Implementation

### Step 1: Detect if Course is Published

When coach saves course changes:

```typescript
// Check if course is already published
const { data: course } = await supabase
  .from('courses')
  .select('verification_status')
  .eq('id', courseId)
  .single();

const isPublished = course?.verification_status === 'approved';
```

### Step 2: Save with is_published = false if Published

```typescript
// If course is published, save changes as unpublished (pending review)
const publishStatus = isPublished ? false : true;

// Save module with is_published = false (if course already published)
await supabase.from('modules').insert({
  course_id: courseId,
  title: 'New Module',
  is_published: publishStatus  // false if course is published
});

// Save lesson with is_published = false
await supabase.from('lessons').insert({
  // ... lesson data
  is_published: publishStatus  // false if course is published
});
```

### Step 3: Admin Sees Pending Changes

In Course Moderation, show courses that have unpublished modules/lessons:

```sql
SELECT 
  c.id,
  c.title,
  c.verification_status,
  COUNT(m.id) FILTER (WHERE m.is_published = false) AS unpublished_modules,
  COUNT(l.id) FILTER (WHERE l.is_published = false) AS unpublished_lessons
FROM courses c
LEFT JOIN modules m ON m.course_id = c.id
LEFT JOIN module_content_items mci ON mci.module_id = m.id
LEFT JOIN lessons l ON l.id = mci.content_id AND mci.content_type = 'lesson'
WHERE c.verification_status = 'approved'
GROUP BY c.id, c.title, c.verification_status
HAVING COUNT(m.id) FILTER (WHERE m.is_published = false) > 0
   OR COUNT(l.id) FILTER (WHERE l.is_published = false) > 0;
```

### Step 4: Admin Approves → Set is_published = true

When admin clicks "Approve Changes":

```typescript
// Publish all unpublished modules for this course
await supabase
  .from('modules')
  .update({ is_published: true })
  .eq('course_id', courseId);

// Publish all unpublished lessons
await supabase
  .from('lessons')
  .update({ is_published: true })
  .in('id', lessonIds);
```

## Benefits

✅ No new tables needed
✅ No complex versioning system
✅ Uses existing `is_published` flag
✅ Simple admin workflow
✅ Students always see stable version

## Files to Update

1. **Coach Course Edit Page** - Save with `is_published: false` if course published
2. **CourseModerationPage** - Show courses with unpublished changes
3. **Approve Handler** - Set `is_published: true` on pending items
