-- ============================================================
-- NexSkill LMS — Migration 001
-- Tables: discussion_threads, discussion_replies,
--         coaching_bookings, user_memberships, transactions
-- Paste into Supabase SQL Editor and run.
-- ============================================================

-- 1. Discussion threads
CREATE TABLE IF NOT EXISTS public.discussion_threads (
  id             uuid    NOT NULL DEFAULT gen_random_uuid(),
  author_id      uuid    NOT NULL REFERENCES public.profiles(id),
  title          text    NOT NULL,
  content        text    NOT NULL,
  course_id      uuid    REFERENCES public.courses(id) ON DELETE SET NULL,
  reply_count    integer NOT NULL DEFAULT 0,
  reaction_count integer NOT NULL DEFAULT 0,
  is_pinned      boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT discussion_threads_pkey PRIMARY KEY (id)
);
ALTER TABLE public.discussion_threads DISABLE ROW LEVEL SECURITY;

-- 2. Discussion replies
CREATE TABLE IF NOT EXISTS public.discussion_replies (
  id             uuid    NOT NULL DEFAULT gen_random_uuid(),
  thread_id      uuid    NOT NULL REFERENCES public.discussion_threads(id) ON DELETE CASCADE,
  author_id      uuid    NOT NULL REFERENCES public.profiles(id),
  content        text    NOT NULL,
  reaction_count integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT discussion_replies_pkey PRIMARY KEY (id)
);
ALTER TABLE public.discussion_replies DISABLE ROW LEVEL SECURITY;

-- 3. Coaching bookings
CREATE TABLE IF NOT EXISTS public.coaching_bookings (
  id               uuid    NOT NULL DEFAULT gen_random_uuid(),
  student_id       uuid    NOT NULL REFERENCES public.profiles(id),
  coach_id         uuid    NOT NULL REFERENCES public.profiles(id),
  session_date     date    NOT NULL,
  session_time     text    NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  status           text    NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes            text,
  meeting_link     text,
  amount           numeric NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT coaching_bookings_pkey PRIMARY KEY (id)
);
ALTER TABLE public.coaching_bookings DISABLE ROW LEVEL SECURITY;

-- 4. User memberships (one row per user, upserted on plan change)
CREATE TABLE IF NOT EXISTS public.user_memberships (
  id           uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL UNIQUE REFERENCES public.profiles(id),
  tier         text NOT NULL DEFAULT 'free'
    CHECK (tier IN ('free', 'pro', 'elite')),
  started_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz,
  cancelled_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_memberships_pkey PRIMARY KEY (id)
);
ALTER TABLE public.user_memberships DISABLE ROW LEVEL SECURITY;

-- 5. Transactions (course purchases, membership payments, coaching sessions)
CREATE TABLE IF NOT EXISTS public.transactions (
  id             uuid    NOT NULL DEFAULT gen_random_uuid(),
  user_id        uuid    NOT NULL REFERENCES public.profiles(id),
  type           text    NOT NULL
    CHECK (type IN ('course_purchase', 'membership', 'coaching_session')),
  amount         numeric NOT NULL DEFAULT 0,
  currency       text    NOT NULL DEFAULT 'PHP',
  status         text    NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  description    text,
  reference_id   uuid,   -- course_id | membership_id | coaching_booking_id
  payment_method text    DEFAULT 'card',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT transactions_pkey PRIMARY KEY (id)
);
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_discussion_threads_author ON public.discussion_threads(author_id);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_thread ON public.discussion_replies(thread_id);
CREATE INDEX IF NOT EXISTS idx_coaching_bookings_student ON public.coaching_bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_coaching_bookings_coach   ON public.coaching_bookings(coach_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user         ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_reference    ON public.transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_user_memberships_user     ON public.user_memberships(user_id);
