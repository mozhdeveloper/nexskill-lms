-- Schema file for lesson and quiz
-- Module Content Table to hold Organized Lessons and Quizzes
create table module_content_items (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references modules(id) on delete cascade,
  content_type text not null check (content_type in ('lesson', 'quiz')),
  content_id uuid not null,
  position integer not null,
  is_published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(module_id, position),
  unique(content_type, content_id)
);

create index idx_content_items_module on module_content_items(module_id, position);


create table lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  content_blocks jsonb not null default '[]',
  estimated_duration_minutes integer,
  is_published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);


create table quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  instructions text,
  passing_score integer check (passing_score between 0 and 100),
  time_limit_minutes integer,
  max_attempts integer,
  requires_manual_grading boolean default false,
  is_published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);


create table quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  position integer not null,
  question_type text not null check (
    question_type in ('multiple_choice', 'true_false', 'short_answer', 
                      'essay', 'file_upload', 'video_submission')
  ),
  question_text text not null,
  question_media jsonb,
  points integer default 1,
  requires_manual_grading boolean default false,
  answer_config jsonb not null,
  max_attempts int default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(quiz_id, position)
);

create index idx_quiz_questions on quiz_questions(quiz_id, position);


create table user_lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  is_completed boolean default false,
  completed_at timestamptz,
  time_spent_seconds integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, lesson_id)
);

create index idx_lesson_progress_user on user_lesson_progress(user_id);


create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id uuid not null references quizzes(id) on delete cascade,
  attempt_number integer not null,
  status text not null check (status in ('in_progress', 'submitted', 'graded')),
  score integer,
  max_score integer,
  passed boolean,
  started_at timestamptz default now(),
  submitted_at timestamptz,
  graded_at timestamptz,
  graded_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, quiz_id, attempt_number)
);

create index idx_quiz_attempts_user on quiz_attempts(user_id, quiz_id);


create table quiz_responses (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references quiz_attempts(id) on delete cascade,
  question_id uuid not null references quiz_questions(id) on delete cascade,
  response_data jsonb not null,
  points_earned integer,
  points_possible integer,
  is_correct boolean,
  requires_grading boolean default false,
  grader_feedback text,
  graded_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(attempt_id, question_id)
);

create index idx_responses_attempt on quiz_responses(attempt_id);


-- Enable pgvector extension for vector storage
create extension if not exists vector;


-- Table to store video metadata and bucket references
create table video_uploads (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('lesson', 'quiz_question')),
  content_id uuid not null,
  bucket_path text not null,
  file_name text not null,
  file_size_bytes bigint not null,
  mime_type text not null,
  duration_seconds numeric,
  resolution text,
  frame_rate numeric,
  codec text,
  processing_status text default 'pending' check (
    processing_status in ('pending', 'processing', 'completed', 'failed')
  ),
  processing_error text,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  processed_at timestamptz
);

create index idx_video_uploads_content on video_uploads(content_type, content_id);
create index idx_video_uploads_status on video_uploads(processing_status);


-- Table to store vector embeddings for video frames/segments
create table video_embeddings (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references video_uploads(id) on delete cascade,
  segment_index integer not null,
  timestamp_start numeric not null,
  timestamp_end numeric not null,
  thumbnail_path text,
  embedding vector(512),
  description text,
  transcription text,
  created_at timestamptz default now(),
  unique(video_id, segment_index)
);

create index idx_video_embeddings_video on video_embeddings(video_id);
create index idx_video_embeddings_vector on video_embeddings 
  using hnsw (embedding vector_cosine_ops);


-- Table for video transcriptions (if using speech-to-text)
create table video_transcriptions (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references video_uploads(id) on delete cascade,
  full_text text,
  segments jsonb,
  language text default 'en',
  confidence_score numeric,
  created_at timestamptz default now(),
  unique(video_id)
);

create view public.module_content_with_data as
select
  -- From module_content_items
  mci.id,
  mci.module_id,
  mci.content_type,
  mci.content_id,
  mci.position,
  mci.is_published as item_is_published,
  mci.created_at as item_created_at,
  mci.updated_at as item_updated_at,

  -- Lesson fields (null if not a lesson)
  l.id as lesson_id,
  l.title as lesson_title,
  l.description as lesson_description,
  l.content_blocks,
  l.estimated_duration_minutes,
  l.is_published as lesson_is_published,
  l.created_at as lesson_created_at,
  l.updated_at as lesson_updated_at,

  -- Quiz fields (null if not a quiz)
  q.id as quiz_id,
  q.title as quiz_title,
  q.description as quiz_description,
  q.instructions,
  q.passing_score,
  q.time_limit_minutes,
  q.max_attempts as quiz_max_attempts,
  q.requires_manual_grading as quiz_requires_manual_grading,
  q.is_published as quiz_is_published,
  q.created_at as quiz_created_at,
  q.updated_at as quiz_updated_at

from public.module_content_items mci
left join public.lessons l
  on mci.content_type = 'lesson'
  and mci.content_id = l.id
left join public.quizzes q
  on mci.content_type = 'quiz'
  and mci.content_id = q.id;