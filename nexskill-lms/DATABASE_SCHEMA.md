# NexSkill LMS - Database Schema Documentation

**Generated:** March 27, 2026  
**Database:** Supabase (PostgreSQL)

---

## Table of Contents

1. [Core Tables](#core-tables)
2. [Course Management](#course-management)
3. [User Progress & Learning](#user-progress--learning)
4. [Quiz & Assessment](#quiz--assessment)
5. [Video & Media](#video--media)
6. [Coach & Sub-Coach System](#coach--sub-coach-system)
7. [Reviews & Feedback](#reviews--feedback)
8. [Transactions & Payments](#transactions--payments)
9. [Communication](#communication)
10. [Entity Relationship Diagram](#entity-relationship-diagram)

---

## Core Tables

### `profiles`
*Purpose: Base user profiles for all system users*

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, FK → auth.users(id) | User ID |
| `updated_at` | TIMESTAMPTZ | NOT NULL | Last profile update |
| `username` | TEXT | | Username |
| `email` | TEXT | | Email address |
| `first_name` | TEXT | | First name |
| `middle_name` | TEXT | | Middle name |
| `last_name` | TEXT | | Last name |
| `name_extension` | TEXT | | Name extension (Jr., Sr., etc.) |
| `role` | TEXT | NOT NULL, CHECK: 'student', 'coach', 'admin', 'unassigned' | User role |

---

## Course Management

### `courses`
*Purpose: Main course definitions*

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Course ID |
| `title` | TEXT | NOT NULL | Course title |
| `level` | TEXT | CHECK: 'Beginner', 'Intermediate', 'Advanced' | Difficulty level |
| `duration_hours` | NUMERIC | | Total course duration in hours |
| `price` | NUMERIC | | Course price |
| `category_id` | INTEGER | FK → categories(id) | Course category |
| `coach_id` | UUID | FK → profiles(id) | Course creator/coach |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |
| `subtitle` | TEXT | | Course subtitle |
| `short_description` | TEXT | | Short description (1-2 sentences) |
| `long_description` | TEXT | | Full course description |
| `language` | TEXT | | Course language |
| `visibility` | TEXT | CHECK: 'public', 'unlisted', 'private' | Course visibility |
| `verification_status` | TEXT | CHECK: 'draft', 'pending_review', 'changes_requested', 'approved', 'rejected' | Verification workflow status |

---

### `categories`
*Purpose: Course categorization*

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Category ID |
| `name` | TEXT | NOT NULL | Category name |
| `slug` | TEXT | NOT NULL | URL-friendly slug |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

---

### `modules`
*Purpose: Course modules/sections*

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Module ID |
| `title` | TEXT | NOT NULL | Module title |
| `course_id` | UUID | NOT NULL, FK → courses(id) ON DELETE CASCADE | Parent course |
| `order_index` | INTEGER | | Display order in course |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `is_sequential` | BOOLEAN | DEFAULT false | Require sequential completion |
| `drip_mode` | TEXT | DEFAULT 'immediate', CHECK: 'immediate', 'days-after-enrollment', 'specific-date', 'after-previous' | Content release mode |
| `drip_days` | INTEGER | | Days after enrollment to release |
| `drip_date` | TIMESTAMPTZ | | Specific release date |

---

### `module_content_items`
*Purpose: Organize lessons and quizzes within modules*

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Item ID |
| `module_id` | UUID | NOT NULL, FK → modules(id) ON DELETE CASCADE | Parent module |
| `content_type` | TEXT | NOT NULL, CHECK: 'lesson', 'quiz' | Type of content |
| `content_id` | UUID | NOT NULL | ID of lesson or quiz |
| `position` | INTEGER | NOT NULL | Order in module |
| `is_published` | BOOLEAN | DEFAULT true | Publication status |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Unique Constraints:**
- `(module_id, position)` - Unique position per module
- `(content_type, content_id)` - Unique content reference

---

### `lessons`
*Purpose: Store lesson content and metadata*

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Lesson ID |
| `title` | TEXT | NOT NULL | Lesson title |
| `description` | TEXT | | Lesson description |
| `content_blocks` | JSONB | NOT NULL DEFAULT '[]' | Structured content blocks |
| `estimated_duration_minutes` | INTEGER | | Estimated completion time |
| `is_published` | BOOLEAN | DEFAULT false | Publication status |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |
| `completion_criteria` | JSONB | DEFAULT '{"type": "view"}' | Requirements to mark complete |

---

### `course_goals`
*Purpose: Structured learning goals for a course*

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Goal ID |
| `course_id` | UUID | FK → courses(id) ON DELETE CASCADE | Related course |
| `description` | TEXT | NOT NULL | Goal description |
| `position` | INTEGER | DEFAULT 0 | Display order |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

---

## User Progress & Learning

### `user_lesson_progress`
*Purpose: Track user progress through lessons*

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Progress record ID |
| `user_id` | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | User ID |
| `lesson_id` | UUID | NOT NULL, FK → lessons(id) ON DELETE CASCADE | Lesson ID |
| `is_completed` | BOOLEAN | DEFAULT false | Completion status |
| `completed_at` | TIMESTAMPTZ | | When completed |
| `time_spent_seconds` | INTEGER | DEFAULT 0 | Time spent on lesson |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Unique Constraints:**
- `(user_id, lesson_id)` - One progress record per user per lesson

---

### `enrollments`
*Purpose: Track student course enrollments*

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Enrollment ID |
| `profile_id` | UUID | NOT NULL, FK → profiles(id) | Enrolled student |
| `course_id` | UUID | NOT NULL, FK → courses(id) | Enrolled course |
| `enrolled_at` | TIMESTAMPTZ | DEFAULT NOW() | Enrollment date |
| `status` | TEXT | DEFAULT 'active', CHECK: 'active', 'completed', 'dropped' | Enrollment status |

**Unique Constraints:**
- `(profile_id, course_id)` - One enrollment per user per course

---

## Quiz & Assessment

### `quizzes`
*Purpose: Store quiz definitions and settings*

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Quiz ID |
| `title` | TEXT | NOT NULL | Quiz title |
| `description` | TEXT | | Quiz description |
| `instructions` | TEXT | | Instructions for students |
| `passing_score` | INTEGER | CHECK: 0-100 | Minimum passing score (%) |
| `time_limit_minutes` | INTEGER | | Time limit in minutes |
| `max_attempts` | INTEGER | | Maximum attempts allowed |
| `requires_manual_grading` | BOOLEAN | DEFAULT false | Requires manual review |
| `is_published` | BOOLEAN | DEFAULT false | Publication status |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

---

### `quiz_questions`
*Purpose: Store individual quiz questions*

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Question ID |
| `quiz_id` | UUID | NOT NULL, FK → quizzes(id) ON DELETE CASCADE | Parent quiz |
| `position` | INTEGER | NOT NULL | Question order |
| `question_type` | TEXT | NOT NULL, CHECK: 'multiple_choice', 'true_false', 'short_answer', 'essay', 'file_upload', 'video_submission' | Question type |
| `question_text` | TEXT | NOT NULL | Question content |
| `question_media` | JSONB | | Media attachments |
| `points` | INTEGER | DEFAULT 1 | Point value |
| `requires_manual_grading` | BOOLEAN | DEFAULT false | Requires manual grading |
| `answer_config` | JSONB | NOT NULL | Answer configuration (choices, correct answers) |
| `max_attempts` | INTEGER | DEFAULT 1 | Max attempts for this question |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Unique Constraints:**
- `(quiz_id, position)` - Unique position per quiz

---

### `quiz_attempts`
*Purpose: Track user quiz attempts*

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Attempt ID |
| `user_id` | UUID | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | User ID |
| `quiz_id` | UUID | NOT NULL, FK → quizzes(id) ON DELETE CASCADE | Quiz ID |
| `attempt_number` | INTEGER | NOT NULL | Sequential attempt number |
| `status` | TEXT | NOT NULL, CHECK: 'in_progress', 'submitted', 'graded' | Attempt status |
| `score` | INTEGER | | Score achieved |
| `max_score` | INTEGER | | Maximum possible score |
| `passed` | BOOLEAN | | Whether passed |
| `started_at` | TIMESTAMPTZ | DEFAULT NOW() | When started |
| `submitted_at` | TIMESTAMPTZ | | When submitted |
| `graded_at` | TIMESTAMPTZ | | When graded |
| `graded_by` | UUID | FK → auth.users(id) | Who graded (if manual) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Unique Constraints:**
- `(user_id, quiz_id, attempt_number)` - Unique attempt number per user per quiz

---

### `quiz_responses`
*Purpose: Store user answers to quiz questions*

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Response ID |
| `attempt_id` | UUID | NOT NULL, FK → quiz_attempts(id) ON DELETE CASCADE | Quiz attempt |
| `question_id` | UUID | NOT NULL, FK → quiz_questions(id) ON DELETE CASCADE | Question |
| `response_data` | JSONB | NOT NULL | User's answer (JSON format) |
| `points_earned` | INTEGER | | Points earned |
| `points_possible` | INTEGER | | Points possible |
| `is_correct` | BOOLEAN | | Whether correct (auto-graded) |
| `requires_grading` | BOOLEAN | DEFAULT false | Needs manual grading |
| `grader_feedback` | TEXT | | Feedback from grader |
| `graded_at` | TIMESTAMPTZ | | When graded |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Unique Constraints:**
- `(attempt_id, question_id)` - One response per question per attempt

---

## Video & Media

### `video_uploads`
*Purpose: Store video metadata and bucket references*

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Upload ID |
| `content_type` | TEXT | NOT NULL, CHECK: 'lesson', 'quiz_question' | Associated content type |
| `content_id` | UUID | NOT NULL | ID of lesson or quiz question |
| `bucket_path` | TEXT | NOT NULL | Supabase storage bucket path |
| `file_name` | TEXT | NOT NULL | Original filename |
| `file_size_bytes` | BIGINT | NOT NULL | File size in bytes |
| `mime_type` | TEXT | NOT NULL | MIME type (e.g., 'video/mp4') |
| `duration_seconds` | NUMERIC | | Video duration |
| `resolution` | TEXT | | Video resolution (e.g., '1920x1080') |
| `frame_rate` | NUMERIC | | Frame rate (e.g., 30, 60) |
| `codec` | TEXT | | Video codec (e.g., 'h264') |
| `processing_status` | TEXT | DEFAULT 'pending', CHECK: 'pending', 'processing', 'completed', 'failed' | Transcoding status |
| `processing_error` | TEXT | | Error message if failed |
| `uploaded_by` | UUID | FK → auth.users(id) | Uploader user ID |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |
| `processed_at` | TIMESTAMPTZ | | When processing completed |

---

### `video_embeddings`
*Purpose: Store vector embeddings for video frames/segments (requires pgvector extension)*

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Embedding ID |
| `video_id` | UUID | NOT NULL, FK → video_uploads(id) ON DELETE CASCADE | Related video |
| `segment_index` | INTEGER | NOT NULL | Segment order |
| `timestamp_start` | NUMERIC | NOT NULL | Start timestamp in seconds |
| `timestamp_end` | NUMERIC | NOT NULL | End timestamp in seconds |
| `thumbnail_path` | TEXT | | Thumbnail image path |
| `embedding` | vector(512) | | Vector embedding (pgvector) |
| `description` | TEXT | | Segment description |
| `transcription` | TEXT | | Segment transcription |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Unique Constraints:**
- `(video_id, segment_index)` - Unique segment per video

**Indexes:**
- HNSW index on `embedding` for cosine similarity search

---

### `video_transcriptions`
*Purpose: Store speech-to-text transcriptions for videos*

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Transcription ID |
| `video_id` | UUID | NOT NULL, FK → video_uploads(id) ON DELETE CASCADE | Related video |
| `full_text` | TEXT | | Complete transcription text |
| `segments` | JSONB | | Time-segmented transcription |
| `language` | TEXT | DEFAULT 'en' | Language code |
| `confidence_score` | NUMERIC | | Transcription confidence (0-1) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Unique Constraints:**
- `(video_id)` - One transcription per video

---

## Coach & Sub-Coach System

### `coach_profiles`
*Purpose: Extended profile information for coaches*

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, FK → profiles(id) ON DELETE CASCADE | References user profile |
| `job_title` | TEXT | | Coach's job title |
| `bio` | TEXT | | Biography text |
| `experience_level` | TEXT | CHECK: 'Beginner', 'Intermediate', 'Expert' | Experience level |
| `content_areas` | TEXT[] | DEFAULT '{}' | Array of content areas/expertise |
| `tools` | TEXT[] | DEFAULT '{}' | Array of tools/technologies |
| `linkedin_url` | TEXT | | LinkedIn profile URL |
| `portfolio_url` | TEXT | | Portfolio website URL |
| `verification_status` | TEXT | DEFAULT 'pending', CHECK: 'pending', 'verified', 'rejected' | Verification status |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

---

### `sub_coach_assignments`
*Purpose: Track student assignments as sub-coaches for courses*

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Assignment ID |
| `coach_id` | UUID | NOT NULL, FK → profiles(id) ON DELETE CASCADE | Primary coach |
| `sub_coach_id` | UUID | NOT NULL, FK → profiles(id) ON DELETE CASCADE | Assigned sub-coach |
| `course_id` | UUID | NOT NULL, FK → courses(id) ON DELETE CASCADE | Course assignment |
| `status` | TEXT | DEFAULT 'active', CHECK: 'active', 'inactive', 'pending' | Assignment status |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Unique Constraints:**
- `(sub_coach_id, course_id)` - Prevents duplicate assignments

---

### `sub_coach_requirements`
*Purpose: Store prerequisite courses for sub-coach qualification*

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Requirement ID |
| `assignment_id` | UUID | NOT NULL, FK → sub_coach_assignments(id) ON DELETE CASCADE | Related assignment |
| `required_course_id` | UUID | NOT NULL, FK → courses(id) ON DELETE CASCADE | Required course |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Unique Constraints:**
- `(assignment_id, required_course_id)` - Unique requirement per assignment

---

### `sub_coach_student_allocations`
*Purpose: Track which enrolled students are managed by which sub-coach*

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Allocation ID |
| `assignment_id` | UUID | NOT NULL, FK → sub_coach_assignments(id) ON DELETE CASCADE | Related assignment |
| `student_id` | UUID | NOT NULL, FK → profiles(id) ON DELETE CASCADE | Allocated student |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Unique Constraints:**
- `(assignment_id, student_id)` - Unique allocation per student per assignment

---

## Reviews & Feedback

### `reviews`
*Purpose: Student reviews for courses*

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Review ID |
| `course_id` | UUID | NOT NULL, FK → courses(id) ON DELETE CASCADE | Course being reviewed |
| `profile_id` | UUID | NOT NULL, FK → profiles(id) ON DELETE CASCADE | Review author |
| `rating` | INTEGER | NOT NULL, CHECK: 1-5 | Star rating |
| `comment` | TEXT | | Review comment |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Unique Constraints:**
- `(course_id, profile_id)` - One review per user per course

---

### `admin_verification_feedback`
*Purpose: Admin feedback for course verification workflow*

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Feedback ID |
| `course_id` | UUID | NOT NULL, FK → courses(id) | Course under review |
| `lesson_id` | UUID | FK → lessons(id) | Specific lesson (if applicable) |
| `admin_id` | UUID | NOT NULL, FK → profiles(id) | Admin who provided feedback |
| `content` | TEXT | NOT NULL | Feedback content |
| `is_resolved` | BOOLEAN | DEFAULT false | Whether feedback was addressed |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

---

## Transactions & Payments

### `transactions`
*Purpose: Track coach earnings, sales, refunds, and payouts*

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Transaction ID |
| `coach_id` | UUID | NOT NULL | Coach receiving earnings |
| `course_id` | UUID | FK → courses(id) | Related course |
| `enrollment_id` | UUID | FK → enrollments(id) | Related enrollment |
| `type` | TEXT | NOT NULL, CHECK: 'sale', 'refund', 'payout', 'adjustment' | Transaction type |
| `amount` | DECIMAL(10,2) | NOT NULL DEFAULT 0 | Transaction amount |
| `currency` | TEXT | DEFAULT 'PHP' | Currency code |
| `status` | TEXT | NOT NULL DEFAULT 'pending', CHECK: 'completed', 'pending', 'failed', 'cancelled' | Transaction status |
| `description` | TEXT | | Transaction description |
| `metadata` | JSONB | DEFAULT '{}' | Additional metadata |
| `student_id` | UUID | | Student involved |
| `student_name` | TEXT | | Student name |
| `student_email` | TEXT | | Student email |
| `course_title` | TEXT | | Course title |
| `payment_method` | TEXT | | Payment method used |
| `payment_reference` | TEXT | | External payment reference |
| `platform_fee` | DECIMAL(10,2) | DEFAULT 0 | Platform fee deducted |
| `net_amount` | DECIMAL(10,2) | DEFAULT 0 | Net amount after fees |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |
| `processed_at` | TIMESTAMPTZ | | When transaction was processed |
| `notes` | TEXT | | Internal notes |

---

## Communication

### `messages`
*Purpose: Direct messaging between users*

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Message ID |
| `sender_id` | UUID | NOT NULL, FK → profiles(id) | Message sender |
| `recipient_id` | UUID | NOT NULL, FK → profiles(id) | Message recipient |
| `course_id` | UUID | FK → courses(id) | Related course (optional) |
| `content` | TEXT | NOT NULL | Message content |
| `read_at` | TIMESTAMPTZ | | When message was read |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

---

### `live_sessions`
*Purpose: Scheduled live video sessions for courses*

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Session ID |
| `course_id` | UUID | NOT NULL, FK → courses(id) | Related course |
| `coach_id` | UUID | NOT NULL, FK → profiles(id) | Session host |
| `title` | TEXT | NOT NULL | Session title |
| `description` | TEXT | | Session description |
| `scheduled_at` | TIMESTAMPTZ | NOT NULL | Scheduled start time |
| `duration_minutes` | INTEGER | NOT NULL | Expected duration |
| `meeting_link` | TEXT | | Video conference link |
| `is_live` | BOOLEAN | DEFAULT false | Currently live |
| `status` | TEXT | CHECK: 'scheduled', 'in_progress', 'live', 'completed', 'cancelled' | Session status |
| `recording_url` | TEXT | | Recording URL after session |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

---

## Entity Relationship Diagram

```
┌─────────────────┐
│    auth.users   │
│  (Supabase Auth)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    profiles     │──────────────────────────────┐
└────────┬────────┘                              │
         │                                       │
    ┌────┴────┬─────────────┬────────────────────┼────────┐
    │         │             │                    │        │
    ▼         ▼             ▼                    ▼        ▼
┌────────┐ ┌──────────┐ ┌─────────────┐   ┌────────────┐ ┌─────────────┐
│courses │ │coach_    │ │sub_coach_   │   │ messages   │ │live_sessions│
│        │ │profiles  │ │assignments  │   │            │ │             │
└───┬────┘ └──────────┘ └──────┬──────┘   └────────────┘ └─────────────┘
    │                          │
    │         ┌────────────────┼────────────────┐
    │         │                │                │
    ▼         ▼                ▼                ▼
┌────────┐ ┌────────────┐ ┌─────────────┐ ┌──────────────┐
│modules │ │requirements│ │allocations  │ │ transactions │
└───┬────┘ └────────────┘ └─────────────┘ └──────────────┘
    │
    ▼
┌──────────────────┐
│module_content_   │
│items             │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌─────────┐
│lessons │ │ quizzes │
└───┬────┘ └────┬────┘
    │           │
    │      ┌────┴────────┐
    │      │             │
    │      ▼             ▼
    │ ┌────────────┐ ┌──────────────┐
    │ │quiz_       │ │quiz_attempts │
    │ │questions   │ └──────┬───────┘
    │ └────────────┘        │
    │                       ▼
    │                 ┌────────────┐
    │                 │quiz_       │
    │                 │responses   │
    │                 └────────────┘
    │
    ▼
┌──────────────────┐
│user_lesson_      │
│progress          │
└──────────────────┘

Other Tables:
- categories → courses (1:M)
- course_goals → courses (M:1)
- reviews → courses (M:1)
- enrollments → courses, profiles (M:M junction)
- video_uploads → lessons, quiz_questions (M:1 polymorphic)
- video_embeddings → video_uploads (M:1)
- video_transcriptions → video_uploads (1:1)
- admin_verification_feedback → courses (M:1)
```

---

## Key Indexes & Performance Considerations

### Common Query Patterns

| Table | Indexed Columns | Purpose |
|-------|----------------|---------|
| `courses` | `visibility`, `verification_status` | Filter public approved courses |
| `courses` | `category_id` | Category filtering |
| `enrollments` | `profile_id`, `course_id` | User enrollment lookups |
| `user_lesson_progress` | `user_id`, `lesson_id` | Progress tracking |
| `quiz_attempts` | `user_id`, `quiz_id` | Attempt history |
| `reviews` | `course_id` | Course review aggregation |
| `transactions` | `coach_id`, `status` | Coach earnings queries |
| `video_uploads` | `content_id`, `content_type` | Video lookups by content |

---

## Row Level Security (RLS)

Most tables have RLS enabled with policies for:
- **Students:** Read public courses, manage own progress/enrollments
- **Coaches:** CRUD on own courses, read student progress
- **Admins:** Full access to all tables
- **Public:** Read-only access to approved public courses

---

## Notes

- All timestamps use `TIMESTAMPTZ` (UTC with timezone support)
- UUIDs are used for all primary keys (except `categories` which uses serial integers)
- JSONB columns store flexible structured data (content blocks, answer configs, metadata)
- The `pgvector` extension is enabled for video embedding similarity search
