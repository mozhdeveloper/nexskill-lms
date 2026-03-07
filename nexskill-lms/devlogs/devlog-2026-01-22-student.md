# Devlog: One-Time Onboarding Flow Implementation

**Date**: 2026-01-22

## Summary

Implemented a one-time onboarding flow that redirects new students to set their interests, goals, and skill level after first login. Uses existing database fields to track completion status.

## Core Implementation

### 1. Onboarding Detection (UserContext.tsx)

- Made `getDefaultRoute()` async to query database
- Checks if `student_profiles.current_skill_level` is NULL
- If NULL → redirect to `/auth/onboarding-preferences`
- If populated → go to dashboard

```typescript
// Check student_profiles.current_skill_level
if (!studentProfile || !studentProfile.current_skill_level) {
return '/auth/onboarding-preferences';
}
```

### 2. Onboarding Page (OnboardingPreferences.tsx)

**Created new page that:**
- Fetches interests and goals from database tables
- Lets users select multiple interests and goals
- Sets experience level (Beginner/Intermediate/Advanced)
- Saves to three tables:
  - `student_profiles.current_skill_level`
  - `student_interests` (junction table)
  - `student_goals` (junction table)

### 3. Bug Fixes

**Login.tsx:**
- Fixed async navigation: `await getDefaultRoute()` before calling `navigate()`

**StudentProfileView.tsx:**
- Changed `.single()` to `.maybeSingle()` to prevent 406 errors

## Database Tables Used

- `student_profiles` - stores `current_skill_level` (NULL = needs onboarding)
- `interests` - lookup table
- `goals` - lookup table
- `student_interests` - many-to-many junction
- `student_goals` - many-to-many junction

## User Flow

1. Student signs up → `current_skill_level` is NULL
2. First login → redirected to onboarding
3. Completes onboarding → `current_skill_level` set
4. Future logins → goes directly to dashboard

## Files Changed

### Modified Files:

1. **src/context/UserContext.tsx**

2. **src/pages/auth/Login.tsx**

3. **src/pages/student/StudentProfileView.tsx**


### Created Files:

4. **src/pages/auth/OnboardingPreferences.tsx** (NEW)
   - Complete onboarding form with three sections
   - Fetches interests/goals from database
   - Saves selections to junction tables
   - Auto-creates student_profile if needed
   - Includes skip functionality

## Key Technical Details

- Used existing `current_skill_level` field as completion flag (no new columns needed)
- Uses `.maybeSingle()` to avoid errors when records don't exist
- Auto-creates missing `student_profile` records during onboarding
- Database-backed approach (works across devices, unlike localStorage)

---

# Devlog: Interests & Goals Database Integration

**Date**: 2026-01-22

## Summary

Migrated interests and goals from hardcoded arrays to database-backed tag system with many-to-many relationships. Profile view and edit pages now fetch and save user selections to dedicated tables.

## Database Schema

### New Tables Created

**Lookup Tables (10 items each):**
- `interests` - Technology, Design, Business, Data, Engineering, Cybersecurity, AI, Finance, Media, Research
- `goals` - Get a Job, Build a Portfolio, Start a Side Project, Gain Experience, Improve Skills, Prepare for Internship, Career Exploration, Entrepreneurship, Get Certified, Freelancing

**Junction Tables:**
- `student_interests` - Links students to selected interests (many-to-many)
- `student_goals` - Links students to selected goals (many-to-many)

### RLS Policies

```sql
-- Everyone can view available options
CREATE POLICY "Everyone can view interests"
    ON public.interests FOR SELECT USING (is_active = true);

-- Users manage their own selections
CREATE POLICY "Users can insert own interests"
    ON public.student_interests FOR INSERT
    WITH CHECK (student_profile_id IN (
        SELECT id FROM public.student_profiles WHERE user_id = auth.uid()
    ));

-- Everyone can view all student interests (for profile browsing)
CREATE POLICY "Everyone can view all student interests"
    ON public.student_interests FOR SELECT USING (true);
```

### Helper View

- Created `student_profiles_with_details` view
- Aggregates profile with interests and goals as JSON arrays
- Simplifies querying student data with tags

## Frontend Changes

### StudentProfileView.tsx

- Removed hardcoded interests/goals arrays
- Added database queries to fetch user's selected tags via junction tables
- Removed unused `Interest` and `Goal` interfaces

```typescript
// Fetch interests
const { data: interestsData } = await supabase
  .from('student_interests')
  .select(`interest_id, interests (id, name)`)
  .eq('student_profile_id', profileData.id);
```

### StudentProfileEdit.tsx

**Added:**
- State for available interests/goals from database
- Fetch all active options on mount
- Load user's current selections

**Save logic:**
1. Save basic profile data
2. Delete old interest/goal selections
3. Map selected names to IDs
4. Insert new selections into junction tables

**TypeScript fixes:**
- Added explicit type for `onChange` callback
- Removed unused `profileId` state

## Files Changed

### Database:

1. **preference.sql** (NEW)
   - All 4 tables with indexes
   - RLS policies for security
   - Helper view for easy querying
   - Sample data for existing user

### Frontend:

2. **src/pages/student/StudentProfileView.tsx**
   - Fetch interests/goals from database
   - Display user's selected tags

3. **src/pages/student/StudentProfileEdit.tsx**
   - Load available options and user selections
   - Save changes to junction tables

## Key Technical Details

- Uses many-to-many relationships for flexible tag management
- RLS ensures users can only modify their own tags
- Public read access allows profile browsing
- `is_active` flag enables soft-deletion of deprecated tags
- `display_order` allows UI customization without code changes