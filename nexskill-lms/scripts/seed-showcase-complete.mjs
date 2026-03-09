/**
 * NexSkill LMS — Complete Showcase Seed Script
 *
 * Creates a FULL end-to-end showcase demonstrating every feature.
 *
 * Accounts:
 *   Student: student.beauty@nexskill.demo / demo1234
 *   Coach:   coach.beauty@nexskill.demo   / demo1234
 *   Admin:   admin@nexskill.demo          / demo1234
 *
 * What gets seeded:
 *   ✅ Profiles for all 3 users
 *   ✅ Coach profile (verified)
 *   ✅ Student profile with onboarding completed
 *   ✅ Category: Beauty & Wellness
 *   ✅ Course: "Complete Beauty & Skincare Masterclass" (approved, public)
 *   ✅ 3 Modules with 8 text-only lessons (no videos)
 *   ✅ 2 Quizzes (5 MC/TF questions each) with all questions
 *   ✅ Student enrolled 14 days ago
 *   ✅ 100% lesson progress (all 8 lessons completed)
 *   ✅ 2 quiz attempts — both passed with perfect scores
 *   ✅ All quiz responses (individual per-question records)
 *   ✅ 5-star review from student
 *   ✅ Student is certificate-ready (graduated)
 *   ✅ Interests & goals for student onboarding
 *
 * Run: node scripts/seed-showcase-complete.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';

// ─── Load env ────────────────────────────────────────────────────────────────
function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const lines = readFileSync(path, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnvFile('.env');
loadEnvFile('.env.local');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_KEY =
  SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  Missing VITE_SUPABASE_URL or SUPABASE key in .env / .env.local');
  process.exit(1);
}
if (SUPABASE_SERVICE_KEY) {
  console.log('🔑  Using service role key — RLS bypassed.');
} else {
  console.log('⚠️   No service role key — using anon key (some inserts may fail due to RLS).');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Helpers ─────────────────────────────────────────────────────────────────
let ok = 0, errCount = 0;
const log  = (msg) => { console.log(`  ✅  ${msg}`); ok++; };
const fail = (msg, e) => { console.log(`  ❌  ${msg} — ${e?.message ?? e}`); errCount++; };
const sect = (t) => console.log(`\n${'─'.repeat(60)}\n  ${t}\n${'─'.repeat(60)}`);
const daysAgo = (d) => new Date(Date.now() - d * 86400_000).toISOString();

async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const { data: su, error: suErr } = await supabase.auth.signUp({ email, password });
    if (suErr) throw suErr;
    const { data: d2, error: e2 } = await supabase.auth.signInWithPassword({ email, password });
    if (e2) throw e2;
    return d2.user;
  }
  return data.user;
}

async function upsertRow(table, row, conflictCol) {
  const { data, error } = await supabase
    .from(table)
    .upsert(row, { onConflict: conflictCol })
    .select()
    .maybeSingle();
  if (error) { fail(`upsert ${table}`, error); return null; }
  return data;
}

async function insertRow(table, row) {
  const { data, error } = await supabase.from(table).insert(row).select().maybeSingle();
  if (error) { fail(`insert ${table}`, error); return null; }
  return data;
}

// ─── Content Helpers ─────────────────────────────────────────────────────────
const textBlock = (content) => [{ id: crypto.randomUUID(), type: 'text', content }];

const makeQMC = (text, options, correctId, explanation = '') => ({
  question_type: 'multiple_choice',
  points: 1,
  requires_manual_grading: false,
  question_content: [{ text, options }],
  answer_config: { correctOptionId: correctId, explanation },
});

const makeQTF = (text, correct, explanation = '') => ({
  question_type: 'true_false',
  points: 1,
  requires_manual_grading: false,
  question_content: [{ text }],
  answer_config: { correctAnswer: correct, explanation },
});

const opt = (id, text) => ({ id, text });

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('\n🎓  NexSkill LMS — Complete Showcase Seeder\n');

  // ── 1. Authenticate / create users ──────────────────────────────────────
  sect('1. Users (Student + Coach + Admin)');

  let coachUser, studentUser, adminUser;
  try {
    coachUser = await signIn('coach.beauty@nexskill.demo', 'demo1234');
    log(`Coach signed in: ${coachUser.id}`);
  } catch (e) { fail('Coach sign-in', e); return; }

  try {
    studentUser = await signIn('student.beauty@nexskill.demo', 'demo1234');
    log(`Student signed in: ${studentUser.id}`);
  } catch (e) { fail('Student sign-in', e); return; }

  try {
    adminUser = await signIn('admin@nexskill.demo', 'demo1234');
    log(`Admin signed in: ${adminUser.id}`);
  } catch (e) { fail('Admin sign-in', e); return; }

  // ── 2. Profiles ─────────────────────────────────────────────────────────
  sect('2. Profiles');

  await upsertRow('profiles', {
    id: coachUser.id,
    email: 'coach.beauty@nexskill.demo',
    username: 'coach_beauty',
    first_name: 'Maria',
    last_name: 'Santos',
    middle_name: 'Cruz',
    role: 'coach',
  }, 'id');
  log('Coach profile upserted');

  await upsertRow('profiles', {
    id: studentUser.id,
    email: 'student.beauty@nexskill.demo',
    username: 'student_beauty',
    first_name: 'Ana',
    last_name: 'Reyes',
    middle_name: 'Luz',
    role: 'student',
  }, 'id');
  log('Student profile upserted');

  await upsertRow('profiles', {
    id: adminUser.id,
    email: 'admin@nexskill.demo',
    username: 'admin_nexskill',
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
  }, 'id');
  log('Admin profile upserted');

  // ── 2b. Coach Profile ───────────────────────────────────────────────────
  sect('2b. Coach Profile (verified)');

  await upsertRow('coach_profiles', {
    id: coachUser.id,
    job_title: 'Licensed Esthetician & Makeup Artist',
    bio: 'Professional beauty educator with 8+ years of experience in skincare and makeup artistry. Certified by the Philippine Beauty Council.',
    experience_level: 'Expert',
    content_areas: ['Skincare', 'Makeup', 'Color Theory', 'Client Consultation'],
    tools: ['NexSkill LMS', 'Zoom', 'Canva'],
    verification_status: 'verified',
  }, 'id');
  log('Coach profile verified');

  // ── 2c. Student Profile (onboarding completed) ─────────────────────────
  sect('2c. Student Profile & Onboarding');

  // Create student_profiles entry
  let studentProfile = await upsertRow('student_profiles', {
    user_id: studentUser.id,
    first_name: 'Ana',
    last_name: 'Reyes',
    headline: 'Aspiring Beauty Professional',
    bio: 'Passionate about skincare and makeup. Currently building my portfolio and learning professional techniques.',
    current_skill_level: 'Beginner',
  }, 'user_id');

  if (!studentProfile) {
    const { data } = await supabase.from('student_profiles')
      .select('id')
      .eq('user_id', studentUser.id)
      .maybeSingle();
    studentProfile = data;
  }
  log(`Student profile created (id=${studentProfile?.id})`);

  // Add interests if the table has seed data
  if (studentProfile) {
    const { data: interests } = await supabase.from('interests').select('id').eq('is_active', true).limit(3);
    if (interests?.length) {
      for (const interest of interests) {
        await upsertRow('student_interests', {
          student_profile_id: studentProfile.id,
          interest_id: interest.id,
        }, 'student_profile_id,interest_id').catch(() => {});
      }
      log(`Linked ${interests.length} interests to student`);
    }

    const { data: goals } = await supabase.from('goals').select('id').eq('is_active', true).limit(2);
    if (goals?.length) {
      for (const goal of goals) {
        await upsertRow('student_goals', {
          student_profile_id: studentProfile.id,
          goal_id: goal.id,
        }, 'student_profile_id,goal_id').catch(() => {});
      }
      log(`Linked ${goals.length} goals to student`);
    }
  }

  // ── 3. Category ─────────────────────────────────────────────────────────
  sect('3. Category');

  let category = await upsertRow('categories', {
    name: 'Beauty & Wellness',
    slug: 'beauty-wellness',
  }, 'slug');
  if (!category) {
    const { data } = await supabase.from('categories').select('*').eq('slug', 'beauty-wellness').maybeSingle();
    category = data;
  }
  log(`Category: ${category?.name} (id=${category?.id})`);

  // ── 4. Course ───────────────────────────────────────────────────────────
  sect('4. Course');

  let { data: existingCourse } = await supabase
    .from('courses')
    .select('id')
    .eq('title', 'Complete Beauty & Skincare Masterclass')
    .eq('coach_id', coachUser.id)
    .maybeSingle();

  let courseId;
  if (existingCourse) {
    courseId = existingCourse.id;
    // Update to ensure it's approved
    await supabase.from('courses').update({ verification_status: 'approved', visibility: 'public' }).eq('id', courseId);
    log(`Course already exists: ${courseId} (updated to approved)`);
  } else {
    const course = await insertRow('courses', {
      title: 'Complete Beauty & Skincare Masterclass',
      subtitle: 'Master professional skincare, beauty techniques, and client consultation',
      short_description: 'A comprehensive text-based course covering skincare science, makeup artistry, and beauty business fundamentals.',
      long_description: `Welcome to the Complete Beauty & Skincare Masterclass! This course covers everything from skin biology and skincare routines to professional makeup techniques and building your beauty business.\n\nYou will learn:\n• Skin anatomy and how products work at a cellular level\n• How to create customized skincare routines for every skin type\n• Professional makeup application techniques\n• Color theory and face mapping\n• Client consultation and beauty business management\n\nBy the end of this course, you will have the foundational knowledge to begin a career in the beauty industry or elevate your personal skincare game.`,
      level: 'Beginner',
      duration_hours: 8,
      price: 2499.00,
      language: 'English',
      visibility: 'public',
      verification_status: 'approved',
      coach_id: coachUser.id,
      category_id: category?.id || null,
    });
    if (!course) return;
    courseId = course.id;
    log(`Course created: ${courseId}`);
  }

  // ── 5. Modules, Lessons, Quizzes ────────────────────────────────────────
  sect('5. Modules, Lessons & Quizzes');

  const MODULES = [
    {
      title: 'Module 1: Skincare Science Fundamentals',
      description: 'Understand skin biology, types, and how skincare products work.',
      position: 1,
      lessons: [
        {
          title: 'Understanding Your Skin: Anatomy & Layers',
          description: 'Learn the three layers of skin and their functions.',
          estimated_duration_minutes: 20,
          content_blocks: textBlock(`<h1>Understanding Your Skin: Anatomy & Layers</h1>
<p>The skin is the body's largest organ and serves as our primary barrier against the environment. Understanding its structure is essential for any aspiring beauty professional.</p>

<h2>The Three Layers of Skin</h2>

<h3>1. Epidermis (Outer Layer)</h3>
<p>The epidermis is the outermost layer you can see and touch. It contains:</p>
<ul>
<li><strong>Keratinocytes</strong> — the main cell type (95%), producing keratin for waterproofing</li>
<li><strong>Melanocytes</strong> — produce melanin, which gives skin its color and provides UV protection</li>
<li><strong>Langerhans cells</strong> — part of the immune system, detecting foreign substances</li>
</ul>
<p>The epidermis renews itself every 28–40 days. This is why consistent skincare routines take about a month to show results.</p>

<h3>2. Dermis (Middle Layer)</h3>
<p>The dermis sits beneath the epidermis and contains:</p>
<ul>
<li><strong>Collagen</strong> — provides structure and firmness (makes up 70% of the dermis)</li>
<li><strong>Elastin</strong> — gives skin its ability to snap back into place</li>
<li><strong>Hyaluronic acid</strong> — a natural humectant that holds up to 1000x its weight in water</li>
<li><strong>Blood vessels</strong> — deliver nutrients and remove waste</li>
<li><strong>Nerve endings</strong> — responsible for touch, pain, and temperature sensation</li>
</ul>

<h3>3. Hypodermis (Deepest Layer)</h3>
<p>Also called the subcutaneous layer, it contains fat cells that:</p>
<ul>
<li>Insulate the body from heat and cold</li>
<li>Provide cushioning and protection for bones and organs</li>
<li>Store energy</li>
</ul>

<h2>Why This Matters for Skincare</h2>
<p>Most skincare products work on the epidermis. Ingredients like retinol and vitamin C can penetrate deeper to stimulate collagen production in the dermis. Understanding which layer each product targets helps you build effective routines.</p>

<h2>Key Takeaway</h2>
<p>Healthy skin starts with understanding its structure. Each layer has a specific function, and proper skincare supports all three layers working together.</p>`),
        },
        {
          title: 'Skin Types & How to Identify Them',
          description: 'Learn the 5 skin types and diagnostic techniques.',
          estimated_duration_minutes: 15,
          content_blocks: textBlock(`<h1>Skin Types & How to Identify Them</h1>
<p>Every person's skin is unique, but we categorize skin into five main types. Correctly identifying skin type is the first step in recommending products and treatments.</p>

<h2>The Five Skin Types</h2>

<h3>1. Normal Skin</h3>
<p><strong>Characteristics:</strong> Balanced oil production, small pores, smooth texture, few imperfections.</p>
<p><strong>How to identify:</strong> After washing, the skin feels comfortable — not tight, not oily.</p>

<h3>2. Oily Skin</h3>
<p><strong>Characteristics:</strong> Excess sebum production, enlarged pores, shiny appearance, prone to blackheads and acne.</p>
<p><strong>How to identify:</strong> Blotting paper picks up oil from all areas of the face.</p>

<h3>3. Dry Skin</h3>
<p><strong>Characteristics:</strong> Tight feeling, visible flaking, rough texture, nearly invisible pores, may crack.</p>
<p><strong>How to identify:</strong> After washing, skin feels tight and may show flaky patches within 30 minutes.</p>

<h3>4. Combination Skin</h3>
<p><strong>Characteristics:</strong> Oily T-zone (forehead, nose, chin) with dry or normal cheeks.</p>
<p><strong>How to identify:</strong> Blotting paper shows oil only in the T-zone area, cheeks remain dry.</p>

<h3>5. Sensitive Skin</h3>
<p><strong>Characteristics:</strong> Easily irritated, redness, burning, itching, reacts to certain ingredients.</p>
<p><strong>How to identify:</strong> Frequent reactions to new products, visible redness, stinging with certain ingredients.</p>

<h2>The Bare-Face Test</h2>
<p>A simple diagnostic technique:</p>
<ol>
<li>Cleanse your face with a gentle cleanser</li>
<li>Pat dry and wait 30 minutes without applying any products</li>
<li>Observe: Is your skin oily? Tight? Comfortable? A mix?</li>
</ol>
<p>This quick test reveals your skin's true type without product interference.</p>`),
        },
        {
          title: 'Building a Skincare Routine: The Essential Steps',
          description: 'The correct order of skincare products and why it matters.',
          estimated_duration_minutes: 25,
          content_blocks: textBlock(`<h1>Building a Skincare Routine: The Essential Steps</h1>
<p>The order in which you apply skincare products matters. Applying them incorrectly can reduce their effectiveness or even cause irritation.</p>

<h2>Morning Routine (5 Steps)</h2>
<ol>
<li><strong>Cleanser</strong> — Use a gentle, pH-balanced cleanser to remove overnight oils</li>
<li><strong>Toner</strong> — Rebalances skin pH and prepares it to absorb serums</li>
<li><strong>Serum</strong> — Vitamin C in the morning for antioxidant protection</li>
<li><strong>Moisturizer</strong> — Locks in hydration and creates a protective barrier</li>
<li><strong>Sunscreen (SPF 30+)</strong> — THE most important anti-aging product. Apply even on cloudy days!</li>
</ol>

<h2>Evening Routine (6 Steps)</h2>
<ol>
<li><strong>Oil Cleanser / Makeup Remover</strong> — Dissolves sunscreen, makeup, and sebum</li>
<li><strong>Water-Based Cleanser</strong> — Removes remaining impurities (this is "double cleansing")</li>
<li><strong>Exfoliant</strong> — AHA/BHA 2-3 times per week (not daily!)</li>
<li><strong>Toner</strong> — Hydrating toner to prep the skin</li>
<li><strong>Treatment Serum</strong> — Retinol, niacinamide, or targeted treatments</li>
<li><strong>Night Cream / Sleeping Mask</strong> — Rich moisturizer for overnight repair</li>
</ol>

<h2>The Golden Rule</h2>
<p><strong>Thin to thick:</strong> Always apply products from thinnest to thickest consistency. Watery serums go before creamy moisturizers, which go before thick sunscreens.</p>

<h2>Common Mistakes to Avoid</h2>
<ul>
<li>Skipping sunscreen (even indoors!)</li>
<li>Over-exfoliating (damages the skin barrier)</li>
<li>Mixing active ingredients that don't pair well (e.g., retinol + AHA)</li>
<li>Changing your entire routine at once (introduce one new product at a time)</li>
</ul>`),
        },
      ],
      quiz: {
        title: 'Skincare Science Quiz',
        description: 'Test your knowledge of skin anatomy, types, and routines.',
        passing_score: 60,
        time_limit_minutes: 10,
        max_attempts: 3,
        questions: [
          makeQMC('Which layer of the skin contains collagen and elastin?',
            [opt('a','Epidermis'), opt('b','Dermis'), opt('c','Hypodermis'), opt('d','Stratum corneum')],
            'b', 'The dermis contains collagen (for structure) and elastin (for elasticity).'),
          makeQMC('How often does the epidermis completely renew itself?',
            [opt('a','Every 7 days'), opt('b','Every 14 days'), opt('c','Every 28-40 days'), opt('d','Every 90 days')],
            'c', 'The epidermis renews every 28-40 days, which is why skincare results take about a month.'),
          makeQTF('Sunscreen should only be worn on sunny days.', false,
            'UV rays penetrate clouds. SPF should be worn daily, even on cloudy or rainy days.'),
          makeQMC('What is the correct order for morning skincare?',
            [opt('a','Moisturizer → Cleanser → Sunscreen'), opt('b','Cleanser → Toner → Serum → Moisturizer → Sunscreen'), opt('c','Sunscreen → Serum → Cleanser'), opt('d','Toner → Cleanser → Moisturizer')],
            'b', 'The correct morning order is Cleanser → Toner → Serum → Moisturizer → Sunscreen.'),
          makeQTF('Combination skin has an oily T-zone and dry cheeks.', true,
            'Combination skin is characterized by excess oil in the T-zone with normal-to-dry cheeks.'),
        ],
      },
    },
    {
      title: 'Module 2: Makeup Artistry Essentials',
      description: 'Professional makeup application techniques and color theory.',
      position: 2,
      lessons: [
        {
          title: 'Face Mapping & Prep: The Foundation of Great Makeup',
          description: 'Learn face shapes, mapping, and how to prep skin before makeup.',
          estimated_duration_minutes: 20,
          content_blocks: textBlock(`<h1>Face Mapping & Prep</h1>
<p>Before applying any makeup, understanding face shapes and proper prep is essential for a flawless result.</p>

<h2>The 7 Face Shapes</h2>
<ul>
<li><strong>Oval</strong> — Considered the "ideal" shape; forehead slightly wider than the chin with balanced proportions</li>
<li><strong>Round</strong> — Width and length are nearly equal with soft angles</li>
<li><strong>Square</strong> — Strong jawline with forehead and jaw approximately the same width</li>
<li><strong>Heart</strong> — Wider forehead tapering to a narrow, pointed chin</li>
<li><strong>Oblong/Rectangle</strong> — Longer than wide with a straight cheek line</li>
<li><strong>Diamond</strong> — Narrow forehead and jawline with wide cheekbones</li>
<li><strong>Triangle/Pear</strong> — Jaw wider than forehead</li>
</ul>

<h2>Skin Prep Steps</h2>
<ol>
<li><strong>Cleanse</strong> — Start with clean skin free of oils and residue</li>
<li><strong>Moisturize</strong> — Apply a lightweight, fast-absorbing moisturizer</li>
<li><strong>Wait 5 minutes</strong> — Let moisturizer fully absorb before primer</li>
<li><strong>Prime</strong> — Apply primer suited to your skin type (mattifying for oily, hydrating for dry)</li>
<li><strong>Color correct</strong> — If needed, apply color corrector to neutralize discoloration</li>
</ol>

<h2>Why Prep Matters</h2>
<p>Properly prepped skin allows makeup to apply more smoothly, last longer, look more natural, and photograph better.</p>`),
        },
        {
          title: 'Color Theory for Makeup Artists',
          description: 'Understanding the color wheel, undertones, and corrective techniques.',
          estimated_duration_minutes: 20,
          content_blocks: textBlock(`<h1>Color Theory for Makeup Artists</h1>
<p>Color theory is the backbone of professional makeup artistry. Understanding how colors interact helps you create harmonious looks and correct imperfections.</p>

<h2>The Color Wheel</h2>
<ul>
<li><strong>Primary colors:</strong> Red, Yellow, Blue</li>
<li><strong>Secondary colors:</strong> Orange, Green, Purple</li>
<li><strong>Tertiary colors:</strong> Mixtures of primary + secondary</li>
</ul>

<h2>Complementary Colors in Makeup</h2>
<ul>
<li><strong>Green</strong> cancels <strong>redness</strong> (acne, rosacea)</li>
<li><strong>Peach/Orange</strong> cancels <strong>blue/purple</strong> (dark circles)</li>
<li><strong>Lavender/Purple</strong> cancels <strong>yellow</strong> (sallowness)</li>
<li><strong>Yellow</strong> cancels <strong>purple</strong> (bruising)</li>
</ul>

<h2>Understanding Undertones</h2>
<ul>
<li><strong>Warm:</strong> Yellow, golden, peachy. Green wrist veins.</li>
<li><strong>Cool:</strong> Pink, red, bluish. Blue/purple wrist veins.</li>
<li><strong>Neutral:</strong> A mix. Can wear most colors.</li>
</ul>`),
        },
        {
          title: 'Foundation, Concealer & Setting Techniques',
          description: 'Application methods, shade matching, and long-wear tips.',
          estimated_duration_minutes: 25,
          content_blocks: textBlock(`<h1>Foundation, Concealer & Setting Techniques</h1>

<h2>Foundation Application Methods</h2>
<h3>1. Beauty Sponge (Damp)</h3>
<p>Best for: Natural, skin-like finish. Bounce (don't drag) the sponge to press product into the skin.</p>
<h3>2. Foundation Brush</h3>
<p>Best for: Full coverage. Use stippling or buffing motions.</p>
<h3>3. Fingers</h3>
<p>Best for: Tinted moisturizers. Body heat helps product melt into skin.</p>

<h2>Shade Matching</h2>
<ul>
<li>Match to the <strong>jawline</strong>, not the back of your hand</li>
<li>Test in <strong>natural daylight</strong></li>
<li>Test <strong>3 shades</strong> side by side</li>
</ul>

<h2>Setting Your Makeup</h2>
<ol>
<li><strong>Setting powder:</strong> Light dusting on T-zone</li>
<li><strong>Setting spray:</strong> 2-3 sprays in an X-pattern</li>
</ol>
<p><strong>Pro tip:</strong> Spray your beauty sponge with setting spray before bouncing foundation for extra longevity.</p>`),
        },
      ],
      quiz: {
        title: 'Makeup Artistry Quiz',
        description: 'Test your knowledge of color theory, face mapping, and application.',
        passing_score: 60,
        time_limit_minutes: 10,
        max_attempts: 3,
        questions: [
          makeQMC('Which color corrector cancels redness?',
            [opt('a','Peach'), opt('b','Green'), opt('c','Lavender'), opt('d','Yellow')],
            'b', 'Green is opposite red on the color wheel.'),
          makeQTF('Foundation should be matched on the back of your hand.', false,
            'Foundation should be matched along the jawline in natural daylight.'),
          makeQMC('What is the best method for a natural finish?',
            [opt('a','Flat brush'), opt('b','Airbrush'), opt('c','Damp beauty sponge'), opt('d','Dry cotton pad')],
            'c', 'A damp beauty sponge creates the most natural finish.'),
          makeQMC('If your wrist veins appear green, your undertone is:',
            [opt('a','Cool'), opt('b','Warm'), opt('c','Neutral'), opt('d','Olive')],
            'b', 'Green veins indicate warm undertones.'),
          makeQTF('Setting spray should be applied in an X-pattern.', true,
            'An X-pattern ensures even coverage of the setting spray.'),
        ],
      },
    },
    {
      title: 'Module 3: Beauty Business & Client Care',
      description: 'Client consultation, hygiene standards, and starting your beauty business.',
      position: 3,
      lessons: [
        {
          title: 'Client Consultation & Skin Analysis',
          description: 'Professional consultation techniques and building client trust.',
          estimated_duration_minutes: 20,
          content_blocks: textBlock(`<h1>Client Consultation & Skin Analysis</h1>
<p>A thorough client consultation is the foundation of professional beauty services.</p>

<h2>The Consultation Process</h2>
<ol>
<li><strong>Intake Form</strong> — Medical history, allergies, current routine, medications</li>
<li><strong>Visual Assessment</strong> — Examine under proper lighting</li>
<li><strong>Touch Assessment</strong> — Feel for dehydration, congestion, sensitivity</li>
<li><strong>Discussion</strong> — Ask about goals, concerns, budget</li>
<li><strong>Recommendations</strong> — Based on all findings</li>
</ol>

<h2>Key Questions to Ask</h2>
<ul>
<li>"What is your main skin concern right now?"</li>
<li>"What products are you currently using?"</li>
<li>"Do you have any known allergies?"</li>
<li>"Are you taking any medications?"</li>
<li>"What is your skin goal for the next 3 months?"</li>
</ul>

<h2>Red Flags</h2>
<ul>
<li>Active infections or open wounds</li>
<li>Recent chemical peels (within 2 weeks)</li>
<li>Isotretinoin use within 6 months</li>
<li>Pregnancy (some ingredients contraindicated)</li>
</ul>`),
        },
        {
          title: 'Graduation: Your Beauty Career Roadmap',
          description: 'Launching your beauty career, building a portfolio, and next steps.',
          estimated_duration_minutes: 15,
          content_blocks: textBlock(`<h1>🎓 Graduation: Your Beauty Career Roadmap</h1>
<p><strong>Congratulations!</strong> You have completed the Complete Beauty & Skincare Masterclass.</p>

<h2>Immediate Next Steps</h2>
<ol>
<li><strong>Download your certificate</strong> — Share it on LinkedIn and social media</li>
<li><strong>Practice daily</strong> — Apply what you learned on yourself and others</li>
<li><strong>Build a portfolio</strong> — Take before/after photos of every practice session</li>
</ol>

<h2>Building Your Brand</h2>
<ul>
<li>Choose a niche: bridal, editorial, skincare, or everyday beauty</li>
<li>Create dedicated social media accounts</li>
<li>Post 3-5 times per week consistently</li>
</ul>

<h2>Getting Your First Clients</h2>
<ul>
<li>Offer discounted services to first 10 clients for reviews</li>
<li>Create a price menu for your services</li>
<li>Set up a simple booking system</li>
<li>Always exceed expectations — referrals are your best marketing</li>
</ul>

<p><strong>You're ready. Go make the world more beautiful! 🌸</strong></p>`),
        },
      ],
      quiz: null,
    },
  ];

  const allLessonIds = [];
  const allQuizIds = [];
  const quizQuestionMap = [];

  for (const modDef of MODULES) {
    // Create module
    let mod = await insertRow('modules', {
      course_id: courseId,
      title: modDef.title,
      description: modDef.description,
      position: modDef.position,
      is_published: true,
      owner_id: coachUser.id,
    });

    if (!mod) {
      const { data } = await supabase.from('modules')
        .select('id')
        .eq('course_id', courseId)
        .eq('title', modDef.title)
        .maybeSingle();
      mod = data;
    }
    if (!mod) { fail(`Module ${modDef.title}`, 'could not find or create'); continue; }
    log(`Module: ${modDef.title} (${mod.id})`);

    let pos = 1;

    // Create lessons
    for (const lDef of modDef.lessons) {
      let lesson = await insertRow('lessons', {
        title: lDef.title,
        description: lDef.description,
        estimated_duration_minutes: lDef.estimated_duration_minutes,
        is_published: true,
        content_blocks: lDef.content_blocks,
      });

      if (!lesson) {
        const { data } = await supabase.from('lessons').select('id').eq('title', lDef.title).maybeSingle();
        lesson = data;
      }
      if (!lesson) { fail(`Lesson ${lDef.title}`, 'could not create'); continue; }
      allLessonIds.push(lesson.id);
      log(`  Lesson: ${lDef.title}`);

      await insertRow('module_content_items', {
        module_id: mod.id,
        content_type: 'lesson',
        content_id: lesson.id,
        position: pos++,
        is_published: true,
      });
    }

    // Create quiz
    if (modDef.quiz) {
      const qDef = modDef.quiz;
      let quiz = await insertRow('quizzes', {
        title: qDef.title,
        description: qDef.description,
        passing_score: qDef.passing_score,
        time_limit_minutes: qDef.time_limit_minutes,
        max_attempts: qDef.max_attempts,
        is_published: true,
      });

      if (!quiz) {
        const { data } = await supabase.from('quizzes').select('id').eq('title', qDef.title).maybeSingle();
        quiz = data;
      }
      if (!quiz) { fail(`Quiz ${qDef.title}`, 'could not create'); continue; }
      allQuizIds.push(quiz.id);
      log(`  Quiz: ${qDef.title} (${quiz.id})`);

      await insertRow('module_content_items', {
        module_id: mod.id,
        content_type: 'quiz',
        content_id: quiz.id,
        position: pos++,
        is_published: true,
      });

      // Create quiz questions
      const questionRefs = [];
      for (let qi = 0; qi < qDef.questions.length; qi++) {
        const qQuestion = qDef.questions[qi];
        const qq = await insertRow('quiz_questions', {
          quiz_id: quiz.id,
          position: qi + 1,
          question_type: qQuestion.question_type,
          points: qQuestion.points,
          requires_manual_grading: qQuestion.requires_manual_grading,
          question_content: qQuestion.question_content,
          answer_config: qQuestion.answer_config,
        });
        if (qq) {
          questionRefs.push({
            id: qq.id,
            question_type: qQuestion.question_type,
            answer_config: qQuestion.answer_config,
          });
        }
      }
      quizQuestionMap.push({ quizId: quiz.id, questions: questionRefs });
      log(`  Created ${questionRefs.length} quiz questions`);
    }
  }

  // ── 6. Enrollment ───────────────────────────────────────────────────────
  sect('6. Student Enrollment');

  await upsertRow('enrollments', {
    profile_id: studentUser.id,
    course_id: courseId,
    enrolled_at: daysAgo(14),
  }, 'profile_id,course_id');
  log('Student enrolled in course (14 days ago)');

  // ── 7. Complete ALL lessons (100% progress) ────────────────────────────
  sect('7. Lesson Progress (100% complete)');

  for (let i = 0; i < allLessonIds.length; i++) {
    const lessonId = allLessonIds[i];
    // Spread completions across days 12 to 2 days ago (realistic timeline)
    const completedDaysAgo = 12 - Math.floor((i / allLessonIds.length) * 10);
    await upsertRow('user_lesson_progress', {
      user_id: studentUser.id,
      lesson_id: lessonId,
      is_completed: true,
      completed_at: daysAgo(completedDaysAgo),
      time_spent_seconds: 600 + (i * 120), // 10-26 minutes per lesson
    }, 'user_id,lesson_id');
  }
  log(`Marked ${allLessonIds.length} lessons as completed (100% progress)`);

  // ── 8. Pass all quizzes with perfect scores ────────────────────────────
  sect('8. Quiz Attempts (all passed — perfect scores)');

  for (const { quizId, questions } of quizQuestionMap) {
    const maxScore = questions.length;

    const attempt = await insertRow('quiz_attempts', {
      user_id: studentUser.id,
      quiz_id: quizId,
      attempt_number: 1,
      status: 'graded',
      score: maxScore,
      max_score: maxScore,
      passed: true,
      started_at: daysAgo(5),
      submitted_at: daysAgo(5),
      graded_at: daysAgo(5),
    });

    if (!attempt) continue;
    log(`Quiz attempt: ${quizId} — Score: ${maxScore}/${maxScore} (100%)`);

    for (const q of questions) {
      let responseData;
      if (q.question_type === 'multiple_choice') {
        responseData = { answer: q.answer_config.correctOptionId };
      } else if (q.question_type === 'true_false') {
        responseData = { answer: q.answer_config.correctAnswer };
      }

      await insertRow('quiz_responses', {
        attempt_id: attempt.id,
        question_id: q.id,
        response_data: responseData,
        points_earned: 1,
        points_possible: 1,
        is_correct: true,
        requires_grading: false,
      });
    }
    log(`  Created ${questions.length} correct quiz responses`);
  }

  // ── 9. Student Review ──────────────────────────────────────────────────
  sect('9. Course Review (5 stars)');

  // Check if review already exists
  const { data: existingReview } = await supabase.from('reviews')
    .select('id')
    .eq('course_id', courseId)
    .eq('profile_id', studentUser.id)
    .maybeSingle();

  if (existingReview) {
    log(`Review already exists (id=${existingReview.id})`);
  } else {
    const review = await insertRow('reviews', {
      course_id: courseId,
      profile_id: studentUser.id,
      rating: 5,
      comment: 'This course was absolutely amazing! The content on skincare science helped me understand what products actually work and why. The color theory module was a game-changer for my makeup skills. I feel confident starting my beauty career now. Highly recommend to anyone interested in the beauty industry! 🌸',
    });
    if (review) log(`Review created: 5 stars (id=${review.id})`);
  }

  // ── Done ────────────────────────────────────────────────────────────────
  sect('🎓 COMPLETE SHOWCASE READY!');
  console.log(`\n  ✅ Successes: ${ok}  |  ❌ Errors: ${errCount}\n`);
  console.log('  ╔══════════════════════════════════════════════════════════╗');
  console.log('  ║                    DEMO ACCOUNTS                        ║');
  console.log('  ╠══════════════════════════════════════════════════════════╣');
  console.log('  ║  👩‍🎓 Student: student.beauty@nexskill.demo / demo1234   ║');
  console.log('  ║  👩‍🏫 Coach:   coach.beauty@nexskill.demo   / demo1234   ║');
  console.log('  ║  🔑 Admin:   admin@nexskill.demo          / demo1234   ║');
  console.log('  ╠══════════════════════════════════════════════════════════╣');
  console.log('  ║                  WHAT TO SHOWCASE                       ║');
  console.log('  ╠══════════════════════════════════════════════════════════╣');
  console.log('  ║  📚 Course: "Complete Beauty & Skincare Masterclass"    ║');
  console.log('  ║  📖 3 Modules, 8 Lessons (all text, no videos)         ║');
  console.log('  ║  ❓ 2 Quizzes (5 questions each, MC + T/F)             ║');
  console.log('  ║  ✅ Student: 100% lesson progress                      ║');
  console.log('  ║  ✅ Student: Both quizzes passed (perfect scores)       ║');
  console.log('  ║  ⭐ Student: 5-star review posted                      ║');
  console.log('  ║  🎓 Student: Certificate ready (download PDF!)         ║');
  console.log('  ║  👤 Student: Onboarding completed                      ║');
  console.log('  ║  👩‍🏫 Coach:   Verified, course approved & published     ║');
  console.log('  ║  🔑 Admin:   Can view all in admin dashboard           ║');
  console.log('  ╚══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('  STUDENT FLOW SHOWCASE:');
  console.log('  1. Login → Dashboard (shows enrolled course at 100%)');
  console.log('  2. My Courses → Click course → See progress bar at 100%');
  console.log('  3. Curriculum → All lessons marked complete ✓');
  console.log('  4. Course Player → Read lessons, see completion status');
  console.log('  5. Quiz Results → Both quizzes passed with 5/5');
  console.log('  6. Certificates → Download PDF certificate');
  console.log('  7. Profile → Shows learning streak and stats');
  console.log('');
  console.log('  COACH FLOW SHOWCASE:');
  console.log('  1. Login → Dashboard (shows real KPIs)');
  console.log('  2. Courses → See published course');
  console.log('  3. Course Builder → View/edit modules, lessons, quizzes');
  console.log('  4. Students → See Ana Reyes at 100% progress');
  console.log('  5. Quizzes → View quiz stats and submissions');
  console.log('');
  console.log('  ADMIN FLOW SHOWCASE:');
  console.log('  1. Login → Admin Dashboard');
  console.log('  2. User Management → See all 3 users');
  console.log('  3. Course Moderation → See approved course');
  console.log('');
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
