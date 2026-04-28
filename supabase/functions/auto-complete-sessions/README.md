# Supabase Edge Function: auto-complete-sessions

This function marks all expired scheduled sessions as completed. It is intended to be run as a scheduled job (cron) in Supabase.

## How it works
- Uses the Supabase Service Role key to call a Postgres function (`auto_complete_expired_sessions`).
- The Postgres function should run the SQL:
  ```sql
  UPDATE public.live_sessions
  SET status = 'completed'
  WHERE status = 'scheduled'
    AND (scheduled_at + (COALESCE(duration_minutes, 60) || ' minutes')::interval) < now();
  ```

## Setup
1. **Create the Postgres function** (in SQL editor):
   ```sql
   CREATE OR REPLACE FUNCTION public.auto_complete_expired_sessions()
   RETURNS integer AS $$
   DECLARE
     updated_count integer;
   BEGIN
     UPDATE public.live_sessions
     SET status = 'completed'
     WHERE status = 'scheduled'
       AND (scheduled_at + (COALESCE(duration_minutes, 60) || ' minutes')::interval) < now();
     GET DIAGNOSTICS updated_count = ROW_COUNT;
     RETURN updated_count;
   END;
   $$ LANGUAGE plpgsql;
   ```
2. **Deploy the Edge Function:**
   ```sh
   supabase functions deploy auto-complete-sessions
   ```
3. **Schedule the function in Supabase dashboard** (Scheduled Triggers).

## Environment Variables
- `SUPABASE_URL` (auto-injected)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-injected)

## Security
- Only use the Service Role key in Edge Functions (never expose to client code).
