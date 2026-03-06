# Devlog: Sub-Coach Assignment Feature Implementation
**Date:** February 2, 2026  
**Author:** Eann  
**Status:** 🟡 In Progress (Paused)

---

## Summary

Implemented the frontend for the Sub-Coach Assignment feature, including database schema design, SQL migration script, and modal updates to use real Supabase data.

---

## What Was Done

### 1. Database Schema Design
Created 3 new tables for the sub-coach feature:

| Table | Purpose |
|-------|---------|
| `sub_coach_assignments` | Links sub-coaches to courses they help with |
| `sub_coach_requirements` | Optional prerequisite courses required to qualify |
| `sub_coach_student_allocations` | Which students are managed by which sub-coach |

**Migration file:** `supabase/migrations/20260202_sub_coach_tables.sql`

### 2. Updated `SubCoachAssignmentModal.tsx`
- **Completely rewrote** to fetch real data from Supabase instead of hardcoded dummy data
- Step 1: Loads coach's courses from database ✅
- Step 2: Made requirements **optional** (coaches can skip) ✅
- Step 3: Queries enrolled students from coach's courses ✅
- Step 4: Loads enrolled students for selected course ✅
- Added loading states and error handling ✅

### 3. Updated `SubCoachManagement.tsx`
- Fixed `handleAssignSubCoach` to insert:
  - Main assignment into `sub_coach_assignments`
  - Requirements into `sub_coach_requirements` (if any)
  - Student allocations into `sub_coach_student_allocations`
- Fixed query to remove non-existent `code` column from courses table

### 4. Fixed `CoachStudentsPage.tsx`
- Removed orphaned `addLog` function calls that caused `ReferenceError`

### 5. Updated `DATABASE_SCHEMA.md`
- Added new **Category 9: Sub-Coach Management** section
- Added ERD diagram for sub-coach tables
- Updated table count to 41 tables
- Added 3 new tables to Quick Reference

---

## Known Issues (To Be Fixed Later)

### Issue 1: Enrolled Students Count Shows 0
**Location:** `SubCoachManagement.tsx` / `SubCoachAssignmentModal.tsx`  
**Problem:** In Step 1 of the modal, courses show "0 students" even when there are enrolled students.  
**Root Cause:** The `enrolledStudents` count is currently hardcoded to 0 - needs to query `enrollments` table.

### Issue 2: TypeScript Error in CoachStudentsPage
**Location:** `CoachStudentsPage.tsx:111`  
**Error:** `Property 'progress' does not exist on type '{ profile_id: any; course_id: any; enrolled_at: any; }'.`  
**Root Cause:** The code references `e.progress` but the `enrollments` table only has `profile_id`, `course_id`, and `enrolled_at` columns.

### Issue 3: SQL Migration Not Yet Run
**Location:** Supabase  
**Problem:** The 3 new tables don't exist yet in the database.  
**Action Required:** Run `supabase/migrations/20260202_sub_coach_tables.sql` in Supabase SQL Editor.

---

## Files Changed

| File | Change Type |
|------|-------------|
| `supabase/migrations/20260202_sub_coach_tables.sql` | **NEW** |
| `src/components/coach/subcoach/SubCoachAssignmentModal.tsx` | MODIFIED (rewritten) |
| `src/pages/coach/SubCoachManagement.tsx` | MODIFIED |
| `src/pages/coach/CoachStudentsPage.tsx` | MODIFIED |
| `docs/DATABASE_SCHEMA.md` | MODIFIED |

---

## Next Steps

1. [ ] Fix enrolled students count to show real data
2. [ ] Fix TypeScript error for `progress` property
3. [ ] Run SQL migration in Supabase
4. [ ] Test full sub-coach assignment flow
5. [ ] Add sub-coach dashboard views
