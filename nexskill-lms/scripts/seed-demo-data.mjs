/**
 * NexSkill LMS — Deep Demo Data Seed Script
 *
 * Populates real Supabase data for:
 *   Coach  : jordan.doe@nexskill.demo  / demo1234
 *   Student: alex.doe@nexskill.demo   / demo1234
 *
 * Coverage:
 *   categories, coach_profiles, courses (3), modules (6), lessons (18),
 *   quizzes (6), quiz_questions (30), module_content_items, live_sessions (4),
 *   student_profiles, interests, goals, student_interests, student_goals,
 *   enrollments, user_lesson_progress, quiz_attempts, quiz_responses,
 *   reviews, student_wishlist, conversations, messages
 *
 * Idempotent: checks existing data before inserting.
 * Run with:  node scripts/seed-demo-data.mjs
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

// Service role key bypasses RLS entirely — ideal for seed scripts.
// Get it from: Supabase Dashboard → Project Settings → API → service_role (secret)
// Add to .env.local as: SUPABASE_SERVICE_ROLE_KEY=your_key_here
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const SUPABASE_KEY =
  SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌  Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env / .env.local');
  process.exit(1);
}

if (SUPABASE_SERVICE_KEY) {
  console.log('🔑  Using service role key — RLS bypassed for seeding.');
} else {
  console.log('⚠️   No SUPABASE_SERVICE_ROLE_KEY found — using anon key (some inserts may be blocked by RLS).');
  console.log('    Add SUPABASE_SERVICE_ROLE_KEY to .env.local to bypass RLS.');
  console.log('    Get it from: Supabase Dashboard → Project Settings → API → service_role\n');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Helpers ─────────────────────────────────────────────────────────────────
let ok = 0, skip = 0, err = 0;

const log  = (msg) => console.log(`  ✅  ${msg}`);
const skp  = (msg) => console.log(`  ⏭️   ${msg}`);
const fail = (msg, e) => { console.log(`  ❌  ${msg} — ${e?.message ?? e}`); err++; };
const sect = (t) => console.log(`\n${'─'.repeat(64)}\n  ${t}\n${'─'.repeat(64)}`);

async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Try sign-up first (account may not exist yet)
    console.log(`     ↳ signIn failed, trying signUp for ${email} ...`);
    const { data: su, error: suErr } = await supabase.auth.signUp({ email, password });
    if (suErr) throw suErr;
    // signUp succeeded — now sign in
    const { data: data2, error: err2 } = await supabase.auth.signInWithPassword({ email, password });
    if (err2) throw err2;
    return data2.user;
  }
  return data.user;
}

// Insert only if the row doesn't exist yet (returns inserted row or existing row)
async function insertIfMissing(table, row, conflictCol) {
  const { data, error } = await supabase
    .from(table)
    .upsert(row, { onConflict: conflictCol, ignoreDuplicates: true })
    .select()
    .maybeSingle();
  if (error) { fail(`insert ${table}`, error); return null; }
  return data;
}

// Upsert (insert or update)
async function upsert(table, row, conflictCol) {
  const { data, error } = await supabase
    .from(table)
    .upsert(row, { onConflict: conflictCol })
    .select()
    .maybeSingle();
  if (error) { fail(`upsert ${table}`, error); return null; }
  return data;
}

// ─── Future timestamps ────────────────────────────────────────────────────────
const daysFromNow = (d) => new Date(Date.now() + d * 86400_000).toISOString();
const weeksAgo    = (w) => new Date(Date.now() - w * 7 * 86400_000).toISOString();
const daysAgo     = (d) => new Date(Date.now() - d * 86400_000).toISOString();

// ═══════════════════════════════════════════════════════════════════════════════
// DATA DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

const CATEGORIES = [
  { name: 'Programming',       slug: 'programming' },
  { name: 'Data Science',      slug: 'data-science' },
  { name: 'Web Design',        slug: 'web-design' },
  { name: 'Digital Marketing', slug: 'digital-marketing' },
];

// question_content must be a JSON ARRAY (DB CHECK constraint).
// Format: [{ text, options? }]  — first element is used by QuizSession.tsx
const makeQMC = (text, opts, correctId, explanation = '') => ({
  question_type: 'multiple_choice',
  points: 1,
  requires_manual_grading: false,
  question_content: [{ text, options: opts }],
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

const COURSES_DEF = [
  {
    title: 'JavaScript Mastery: From Zero to Hero',
    subtitle: 'Learn JavaScript from scratch with hands-on projects',
    short_description: 'A complete beginner course covering all JS fundamentals, DOM manipulation, async programming, and real-world projects.',
    long_description: `This comprehensive JavaScript course takes you from absolute beginner to confident developer. You will master variables, functions, objects, arrays, the DOM, events, promises, and async/await through 12 hours of practical content. By the end you will build interactive web pages and understand how modern JavaScript powers the web.`,
    level: 'Beginner',
    duration_hours: 12,
    price: 49.99,
    language: 'English',
    visibility: 'public',
    verification_status: 'approved',
    modules: [
      {
        title: 'JavaScript Fundamentals',
        description: 'Core language concepts every JS developer must know.',
        position: 1,
        is_published: true,
        lessons: [
          {
            title: 'What is JavaScript?',
            description: 'Introduction to JavaScript, its history, and where it runs today.',
            estimated_duration_minutes: 15,
            is_published: true,
            content_blocks: [{ type: 'text', text: `# What is JavaScript?\n\nJavaScript (JS) is a lightweight, interpreted programming language with first-class functions. It is most well-known as the scripting language for Web pages, but it is also used in many non-browser environments such as Node.js.\n\n## A Brief History\nJavaScript was created by Brendan Eich in 1995 while he was working at Netscape Communications Corporation. It was originally called Mocha, then LiveScript, before being renamed JavaScript. Despite the name, it is not related to Java.\n\n## Where does JavaScript run?\n- **Browsers** — Chrome, Firefox, Safari, Edge all have JS engines\n- **Server** — Node.js lets you run JS on the server\n- **Mobile** — React Native uses JS for mobile apps\n- **Desktop** — Electron apps (VS Code, Slack) use JS\n\n## Your First JavaScript\n\`\`\`javascript\nconsole.log("Hello, World!");\n\`\`\`\n\nThis single line prints text to the browser console. Try opening DevTools (F12) and running it!` }],
          },
          {
            title: 'Variables, Data Types & Operators',
            description: 'Understanding let, const, var and the six primitive data types.',
            estimated_duration_minutes: 20,
            is_published: true,
            content_blocks: [{ type: 'text', text: `# Variables, Data Types & Operators\n\n## Declaring Variables\n\n\`\`\`javascript\nlet name = "Alex";      // block-scoped, reassignable\nconst PI = 3.14159;     // block-scoped, constant\nvar legacy = "avoid";   // function-scoped (legacy)\n\`\`\`\n\n## Primitive Data Types\n| Type | Example |\n|------|---------|\n| string | \`"Hello"\` |\n| number | \`42\`, \`3.14\` |\n| boolean | \`true\`, \`false\` |\n| null | \`null\` |\n| undefined | \`undefined\` |\n| symbol | \`Symbol('id')\` |\n\n## Operators\n\`\`\`javascript\n// Arithmetic\nlet sum = 10 + 5;      // 15\nlet diff = 10 - 5;     // 5\nlet product = 4 * 3;   // 12\nlet quotient = 10 / 4; // 2.5\nlet remainder = 10 % 3; // 1\n\n// Comparison (always use ===)\nconsole.log(5 === 5);   // true\nconsole.log(5 === "5"); // false (strict!)\n\`\`\`` }],
          },
          {
            title: 'Functions and Scope',
            description: 'Function declarations, expressions, arrow functions, and lexical scope.',
            estimated_duration_minutes: 25,
            is_published: true,
            content_blocks: [{ type: 'text', text: `# Functions and Scope\n\n## Function Declaration\n\`\`\`javascript\nfunction greet(name) {\n  return "Hello, " + name + "!";\n}\ngreet("Alex"); // "Hello, Alex!"\n\`\`\`\n\n## Function Expression\n\`\`\`javascript\nconst square = function(x) {\n  return x * x;\n};\n\`\`\`\n\n## Arrow Functions (ES6+)\n\`\`\`javascript\nconst double = (x) => x * 2;\nconst add = (a, b) => a + b;\n\`\`\`\n\n## Scope\nScope determines the visibility of variables:\n\`\`\`javascript\nlet globalVar = "I am global";\n\nfunction myFunc() {\n  let localVar = "I am local";\n  console.log(globalVar); // ✅ accessible\n  console.log(localVar);  // ✅ accessible\n}\n\nconsole.log(localVar); // ❌ ReferenceError\n\`\`\`\n\n## Closures\n\`\`\`javascript\nfunction makeCounter() {\n  let count = 0;\n  return () => ++count;\n}\nconst counter = makeCounter();\ncounter(); // 1\ncounter(); // 2\n\`\`\`` }],
          },
        ],
        quiz: {
          title: 'JavaScript Basics Quiz',
          description: 'Test your understanding of core JavaScript concepts.',
          instructions: 'Answer all 5 questions. You have 10 minutes. Passing score is 70%.',
          passing_score: 70,
          time_limit_minutes: 10,
          max_attempts: 3,
          max_attempts_quiz: 3,
          is_published: true,
          questions: [
            makeQMC(
              'Which keyword declares a block-scoped variable that cannot be reassigned?',
              [opt('a','var'), opt('b','let'), opt('c','const'), opt('d','function')],
              'c', 'const declares a block-scoped constant that cannot be reassigned after declaration.'
            ),
            makeQTF('JavaScript was created by Brendan Eich in 1995.', true, 'Correct! Brendan Eich created JavaScript in 1995 while at Netscape.'),
            makeQMC(
              'What does === check in JavaScript?',
              [opt('a','Value only'), opt('b','Type only'), opt('c','Value and type'), opt('d','Reference')],
              'c', 'The strict equality operator === checks both value and type.'
            ),
            makeQTF('Arrow functions have their own this binding.', false, 'Arrow functions inherit this from the enclosing lexical scope — they do not have their own this.'),
            makeQMC(
              'What is the output of: console.log(typeof null)?',
              [opt('a','"null"'), opt('b','"undefined"'), opt('c','"object"'), opt('d','"boolean"')],
              'c', 'typeof null returns "object" — this is a well-known JavaScript bug that cannot be fixed for backwards compatibility.'
            ),
          ],
        },
      },
      {
        title: 'DOM Manipulation & Events',
        description: 'Interact with web pages dynamically using the Document Object Model.',
        position: 2,
        is_published: true,
        lessons: [
          {
            title: 'Understanding the DOM',
            description: 'What the DOM is, how browsers parse HTML, and how to select elements.',
            estimated_duration_minutes: 20,
            is_published: true,
            content_blocks: [{ type: 'text', text: `# Understanding the DOM\n\nThe Document Object Model (DOM) is a programming interface for web documents. It represents the page as a tree of nodes that JavaScript can read and manipulate.\n\n## Selecting Elements\n\`\`\`javascript\n// By ID\nconst header = document.getElementById("main-header");\n\n// By CSS selector (returns first match)\nconst btn = document.querySelector(".submit-btn");\n\n// By CSS selector (returns all matches)\nconst items = document.querySelectorAll("li.item");\n\`\`\`\n\n## Reading & Writing Content\n\`\`\`javascript\n// Read text\nconsole.log(header.textContent);\n\n// Write HTML\nheader.innerHTML = "<strong>Welcome!</strong>";\n\n// Change styles\nbtn.style.backgroundColor = "blue";\n\n// Toggle class\nheader.classList.toggle("active");\n\`\`\`` }],
          },
          {
            title: 'Event Listeners & Handlers',
            description: 'Responding to user actions with event-driven programming.',
            estimated_duration_minutes: 25,
            is_published: true,
            content_blocks: [{ type: 'text', text: `# Event Listeners & Handlers\n\n## Adding Event Listeners\n\`\`\`javascript\nconst btn = document.querySelector("#myBtn");\n\nbtn.addEventListener("click", function(event) {\n  console.log("Button clicked!", event);\n});\n\`\`\`\n\n## Common Events\n| Event | When it fires |\n|-------|---------------|\n| click | User clicks element |\n| input | Input value changes |\n| submit | Form is submitted |\n| keydown | Key is pressed |\n| mouseover | Mouse enters element |\n| DOMContentLoaded | DOM is ready |\n\n## Event Object\n\`\`\`javascript\ndocument.addEventListener("keydown", (e) => {\n  console.log(e.key);     // "Enter", "a", "ArrowUp"...\n  console.log(e.ctrlKey); // true if Ctrl held\n  e.preventDefault();     // stop default browser action\n});\n\`\`\`\n\n## Event Delegation\n\`\`\`javascript\n// Instead of adding listeners to each item, listen on the parent\ndocument.querySelector("#list").addEventListener("click", (e) => {\n  if (e.target.matches("li")) {\n    console.log("Clicked item:", e.target.textContent);\n  }\n});\n\`\`\`` }],
          },
          {
            title: 'Async JS: Promises & Async/Await',
            description: 'Handle asynchronous operations cleanly with Promises and async/await.',
            estimated_duration_minutes: 30,
            is_published: true,
            content_blocks: [{ type: 'text', text: `# Async JS: Promises & Async/Await\n\n## Why Async?\nJavaScript is single-threaded. Async patterns let I/O operations (API calls, file reads) run without blocking the main thread.\n\n## Promises\n\`\`\`javascript\nconst fetchUser = (id) =>\n  new Promise((resolve, reject) => {\n    setTimeout(() => {\n      if (id > 0) resolve({ id, name: "Alex" });\n      else reject(new Error("Invalid ID"));\n    }, 500);\n  });\n\nfetchUser(1)\n  .then(user => console.log(user))\n  .catch(err => console.error(err));\n\`\`\`\n\n## Async/Await (ES2017)\n\`\`\`javascript\nasync function loadUser(id) {\n  try {\n    const user = await fetchUser(id);\n    console.log(user);\n  } catch (err) {\n    console.error("Failed:", err.message);\n  }\n}\nloadUser(1);\n\`\`\`\n\n## Parallel Requests with Promise.all\n\`\`\`javascript\nconst [user, posts] = await Promise.all([\n  fetchUser(1),\n  fetchPosts(1)\n]);\n\`\`\`` }],
          },
        ],
        quiz: {
          title: 'DOM & Async JavaScript Quiz',
          description: 'Test your knowledge of DOM manipulation and async patterns.',
          instructions: 'Answer all 5 questions. Passing score is 70%.',
          passing_score: 70,
          time_limit_minutes: 10,
          max_attempts: 3,
          max_attempts_quiz: 3,
          is_published: true,
          questions: [
            makeQMC(
              'Which method selects the first element matching a CSS selector?',
              [opt('a','getElementById'), opt('b','querySelector'), opt('c','querySelectorAll'), opt('d','getElementsByClassName')],
              'b', 'querySelector returns the first element that matches the given CSS selector.'
            ),
            makeQTF('addEventListener can attach multiple handlers for the same event type.', true, 'You can call addEventListener multiple times with different functions for the same event type.'),
            makeQMC(
              'What does async/await syntactic sugar wrap around?',
              [opt('a','Callbacks'), opt('b','XMLHttpRequest'), opt('c','Promises'), opt('d','setTimeout')],
              'c', 'async/await is syntactic sugar over Promises, making async code read like synchronous code.'
            ),
            makeQMC(
              'Which Promise method runs multiple promises in parallel and waits for all to resolve?',
              [opt('a','Promise.race'), opt('b','Promise.any'), opt('c','Promise.all'), opt('d','Promise.allSettled')],
              'c', 'Promise.all takes an array of promises and resolves when ALL of them resolve, or rejects if any reject.'
            ),
            makeQTF('event.preventDefault() stops the event from propagating to parent elements.', false, 'preventDefault() stops the default browser action (like form submission). stopPropagation() stops the event from bubbling to parent elements.'),
          ],
        },
      },
    ],
  },
  {
    title: 'Advanced React & TypeScript Patterns',
    subtitle: 'Master modern React 19 with full TypeScript integration',
    short_description: 'Deep-dive into React hooks, state management, performance optimization, TypeScript generics, and enterprise patterns.',
    long_description: `This advanced course is for developers already comfortable with React basics who want to master production-grade patterns. You will explore React 19's new features, advanced hook patterns, typed context, performance optimization with useMemo and useCallback, TypeScript generics applied to React, and scalable architecture patterns used in real production codebases.`,
    level: 'Advanced',
    duration_hours: 16,
    price: 79.99,
    language: 'English',
    visibility: 'public',
    verification_status: 'approved',
    modules: [
      {
        title: 'React 19 Architecture',
        description: 'Deep dive into hooks, state patterns, and performance in React 19.',
        position: 1,
        is_published: true,
        lessons: [
          {
            title: 'React Hooks Deep Dive',
            description: 'useEffect, useCallback, useMemo, useRef and custom hook patterns.',
            estimated_duration_minutes: 30,
            is_published: true,
            content_blocks: [{ type: 'text', text: `# React Hooks Deep Dive\n\n## useEffect\n\`\`\`tsx\nuseEffect(() => {\n  const subscription = props.source.subscribe();\n  return () => subscription.unsubscribe(); // cleanup\n}, [props.source]); // dependency array\n\`\`\`\n\n## useCallback & useMemo\n\`\`\`tsx\nconst handleClick = useCallback(() => {\n  doSomething(a, b);\n}, [a, b]); // only re-creates if a or b changes\n\nconst expensiveValue = useMemo(\n  () => computeExpensiveValue(a, b),\n  [a, b]\n);\n\`\`\`\n\n## useRef — mutable ref without re-render\n\`\`\`tsx\nconst timerRef = useRef<number | null>(null);\n\nuseEffect(() => {\n  timerRef.current = window.setInterval(() => tick(), 1000);\n  return () => clearInterval(timerRef.current!);\n}, []);\n\`\`\`\n\n## Custom Hooks\n\`\`\`tsx\nfunction useWindowSize() {\n  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });\n  useEffect(() => {\n    const handler = () => setSize({ w: window.innerWidth, h: window.innerHeight });\n    window.addEventListener("resize", handler);\n    return () => window.removeEventListener("resize", handler);\n  }, []);\n  return size;\n}\n\`\`\`` }],
          },
          {
            title: 'State Management Patterns',
            description: 'Context API, useReducer, Zustand, and when to use each.',
            estimated_duration_minutes: 35,
            is_published: true,
            content_blocks: [{ type: 'text', text: `# State Management Patterns\n\n## Context + useReducer (built-in)\n\`\`\`tsx\ntype Action = { type: "increment" } | { type: "reset" };\n\nfunction reducer(state: number, action: Action): number {\n  switch (action.type) {\n    case "increment": return state + 1;\n    case "reset": return 0;\n    default: return state;\n  }\n}\n\nconst CountCtx = createContext<{ state: number; dispatch: Dispatch<Action> } | null>(null);\n\`\`\`\n\n## When to use what?\n| Pattern | Use case |\n|---------|----------|\n| useState | Local component state |\n| useReducer | Complex local state with many transitions |\n| Context | Shared state across component tree |\n| Zustand | Global state, avoids prop-drilling, simpler than Redux |\n| React Query | Server state, caching, background refetching |\n\n## Zustand example\n\`\`\`tsx\nimport { create } from 'zustand';\ninterface Store { count: number; inc: () => void; }\nconst useStore = create<Store>((set) => ({\n  count: 0,\n  inc: () => set((s) => ({ count: s.count + 1 })),\n}));\n\`\`\`` }],
          },
          {
            title: 'Performance Optimization',
            description: 'React.memo, lazy loading, Suspense and the React Profiler.',
            estimated_duration_minutes: 30,
            is_published: true,
            content_blocks: [{ type: 'text', text: `# Performance Optimization\n\n## React.memo — skip re-renders\n\`\`\`tsx\nconst MemoCard = React.memo(function Card({ title }: { title: string }) {\n  return <h2>{title}</h2>;\n});\n// Only re-renders when title prop changes\n\`\`\`\n\n## Code Splitting with lazy + Suspense\n\`\`\`tsx\nconst Dashboard = lazy(() => import('./Dashboard'));\n\nfunction App() {\n  return (\n    <Suspense fallback={<Spinner />}>\n      <Dashboard />\n    </Suspense>\n  );\n}\n\`\`\`\n\n## React Profiler\nOpen DevTools → Profiler tab → Record a session. Look for:\n- Components that render too often\n- Renders that take > 16ms (60fps threshold)\n- Unnecessary renders caused by context changes\n\n## Key optimization checklist\n1. Memoize expensive calculations with useMemo\n2. Stable callback references with useCallback\n3. Avoid creating objects/arrays inline in JSX\n4. Virtualize long lists (react-window)\n5. Split large bundles with lazy()` }],
          },
        ],
        quiz: {
          title: 'React Architecture Quiz',
          description: 'Test your understanding of React hooks and state management.',
          instructions: 'Answer all 5 questions. Passing score is 70%.',
          passing_score: 70,
          time_limit_minutes: 12,
          max_attempts: 3,
          max_attempts_quiz: 3,
          is_published: true,
          questions: [
            makeQMC(
              'Which hook runs a side effect after every render by default?',
              [opt('a','useCallback'), opt('b','useMemo'), opt('c','useEffect'), opt('d','useRef')],
              'c', 'useEffect with no dependency array runs after every render. Provide a dependency array to control when it runs.'
            ),
            makeQTF('React.memo prevents a component from EVER re-rendering.', false, 'React.memo does a shallow comparison of props. If props change, the component still re-renders.'),
            makeQMC(
              'What is the primary purpose of useCallback?',
              [opt('a','Cache a computed value'), opt('b','Return a stable function reference'), opt('c','Subscribe to context'), opt('d','Access DOM elements')],
              'b', 'useCallback returns a memoized callback function that only changes if one of its dependencies changes, preventing unnecessary child re-renders.'
            ),
            makeQMC(
              'Which pattern best describes React.lazy() + Suspense?',
              [opt('a','State management'), opt('b','Error handling'), opt('c','Code splitting'), opt('d','Context provision')],
              'c', 'React.lazy enables code splitting by loading components only when needed, reducing initial bundle size.'
            ),
            makeQTF('useReducer is more suitable than useState for complex state with many sub-values.', true, 'useReducer is the recommended alternative to useState when state logic is complex and involves multiple sub-values or transitions.'),
          ],
        },
      },
      {
        title: 'TypeScript Integration',
        description: 'Generics, utility types, typed hooks, and advanced TS patterns for React.',
        position: 2,
        is_published: true,
        lessons: [
          {
            title: 'TypeScript Generics & Utility Types',
            description: 'Writing reusable, type-safe code with generics and built-in utility types.',
            estimated_duration_minutes: 35,
            is_published: true,
            content_blocks: [{ type: 'text', text: `# TypeScript Generics & Utility Types\n\n## Generics\n\`\`\`typescript\nfunction identity<T>(value: T): T {\n  return value;\n}\nidentity<string>("hello"); // type: string\nidentity(42);              // inferred: number\n\n// Generic interface\ninterface ApiResponse<T> {\n  data: T;\n  error: string | null;\n  loading: boolean;\n}\n\`\`\`\n\n## Key Utility Types\n\`\`\`typescript\ninterface User { id: number; name: string; email: string; }\n\ntype PartialUser  = Partial<User>;    // all optional\ntype RequiredUser = Required<User>;   // all required\ntype UserPreview  = Pick<User, 'id' | 'name'>;\ntype NoEmail      = Omit<User, 'email'>;\ntype ReadUser     = Readonly<User>;   // immutable\n\n// Record\ntype RoleMap = Record<'admin' | 'coach' | 'student', Permission[]>;\n\n// ReturnType\nfunction getUser() { return { id: 1, name: "Alex" }; }\ntype UserType = ReturnType<typeof getUser>; // { id: number; name: string; }\n\`\`\`` }],
          },
          {
            title: 'Typed Hooks & Context',
            description: 'Typing useState, useReducer, useContext, and custom hooks correctly.',
            estimated_duration_minutes: 30,
            is_published: true,
            content_blocks: [{ type: 'text', text: `# Typed Hooks & Context\n\n## Typed useState\n\`\`\`tsx\ninterface User { id: string; name: string; }\nconst [user, setUser] = useState<User | null>(null);\n\`\`\`\n\n## Typed useReducer\n\`\`\`tsx\ntype State = { count: number; error: string | null };\ntype Action =\n  | { type: 'increment' }\n  | { type: 'setError'; payload: string };\n\nconst [state, dispatch] = useReducer(\n  (state: State, action: Action): State => {\n    switch (action.type) {\n      case 'increment': return { ...state, count: state.count + 1 };\n      case 'setError':  return { ...state, error: action.payload };\n    }\n  },\n  { count: 0, error: null }\n);\n\`\`\`\n\n## Typed Context\n\`\`\`tsx\ninterface ThemeCtx { theme: "dark" | "light"; toggle: () => void; }\nconst ThemeContext = createContext<ThemeCtx | null>(null);\n\nexport function useTheme() {\n  const ctx = useContext(ThemeContext);\n  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");\n  return ctx;\n}\n\`\`\`` }],
          },
          {
            title: 'Advanced Type Patterns',
            description: 'Discriminated unions, template literals, conditional types, and infer.',
            estimated_duration_minutes: 40,
            is_published: true,
            content_blocks: [{ type: 'text', text: `# Advanced Type Patterns\n\n## Discriminated Unions\n\`\`\`typescript\ntype Shape =\n  | { kind: "circle";    radius: number }\n  | { kind: "square";    side: number }\n  | { kind: "rectangle"; width: number; height: number };\n\nfunction area(shape: Shape): number {\n  switch (shape.kind) {\n    case "circle":    return Math.PI * shape.radius ** 2;\n    case "square":    return shape.side ** 2;\n    case "rectangle": return shape.width * shape.height;\n  }\n}\n\`\`\`\n\n## Template Literal Types\n\`\`\`typescript\ntype Direction = "top" | "right" | "bottom" | "left";\ntype Padding = \`padding-\${Direction}\`;\n// "padding-top" | "padding-right" | "padding-bottom" | "padding-left"\n\`\`\`\n\n## Conditional Types + infer\n\`\`\`typescript\ntype Unwrap<T> = T extends Promise<infer U> ? U : T;\ntype A = Unwrap<Promise<string>>; // string\ntype B = Unwrap<number>;          // number\n\`\`\`` }],
          },
        ],
        quiz: {
          title: 'TypeScript Mastery Quiz',
          description: 'Test your TypeScript generics and utility type knowledge.',
          instructions: 'Answer all 5 questions. Passing score is 70%.',
          passing_score: 70,
          time_limit_minutes: 12,
          max_attempts: 3,
          max_attempts_quiz: 3,
          is_published: true,
          questions: [
            makeQMC(
              'Which utility type makes all properties of an interface optional?',
              [opt('a','Required<T>'), opt('b','Partial<T>'), opt('c','Readonly<T>'), opt('d','Pick<T>') ],
              'b', 'Partial<T> constructs a type with all properties of T set to optional (?).'
            ),
            makeQTF('TypeScript generics are erased at runtime — they only exist at compile time.', true, 'TypeScript compiles to JavaScript. Generic type parameters are erased during compilation and have no runtime presence.'),
            makeQMC(
              'What does Omit<User, "password"> produce?',
              [opt('a','A type with only the password field'), opt('b','A type with all User fields except password'), opt('c','An error — Omit takes 3 arguments'), opt('d','Same as Partial<User>')],
              'b', 'Omit<T, K> constructs a type with all properties of T except those in K.'
            ),
            makeQMC(
              'In a discriminated union, which property acts as the discriminant?',
              [opt('a','Any required property'), opt('b','A literal type property shared by all variants'), opt('c','An optional property'), opt('d','A generic type parameter')],
              'b', 'A discriminant is a literal type property (like `kind: "circle"`) that TypeScript uses to narrow the type in switch/if.'
            ),
            makeQTF('createContext<T | null>(null) is a safe pattern when context may not have a provider.', true, 'Using null as the initial value and T | null as the type is a common safe pattern. Throw an error in the consumer hook if context is null.'),
          ],
        },
      },
    ],
  },
  {
    title: 'Data Science with Python',
    subtitle: 'From data wrangling to machine learning — a practical guide',
    short_description: 'Master NumPy, Pandas, Matplotlib, Scikit-Learn, and the full data science workflow through hands-on Jupyter notebook projects.',
    long_description: `This intermediate course covers the complete data science lifecycle: data acquisition, cleaning, exploratory analysis, visualization, and machine learning. You will use industry-standard Python libraries — NumPy, Pandas, Matplotlib, Seaborn, and Scikit-Learn — and work on real datasets. By the end you will be able to build, evaluate, and tune predictive models.`,
    level: 'Intermediate',
    duration_hours: 14,
    price: 59.99,
    language: 'English',
    visibility: 'public',
    verification_status: 'approved',
    modules: [
      {
        title: 'Python for Data Analysis',
        description: 'NumPy, Pandas, and the art of data cleaning.',
        position: 1,
        is_published: true,
        lessons: [
          {
            title: 'NumPy & Pandas Essentials',
            description: 'Arrays, DataFrames, Series, and vectorized operations.',
            estimated_duration_minutes: 40,
            is_published: true,
            content_blocks: [{ type: 'text', text: `# NumPy & Pandas Essentials\n\n## NumPy Arrays\n\`\`\`python\nimport numpy as np\narr = np.array([1, 2, 3, 4, 5])\narr * 2          # [2, 4, 6, 8, 10] — vectorized\narr[arr > 3]     # [4, 5] — boolean indexing\narr.mean()       # 3.0\nnp.zeros((3,4))  # 3×4 matrix of zeros\n\`\`\`\n\n## Pandas DataFrames\n\`\`\`python\nimport pandas as pd\n\ndf = pd.read_csv("data.csv")\ndf.head()        # first 5 rows\ndf.info()        # column types & null counts\ndf.describe()    # statistical summary\n\n# Select columns\ndf["name"]           # Series\ndf[["name","age"]]   # DataFrame\n\n# Filter rows\ndf[df["age"] > 25]\n\n# Add column\ndf["age_group"] = df["age"].apply(lambda x: "senior" if x > 60 else "adult")\n\`\`\`\n\n## Groupby & Aggregation\n\`\`\`python\ndf.groupby("category")["sales"].sum()\ndf.groupby("city").agg({"sales": "sum", "orders": "count"})\n\`\`\`` }],
          },
          {
            title: 'Data Cleaning & Wrangling',
            description: 'Handling missing data, duplicates, type conversion, and reshaping.',
            estimated_duration_minutes: 45,
            is_published: true,
            content_blocks: [{ type: 'text', text: `# Data Cleaning & Wrangling\n\n## Handling Missing Values\n\`\`\`python\n# Detect\ndf.isnull().sum()         # count NaNs per column\ndf.isnull().mean() * 100  # % missing\n\n# Remove rows with NaN\ndf.dropna()\ndf.dropna(subset=["age","salary"])  # specific columns\n\n# Fill NaN\ndf["age"].fillna(df["age"].median())   # fill with median\ndf["city"].fillna("Unknown")           # fill with constant\ndf.ffill()                             # forward fill\n\`\`\`\n\n## Duplicates\n\`\`\`python\ndf.duplicated().sum()         # count duplicates\ndf.drop_duplicates()          # remove all\ndf.drop_duplicates(["email"]) # based on email column\n\`\`\`\n\n## Type Conversion\n\`\`\`python\ndf["date"] = pd.to_datetime(df["date"])\ndf["price"] = pd.to_numeric(df["price"], errors="coerce")\ndf["category"] = df["category"].astype("category")\n\`\`\`\n\n## Reshape: melt & pivot\n\`\`\`python\n# Wide → Long\ndf_long = df.melt(id_vars=["id"], value_vars=["q1","q2","q3"])\n\n# Long → Wide\ndf_wide = df_long.pivot(index="id", columns="variable", values="value")\n\`\`\`` }],
          },
          {
            title: 'Exploratory Data Analysis',
            description: 'Visualizing distributions, correlations, and patterns in data.',
            estimated_duration_minutes: 50,
            is_published: true,
            content_blocks: [{ type: 'text', text: `# Exploratory Data Analysis (EDA)\n\n## Descriptive Statistics\n\`\`\`python\nprint(df.describe())          # count, mean, std, min, quartiles, max\nprint(df["age"].value_counts()) # frequency table\nprint(df.corr())              # correlation matrix\n\`\`\`\n\n## Matplotlib Basics\n\`\`\`python\nimport matplotlib.pyplot as plt\n\n# Histogram\nplt.hist(df["age"], bins=20, color="steelblue", edgecolor="white")\nplt.title("Age Distribution")\nplt.xlabel("Age"); plt.ylabel("Count")\nplt.show()\n\n# Scatter plot\nplt.scatter(df["study_hours"], df["exam_score"], alpha=0.6)\nplt.title("Study Hours vs Exam Score")\nplt.show()\n\`\`\`\n\n## Seaborn for Statistical Plots\n\`\`\`python\nimport seaborn as sns\n\nsns.heatmap(df.corr(), annot=True, cmap="coolwarm") # correlation heatmap\nsns.boxplot(x="category", y="sales", data=df)       # compare distributions\nsns.pairplot(df[["age","salary","score"]])           # pairwise relationships\n\`\`\`` }],
          },
        ],
        quiz: {
          title: 'Data Analysis Fundamentals Quiz',
          description: 'Test your NumPy, Pandas, and EDA knowledge.',
          instructions: 'Answer all 5 questions. Passing score is 70%.',
          passing_score: 70,
          time_limit_minutes: 10,
          max_attempts: 3,
          max_attempts_quiz: 3,
          is_published: true,
          questions: [
            makeQMC(
              'Which Pandas method shows the first 5 rows of a DataFrame?',
              [opt('a','df.top()'), opt('b','df.first()'), opt('c','df.head()'), opt('d','df.peek()')],
              'c', 'df.head() returns the first n rows (default 5). df.tail() returns the last n rows.'
            ),
            makeQTF('NumPy operations are vectorized, meaning they apply to entire arrays without Python loops.', true, 'NumPy operations are implemented in C and applied element-wise across whole arrays, making them much faster than Python loops.'),
            makeQMC(
              'Which method fills missing values with the column median?',
              [opt('a','df.dropna()'), opt('b','df.fillna(df.mean())'), opt('c','df.fillna(df.median())'), opt('d','df.impute()')],
              'c', 'df["col"].fillna(df["col"].median()) fills NaN values with the column median — a robust strategy that is not affected by outliers.'
            ),
            makeQMC(
              'What does df.corr() return?',
              [opt('a','A list of unique values'), opt('b','A correlation matrix of numeric columns'), opt('c','Missing value counts'), opt('d','Column data types')],
              'b', 'df.corr() returns a DataFrame showing the pairwise correlation of all numeric columns.'
            ),
            makeQTF('df.drop_duplicates() removes all duplicate rows from a DataFrame.', true, 'drop_duplicates() removes rows where all column values are identical. You can specify subset= to check only certain columns.'),
          ],
        },
      },
      {
        title: 'Machine Learning Basics',
        description: 'Build, evaluate, and tune ML models with Scikit-Learn.',
        position: 2,
        is_published: true,
        lessons: [
          {
            title: 'Intro to Scikit-Learn',
            description: 'The fit/predict/score API, pipelines, and preprocessing.',
            estimated_duration_minutes: 40,
            is_published: true,
            content_blocks: [{ type: 'text', text: `# Intro to Scikit-Learn\n\n## The Scikit-Learn API\nAll estimators follow the same interface:\n\`\`\`python\nfrom sklearn.linear_model import LogisticRegression\n\nmodel = LogisticRegression()   # 1. Instantiate\nmodel.fit(X_train, y_train)    # 2. Train\nmodel.predict(X_test)          # 3. Predict\nmodel.score(X_test, y_test)    # 4. Evaluate (returns accuracy)\n\`\`\`\n\n## Train / Test Split\n\`\`\`python\nfrom sklearn.model_selection import train_test_split\n\nX_train, X_test, y_train, y_test = train_test_split(\n    X, y, test_size=0.2, random_state=42\n)\n\`\`\`\n\n## Preprocessing Pipelines\n\`\`\`python\nfrom sklearn.pipeline import Pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.impute import SimpleImputer\n\npipe = Pipeline([\n    ("impute",  SimpleImputer(strategy="median")),\n    ("scale",   StandardScaler()),\n    ("model",   LogisticRegression()),\n])\npipe.fit(X_train, y_train)\npipe.score(X_test, y_test)\n\`\`\`` }],
          },
          {
            title: 'Classification & Regression',
            description: 'Decision trees, random forests, linear and logistic regression.',
            estimated_duration_minutes: 50,
            is_published: true,
            content_blocks: [{ type: 'text', text: `# Classification & Regression\n\n## Key Algorithm Families\n| Algorithm | Task | Notes |\n|-----------|------|-------|\n| Linear Regression | Regression | Fast, interpretable |\n| Logistic Regression | Classification | Outputs probability |\n| Decision Tree | Both | Overfits without tuning |\n| Random Forest | Both | Robust, handles missing data |\n| SVM | Both | Powerful for high-dimensional data |\n\n## Classification Example\n\`\`\`python\nfrom sklearn.ensemble import RandomForestClassifier\nfrom sklearn.metrics import classification_report\n\nclf = RandomForestClassifier(n_estimators=100, random_state=42)\nclf.fit(X_train, y_train)\ny_pred = clf.predict(X_test)\nprint(classification_report(y_test, y_pred))\n\`\`\`\n\n## Regression Example\n\`\`\`python\nfrom sklearn.linear_model import LinearRegression\nfrom sklearn.metrics import mean_squared_error, r2_score\n\nreg = LinearRegression()\nreg.fit(X_train, y_train)\ny_pred = reg.predict(X_test)\nprint(f"R²: {r2_score(y_test, y_pred):.3f}")\nprint(f"RMSE: {mean_squared_error(y_test, y_pred, squared=False):.3f}")\n\`\`\`` }],
          },
          {
            title: 'Model Evaluation & Tuning',
            description: 'Cross-validation, GridSearchCV, confusion matrices, and bias-variance trade-off.',
            estimated_duration_minutes: 45,
            is_published: true,
            content_blocks: [{ type: 'text', text: `# Model Evaluation & Tuning\n\n## Cross-Validation\n\`\`\`python\nfrom sklearn.model_selection import cross_val_score\n\nscores = cross_val_score(model, X, y, cv=5, scoring="accuracy")\nprint(f"CV Accuracy: {scores.mean():.3f} ± {scores.std():.3f}")\n\`\`\`\n\n## Confusion Matrix\n\`\`\`python\nfrom sklearn.metrics import ConfusionMatrixDisplay\nConfusionMatrixDisplay.from_predictions(y_test, y_pred)\n\`\`\`\n\n## Hyperparameter Tuning with GridSearchCV\n\`\`\`python\nfrom sklearn.model_selection import GridSearchCV\n\nparam_grid = {\n    "n_estimators": [50, 100, 200],\n    "max_depth": [None, 10, 20],\n    "min_samples_split": [2, 5],\n}\ngrid = GridSearchCV(RandomForestClassifier(), param_grid, cv=5, n_jobs=-1)\ngrid.fit(X_train, y_train)\nprint("Best params:", grid.best_params_)\nprint("Best score:", grid.best_score_)\n\`\`\`\n\n## Bias-Variance Trade-off\n- **High bias (underfitting)**: model too simple, high training error\n- **High variance (overfitting)**: model too complex, low training error but high test error\n- **Goal**: Find the sweet spot via regularization, pruning, or ensemble methods` }],
          },
        ],
        quiz: {
          title: 'Machine Learning Fundamentals Quiz',
          description: 'Test your understanding of ML concepts, algorithms, and evaluation.',
          instructions: 'Answer all 5 questions. Passing score is 70%.',
          passing_score: 70,
          time_limit_minutes: 12,
          max_attempts: 3,
          max_attempts_quiz: 3,
          is_published: true,
          questions: [
            makeQMC(
              'What is the purpose of train_test_split?',
              [opt('a','To augment training data'), opt('b','To separate data for training and unbiased evaluation'), opt('c','To normalize features'), opt('d','To remove outliers')],
              'b', 'train_test_split divides data into a training set (for learning) and a test set (for unbiased evaluation).'
            ),
            makeQTF('Cross-validation with k=5 trains the model 5 times on different data splits.', true, '5-fold cross-validation splits data into 5 folds, trains on 4 and tests on 1 each time, giving 5 scores to average.'),
            makeQMC(
              'Which metric indicates the proportion of variance explained by a regression model?',
              [opt('a','RMSE'), opt('b','MAE'), opt('c','R² (R-squared)'), opt('d','Precision')],
              'c', 'R² ranges from 0 to 1. An R² of 0.85 means the model explains 85% of the variance in the target variable.'
            ),
            makeQMC(
              'A model achieves 99% training accuracy but 60% test accuracy. This indicates:',
              [opt('a','Underfitting'), opt('b','Overfitting'), opt('c','Perfect calibration'), opt('d','Data leakage only')],
              'b', 'High training accuracy with low test accuracy is the classic sign of overfitting (high variance) — the model memorized the training data.'
            ),
            makeQTF('GridSearchCV automatically uses cross-validation to select hyperparameters.', true, 'GridSearchCV exhaustively tests all parameter combinations and uses cross-validation to score each, selecting the best parameters.'),
          ],
        },
      },
    ],
  },
];

const INTERESTS = [
  'Web Development', 'Data Science', 'Machine Learning', 'Mobile Development',
  'Cloud Computing', 'DevOps', 'Cybersecurity', 'UI/UX Design', 'Blockchain', 'Game Development',
];

const GOALS = [
  'Get a new job in tech', 'Advance in my current career', 'Start a business',
  'Build a side project', 'Learn for personal growth', 'Earn a certification',
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SEED
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('\n🌱  NexSkill LMS — Deep Demo Data Seed\n');

  // ── STEP 1: Categories ──────────────────────────────────────────────────────
  sect('1. Categories');
  const catIdMap = {};
  for (const cat of CATEGORIES) {
    const { data, error } = await supabase
      .from('categories')
      .upsert(cat, { onConflict: 'slug' })
      .select('id, name, slug')
      .single();
    if (error) { fail(`category "${cat.name}"`, error); }
    else { catIdMap[cat.name] = data.id; log(`Category: ${cat.name} (id=${data.id})`); ok++; }
  }

  // ── STEP 2: Sign in as Coach ────────────────────────────────────────────────
  sect('2. Coach sign-in & profile');
  let coachUser;
  try {
    coachUser = await signIn('jordan.doe@nexskill.demo', 'demo1234');
    log(`Signed in as coach: ${coachUser.email} (id=${coachUser.id})`);
  } catch (e) {
    fail('Coach sign-in', e);
    process.exit(1);
  }

  // Ensure profiles row has correct role
  await upsert('profiles', {
    id: coachUser.id,
    email: 'jordan.doe@nexskill.demo',
    first_name: 'Jordan',
    last_name: 'Doe',
    username: 'jordan_doe',
    role: 'coach',
  }, 'id');
  log('profiles row for coach');

  // coach_profiles upsert
  await upsert('coach_profiles', {
    id: coachUser.id,
    job_title: 'Senior Software Engineer & Educator',
    bio: 'I have 10+ years building web apps at startups and enterprises. I am passionate about making complex technical topics accessible through clear explanations and practical examples. My students have gone on to work at companies like Google, Stripe, and early-stage startups.',
    experience_level: 'Expert',
    content_areas: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Data Science'],
    tools: ['VS Code', 'Git', 'Jupyter Notebook', 'Figma', 'Docker'],
    verification_status: 'verified',
  }, 'id');
  log('coach_profiles row');

  // ── STEP 3: Courses, Modules, Lessons, Quizzes ─────────────────────────────
  sect('3. Courses, modules, lessons, quizzes');

  // Check existing courses for this coach
  const { data: existingCourses } = await supabase
    .from('courses')
    .select('id, title')
    .eq('coach_id', coachUser.id);

  const existingTitles = new Set((existingCourses || []).map(c => c.title));

  // Store created/found course & lesson IDs for later use
  const courseIds = [];   // [{id, title, modules:[{id, lessonIds:[], quizId}]}]

  for (const courseDef of COURSES_DEF) {
    let courseId;
    if (existingTitles.has(courseDef.title)) {
      const existing = existingCourses.find(c => c.title === courseDef.title);
      courseId = existing.id;
      skp(`Course "${courseDef.title}" already exists (id=${courseId})`); skip++;
    } else {
      const catId = catIdMap[courseDef.title.includes('Data Science') ? 'Data Science' : 'Programming'];
      const { data: course, error: cErr } = await supabase
        .from('courses')
        .insert({
          title: courseDef.title,
          subtitle: courseDef.subtitle,
          short_description: courseDef.short_description,
          long_description: courseDef.long_description,
          level: courseDef.level,
          duration_hours: courseDef.duration_hours,
          price: courseDef.price,
          language: courseDef.language,
          visibility: courseDef.visibility,
          verification_status: courseDef.verification_status,
          coach_id: coachUser.id,
          category_id: catId,
        })
        .select('id')
        .single();
      if (cErr) { fail(`Insert course "${courseDef.title}"`, cErr); continue; }
      courseId = course.id;
      log(`Course "${courseDef.title}" (id=${courseId})`); ok++;
    }

    const courseEntry = { id: courseId, title: courseDef.title, modules: [] };
    courseIds.push(courseEntry);

    // Check existing modules for this course
    const { data: existingModules } = await supabase
      .from('modules')
      .select('id, title, position')
      .eq('course_id', courseId)
      .order('position');

    for (const modDef of courseDef.modules) {
      let moduleId;
      const existingMod = (existingModules || []).find(m => m.position === modDef.position);
      if (existingMod) {
        moduleId = existingMod.id;
        skp(`  Module "${modDef.title}" already exists`); skip++;
      } else {
        const { data: mod, error: mErr } = await supabase
          .from('modules')
          .insert({
            course_id: courseId,
            title: modDef.title,
            description: modDef.description,
            position: modDef.position,
            is_published: modDef.is_published,
            owner_id: coachUser.id,
          })
          .select('id')
          .single();
        if (mErr) { fail(`Insert module "${modDef.title}"`, mErr); continue; }
        moduleId = mod.id;
        log(`  Module "${modDef.title}" (id=${moduleId})`); ok++;
      }

      const moduleEntry = { id: moduleId, lessonIds: [], quizId: null };
      courseEntry.modules.push(moduleEntry);

      // Check existing content items for this module
      const { data: existingItems } = await supabase
        .from('module_content_items')
        .select('id, content_type, content_id, position')
        .eq('module_id', moduleId)
        .order('position');

      const hasLessons = (existingItems || []).some(i => i.content_type === 'lesson');
      const hasQuiz    = (existingItems || []).some(i => i.content_type === 'quiz');

      // Lessons
      if (hasLessons) {
        const lessonItems = (existingItems || []).filter(i => i.content_type === 'lesson');
        moduleEntry.lessonIds = lessonItems.map(i => i.content_id);
        skp(`    Lessons already exist in this module (${lessonItems.length})`); skip++;
      } else {
        for (let li = 0; li < modDef.lessons.length; li++) {
          const lessDef = modDef.lessons[li];
          const { data: les, error: lErr } = await supabase
            .from('lessons')
            .insert({
              title: lessDef.title,
              description: lessDef.description,
              content_blocks: lessDef.content_blocks,
              estimated_duration_minutes: lessDef.estimated_duration_minutes,
              is_published: lessDef.is_published,
            })
            .select('id')
            .single();
          if (lErr) { fail(`Insert lesson "${lessDef.title}"`, lErr); continue; }
          moduleEntry.lessonIds.push(les.id);
          log(`    Lesson "${lessDef.title}" (id=${les.id})`); ok++;

          // Link lesson → module
          const { error: ciErr } = await supabase
            .from('module_content_items')
            .insert({
              module_id: moduleId,
              content_type: 'lesson',
              content_id: les.id,
              position: li + 1,
              is_published: true,
            });
          if (ciErr) fail(`Link lesson to module`, ciErr);
          else { log(`    Linked lesson[${li+1}] to module`); ok++; }
        }
      }

      // Quiz
      if (hasQuiz) {
        const quizItem = (existingItems || []).find(i => i.content_type === 'quiz');
        moduleEntry.quizId = quizItem?.content_id ?? null;
        skp(`    Quiz already exists in this module`); skip++;
      } else {
        const quizDef = modDef.quiz;
        const { data: quiz, error: qErr } = await supabase
          .from('quizzes')
          .insert({
            title: quizDef.title,
            description: quizDef.description,
            instructions: quizDef.instructions,
            passing_score: quizDef.passing_score,
            time_limit_minutes: quizDef.time_limit_minutes,
            max_attempts: quizDef.max_attempts,
            max_attempts_quiz: quizDef.max_attempts_quiz,
            is_published: quizDef.is_published,
          })
          .select('id')
          .single();
        if (qErr) { fail(`Insert quiz "${quizDef.title}"`, qErr); continue; }
        moduleEntry.quizId = quiz.id;
        log(`    Quiz "${quizDef.title}" (id=${quiz.id})`); ok++;

        // Quiz questions
        for (let qi = 0; qi < quizDef.questions.length; qi++) {
          const qDef = quizDef.questions[qi];
          const { error: qqErr } = await supabase
            .from('quiz_questions')
            .insert({
              quiz_id: quiz.id,
              position: qi + 1,
              question_type: qDef.question_type,
              points: qDef.points,
              requires_manual_grading: qDef.requires_manual_grading,
              question_content: qDef.question_content,
              answer_config: qDef.answer_config,
            });
          if (qqErr) fail(`Insert question ${qi+1} for "${quizDef.title}"`, qqErr);
          else { log(`    Question[${qi+1}]: ${qDef.question_content[0].text.slice(0,50)}…`); ok++; }
        }

        // Link quiz → module (after all lessons, so position = lessons.length + 1)
        const { error: qciErr } = await supabase
          .from('module_content_items')
          .insert({
            module_id: moduleId,
            content_type: 'quiz',
            content_id: quiz.id,
            position: modDef.lessons.length + 1,
            is_published: true,
          });
        if (qciErr) fail(`Link quiz to module`, qciErr);
        else { log(`    Linked quiz to module at position ${modDef.lessons.length + 1}`); ok++; }
      }
    }
  }

  // ── STEP 4: Live Sessions ───────────────────────────────────────────────────
  sect('4. Live sessions');

  // Only create sessions for courses that have IDs
  const sessionDefs = courseIds.flatMap((c, idx) => [
    {
      course_id: c.id,
      coach_id: coachUser.id,
      title: `${c.title} — Live Q&A Session #1`,
      description: 'Open Q&A covering Module 1 topics. Bring your questions!',
      scheduled_at: daysFromNow(5 + idx * 3),
      duration_minutes: 60,
      meeting_link: 'https://meet.google.com/nexskill-demo-1',
      status: 'scheduled',
    },
    {
      course_id: c.id,
      coach_id: coachUser.id,
      title: `${c.title} — Live Coding Workshop`,
      description: 'Hands-on live coding session. We will build a mini project together.',
      scheduled_at: daysFromNow(14 + idx * 3),
      duration_minutes: 90,
      meeting_link: 'https://meet.google.com/nexskill-demo-2',
      status: 'scheduled',
    },
  ]);

  const { data: existingSessions } = await supabase
    .from('live_sessions')
    .select('id, title')
    .eq('coach_id', coachUser.id);

  const existingSessionTitles = new Set((existingSessions || []).map(s => s.title));

  for (const s of sessionDefs) {
    if (existingSessionTitles.has(s.title)) {
      skp(`Session "${s.title}"`); skip++;
    } else {
      const { error } = await supabase.from('live_sessions').insert(s);
      if (error) fail(`Live session "${s.title}"`, error);
      else { log(`Session "${s.title}" (${s.scheduled_at.slice(0,10)})`); ok++; }
    }
  }

  // ── STEP 5: Sign in as Student ──────────────────────────────────────────────
  sect('5. Student sign-in & profile');
  let studentUser;
  try {
    studentUser = await signIn('alex.doe@nexskill.demo', 'demo1234');
    log(`Signed in as student: ${studentUser.email} (id=${studentUser.id})`);
  } catch (e) {
    fail('Student sign-in', e);
    process.exit(1);
  }

  // Ensure profiles row
  await upsert('profiles', {
    id: studentUser.id,
    email: 'alex.doe@nexskill.demo',
    first_name: 'Alex',
    last_name: 'Doe',
    username: 'alex_doe',
    role: 'student',
  }, 'id');
  log('profiles row for student');

  // student_profiles
  const { data: existingStudentProfile } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('user_id', studentUser.id)
    .maybeSingle();

  let studentProfileId = existingStudentProfile?.id;
  if (!studentProfileId) {
    const { data: sp, error: spErr } = await supabase
      .from('student_profiles')
      .insert({
        user_id: studentUser.id,
        first_name: 'Alex',
        last_name: 'Doe',
        headline: 'Aspiring Full-Stack Developer | JavaScript Enthusiast',
        bio: 'I am a self-taught developer transitioning from a non-tech background. I am passionate about building things on the web and am currently focused on mastering JavaScript and React.',
        current_skill_level: 'Beginner',
      })
      .select('id')
      .single();
    if (spErr) fail('student_profiles insert', spErr);
    else { studentProfileId = sp.id; log(`student_profiles (id=${studentProfileId})`); ok++; }
  } else {
    skp(`student_profiles already exists (id=${studentProfileId})`); skip++;
  }

  // ── STEP 6: Interests & Goals ───────────────────────────────────────────────
  sect('6. Interests & goals');

  const interestIdMap = {};
  for (const name of INTERESTS) {
    const { data, error } = await supabase
      .from('interests')
      .upsert({ name }, { onConflict: 'name' })
      .select('id, name')
      .single();
    if (error) fail(`interest "${name}"`, error);
    else { interestIdMap[name] = data.id; }
  }
  log(`Upserted ${INTERESTS.length} interests`); ok++;

  const goalIdMap = {};
  for (const name of GOALS) {
    const { data, error } = await supabase
      .from('goals')
      .upsert({ name }, { onConflict: 'name' })
      .select('id, name')
      .single();
    if (error) fail(`goal "${name}"`, error);
    else { goalIdMap[name] = data.id; }
  }
  log(`Upserted ${GOALS.length} goals`); ok++;

  // student_interests (Web Development + Data Science)
  if (studentProfileId) {
    const { data: existingInterests } = await supabase
      .from('student_interests')
      .select('interest_id')
      .eq('student_profile_id', studentProfileId);
    const existingInterestIds = new Set((existingInterests || []).map(r => r.interest_id));

    for (const iName of ['Web Development', 'Data Science', 'Machine Learning']) {
      const iId = interestIdMap[iName];
      if (!iId || existingInterestIds.has(iId)) { skp(`student_interest: ${iName}`); skip++; continue; }
      const { error } = await supabase.from('student_interests').insert({
        student_profile_id: studentProfileId,
        interest_id: iId,
      });
      if (error) fail(`student_interest "${iName}"`, error);
      else { log(`student_interest: ${iName}`); ok++; }
    }

    const { data: existingGoals } = await supabase
      .from('student_goals')
      .select('goal_id')
      .eq('student_profile_id', studentProfileId);
    const existingGoalIds = new Set((existingGoals || []).map(r => r.goal_id));

    for (const gName of ['Get a new job in tech', 'Build a side project']) {
      const gId = goalIdMap[gName];
      if (!gId || existingGoalIds.has(gId)) { skp(`student_goal: ${gName}`); skip++; continue; }
      const { error } = await supabase.from('student_goals').insert({
        student_profile_id: studentProfileId,
        goal_id: gId,
      });
      if (error) fail(`student_goal "${gName}"`, error);
      else { log(`student_goal: ${gName}`); ok++; }
    }
  }

  // ── STEP 7: Enrollments ─────────────────────────────────────────────────────
  sect('7. Enrollments');

  // Enroll student in first two courses
  const enrollCourseIds = courseIds.slice(0, 2).map(c => c.id);

  for (const cId of enrollCourseIds) {
    const { data: existing } = await supabase
      .from('enrollments')
      .select('profile_id')
      .eq('profile_id', studentUser.id)
      .eq('course_id', cId)
      .maybeSingle();

    if (existing) { skp(`Already enrolled in course ${cId}`); skip++; }
    else {
      const { error } = await supabase.from('enrollments').insert({
        profile_id: studentUser.id,
        course_id: cId,
      });
      if (error) fail(`Enroll in course ${cId}`, error);
      else { log(`Enrolled in: ${courseIds.find(c => c.id === cId)?.title}`); ok++; }
    }
  }

  // ── STEP 8: Lesson Progress ─────────────────────────────────────────────────
  sect('8. Lesson progress (user_lesson_progress)');

  // Course 1: all 6 lessons — complete Module 1 fully, Module 2 partially
  // Course 1: all 6 lessons complete (full graduation + certificate)
  // Course 2: Module 1 Lesson 1 only (just started)
  const progressMap = [];

  if (courseIds[0]?.modules) {
    const mod1 = courseIds[0].modules[0]; // Module 1 of Course 1
    const mod2 = courseIds[0].modules[1]; // Module 2 of Course 1
    const durations1 = [15, 22, 28];     // Mirror lesson est_duration with slight variation
    const durations2 = [21, 27, 30];     // All 3 lessons of mod2 complete

    for (let i = 0; i < (mod1?.lessonIds?.length ?? 0); i++) {
      progressMap.push({ lessonId: mod1.lessonIds[i], completed: true, seconds: (durations1[i] ?? 15) * 60 });
    }
    // All 3 lessons of Module 2 complete → enables graduation
    for (let i = 0; i < (mod2?.lessonIds?.length ?? 0); i++) {
      progressMap.push({ lessonId: mod2.lessonIds[i], completed: true, seconds: (durations2[i] ?? 25) * 60 });
    }
  }

  if (courseIds[1]?.modules) {
    const mod1c2 = courseIds[1].modules[0]; // Module 1 of Course 2
    if (mod1c2?.lessonIds?.[0]) {
      progressMap.push({ lessonId: mod1c2.lessonIds[0], completed: true, seconds: 31 * 60 });
    }
  }

  for (const p of progressMap) {
    if (!p.lessonId) continue;
    // Always upsert so re-running the seed updates in-progress lessons to completed
    const { error } = await supabase.from('user_lesson_progress').upsert({
      user_id: studentUser.id,
      lesson_id: p.lessonId,
      is_completed: p.completed,
      completed_at: p.completed ? daysAgo(Math.floor(Math.random() * 7)) : null,
      time_spent_seconds: p.seconds,
    }, { onConflict: 'user_id,lesson_id' });
    if (error) fail(`Progress for lesson ${p.lessonId}`, error);
    else { log(`Progress: lesson ${p.lessonId} — ${p.completed ? '✓ completed' : 'in-progress'} (${Math.round(p.seconds/60)} min)`); ok++; }
  }

  // ── STEP 9: Quiz Attempt + Responses ───────────────────────────────────────
  sect('9. Quiz attempt & responses');

  const quizId = courseIds[0]?.modules?.[0]?.quizId;
  if (!quizId) {
    console.log('  ⚠️   No quiz ID found for Course 1 Module 1 — skipping quiz attempt');
  } else {
    // Check existing attempts
    const { data: existingAttempts } = await supabase
      .from('quiz_attempts')
      .select('id, status')
      .eq('user_id', studentUser.id)
      .eq('quiz_id', quizId);

    if (existingAttempts?.length) {
      skp(`Quiz attempts already exist for quiz ${quizId} (${existingAttempts.length} attempt(s))`); skip++;
    } else {
      // Fetch the quiz questions
      const { data: qs, error: qsErr } = await supabase
        .from('quiz_questions')
        .select('id, question_type, points, answer_config')
        .eq('quiz_id', quizId)
        .order('position');

      if (qsErr || !qs?.length) {
        fail('Fetch quiz questions for attempt', qsErr || 'No questions found');
      } else {
        const maxScore = qs.reduce((s, q) => s + (q.points ?? 1), 0);
        const correctCount = Math.ceil(qs.length * 0.8); // Student gets 80% correct
        const score = Math.round((correctCount / qs.length) * maxScore);
        const passed = score >= Math.round(maxScore * 0.7);

        const submittedAt = daysAgo(3);

        const { data: attempt, error: aErr } = await supabase
          .from('quiz_attempts')
          .insert({
            user_id: studentUser.id,
            quiz_id: quizId,
            attempt_number: 1,
            status: 'submitted',
            score,
            max_score: maxScore,
            passed,
            started_at: new Date(new Date(submittedAt).getTime() - 8 * 60000).toISOString(),
            submitted_at: submittedAt,
          })
          .select('id')
          .single();

        if (aErr) { fail('quiz_attempts insert', aErr); }
        else {
          log(`Quiz attempt created (score=${score}/${maxScore}, passed=${passed})`); ok++;

          // Insert responses — student answers correctly for first `correctCount` questions
          const responses = qs.map((q, idx) => {
            const isCorrect = idx < correctCount;
            const answer = q.answer_config ?? {};
            let responseData = {};
            if (q.question_type === 'true_false') {
              const correct = answer.correctAnswer;
              responseData = { answer: isCorrect ? correct : !correct };
            } else {
              // multiple_choice
              const correctId = answer.correctOptionId ?? 'a';
              responseData = { selectedOptionId: isCorrect ? correctId : (correctId === 'a' ? 'b' : 'a') };
            }
            return {
              attempt_id: attempt.id,
              question_id: q.id,
              response_data: responseData,
              points_earned: isCorrect ? (q.points ?? 1) : 0,
              points_possible: q.points ?? 1,
              is_correct: isCorrect,
              requires_grading: false,
            };
          });

          for (const resp of responses) {
            const { error: rErr } = await supabase.from('quiz_responses').insert(resp);
            if (rErr) fail(`quiz_response for question ${resp.question_id}`, rErr);
            else { ok++; }
          }
          log(`${responses.length} quiz responses inserted`);
        }
      }
    }
  }

  // ── STEP 10: Reviews ────────────────────────────────────────────────────────
  sect('10. Reviews');

  const course1Id = courseIds[0]?.id;
  if (course1Id) {
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('course_id', course1Id)
      .eq('profile_id', studentUser.id)
      .maybeSingle();

    if (existingReview) { skp('Review already exists'); skip++; }
    else {
      const { error } = await supabase.from('reviews').insert({
        course_id: course1Id,
        profile_id: studentUser.id,
        rating: 5,
        comment: "Absolutely fantastic course! Jordan explains concepts so clearly — I went from knowing nothing about JavaScript to building interactive pages. The async/await lesson was a game-changer for me. Highly recommend to anyone starting out.",
      });
      if (error) fail('Insert review', error);
      else { log(`5-star review for Course 1`); ok++; }
    }
  }

  // ── STEP 11: Wishlist ───────────────────────────────────────────────────────
  sect('11. Student wishlist');

  const course3Id = courseIds[2]?.id;
  if (course3Id) {
    const { data: existingWish } = await supabase
      .from('student_wishlist')
      .select('id')
      .eq('user_id', studentUser.id)
      .eq('course_id', course3Id)
      .maybeSingle();

    if (existingWish) { skp('Wishlist entry already exists'); skip++; }
    else {
      const { error } = await supabase.from('student_wishlist').insert({
        user_id: studentUser.id,
        course_id: course3Id,
      });
      if (error) fail('student_wishlist insert', error);
      else { log(`Added "Data Science with Python" to wishlist`); ok++; }
    }
  }

  // ── STEP 12: Conversation & Messages ───────────────────────────────────────
  sect('12. Conversation & messages');

  const { data: existingConv } = await supabase
    .from('conversations')
    .select('id')
    .or(`user1_id.eq.${studentUser.id},user2_id.eq.${studentUser.id}`)
    .maybeSingle();

  let conversationId = existingConv?.id;
  if (conversationId) {
    skp(`Conversation already exists (id=${conversationId})`); skip++;
  } else {
    // conversations_user_order CHECK constraint requires user1_id < user2_id (UUID lex order)
    const [uid1, uid2] = [studentUser.id, coachUser.id].sort();
    const { data: conv, error: convErr } = await supabase
      .from('conversations')
      .insert({
        user1_id: uid1,
        user2_id: uid2,
        course_id: course1Id ?? null,
        last_message_content: 'Exactly right! Great question. You are getting it quickly.',
        last_message_at: daysAgo(1),
        last_sender_id: coachUser.id,
        unread_count_user1: 1,
        unread_count_user2: 0,
      })
      .select('id')
      .single();
    if (convErr) { fail('conversations insert', convErr); }
    else { conversationId = conv.id; log(`Conversation created (id=${conversationId})`); ok++; }
  }

  if (conversationId) {
    const { data: existingMessages } = await supabase
      .from('messages')
      .select('id')
      .or(`sender_id.eq.${studentUser.id},sender_id.eq.${coachUser.id}`)
      .limit(1);

    if (existingMessages?.length) {
      skp('Messages already exist');
    } else {
      const msgs = [
        { sender_id: studentUser.id, recipient_id: coachUser.id, content: "Hi Jordan! I'm having trouble understanding async/await. Is it just syntactic sugar, or is there genuine benefit to using it over raw .then() chains?", created_at: daysAgo(3), course_id: course1Id ?? null },
        { sender_id: coachUser.id, recipient_id: studentUser.id, content: "Great question, Alex! Both achieve the same thing under the hood — async/await IS syntactic sugar over Promises. The real benefit is readability. With async/await your code reads like synchronous code, making it much easier to reason about and debug.", created_at: daysAgo(3), course_id: course1Id ?? null },
        { sender_id: studentUser.id, recipient_id: coachUser.id, content: "That makes sense! So `await` actually pauses execution within the async function only, right? The rest of the JS event loop keeps running?", created_at: daysAgo(2), course_id: course1Id ?? null },
        { sender_id: coachUser.id, recipient_id: studentUser.id, content: "Exactly right! The async function suspends at each `await` point, but the JS event loop continues handling other tasks. This is why we can do concurrent requests with Promise.all — the awaits happen in parallel. You're getting it quickly, keep it up!", created_at: daysAgo(1), course_id: course1Id ?? null },
        { sender_id: studentUser.id, recipient_id: coachUser.id, content: "Thank you so much! One more question — when should I use Promise.all vs Promise.allSettled?", created_at: daysAgo(1), course_id: course1Id ?? null },
      ];
      for (const m of msgs) {
        const { error } = await supabase.from('messages').insert(m);
        if (error) fail(`message from ${m.sender_id === studentUser.id ? 'student' : 'coach'}`, error);
        else ok++;
      }
      log(`${msgs.length} messages inserted between student and coach`);
    }
  }

  // Sign out to avoid leaving an open session
  await supabase.auth.signOut();

  // ── SUMMARY ────────────────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(64)}`);
  console.log(`  🌱  Seed complete:`);
  console.log(`     ✅  Inserted/updated : ${ok}`);
  console.log(`     ⏭️   Skipped (exists) : ${skip}`);
  console.log(`     ❌  Errors           : ${err}`);
  console.log(`${'═'.repeat(64)}\n`);

  if (err > 0) {
    console.log('  ⚠️  Some inserts failed — see ❌ lines above.');
    console.log('  If errors are RLS-related, the coach/student must own the data being inserted.');
    console.log('  If errors are unique-constraint related, the data already exists (run again to see skips).\n');
  } else {
    console.log('  ✅  Database fully seeded! You can now test:\n');
    console.log('  Student (alex.doe@nexskill.demo / demo1234):');
    console.log('    - Dashboard: 2 enrolled courses with real progress');
    console.log('    - Course 1: 6/6 lessons complete → certificate available!');
    console.log('    - Course 2: 1/6 lessons complete');
    console.log('    - Course 3: wishlisted (not enrolled)');
    console.log('    - Messages: conversation with coach');
    console.log('    - Profile: interests, goals, real stats\n');
    console.log('  Coach (jordan.doe@nexskill.demo / demo1234):');
    console.log('    - Dashboard: 3 courses, real student counts & ratings');
    console.log('    - Students page: Alex enrolled with progress visible');
    console.log('    - Quizzes page: submitted attempts with scores');
    console.log('    - 6 upcoming live sessions\n');
  }
}

main().catch((e) => {
  console.error('\n💥  Fatal error:', e.message);
  process.exit(1);
});
