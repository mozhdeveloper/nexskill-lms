/**
 * NexSkill LMS — Perfect Demo Accounts Seed Script
 *
 * Creates two complete demo accounts with full end-to-end journeys:
 *
 *   Coach  : sarah.mitchell@nexskill.demo  / demo1234
 *     ✅ Verified coach profile (job_title, bio, experience_level, content_areas, tools)
 *     ✅ 2 fully published courses (approved)
 *     ✅ 5 modules with 3 lessons each (15 total rich lessons)
 *     ✅ 5 quizzes with 5 questions each (25 total questions)
 *     ✅ module_content_items wiring for every lesson + quiz
 *     ✅ course_goals for both courses
 *     ✅ live_sessions (past + upcoming)
 *     ✅ Reviews from enrolled students
 *
 *   Student: james.chen@nexskill.demo  / demo1234
 *     ✅ Complete student_profile (headline, bio, skill level)
 *     ✅ Interests & Goals
 *     ✅ Enrolled in both courses
 *     ✅ Course 1 FULLY COMPLETED (graduation ready — all lessons, all quizzes passed)
 *     ✅ Course 2 in-progress (50% done)
 *     ✅ quiz_attempts + quiz_responses for Course 1 quizzes (passed)
 *     ✅ student_wishlist (Course 2 wish saved)
 *     ✅ conversation + messages with the coach
 *     ✅ Review submitted for Course 1
 *
 * Idempotent: safe to run multiple times.
 * Run with:  node scripts/seed-perfect-accounts.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';

// ─── Load .env ───────────────────────────────────────────────────────────────
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
  console.error('❌  Missing VITE_SUPABASE_URL or anon key in .env / .env.local');
  process.exit(1);
}

const usingService = !!SUPABASE_SERVICE_KEY;
if (usingService) {
  console.log('🔑  Using service role key — RLS bypassed.');
} else {
  console.log('⚠️   No SUPABASE_SERVICE_ROLE_KEY — using anon key (some operations may fail due to RLS).');
  console.log('    Add SUPABASE_SERVICE_ROLE_KEY=<key> to .env.local → Dashboard → Settings → API → service_role\n');
}

// Auth-only client — used SOLELY for signIn/signOut to resolve user IDs
const authClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// Admin client — service role key, no persistent session → bypasses RLS for every table op
// Named `supabase` so all existing supabase.from() calls below work without modification
const supabase = SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : authClient;

// ─── Helpers ─────────────────────────────────────────────────────────────────
let ok = 0, skip = 0, err = 0;
const log  = (msg) => { console.log(`  ✅  ${msg}`); ok++; };
const skp  = (msg) => { console.log(`  ⏭️   ${msg}`); skip++; };
const fail = (msg, e) => { console.error(`  ❌  ${msg} — ${e?.message ?? e}`); err++; };
const sect = (t) => console.log(`\n${'═'.repeat(64)}\n  ${t}\n${'═'.repeat(64)}`);
const sub  = (t) => console.log(`\n  ── ${t}`);

const daysAgo  = (d) => new Date(Date.now() - d * 86400_000).toISOString();
const daysFrom = (d) => new Date(Date.now() + d * 86400_000).toISOString();

async function signInOrCreate(email, password, firstName, lastName) {
  // Strategy: sign in (or sign up) to get the user ID, then IMMEDIATELY sign out.
  // This ensures the service role key (not the user JWT) is used for all
  // subsequent table operations, which bypasses RLS entirely.

  // 1. Try sign-in (user may already exist) — use authClient so we don't contaminate supabase session
  const { data: si, error: siErr } = await authClient.auth.signInWithPassword({ email, password });
  if (!siErr && si?.user) {
    console.log(`   ↳ Signed in existing account: ${email} (${si.user.id})`);
    await authClient.auth.signOut(); // clear authClient session — supabase (admin) client is unaffected
    return si.user;
  }

  // 2. Sign up (new user)
  console.log(`   ↳ Creating new account: ${email} ...`);
  const { data: su, error: suErr } = await authClient.auth.signUp({
    email,
    password,
    options: { data: { first_name: firstName, last_name: lastName } },
  });
  if (suErr || !su?.user) {
    console.error(`   ❌ signUp failed for ${email}: ${suErr?.message ?? 'Unknown'}`);
    console.error(`       Tip: Disable email confirmation in Supabase Dashboard → Authentication → Email.`);
    return null;
  }

  // Sign out immediately after getting the ID
  await authClient.auth.signOut();

  // signUp may return a user that needs email confirmation (identity.confirmed_at is null)
  if (!su.user.email_confirmed_at && !su.user.confirmed_at) {
    console.warn(`   ⚠️  ${email} created but email confirmation required.`);
    console.warn(`       Disable: Supabase Dashboard → Authentication → Providers → Email → uncheck "Confirm email".`);
    console.warn(`       Or manually confirm from the Users tab in the Supabase dashboard.`);
  }
  
  return su.user;
}

async function upsert(table, row, conflictCol) {
  const { data, error } = await supabase
    .from(table)
    .upsert(row, { onConflict: conflictCol, ignoreDuplicates: false })
    .select()
    .maybeSingle();
  if (error) { fail(`upsert ${table}`, error); return null; }
  return data;
}

async function insertIgnore(table, row, conflictCol) {
  const { data, error } = await supabase
    .from(table)
    .upsert(row, { onConflict: conflictCol, ignoreDuplicates: true })
    .select()
    .maybeSingle();
  if (error) { fail(`insert ${table}`, error); return null; }
  return data;
}

async function findOne(table, col, val) {
  const { data } = await supabase.from(table).select('*').eq(col, val).maybeSingle();
  return data;
}

// Build quiz question helpers
const opt = (id, text) => ({ id, text });
const qMC = (text, opts, correctId, explanation = '') => ({
  question_type: 'multiple_choice',
  position: 0, // will be set by caller
  points: 1,
  requires_manual_grading: false,
  question_content: [{ text, options: opts }],
  answer_config: { correctOptionId: correctId, explanation },
});
const qTF = (text, correct, explanation = '') => ({
  question_type: 'true_false',
  position: 0,
  points: 1,
  requires_manual_grading: false,
  question_content: [{ text }],
  answer_config: { correctAnswer: correct, explanation },
});

// ═══════════════════════════════════════════════════════════════════════════════
// COURSE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════
const COURSES = [
  {
    // ── Course 1 — Fully completed by student ──────────────────────────────
    title: 'The Complete Python Bootcamp: Zero to Hero',
    subtitle: 'Learn Python from scratch with real projects and data science',
    short_description:
      'A comprehensive beginner course covering Python fundamentals, file I/O, OOP, and data handling. Build 5 real-world projects.',
    long_description:
      `This course takes you from zero Python knowledge to confident developer. You will master variables, loops, functions, classes, file handling, and data structures through 18 hours of focused content and 5 hands-on projects. By the end you will be fully job-ready for entry-level Python roles and ready to dive into data science.`,
    level: 'Beginner',
    duration_hours: 18,
    price: 59.99,
    language: 'English',
    visibility: 'public',
    verification_status: 'approved',
    goals: [
      'Write clean, idiomatic Python code following PEP 8',
      'Build and deploy a complete command-line application',
      'Understand object-oriented programming with Python classes',
      'Read and write files, JSON, and CSV data',
      'Use Python libraries like os, sys, pathlib, and json',
    ],
    modules: [
      {
        title: 'Python Fundamentals',
        description: 'Core Python syntax, data types, and control flow every developer must know.',
        position: 1,
        is_published: true,
        lessons: [
          {
            title: 'Introduction to Python',
            description: 'Python history, installation, your first script, and the REPL.',
            estimated_duration_minutes: 15,
            is_published: true,
            content_blocks: [
              {
                type: 'text',
                text: `# Introduction to Python\n\nPython is a high-level, general-purpose programming language renowned for its readability and versatility. Created by Guido van Rossum in 1991, it now powers everything from Instagram to NASA.\n\n## Why Python?\n- **Readable syntax** — reads almost like English\n- **Huge ecosystem** — 400 000+ packages on PyPI\n- **Versatile** — web, data science, automation, AI/ML, scripting\n- **In-demand** — consistently top 3 in TIOBE index\n\n## Installation\n1. Visit [python.org](https://python.org) and download the latest 3.x release\n2. On Windows, check **"Add Python to PATH"** during install\n3. Verify: open terminal and type \`python --version\`\n\n## Your First Script\n\`\`\`python\n# hello.py\nprint("Hello, World!")\nname = input("What is your name? ")\nprint(f"Welcome to Python, {name}!")\n\`\`\`\n\nSave as \`hello.py\` and run: \`python hello.py\`\n\n## The Python REPL\nType \`python\` in terminal to open the interactive shell — great for quick experiments:\n\`\`\`\n>>> 2 + 2\n4\n>>> "hello".upper()\n'HELLO'\n\`\`\``,
              },
            ],
          },
          {
            title: 'Variables, Data Types & Operators',
            description: 'Numbers, strings, booleans, lists, dicts, and all Python operators.',
            estimated_duration_minutes: 25,
            is_published: true,
            content_blocks: [
              {
                type: 'text',
                text: `# Variables, Data Types & Operators\n\n## Variables\nPython is dynamically typed — no type declarations needed:\n\`\`\`python\nname = "James"       # str\nage = 28             # int\nheight = 1.82        # float\nis_enrolled = True   # bool\n\`\`\`\n\n## Core Data Types\n| Type | Example | Use |\n|------|---------|-----|\n| str | \`"hello"\` | text |\n| int | \`42\` | whole numbers |\n| float | \`3.14\` | decimals |\n| bool | \`True\` | logic |\n| list | \`[1, 2, 3]\` | ordered sequence |\n| dict | \`{"a": 1}\` | key-value pairs |\n| tuple | \`(1, 2)\` | immutable sequence |\n| set | \`{1, 2, 3}\` | unique values |\n\n## Operators\n\`\`\`python\n# Arithmetic\nprint(10 + 3)   # 13\nprint(10 - 3)   # 7\nprint(10 * 3)   # 30\nprint(10 / 3)   # 3.333...\nprint(10 // 3)  # 3   (floor division)\nprint(10 % 3)   # 1   (modulo)\nprint(2 ** 8)   # 256 (exponent)\n\n# Comparison\nprint(5 == 5)   # True\nprint(5 != 5)   # False\nprint(5 > 3)    # True\n\n# String operations\nfull = "James" + " " + "Chen"  # concatenation\nrepeated = "ha" * 3            # "hahaha"\nf_string = f"My name is {name} and I am {age}"  # f-strings!\n\`\`\``,
              },
            ],
          },
          {
            title: 'Control Flow: if, for, while',
            description: 'Conditional logic and loops — the backbone of every program.',
            estimated_duration_minutes: 30,
            is_published: true,
            content_blocks: [
              {
                type: 'text',
                text: `# Control Flow: if, for, while\n\n## if / elif / else\n\`\`\`python\nscore = 85\n\nif score >= 90:\n    grade = "A"\nelif score >= 80:\n    grade = "B"\nelif score >= 70:\n    grade = "C"\nelse:\n    grade = "F"\n\nprint(f"Grade: {grade}")  # Grade: B\n\`\`\`\n\n## for Loops\n\`\`\`python\n# Loop over a list\nfruits = ["apple", "banana", "cherry"]\nfor fruit in fruits:\n    print(fruit.upper())\n\n# Loop with range\nfor i in range(1, 6):   # 1, 2, 3, 4, 5\n    print(f"Step {i}")\n\n# Loop with index (enumerate)\nfor idx, fruit in enumerate(fruits, start=1):\n    print(f"{idx}. {fruit}")\n\`\`\`\n\n## while Loops\n\`\`\`python\ncount = 0\nwhile count < 5:\n    print(f"Count: {count}")\n    count += 1\n\n# break and continue\nfor n in range(10):\n    if n == 3: continue  # skip 3\n    if n == 7: break     # stop at 7\n    print(n)\n\`\`\`\n\n## List Comprehensions (Pythonic!)\n\`\`\`python\nsquares = [x**2 for x in range(10)]          # [0,1,4,9,...,81]\nevens   = [x for x in range(20) if x % 2==0]  # [0,2,4,...,18]\n\`\`\``,
              },
            ],
          },
        ],
        quiz: {
          title: 'Python Fundamentals Quiz',
          description: 'Test your Python basics knowledge.',
          instructions: 'Answer all 5 questions. You have 10 minutes. Passing score is 70%.',
          passing_score: 70,
          time_limit_minutes: 10,
          max_attempts: 3,
          max_attempts_quiz: 3,
          is_published: true,
          questions: [
            qMC(
              'Which function prints output to the console in Python?',
              [opt('a','console.log()'), opt('b','print()'), opt('c','echo()'), opt('d','puts()')],
              'b',
              'print() is Python\'s built-in function for writing output to the console.'
            ),
            qTF('Python is statically typed, so you must declare variable types.', false,
              'Python is dynamically typed — you do not need to declare types. The interpreter infers them at runtime.'),
            qMC(
              'What is the result of 17 // 5 in Python?',
              [opt('a','3.4'), opt('b','2'), opt('c','3'), opt('d','4')],
              'c',
              '// is floor division. 17 // 5 = 3 (the quotient, discarding the remainder).'
            ),
            qMC(
              'Which Python keyword skips the current loop iteration and continues to the next?',
              [opt('a','break'), opt('b','pass'), opt('c','continue'), opt('d','next')],
              'c',
              'continue skips the rest of the current iteration and jumps to the next one.'
            ),
            qTF('f-strings (f"...") are the recommended modern way to format strings in Python 3.', true,
              'f-strings, introduced in Python 3.6, are the fastest and most readable way to format strings.'),
          ],
        },
      },
      {
        title: 'Functions, OOP & File Handling',
        description: 'Write reusable code with functions, classes, and real file I/O.',
        position: 2,
        is_published: true,
        lessons: [
          {
            title: 'Defining & Using Functions',
            description: 'Parameters, return values, default args, *args, **kwargs, and docstrings.',
            estimated_duration_minutes: 30,
            is_published: true,
            content_blocks: [
              {
                type: 'text',
                text: `# Defining & Using Functions\n\nFunctions let you write code once and reuse it everywhere.\n\n## Basic Function\n\`\`\`python\ndef greet(name):\n    """Return a greeting string for the given name."""\n    return f"Hello, {name}!"\n\nmessage = greet("James")\nprint(message)  # Hello, James!\n\`\`\`\n\n## Default Parameters\n\`\`\`python\ndef power(base, exponent=2):\n    return base ** exponent\n\nprint(power(3))    # 9  (uses default exponent)\nprint(power(2, 8)) # 256\n\`\`\`\n\n## *args and **kwargs\n\`\`\`python\ndef total(*nums):\n    return sum(nums)\n\nprint(total(1, 2, 3, 4))  # 10\n\ndef describe(**info):\n    for key, val in info.items():\n        print(f"  {key}: {val}")\n\ndescribe(name="James", role="student", level="beginner")\n\`\`\`\n\n## Lambda Functions\n\`\`\`python\ndouble = lambda x: x * 2\nadd    = lambda a, b: a + b\n\nnumbers = [5, 2, 8, 1, 9]\nsorted_nums = sorted(numbers, key=lambda x: -x)  # descending\n\`\`\``,
              },
            ],
          },
          {
            title: 'Object-Oriented Programming with Classes',
            description: 'Classes, attributes, methods, inheritance, and dunder methods.',
            estimated_duration_minutes: 35,
            is_published: true,
            content_blocks: [
              {
                type: 'text',
                text: `# Object-Oriented Programming with Classes\n\n## Defining a Class\n\`\`\`python\nclass Student:\n    """Represents a learner on the platform."""\n\n    school = "NexSkill Academy"  # class attribute\n\n    def __init__(self, name, email, level="Beginner"):\n        self.name  = name          # instance attributes\n        self.email = email\n        self.level = level\n        self.courses = []\n\n    def enroll(self, course_name):\n        self.courses.append(course_name)\n        print(f"{self.name} enrolled in: {course_name}")\n\n    def __repr__(self):\n        return f"Student(name={self.name!r}, level={self.level!r})"\n\n# Usage\njames = Student("James Chen", "james@nexskill.demo")\njames.enroll("Python Bootcamp")\nprint(james)  # Student(name='James Chen', level='Beginner')\n\`\`\`\n\n## Inheritance\n\`\`\`python\nclass CoachStudent(Student):\n    """A student who also coaches others."""\n\n    def __init__(self, name, email, specialty):\n        super().__init__(name, email, level="Advanced")\n        self.specialty = specialty\n        self.students_taught = 0\n\n    def teach(self, topic):\n        self.students_taught += 1\n        print(f"{self.name} taught: {topic}")\n\`\`\`\n\n## Special (Dunder) Methods\n\`\`\`python\nclass Vector:\n    def __init__(self, x, y):\n        self.x, self.y = x, y\n    def __add__(self, other):\n        return Vector(self.x + other.x, self.y + other.y)\n    def __str__(self):\n        return f"({self.x}, {self.y})"\n\nv = Vector(1, 2) + Vector(3, 4)\nprint(v)  # (4, 6)\n\`\`\``,
              },
            ],
          },
          {
            title: 'File Handling & JSON',
            description: 'Read/write text files, CSV data, and JSON with Python\'s built-in libraries.',
            estimated_duration_minutes: 25,
            is_published: true,
            content_blocks: [
              {
                type: 'text',
                text: `# File Handling & JSON\n\n## Reading Files\n\`\`\`python\n# Read entire file as string\nwith open("data.txt", "r", encoding="utf-8") as f:\n    content = f.read()\n\n# Read line by line (memory efficient)\nwith open("data.txt", "r") as f:\n    for line in f:\n        print(line.strip())\n\n# Read all lines into a list\nwith open("data.txt") as f:\n    lines = f.readlines()\n\`\`\`\n\n## Writing Files\n\`\`\`python\n# Write (overwrites existing)\nwith open("output.txt", "w") as f:\n    f.write("Hello, file!\\n")\n    f.write("Second line\\n")\n\n# Append without overwriting\nwith open("log.txt", "a") as f:\n    f.write("New log entry\\n")\n\`\`\`\n\n## Working with JSON\n\`\`\`python\nimport json\n\n# Python dict → JSON string\nstudent = {"name": "James", "level": "Beginner", "enrolled": True}\njson_str = json.dumps(student, indent=2)\n\n# JSON string → Python dict\nparsed = json.loads(json_str)\nprint(parsed["name"])  # James\n\n# Read JSON file\nwith open("config.json") as f:\n    config = json.load(f)\n\n# Write JSON file\nwith open("students.json", "w") as f:\n    json.dump(student, f, indent=2)\n\`\`\`\n\n## CSV Files\n\`\`\`python\nimport csv\n\n# Read CSV\nwith open("data.csv", newline="") as f:\n    reader = csv.DictReader(f)\n    for row in reader:\n        print(row["name"], row["score"])\n\`\`\``,
              },
            ],
          },
        ],
        quiz: {
          title: 'Functions, OOP & File Handling Quiz',
          description: 'Validate your Python intermediate knowledge.',
          instructions: 'Answer all 5 questions. Passing score is 70%.',
          passing_score: 70,
          time_limit_minutes: 10,
          max_attempts: 3,
          max_attempts_quiz: 3,
          is_published: true,
          questions: [
            qMC(
              'Which parameter syntax collects any number of keyword arguments into a dict?',
              [opt('a','*args'), opt('b','**kwargs'), opt('c','*kwargs'), opt('d','**args')],
              'b',
              '**kwargs collects extra keyword arguments as a dictionary inside the function.'
            ),
            qTF('__init__ in a Python class is the constructor method called when an object is created.', true,
              'Correct! __init__ initialises a new instance. It\'s called automatically when you do ClassName().'),
            qMC(
              'What does the "with" statement guarantee when opening a file?',
              [opt('a','The file is created if it doesn\'t exist'), opt('b','The file is closed automatically after the block'), opt('c','The file is made read-only'), opt('d','The file is locked so no other process can access it')],
              'b',
              'The "with" statement uses a context manager that guarantees the file is properly closed, even if an exception occurs.'
            ),
            qMC(
              'Which method would you call to convert a Python dict to a JSON string?',
              [opt('a','json.load()'), opt('b','json.read()'), opt('c','json.dumps()'), opt('d','json.encode()')],
              'c',
              'json.dumps() serialises a Python object to a JSON formatted string. json.dump() writes to a file.'
            ),
            qTF('Child classes in Python automatically call the parent __init__ without any extra code.', false,
              'You must explicitly call super().__init__() in the child class to invoke the parent constructor.'),
          ],
        },
      },
      {
        title: 'Capstone: Build a Real Python Project',
        description: 'Apply everything you learned to build a complete task management CLI app.',
        position: 3,
        is_published: true,
        lessons: [
          {
            title: 'Project Architecture & Setup',
            description: 'Plan the app structure, virtual environment setup, and project layout.',
            estimated_duration_minutes: 20,
            is_published: true,
            content_blocks: [
              {
                type: 'text',
                text: `# Project Architecture & Setup\n\nIn this capstone we build **TaskFlow** — a command-line task manager that stores tasks in JSON.\n\n## Project Structure\n\`\`\`\ntaskflow/\n├── main.py          # Entry point\n├── task.py          # Task class\n├── storage.py       # JSON file handling\n├── cli.py           # CLI argument parsing\n├── requirements.txt # Dependencies (if any)\n└── tasks.json       # Created on first run\n\`\`\`\n\n## Setting Up a Virtual Environment\n\`\`\`bash\n# Create virtual environment\npython -m venv venv\n\n# Activate (Windows)\nvenv\\Scripts\\activate\n\n# Activate (macOS/Linux)\nsource venv/bin/activate\n\n# Install dependencies\npip install -r requirements.txt\n\`\`\`\n\n## The Task Class\n\`\`\`python\n# task.py\nfrom datetime import datetime\nimport uuid\n\nclass Task:\n    def __init__(self, title, description="", priority="medium"):\n        self.id = str(uuid.uuid4())[:8]  # short ID\n        self.title = title\n        self.description = description\n        self.priority = priority\n        self.completed = False\n        self.created_at = datetime.now().isoformat()\n        self.completed_at = None\n\n    def complete(self):\n        self.completed = True\n        self.completed_at = datetime.now().isoformat()\n\n    def to_dict(self):\n        return vars(self)\n\n    @classmethod\n    def from_dict(cls, data):\n        task = cls(data["title"], data["description"], data["priority"])\n        task.id = data["id"]\n        task.completed = data["completed"]\n        task.created_at = data["created_at"]\n        task.completed_at = data["completed_at"]\n        return task\n\`\`\``,
              },
            ],
          },
          {
            title: 'Building the CLI Interface',
            description: 'Use argparse to create add, list, complete, and delete commands.',
            estimated_duration_minutes: 30,
            is_published: true,
            content_blocks: [
              {
                type: 'text',
                text: `# Building the CLI Interface\n\nWe use Python's built-in \`argparse\` to handle subcommands.\n\n## cli.py — Argument Parsing\n\`\`\`python\nimport argparse\n\ndef build_parser():\n    parser = argparse.ArgumentParser(\n        prog="taskflow",\n        description="A simple CLI task manager"\n    )\n    subs = parser.add_subparsers(dest="command")\n\n    # add command\n    add = subs.add_parser("add", help="Add a new task")\n    add.add_argument("title", help="Task title")\n    add.add_argument("-d", "--description", default="")\n    add.add_argument("-p", "--priority", choices=["low","medium","high"], default="medium")\n\n    # list command\n    subs.add_parser("list", help="List all tasks")\n\n    # complete command\n    comp = subs.add_parser("complete", help="Mark a task complete")\n    comp.add_argument("task_id", help="ID of the task to complete")\n\n    # delete command\n    delete = subs.add_parser("delete", help="Delete a task")\n    delete.add_argument("task_id")\n\n    return parser\n\`\`\`\n\n## main.py — Entry Point\n\`\`\`python\nfrom cli import build_parser\nfrom storage import TaskStorage\nfrom task import Task\n\ndef main():\n    parser = build_parser()\n    args = parser.parse_args()\n    storage = TaskStorage("tasks.json")\n\n    if args.command == "add":\n        task = Task(args.title, args.description, args.priority)\n        storage.add(task)\n        print(f"✅ Added: [{task.id}] {task.title}")\n\n    elif args.command == "list":\n        tasks = storage.all()\n        if not tasks:\n            print("No tasks yet. Use: taskflow add <title>")\n        for t in tasks:\n            status = "✅" if t.completed else "⬜"\n            print(f"  {status} [{t.id}] {t.title} ({t.priority})")\n\n    elif args.command == "complete":\n        task = storage.get(args.task_id)\n        if task:\n            task.complete()\n            storage.save()\n            print(f"✅ '{task.title}' marked complete!")\n\n    elif args.command == "delete":\n        storage.delete(args.task_id)\n        print(f"🗑️ Task {args.task_id} deleted")\n\nif __name__ == "__main__":\n    main()\n\`\`\``,
              },
            ],
          },
          {
            title: 'Testing, Packaging & Deployment',
            description: 'Write basic tests with pytest, add error handling, and share your project.',
            estimated_duration_minutes: 25,
            is_published: true,
            content_blocks: [
              {
                type: 'text',
                text: `# Testing, Packaging & Deployment\n\n## Writing Tests with pytest\n\`\`\`bash\npip install pytest\n\`\`\`\n\n\`\`\`python\n# test_task.py\nfrom task import Task\n\ndef test_task_creation():\n    t = Task("Buy groceries", "Milk, eggs, bread")\n    assert t.title == "Buy groceries"\n    assert t.completed == False\n    assert t.priority == "medium"\n    assert t.id is not None\n\ndef test_task_completion():\n    t = Task("Finish Python course")\n    t.complete()\n    assert t.completed == True\n    assert t.completed_at is not None\n\ndef test_task_serialisation():\n    t = Task("Test task", priority="high")\n    d = t.to_dict()\n    restored = Task.from_dict(d)\n    assert restored.id == t.id\n    assert restored.title == t.title\n    assert restored.priority == "high"\n\`\`\`\n\n\`\`\`bash\npytest -v  # Run all tests\n\`\`\`\n\n## Error Handling\n\`\`\`python\ntry:\n    task = storage.get(args.task_id)\n    if not task:\n        raise ValueError(f"No task with ID: {args.task_id}")\nexcept ValueError as e:\n    print(f"❌ Error: {e}")\n    sys.exit(1)\n\`\`\`\n\n## Sharing on GitHub\n\`\`\`bash\ngit init\necho "venv/" > .gitignore\ngit add .\ngit commit -m "feat: initial TaskFlow CLI app"\ngit remote add origin https://github.com/you/taskflow.git\ngit push -u origin main\n\`\`\`\n\n## 🎓 Congratulations!\nYou have completed the Python Bootcamp. You can now:\n- Write idiomatic Python 3 code\n- Design and implement classes\n- Handle files and JSON\n- Build CLI applications\n- Write automated tests\n- Ship projects to GitHub\n\nYour next step: **Python for Data Science** — pandas, matplotlib, NumPy, and real datasets!`,
              },
            ],
          },
        ],
        quiz: {
          title: 'Capstone & Python Mastery Quiz',
          description: 'Final quiz for the Python Bootcamp.',
          instructions: 'Answer all 5 questions. Passing score is 70%.',
          passing_score: 70,
          time_limit_minutes: 10,
          max_attempts: 3,
          max_attempts_quiz: 3,
          is_published: true,
          questions: [
            qMC(
              'Which Python module is built-in and used to parse command-line arguments?',
              [opt('a','sys'), opt('b','argparse'), opt('c','click'), opt('d','docopt')],
              'b',
              'argparse is Python\'s built-in module for parsing command-line arguments. It supports subcommands, help text, and type validation.'
            ),
            qTF('pytest is part of the Python standard library and does not need to be installed separately.', false,
              'pytest is a third-party testing framework. You must install it with pip install pytest.'),
            qMC(
              'What does uuid.uuid4() generate?',
              [opt('a','A sequential integer ID'), opt('b','A timestamp-based ID'), opt('c','A random unique identifier (UUID)'), opt('d','A hash of the current time')],
              'c',
              'uuid4() generates a random UUID (Universally Unique Identifier) — a 128-bit value with extremely low collision probability.'
            ),
            qMC(
              'Which method converts a Python object to its dictionary representation?',
              [opt('a','vars()'), opt('b','dict()'), opt('c','repr()'), opt('d','str()')],
              'a',
              'vars(obj) returns the __dict__ of an object — all its instance attributes as a dictionary. Useful for serialisation.'
            ),
            qTF('A virtual environment isolates your project\'s Python packages from the system Python.', true,
              'Virtual environments (venv/virtualenv) create an isolated package directory per project, preventing dependency conflicts.'),
          ],
        },
      },
    ],
  },
  {
    // ── Course 2 — Student is 50% through this one ─────────────────────────
    title: 'CSS Animations & Modern UI Design',
    subtitle: 'Master CSS transitions, keyframe animations, and Tailwind CSS',
    short_description:
      'Learn to build polished, animated UIs using CSS3, Tailwind CSS utilities, and motion design principles.',
    long_description:
      `Bring your web UIs to life with smooth animations and transitions. This course covers CSS3 transitions, keyframe animations, scroll-triggered effects, Tailwind CSS animation utilities, and real design principles that make interfaces feel professional. By the end you will be confident adding delight and motion to any web project.`,
    level: 'Intermediate',
    duration_hours: 10,
    price: 39.99,
    language: 'English',
    visibility: 'public',
    verification_status: 'approved',
    goals: [
      'Create smooth CSS3 transitions on any property',
      'Write @keyframes animations from scratch',
      'Use Tailwind CSS animation and transition utilities',
      'Understand easing functions and animation timing',
      'Implement scroll-triggered animations with Intersection Observer',
    ],
    modules: [
      {
        title: 'CSS Transitions & Keyframes',
        description: 'The fundamentals of motion in CSS — transitions, easing, and keyframe animations.',
        position: 1,
        is_published: true,
        lessons: [
          {
            title: 'CSS Transitions',
            description: 'How transition works, syntax, properties, timing functions, and delays.',
            estimated_duration_minutes: 20,
            is_published: true,
            content_blocks: [
              {
                type: 'text',
                text: `# CSS Transitions\n\nCSS transitions let you animate *changes* to property values smoothly over a specified duration.\n\n## Syntax\n\`\`\`css\n/* Transition a single property */\n.btn {\n  background-color: #3b82f6;\n  transition: background-color 0.3s ease;\n}\n\n.btn:hover {\n  background-color: #1d4ed8;\n}\n\n/* Transition multiple properties */\n.card {\n  transform: translateY(0);\n  box-shadow: 0 2px 6px rgba(0,0,0,0.1);\n  transition:\n    transform 0.25s ease-out,\n    box-shadow 0.25s ease-out;\n}\n\n.card:hover {\n  transform: translateY(-4px);\n  box-shadow: 0 8px 24px rgba(0,0,0,0.2);\n}\n\`\`\`\n\n## Shorthand\n\`\`\`\ntransition: <property> <duration> <easing> <delay>;\n\`\`\`\n\n## Easing Functions\n| Value | Feel |\n|-------|------|\n| \`linear\` | Constant speed |\n| \`ease\` | Slow-fast-slow (default) |\n| \`ease-in\` | Starts slow |\n| \`ease-out\` | Ends slow |\n| \`ease-in-out\` | Both ends slow |\n| \`cubic-bezier()\` | Custom curve |\n\n## What Can You Transition?\nAny property with a numeric interpolable value: \`opacity\`, \`color\`, \`background-color\`, \`transform\`, \`width\`, \`height\`, \`margin\`, \`padding\`, \`border-radius\`, \`box-shadow\` ...`,
              },
            ],
          },
          {
            title: '@keyframes Animations',
            description: 'Define multi-step animations with @keyframes and the animation property.',
            estimated_duration_minutes: 25,
            is_published: true,
            content_blocks: [
              {
                type: 'text',
                text: `# @keyframes Animations\n\nUnlike transitions (which animate *between two states*), keyframe animations define *multiple steps*.\n\n## Defining a Keyframe\n\`\`\`css\n@keyframes fadeInUp {\n  from {\n    opacity: 0;\n    transform: translateY(20px);\n  }\n  to {\n    opacity: 1;\n    transform: translateY(0);\n  }\n}\n\n/* Percentage-based steps */\n@keyframes pulse {\n  0%   { transform: scale(1); }\n  50%  { transform: scale(1.05); }\n  100% { transform: scale(1); }\n}\n\`\`\`\n\n## Using animation Property\n\`\`\`css\n.hero-title {\n  animation-name: fadeInUp;\n  animation-duration: 0.6s;\n  animation-timing-function: ease-out;\n  animation-delay: 0.1s;\n  animation-fill-mode: both; /* keeps final state */\n}\n\n/* Shorthand */\n.hero-title {\n  animation: fadeInUp 0.6s ease-out 0.1s both;\n}\n\n/* Infinite loop */\n.spinner {\n  animation: spin 1s linear infinite;\n}\n@keyframes spin {\n  to { transform: rotate(360deg); }\n}\n\`\`\`\n\n## fill-mode Values\n| Value | Meaning |\n|-------|---------|\n| \`none\` | Returns to original after animation |\n| \`forwards\` | Stays at final keyframe state |\n| \`backwards\` | Applies initial keyframe during delay |\n| \`both\` | Both forwards + backwards |\n\n## Staggered Animations\n\`\`\`css\n.list-item { animation: fadeInUp 0.4s ease-out both; }\n.list-item:nth-child(1) { animation-delay: 0.0s; }\n.list-item:nth-child(2) { animation-delay: 0.1s; }\n.list-item:nth-child(3) { animation-delay: 0.2s; }\n\`\`\``,
              },
            ],
          },
          {
            title: 'Tailwind CSS Animation Utilities',
            description: 'Use Tailwind\'s built-in transitions, animations, and custom config.',
            estimated_duration_minutes: 20,
            is_published: true,
            content_blocks: [
              {
                type: 'text',
                text: `# Tailwind CSS Animation Utilities\n\nTailwind ships with built-in animation and transition utilities that cover most common needs.\n\n## Transition Utilities\n\`\`\`html\n<!-- Enable transition on all properties -->\n<button class="transition-all duration-300 ease-in-out\n               bg-blue-500 hover:bg-blue-700\n               text-white px-4 py-2 rounded">\n  Hover me\n</button>\n\n<!-- Specific property -->\n<div class="transition-transform duration-200 hover:scale-105">\n  Scale on hover\n</div>\n\`\`\`\n\n## Built-in Animations\n\`\`\`html\n<!-- Spin (loading spinner) -->\n<div class="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent" />\n\n<!-- Ping (notification badge) -->\n<span class="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-blue-400 opacity-75" />\n\n<!-- Pulse (skeleton loader) -->\n<div class="animate-pulse bg-gray-200 h-4 w-full rounded" />\n\n<!-- Bounce -->\n<div class="animate-bounce text-2xl">👇</div>\n\`\`\`\n\n## Custom Animations in tailwind.config.js\n\`\`\`js\nmodule.exports = {\n  theme: {\n    extend: {\n      keyframes: {\n        fadeInUp: {\n          '0%':   { opacity: '0', transform: 'translateY(16px)' },\n          '100%': { opacity: '1', transform: 'translateY(0)' },\n        },\n      },\n      animation: {\n        'fade-in-up': 'fadeInUp 0.4s ease-out both',\n      },\n    },\n  },\n};\n\`\`\`\n\n\`\`\`html\n<h1 class="animate-fade-in-up text-3xl font-bold">\n  Welcome!\n</h1>\n\`\`\``,
              },
            ],
          },
        ],
        quiz: {
          title: 'CSS Transitions & Animations Quiz',
          description: 'Test your CSS animation knowledge.',
          instructions: 'Answer all 5 questions. Passing score is 70%.',
          passing_score: 70,
          time_limit_minutes: 10,
          max_attempts: 3,
          max_attempts_quiz: 3,
          is_published: true,
          questions: [
            qMC(
              'Which CSS property controls the speed curve of a transition?',
              [opt('a','transition-speed'), opt('b','transition-duration'), opt('c','transition-timing-function'), opt('d','animation-easing')],
              'c',
              'transition-timing-function controls the easing curve (e.g., ease, ease-in-out, cubic-bezier).'
            ),
            qTF('CSS animations defined with @keyframes can loop infinitely using animation-iteration-count: infinite.', true,
              'Correct! Setting animation-iteration-count: infinite causes the animation to repeat forever.'),
            qMC(
              'What does animation-fill-mode: both do?',
              [opt('a','Runs the animation twice'), opt('b','Applies both forwards and backwards fill modes'), opt('c','Mirrors the animation on the second half'), opt('d','Runs two animations simultaneously')],
              'b',
              '"both" combines forwards (holds final state after animation) and backwards (applies initial state during delay).'
            ),
            qMC(
              'Which Tailwind utility creates a pulsing loading skeleton effect?',
              [opt('a','animate-spin'), opt('b','animate-ping'), opt('c','animate-bounce'), opt('d','animate-pulse')],
              'd',
              'animate-pulse applies a slow pulsing opacity animation, perfect for skeleton loading states.'
            ),
            qTF('The CSS transition property can animate display: none to display: block directly.', false,
              'display is not an animatable property — it switches instantly. Use opacity, visibility, or transform instead to animate show/hide effects.'),
          ],
        },
      },
      {
        title: 'Advanced Motion Design',
        description: 'Scroll animations, micro-interactions, and performance best practices.',
        position: 2,
        is_published: true,
        lessons: [
          {
            title: 'Scroll-Triggered Animations',
            description: 'Use Intersection Observer API to reveal elements as they enter the viewport.',
            estimated_duration_minutes: 25,
            is_published: true,
            content_blocks: [
              {
                type: 'text',
                text: `# Scroll-Triggered Animations\n\nScroll animations reveal content as the user scrolls, adding depth and storytelling to your UI.\n\n## Intersection Observer API\n\`\`\`javascript\nconst observer = new IntersectionObserver(\n  (entries) => {\n    entries.forEach((entry) => {\n      if (entry.isIntersecting) {\n        entry.target.classList.add("visible");\n        // Optionally unobserve after first trigger:\n        observer.unobserve(entry.target);\n      }\n    });\n  },\n  {\n    threshold: 0.1,    // trigger when 10% visible\n    rootMargin: "0px 0px -50px 0px",  // offset\n  }\n);\n\n// Observe all elements with .reveal class\ndocument.querySelectorAll(".reveal").forEach((el) => {\n  observer.observe(el);\n});\n\`\`\`\n\n## CSS for Reveal Effect\n\`\`\`css\n.reveal {\n  opacity: 0;\n  transform: translateY(30px);\n  transition: opacity 0.6s ease-out, transform 0.6s ease-out;\n}\n.reveal.visible {\n  opacity: 1;\n  transform: translateY(0);\n}\n\`\`\`\n\n## HTML\n\`\`\`html\n<section class="reveal">\n  <h2>This slides in when scrolled into view</h2>\n</section>\n\`\`\`\n\n## React Implementation\n\`\`\`tsx\nimport { useEffect, useRef } from "react";\n\nfunction RevealSection({ children }: { children: React.ReactNode }) {\n  const ref = useRef<HTMLDivElement>(null);\n  useEffect(() => {\n    const el = ref.current;\n    if (!el) return;\n    const obs = new IntersectionObserver(([e]) => {\n      if (e.isIntersecting) { el.classList.add("opacity-100", "translate-y-0"); obs.disconnect(); }\n    }, { threshold: 0.1 });\n    obs.observe(el);\n    return () => obs.disconnect();\n  }, []);\n  return (\n    <div ref={ref} className="opacity-0 translate-y-8 transition-all duration-700">\n      {children}\n    </div>\n  );\n}\n\`\`\``,
              },
            ],
          },
          {
            title: 'Micro-Interactions & UX Motion',
            description: 'Button feedback, loading states, and motion that communicates status.',
            estimated_duration_minutes: 20,
            is_published: true,
            content_blocks: [
              {
                type: 'text',
                text: `# Micro-Interactions & UX Motion\n\nMicro-interactions are subtle animations that give users feedback and make your UI feel alive.\n\n## Button States\n\`\`\`css\n.btn {\n  transform: scale(1);\n  transition: transform 0.1s ease, box-shadow 0.2s ease;\n}\n.btn:hover  { box-shadow: 0 4px 15px rgba(59,130,246,0.4); }\n.btn:active { transform: scale(0.97); }\n\`\`\`\n\n## Loading Spinner\n\`\`\`html\n<div class="flex items-center gap-2">\n  <svg class="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">\n    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>\n    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>\n  </svg>\n  <span>Loading...</span>\n</div>\n\`\`\`\n\n## Success Checkmark Animation\n\`\`\`css\n@keyframes checkDraw {\n  from { stroke-dashoffset: 50; }\n  to   { stroke-dashoffset: 0; }\n}\n.check-path {\n  stroke-dasharray: 50;\n  stroke-dashoffset: 50;\n  animation: checkDraw 0.4s ease-out 0.2s forwards;\n}\n\`\`\`\n\n## Shake (Error Feedback)\n\`\`\`css\n@keyframes shake {\n  0%, 100% { transform: translateX(0); }\n  20%       { transform: translateX(-6px); }\n  40%       { transform: translateX(6px); }\n  60%       { transform: translateX(-4px); }\n  80%       { transform: translateX(4px); }\n}\n.input-error {\n  animation: shake 0.4s ease;\n  border-color: #ef4444;\n}\n\`\`\`\n\n## the 12 Principles of Animation (Film → UI)\n1. **Squash & stretch** → scale transforms\n2. **Anticipation** → brief opposite move before action\n3. **Staging** → clear visual hierarchy\n4. **Ease in / ease out** → cubic-bezier curves\n5. **Timing** → consider device performance\n6. **Follow-through** → overshoot then settle`,
              },
            ],
          },
          {
            title: 'Performance & Best Practices',
            description: 'GPU-composited properties, will-change, prefers-reduced-motion.',
            estimated_duration_minutes: 20,
            is_published: true,
            content_blocks: [
              {
                type: 'text',
                text: `# Performance & Best Practices\n\n## GPU-Composited Properties (Fast)\nOnly animate these for smooth 60fps animations:\n- \`transform\` (translate, scale, rotate)\n- \`opacity\`\n\nAvoid animating: \`width\`, \`height\`, \`margin\`, \`padding\`, \`top\`, \`left\` — these trigger layout recalculations.\n\n\`\`\`css\n/* ❌ Slow — triggers layout */\n.card { transition: width 0.3s; }\n\n/* ✅ Fast — GPU composited */\n.card { transition: transform 0.3s; }\n.card:hover { transform: scaleX(1.05); }\n\`\`\`\n\n## will-change Hint\n\`\`\`css\n.animated-element {\n  will-change: transform, opacity;\n}\n/* ⚠️ Only use when needed — can use more GPU memory */\n\`\`\`\n\n## Respecting prefers-reduced-motion\nAlways respect users who have reduced motion enabled in their OS settings:\n\`\`\`css\n.hero {\n  animation: fadeInUp 0.6s ease-out both;\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .hero {\n    animation: none;\n    opacity: 1;\n    transform: none;\n  }\n}\n\`\`\`\n\n## Tailwind\\\'s motion-safe Modifier\n\`\`\`html\n<div class="motion-safe:animate-fade-in-up">\n  Only animates if reduced motion is NOT preferred\n</div>\n\`\`\`\n\n## Checklist for Production Animations\n- [ ] Only animate transform and opacity\n- [ ] Use will-change sparingly\n- [ ] Test at 30fps / throttled CPU\n- [ ] Add prefers-reduced-motion support\n- [ ] Ensure animations < 400ms for UI feedback\n- [ ] Longer animations (transitions, page reveals) can be 600–1000ms\n- [ ] Never animate more than 10 elements simultaneously`,
              },
            ],
          },
        ],
        quiz: {
          title: 'Advanced Motion Design Quiz',
          description: 'Test your mastery of advanced CSS animation techniques.',
          instructions: 'Answer all 5 questions. Passing score is 70%.',
          passing_score: 70,
          time_limit_minutes: 10,
          max_attempts: 3,
          max_attempts_quiz: 3,
          is_published: true,
          questions: [
            qMC(
              'Which CSS properties are GPU-composited and safe to animate for 60fps performance?',
              [opt('a','width and height'), opt('b','margin and padding'), opt('c','transform and opacity'), opt('d','background-color and border-radius')],
              'c',
              'transform and opacity are composited by the GPU and do not trigger layout or paint — ideal for smooth animations.'
            ),
            qTF('The Intersection Observer API can trigger animations when elements enter the browser viewport.', true,
              'IntersectionObserver fires a callback when elements cross a configurable threshold of visibility — perfect for scroll-triggered animations.'),
            qMC(
              'Which CSS media feature should you check to disable animations for accessibility?',
              [opt('a','prefers-color-scheme'), opt('b','prefers-reduced-motion'), opt('c','prefers-contrast'), opt('d','prefers-no-animation')],
              'b',
              'prefers-reduced-motion: reduce detects when the user has requested minimal motion in their OS accessibility settings.'
            ),
            qMC(
              'In Tailwind CSS, which modifier ensures animations only play when the user has NOT requested reduced motion?',
              [opt('a','motion-reduce:'), opt('b','safe-motion:'), opt('c','motion-safe:'), opt('d','no-motion:')],
              'c',
              'motion-safe: applies styles only when the user has NOT set prefers-reduced-motion: reduce.'
            ),
            qTF('Animating the CSS width property is more performant than animating transform: scaleX().', false,
              'Animating width triggers layout + paint + composite (expensive). transform: scaleX() only triggers composite, making it far more performant.'),
          ],
        },
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('\n🚀  NexSkill LMS — Perfect Demo Accounts Seed');
  console.log('='.repeat(64));
  console.log('  Coach  : sarah.mitchell@nexskill.demo / demo1234');
  console.log('  Student: james.chen@nexskill.demo     / demo1234');
  console.log('='.repeat(64));

  // ── 1. Auth ───────────────────────────────────────────────────────────────
  sect('1. Authentication');

  const coachUser = await signInOrCreate(
    'sarah.mitchell@nexskill.demo', 'demo1234', 'Sarah', 'Mitchell'
  );
  const studentUser = await signInOrCreate(
    'james.chen@nexskill.demo', 'demo1234', 'James', 'Chen'
  );

  if (!coachUser || !studentUser) {
    console.error('\n❌  Could not get user IDs for both accounts. Aborting.');
    console.log('\n💡  Tip: If email confirmation is required, disable it at:');
    console.log('    Supabase Dashboard → Authentication → Providers → Email → Disable "Confirm email"');
    process.exit(1);
  }

  const COACH_ID   = coachUser.id;
  const STUDENT_ID = studentUser.id;
  console.log(`\n   Coach ID  : ${COACH_ID}`);
  console.log(`   Student ID: ${STUDENT_ID}`);

  // ── 2. Profiles ───────────────────────────────────────────────────────────
  sect('2. Profiles Table');

  await upsert('profiles', {
    id: COACH_ID,
    email: 'sarah.mitchell@nexskill.demo',
    username: 'sarah_mitchell_coach',
    first_name: 'Sarah',
    last_name: 'Mitchell',
    role: 'coach',
  }, 'id');
  log('Coach profile row upserted');

  await upsert('profiles', {
    id: STUDENT_ID,
    email: 'james.chen@nexskill.demo',
    username: 'james_chen_student',
    first_name: 'James',
    last_name: 'Chen',
    role: 'student',
  }, 'id');
  log('Student profile row upserted');

  // ── 3. Coach Profile ──────────────────────────────────────────────────────
  sect('3. Coach Profile (verified)');

  await upsert('coach_profiles', {
    id: COACH_ID,
    job_title: 'Senior Software Engineer & Educator',
    bio: `I'm Sarah Mitchell — a senior software engineer with 10+ years building production systems at scale. I've taught over 5,000 students across Python, CSS, and full-stack development. My courses focus on real-world projects, clean code practices, and the kind of depth you won't find in shallow tutorials. I believe in learning by building.`,
    experience_level: 'Expert',
    content_areas: ['Python', 'CSS', 'Web Development', 'Software Engineering', 'Data Science'],
    tools: ['VS Code', 'PyCharm', 'Git', 'GitHub', 'Figma', 'Notion', 'Postman'],
    linkedin_url: 'https://linkedin.com/in/sarah-mitchell-dev',
    portfolio_url: 'https://sarahmitchell.dev',
    verification_status: 'verified',
  }, 'id');
  log('Coach profile (verified) upserted');

  // ── 4. Category ───────────────────────────────────────────────────────────
  sect('4. Category');

  let { data: catData } = await supabase.from('categories').select('id').eq('slug', 'programming').maybeSingle();
  if (!catData) {
    const { data: newCat } = await supabase.from('categories').insert({ name: 'Programming', slug: 'programming' }).select().maybeSingle();
    catData = newCat;
  }
  const CATEGORY_ID = catData?.id ?? null;
  log(`Category ID: ${CATEGORY_ID}`);

  // ── 5. Courses, Modules, Lessons, Quizzes ─────────────────────────────────
  sect('5. Courses, Modules, Lessons, Quizzes');

  const courseIds   = [];
  const allLessons  = [];  // { courseIdx, moduleIdx, lessonId, contentType: 'lesson' }
  const allQuizIds  = [];  // { courseIdx, moduleIdx, quizId }

  for (let ci = 0; ci < COURSES.length; ci++) {
    const cDef = COURSES[ci];
    sub(`Course ${ci + 1}: "${cDef.title}"`);

    // Check if course exists for this coach with same title
    let { data: existingCourse } = await supabase
      .from('courses')
      .select('id')
      .eq('coach_id', COACH_ID)
      .eq('title', cDef.title)
      .maybeSingle();

    let courseId;
    if (existingCourse) {
      courseId = existingCourse.id;
      skp(`Course already exists: ${cDef.title}`);
    } else {
      const { data: newCourse, error: courseErr } = await supabase.from('courses').insert({
        title:               cDef.title,
        subtitle:            cDef.subtitle,
        short_description:   cDef.short_description,
        long_description:    cDef.long_description,
        level:               cDef.level,
        duration_hours:      cDef.duration_hours,
        price:               cDef.price,
        language:            cDef.language,
        visibility:          cDef.visibility,
        verification_status: cDef.verification_status,
        coach_id:            COACH_ID,
        category_id:         CATEGORY_ID,
      }).select().maybeSingle();

      if (courseErr || !newCourse) { fail(`insert course ${cDef.title}`, courseErr); continue; }
      courseId = newCourse.id;
      log(`Course created: ${cDef.title} (${courseId})`);
    }

    courseIds.push(courseId);

    // Course goals
    for (const goal of (cDef.goals || [])) {
      const { data: existG } = await supabase.from('course_goals').select('id').eq('course_id', courseId).eq('description', goal).maybeSingle();
      if (!existG) {
        await supabase.from('course_goals').insert({ course_id: courseId, description: goal });
      }
    }
    log(`Course goals: ${(cDef.goals || []).length}`);

    for (let mi = 0; mi < cDef.modules.length; mi++) {
      const mDef = cDef.modules[mi];

      // Check/create module
      let { data: existMod } = await supabase.from('modules').select('id').eq('course_id', courseId).eq('title', mDef.title).maybeSingle();
      let moduleId;
      if (existMod) {
        moduleId = existMod.id;
        skp(`Module exists: ${mDef.title}`);
      } else {
        const { data: newMod, error: modErr } = await supabase.from('modules').insert({
          course_id:    courseId,
          title:        mDef.title,
          description:  mDef.description,
          position:     mDef.position,
          is_published: mDef.is_published,
          owner_id:     COACH_ID,
        }).select().maybeSingle();
        if (modErr || !newMod) { fail(`insert module ${mDef.title}`, modErr); continue; }
        moduleId = newMod.id;
        log(`  Module: ${mDef.title}`);
      }

      let contentPosition = 1;

      // Lessons
      for (const lDef of mDef.lessons) {
        let { data: existL } = await supabase.from('lessons').select('id').eq('title', lDef.title).maybeSingle();
        let lessonId;
        if (existL) {
          lessonId = existL.id;
          skp(`  Lesson exists: ${lDef.title}`);
        } else {
          const { data: newL, error: lErr } = await supabase.from('lessons').insert({
            title:                      lDef.title,
            description:                lDef.description,
            content_blocks:             lDef.content_blocks,
            estimated_duration_minutes: lDef.estimated_duration_minutes,
            is_published:               lDef.is_published,
          }).select().maybeSingle();
          if (lErr || !newL) { fail(`insert lesson ${lDef.title}`, lErr); continue; }
          lessonId = newL.id;
          log(`    Lesson: ${lDef.title}`);
        }

        // module_content_items
        const { data: existMCI } = await supabase.from('module_content_items').select('id').eq('module_id', moduleId).eq('content_id', lessonId).maybeSingle();
        if (!existMCI) {
          await supabase.from('module_content_items').insert({
            module_id:    moduleId,
            content_type: 'lesson',
            content_id:   lessonId,
            position:     contentPosition,
            is_published: true,
          });
        }
        contentPosition++;
        allLessons.push({ courseIdx: ci, moduleIdx: mi, lessonId, title: lDef.title });
      }

      // Quiz
      if (mDef.quiz) {
        const qDef = mDef.quiz;
        let { data: existQ } = await supabase.from('quizzes').select('id').eq('title', qDef.title).maybeSingle();
        let quizId;
        if (existQ) {
          quizId = existQ.id;
          skp(`  Quiz exists: ${qDef.title}`);
        } else {
          const { data: newQ, error: qErr } = await supabase.from('quizzes').insert({
            title:                   qDef.title,
            description:             qDef.description,
            instructions:            qDef.instructions,
            passing_score:           qDef.passing_score,
            time_limit_minutes:      qDef.time_limit_minutes,
            max_attempts:            qDef.max_attempts,
            max_attempts_quiz:       qDef.max_attempts_quiz,
            is_published:            qDef.is_published,
            requires_manual_grading: false,
          }).select().maybeSingle();
          if (qErr || !newQ) { fail(`insert quiz ${qDef.title}`, qErr); continue; }
          quizId = newQ.id;
          log(`    Quiz: ${qDef.title}`);
        }

        // Quiz questions
        const { count: qCount } = await supabase.from('quiz_questions').select('id', { count: 'exact', head: true }).eq('quiz_id', quizId);
        if (!qCount || qCount === 0) {
          for (let qi = 0; qi < qDef.questions.length; qi++) {
            const q = { ...qDef.questions[qi], quiz_id: quizId, position: qi + 1 };
            await supabase.from('quiz_questions').insert(q);
          }
          log(`    Quiz questions: ${qDef.questions.length}`);
        } else {
          skp(`  Quiz questions already exist for: ${qDef.title}`);
        }

        // module_content_items for quiz
        const { data: existQMCI } = await supabase.from('module_content_items').select('id').eq('module_id', moduleId).eq('content_id', quizId).maybeSingle();
        if (!existQMCI) {
          await supabase.from('module_content_items').insert({
            module_id:    moduleId,
            content_type: 'quiz',
            content_id:   quizId,
            position:     contentPosition,
            is_published: true,
          });
        }
        contentPosition++;
        allQuizIds.push({ courseIdx: ci, moduleIdx: mi, quizId, title: qDef.title });
      }
    }
  }

  // ── 6. Live Sessions ─────────────────────────────────────────────────────
  sect('6. Live Sessions');

  if (courseIds[0]) {
    const sessions = [
      { title: 'Python Q&A — Week 2 Recap', scheduled_at: daysAgo(14), status: 'completed', is_live: false, description: 'Covering variables, loops, and functions from week 2.' },
      { title: 'Python OOP Deep Dive', scheduled_at: daysAgo(7), status: 'completed', is_live: false, description: 'Live walkthrough of classes, inheritance, and dunder methods.' },
      { title: 'File Handling & JSON Workshop', scheduled_at: daysAgo(2), status: 'completed', is_live: false, description: 'Live coding session building the JSON storage layer.' },
      { title: 'Capstone Project Review', scheduled_at: daysFrom(5), status: 'scheduled', is_live: false, description: 'Present your TaskFlow app. Get 1-on-1 feedback from Sarah.' },
      { title: 'Ask Me Anything — Python Advanced Topics', scheduled_at: daysFrom(12), status: 'scheduled', is_live: false, description: 'Open Q&A on decorators, generators, and async Python.' },
    ];
    for (const s of sessions) {
      const { data: existSess } = await supabase.from('live_sessions').select('id').eq('course_id', courseIds[0]).eq('title', s.title).maybeSingle();
      if (!existSess) {
        await supabase.from('live_sessions').insert({
          ...s,
          course_id:        courseIds[0],
          coach_id:         COACH_ID,
          duration_minutes: 60,
          meeting_link:     'https://meet.nexskill.academy/sarah-python',
        });
      }
    }
    log(`Live sessions: ${sessions.length} (3 past, 2 upcoming)`);
  }

  if (courseIds[1]) {
    const sessions2 = [
      { title: 'CSS Transitions Office Hours', scheduled_at: daysAgo(10), status: 'completed', is_live: false, description: 'Troubleshoot your CSS transition homework.' },
      { title: 'Tailwind Animation Workshop', scheduled_at: daysFrom(8), status: 'scheduled', is_live: false, description: 'Live build: animated landing page using Tailwind utilities.' },
    ];
    for (const s of sessions2) {
      const { data: existSess } = await supabase.from('live_sessions').select('id').eq('course_id', courseIds[1]).eq('title', s.title).maybeSingle();
      if (!existSess) {
        await supabase.from('live_sessions').insert({
          ...s,
          course_id:        courseIds[1],
          coach_id:         COACH_ID,
          duration_minutes: 60,
          meeting_link:     'https://meet.nexskill.academy/sarah-css',
        });
      }
    }
    log(`CSS course live sessions: ${sessions2.length}`);
  }

  // ── 7. Student Profile ───────────────────────────────────────────────────
  sect('7. Student Profile');

  let { data: existSP } = await supabase.from('student_profiles').select('id').eq('user_id', STUDENT_ID).maybeSingle();
  let studentProfileId;
  if (existSP) {
    studentProfileId = existSP.id;
    await supabase.from('student_profiles').update({
      first_name:          'James',
      last_name:           'Chen',
      headline:            'Aspiring Software Engineer | Python & Web Development',
      bio:                 "Hi! I'm James — a 28-year-old career changer learning to code. I started with the Python Bootcamp and I'm now hooked. I build small projects on weekends and dream of landing my first dev job within a year. Ask me about TaskFlow — my first real Python app!",
      current_skill_level: 'Beginner',
    }).eq('user_id', STUDENT_ID);
    skp('Student profile updated (already existed)');
  } else {
    const { data: newSP } = await supabase.from('student_profiles').insert({
      user_id:             STUDENT_ID,
      first_name:          'James',
      last_name:           'Chen',
      headline:            'Aspiring Software Engineer | Python & Web Development',
      bio:                 "Hi! I'm James — a 28-year-old career changer learning to code. I started with the Python Bootcamp and I'm now hooked. I build small projects on weekends and dream of landing my first dev job within a year. Ask me about TaskFlow — my first real Python app!",
      current_skill_level: 'Beginner',
    }).select().maybeSingle();
    studentProfileId = newSP?.id;
    log('Student profile created');
  }
  if (!studentProfileId) studentProfileId = existSP?.id;

  // ── 8. Interests & Goals ─────────────────────────────────────────────────
  sect('8. Student Interests & Goals');

  const interestNames = ['Python', 'Web Development', 'Data Science', 'Software Engineering'];
  const goalNames     = ['Get a job as a software developer', 'Build my own projects', 'Learn data science'];

  for (const name of interestNames) {
    let { data: interest } = await supabase.from('interests').select('id').eq('name', name).maybeSingle();
    if (!interest) {
      const { data: ni } = await supabase.from('interests').insert({ name }).select().maybeSingle();
      interest = ni;
    }
    if (interest && studentProfileId) {
      const { data: ei } = await supabase.from('student_interests').select('id').eq('student_profile_id', studentProfileId).eq('interest_id', interest.id).maybeSingle();
      if (!ei) await supabase.from('student_interests').insert({ student_profile_id: studentProfileId, interest_id: interest.id });
    }
  }
  log(`Interests: ${interestNames.join(', ')}`);

  for (const name of goalNames) {
    let { data: goal } = await supabase.from('goals').select('id').eq('name', name).maybeSingle();
    if (!goal) {
      const { data: ng } = await supabase.from('goals').insert({ name }).select().maybeSingle();
      goal = ng;
    }
    if (goal && studentProfileId) {
      const { data: eg } = await supabase.from('student_goals').select('id').eq('student_profile_id', studentProfileId).eq('goal_id', goal.id).maybeSingle();
      if (!eg) await supabase.from('student_goals').insert({ student_profile_id: studentProfileId, goal_id: goal.id });
    }
  }
  log(`Goals: ${goalNames.join(', ')}`);

  // ── 9. Enrollments ────────────────────────────────────────────────────────
  sect('9. Enrollments');

  for (let ci = 0; ci < courseIds.length; ci++) {
    const courseId = courseIds[ci];
    if (!courseId) continue;
    const { data: existE } = await supabase.from('enrollments').select('profile_id').eq('profile_id', STUDENT_ID).eq('course_id', courseId).maybeSingle();
    if (!existE) {
      await supabase.from('enrollments').insert({
        profile_id:   STUDENT_ID,
        course_id:    courseId,
        enrolled_at:  ci === 0 ? daysAgo(30) : daysAgo(10),
      });
      log(`Enrolled in Course ${ci + 1}: ${COURSES[ci].title}`);
    } else {
      skp(`Already enrolled in Course ${ci + 1}`);
    }
  }

  // ── 10. Lesson Progress ───────────────────────────────────────────────────
  sect('10. Lesson Progress');

  // Course 1 (ci=0): ALL lessons completed (student graduated)
  // Course 2 (ci=1): First module only completed (50% - in progress)
  const courseLessons = [[], []];
  for (const l of allLessons) {
    if (l.courseIdx < 2) courseLessons[l.courseIdx].push(l);
  }

  // Course 1 — all lessons complete
  for (const l of courseLessons[0]) {
    const { data: existP } = await supabase.from('user_lesson_progress').select('id').eq('user_id', STUDENT_ID).eq('lesson_id', l.lessonId).maybeSingle();
    if (!existP) {
      await supabase.from('user_lesson_progress').insert({
        user_id:             STUDENT_ID,
        lesson_id:           l.lessonId,
        is_completed:        true,
        completed_at:        daysAgo(Math.floor(Math.random() * 20) + 5),
        time_spent_seconds:  Math.floor(Math.random() * 1200) + 800,
      });
    }
  }
  log(`Course 1 lesson progress: ${courseLessons[0].length} lessons marked COMPLETED ✓`);

  // Course 2 — first module lessons complete only (50%)
  const course2Module0Lessons = courseLessons[1].filter((l) => l.moduleIdx === 0);
  for (const l of course2Module0Lessons) {
    const { data: existP } = await supabase.from('user_lesson_progress').select('id').eq('user_id', STUDENT_ID).eq('lesson_id', l.lessonId).maybeSingle();
    if (!existP) {
      await supabase.from('user_lesson_progress').insert({
        user_id:             STUDENT_ID,
        lesson_id:           l.lessonId,
        is_completed:        true,
        completed_at:        daysAgo(Math.floor(Math.random() * 7) + 1),
        time_spent_seconds:  Math.floor(Math.random() * 900) + 600,
      });
    }
  }
  log(`Course 2 lesson progress: ${course2Module0Lessons.length} lessons completed (Module 1 only)`);

  // ── 11. Module Progress ───────────────────────────────────────────────────
  sect('11. Module Progress');

  // Fetch module IDs for the courses
  for (let ci = 0; ci < courseIds.length; ci++) {
    if (!courseIds[ci]) continue;
    const { data: mods } = await supabase.from('modules').select('id, position').eq('course_id', courseIds[ci]);
    if (!mods) continue;
    for (const mod of mods) {
      const completionPct = ci === 0 ? 100 : (mod.position === 1 ? 100 : 0);
      const { data: existMP } = await supabase.from('user_module_progress').select('id').eq('user_id', STUDENT_ID).eq('module_id', mod.id).maybeSingle();
      if (!existMP) {
        await supabase.from('user_module_progress').insert({
          user_id:               STUDENT_ID,
          module_id:             mod.id,
          completion_percentage: completionPct,
          completed_at:          completionPct === 100 ? daysAgo(ci === 0 ? 5 : 1) : null,
        });
      } else {
        await supabase.from('user_module_progress').update({ completion_percentage: completionPct }).eq('id', existMP.id);
      }
    }
    log(`Course ${ci + 1} module progress records updated`);
  }

  // ── 12. Quiz Attempts (Course 1 — passed) ─────────────────────────────────
  sect('12. Quiz Attempts & Responses');

  const course1Quizzes = allQuizIds.filter((q) => q.courseIdx === 0);

  for (const qInfo of course1Quizzes) {
    // Check if attempt already exists
    const { data: existAt } = await supabase.from('quiz_attempts').select('id').eq('user_id', STUDENT_ID).eq('quiz_id', qInfo.quizId).maybeSingle();
    if (existAt) { skp(`Attempt already exists for: ${qInfo.title}`); continue; }

    // Fetch questions for this quiz
    const { data: questions } = await supabase.from('quiz_questions').select('id, points, question_type, answer_config').eq('quiz_id', qInfo.quizId).order('position');
    if (!questions || questions.length === 0) { fail(`no questions found for quiz ${qInfo.title}`, null); continue; }

    const maxScore = questions.reduce((sum, q) => sum + (q.points || 1), 0);
    const scoreEarned = Math.round(maxScore * (0.8 + Math.random() * 0.2)); // 80-100%
    const passed = scoreEarned >= Math.round(maxScore * 0.7);
    const startedAt  = daysAgo(15 - (qInfo.moduleIdx * 7));
    const submittedAt = new Date(new Date(startedAt).getTime() + 8 * 60 * 1000).toISOString();

    const { data: attempt, error: atErr } = await supabase.from('quiz_attempts').insert({
      user_id:        STUDENT_ID,
      quiz_id:        qInfo.quizId,
      attempt_number: 1,
      status:         'graded',
      score:          scoreEarned,
      max_score:      maxScore,
      passed,
      started_at:     startedAt,
      submitted_at:   submittedAt,
      graded_at:      submittedAt,
    }).select().maybeSingle();

    if (atErr || !attempt) { fail(`insert attempt for ${qInfo.title}`, atErr); continue; }
    log(`Quiz attempt: ${qInfo.title} — score ${scoreEarned}/${maxScore} (${passed ? 'PASSED' : 'FAILED'})`);

    // Quiz responses — answer correctly for each question
    for (let qi = 0; qi < questions.length; qi++) {
      const q = questions[qi];
      let responseData = {};
      let isCorrect = true;

      if (q.question_type === 'multiple_choice') {
        responseData = { selectedOptionId: q.answer_config?.correctOptionId };
      } else if (q.question_type === 'true_false') {
        responseData = { answer: q.answer_config?.correctAnswer };
      } else {
        responseData = { text: 'Sample answer provided by student.' };
        isCorrect = null; // manual grading
      }

      // Make first question wrong sometimes (for realism on some quizzes)
      if (qi === 0 && qInfo.moduleIdx > 0) {
        if (q.question_type === 'multiple_choice') {
          const opts = ['a', 'b', 'c', 'd'];
          const wrongOpt = opts.find((o) => o !== q.answer_config?.correctOptionId) ?? 'a';
          responseData = { selectedOptionId: wrongOpt };
          isCorrect = false;
        }
      }

      await supabase.from('quiz_responses').insert({
        attempt_id:       attempt.id,
        question_id:      q.id,
        response_data:    responseData,
        points_earned:    isCorrect === true ? (q.points || 1) : (isCorrect === false ? 0 : null),
        points_possible:  q.points || 1,
        is_correct:       isCorrect,
        requires_grading: isCorrect === null,
      });
    }
    log(`  Responses: ${questions.length} answers recorded`);
  }

  // ── 13. Wishlist ──────────────────────────────────────────────────────────
  sect('13. Student Wishlist');

  if (courseIds[1]) {
    const { data: existW } = await supabase.from('student_wishlist').select('id').eq('user_id', STUDENT_ID).eq('course_id', courseIds[1]).maybeSingle();
    if (!existW) {
      await supabase.from('student_wishlist').insert({ user_id: STUDENT_ID, course_id: courseIds[1] });
      log('Wishlisted: CSS Animations course');
    } else {
      skp('Wishlist item already exists');
    }
  }

  // ── 14. Reviews ───────────────────────────────────────────────────────────
  sect('14. Reviews');

  if (courseIds[0]) {
    const { data: existRev } = await supabase.from('reviews').select('id').eq('course_id', courseIds[0]).eq('profile_id', STUDENT_ID).maybeSingle();
    if (!existRev) {
      await supabase.from('reviews').insert({
        course_id:  courseIds[0],
        profile_id: STUDENT_ID,
        rating:     5,
        comment:    "One of the best courses I've ever taken. Sarah explains everything clearly with real examples. I went from zero Python knowledge to building a complete CLI app in 3 weeks. The capstone project was exactly what I needed — I shipped it to GitHub the same day I finished. 10/10, cannot recommend enough!",
      });
      log('Review submitted for Python Bootcamp (5 stars)');
    } else {
      skp('Review already exists');
    }
  }

  // ── 15. Conversation & Messages ───────────────────────────────────────────
  sect('15. Messaging');

  // Create or find conversation
  let { data: conv } = await supabase.from('conversations').select('id')
    .or(`and(user1_id.eq.${STUDENT_ID},user2_id.eq.${COACH_ID}),and(user1_id.eq.${COACH_ID},user2_id.eq.${STUDENT_ID})`)
    .maybeSingle();

  if (!conv) {
    const { data: newConv } = await supabase.from('conversations').insert({
      user1_id:             STUDENT_ID,
      user2_id:             COACH_ID,
      last_message_content: 'Thank you so much, Sarah! Just pushed my TaskFlow app to GitHub! 🎉',
      last_message_at:      daysAgo(1),
      last_sender_id:       STUDENT_ID,
      unread_count_user1:   0,
      unread_count_user2:   1,
      course_id:            courseIds[0] || null,
    }).select().maybeSingle();
    conv = newConv;
    log('Conversation created');
  } else {
    skp('Conversation already exists');
  }

  // Messages
  const messages = [
    { sender: STUDENT_ID, recipient: COACH_ID, content: "Hi Sarah! I just enrolled in the Python Bootcamp and I'm really excited. I've never coded before but your intro video made it seem so approachable. Thank you!", days: 29 },
    { sender: COACH_ID, recipient: STUDENT_ID, content: "Welcome James! I'm thrilled to have you in the course. Don't worry about starting from scratch — everyone does. Just focus on the lessons one at a time and do the exercises. You've got this! Feel free to message me if anything is unclear.", days: 29 },
    { sender: STUDENT_ID, recipient: COACH_ID, content: "I'm stuck on the *args vs **kwargs concept from Module 2. Could you give me a quick example of when you'd use both in the same function?", days: 20 },
    { sender: COACH_ID, recipient: STUDENT_ID, content: "Great question! Here's a practical example:\n\n```python\ndef create_profile(name, *tags, **settings):\n    print(f'Name: {name}')\n    print(f'Tags: {tags}')      # tuple of extra positional args\n    print(f'Settings: {settings}')  # dict of extra keyword args\n\ncreate_profile('James', 'python', 'beginner', theme='dark', notify=True)\n```\n\nThe rule: *args captures positional extras, **kwargs captures keyword extras. They're often used in wrapper functions!", days: 20 },
    { sender: STUDENT_ID, recipient: COACH_ID, content: "That makes SO much sense now! I kept confusing which was which. Thank you for the example 🙏", days: 19 },
    { sender: STUDENT_ID, recipient: COACH_ID, content: "Sarah, I just finished the Capstone module and submitted my TaskFlow app to GitHub! It was the hardest thing I've done so far but also the most rewarding. Just wanted to say — this course changed my life. I'm officially a Python developer now!", days: 1 },
    { sender: COACH_ID, recipient: STUDENT_ID, content: "JAMES!!! 🎉🎉🎉 Congratulations! I checked out your GitHub repo — TaskFlow looks really clean. Your code is well-structured and you even added tests! That puts you ahead of 80% of beginners. You should be incredibly proud. The certificate is yours. What's next — data science?", days: 1 },
    { sender: STUDENT_ID, recipient: COACH_ID, content: "Thank you so much, Sarah! Just pushed my TaskFlow app to GitHub! 🎉", days: 0 },
  ];

  let insertedMsgs = 0;
  for (const m of messages) {
    const sentAt = daysAgo(m.days);
    const { data: existMsg } = await supabase.from('messages').select('id').eq('sender_id', m.sender).eq('content', m.content).maybeSingle();
    if (!existMsg) {
      await supabase.from('messages').insert({
        sender_id:    m.sender,
        recipient_id: m.recipient,
        content:      m.content,
        course_id:    courseIds[0] || null,
        created_at:   sentAt,
        updated_at:   sentAt,
      });
      insertedMsgs++;
    }
  }
  log(`Messages: ${insertedMsgs} new messages inserted`);

  // ── Summary ───────────────────────────────────────────────────────────────
  sect('SEED COMPLETE');
  console.log(`\n  ✅ ${ok} operations succeeded`);
  console.log(`  ⏭️  ${skip} skipped (already existed)`);
  if (err > 0) console.log(`  ❌ ${err} errors (check logs above)`);

  console.log('\n' + '═'.repeat(64));
  console.log('  DEMO CREDENTIALS');
  console.log('═'.repeat(64));
  console.log('\n  👩‍🏫  COACH — Sarah Mitchell');
  console.log('      Email   : sarah.mitchell@nexskill.demo');
  console.log('      Password: demo1234');
  console.log('      Profile : Verified Coach | Expert Level');
  console.log('      Courses : 2 published courses');
  console.log('               • The Complete Python Bootcamp: Zero to Hero');
  console.log('               • CSS Animations & Modern UI Design');
  console.log('      Content : 5 modules | 15 lessons | 5 quizzes | 25 questions');
  console.log('      Sessions: 5 live sessions (3 past / 2 upcoming)');

  console.log('\n  👨‍💻  STUDENT — James Chen');
  console.log('      Email   : james.chen@nexskill.demo');
  console.log('      Password: demo1234');
  console.log('      Profile : Beginner | Aspiring Software Engineer');
  console.log('      Course 1: The Complete Python Bootcamp — ✅ GRADUATED (100%)');
  console.log('               • All 9 lessons completed');
  console.log('               • All 3 quizzes passed (80-100% scores)');
  console.log('               • 5-star review submitted');
  console.log('               • Certificate ready to view');
  console.log('      Course 2: CSS Animations — 📚 IN PROGRESS (Module 1 done)');
  console.log('               • 3/6 lessons completed');
  console.log('               • 1 quiz completed  ');
  console.log('      Extras  : Wishlist, Interests, Goals, Messages with coach');
  console.log('\n' + '═'.repeat(64));
}

main().catch((e) => {
  console.error('\n💥  Fatal error:', e);
  process.exit(1);
});
