-- Fix live_sessions deletion/update visibility under RLS
-- Root issue: table had no explicit policies, causing silent 0-row operations for coaches.

ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches can view their own live sessions" ON public.live_sessions;
CREATE POLICY "Coaches can view their own live sessions"
ON public.live_sessions
FOR SELECT
TO public
USING (coach_id = auth.uid());

DROP POLICY IF EXISTS "Coaches can insert their own live sessions" ON public.live_sessions;
CREATE POLICY "Coaches can insert their own live sessions"
ON public.live_sessions
FOR INSERT
TO public
WITH CHECK (coach_id = auth.uid());

DROP POLICY IF EXISTS "Coaches can update their own live sessions" ON public.live_sessions;
CREATE POLICY "Coaches can update their own live sessions"
ON public.live_sessions
FOR UPDATE
TO public
USING (coach_id = auth.uid())
WITH CHECK (coach_id = auth.uid());

DROP POLICY IF EXISTS "Coaches can delete their own live sessions" ON public.live_sessions;
CREATE POLICY "Coaches can delete their own live sessions"
ON public.live_sessions
FOR DELETE
TO public
USING (coach_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all live sessions" ON public.live_sessions;
CREATE POLICY "Admins can manage all live sessions"
ON public.live_sessions
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);
