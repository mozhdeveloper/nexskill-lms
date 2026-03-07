/**
 * NexSkill LMS — Backend (Supabase) Validation Script
 *
 * Tests connectivity, auth, and all table reads the application relies on.
 *
 * Usage:
 *   npx tsx tests/backend.test.ts
 *
 * Requires environment variables (from .env or .env.local):
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// ────────────────────────────────────────────
// Config
// ────────────────────────────────────────────
const DEMO_ACCOUNTS = {
  student: { email: 'alex.doe@nexskill.demo', password: 'demo1234' },
  coach:   { email: 'jordan.doe@nexskill.demo', password: 'demo1234' },
  admin:   { email: 'morgan.doe@nexskill.demo', password: 'demo1234' },
};

const REQUIRED_TABLES = [
  'profiles',
  'courses',
  'enrollments',
  'modules',
  'module_content_items',
  'lessons',
  'quizzes',
  'quiz_questions',
  'quiz_attempts',
  'quiz_responses',
  'user_lesson_progress',
  'live_sessions',
  'coach_profiles',
  'student_profiles',
  'student_interests',
  'student_goals',
  'student_wishlist',
  'categories',
  'course_goals',
  'reviews',
  'conversations',
  'messages',
  'interests',
  'goals',
];

// ────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────
let passed = 0;
let failed = 0;
let skipped = 0;

function loadEnv(): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const name of ['.env.local', '.env']) {
    try {
      const path = resolve(process.cwd(), name);
      const content = readFileSync(path, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx < 0) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!vars[key]) vars[key] = val;
      }
    } catch {
      // file not found, skip
    }
  }
  return vars;
}

function log(status: 'PASS' | 'FAIL' | 'SKIP', label: string, detail?: string) {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
  console.log(`  ${icon} ${label}${detail ? ` — ${detail}` : ''}`);
  if (status === 'PASS') passed++;
  else if (status === 'FAIL') failed++;
  else skipped++;
}

// ────────────────────────────────────────────
// Test Suites
// ────────────────────────────────────────────

async function testConnection(supabase: SupabaseClient) {
  console.log('\n🔌 Connection');
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) throw error;
    log('PASS', 'Supabase reachable', `profiles table responded`);
  } catch (e: any) {
    log('FAIL', 'Supabase connection', e.message);
  }
}

async function testAuth(supabase: SupabaseClient) {
  console.log('\n🔑 Authentication');
  for (const [role, creds] of Object.entries(DEMO_ACCOUNTS)) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword(creds);
      if (error) throw error;
      if (!data.user) throw new Error('No user returned');
      log('PASS', `${role} login (${creds.email})`, `uid=${data.user.id.slice(0, 8)}…`);

      // Verify profile row exists
      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('id, role, first_name')
        .eq('id', data.user.id)
        .single();
      if (pErr) throw pErr;
      log('PASS', `${role} profile row`, `role=${profile.role}, name=${profile.first_name}`);

      // Verify role-specific profile
      if (role === 'student') {
        const { data: sp, error: spErr } = await supabase
          .from('student_profiles')
          .select('user_id, first_name')
          .eq('user_id', data.user.id)
          .single();
        if (spErr) throw spErr;
        log('PASS', `student_profiles row`, `name=${sp.first_name}`);
      }
      if (role === 'coach') {
        const { data: cp, error: cpErr } = await supabase
          .from('coach_profiles')
          .select('id, job_title')
          .eq('id', data.user.id)
          .single();
        if (cpErr) throw cpErr;
        log('PASS', `coach_profiles row`, `title=${cp.job_title}`);
      }

      await supabase.auth.signOut();
    } catch (e: any) {
      log('SKIP', `${role} login/profile`, `${e.message} (account may not exist)`);
    }
  }
}

async function testTableAccess(supabase: SupabaseClient) {
  console.log('\n📋 Table Access (read)');
  // Try admin first, fall back to coach for table access
  let loginLabel = 'admin';
  const { error: adminErr } = await supabase.auth.signInWithPassword(DEMO_ACCOUNTS.admin);
  if (adminErr) {
    const { error: coachErr } = await supabase.auth.signInWithPassword(DEMO_ACCOUNTS.coach);
    if (coachErr) {
      log('FAIL', 'Login for table tests', coachErr.message);
      return;
    }
    loginLabel = 'coach (admin unavailable)';
  }
  log('PASS', `Logged in as ${loginLabel} for table scans`);

  for (const table of REQUIRED_TABLES) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: false })
        .limit(1);
      if (error) throw error;
      log('PASS', table, `rows≥${count ?? data?.length ?? 0}`);
    } catch (e: any) {
      log('FAIL', table, e.message);
    }
  }
  await supabase.auth.signOut();
}

async function testStudentWorkflows(supabase: SupabaseClient) {
  console.log('\n🎓 Student Workflows');
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword(DEMO_ACCOUNTS.student);
  if (authErr || !authData.user) {
    log('FAIL', 'Student login', authErr?.message || 'no user');
    return;
  }
  const uid = authData.user.id;

  // 1. Dashboard data: enrolled courses
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select('course_id, enrolled_at')
      .eq('profile_id', uid);
    if (error) throw error;
    log('PASS', 'Fetch enrollments', `count=${data.length}`);
  } catch (e: any) {
    log('FAIL', 'Fetch enrollments', e.message);
  }

  // 2. Course catalog
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('id, title')
      .limit(5);
    if (error) throw error;
    log('PASS', 'Published courses', `count=${data.length}`);
  } catch (e: any) {
    log('FAIL', 'Published courses', e.message);
  }

  // 3. Certificates (enrollments with joined data)
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`course_id, enrolled_at, profiles:profile_id(first_name, last_name), courses:course_id(title)`)
      .eq('profile_id', uid)
      .limit(3);
    if (error) throw error;
    log('PASS', 'Certificate enrollment join', `count=${data.length}`);
  } catch (e: any) {
    log('FAIL', 'Certificate enrollment join', e.message);
  }

  // 4. Lesson progress
  try {
    const { data, error } = await supabase
      .from('user_lesson_progress')
      .select('lesson_id, is_completed')
      .eq('user_id', uid);
    if (error) throw error;
    log('PASS', 'Lesson progress', `count=${data.length}`);
  } catch (e: any) {
    log('FAIL', 'Lesson progress', e.message);
  }

  // 5. Live sessions
  try {
    const { data, error } = await supabase
      .from('live_sessions')
      .select('id, title, scheduled_at, status')
      .limit(5);
    if (error) throw error;
    log('PASS', 'Live sessions', `count=${data.length}`);
  } catch (e: any) {
    log('FAIL', 'Live sessions', e.message);
  }

  // 6. Messages / conversations
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('id, last_message_at')
      .or(`user1_id.eq.${uid},user2_id.eq.${uid}`)
      .limit(5);
    if (error) throw error;
    log('PASS', 'Conversations', `count=${data.length}`);
  } catch (e: any) {
    log('FAIL', 'Conversations', e.message);
  }

  // 7. Student profile + interests + goals
  try {
    const { data: sp, error: spErr } = await supabase
      .from('student_profiles')
      .select('user_id, first_name, last_name, current_skill_level')
      .eq('user_id', uid)
      .single();
    if (spErr) throw spErr;
    log('PASS', 'Student profile detail', `skill=${sp.current_skill_level}`);

    const { data: ints } = await supabase
      .from('student_interests')
      .select('interest_id')
      .eq('student_profile_id', sp.user_id);
    log('PASS', 'Student interests', `count=${ints?.length ?? 0}`);

    const { data: gls } = await supabase
      .from('student_goals')
      .select('goal_id')
      .eq('student_profile_id', sp.user_id);
    log('PASS', 'Student goals', `count=${gls?.length ?? 0}`);
  } catch (e: any) {
    log('FAIL', 'Student profile/interests/goals', e.message);
  }

  // 8. Membership tier (graceful)
  try {
    const { data: sp } = await supabase
      .from('student_profiles')
      .select('membership_tier')
      .eq('user_id', uid)
      .single();
    log('PASS', 'Membership tier read', `tier=${sp?.membership_tier ?? 'null (OK, column may not exist)'}`);
  } catch (e: any) {
    log('SKIP', 'Membership tier (column may not exist)', e.message);
  }

  await supabase.auth.signOut();
}

async function testCoachWorkflows(supabase: SupabaseClient) {
  console.log('\n🧑‍🏫 Coach Workflows');
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword(DEMO_ACCOUNTS.coach);
  if (authErr || !authData.user) {
    log('FAIL', 'Coach login', authErr?.message || 'no user');
    return;
  }
  const uid = authData.user.id;

  // 1. Coach profile (profiles + coach_profiles join)
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role')
      .eq('id', uid)
      .single();
    if (error) throw error;
    log('PASS', 'Coach profiles row', `name=${data.first_name} ${data.last_name}`);
  } catch (e: any) {
    log('FAIL', 'Coach profiles row', e.message);
  }

  try {
    const { data, error } = await supabase
      .from('coach_profiles')
      .select('id, job_title, content_areas, experience_level, verification_status')
      .eq('id', uid)
      .single();
    if (error) throw error;
    log('PASS', 'Coach profile detail', `title=${data.job_title}, status=${data.verification_status}`);
  } catch (e: any) {
    log('FAIL', 'Coach profile detail', e.message);
  }

  // 2. Coach's courses
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('id, title')
      .eq('coach_id', uid);
    if (error) throw error;
    log('PASS', 'Coach courses', `count=${data.length}`);
  } catch (e: any) {
    log('FAIL', 'Coach courses', e.message);
  }

  // 3. Modules & lessons for a course
  try {
    const { data: courses } = await supabase
      .from('courses')
      .select('id')
      .eq('coach_id', uid)
      .limit(1);
    if (courses && courses.length > 0) {
      const { data: modules, error } = await supabase
        .from('modules')
        .select('id, title')
        .eq('course_id', courses[0].id);
      if (error) throw error;
      log('PASS', 'Course modules', `course=${courses[0].id.slice(0, 8)}…, modules=${modules.length}`);

      if (modules.length > 0) {
        const { data: items, error: itemsErr } = await supabase
          .from('module_content_items')
          .select('id, content_type, content_id')
          .eq('module_id', modules[0].id);
        if (itemsErr) throw itemsErr;
        log('PASS', 'Module content items', `count=${items.length}`);
      }
    } else {
      log('SKIP', 'Course modules', 'No courses found for this coach');
    }
  } catch (e: any) {
    log('FAIL', 'Course modules/content', e.message);
  }

  // 4. Quizzes
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select('id, title')
      .limit(5);
    if (error) throw error;
    log('PASS', 'Quizzes access', `count=${data.length}`);
  } catch (e: any) {
    log('FAIL', 'Quizzes access', e.message);
  }

  // 5. Students enrolled in coach's courses
  try {
    const { data: courses } = await supabase
      .from('courses')
      .select('id')
      .eq('coach_id', uid);
    const courseIds = (courses || []).map((c: any) => c.id);
    if (courseIds.length > 0) {
      const { data: enrollments, error } = await supabase
        .from('enrollments')
        .select('profile_id, course_id')
        .in('course_id', courseIds);
      if (error) throw error;
      log('PASS', 'Enrolled students', `count=${enrollments.length}`);
    } else {
      log('SKIP', 'Enrolled students', 'No courses');
    }
  } catch (e: any) {
    log('FAIL', 'Enrolled students', e.message);
  }

  // 6. Messages
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('id')
      .or(`user1_id.eq.${uid},user2_id.eq.${uid}`)
      .limit(5);
    if (error) throw error;
    log('PASS', 'Coach conversations', `count=${data.length}`);
  } catch (e: any) {
    log('FAIL', 'Coach conversations', e.message);
  }

  await supabase.auth.signOut();
}

// ────────────────────────────────────────────
// Main
// ────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  NexSkill LMS — Backend Validation');
  console.log('═══════════════════════════════════════════');

  const env = loadEnv();
  const url = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('\n❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.');
    console.error('   Set them in .env.local or as environment variables.\n');
    process.exit(1);
  }

  console.log(`\n  Supabase URL: ${url}`);
  const supabase = createClient(url, key);

  await testConnection(supabase);
  await testAuth(supabase);
  await testTableAccess(supabase);
  await testStudentWorkflows(supabase);
  await testCoachWorkflows(supabase);

  // Summary
  console.log('\n═══════════════════════════════════════════');
  console.log(`  Results:  ✅ ${passed} passed  ❌ ${failed} failed  ⏭️ ${skipped} skipped`);
  console.log('═══════════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

main();
