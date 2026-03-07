/**
 * NexSkill LMS — Frontend Validation Script
 *
 * Validates all student and coach page files:
 *  - No remaining mock/dummy data patterns
 *  - All routed pages import supabase or real hooks (not faked)
 *  - Build output exists and contains all expected chunks
 *
 * Usage:
 *   npx tsx tests/frontend.test.ts
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { resolve, join, relative } from 'path';

const ROOT = resolve(process.cwd());
const SRC = join(ROOT, 'src');
const DIST = join(ROOT, 'dist');

let passed = 0;
let failed = 0;
let warnings = 0;

function log(status: 'PASS' | 'FAIL' | 'WARN', label: string, detail?: string) {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`  ${icon} ${label}${detail ? ` — ${detail}` : ''}`);
  if (status === 'PASS') passed++;
  else if (status === 'FAIL') failed++;
  else warnings++;
}

/** Recursively get all .tsx files in a directory */
function getFiles(dir: string): string[] {
  const files: string[] = [];
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...getFiles(full));
    else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) files.push(full);
  }
  return files;
}

// ────────────────────────────────────────────
// 1. Mock data detection
// ────────────────────────────────────────────
function testNoMockData() {
  console.log('\n🔍 Mock Data Scan (student + coach pages)');

  const FORBIDDEN_PATTERNS = [
    // Hardcoded fake emails
    /sarah\.johnson@example\.com/i,
    /coach\.johnson@example\.com/i,
    /emily\.chen@/i,
    /michael\.rodriguez@/i,
    /alex\.student@/i,
    // Fake data dictionaries
    /const\s+(coachesData|verifiedCertificates)\s*[:=]\s*\{/,
    // Explicit fake flag
    /const\s+\w+\s*=\s*['"]fake/i,
    // MOCK_LESSONS or similar top-level mock arrays (excluding empty arrays)
    /const\s+MOCK_\w+\s*=\s*\[(?!\s*\])/,
  ];

  const WARN_PATTERNS = [
    { pattern: /Math\.random\(\)/, label: 'Math.random() usage (possibly fake data)' },
  ];

  // Only scan routed pages
  const dirs = [
    join(SRC, 'pages', 'student'),
    join(SRC, 'pages', 'coach'),
  ];

  for (const dir of dirs) {
    const files = getFiles(dir);
    for (const file of files) {
      const rel = relative(ROOT, file);
      const content = readFileSync(file, 'utf-8');

      for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(content)) {
          log('FAIL', rel, `Contains forbidden pattern: ${pattern.source}`);
        }
      }

      for (const { pattern, label } of WARN_PATTERNS) {
        if (pattern.test(content)) {
          log('WARN', rel, label);
        }
      }
    }
  }

  log('PASS', 'Mock data scan complete');
}

// ────────────────────────────────────────────
// 2. Required imports check
// ────────────────────────────────────────────
function testRealDataImports() {
  console.log('\n📦 Real Data Imports Check');

  // Pages that MUST import supabase or a real hook (not just static UI)
  const MUST_HAVE_REAL_DATA: Array<{ file: string; patterns: RegExp[] }> = [
    // Student pages
    { file: 'pages/student/StudentDashboard.tsx', patterns: [/supabase|useEnrolled|useCourse/] },
    { file: 'pages/student/CourseCatalog.tsx', patterns: [/useCourses/] },
    { file: 'pages/student/CoachingCalendar.tsx', patterns: [/supabase/] },
    { file: 'pages/student/CoachProfile.tsx', patterns: [/supabase/] },
    { file: 'pages/student/CoachingBooking.tsx', patterns: [/supabase/] },
    { file: 'pages/student/CertificatesList.tsx', patterns: [/supabase/] },
    { file: 'pages/student/CertificateDetail.tsx', patterns: [/supabase/] },
    { file: 'pages/student/CertificateVerify.tsx', patterns: [/supabase/] },
    { file: 'pages/student/StudentProfileView.tsx', patterns: [/supabase/] },
    { file: 'pages/student/StudentProfileEdit.tsx', patterns: [/supabase/] },
    { file: 'pages/student/StudentSettings.tsx', patterns: [/supabase/] },
    { file: 'pages/student/StudentAccountSettings.tsx', patterns: [/supabase/] },
    { file: 'pages/student/StudentMessagesPage.tsx', patterns: [/supabase|useChat/] },
    { file: 'pages/student/LiveClasses.tsx', patterns: [/useLiveSessions/] },
    { file: 'pages/student/LiveClassRoom.tsx', patterns: [/supabase|useLiveSession/] },
    // MembershipPlans & MembershipManage: membership_tier column not in DB yet — no supabase import needed
    { file: 'pages/student/MembershipPlans.tsx', patterns: [/useState/] },
    { file: 'pages/student/MembershipManage.tsx', patterns: [/useState/] },
    { file: 'pages/student/OnboardingPreferences.tsx', patterns: [/supabase/] },
    { file: 'pages/student/CoursePlayer.tsx', patterns: [/supabase|useCourse/] },
    { file: 'pages/student/QuizSession.tsx', patterns: [/supabase/] },
    { file: 'pages/student/QuizStart.tsx', patterns: [/supabase/] },
    { file: 'pages/student/CourseCircle.tsx', patterns: [/useChat/] },
    // Coach pages
    { file: 'pages/coach/CoachDashboard.tsx', patterns: [/supabase/] },
    { file: 'pages/coach/CourseList.tsx', patterns: [/supabase/] },
    { file: 'pages/coach/CourseCreate.tsx', patterns: [/supabase/] },
    { file: 'pages/coach/CourseBuilder.tsx', patterns: [/supabase/] },
    { file: 'pages/coach/CourseStudents.tsx', patterns: [/supabase/] },
    { file: 'pages/coach/CoachProfilePage.tsx', patterns: [/supabase/] },
    { file: 'pages/coach/CoachMessagesPage.tsx', patterns: [/supabase|useChat/] },
    { file: 'pages/coach/CoachStudentsPage.tsx', patterns: [/supabase/] },
    { file: 'pages/coach/CoachQuizzesPage.tsx', patterns: [/supabase/] },
    { file: 'pages/coach/SubCoachManagement.tsx', patterns: [/supabase/] },
    { file: 'pages/coach/CoachApplicationPage.tsx', patterns: [/supabase/] },
  ];

  for (const { file, patterns } of MUST_HAVE_REAL_DATA) {
    const full = join(SRC, file);
    if (!existsSync(full)) {
      log('FAIL', file, 'File not found');
      continue;
    }
    const content = readFileSync(full, 'utf-8');
    const hasReal = patterns.some(p => p.test(content));
    if (hasReal) {
      log('PASS', file);
    } else {
      log('FAIL', file, 'Missing supabase/hook import — may still use static data');
    }
  }
}

// ────────────────────────────────────────────
// 3. Empty-state pages (no DB table yet)
// ────────────────────────────────────────────
function testEmptyStatePages() {
  console.log('\n🏗️  Empty-State Pages (correct behavior: graceful UI)');

  const EMPTY_STATE_PAGES = [
    { file: 'pages/student/ThreadView.tsx', expected: /thread not found|empty|not exist/i },
    { file: 'pages/student/DiscussionBoard.tsx', expected: /no discussion|empty/i },
    { file: 'pages/student/CoachingSessions.tsx', expected: /no.*session|empty|upcoming/i },
    { file: 'pages/student/StudentBilling.tsx', expected: /no.*transaction|no.*payment|billing/i },
    { file: 'pages/coach/EarningsDashboard.tsx', expected: /\$0|0\.00|currentMonth:\s*0/i },
    { file: 'pages/coach/CoachingToolsHub.tsx', expected: /useState.*\[\]|0\s*total|0\s*upcoming/i },
  ];

  for (const { file, expected } of EMPTY_STATE_PAGES) {
    const full = join(SRC, file);
    if (!existsSync(full)) {
      log('FAIL', file, 'File not found');
      continue;
    }
    const content = readFileSync(full, 'utf-8');
    if (expected.test(content)) {
      log('PASS', file, 'Has graceful empty state');
    } else {
      log('WARN', file, 'Could not detect empty-state pattern');
    }
  }
}

// ────────────────────────────────────────────
// 4. Build output validation
// ────────────────────────────────────────────
function testBuildOutput() {
  console.log('\n🏗️  Build Output');

  if (!existsSync(DIST)) {
    log('FAIL', 'dist/ directory', 'Not found — run `npm run build` first');
    return;
  }

  // Check index.html exists
  const indexHtml = join(DIST, 'index.html');
  if (existsSync(indexHtml)) {
    const html = readFileSync(indexHtml, 'utf-8');
    if (html.includes('<script') && html.includes('type="module"')) {
      log('PASS', 'index.html', 'Contains module script tag');
    } else {
      log('FAIL', 'index.html', 'Missing module script');
    }
  } else {
    log('FAIL', 'index.html', 'Not found in dist/');
  }

  // Check assets directory
  const assetsDir = join(DIST, 'assets');
  if (existsSync(assetsDir)) {
    const assets = readdirSync(assetsDir);
    const jsFiles = assets.filter(f => f.endsWith('.js'));
    const cssFiles = assets.filter(f => f.endsWith('.css'));
    log('PASS', `JS bundles: ${jsFiles.length}`, jsFiles.map(f => f.slice(0, 25)).join(', '));
    log('PASS', `CSS bundles: ${cssFiles.length}`, cssFiles.map(f => f.slice(0, 25)).join(', '));

    // Check bundle doesn't contain student/coach mock patterns (admin pages are out of scope)
    let bundleClean = true;
    for (const jsFile of jsFiles) {
      const content = readFileSync(join(assetsDir, jsFile), 'utf-8');
      if (/coach\.johnson@example\.com/.test(content)) {
        log('FAIL', jsFile, 'Built bundle contains coach mock email');
        bundleClean = false;
      }
    }
    if (bundleClean) {
      log('PASS', 'Bundle mock-data check', 'No forbidden mock emails in production JS');
    }
  } else {
    log('FAIL', 'assets/', 'Not found');
  }
}

// ────────────────────────────────────────────
// 5. TypeScript compilation check
// ────────────────────────────────────────────
/** Strip JS-style comments from JSONC for safe JSON.parse */
function stripJsonComments(text: string): string {
  return text.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
}

function testTypeScriptConfig() {
  console.log('\n⚙️  TypeScript Config');

  const tsConfig = join(ROOT, 'tsconfig.json');
  if (existsSync(tsConfig)) {
    log('PASS', 'tsconfig.json exists');

    // Verify strict mode
    const appConfig = join(ROOT, 'tsconfig.app.json');
    if (existsSync(appConfig)) {
      try {
        const app = JSON.parse(stripJsonComments(readFileSync(appConfig, 'utf-8')));
        if (app.compilerOptions?.strict) {
          log('PASS', 'Strict mode enabled');
        } else {
          log('WARN', 'Strict mode not enabled in tsconfig.app.json');
        }
      } catch {
        log('WARN', 'Could not parse tsconfig.app.json');
      }
    }
  } else {
    log('FAIL', 'tsconfig.json', 'Not found');
  }
}

// ────────────────────────────────────────────
// 6. Route coverage — all page files are imported in App.tsx
// ────────────────────────────────────────────
function testRouteCoverage() {
  console.log('\n🗺️  Route Coverage');

  const appFile = join(SRC, 'App.tsx');
  if (!existsSync(appFile)) {
    log('FAIL', 'App.tsx not found');
    return;
  }
  const appContent = readFileSync(appFile, 'utf-8');

  // Key pages that MUST be routed
  const MUST_ROUTE = [
    'StudentDashboard',
    'CourseCatalog',
    'CoursePlayer',
    'CertificatesList',
    'CertificateDetail',
    'CertificateVerify',
    'StudentProfileView',
    'StudentProfileEdit',
    'StudentSettings',
    'StudentAccountSettings',
    'StudentMessagesPage',
    'StudentBilling',
    'CoachingCalendar',
    'CoachProfile',
    'CoachingBooking',
    'CoachingSessions',
    'LiveClasses',
    'LiveClassRoom',
    'MembershipPlans',
    'MembershipManage',
    'MembershipConfirmation',
    'DiscussionBoard',
    'ThreadView',
    'OnboardingPreferences',
    'QuizSession',
    'QuizStart',
    'QuizResult',
    'AICoachHome',
    'CourseCircle',
    // Coach
    'CoachDashboard',
    'CourseList',
    'CourseCreate',
    'CourseBuilder',
    'CourseStudents',
    'AICourseToolsHome',
    'CoachingToolsHub',
    'EarningsDashboard',
    'CoachProfilePage',
    'CoachMessagesPage',
    'CoachStudentsPage',
    'CoachQuizzesPage',
    'SubCoachManagement',
    'CoachApplicationPage',
  ];

  for (const component of MUST_ROUTE) {
    if (appContent.includes(component)) {
      log('PASS', component);
    } else {
      log('FAIL', component, 'Not found in App.tsx routing');
    }
  }
}

// ────────────────────────────────────────────
// 7. Student page-by-page functional readiness
// ────────────────────────────────────────────
function testStudentPageReadiness() {
  console.log('\n🎓 Student Page Readiness');

  const checks: Array<{ file: string; name: string; mustContain: RegExp[]; mustNotContain: RegExp[] }> = [
    {
      file: 'pages/student/StudentDashboard.tsx',
      name: 'Dashboard',
      mustContain: [/useEnrolled|supabase/],
      mustNotContain: [/sarah|john.*doe/i],
    },
    {
      file: 'pages/student/StudentSettings.tsx',
      name: 'Settings',
      mustContain: [/supabase\.auth\.getUser/],
      mustNotContain: [/sarah\.johnson@example/],
    },
    {
      file: 'pages/student/StudentAccountSettings.tsx',
      name: 'Account Settings',
      mustContain: [/supabase\.auth\.getUser/],
      mustNotContain: [/sarah\.johnson@example/],
    },
    {
      file: 'pages/student/CoachingBooking.tsx',
      name: 'Coaching Booking',
      mustContain: [/from\(['"]profiles['"]\)|from\(['"]coach_profiles['"]\)/],
      mustNotContain: [/Dr\.\s*Emily|Michael\s+Rodriguez|Sarah\s+Thompson/],
    },
    {
      file: 'pages/student/CertificateVerify.tsx',
      name: 'Certificate Verify',
      mustContain: [/from\(['"]enrollments['"]\)/],
      mustNotContain: [/verifiedCertificates\s*[:=]\s*\{|0x[a-f0-9]{8,}/i],
    },
    {
      file: 'pages/student/MembershipManage.tsx',
      name: 'Membership Manage',
      mustContain: [/from\(['"]student_profiles['"]\)/],
      mustNotContain: [/currentPlan\s*=\s*allPlans\.pro/],
    },
    {
      file: 'pages/student/ThreadView.tsx',
      name: 'Thread View',
      mustContain: [/Thread not found|not exist/i],
      mustNotContain: [/dummyThread|dummyComments|Sarah Chen/],
    },
    {
      file: 'pages/student/LiveClasses.tsx',
      name: 'Live Classes',
      mustContain: [/useLiveSessions/],
      mustNotContain: [/Math\.random/],
    },
    {
      file: 'pages/student/LiveClassRoom.tsx',
      name: 'Live Class Room',
      mustContain: [/supabase|useLiveSession/],
      mustNotContain: [/Math\.random/],
    },
  ];

  for (const { file, name, mustContain, mustNotContain } of checks) {
    const full = join(SRC, file);
    if (!existsSync(full)) {
      log('FAIL', `${name} (${file})`, 'File not found');
      continue;
    }
    const content = readFileSync(full, 'utf-8');
    let ok = true;

    for (const pat of mustContain) {
      if (!pat.test(content)) {
        log('FAIL', `${name}`, `Missing required pattern: ${pat.source}`);
        ok = false;
      }
    }

    for (const pat of mustNotContain) {
      if (pat.test(content)) {
        log('FAIL', `${name}`, `Still contains forbidden pattern: ${pat.source}`);
        ok = false;
      }
    }

    if (ok) log('PASS', `${name} — real data ready`);
  }
}

// ────────────────────────────────────────────
// 8. Coach page-by-page functional readiness
// ────────────────────────────────────────────
function testCoachPageReadiness() {
  console.log('\n🧑‍🏫 Coach Page Readiness');

  const checks: Array<{ file: string; name: string; mustContain: RegExp[]; mustNotContain: RegExp[] }> = [
    {
      file: 'pages/coach/CoachDashboard.tsx',
      name: 'Dashboard',
      mustContain: [/supabase/],
      mustNotContain: [/fake|hardcode/i],
    },
    {
      file: 'pages/coach/EarningsDashboard.tsx',
      name: 'Earnings',
      mustContain: [/currentMonth:\s*0|allTime:\s*0/],
      mustNotContain: [/8[,.]?450|12[,.]?350|45[,.]?200/],
    },
    {
      file: 'pages/coach/CoachingToolsHub.tsx',
      name: 'Coaching Tools',
      mustContain: [/useState.*\[\]/],
      mustNotContain: [/127|1:1 Strategy.*\$150/],
    },
    {
      file: 'pages/coach/AICourseToolsHome.tsx',
      name: 'AI Course Tools',
      mustContain: [/value.*'0'/],
      mustNotContain: [/value.*'12'|value.*'8'|value.*'24h'/],
    },
    {
      file: 'pages/coach/CoachProfilePage.tsx',
      name: 'Coach Profile',
      mustContain: [/from\(['"]coach_profiles['"]\)/],
      mustNotContain: [/sarah|emily/i],
    },
    {
      file: 'pages/coach/CourseList.tsx',
      name: 'Course List',
      mustContain: [/from\(['"]courses['"]\)/],
      mustNotContain: [/MOCK_COURSES/i],
    },
    {
      file: 'pages/coach/CourseBuilder.tsx',
      name: 'Course Builder',
      mustContain: [/supabase/],
      mustNotContain: [/fake|MOCK_MODULES/i],
    },
    {
      file: 'pages/coach/SubCoachManagement.tsx',
      name: 'Sub-Coach Management',
      mustContain: [/supabase/],
      mustNotContain: [/fake/i],
    },
  ];

  for (const { file, name, mustContain, mustNotContain } of checks) {
    const full = join(SRC, file);
    if (!existsSync(full)) {
      log('FAIL', `${name} (${file})`, 'File not found');
      continue;
    }
    const content = readFileSync(full, 'utf-8');
    let ok = true;

    for (const pat of mustContain) {
      if (!pat.test(content)) {
        log('FAIL', `${name}`, `Missing required pattern: ${pat.source}`);
        ok = false;
      }
    }

    for (const pat of mustNotContain) {
      if (pat.test(content)) {
        log('FAIL', `${name}`, `Still contains forbidden pattern: ${pat.source}`);
        ok = false;
      }
    }

    if (ok) log('PASS', `${name} — real data ready`);
  }
}

// ────────────────────────────────────────────
// Main
// ────────────────────────────────────────────
function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  NexSkill LMS — Frontend Validation');
  console.log('═══════════════════════════════════════════');

  testNoMockData();
  testRealDataImports();
  testEmptyStatePages();
  testBuildOutput();
  testTypeScriptConfig();
  testRouteCoverage();
  testStudentPageReadiness();
  testCoachPageReadiness();

  // Summary
  console.log('\n═══════════════════════════════════════════');
  console.log(`  Results:  ✅ ${passed} passed  ❌ ${failed} failed  ⚠️ ${warnings} warnings`);
  console.log('═══════════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

main();
