# Devlog: Coach Application Workflow & UI Visualization
**Date**: 2026-01-22
**Author**: Eann

## 🚀 Summary
Today's session focused on implementing the end-to-end **Coach Application workflow**. This included setting up the database schemas for coach profiles, creating the "Unassigned" role verification flow, and building a high-fidelity application page with global visualization.

## ✅ Completed Tasks

### 1. Coach Application Feature
- **Global Visualization**: Implemented `CoachApplicationPage.tsx` featuring an interactive global heatmap using `react-simple-maps` to showcase the coach network.
- **Application Form**: Built a comprehensive multi-step form capturing bio, experience level, tools, and links.
- **Role Management**: 
  - Created the `UNASSIGNED` role in `UserRole` types.
  - Updated Auth flow to assign `unassigned` initially.
  - Added logic to explicitly update `middle_name` and `username` in `public.profiles` upon application submission.
- **Verification Flow**: Created a `VerificationPending` landing page for applicants to wait for admin approval.

### 2. Layout & Build Fixes
- **Layout Adjustments**: Updated `StudentAuthLayout.tsx` to support a `full` maxWidth property (`maxWidth="full"`), allowing the heatmap to stretch edge-to-edge.
- **Build Fixes**: Resolved a build error involving `react-simple-maps` by installing the missing `prop-types` peer dependency.

### 3. Database Schema Updates
- **Coach Profiles**: Added `coach_profiles` table to store professional details.
- **Profile Enhancements**: Added `middle_name` and `name_extension` column to the public `profiles` table to support strict identity requirements.

## 🔮 Recommendations / Next Steps
- **Automated Verification Emails**: Implement a backend trigger (Supabase Edge Function) to handle the "Pending" to "Verified" status change.
  - **Action**: When an admin verifies a user, the system should automatically send an email to the coach.
  - **Content**: The email should confirm their acceptance and provide an **activation link** or login prompt to access their new Coach Dashboard.

## 📦 Dependencies Added
Run `npm install` to ensure you have the following packages:
- `react-simple-maps`: For the coach distribution visualization.
- `prop-types`: Required peer dependency for the maps library.

## 📂 Modified Files
### New Files
- `src/pages/coach/CoachApplicationPage.tsx`
- `src/pages/auth/VerificationPending.tsx`
- `supabase/migrations/20240122_coach_profiles.sql`
- `supabase/migrations/20240122_coach_profiles_refinement.sql`

### Modified Files
- `src/App.tsx`
- `src/types/db.ts` (Added Profile fields)
- `src/types/roles.ts` (Added UNASSIGNED)
- `src/layouts/StudentAuthLayout.tsx` (Added 'full' width support)
- `src/pages/auth/SignUp.tsx`

## 📝 Notes
- **Legacy Peer Deps**: Continued using `--legacy-peer-deps` to ensure compatibility with existing project dependencies.