# NexSkill UI Style Guide & Vision
**Version:** 1.0 (Refined "Neon & Glass" Identity)
**Last Updated:** February 2, 2026

## 🌟 The Vision: "Master the Future"
NexSkill is not just an LMS; it is a futuristic platform for elite growth. Our UI reflects this with a **Premium, High-Tech, and Dynamic** aesthetic. It feels alive, clean, and motivating.

**Key Aesthetic Pillars:**
1.  **Deep Immersion:** Dark backgrounds that feel infinite, not just "off".
2.  **Neon Energy:** Accent colors that pop like lasers to guide attention (Neon Green & Electric Blue).
3.  **Glass Material:** Layers of transparency to create depth and hierarchy without clutter.

---

## 🎨 Color System (Semantic Tokens)

### 1. The "Energy" Palette (Accents)
Used for primary actions, success states, and high-impact gradients.
*   **Neon Green:** `#22c55e` (Tailwind: `green-500`)
    *   *Usage:* Primary call-to-action borders, success indicators, "Mastery" highlights.
    *   *Text Rule:* ALWAYS use **Black** text on Neon Green backgrounds for contrast.
*   **Electric Blue:** `#3b82f6` (Tailwind: `blue-500`)
    *   *Usage:* Secondary actions, links, information highlights.
*   **The Master Gradient:** `linear-gradient(135deg, #22c55e 0%, #3b82f6 100%)`
    *   *Usage:* Buttons, Progress Bars, Active Tabs, Text Gradients (Headings).

### 2. The "Void" Palette (Backgrounds)
Used to create a deep, immersive canvas.
*   **App Background:** `var(--bg-primary)` -> `#0f172a` (Deep Charcoal/Midnight)
*   **Card Background:** `var(--bg-secondary)` -> `#1e293b` (Slate Blue-Grey)
    *   *Note:* Always used with some transparency (alpha 0.7) for Glassmorphism.

### 3. The "Signal" Palette (Text)
Strictly enforced for WCAG AA Accessibility.
*   **Text Primary:** `var(--text-primary)` -> `#f8fafc` (Off-white) - *Body text, Headings.*
*   **Text Secondary:** `var(--text-secondary)` -> `#cbd5e1` (Light Grey) - *Labels, Descriptions.*
*   **Text Muted:** `#94a3b8` (Slate Grey) - *Placeholders, Disabled states.*

### 4. Theme Enforcement & Defaulting
To ensure a consistent "High-Tech" feel, the platform enforces specific defaults:
*   **First Visit:** Defaults to **Dark Mode** via `index.html` script injection.
*   **Login Success:** Explicitly sets/resets preference to **Dark Mode** upon successful authentication for Student, Coach, and Admin roles.
*   **Storage:** Persists `ui-theme: 'dark'` in `localStorage`.

---

## 💎 Design Patterns

### 1. Glassmorphism (The Container)
All content containers must use the "Glass Connectivity" principle. They should look like floating panes of frosted glass.

**CSS Utility:** `.glass-card`
*   **Background:** Dark Slate with 70% Opacity.
*   **Blur:** `backdrop-filter: blur(12px)`
*   **Border:** 1px solid White (10% opacity).
*   **Hover State:** Glow effect with Neon Green border tint.

### 2. Neon Buttons (The Actions)
Buttons are not just colored rectangles; they are energy sources.

**Primary Button (`<NeonButton variant="primary" />`)**
*   **Fill:** Master Gradient (Green to Blue).
*   **Shadow:** Colored drop-shadow (`rgba(34,197,94,0.4)`).
*   **Hover:** Brightness increases, shadow expands.

**Secondary Button (`<NeonButton variant="secondary" />`)**
*   **Fill:** Transparent.
*   **Border:** 2px Electric Blue.
*   **Text:** Electric Blue (turns White on hover).

### 3. Typography
*   **Font Family:** `Inter`, sans-serif.
*   **Headings:** Bold/ExtraBold. Use the **Text Gradient** utility for the main page title.
*   **Body:** Regular/Medium. High readability is paramount.

---

## 🧩 Component Usage Rules

| Component | Do's | Don'ts |
| :--- | :--- | :--- |
| **GlassCard** | Use for **every** content section: posts, courses, stats. | Don't use solid opaque backgrounds for cards unless absolutely necessary for performance. |
| **NeonButton** | Use for the MAIN action on a page (e.g., "Enroll Now"). | Don't clutter a page with 5+ primary neon buttons. Use Secondary/Ghost variants for less important actions. |
| **SkillProgressBar** | Use for enrollment progress, profile completion. | Don't use default browser progress bars. |

---

## ⚠️ Consistency Checklist (Before Committing)
1.  [ ] **No Hardcoded Hexes:** Are you using `var(--bg-primary)` instead of `#0f172a`?
2.  [ ] **Dark Mode Check:** Does the text have sufficient contrast against the card background?
3.  [ ] **Hover Feedback:** Do interactive elements glow or scale slightly on hover?
4.  [ ] **FOUC Check:** Does the page flash white on load? (It typically shouldn't with our new initialization script).
