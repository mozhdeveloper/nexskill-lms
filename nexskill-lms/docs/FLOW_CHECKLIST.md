# NexSkill LMS — Flow Completeness Checklist

> Generated: March 10, 2026 (updated after full MVP audit)  
> Stack: React 19 + TypeScript + Vite + Tailwind CSS + Supabase  
> **All 5 new DB tables created** — `discussion_threads`, `discussion_replies`, `coaching_bookings`, `user_memberships`, `transactions`  
> RLS: disabled (MVP)  
> Status legend: ✅ Complete · ⚠️ Minor gap · ❌ Stub / Coming Soon

---

## Auth & Onboarding (both roles)

| # | Step | Component | Status | Notes |
|---|------|-----------|--------|-------|
| 1 | Student sign up | SignUp.tsx | ✅ | `supabase.auth.signUp()` + `profiles.upsert()` (role=student) |
| 2 | Email verification | EmailVerification.tsx | ✅ | OTP verify → redirects to onboarding |
| 3 | Student onboarding | OnboardingPreferences.tsx | ✅ | Creates `student_profiles` + interests/goals; skip option works |
| 4 | Student login | StudentLogin.tsx | ✅ | `signInWithPassword` + role check; demo login auto-creates accounts |
| 5 | Coach application | CoachApplicationPage.tsx | ✅ | `profiles.upsert()` + `coach_profiles.insert()` (was `.update()` — **fixed**) |
| 6 | Coach login | CoachLogin.tsx | ✅ | Role check rejects non-coaches; demo login works |

**Auth verdict: ✅ Both student and coach can sign up, verify, and log in.**

---

## Student Flow

### Core Learning Loop (Browse → Enroll → Learn → Quiz → Certificate)

| # | Step | Route | Page | Status | Notes |
|---|------|-------|------|--------|-------|
| 1 | Browse courses | `/student/courses` | CourseCatalog | ✅ | Fetches all courses via `useCourses` hook. Rating & student count are placeholder `0`. |
| 2 | Course detail | `/student/courses/:id` | CourseDetailRefactored | ✅ | Full Supabase: course, enrollment, wishlist, lesson progress, quiz progress. |
| 3 | View curriculum | `/student/courses/:id/curriculum` | CourseCurriculumPage | ✅ | Uses `useCourseCurriculum`; checks enrollment status from DB. |
| 4 | Lesson player | `/student/courses/:id/lessons/:lessonId` | CoursePlayer | ✅ | Fetches lesson + content_blocks, marks completion in `user_lesson_progress`. |
| 5 | Start quiz | `/student/courses/:id/quizzes/:qId` | QuizStart | ✅ | Reads quiz meta, question count, and attempt count from DB. |
| 6 | Take quiz | `/student/courses/:id/quizzes/:qId/take` | QuizSession | ✅ | Loads questions, submits answers to `quiz_attempts`. |
| 7 | Quiz result | `/student/courses/:id/quizzes/:qId/result` | QuizResult | ✅ | Fetches latest attempt + passing score from DB. |
| 8 | Certificates list | `/student/certificates` | CertificatesList | ✅ | Derives certificates from fully-completed courses via enrollment + progress joins. |
| 9 | Certificate detail | `/student/certificates/:id` | CertificateDetail | ✅ | Verifies completion via lesson progress DB query. |
| 10 | Certificate verify | `/certificates/verify/:hash` | CertificateVerify | ✅ | Parses hash → profile + course, verifies enrollment in DB. |

**Core loop verdict: ✅ Fully complete — all 10 steps have real Supabase data.**

---

### Dashboard & Profile

| # | Feature | Route | Page | Status | Notes |
|---|---------|-------|------|--------|-------|
| 11 | Dashboard | `/student/dashboard` | StudentDashboard | ✅ | Uses `useEnrolledCourses`, `useLiveSessions`, `useCourseProgress` hooks. |
| 12 | Profile view | `/student/profile` | StudentProfileView | ✅ | Fetches `student_profiles`, `student_interests`, `student_goals`. |
| 13 | Profile edit | `/student/profile/edit` | StudentProfileEdit | ✅ | Reads/writes interests, goals, profile photo via Supabase. |
| 14 | Onboarding | `/student/onboarding-preferences` | OnboardingPreferences | ✅ | Fetches lookup tables + saves selections to DB. |

---

### Community & Messaging

| # | Feature | Route | Page | Status | Notes |
|---|---------|-------|------|--------|-------|
| 15 | Discussion board | `/student/community` | DiscussionBoard | ✅ | Fetches/creates threads in `discussion_threads`. |
| 16 | Thread view | `/student/community/threads/:id` | ThreadView | ✅ | Fetches thread + replies; posts replies. |
| 17 | Course circle | `/student/courses/:id/circle` | CourseCircle | ✅ | Real-time chat via `useMessages` + `useConversations`. |
| 18 | Messages | `/student/messages` | StudentMessagesPage | ✅ | Real-time Supabase messaging with coaches. |

---

### Coaching (1:1 Sessions)

| # | Feature | Route | Page | Status | Notes |
|---|---------|-------|------|--------|-------|
| 19 | Browse coaches | `/student/coaching` | CoachingCalendar | ✅ | Fetches coaches from `profiles` (role=coach) + `coach_profiles`. |
| 20 | Coach profile | `/student/coaching/coaches/:id` | CoachProfile | ✅ | Reads profile + course count + enrollment count from DB. |
| 21 | Book session | `/student/coaching/coaches/:id/book` | CoachingBooking | ✅ | Generates availability, checks existing bookings, inserts to `coaching_bookings` + `transactions`. |
| 22 | My sessions | `/student/coaching/sessions` | CoachingSessions | ✅ | Fetches `coaching_bookings` for student with coach profile join. |

---

### Membership & Billing

| # | Feature | Route | Page | Status | Notes |
|---|---------|-------|------|--------|-------|
| 23 | Membership plans | `/student/membership` | MembershipPlans | ⚠️ | Fetches current tier from `user_memberships`. Plan definitions are static config (expected). |
| 24 | Manage plan | `/student/membership/manage` | MembershipManage | ⚠️ | Upserts `user_memberships` + inserts `transactions` on confirm. Plan configs static. |
| 25 | Confirmation | `/student/membership/confirmation` | MembershipConfirmation | ⚠️ | Reads `transactionId` from router state. Purely presentational by design — no separate DB fetch needed. |
| 26 | Billing history | `/student/settings/billing` | StudentBilling | ✅ | Fetches `transactions` for billing history. Payment methods still `[]` (no payment API yet). |

---

### Live Classes

| # | Feature | Route | Page | Status | Notes |
|---|---------|-------|------|--------|-------|
| 27 | Live classes list | `/student/live-classes` | LiveClasses | ✅ | Uses `useLiveSessions` hook; fetches enrollment counts. |
| 28 | Live classroom | `/student/live-class/:id` | LiveClassRoom | ⚠️ | Session info from DB. "Topics Covered" section has hardcoded text. |

---

### AI Coach

| # | Feature | Route | Page | Status | Notes |
|---|---------|-------|------|--------|-------|
| 29 | AI Coach home | `/student/ai-coach` | AICoachHome | ⚠️ | Enrolled courses + progress from DB. `streakDays`, `upcomingDeadlines`, `averageQuizScore` hardcoded to `0`. |

---

### Settings

| # | Feature | Route | Page | Status | Notes |
|---|---------|-------|------|--------|-------|
| 30 | Settings | `/student/settings` | StudentSettings | ⚠️ | Email from `supabase.auth`. Preferences (notifications, privacy, accessibility) persisted to `localStorage` only, not DB. |
| 31 | Account settings | `/student/settings/account` | StudentAccountSettings | ⚠️ | Same as above — `localStorage` for interests/goals/language. |

---

## Coach Flow

### Course Management (Create → Build → Publish)

| # | Feature | Route | Page | Status | Notes |
|---|---------|-------|------|--------|-------|
| 1 | Dashboard | `/coach/dashboard` | CoachDashboard | ⚠️ | Course/student/enrollment stats all real. **Revenue section hardcoded `$0`** with "Payment integration coming soon" banner. |
| 2 | Course list | `/coach/courses` | CourseList | ✅ | Full Supabase: courses, verification, modules, enrollment counts, reviews. |
| 3 | Create course | `/coach/courses/new` | CourseCreate | ✅ | Fetches categories, inserts new course to DB. |
| 4 | Course builder | `/coach/courses/:id/edit` | CourseBuilder | ✅ | Full CRUD: settings, modules, lessons, quizzes, live sessions, pricing, publishing. |
| 5 | Course students | `/coach/courses/:id/students` | CourseStudents | ✅ | Enrollments, profiles, lesson progress, quiz scores — all DB. |

**Course management verdict: ✅ Complete (revenue display is the only gap).**

---

### Earnings & Revenue

| # | Feature | Route | Page | Status | Notes |
|---|---------|-------|------|--------|-------|
| 6 | Earnings dashboard | `/coach/earnings` | EarningsDashboard | ✅ | Fetches course-purchase + coaching-session transactions. Computes revenue summary, monthly payouts, transaction history. |

---

### Students & Communication

| # | Feature | Route | Page | Status | Notes |
|---|---------|-------|------|--------|-------|
| 7 | All students | `/coach/students` | CoachStudentsPage | ✅ | Courses → enrollments → profiles → progress → quiz scores. |
| 8 | Messages | `/coach/messages` | CoachMessagesPage | ✅ | Real-time Supabase messaging with students. |
| 9 | Quizzes | `/coach/quizzes` | CoachQuizzesPage | ✅ | Full chain: courses → modules → items → quizzes → questions → attempts. |

---

### Certificates & Sub-Coaches

| # | Feature | Route | Page | Status | Notes |
|---|---------|-------|------|--------|-------|
| 10 | Certificate templates | `/coach/certificates` | CoachCertificatesPage | ✅ | CRUD on `certificate_templates` table. |
| 11 | Sub-coach management | `/coach/subcoach-management` | SubCoachManagement | ✅ | Reads/writes `sub_coach_assignments` with profile joins. |

---

### Coach Profile & Settings

| # | Feature | Route | Page | Status | Notes |
|---|---------|-------|------|--------|-------|
| 12 | Profile | `/coach/profile` | CoachProfilePage | ✅ | Full Supabase: `profiles`, `coach_profiles`, `courses`, `enrollments`, `reviews`. |
| 13 | Settings | `/coach/settings` | CoachSettings | ⚠️ | Email from auth. Preferences (notifications, privacy) are `localStorage` only. |

---

### Coaching Tools & AI Tools

| # | Feature | Route | Page | Status | Notes |
|---|---------|-------|------|--------|-------|
| 14 | Coaching tools | `/coach/coaching-tools` | CoachingToolsHub | ❌ | **No Supabase at all.** Availability calendar, booking types, session log — all hardcoded local state. KPIs = `0`. |
| 15 | AI course tools | `/coach/ai-tools` | AICourseToolsHome | ❌ | **Full page "Coming Soon"** with blurred cards. Zero data integration. |

---

## New Database Tables

All tables verified present in the live Supabase DB as of March 10, 2026.

| Table | Used By | Status |
|-------|---------|--------|
| `discussion_threads` | DiscussionBoard, ThreadView | ✅ Created |
| `discussion_replies` | ThreadView | ✅ Created |
| `coaching_bookings` | CoachingBooking, CoachingSessions, EarningsDashboard | ✅ Created |
| `user_memberships` | MembershipPlans, MembershipManage | ✅ Created |
| `transactions` | CoachingBooking, MembershipManage, StudentBilling, EarningsDashboard | ✅ Created |

---

## Scoreboard

### Student (31 pages)

| Status | Count | % |
|--------|-------|---|
| ✅ Complete | 23 | 74% |
| ⚠️ Partial | 7 | 23% |
| ❌ Stub | 1 | 3% |

### Coach (15 pages)

| Status | Count | % |
|--------|-------|---|
| ✅ Complete | 10 | 67% |
| ⚠️ Partial | 3 | 20% |
| ❌ Stub | 2 | 13% |

---

## Remaining Gaps (by priority)

### Must-fix (blocks live demo)
- [x] ~~**Run SQL migration** — 5 new tables~~ → All 5 tables created ✅
- [x] ~~**CoachApplicationPage `profiles.update()` bug** — silently failed for new coaches~~ → Fixed to `profiles.upsert()` ✅
- [x] ~~**CoachingSessions broken join** — ambiguous FK + missing path~~ → Fixed with `profiles!coaching_bookings_coach_id_fkey(...)` ✅

### Nice-to-fix (cosmetic / minor)
- [ ] **CoachDashboard** — Revenue section shows `$0`; wire to `transactions` table (same query as EarningsDashboard)
- [ ] **CourseCatalog** — `rating` and `studentsCount` per course show `0`; could count from `enrollments` + `reviews`
- [ ] **AICoachHome** — `streakDays`, `upcomingDeadlines`, `averageQuizScore` hardcoded to `0`
- [ ] **LiveClassRoom** — "Topics Covered" section uses hardcoded mock text
- [ ] **StudentBilling** — Payment methods section shows empty `[]` (expected until payment API)

### Won't-fix (by design for MVP)
- [ ] **MembershipConfirmation** — Presentational page; reads from router state, no separate DB fetch needed
- [ ] **CoachingToolsHub** — Coach-side session management dashboard; separate feature sprint
- [ ] **AICourseToolsHome** — AI-powered tools; intentionally "Coming Soon"
- [ ] **StudentSettings / CoachSettings** — Preferences stored in `localStorage`; DB-backed settings is a future feature
- [ ] **StudentAccountSettings** — Same as above
