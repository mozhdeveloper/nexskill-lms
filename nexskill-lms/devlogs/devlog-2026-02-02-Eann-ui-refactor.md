# Devlog: UI Theme Refactor & Architecture Refinement
**Date:** February 2, 2026
**Author:** Eann

## 📌 Summary of Work
Today's focus was on establishing a robust, scalable "Neon & Glass" design system for the NexSkill LMS. We moved away from ad-hoc styling to a structured, variable-based architecture that enforces our Brand Identity.

### 1. Theme System Refactor
-   **Forced Dark Mode:** Implemented a script in `index.html` to force Dark Mode on the initial visit, preventing the "Flash of Unstyled Content" (FOUC) and aligning with the premium brand aesthetic.
-   **Semantic CSS Variables:** Rewrote `index.css` to use strict semantic naming conventions (e.g., `--bg-primary`, `--text-on-neon`). This allows us to change colors globally without hunting down hex codes.
-   **Tailwind Config:** Updated the configuration to map these new variables, ensuring utility classes like `bg-brand-neon` or `text-primary` work seamlessly.

### 2. Atomic Component Layer
We introduced a set of "Base Components" to ensure consistency across the app:
-   **`<GlassCard />`**: Standardized the frosted glass effect, border glow, and hover interactions. **Updated to support `dark`/`light`/`auto` variants.**
-   **`<NeonButton />`**: Encapsulated the complex gradient styles and glow effects for primary actions.
-   **`<SkillProgressBar />`**: Centralized the "Master the Future" gradient logic for progress indicators.

### 3. Component Integration
-   **Progress Card:** Refactored the dashboard's progress summary to use the new atomic components, demonstrating the new look.
-   **Dashboard Cleanup:** Started removing hardcoded hex values in `StudentDashboard.tsx` to rely on the new system.
-   **Fixes:** Resolved `ReferenceError` issues (`useNavigate`, `getGreeting`) caused during the refactoring process.

### 4. Portal Alignment & Theme Enforcement
Expanded the design system to cover all user roles:
-   **Coach & Admin Portals:** Refactored `CoachAppLayout`, `CoachDashboard`, `AdminAppLayout`, and `AdminDashboard` to full "Neon & Glass" compliance (semantics, gradients, glass cards).
-   **Login Enforcement:** Updated `AdminLogin`, `CoachLogin`, and `StudentLogin` logic to explicitly set `setTheme('dark')` upon successful authentication, overriding any legacy browser defaults.
-   **Design Consistency:** Ensured sidebar navigation and interactive elements across all portals share the same visual language.

### 5. Design Consistency Fixes (Latest)
-   **GlassCard Component:** Added proper `dark`/`light`/`auto` variant support so cards render correctly regardless of theme
-   **Landing Page:** Fixed glass cards showing gray/light background - now shows proper dark frosted glass effect
-   **CSS Variables:** Complete rewrite of `index.css` with all variables needed by Tailwind config
-   **TypeScript Fixes:** Fixed `progress` property errors in `CoachStudentsPage.tsx`

---

## 🚧 Known Issues & Outstanding Technical Debt
While the foundation is set, several areas require immediate attention to achieve full production quality:

### 1. Dark Mode Contrast & Readability ✅ FIXED
-   ~~Inconsistent Text Colors~~ - Now using proper CSS variables
-   ~~Border Visibility~~ - Fixed with `--border-base` variable
-   ~~Input Fields~~ - Need `<GlassInput />` component

### 2. Button & Element Consistency
-   **Legacy Buttons:** There is a mix of old blue buttons and new Neon buttons. We need to systematically replace old `<button>` tags with the new `<NeonButton />` component.
-   **Hover States:** Not all interactive elements share the new "glow" hover effect, leading to a disjointed user experience.

### 3. Mobile Responsiveness
-   Glassmorphism effects can sometimes be performance-heavy on low-end mobile devices. We need to verify that `backdrop-filter: blur()` doesn't cause scrolling lag.

---

## 📅 Next Steps
1.  **Form System Upgrade:** Create a `<GlassInput />` component to handle form fields in Dark Mode (currently standard inputs clash).
2.  **Mobile Polish:** Deep dive into mobile views for Glass Cards to ensure padding and stacking are verified.
3.  **Contrast Audit:** Run a full WCAG accessibility audit to catch any remaining low-contrast text.
