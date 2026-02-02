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
-   **`<GlassCard />`**: Standardized the frosted glass effect, border glow, and hover interactions.
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

---

## 🚧 Known Issues & Outstanding Technical Debt
While the foundation is set, several areas require immediate attention to achieve full production quality:

### 1. Dark Mode Contrast & Readability
-   **Inconsistent Text Colors:** Some legacy components still use hardcoded grays (e.g., `text-gray-500`) that wash out against the new deep charcoal background (`#0f172a`). We need to migrate *all* text to use `--text-secondary` or `--text-muted`.
-   **Border Visibility:** The subtle borders on some existing cards might be too faint in Dark Mode. The new `--border-base` variable needs to be applied universally.
-   **Input Fields:** Form inputs across the app likely still use default white backgrounds or borders that clash with the new Dark Mode theme.

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
