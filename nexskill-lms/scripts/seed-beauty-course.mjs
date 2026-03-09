/**
 * NexSkill LMS — Beauty & Skincare Demo Seed Script
 *
 * Creates:
 *   Coach  : coach.beauty@nexskill.demo  / demo1234
 *   Student: student.beauty@nexskill.demo / demo1234
 *
 * Coverage:
 *   category, course ("Complete Beauty & Skincare Masterclass"),
 *   3 modules, 8 text-only lessons, 2 quizzes (5 questions each),
 *   enrollment, 100% lesson progress, passing quiz attempts,
 *   student graduated / certificate-ready
 *
 * Run with:  node scripts/seed-beauty-course.mjs
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
let ok = 0, skip = 0, errCount = 0;
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
  console.log('\n🌸  NexSkill LMS — Beauty & Skincare Demo Seeder\n');

  // ── 1. Authenticate / create users ──────────────────────────────────────
  sect('1. Users');

  let coachUser, studentUser;
  try {
    coachUser = await signIn('coach.beauty@nexskill.demo', 'demo1234');
    log(`Coach signed in: ${coachUser.id}`);
  } catch (e) { fail('Coach sign-in', e); return; }

  try {
    studentUser = await signIn('student.beauty@nexskill.demo', 'demo1234');
    log(`Student signed in: ${studentUser.id}`);
  } catch (e) { fail('Student sign-in', e); return; }

  // ── 2. Profiles ─────────────────────────────────────────────────────────
  sect('2. Profiles');

  await upsertRow('profiles', {
    id: coachUser.id,
    email: 'coach.beauty@nexskill.demo',
    username: 'coach_beauty',
    first_name: 'Maria',
    last_name: 'Santos',
    role: 'coach',
  }, 'id');
  log('Coach profile upserted');

  await upsertRow('profiles', {
    id: studentUser.id,
    email: 'student.beauty@nexskill.demo',
    username: 'student_beauty',
    first_name: 'Ana',
    last_name: 'Reyes',
    role: 'student',
  }, 'id');
  log('Student profile upserted');

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

  // Check if already exists
  let { data: existingCourse } = await supabase
    .from('courses')
    .select('id')
    .eq('title', 'Complete Beauty & Skincare Masterclass')
    .eq('coach_id', coachUser.id)
    .maybeSingle();

  let courseId;
  if (existingCourse) {
    courseId = existingCourse.id;
    log(`Course already exists: ${courseId}`);
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
<p>Properly prepped skin allows makeup to:</p>
<ul>
<li>Apply more smoothly and evenly</li>
<li>Last longer throughout the day</li>
<li>Look more natural and skin-like</li>
<li>Photograph better (no dry patches or cakey areas)</li>
</ul>`),
        },
        {
          title: 'Color Theory for Makeup Artists',
          description: 'Understanding the color wheel, undertones, and corrective techniques.',
          estimated_duration_minutes: 20,
          content_blocks: textBlock(`<h1>Color Theory for Makeup Artists</h1>
<p>Color theory is the backbone of professional makeup artistry. Understanding how colors interact helps you create harmonious looks and correct imperfections.</p>

<h2>The Color Wheel</h2>
<p>The color wheel consists of:</p>
<ul>
<li><strong>Primary colors:</strong> Red, Yellow, Blue — cannot be mixed from other colors</li>
<li><strong>Secondary colors:</strong> Orange, Green, Purple — created by mixing primaries</li>
<li><strong>Tertiary colors:</strong> Mixtures of primary + secondary (e.g., red-orange, blue-green)</li>
</ul>

<h2>Complementary Colors in Makeup</h2>
<p>Colors opposite each other on the wheel cancel each other out. This is the basis of color correction:</p>
<ul>
<li><strong>Green</strong> cancels <strong>redness</strong> (acne, rosacea)</li>
<li><strong>Peach/Orange</strong> cancels <strong>blue/purple</strong> (dark circles, especially on deeper skin tones)</li>
<li><strong>Lavender/Purple</strong> cancels <strong>yellow</strong> (sallowness)</li>
<li><strong>Yellow</strong> cancels <strong>purple</strong> (bruising)</li>
</ul>

<h2>Understanding Undertones</h2>
<p>Skin undertones determine which shades of foundation, lipstick, and eyeshadow look best:</p>
<ul>
<li><strong>Warm undertones:</strong> Yellow, golden, peachy base. Look best in warm shades (gold jewelry, earthy tones)</li>
<li><strong>Cool undertones:</strong> Pink, red, bluish base. Look best in cool shades (silver jewelry, berry tones)</li>
<li><strong>Neutral undertones:</strong> A mix of warm and cool. Can wear most colors</li>
</ul>

<h3>Quick Undertone Test</h3>
<p>Look at the veins on your inner wrist in natural light:</p>
<ul>
<li>Green veins → warm undertone</li>
<li>Blue/purple veins → cool undertone</li>
<li>Mix of both → neutral undertone</li>
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

<h3>2. Foundation Brush (Flat or Buffing)</h3>
<p>Best for: Full coverage. Use stippling or buffing motions for a seamless blend.</p>

<h3>3. Fingers</h3>
<p>Best for: Tinted moisturizers and light coverage. Body heat helps the product melt into skin.</p>

<h2>Shade Matching</h2>
<p>Always match foundation to:</p>
<ul>
<li>The <strong>jawline</strong> (not the back of your hand!)</li>
<li>Test in <strong>natural daylight</strong>, not store lighting</li>
<li>Test <strong>3 shades</strong> side by side — one should disappear into your skin</li>
</ul>

<h2>Concealer Techniques</h2>
<ul>
<li><strong>Under-eye brightening:</strong> Apply in an inverted triangle shape, blend outward</li>
<li><strong>Blemish coverage:</strong> Dab directly on the spot, let it set, then blend edges only</li>
<li><strong>Use one shade lighter</strong> than foundation for under-eye; exact match for blemishes</li>
</ul>

<h2>Setting Your Makeup</h2>
<ol>
<li><strong>Setting powder:</strong> Light dusting on T-zone to control oil. Use translucent or your shade.</li>
<li><strong>Setting spray:</strong> 2-3 sprays in an X-pattern over the face to lock everything in place.</li>
</ol>
<p><strong>Pro tip:</strong> For extra longevity, spray your beauty sponge with setting spray before bouncing foundation.</p>`),
        },
      ],
      quiz: {
        title: 'Makeup Artistry Quiz',
        description: 'Test your knowledge of color theory, face mapping, and application techniques.',
        passing_score: 60,
        time_limit_minutes: 10,
        max_attempts: 3,
        questions: [
          makeQMC('Which color corrector cancels redness?',
            [opt('a','Peach'), opt('b','Green'), opt('c','Lavender'), opt('d','Yellow')],
            'b', 'Green is opposite red on the color wheel, so it neutralizes redness.'),
          makeQTF('Foundation should be matched on the back of your hand.', false,
            'Foundation should be matched along the jawline in natural daylight for the most accurate result.'),
          makeQMC('What is the best application method for a natural, skin-like finish?',
            [opt('a','Flat brush'), opt('b','Airbrush'), opt('c','Damp beauty sponge'), opt('d','Dry cotton pad')],
            'c', 'A damp beauty sponge pressed in a bouncing motion creates the most natural finish.'),
          makeQMC('If your wrist veins appear green, your undertone is:',
            [opt('a','Cool'), opt('b','Warm'), opt('c','Neutral'), opt('d','Olive')],
            'b', 'Green veins indicate warm undertones; blue/purple indicate cool undertones.'),
          makeQTF('Setting spray should be applied in an X-pattern across the face.', true,
            'An X-pattern ensures even coverage of the setting spray across all areas of the face.'),
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
<p>A thorough client consultation is the foundation of professional beauty services. It builds trust, sets expectations, and ensures safe treatments.</p>

<h2>The Consultation Process</h2>
<ol>
<li><strong>Intake Form</strong> — Collect medical history, allergies, current skincare routine, medications, and lifestyle factors</li>
<li><strong>Visual Assessment</strong> — Examine the skin under proper lighting. Note texture, tone, hydration, and any conditions</li>
<li><strong>Touch Assessment</strong> — With clean hands, feel for dehydration, congestion, or sensitivity</li>
<li><strong>Discussion</strong> — Ask about goals, concerns, and budget. Listen more than you talk!</li>
<li><strong>Recommendations</strong> — Based on all the above, recommend treatments and products</li>
</ol>

<h2>Key Questions to Ask</h2>
<ul>
<li>"What is your main skin concern right now?"</li>
<li>"What products are you currently using?"</li>
<li>"Do you have any known allergies or sensitivities?"</li>
<li>"Are you taking any medications?" (Accutane, blood thinners, etc.)</li>
<li>"How much sun exposure do you typically get?"</li>
<li>"What is your skin goal for the next 3 months?"</li>
</ul>

<h2>Red Flags to Watch For</h2>
<ul>
<li>Active infections, open wounds, or severe inflammation</li>
<li>Recent chemical peels or laser treatments (within 2 weeks)</li>
<li>Isotretinoin (Accutane) use within the past 6 months</li>
<li>Pregnancy (some treatments and ingredients are contraindicated)</li>
</ul>`),
        },
        {
          title: 'Graduation: Your Beauty Career Roadmap',
          description: 'Launching your beauty career, building a portfolio, and next steps.',
          estimated_duration_minutes: 15,
          content_blocks: textBlock(`<h1>🎓 Graduation: Your Beauty Career Roadmap</h1>
<p><strong>Congratulations!</strong> You have completed the Complete Beauty & Skincare Masterclass. Here is your roadmap for what comes next.</p>

<h2>Immediate Next Steps</h2>
<ol>
<li><strong>Download your certificate</strong> — Share it on social media and LinkedIn</li>
<li><strong>Practice daily</strong> — Apply what you learned on yourself, friends, and family</li>
<li><strong>Build a portfolio</strong> — Take before/after photos (with consent) of every practice session</li>
</ol>

<h2>Building Your Brand</h2>
<ul>
<li>Choose a niche: bridal, editorial, skincare consultation, or everyday beauty</li>
<li>Create social media accounts dedicated to your beauty work</li>
<li>Post consistently — aim for 3-5 times per week</li>
<li>Engage with the beauty community by commenting and sharing knowledge</li>
</ul>

<h2>Getting Your First Clients</h2>
<ul>
<li>Offer discounted services to your first 10 clients in exchange for reviews</li>
<li>Create a simple price menu for your services</li>
<li>Set up a booking system (even a simple Google Form works to start)</li>
<li>Always exceed expectations — referrals are your best marketing</li>
</ul>

<h2>Keep Learning</h2>
<p>The beauty industry evolves constantly. Stay updated by:</p>
<ul>
<li>Following industry leaders and brands on social media</li>
<li>Attending beauty workshops and masterclasses</li>
<li>Reading industry publications</li>
<li>Taking advanced courses (we offer them here on NexSkill!)</li>
</ul>

<p><strong>You're ready. Go make the world more beautiful! 🌸</strong></p>`),
        },
      ],
      quiz: null, // No quiz for this module
    },
  ];

  const allLessonIds = [];
  const allQuizIds = [];
  const quizQuestionMap = []; // { quizId, questions: [{ id, correctAnswer }] }

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
      // May already exist from a previous run
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
        // Try to find existing
        const { data } = await supabase.from('lessons').select('id').eq('title', lDef.title).maybeSingle();
        lesson = data;
      }
      if (!lesson) { fail(`Lesson ${lDef.title}`, 'could not create'); continue; }
      allLessonIds.push(lesson.id);
      log(`  Lesson: ${lDef.title}`);

      // Link to module
      await insertRow('module_content_items', {
        module_id: mod.id,
        content_type: 'lesson',
        content_id: lesson.id,
        position: pos++,
        is_published: true,
      });
    }

    // Create quiz (if exists)
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

      // Link to module
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
  log('Student enrolled in course');

  // ── 7. Complete all lessons ─────────────────────────────────────────────
  sect('7. Lesson Progress (100%)');

  for (const lessonId of allLessonIds) {
    await upsertRow('user_lesson_progress', {
      user_id: studentUser.id,
      lesson_id: lessonId,
      is_completed: true,
      completed_at: daysAgo(Math.floor(Math.random() * 12) + 1),
      time_spent_seconds: Math.floor(Math.random() * 1200) + 300,
    }, 'user_id,lesson_id');
  }
  log(`Marked ${allLessonIds.length} lessons as completed`);

  // ── 8. Pass all quizzes ─────────────────────────────────────────────────
  sect('8. Quiz Attempts (all passed)');

  for (const { quizId, questions } of quizQuestionMap) {
    const maxScore = questions.length;

    // Create a passing attempt
    const attempt = await insertRow('quiz_attempts', {
      user_id: studentUser.id,
      quiz_id: quizId,
      attempt_number: 1,
      status: 'graded',
      score: maxScore,
      max_score: maxScore,
      passed: true,
      started_at: daysAgo(7),
      submitted_at: daysAgo(7),
      graded_at: daysAgo(7),
    });

    if (!attempt) continue;
    log(`Quiz attempt created for quiz ${quizId} — Score: ${maxScore}/${maxScore}`);

    // Create individual responses (all correct)
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

  // ── Done ────────────────────────────────────────────────────────────────
  sect('Done!');
  console.log(`\n  ✅ Successes: ${ok}  |  ❌ Errors: ${errCount}\n`);
  console.log('  📧 Coach account:   coach.beauty@nexskill.demo / demo1234');
  console.log('  📧 Student account: student.beauty@nexskill.demo / demo1234');
  console.log('  📚 Course: "Complete Beauty & Skincare Masterclass"');
  console.log('  🎓 Student has 100% progress — all lessons + quizzes completed');
  console.log('');
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
