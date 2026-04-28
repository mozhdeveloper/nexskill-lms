// Supabase Edge Function: auto-complete-sessions
// This function marks expired scheduled sessions as completed.
import { serve } from 'std/server';
import { createClient } from '@supabase/supabase-js';

serve(async (req) => {
  // Get env vars from Supabase Edge runtime
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseKey) {
    return new Response('Missing Supabase env vars', { status: 500 });
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Update all expired scheduled sessions to completed
  const { error, data } = await supabase.rpc('auto_complete_expired_sessions');
  if (error) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
  return new Response(`Success: ${data} sessions updated`, { status: 200 });
});
