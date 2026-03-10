# NEXSKILL LMS — PROJECT STANDARD

> **This document defines the authoritative coding, architecture, and workflow standards for the NexSkill LMS project.** Every feature, fix, and refactor must comply with these rules. This standard also serves as a reusable template for future projects built on the same stack.

---

## TABLE OF CONTENTS

1. [Prime Directive — Edit Workflow](#1-prime-directive--edit-workflow)
2. [Tech Stack](#2-tech-stack)
3. [Project Architecture](#3-project-architecture)
4. [TypeScript Standards](#4-typescript-standards)
5. [React & Component Standards](#5-react--component-standards)
6. [Styling — Tailwind CSS & CSS Standards](#6-styling--tailwind-css--css-standards)
7. [Animation — GSAP & Framer Motion](#7-animation--gsap--framer-motion)
8. [State Management & Context](#8-state-management--context)
9. [Routing & Navigation](#9-routing--navigation)
10. [Supabase & Database Standards](#10-supabase--database-standards)
11. [Role-Based Access Control (RBAC)](#11-role-based-access-control-rbac)
12. [Brand & Design Tokens](#12-brand--design-tokens)
13. [Error Handling](#13-error-handling)
14. [Security](#14-security)
15. [Accessibility (a11y)](#15-accessibility-a11y)
16. [Browser Compatibility](#16-browser-compatibility)
17. [Performance](#17-performance)
18. [Testing](#18-testing)
19. [Documentation](#19-documentation)
20. [Deployment](#20-deployment)
21. [Copilot Edit Workflow](#21-copilot-edit-workflow)

---

## 1. PRIME DIRECTIVE — EDIT WORKFLOW

- Avoid working on more than **one file at a time**. Multiple simultaneous edits to a single file will cause corruption.
- Be conversational — explain what you are doing and why while coding.
- For large files (>300 lines) or complex changes, **always plan first, then execute** (see [Section 21](#21-copilot-edit-workflow)).

---

## 2. TECH STACK

| Layer               | Technology                       | Version     |
| ------------------- | -------------------------------- | ----------- |
| **Framework**       | React                            | 18.3+       |
| **Language**        | TypeScript (strict mode)         | 5.9+        |
| **Build Tool**      | Vite                             | 7.2+        |
| **CSS Framework**   | Tailwind CSS                     | 3.4+        |
| **CSS Processing**  | PostCSS + Autoprefixer           | 8.5+        |
| **Backend (BaaS)**  | Supabase (PostgreSQL + Auth)     | 2.90+       |
| **Animation**       | GSAP 3 + ScrollTrigger           | 3.14+       |
| **Animation (alt)** | Framer Motion                    | 12+         |
| **Rich Text**       | TipTap                           | 3.16+       |
| **Icons**           | Lucide React                     | 0.555+      |
| **Routing**         | React Router DOM                 | 7.10+       |
| **Utilities**       | date-fns, uuid, DOMPurify        | latest      |
| **PDF/Export**       | jsPDF + html2canvas             | latest      |
| **Linting**         | ESLint 9 + typescript-eslint     | 9.39+ / 8.46+ |
| **Deployment**      | Vercel                           | —           |
| **Package Manager** | npm                              | 10+         |
| **Module System**   | ES Modules (`"type": "module"`)  | —           |

### Compiler Target

- **TypeScript**: `ES2022`, `strict: true`, `noUnusedLocals`, `noUnusedParameters`
- **Lib**: `ES2022`, `DOM`, `DOM.Iterable`
- **JSX**: `react-jsx`

---

## 3. PROJECT ARCHITECTURE

```
nexskill-lms/
├── index.html                 # Entry HTML — fonts, meta, root div
├── vite.config.ts             # Vite config (React plugin)
├── tailwind.config.js         # Tailwind theme, brand tokens, keyframes
├── tsconfig.json              # TS project references
├── tsconfig.app.json          # App TS config (strict, ES2022)
├── tsconfig.node.json         # Node TS config (for vite.config)
├── eslint.config.js           # Flat ESLint config
├── postcss.config.js          # PostCSS (tailwind + autoprefixer)
├── vercel.json                # Vercel deployment config (SPA rewrite)
├── package.json               # Dependencies and scripts
│
├── public/                    # Static assets (served as-is)
│
├── src/
│   ├── main.tsx               # React root mount
│   ├── App.tsx                # Top-level router & layout switch
│   ├── index.css              # Global CSS, Tailwind directives, CSS vars
│   ├── App.css                # App-level overrides
│   │
│   ├── assets/
│   │   └── branding/          # Logos, brand images
│   │
│   ├── components/            # Reusable UI components by domain
│   │   ├── admin/             # Admin dashboard, analytics, CRM, finance
│   │   ├── ai/                # AI chat, study plans, recommendations
│   │   ├── auth/              # RoleGuard, RoleHeader
│   │   ├── brand/             # BrandLogo, BrandLockup
│   │   ├── certificates/      # Certificate viewer, share, blockchain badge
│   │   ├── coach/             # Course builder, pricing, publish workflow
│   │   ├── coaching/          # Coaching sessions, scheduling
│   │   ├── community/         # Forums, discussions
│   │   ├── content/           # Content editor tools
│   │   ├── courses/           # Course cards, lists, details
│   │   ├── learning/          # Learning player, progress
│   │   ├── membership/        # Membership plans, payments
│   │   ├── org/               # Organization management
│   │   ├── owner/             # Platform owner tools
│   │   ├── profile/           # User profile components
│   │   ├── quiz/              # Quiz builder, player
│   │   ├── subcoach/          # Sub-coach management
│   │   ├── support/           # Support tickets, help desk
│   │   └── system/            # System-wide UI (errors, loading)
│   │
│   ├── config/                # App config (platform fees, constants)
│   ├── context/               # React Context providers
│   │   ├── AuthContext.tsx     # Auth state (Supabase session)
│   │   ├── UiPreferencesContext.tsx  # Theme, layout prefs
│   │   └── UserContext.tsx     # User profile data
│   │
│   ├── layouts/               # Role-specific app shells
│   │   ├── AdminAppLayout.tsx
│   │   ├── CoachAppLayout.tsx
│   │   ├── StudentAppLayout.tsx
│   │   ├── SubCoachAppLayout.tsx
│   │   ├── SupportStaffAppLayout.tsx
│   │   ├── OrgOwnerAppLayout.tsx
│   │   ├── PlatformOwnerAppLayout.tsx
│   │   ├── ContentEditorAppLayout.tsx
│   │   ├── CommunityManagerAppLayout.tsx
│   │   ├── PublicSystemLayout.tsx
│   │   └── StudentAuthLayout.tsx
│   │
│   ├── lib/
│   │   └── supabaseClient.ts  # Supabase client singleton
│   │
│   ├── pages/                 # Route-level page components by role
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── coach/
│   │   ├── community/
│   │   ├── content/
│   │   ├── org/
│   │   ├── owner/
│   │   ├── student/
│   │   ├── subcoach/
│   │   ├── support/
│   │   ├── system/
│   │   └── LandingPage.tsx
│   │
│   ├── types/                 # Shared TypeScript types
│   │   └── roles.ts           # UserRole union type
│   │
│   └── utils/                 # Utility functions
│       └── errorHandler.ts
│
├── docs/                      # Project documentation (Markdown)
├── tests/                     # Frontend and backend test suites
└── ux/
    └── design.json            # Design system export
```

### Naming Conventions

| Item                  | Convention                           | Example                        |
| --------------------- | ------------------------------------ | ------------------------------ |
| **Components**        | PascalCase `.tsx`                    | `CourseBuilderSidebar.tsx`     |
| **Pages**             | PascalCase `.tsx`                    | `CoachDashboard.tsx`           |
| **Utilities**         | camelCase `.ts`                      | `errorHandler.ts`              |
| **Types**             | PascalCase (type/interface)          | `UserRole`, `Course`           |
| **Context files**     | PascalCase + `Context.tsx`           | `AuthContext.tsx`              |
| **Layout files**      | PascalCase + `Layout.tsx`            | `CoachAppLayout.tsx`           |
| **CSS class names**   | Tailwind utility-first               | `bg-[#0A0A14] rounded-[2rem]` |
| **CSS custom props**  | `--kebab-case`                       | `--color-brand-neon`           |
| **Folders**           | kebab-case                           | `course-builder/`              |
| **Config files**      | kebab-case / dot-notation            | `tailwind.config.js`           |

---

## 4. TYPESCRIPT STANDARDS

### Compiler Strictness (Enforced via tsconfig)

- `"strict": true` — all strict checks enabled
- `"noUnusedLocals": true`
- `"noUnusedParameters": true`
- `"noFallthroughCasesInSwitch": true`
- `"verbatimModuleSyntax": true`
- `"erasableSyntaxOnly": true`

### Type Rules

- **Always type** function parameters, return values, and component props
- Use `interface` for object shapes (extensible), `type` for unions/intersections
- Avoid `any` — use `unknown` and narrow with type guards when type is uncertain
- Use `as const` for literal tuples and constant objects
- Prefer discriminated unions over optional fields for variant types
- Export shared types from `src/types/`

### Modern Features to Use

- Optional chaining (`?.`) and nullish coalescing (`??`)
- Template literal types where appropriate
- `satisfies` operator for type-safe assignments
- `const` type parameters
- Conditional types and mapped types for utility generics
- `Record<K, V>`, `Partial<T>`, `Required<T>`, `Pick<T, K>`, `Omit<T, K>`

### Avoid

- `var` keyword — always `const` (preferred) or `let`
- Type assertions (`as`) unless absolutely necessary
- `// @ts-ignore` — fix the type instead
- `enum` — use `as const` objects or union types instead
- Default exports for utilities (prefer named exports for better refactoring)

---

## 5. REACT & COMPONENT STANDARDS

### Component Rules

- **Functional components only** — no class components
- Use `React.FC<Props>` typing or inline typed parameters
- One component per file (small helpers in the same file are acceptable)
- Colocate component-specific types at the top of the file
- Use destructured props with defaults where appropriate

### Hooks

- Follow the [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- Extract reusable logic into custom hooks (`src/hooks/useXyz.ts`)
- Prefer `useCallback` for event handlers passed to children
- Prefer `useMemo` only for expensive computations — don't over-optimize
- Always include complete dependency arrays — no eslint-disable for exhaustive-deps

### State

- Use `useState` for local UI state
- Use `useReducer` for complex multi-field state
- Use React Context for global cross-cutting state (auth, theme)
- Avoid prop drilling >2 levels — use context or composition

### Pattern Preferences

- Composition over inheritance
- Render props or children functions for flexible slot patterns
- Early returns for guard clauses
- Conditional rendering with `&&` or ternary — avoid nested ternaries

### File Organization (within a component file)

```tsx
// 1. Imports
// 2. Types / Interfaces
// 3. Constants / tokens
// 4. Sub-components (if small and tightly coupled)
// 5. Main component
// 6. Export
```

---

## 6. STYLING — TAILWIND CSS & CSS STANDARDS

### Tailwind First

- Use Tailwind utility classes as the primary styling method
- Custom CSS only when Tailwind cannot express the style (complex animations, SVG filters)
- Never mix Tailwind with inline `style` unless dynamic values require it (e.g., GSAP-controlled colors)

### Theme & Design Tokens (tailwind.config.js)

- All brand colors defined as CSS custom properties in `src/index.css`
- Referenced in Tailwind config via `var(--color-brand-neon)` etc.
- Dark mode: `darkMode: 'class'` — toggled via `.dark` class on `<html>`
- Custom border radii: `shell: 32px`, `card: 24px`
- Fonts: `Inter` (body), `Sora` (headings), `Instrument Serif` (drama), `Fira Code` (mono/data)

### CSS Custom Properties (defined in `src/index.css`)

```css
--color-brand-neon:     #22c55e;
--color-brand-electric: #3b82f6;
--color-brand-primary:  #304DB5;
--bg-primary:           #ffffff;  /* light */  /  #0b1120;  /* dark */
--bg-secondary:         #f8fafc;  /* light */  /  #111827;  /* dark */
```

### CSS Rules

- Use `@tailwind base; @tailwind components; @tailwind utilities;` in `index.css`
- Custom keyframes go in `@layer base {}` in `index.css`
- Use modern CSS: Grid, Flexbox, custom properties, `dvh`/`svh` units, `backdrop-filter`
- Responsive design: mobile-first with Tailwind breakpoints (`sm:`, `md:`, `lg:`, `xl:`)
- Color values in components: use Tailwind tokens or hex via `bg-[#hex]` — never raw color names

### Avoid

- Global CSS that modifies third-party or Tailwind base styles without `@layer`
- `!important` — restructure specificity instead
- BEM class naming (Tailwind replaces this)
- Inline `<style>` tags in components

---

## 7. ANIMATION — GSAP & FRAMER MOTION

### GSAP (Primary for complex/scroll-driven)

- Register plugins at module scope: `gsap.registerPlugin(ScrollTrigger)`
- Wrap animations in `gsap.context()` inside `useEffect` and **always** call `ctx.revert()` on cleanup
- Use `ScrollTrigger` for scroll-based reveals
- Use `gsap.fromTo()` for entrance animations (explicit start & end states)
- Target elements via CSS class selectors (`.hero-title-1`) — avoid refs for batch animations
- Use `stagger` for sequential reveals across sibling elements

### Framer Motion (Secondary for layout/micro-interactions)

- Use for `AnimatePresence` route transitions and layout animations
- Use for hover/tap micro-interactions on small components
- Avoid mixing GSAP and Framer Motion on the same element

### Performance

- Animate only `transform` and `opacity` — avoid layout-triggering properties
- Use `will-change` sparingly and only on elements about to animate
- Set `ease: 'power3.out'` as the default easing curve for entrances

---

## 8. STATE MANAGEMENT & CONTEXT

### Context Providers (in `src/context/`)

| Context                    | Purpose                                        |
| -------------------------- | ---------------------------------------------- |
| `AuthContext.tsx`           | Supabase session, user auth state, role         |
| `UiPreferencesContext.tsx`  | Theme (dark/light), sidebar state, layout prefs |
| `UserContext.tsx`           | User profile data, avatar, display name         |

### Rules

- Context providers wrap the app in `App.tsx` or specific layout shells
- Each context file exports: `Provider` component + `useXyz()` custom hook
- Keep context values narrow — split large contexts into focused ones
- Never put derived/computed data in context — compute in consumers

---

## 9. ROUTING & NAVIGATION

### Router: React Router DOM v7

### Route Structure

```
/                           → LandingPage (public)
/login                      → unified login
/signup                     → student signup
/student/login              → student login
/coach/login                → coach login
/coach/apply                → coach application
/admin/login                → admin login

/student/*                  → StudentAppLayout (guarded)
/coach/*                    → CoachAppLayout (guarded)
/admin/*                    → AdminAppLayout (guarded)
/owner/*                    → PlatformOwnerAppLayout (guarded)
/org/*                      → OrgOwnerAppLayout (guarded)
/subcoach/*                 → SubCoachAppLayout (guarded)
/support/*                  → SupportStaffAppLayout (guarded)
/community/*                → CommunityManagerAppLayout (guarded)
/content/*                  → ContentEditorAppLayout (guarded)

/system/*                   → PublicSystemLayout (error pages, maintenance)
```

### Rules

- Every authenticated route is wrapped in `<RoleGuard requiredRole="..." />`
- Lazy-load page components with `React.lazy()` + `<Suspense>`
- Use `useNavigate()` for programmatic navigation — never `window.location`
- SPA rewrite handled by `vercel.json` (`"source": "/(.*)"` → `/index.html`)

---

## 10. SUPABASE & DATABASE STANDARDS

### Client

- Single Supabase client in `src/lib/supabaseClient.ts`
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Never expose service role key in frontend code

### Queries

- Use Supabase JS client: `.from('table').select()`, `.insert()`, `.update()`, `.delete()`
- Always handle errors: `const { data, error } = await supabase.from(...)`
- If `error`, throw or display — never silently ignore
- Use `.single()` when expecting one row
- Use `.order()`, `.limit()`, `.range()` for pagination

### Auth

- Use Supabase Auth for sign-up, login, password reset, session management
- Store user role in `profiles` table, not in JWT claims
- Check role on every guarded route via `RoleGuard` component
- Sign-out: `supabase.auth.signOut()` — clear local state after

### Tables Standard

- Use snake_case for table and column names (`coach_earnings`, `platform_fee`)
- Primary keys: `id uuid default gen_random_uuid()`
- Timestamps: `created_at timestamptz default now()`, `updated_at timestamptz`
- Foreign keys with ON DELETE CASCADE where appropriate
- Row Level Security (RLS) enabled on all user-facing tables
- Use PostgreSQL types: `text`, `numeric`, `timestamptz`, `uuid`, `jsonb`, `boolean`

---

## 11. ROLE-BASED ACCESS CONTROL (RBAC)

### Defined Roles (`src/types/roles.ts`)

```typescript
type UserRole =
  | "PLATFORM_OWNER"
  | "ADMIN"
  | "COACH"
  | "SUB_COACH"
  | "CONTENT_EDITOR"
  | "COMMUNITY_MANAGER"
  | "SUPPORT_STAFF"
  | "STUDENT"
  | "ORG_OWNER"
  | "UNASSIGNED";
```

### Rules

- Every authenticated page sits inside a role-specific layout
- `RoleGuard` component checks user role from `AuthContext` and redirects unauthorized users
- `RoleHeader` displays role-specific branding and navigation
- Pages should never check role inline — delegate to `RoleGuard`
- UNASSIGNED users see a prompt to complete onboarding

---

## 12. BRAND & DESIGN TOKENS

### Colors

| Token              | Hex         | Usage                          |
| ------------------ | ----------- | ------------------------------ |
| **Primary**        | `#304DB5`   | Buttons, links, accents        |
| **Neon**           | `#22c55e`   | Success, student portal, CTAs  |
| **Electric**       | `#3b82f6`   | Info, coach portal, secondary  |
| **Plasma**         | `#7B61FF`   | Admin portal, special accents  |
| **Deep Void**      | `#0A0A14`   | Landing page background        |
| **Surface**        | `#111120`   | Card backgrounds (dark mode)   |
| **Muted Text**     | `#8888AA`   | Secondary/muted text           |

### Typography

| Font              | Weight    | Usage                        |
| ----------------- | --------- | ---------------------------- |
| **Inter**         | 400–700   | Body text, UI labels         |
| **Sora**          | 400–800   | Headings, bold statements    |
| **Instrument Serif** | Regular + Italic | Dramatic accents, hero text |
| **Fira Code**     | 400–600   | Monospace, data, code blocks |

### Logo

- Component: `BrandLogo.tsx`, `BrandLockup.tsx`
- Asset: `src/assets/branding/nexskill-logo.png`
- Tagline: "Master Your Skill. Build Your Future."

---

## 13. ERROR HANDLING

### Strategy

- Central error utility in `src/utils/errorHandler.ts`
- All Supabase calls wrapped in try-catch or error-checked
- Error categories:
  - **Network errors**: timeouts, offline, 5xx — show retry prompt
  - **Auth errors**: expired session, unauthorized — redirect to login
  - **Validation errors**: bad input — show inline field messages
  - **Runtime errors**: unexpected nulls — log + show generic fallback

### Rules

- Never swallow errors silently — always log or display
- User-facing messages: friendly language ("Something went wrong. Please try again.")
- Developer-facing: full error objects logged to console in development
- Use React Error Boundaries for component-level crash recovery
- Global unhandled rejection listener: `window.addEventListener('unhandledrejection', ...)`

---

## 14. SECURITY

- **Sanitize all user-generated HTML** with DOMPurify before rendering
- **Never** use `dangerouslySetInnerHTML` without DOMPurify sanitization
- **Environment variables**: all secrets in `.env` (gitignored), accessed via `import.meta.env.VITE_*`
- **Supabase RLS**: enforce row-level security on all tables — never trust client-side role checks alone
- **No service role key** in frontend — all privileged operations through Supabase Edge Functions
- **Input validation**: validate on both client (UX) and server (Supabase RLS/triggers)
- **CSRF**: Supabase Auth handles token-based auth — no cookies to protect
- **Content Security Policy**: configure in `vercel.json` headers for production
- **Dependencies**: run `npm audit` regularly — address critical/high vulnerabilities
- Avoid `eval()`, `Function()`, and dynamic `import()` from user-controlled strings

---

## 15. ACCESSIBILITY (a11y)

- **Minimum**: WCAG 2.1 AA compliance; aim for AAA where feasible
- All form inputs must have associated `<label>` elements
- All interactive elements must be keyboard-accessible (focusable, operable via Enter/Space)
- Use semantic HTML: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`, `<button>` (not `<div onClick>`)
- Include `aria-label` or `aria-labelledby` on icon-only buttons
- Images: always provide `alt` text (empty `alt=""` for decorative only)
- Color contrast: minimum 4.5:1 for normal text, 3:1 for large text
- Focus indicators: visible focus ring on all interactive elements
- Screen reader testing: verify with NVDA or VoiceOver
- Audit with Lighthouse accessibility score target: **90+**

---

## 16. BROWSER COMPATIBILITY

- Support latest **2 stable releases** of: Chrome, Firefox, Edge, Safari (macOS + iOS)
- **No Internet Explorer** support
- Use feature detection over browser detection
- TypeScript target `ES2022` — Vite handles transpilation via esbuild
- Modern CSS features (Grid, `dvh`, `backdrop-filter`) are well-supported across targets
- Test responsive design at: 375px (mobile), 768px (tablet), 1024px (laptop), 1440px (desktop)

---

## 17. PERFORMANCE

### Bundling (Vite)

- Automatic code splitting via dynamic `import()`
- Lazy-load all page components with `React.lazy()`
- Tree-shaking enabled by default — use named imports
- Asset optimization: Vite handles CSS/JS minification

### Images

- Use modern formats: WebP, AVIF where possible
- Include `loading="lazy"` on below-fold images
- Use `srcset` and `sizes` for responsive images
- Store static assets in `public/` — Vite serves them directly

### Runtime

- Avoid re-renders: memoize expensive components with `React.memo`
- Virtualize long lists (>100 items) with a virtualization library
- Debounce search inputs and resize handlers
- Profile with React DevTools Profiler and Chrome Performance tab

### Targets

- Lighthouse Performance score: **85+**
- First Contentful Paint: **< 1.5s**
- Largest Contentful Paint: **< 2.5s**
- Cumulative Layout Shift: **< 0.1**

---

## 18. TESTING

### Scripts

```bash
npm test                    # Run all tests (frontend + backend)
npm run test:frontend       # Frontend tests only
npm run test:backend        # Backend tests only
```

### Rules

- Tests live in `tests/` directory
- Test runner: `tsx` (TypeScript execution)
- Test all critical paths: auth flow, enrollment, payments, role guarding
- Test Supabase queries with mock responses — don't hit production DB
- Every bug fix should include a regression test
- Before any PR merge: `npx tsc --noEmit` (0 errors) + `npx vite build` (success)

---

## 19. DOCUMENTATION

### Code Documentation

- **JSDoc** comments on all exported functions, hooks, and components
- Minimum docblock: `@param`, `@returns`, `@throws` (if applicable)
- Complex functions: include usage examples in JSDoc
- Inline comments only for non-obvious logic — don't comment the obvious

### Project Documentation (in `docs/`)

- `README.md` — project overview, setup, and usage
- `DEPLOYMENT.md` — Vercel deployment guide
- `DEMO_CREDENTIALS.md` — test accounts per role
- Role-specific docs: `STUDENT_ROLE.md`, `COACH_ROLE.md`, `ADMIN_ROLE.md`
- Feature docs: `COURSE_BUILDER_README.md`, `PERSONALIZATION_CONTROLS_README.md`
- Architecture: `SOURCE_CODE_INDEX.md` — file map and module descriptions

### Commit Messages

- Format: `type(scope): description`
- Types: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`
- Scope: component or module name (e.g., `coach`, `auth`, `landing`)
- Example: `feat(landing): add cinematic hero with GSAP animations`

---

## 20. DEPLOYMENT

### Platform: Vercel

### Config (`vercel.json`)

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### Build Pipeline

```bash
npm run build               # tsc -b && vite build
```

### Pre-Deploy Checklist

- [ ] `npx tsc --noEmit` — 0 TypeScript errors
- [ ] `npx vite build` — builds successfully
- [ ] `npm run lint` — 0 ESLint errors
- [ ] All environment variables set in Vercel dashboard
- [ ] Supabase RLS policies reviewed for new tables
- [ ] Tested on mobile and desktop breakpoints

### Environment Variables (Vercel)

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## 21. COPILOT EDIT WORKFLOW

### Mandatory Planning Phase

When working with large files (>300 lines) or complex changes:

1. **ALWAYS** create a detailed plan BEFORE making any edits
2. Plan must include:
   - All functions/sections that need modification
   - The order in which changes should be applied
   - Dependencies between changes
   - Estimated number of separate edits required

3. Format as:

```
## PROPOSED EDIT PLAN
Working with: [filename]
Total planned edits: [number]

### Edit sequence:
1. [First change] — Purpose: [why]
2. [Second change] — Purpose: [why]
...
```

4. **WAIT** for explicit user confirmation before making ANY edits

### Execution Phase

- After each edit, indicate progress: "Completed edit [#] of [total]. Ready for next edit?"
- If you discover additional needed changes: **STOP**, update the plan, get approval
- Focus on one conceptual change at a time
- Always verify the edit maintains the project's coding style

### Refactoring Guidance

- Break work into logical, independently functional chunks
- Ensure each intermediate state maintains functionality
- Consider temporary duplication as a valid interim step
- Always indicate the refactoring pattern being applied

### Rate Limit Avoidance

- For very large files, suggest splitting changes across multiple sessions
- Prioritize changes that are logically complete units
- Always provide clear stopping points

---

*Last updated: March 2026*
