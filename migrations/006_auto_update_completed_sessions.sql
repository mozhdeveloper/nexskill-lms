-- Trigger function to auto-update live_sessions status to 'completed' when end time has passed

CREATE OR REPLACE FUNCTION update_live_session_status_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'scheduled' AND (NEW.scheduled_at + (COALESCE(NEW.duration_minutes, 60) || ' minutes')::interval) < now() THEN
    NEW.status := 'completed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: before update or insert on live_sessions
DROP TRIGGER IF EXISTS trg_update_live_session_status_completed ON public.live_sessions;
CREATE TRIGGER trg_update_live_session_status_completed
BEFORE INSERT OR UPDATE ON public.live_sessions
FOR EACH ROW
EXECUTE FUNCTION update_live_session_status_completed();

-- Optionally, run this to update existing rows immediately:
-- UPDATE public.live_sessions
-- SET status = 'completed'
-- WHERE status = 'scheduled'
--   AND (scheduled_at + (COALESCE(duration_minutes, 60) || ' minutes')::interval) < now();
