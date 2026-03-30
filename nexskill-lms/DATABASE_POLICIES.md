# Database Policies Reference

**Last Updated:** March 30, 2026  
**Database:** Supabase (PostgreSQL)

This document provides a comprehensive reference of all Row Level Security (RLS) policies in the NexSkill LMS database.

---

## Table of Contents

1. [User & Profile Tables](#user--profile-tables)
2. [Course Management Tables](#course-management-tables)
3. [Lesson & Content Tables](#lesson--content-tables)
4. [Quiz & Assessment Tables](#quiz--assessment-tables)
5. [Student Progress Tables](#student-progress-tables)
6. [Coach & Sub-Coach Tables](#coach--sub-coach-tables)
7. [Communication Tables](#communication-tables)
8. [Transaction Tables](#transaction-tables)
9. [Video & Media Tables](#video--media-tables)
10. [New: Lesson Content Items](#new-lesson-content-items)

---

## User & Profile Tables

### `profiles`

| Policy Name | Operation | Roles | Condition |
|-------------|-----------|-------|-----------|
| `enable_insert_for_own_profile` | INSERT | public | `auth.uid() = id` |
| `enable_update_for_own_profile` | UPDATE | public | `auth.uid() = id` |
| `enable_delete_for_own_profile` | DELETE | public | `auth.uid() = id` |
| `profiles_select_policy` | SELECT | public | `true` (everyone can read) |

### `student_profiles`

| Policy Name | Operation | Roles | Condition |
|-------------|-----------|-------|-----------|
| `Users can view own profile` | SELECT | public | `auth.uid() = user_id` |
| `Users can insert own profile` | INSERT | public | `WITH CHECK: auth.uid() = user_id` |
| `Users can update own profile` | UPDATE | public | `auth.uid() = user_id` |
| `Users can delete own profile` | DELETE | public | `auth.uid() = user_id` |

### `coach_profiles`

| Policy Name | Operation | Roles | Condition |
|-------------|-----------|-------|-----------|
| `Coaches can view their own profile` | SELECT | public | `auth.uid() = id` |
| `Coaches can insert their own profile` | INSERT | public | `WITH CHECK: auth.uid() = id` |
| `Coaches can update their own profile` | UPDATE | public | `auth.uid() = id` |

---

## Course Management Tables

### `courses`

| Policy Name | Operation | Roles | Condition |
|-------------|-----------|-------|-----------|
| `Admins can do everything with courses` | ALL | authenticated | `users.raw_user_meta_data ->> 'role' = 'admin'` |
| *(Coaches can manage own courses)* | ALL | public | `coach_id = auth.uid()` |
| *(Public can view published courses)* | SELECT | public | `visibility = 'public' AND verification_status = 'approved'` |

### `modules`

| Policy Name | Operation | Roles | Condition |
|-------------|-----------|-------|-----------|
| `Modules are viewable by everyone` | SELECT | public | `is_published = true` |
| `Coaches can insert modules` | INSERT | public | `EXISTS (SELECT 1 FROM courses WHERE courses.id = modules.course_id AND courses.coach_id = auth.uid())` |
| `Coaches can update modules` | UPDATE | public | `EXISTS (SELECT 1 FROM courses WHERE courses.id = modules.course_id AND courses.coach_id = auth.uid())` |
| `Coaches can delete modules` | DELETE | public | `EXISTS (SELECT 1 FROM courses WHERE courses.id = modules.course_id AND courses.coach_id = auth.uid())` |
| `Coaches can view modules` | SELECT | public | `EXISTS (SELECT 1 FROM courses WHERE courses.id = modules.course_id AND courses.coach_id = auth.uid())` |

### `module_content_items`

| Policy Name | Operation | Roles | Condition |
|-------------|-----------|-------|-----------|
| `View module content based on publish status and coach role` | SELECT | public | `is_published = true OR coach owns course` |
| `Coaches can manage module content` | ALL | public | `EXISTS (SELECT 1 FROM modules m JOIN courses c ON m.course_id = c.id WHERE m.id = module_content_items.module_id AND c.coach_id = auth.uid())` |

---

## Lesson & Content Tables

### `lessons`

| Policy Name | Operation | Roles | Condition |
|-------------|-----------|-------|-----------|
| `Public can view published lessons` | SELECT | public | `is_published = true AND auth.role() = 'authenticated'` |
| `Coaches can manage lessons in their courses` | ALL | public | `EXISTS (SELECT 1 FROM module_content_items mci JOIN modules m ON mci.module_id = m.id JOIN courses c ON m.course_id = c.id WHERE mci.content_type = 'lesson' AND mci.content_id = lessons.id AND c.coach_id = auth.uid())` |

### `lesson_content_items` ⭐ NEW

| Policy Name | Operation | Roles | Condition |
|-------------|-----------|-------|-----------|
| `Anyone can view published lesson content items` | SELECT | public | `is_published = true` |
| `Coaches can manage their course content items` | ALL | public | `EXISTS (SELECT 1 FROM courses c WHERE c.id = course_id AND c.coach_id = auth.uid())` |
| `Admins can manage all content items` | ALL | public | `EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')` |

**Purpose:** Allows lessons to contain multiple content items (videos, quizzes, text) with independent progress tracking.

---

## Quiz & Assessment Tables

### `quizzes`

*(Inherits from lessons via module_content_items)*

### `quiz_questions`

| Policy Name | Operation | Roles | Condition |
|-------------|-----------|-------|-----------|
| *(Managed via quiz ownership)* | ALL | public | `quiz_id IN (SELECT id FROM quizzes WHERE owner_id = auth.uid())` |

### `quiz_attempts`

| Policy Name | Operation | Roles | Condition |
|-------------|-----------|-------|-----------|
| `Users can view own attempts` | SELECT | public | `user_id = auth.uid()` |
| `Users can insert own attempts` | INSERT | public | `WITH CHECK: user_id = auth.uid()` |

### `quiz_responses`

| Policy Name | Operation | Roles | Condition |
|-------------|-----------|-------|-----------|
| `Users can view own responses` | SELECT | public | `attempt_id IN (SELECT id FROM quiz_attempts WHERE user_id = auth.uid())` |
| `Users can insert own responses` | INSERT | public | `WITH CHECK: attempt_id IN (SELECT id FROM quiz_attempts WHERE user_id = auth.uid())` |

---

## Student Progress Tables

### `user_lesson_progress`

| Policy Name | Operation | Roles | Condition |
|-------------|-----------|-------|-----------|
| `Users can view own progress` | SELECT | public | `user_id = auth.uid()` |
| `Users can update own progress` | UPDATE | public | `user_id = auth.uid()` |

### `student_content_progress` ⭐ NEW

| Policy Name | Operation | Roles | Condition |
|-------------|-----------|-------|-----------|
| `Students can view their own progress` | SELECT | public | `student_id = auth.uid()` |
| `Students can insert their own progress` | INSERT | public | `WITH CHECK: student_id = auth.uid()` |
| `Students can update their own progress` | UPDATE | public | `student_id = auth.uid()` |
| `Coaches can view progress for their courses` | SELECT | public | `EXISTS (SELECT 1 FROM courses c WHERE c.id = course_id AND c.coach_id = auth.uid())` |
| `Admins can view all progress` | SELECT | public | `EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')` |

**Purpose:** Track per-content-item progress (video watch time, quiz scores) independently.

---

## Coach & Sub-Coach Tables

### `sub_coach_assignments`

| Policy Name | Operation | Roles | Condition |
|-------------|-----------|-------|-----------|
| `Coaches can view their own sub-coach assignments` | SELECT | public | `coach_id = auth.uid() OR sub_coach_id = auth.uid()` |
| `Coaches can insert sub-coach assignments` | INSERT | public | `WITH CHECK: coach_id = auth.uid()` |
| `Coaches can update their own sub-coach assignments` | UPDATE | public | `coach_id = auth.uid()` |
| `Coaches can delete their own sub-coach assignments` | DELETE | public | `coach_id = auth.uid()` |

### `sub_coach_requirements`

| Policy Name | Operation | Roles | Condition |
|-------------|-----------|-------|-----------|
| `Users can view requirements for their assignments` | SELECT | public | `EXISTS (SELECT 1 FROM sub_coach_assignments sca WHERE sca.id = sub_coach_requirements.assignment_id AND (sca.coach_id = auth.uid() OR sca.sub_coach_id = auth.uid()))` |
| `Coaches can insert requirements` | INSERT | public | `WITH CHECK: EXISTS (SELECT 1 FROM sub_coach_assignments sca WHERE sca.id = sub_coach_requirements.assignment_id AND sca.coach_id = auth.uid())` |
| `Coaches can delete requirements` | DELETE | public | `EXISTS (SELECT 1 FROM sub_coach_assignments sca WHERE sca.id = sub_coach_requirements.assignment_id AND sca.coach_id = auth.uid())` |

### `sub_coach_student_allocations`

| Policy Name | Operation | Roles | Condition |
|-------------|-----------|-------|-----------|
| `Users can view allocations for their assignments` | SELECT | public | `EXISTS (SELECT 1 FROM sub_coach_assignments sca WHERE sca.id = sub_coach_student_allocations.assignment_id AND (sca.coach_id = auth.uid() OR sca.sub_coach_id = auth.uid())) OR student_id = auth.uid()` |
| `Coaches can insert student allocations` | INSERT | public | `WITH CHECK: EXISTS (SELECT 1 FROM sub_coach_assignments sca WHERE sca.id = sub_coach_student_allocations.assignment_id AND sca.coach_id = auth.uid())` |
| `Coaches can delete student allocations` | DELETE | public | `EXISTS (SELECT 1 FROM sub_coach_assignments sca WHERE sca.id = sub_coach_student_allocations.assignment_id AND sca.coach_id = auth.uid())` |

---

## Communication Tables

### `messages`

| Policy Name | Operation | Roles | Condition |
|-------------|-----------|-------|-----------|
| `Users can read their own messages` | SELECT | public | `sender_id = auth.uid() OR recipient_id = auth.uid()` |
| `Users can send messages` | INSERT | public | `WITH CHECK: sender_id = auth.uid()` |
| `Users can update their own messages` | UPDATE | public | `sender_id = auth.uid()` |
| `Users can mark received messages as read` | UPDATE | public | `recipient_id = auth.uid()` |

### `conversations`

| Policy Name | Operation | Roles | Condition |
|-------------|-----------|-------|-----------|
| `Users can view their own conversations` | SELECT | public | `user1_id = auth.uid() OR user2_id = auth.uid()` |
| `Users can insert conversations where they are a participant` | INSERT | public | `WITH CHECK: user1_id = auth.uid() OR user2_id = auth.uid()` |
| `Users can update their own conversations` | UPDATE | public | `user1_id = auth.uid() OR user2_id = auth.uid()` |

---

## Transaction Tables

### `transactions`

| Policy Name | Operation | Roles | Condition |
|-------------|-----------|-------|-----------|
| `Coaches can view own transactions` | SELECT | public | `coach_id = auth.uid()` |
| `Enable insert for authenticated users` | INSERT | authenticated | `true` |

---

## Video & Media Tables

### `video_uploads`

| Policy Name | Operation | Roles | Condition |
|-------------|-----------|-------|-----------|
| `Users can view published video uploads` | SELECT | public | `auth.role() = 'authenticated' AND processing_status = 'completed'` |
| `Instructors can manage video uploads` | ALL | public | `uploaded_by = auth.uid()` |

### `video_embeddings`

| Policy Name | Operation | Roles | Condition |
|-------------|-----------|-------|-----------|
| `Users can view video embeddings` | SELECT | public | `EXISTS (SELECT 1 FROM video_uploads WHERE video_uploads.id = video_embeddings.video_id AND video_uploads.processing_status = 'completed')` |

### `video_transcriptions`

| Policy Name | Operation | Roles | Condition |
|-------------|-----------|-------|-----------|
| `Users can view video transcriptions` | SELECT | public | `EXISTS (SELECT 1 FROM video_uploads WHERE video_uploads.id = video_transcriptions.video_id AND video_uploads.processing_status = 'completed')` |

---

## Enrollment & Wishlist Tables

### `enrollments`

| Policy Name | Operation | Roles | Condition |
|-------------|-----------|-------|-----------|
| `enrollments: users can view own rows` | SELECT | public | `profile_id = auth.uid()` |
| `enrollments: users can insert own rows` | INSERT | public | `WITH CHECK: profile_id = auth.uid()` |
| `enrollments: users can delete own rows` | DELETE | public | `profile_id = auth.uid()` |
| `enrollments: coaches can view course enrollments` | SELECT | public | `EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('coach', 'admin'))` |

### `student_wishlist`

| Policy Name | Operation | Roles | Condition |
|-------------|-----------|-------|-----------|
| `Students can view their own wishlist` | SELECT | public | `user_id = auth.uid()` |
| `Students can add to their own wishlist` | INSERT | public | `WITH CHECK: user_id = auth.uid()` |
| `Students can remove from their own wishlist` | DELETE | public | `user_id = auth.uid()` |

---

## Certificate Tables

### `certificate_templates`

| Policy Name | Operation | Roles | Condition |
|-------------|-----------|-------|-----------|
| `Anyone can read certificate templates` | SELECT | public | `true` |
| `Coaches manage own templates` | ALL | public | `coach_id = auth.uid()` |

---

## Policy Patterns

### Common Patterns Used

1. **Own Resource Pattern**
   ```sql
   auth.uid() = user_id
   ```

2. **Coach Ownership Pattern**
   ```sql
   EXISTS (
     SELECT 1 FROM courses c
     WHERE c.id = table.course_id
     AND c.coach_id = auth.uid()
   )
   ```

3. **Admin Override Pattern**
   ```sql
   EXISTS (
     SELECT 1 FROM profiles p
     WHERE p.id = auth.uid()
     AND p.role = 'admin'
   )
   ```

4. **Published Content Pattern**
   ```sql
   is_published = true
   ```

5. **Joint Ownership Pattern**
   ```sql
   user1_id = auth.uid() OR user2_id = auth.uid()
   ```

---

## Security Considerations

### Role Hierarchy
```
admin > coach > student
```

- **Admins**: Can access all resources (via explicit policies)
- **Coaches**: Can manage own courses, view student progress
- **Students**: Can only access own data and published content

### Important Notes

1. **RLS is enabled** on all sensitive tables
2. **Public access** is restricted to published content only
3. **Cascade deletes** are used for referential integrity
4. **Functions with SECURITY DEFINER** bypass RLS (use carefully)

---

## New Tables (March 30, 2026)

### Architecture Change

**Before:**
```
modules → module_content_items → lessons (with content_blocks JSONB)
```

**After:**
```
modules → module_content_items → lessons → lesson_content_items → content
```

This allows:
- ✅ Multiple videos/quizzes per lesson
- ✅ Per-content progress tracking
- ✅ Independent completion status
- ✅ Better analytics

### Migration Status

- [x] Database schema created
- [x] RLS policies defined
- [x] Helper functions created
- [ ] TypeScript types updated
- [ ] UI components updated
- [ ] Data migration from content_blocks

---

## Helper Functions

### `get_student_lesson_progress(student_id, lesson_id)`
Returns progress for all content items in a lesson.

### `calculate_lesson_completion(student_id, lesson_id)`
Returns overall completion percentage (0-100) for a lesson.

---

## Troubleshooting

### Common Issues

**Issue:** "permission denied for table"
- **Cause:** RLS policy blocking access
- **Fix:** Check if user has appropriate role and ownership

**Issue:** "policy expression is malformed"
- **Cause:** Syntax error in policy
- **Fix:** Review policy SQL, check table aliases

**Issue:** "RLS not enabled"
- **Cause:** Table missing `ENABLE ROW LEVEL SECURITY`
- **Fix:** Run `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`

---

## Related Documents

- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Full schema reference
- [VIDEO_PROGRESS_TRACKING.md](./VIDEO_PROGRESS_TRACKING.md) - Video tracking implementation
- [FEATURE_QUICK_START.md](./FEATURE_QUICK_START.md) - Feature implementation guide
