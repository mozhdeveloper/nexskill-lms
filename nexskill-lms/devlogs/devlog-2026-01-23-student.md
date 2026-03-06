🛠️ Devlog: Authentication Flow & Profile Setup
Date: January 23, 2026
1. 🎨 Onboarding UI Improvements

Wider Layout: Increased maximum content width for better breathing room on larger screens
Inline Search: Replaced modal dialogs with inline search dropdowns for Interests and Goals selection
Modern Experience Buttons: Removed emoji icons, switched to pill-shaped buttons with gradient highlights
Cleaner Design: Streamlined overall visual hierarchy for improved user flow

2. 🐛 Profile Display Bug Fix

Issue: Profile view crashed when current_skill_level was null (skipped onboarding)
Fix: Updated profile display to handle null skill level gracefully with fallback text instead of crashing

3. 🔄 Simplified Authentication Logic

Previous Logic: Checked both profile existence AND skill level completion for onboarding redirect
New Logic: Simplified to check only if student_profiles entry exists

Profile exists → Dashboard
Profile missing → Onboarding


Result: Cleaner conditional flow, easier to maintain

4. ✨ Skip Functionality Refinement

Previous Behavior: Skip button created profile with default current_skill_level = 'Intermediate'
New Behavior: Skip button creates blank profile (all preference fields remain NULL)
User Experience: Users can truly defer profile setup and complete it later via Edit Profile page
Data Integrity: Onboarding completion now determined solely by profile record existence, not field values

5. 📝 Profile Edit Page Enhancement

Capability: Full CRUD operations for interests, goals, and skill level
Integration: Properly syncs with junction tables (student_interests, student_goals)
Flexibility: Users can update preferences anytime after initial onboarding