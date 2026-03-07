# Devlog - 2026-01-27 (Eann)

## Overview

Today's work focused on two main tasks:
1. **Task 1**: Separate Login Portals for Student, Coach, and Admin (pushed to `feat/separate-login-portals` branch - merged)
2. **Task 2**: Course Curriculum View Integration (pushed to `feat/course-curriculum-page` branch - WIP)

---

## Task 1: Separate Login Portals

### Branch: `feat/separate-login-portals` (MERGED to develop)

### Changes Made

#### New Login Pages
- **StudentLogin.tsx**: Created dedicated student login with blue theme and education imagery
- **CoachLogin.tsx**: Created dedicated coach login with role verification
- **Updated AdminLogin.tsx**: Added links to Student Access and Coach Access

#### Layout Updates
- **StudentAuthLayout.tsx**: 
  - Updated background image to education with laptop/computer
  - Added white background for logo visibility
  - Improved stats card styling on left panel

#### Routing Changes
- **App.tsx**:
  - Changed default route `/` to redirect to `/student/login`
  - Added `/login` redirect to `/student/login` (removed generic Login)
  - Added `/student/login` and `/coach/login` routes

#### Role Verification
- Each portal verifies user role after login
- Incorrect portal access shows error and signs user out
- Proper redirects based on role (STUDENT → student dashboard, COACH → coach dashboard)

---

## Task 2: Course Curriculum View

### Branch: `feat/course-curriculum-page` (NOT FINAL - WIP)

### New Files Created

#### Hook: `useCourseCurriculum.ts`
Location: `src/hooks/useCourseCurriculum.ts`

Purpose: Fetch complete course curriculum with modules and content items

Exports:
- `useCourseCurriculum(courseId)` - Main hook
- `LessonItem` - Interface for lessons
- `QuizItem` - Interface for quizzes
- `ContentItem` - Union type (LessonItem | QuizItem)
- `ModuleWithContent` - Interface for modules with items
- `CourseInfo` - Interface for course metadata
- `CourseCurriculumData` - Full curriculum data structure

Features:
- Fetches course info from `courses` table
- Fetches modules ordered by position
- Fetches content items via `module_content_items` junction table
- Joins with `lessons` and `quizzes` tables for details
- Returns total lessons, quizzes, and duration

#### Page: `CourseCurriculumPage.tsx`
Location: `src/pages/student/CourseCurriculumPage.tsx`

Route: `/student/courses/:courseId/curriculum`

Features:
- Course header with title, subtitle, stats (modules, lessons, quizzes, duration)
- Module accordion list (expandable/collapsible)
- Lesson/quiz items with type icons (🎥 for lessons, 📝 for quizzes)
- Duration display formatted as hours/minutes
- "Expand All" and "Collapse All" buttons
- "Start Learning" button to navigate to first lesson
- Breadcrumb navigation
- Loading and error states

Components:
- `CourseCurriculumPage` - Main page component
- `ModuleAccordion` - Collapsible module component

### Files Modified

#### App.tsx
- Added import for `CourseCurriculumPage`
- Added route: `/student/courses/:courseId/curriculum`

#### CourseDetailRefactored.tsx
- Replaced "📚 Curriculum coming soon" placeholder
- Added "📚 View Curriculum" button for enrolled students
- Shows "Enroll to access curriculum" message for non-enrolled users

---

## Bug Fixes

### Fix 1: SignUp.tsx - getDefaultRoute await
- **Issue**: `navigate(getDefaultRoute())` caused TypeScript error
- **Cause**: `getDefaultRoute()` returns `Promise<string>`, not `string`
- **Solution**: Added `await` - `const defaultRoute = await getDefaultRoute(); navigate(defaultRoute);`

### Fix 2: Type-only imports for verbatimModuleSyntax
- **Issue**: `ModuleWithContent` and `ContentItem` imports caused error
- **Cause**: `verbatimModuleSyntax` requires types to use `import type`
- **Solution**: Separated imports:
  ```tsx
  import { useCourseCurriculum } from '../../hooks/useCourseCurriculum';
  import type { ModuleWithContent, ContentItem } from '../../hooks/useCourseCurriculum';
  ```

### Fix 3: Vite cache causing stale module error
- **Issue**: "ContentItem is not exported" error despite export existing
- **Cause**: Vite cached old version of the module
- **Solution**: Cleared `node_modules/.vite` cache and restarted dev server

---

## Git History

```
Branch: feat/separate-login-portals (merged to develop)
- feat: separate login portals for student and coach
- UI improvements for auth layouts

Branch: feat/course-curriculum-page (active)
- feat: add course curriculum page [NOT FINAL - WIP]
  - Added useCourseCurriculum hook
  - Added CourseCurriculumPage with module accordions
  - Added View Curriculum button to CourseDetailRefactored
  - Fixed type imports for verbatimModuleSyntax
  - Fixed getDefaultRoute await in SignUp.tsx
```

---

## Next Steps

1. Test curriculum page with real course data
2. Add user progress tracking to curriculum view
3. Implement lesson completion status indicators (✓ completed, locked, etc.)
4. Add module/lesson progress persistence
5. Finalize and merge to develop

---

# Devlog - 2026-01-28 (Eann)

## Overview

Today's work focused on refining the UI to achieve a "Balanced & Professional" and "Bold, Wide, & Centered" aesthetic, alongside strict form validation.
1. **Task 1**: UI Refinement (Landing Page, Sign-Up, Coach App)
2. **Task 2**: Form Validation & Logic Improvements

## Task 1: Balanced & Professional UI Refinement

### Changes Made

#### Landing Page (`src/pages/LandingPage.tsx`)
- **Header Navigation**:
  - Pushed elements to edges with **5% padding**.
  - **Logo**: Far left | **Buttons**: Far right.
  - Removed centering to reduce "cramped" feel.
- **Hero Section**:
  - **Scale**: Content now occupies **85-90%** of screen width.
  - **Typography**: Headlines increased to `text-6xl - text-9xl`.
  - **Composition**: Text group (left) and Portal Cards (right) balanced to feel expansive.
  - **Cards**: Scaled up portal cards for better interactivity.

#### Student Sign-Up (`src/pages/auth/SignUp.tsx`)
- **Visuals (Left Column)**:
  - Vertically and horizontally centered content.
  - "Future-Proof" headline significantly larger.
  - High-quality background visual placeholder.
- **Form (Right Column)**:
  - **Wide Container**: Increased max-width to `600px` (was cramped mobile size).
  - **Tall Inputs**: Inputs set to `h-14` (approx 56px) for a "chunky", premium feel.
  - **Spacing**: Increased gap between fields to `gap-6`.
  - **Navigation**: Added "Already have an account? Log In" link at the very bottom.

#### Coach Application (`src/pages/coach/CoachApplicationPage.tsx`)
- **Visuals (Left Column)**:
  - **Map Feature**: Global map integrated as a "featured" element rather than a full-height background.
  - **Typography**: "Share Your Knowledge" headline centered and bold.
- **Form (Right Column)**:
  - Applied consistency with Student form (Wide `600px`, Tall `h-14` inputs).
  - Consolidated padding and spacing.

## Task 2: Form Refinements & Validation

### Changes Made

#### New Fields
- **Middle Name**: Added as a **REQUIRED** field to both Student and Coach forms.
- **Name Extension**: Added as an **OPTIONAL** field (Jr., Sr., III, etc.).

#### UX Improvements
- **Explicit Labels**: Added bold, uppercase text labels above all input fields.
- **Pivot Links**: Easy navigation between "Student Sign-Up" and "Coach Application".

#### Strict Visual Validation ("Red Border" Logic)
- **Logic**:
  - Validation triggers **only** after submission attempt (`hasAttemptedSubmit` state).
  - Empty required fields immediately turn **Red** (`border-red-500 bg-red-500/5`).
  - **Real-time Correction**: Typing in a red field immediately clears the error state.
- **Feedback**:
  - Validated on submit.
  - Re-evaluated on every keystroke to provide instant positive feedback (removing the red).

### Files Modified
- `src/pages/LandingPage.tsx`
- `src/pages/auth/SignUp.tsx`
- `src/pages/coach/CoachApplicationPage.tsx`
