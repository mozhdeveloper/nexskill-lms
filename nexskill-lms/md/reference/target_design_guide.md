# NexSkill Target Design Guide

This guide outlines the core design patterns, component configurations, and layout structures used across the NexSkill LMS to ensure a premium, unified visual experience.

## 1. Core Visual Identity

NexSkill utilizes a "Neo-Glass" aesthetic: a dark, immersive theme with high-contrast neon accents, deep shadows, and sophisticated glassmorphism.

- **Background**: `#121212` (Base) / `#0B0F19` (Sections)
- **Primary Accents**:
  - `brand-neon` (`#39FF14`): Student focus, success states, primary CTAs.
  - `brand-electric` (`#007BFF`): Coach focus, secondary info, trust elements.
- **Glassmorphism**: Always use `backdrop-blur-md` or `backdrop-blur-2xl` with low-opacity borders (`white/10`).

---

## 2. Landing Page Layout & Styling

### Ambient Environment
Create depth using fixed, pulsing background glows:
```tsx
<div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
    <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-brand-primary/10 rounded-full blur-[150px] animate-pulse"></div>
    <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-brand-neon/5 rounded-full blur-[150px] animate-pulse"></div>
</div>
```

### Hero Section
- **Typography**: Use `font-black` with tracking-tighter. Gradient text should use `bg-clip-text`.
- **Portal Cards**: Use a staggered grid layout on desktop.
  - Wrap content in `GlassCard variant="dark"`.
  - Add role-specific borders: `border-t-4 border-t-brand-neon` (Student) or `border-t-4 border-t-brand-electric` (Coach).
  - Hover effects: `transition-all duration-500 hover:scale-105`.

---

## 3. Authentication Forms (Student & Coach)

### Layout Container
All auth pages must use `StudentAuthLayout` (or equivalent restricted-width containers) for centralization.

### Form Field Styling
Standardize "Glass Inputs":
- **Container**: `bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm`.
- **Focus**: `focus:ring-1 focus:ring-brand-neon focus:border-brand-neon`.
- **Placeholder**: `text-gray-500`.

### Role-Specific Accents
- **Student Login**: Use `brand-neon` for primary buttons and focus states.
- **Coach Login**: Use `brand-electric` for primary buttons and focus states.
- **Buttons**: Gradient from accent to white or inverse: `bg-gradient-to-r from-brand-neon to-brand-electric`.

---

## 4. Multi-Step Coach Application

### Split-View Architecture
On desktop (`lg:`), use a 50/50 split layout:
- **Left Column**: Branded visual space (`bg-[#0B0F19]`) with an interactive global map marker system and `BrandLockup`.
- **Right Column**: Scrollable form area (`bg-[#121212]`).

### Progress Indicators
Use a segmented progress bar:
- Inactive: `bg-white/10`
- Active/Completed: `bg-brand-neon`
- Use high-contrast labels (e.g., `text-[10px] uppercase tracking-wider`).

### Form Flow (Compact Design)
- Group fields using `grid-cols-2` where possible to reduce vertical scroll.
- Use `h-11` or `h-13` for consistent field heights.
- All CTA buttons at the bottom should be `uppercase` and `font-extrabold`.

---

## 5. Global Components References

- **GlassCard**: Found in `@/components/ui/GlassCard`. Use `variant="dark"` for all standard containers.
- **BrandLockup**: Found in `@/components/brand/BrandLockup`. Supports `horizontal`/`vertical` orientations.
- **Typography**: Inter or similar modern sans-serif. Always use `antialiased`.
