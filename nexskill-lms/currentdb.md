-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admin_verification_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  lesson_id uuid,
  admin_id uuid NOT NULL,
  content text NOT NULL,
  is_resolved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_verification_feedback_pkey PRIMARY KEY (id),
  CONSTRAINT feedback_course_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT feedback_lesson_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id),
  CONSTRAINT feedback_admin_fkey FOREIGN KEY (admin_id) REFERENCES auth.users(id)
);
CREATE TABLE public.categories (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.certificate_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL UNIQUE,
  coach_id uuid NOT NULL,
  certificate_title text NOT NULL DEFAULT 'Certificate of Completion'::text,
  certificate_description text DEFAULT 'Has successfully completed all requirements for'::text,
  issuer_name text,
  issuer_title text DEFAULT 'Course Instructor'::text,
  organization_name text DEFAULT 'NexSkill LMS'::text,
  signature_url text,
  logo_url text,
  border_color text DEFAULT '#304DB5'::text,
  accent_color text DEFAULT '#5E7BFF'::text,
  show_seal boolean DEFAULT true,
  seal_text text DEFAULT 'VERIFIED'::text,
  custom_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT certificate_templates_pkey PRIMARY KEY (id),
  CONSTRAINT certificate_templates_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT certificate_templates_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.coach_profiles (
  id uuid NOT NULL,
  job_title text,
  bio text,
  experience_level text,
  content_areas ARRAY,
  tools ARRAY,
  linkedin_url text,
  portfolio_url text,
  verification_status text DEFAULT 'pending'::text CHECK (verification_status = ANY (ARRAY['pending'::text, 'verified'::text, 'rejected'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT coach_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT coach_profiles_id_fkey FOREIGN KEY (id) REFERENCES public.profiles(id)
);
CREATE TABLE public.coaching_bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  coach_id uuid NOT NULL,
  session_date date NOT NULL,
  session_time text NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'completed'::text, 'cancelled'::text])),
  notes text,
  meeting_link text,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT coaching_bookings_pkey PRIMARY KEY (id),
  CONSTRAINT coaching_bookings_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id),
  CONSTRAINT coaching_bookings_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL,
  user2_id uuid NOT NULL,
  last_message_id uuid,
  last_message_content text,
  last_message_at timestamp with time zone NOT NULL DEFAULT now(),
  last_sender_id uuid,
  unread_count_user1 integer NOT NULL DEFAULT 0,
  unread_count_user2 integer NOT NULL DEFAULT 0,
  course_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_user2_id_fkey FOREIGN KEY (user2_id) REFERENCES public.profiles(id),
  CONSTRAINT conversations_last_message_id_fkey FOREIGN KEY (last_message_id) REFERENCES public.messages(id),
  CONSTRAINT conversations_last_sender_id_fkey FOREIGN KEY (last_sender_id) REFERENCES public.profiles(id),
  CONSTRAINT conversations_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT conversations_user1_id_fkey FOREIGN KEY (user1_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.course_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid,
  description text NOT NULL,
  position integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT course_goals_pkey PRIMARY KEY (id),
  CONSTRAINT course_goals_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.course_inclusions (
  course_id uuid NOT NULL,
  inclusion_id bigint NOT NULL,
  CONSTRAINT course_inclusions_pkey PRIMARY KEY (course_id, inclusion_id),
  CONSTRAINT course_inclusions_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT course_inclusions_inclusion_id_fkey FOREIGN KEY (inclusion_id) REFERENCES public.inclusions(id)
);
CREATE TABLE public.course_learning_objectives (
  course_id uuid NOT NULL,
  objective_id bigint NOT NULL,
  CONSTRAINT course_learning_objectives_pkey PRIMARY KEY (course_id, objective_id),
  CONSTRAINT course_learning_objectives_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT course_learning_objectives_objective_id_fkey FOREIGN KEY (objective_id) REFERENCES public.learning_objectives(id)
);
CREATE TABLE public.course_topics (
  course_id uuid NOT NULL,
  topic_id bigint NOT NULL,
  CONSTRAINT course_topics_pkey PRIMARY KEY (course_id, topic_id),
  CONSTRAINT course_tools_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT course_topics_topic_id_fkey FOREIGN KEY (topic_id) REFERENCES public.topics(id)
);
CREATE TABLE public.courses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  level USER-DEFINED DEFAULT 'Beginner'::course_level,
  duration_hours numeric NOT NULL,
  price numeric NOT NULL DEFAULT 0.00,
  category_id bigint,
  coach_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  subtitle text,
  short_description text,
  long_description text,
  language text DEFAULT 'English'::text,
  visibility text DEFAULT 'public'::text CHECK (visibility = ANY (ARRAY['public'::text, 'unlisted'::text, 'private'::text])),
  verification_status USER-DEFINED NOT NULL DEFAULT 'draft'::course_verification_status,
  CONSTRAINT courses_pkey PRIMARY KEY (id),
  CONSTRAINT courses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
  CONSTRAINT courses_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.discussion_replies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL,
  author_id uuid NOT NULL,
  content text NOT NULL,
  reaction_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT discussion_replies_pkey PRIMARY KEY (id),
  CONSTRAINT discussion_replies_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.discussion_threads(id),
  CONSTRAINT discussion_replies_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.discussion_threads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  course_id uuid,
  reply_count integer NOT NULL DEFAULT 0,
  reaction_count integer NOT NULL DEFAULT 0,
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT discussion_threads_pkey PRIMARY KEY (id),
  CONSTRAINT discussion_threads_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id),
  CONSTRAINT discussion_threads_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.enrollments (
  profile_id uuid NOT NULL,
  course_id uuid NOT NULL,
  enrolled_at timestamp with time zone DEFAULT now(),
  CONSTRAINT enrollments_pkey PRIMARY KEY (profile_id, course_id),
  CONSTRAINT enrollments_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id),
  CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.goals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT goals_pkey PRIMARY KEY (id)
);
CREATE TABLE public.inclusions (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL UNIQUE,
  CONSTRAINT inclusions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.interests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT interests_pkey PRIMARY KEY (id)
);
CREATE TABLE public.learning_objectives (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  objective_text text NOT NULL,
  CONSTRAINT learning_objectives_pkey PRIMARY KEY (id)
);
CREATE TABLE public.lessons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  content_blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  estimated_duration_minutes integer,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  completion_criteria jsonb DEFAULT '{"type": "view"}'::jsonb,
  CONSTRAINT lessons_pkey PRIMARY KEY (id)
);
CREATE TABLE public.live_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  coach_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  scheduled_at timestamp with time zone NOT NULL,
  duration_minutes integer DEFAULT 60,
  meeting_link text,
  is_live boolean DEFAULT false,
  status USER-DEFINED DEFAULT 'scheduled'::session_status,
  recording_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT live_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT live_sessions_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT live_sessions_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  course_id uuid,
  content character varying NOT NULL,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id),
  CONSTRAINT messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES auth.users(id),
  CONSTRAINT messages_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.module_content_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type = ANY (ARRAY['lesson'::text, 'quiz'::text])),
  content_id uuid NOT NULL,
  position integer NOT NULL,
  is_published boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT module_content_items_pkey PRIMARY KEY (id),
  CONSTRAINT module_content_items_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id)
);
CREATE TABLE public.module_prerequisites (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  module_id uuid NOT NULL,
  required_module_id uuid NOT NULL,
  is_strict boolean DEFAULT true,
  min_completion_percentage integer DEFAULT 100 CHECK (min_completion_percentage >= 0 AND min_completion_percentage <= 100),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT module_prerequisites_pkey PRIMARY KEY (id),
  CONSTRAINT module_prerequisites_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id),
  CONSTRAINT module_prerequisites_required_module_id_fkey FOREIGN KEY (required_module_id) REFERENCES public.modules(id)
);
CREATE TABLE public.modules (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  course_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  position integer NOT NULL,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  owner_id uuid,
  is_sequential boolean DEFAULT false,
  drip_mode text DEFAULT 'immediate'::text CHECK (drip_mode = ANY (ARRAY['immediate'::text, 'days-after-enrollment'::text, 'specific-date'::text, 'after-previous'::text])),
  drip_days integer,
  drip_date timestamp with time zone,
  CONSTRAINT modules_pkey PRIMARY KEY (id),
  CONSTRAINT modules_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT modules_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  username text UNIQUE CHECK (char_length(username) >= 3),
  email text UNIQUE,
  first_name text,
  last_name text,
  role text DEFAULT 'student'::text CHECK (role = ANY (ARRAY['student'::text, 'coach'::text, 'admin'::text, 'sub_coach'::text, 'content_editor'::text, 'community_manager'::text, 'support_staff'::text, 'org_owner'::text, 'platform_owner'::text, 'unassigned'::text])),
  middle_name text,
  name_extension text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.quiz_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quiz_id uuid NOT NULL,
  attempt_number integer NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['in_progress'::text, 'submitted'::text, 'graded'::text])),
  score integer,
  max_score integer,
  passed boolean,
  started_at timestamp with time zone DEFAULT now(),
  submitted_at timestamp with time zone,
  graded_at timestamp with time zone,
  graded_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quiz_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT quiz_attempts_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id),
  CONSTRAINT quiz_attempts_graded_by_fkey FOREIGN KEY (graded_by) REFERENCES auth.users(id)
);
CREATE TABLE public.quiz_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL,
  position integer NOT NULL,
  question_type text NOT NULL CHECK (question_type = ANY (ARRAY['multiple_choice'::text, 'true_false'::text, 'short_answer'::text, 'essay'::text, 'file_upload'::text, 'video_submission'::text])),
  points integer DEFAULT 1,
  requires_manual_grading boolean DEFAULT false,
  answer_config jsonb NOT NULL,
  max_attempts integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  question_content jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(question_content) = 'array'::text),
  CONSTRAINT quiz_questions_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_questions_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id)
);
CREATE TABLE public.quiz_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL,
  question_id uuid NOT NULL,
  response_data jsonb NOT NULL,
  points_earned integer,
  points_possible integer,
  is_correct boolean,
  requires_grading boolean DEFAULT false,
  grader_feedback text,
  graded_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quiz_responses_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_responses_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.quiz_attempts(id),
  CONSTRAINT quiz_responses_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.quiz_questions(id)
);
CREATE TABLE public.quiz_submission_files (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL,
  bucket_path text NOT NULL,
  file_name text NOT NULL,
  file_size_bytes bigint NOT NULL,
  mime_type text NOT NULL,
  uploaded_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quiz_submission_files_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_submission_files_response_id_fkey FOREIGN KEY (response_id) REFERENCES public.quiz_responses(id)
);
CREATE TABLE public.quiz_submission_videos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL,
  bucket_path text NOT NULL,
  file_name text NOT NULL,
  file_size_bytes bigint NOT NULL,
  mime_type text NOT NULL,
  duration_seconds numeric,
  thumbnail_path text,
  processing_status text DEFAULT 'pending'::text CHECK (processing_status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text])),
  uploaded_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quiz_submission_videos_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_submission_videos_response_id_fkey FOREIGN KEY (response_id) REFERENCES public.quiz_responses(id)
);
CREATE TABLE public.quizzes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  instructions text,
  passing_score integer CHECK (passing_score >= 0 AND passing_score <= 100),
  time_limit_minutes integer,
  max_attempts integer,
  requires_manual_grading boolean DEFAULT false,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  available_from timestamp with time zone,
  due_date timestamp with time zone,
  late_submission_allowed boolean DEFAULT false,
  late_penalty_percent integer DEFAULT 0,
  max_attempts_quiz integer,
  CONSTRAINT quizzes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.reviews (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  course_id uuid,
  profile_id uuid,
  rating smallint CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT reviews_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.student_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_profile_id uuid NOT NULL,
  goal_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT student_goals_pkey PRIMARY KEY (id),
  CONSTRAINT student_goals_student_profile_id_fkey FOREIGN KEY (student_profile_id) REFERENCES public.student_profiles(id),
  CONSTRAINT student_goals_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.goals(id)
);
CREATE TABLE public.student_interests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_profile_id uuid NOT NULL,
  interest_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT student_interests_pkey PRIMARY KEY (id),
  CONSTRAINT student_interests_student_profile_id_fkey FOREIGN KEY (student_profile_id) REFERENCES public.student_profiles(id),
  CONSTRAINT student_interests_interest_id_fkey FOREIGN KEY (interest_id) REFERENCES public.interests(id)
);
CREATE TABLE public.student_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  headline text,
  bio text,
  current_skill_level character varying CHECK (current_skill_level::text = ANY (ARRAY['Beginner'::character varying, 'Intermediate'::character varying, 'Advanced'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT student_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT student_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.student_wishlist (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT student_wishlist_pkey PRIMARY KEY (id),
  CONSTRAINT student_wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.sub_coach_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL,
  sub_coach_id uuid NOT NULL,
  course_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'inactive'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sub_coach_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT sub_coach_assignments_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES public.profiles(id),
  CONSTRAINT sub_coach_assignments_sub_coach_id_fkey FOREIGN KEY (sub_coach_id) REFERENCES public.profiles(id),
  CONSTRAINT sub_coach_assignments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.sub_coach_requirements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL,
  required_course_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sub_coach_requirements_pkey PRIMARY KEY (id),
  CONSTRAINT sub_coach_requirements_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.sub_coach_assignments(id),
  CONSTRAINT sub_coach_requirements_required_course_id_fkey FOREIGN KEY (required_course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.sub_coach_student_allocations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL,
  student_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sub_coach_student_allocations_pkey PRIMARY KEY (id),
  CONSTRAINT sub_coach_student_allocations_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.sub_coach_assignments(id),
  CONSTRAINT sub_coach_student_allocations_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.topics (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL UNIQUE,
  CONSTRAINT topics_pkey PRIMARY KEY (id)
);
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['course_purchase'::text, 'membership'::text, 'coaching_session'::text])),
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'PHP'::text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'succeeded'::text, 'failed'::text, 'refunded'::text])),
  description text,
  reference_id uuid,
  payment_method text DEFAULT 'card'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_lesson_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  is_completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  time_spent_seconds integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_lesson_progress_pkey PRIMARY KEY (id),
  CONSTRAINT user_lesson_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_lesson_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id)
);
CREATE TABLE public.user_memberships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  tier text NOT NULL DEFAULT 'free'::text CHECK (tier = ANY (ARRAY['free'::text, 'pro'::text, 'elite'::text])),
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_memberships_pkey PRIMARY KEY (id),
  CONSTRAINT user_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_module_progress (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  module_id uuid NOT NULL,
  completion_percentage integer DEFAULT 0,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_module_progress_pkey PRIMARY KEY (id),
  CONSTRAINT user_module_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_module_progress_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id)
);
CREATE TABLE public.video_embeddings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL,
  segment_index integer NOT NULL,
  timestamp_start numeric NOT NULL,
  timestamp_end numeric NOT NULL,
  thumbnail_path text,
  embedding USER-DEFINED,
  description text,
  transcription text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT video_embeddings_pkey PRIMARY KEY (id),
  CONSTRAINT video_embeddings_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.video_uploads(id)
);
CREATE TABLE public.video_transcriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL UNIQUE,
  full_text text,
  segments jsonb,
  language text DEFAULT 'en'::text,
  confidence_score numeric,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT video_transcriptions_pkey PRIMARY KEY (id),
  CONSTRAINT video_transcriptions_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.video_uploads(id)
);
CREATE TABLE public.video_uploads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type = ANY (ARRAY['lesson'::text, 'quiz_question'::text])),
  content_id uuid NOT NULL,
  bucket_path text NOT NULL,
  file_name text NOT NULL,
  file_size_bytes bigint NOT NULL,
  mime_type text NOT NULL,
  duration_seconds numeric,
  resolution text,
  frame_rate numeric,
  codec text,
  processing_status text DEFAULT 'pending'::text CHECK (processing_status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text])),
  processing_error text,
  uploaded_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone,
  CONSTRAINT video_uploads_pkey PRIMARY KEY (id),
  CONSTRAINT video_uploads_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id)
);