# Garderie Design System

> **Source of truth** for all visual tokens. Every color, font, spacing value, shadow, and radius used in the application traces back to this document.
>
> **Design vision:** "Apple meets nursery" — clean, premium, warm. Human and alive, never corporate or childish.

---

## Table of Contents

1. [Color Tokens](#1-color-tokens)
2. [Typography Tokens](#2-typography-tokens)
3. [Spacing](#3-spacing)
4. [Border Radius](#4-border-radius)
5. [Shadows](#5-shadows)
6. [Transitions](#6-transitions)
7. [Component Patterns](#7-component-patterns)
8. [CSS Custom Properties (Ready to Paste)](#8-css-custom-properties)

---

## 1. Color Tokens

### Design Decisions

- **Primary "Meadow"** — a warm teal-green (`#0B9178` brand / `#0B7464` interactive). Greener than standard teal, more natural and distinctive. Chosen for growth, trust, calm — the #1 color psychology fit for childcare.
- **Fresh canvas, not parchment.** Page background is cool-neutral `#F7F8FA`, not cream. Warmth comes from the brand color and content (children's photos), not from yellowed surfaces.
- **Dark sidebar** — deep slate-navy `#1A1F2E`. Creates visual hierarchy, reduces eye fatigue, feels premium. The sidebar stays dark in both light and dark mode.
- **Two-tier primary usage:** Brand tier (`primary-600`) for large decorative surfaces; Interactive tier (`primary-700`) for buttons and links where WCAG AA contrast is required.

### Shadcn Token Mapping

Maps the researched Meadow palette onto the shadcn/ui CSS custom property structure used by all components.

| Token | Hex | Source | Usage |
|-------|-----|--------|-------|
| `--background` | `#F7F8FA` | bg-page | Page canvas |
| `--foreground` | `#1A1D23` | text-primary | Default text (15.6:1 on white) |
| `--card` | `#FFFFFF` | bg-surface | Card/panel backgrounds |
| `--card-foreground` | `#1A1D23` | text-primary | Card text |
| `--popover` | `#FFFFFF` | bg-surface | Dropdown/popover backgrounds |
| `--popover-foreground` | `#1A1D23` | text-primary | Popover text |
| `--primary` | `#0B7464` | primary-700 | Buttons, links, interactive (5.69:1 on white) |
| `--primary-foreground` | `#FFFFFF` | text-inverse | Text on primary backgrounds |
| `--secondary` | `#F1F3F5` | bg-subtle | Secondary button/badge backgrounds |
| `--secondary-foreground` | `#4B5262` | text-secondary | Secondary text (7.9:1 on white) |
| `--muted` | `#F1F3F5` | bg-subtle | Muted/disabled backgrounds |
| `--muted-foreground` | `#6B7280` | text-tertiary | Placeholder, timestamps (5.0:1 on white) |
| `--accent` | `#EFFCF8` | primary-50 | Hover/focus tint, selected rows |
| `--accent-foreground` | `#0B7464` | primary-700 | Text on accent backgrounds |
| `--destructive` | `#DC2626` | error | Destructive actions (4.8:1 on white) |
| `--destructive-foreground` | `#FFFFFF` | text-inverse | Text on destructive backgrounds |
| `--border` | `#E2E5E9` | border-default | Card borders, dividers |
| `--input` | `#E2E5E9` | border-default | Input field borders |
| `--ring` | `#0B7464` | border-focus | Focus rings |

### Sidebar Tokens

Dark sidebar provides persistent navigation anchor in both light and dark mode.

| Token | Hex | Usage |
|-------|-----|-------|
| `--sidebar` | `#1A1F2E` | Sidebar background |
| `--sidebar-foreground` | `#94A3B8` | Inactive menu text (6.2:1 on sidebar) |
| `--sidebar-primary` | `#36CCA8` | Active indicator, active icon (8.4:1 on sidebar) |
| `--sidebar-primary-foreground` | `#1A1F2E` | Text on sidebar-primary accent |
| `--sidebar-accent` | `#2F3749` | Active/selected item background |
| `--sidebar-accent-foreground` | `#F1F5F9` | Active item text (10.1:1 on sidebar-accent) |
| `--sidebar-border` | `#2D3548` | Sidebar internal dividers |
| `--sidebar-ring` | `#36CCA8` | Focus ring within sidebar |

### Chart Colors

Visually distinct, colorblind-safe palette for data visualization.

| Token | Hex | Color Name |
|-------|-----|------------|
| `--chart-1` | `#0B9178` | Meadow (primary-600) |
| `--chart-2` | `#2563EB` | Blue |
| `--chart-3` | `#7C3AED` | Violet |
| `--chart-4` | `#EA580C` | Orange |
| `--chart-5` | `#4F46E5` | Indigo |

### Module Accent Colors

Dedicated accent per major module for visual wayfinding. Used for section icons, tab highlights, badge dots — not for body text or buttons.

| Token | Hex | Module | Light Tint |
|-------|-----|--------|------------|
| `--color-health` | `#059669` | Health / Medical | `#ECFDF5` |
| `--color-attendance` | `#2563EB` | Attendance | `#EFF6FF` |
| `--color-finance` | `#4F46E5` | Finance / Billing | `#EEF2FF` |
| `--color-alerts` | `#D97706` | Alerts / Safety | `#FFFBEB` |
| `--color-learning` | `#7C3AED` | Learning / Activities | `#F5F3FF` |
| `--color-meals` | `#EA580C` | Meals / Nutrition | `#FFF7ED` |
| `--color-comms` | `#E11D48` | Communication | `#FFF1F2` |
| `--color-sleep` | `#0284C7` | Sleep / Rest | `#F0F9FF` |

### Semantic Colors

Each has three variants: light (background tints), base (icons/badges), dark (text, passes AA).

| Semantic | Light | Base | Dark |
|----------|-------|------|------|
| **Success** | `#ECFDF5` | `#16A34A` | `#15803D` (5.0:1) |
| **Warning** | `#FFFBEB` | `#D97706` | `#B45309` (4.6:1) |
| **Error** | `#FEF2F2` | `#DC2626` | `#B91C1C` (6.1:1) |
| **Info** | `#EFF6FF` | `#2563EB` | `#1D4ED8` (6.4:1) |

### Primary Scale (Full Reference)

For cases beyond the shadcn tokens (illustrations, gradients, decorative UI).

| Step | Hex | Usage |
|------|-----|-------|
| `primary-50` | `#EFFCF8` | Selected row highlight, subtle tint |
| `primary-100` | `#D1F7EC` | Badge backgrounds, hover tint |
| `primary-200` | `#A6EFDB` | Progress bar fills |
| `primary-300` | `#6DE1C3` | Active toggles, chips |
| `primary-400` | `#36CCA8` | Icons on light bg, dark-mode interactive |
| `primary-500` | `#17B394` | Hero sections, decorative |
| **primary-600** | **`#0B9178`** | **Brand tier — logo, large surfaces** |
| **primary-700** | **`#0B7464`** | **Interactive tier — buttons, links (AA)** |
| `primary-800` | `#0D5C50` | Hover/pressed state |
| `primary-900` | `#104C44` | Dark emphasis |
| `primary-950` | `#062D28` | Near-black accent |

---

## 2. Typography Tokens

### Font Families

| Role | Font | Weights | Fallback Stack |
|------|------|---------|----------------|
| **Heading / Display** | Nunito | 600, 700, 800 | `'Nunito', 'Cairo', system-ui, -apple-system, sans-serif` |
| **Body / UI** | Cairo | 300–700 | `'Cairo', system-ui, -apple-system, sans-serif` |
| **Monospace** | JetBrains Mono | 400, 500 | `'JetBrains Mono', 'SF Mono', monospace` |
| **Arabic body** | Cairo | 300–700 | `'Cairo', 'Noto Sans Arabic', sans-serif` |

### Why These Fonts

- **Nunito** — rounded terminals give instant warmth. The gold standard heading font for childcare software.
- **Cairo** — native Latin + Arabic in one font. Geometric DNA complements Nunito. Egyptian-designed, modern.
- **JetBrains Mono** — distinct `0`/`O`/`l`/`1` differentiation for IDs, invoice numbers, codes.

### Type Scale

Based on a **1.250 Major Third** ratio. Headings use Nunito; body and utility use Cairo.

| Token | Size | Line Height | Weight | Font | Usage |
|-------|------|-------------|--------|------|-------|
| `h1` | 30px / 1.875rem | 38px (1.27) | 800 | Nunito | Page titles |
| `h2` | 24px / 1.5rem | 32px (1.33) | 700 | Nunito | Section titles |
| `h3` | 20px / 1.25rem | 28px (1.40) | 700 | Nunito | Card titles |
| `h4` | 18px / 1.125rem | 24px (1.33) | 600 | Nunito | Subsection headings |
| `h5` | 16px / 1rem | 22px (1.38) | 600 | Cairo | Small headings, table groups |
| `h6` | 14px / 0.875rem | 20px (1.43) | 600 | Cairo | Sidebar labels, card subtitles |
| `body-lg` | 16px / 1rem | 26px (1.625) | 400 | Cairo | Primary body text |
| `body` | 14px / 0.875rem | 22px (1.571) | 400 | Cairo | Default UI text, form labels, tables |
| `body-sm` | 13px / 0.8125rem | 20px (1.538) | 400 | Cairo | Helper text, descriptions |
| `caption` | 12px / 0.75rem | 16px (1.33) | 500 | Cairo | Timestamps, metadata, badges |
| `overline` | 11px / 0.6875rem | 16px (1.45) | 600 | Cairo | Section overlines (UPPERCASE) |
| `code` | 13px / 0.8125rem | 20px (1.538) | 400 | JetBrains Mono | Student IDs, invoice numbers |
| `code-sm` | 12px / 0.75rem | 16px (1.33) | 400 | JetBrains Mono | Timestamps, registration codes |

### Letter Spacing

| Context | Value | Notes |
|---------|-------|-------|
| Headings (h1–h4) | `-0.01em` | Tighten large text |
| Body text | `0` | Native metrics |
| Button labels | `+0.02em` | Subtle scannability boost |
| Overline / labels | `+0.06em` | Open up small uppercase |
| Monospace | `0` | Pre-optimized |
| Arabic (any size) | `0` | Never track Arabic — breaks ligatures |

### Arabic Overrides

| Property | Latin | Arabic | Reason |
|----------|-------|--------|--------|
| Line height | 1.5–1.625 | 1.7–1.8 | Room for tashkeel diacritics |
| Letter spacing | varies | `0` always | Arabic is cursive/connected |
| Body font size | 14px | 15px | Arabic glyphs render smaller |
| Direction | `ltr` | `rtl` | Reading direction |

### Mobile Responsive Scale

| Token | Desktop | Mobile (< 640px) |
|-------|---------|-------------------|
| `h1` | 30px | 24px |
| `h2` | 24px | 20px |
| `h3` | 20px | 18px |
| `h4` | 18px | 16px |
| `body-lg` | 16px | 16px (no change) |
| `body` | 14px | 14px (no change) |

---

## 3. Spacing

**Base unit:** `4px`. All spacing derives from a 4px grid for pixel-perfect alignment.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-0` | 0px | — |
| `--space-0.5` | 2px | Subtle gaps (icon–text nudge) |
| `--space-1` | 4px | Tight gaps, inline spacing |
| `--space-1.5` | 6px | Compact list items |
| `--space-2` | 8px | Input padding (vertical), icon gaps |
| `--space-3` | 12px | Card internal padding (compact), badge padding |
| `--space-4` | 16px | Standard card padding, section gaps |
| `--space-5` | 20px | Card padding (comfortable) |
| `--space-6` | 24px | Section spacing, card padding (generous) |
| `--space-8` | 32px | Section dividers, large gaps |
| `--space-10` | 40px | Page section breaks |
| `--space-12` | 48px | Major section spacing |
| `--space-16` | 64px | Page-level vertical rhythm |

### Common Spacing Patterns

| Pattern | Value | Notes |
|---------|-------|-------|
| Card internal padding | 16–24px | `--space-4` to `--space-6` |
| Stack gap (form fields) | 16px | `--space-4` |
| Inline gap (icon + text) | 8px | `--space-2` |
| Section gap | 24–32px | `--space-6` to `--space-8` |
| Sidebar item padding | 8px 12px | `--space-2` vertical, `--space-3` horizontal |
| Table cell padding | 8px 12px | Matches sidebar rhythm |
| Minimum touch target | 44px | Accessibility requirement (mobile) |

---

## 4. Border Radius

**Base radius:** `0.625rem` (10px). The scale creates a consistent rounded feel — warm and approachable, never sharp.

| Token | Value | CSS | Usage |
|-------|-------|-----|-------|
| `--radius` | 10px | `0.625rem` | Base (used by shadcn calc) |
| `--radius-sm` | 6px | `calc(var(--radius) - 4px)` | Small badges, tags, chips |
| `--radius-md` | 8px | `calc(var(--radius) - 2px)` | Buttons, inputs |
| `--radius-lg` | 10px | `var(--radius)` | Cards, panels |
| `--radius-xl` | 14px | `calc(var(--radius) + 4px)` | Modals, dialogs |
| `--radius-2xl` | 18px | `calc(var(--radius) + 8px)` | Large feature cards |
| `--radius-full` | 9999px | `9999px` | Avatars, pills, dots |

### Usage Guidelines

- **Buttons & inputs:** `--radius-md` (8px) — clickable elements feel grippable
- **Cards & panels:** `--radius-lg` (10px) — the signature Garderie rounded card
- **Modals & dialogs:** `--radius-xl` (14px) — elevated surfaces are softer
- **Avatars:** `--radius-full` — always circular
- **Never mix sharp and round** — maintain consistent rounding throughout

---

## 5. Shadows

**Warm-tinted shadows** — using `rgba(15, 23, 42, ...)` (slate-900 base) instead of pure black. Creates depth that feels natural, not harsh.

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-xs` | `0 1px 2px rgba(15, 23, 42, 0.04)` | Subtle lift (badges, chips) |
| `--shadow-sm` | `0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)` | Cards at rest |
| `--shadow-md` | `0 4px 6px rgba(15, 23, 42, 0.06), 0 2px 4px rgba(15, 23, 42, 0.04)` | Cards on hover, dropdowns |
| `--shadow-lg` | `0 10px 15px rgba(15, 23, 42, 0.08), 0 4px 6px rgba(15, 23, 42, 0.04)` | Modals, popovers |
| `--shadow-xl` | `0 20px 25px rgba(15, 23, 42, 0.08), 0 8px 10px rgba(15, 23, 42, 0.03)` | Full-page overlays |
| `--shadow-inner` | `inset 0 2px 4px rgba(15, 23, 42, 0.04)` | Pressed inputs, inset wells |
| `--shadow-ring` | `0 0 0 3px rgba(11, 116, 100, 0.15)` | Focus ring glow (primary-tinted) |

### Elevation System

| Elevation | Shadow | Example |
|-----------|--------|---------|
| **Ground** | none | Page background, sidebar |
| **Low** | `--shadow-sm` | Cards, table rows |
| **Mid** | `--shadow-md` | Hovered cards, dropdowns |
| **High** | `--shadow-lg` | Modals, dialogs, popovers |
| **Overlay** | `--shadow-xl` | Command palette, full overlays |

### Dark Mode

In dark mode, shadows become nearly invisible. Replace shadow-based separation with subtle borders (`--border: #2D3548`).

---

## 6. Transitions

Standard easing and duration tokens for consistent motion throughout the UI.

| Token | Value | Usage |
|-------|-------|-------|
| `--ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | General transitions (ease-in-out) |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Elements entering view |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Elements leaving view |
| `--ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Celebration moments, success confirmations |
| `--duration-fast` | `100ms` | Hover color changes, opacity shifts |
| `--duration-normal` | `200ms` | Most interactions — button presses, focus rings |
| `--duration-slow` | `300ms` | Page transitions, panel slides, modal entry |
| `--duration-slower` | `500ms` | Skeleton fade-out, content reveal |

### Common Transition Patterns

| Pattern | Property | Duration | Easing |
|---------|----------|----------|--------|
| Button hover | `background-color, box-shadow` | `--duration-fast` | `--ease-default` |
| Card hover lift | `transform, box-shadow` | `--duration-normal` | `--ease-out` |
| Focus ring | `box-shadow` | `--duration-fast` | `--ease-default` |
| Sidebar collapse | `width` | `--duration-slow` | `--ease-default` |
| Modal enter | `opacity, transform` | `--duration-slow` | `--ease-out` |
| Dropdown open | `opacity, transform` | `--duration-normal` | `--ease-out` |
| Skeleton shimmer | `background-position` | `1.5s` | `linear` (infinite) |
| Success check | `transform, opacity` | `--duration-slow` | `--ease-bounce` |

### Principles

1. **No instant jumps** — every state change has a transition (even if 100ms).
2. **Faster for frequent** — hover/focus are fast (100–200ms). Page-level is slower (300ms).
3. **Decelerate on entry** — elements arriving use `--ease-out` (fast start, gentle settle).
4. **Reserve bounce** — `--ease-bounce` only for celebration moments (check-in confirmation, milestone reached). Overuse cheapens it.
5. **Respect `prefers-reduced-motion`** — wrap all motion in a media query; reduced-motion users get instant state changes.

---

## 7. Component Patterns

### Cards

The primary content container. White surface on the cool-gray canvas.

| Property | Value |
|----------|-------|
| Background | `--card` (`#FFFFFF`) |
| Border | `1px solid var(--border)` (`#E2E5E9`) |
| Border radius | `--radius-lg` (10px) |
| Shadow | `--shadow-sm` at rest |
| Padding | `--space-4` to `--space-6` (16–24px) |
| Hover | `--shadow-md` + subtle `translateY(-1px)` |

### Buttons

| Variant | Background | Text | Border | Hover |
|---------|-----------|------|--------|-------|
| **Primary** | `#0B7464` | `#FFFFFF` | none | `#0D5C50` |
| **Secondary** | `#FFFFFF` | `#0B7464` | `1px solid #0B7464` | `#EFFCF8` bg |
| **Ghost** | transparent | `#0B7464` | none | `#EFFCF8` bg |
| **Destructive** | `#DC2626` | `#FFFFFF` | none | `#B91C1C` |
| **Muted** | `#F1F3F5` | `#4B5262` | none | `#E8EAED` bg |
| **Disabled** | `#E8EAED` | `#9CA3AF` | none | — (no hover) |

Button specs: `--radius-md` (8px), `padding: 8px 16px`, `font: Cairo SemiBold 14px`, `letter-spacing: +0.02em`.

### Inputs

| State | Border | Background | Ring |
|-------|--------|-----------|------|
| **Default** | `#E2E5E9` | `#FFFFFF` | — |
| **Hover** | `#C9CED4` | `#FFFFFF` | — |
| **Focus** | `#0B7464` | `#FFFFFF` | `--shadow-ring` |
| **Error** | `#DC2626` | `#FFFFFF` | `0 0 0 3px rgba(220, 38, 38, 0.15)` |
| **Disabled** | `#ECEEF1` | `#F1F3F5` | — |

Input specs: `--radius-md` (8px), `padding: 8px 12px`, `font: Cairo Regular 14px`.

### Badges

Soft background + darker text for each semantic color.

| Variant | Background | Text |
|---------|-----------|------|
| **Default** | `#F1F3F5` | `#4B5262` |
| **Primary** | `#D1F7EC` | `#0B7464` |
| **Success** | `#ECFDF5` | `#15803D` |
| **Warning** | `#FFFBEB` | `#B45309` |
| **Error** | `#FEF2F2` | `#B91C1C` |
| **Info** | `#EFF6FF` | `#1D4ED8` |

Badge specs: `--radius-sm` (6px), `padding: 2px 8px`, `font: Cairo Medium 12px`.

### Status Dots

8px colored dots for attendance/health status. Decorative (non-text), so they follow the 3:1 non-text contrast rule.

| Status | Color | On White |
|--------|-------|----------|
| Present | `#16A34A` | 3.3:1 Pass |
| Absent | `#DC2626` | 4.8:1 Pass |
| Late | `#D97706` | 3.0:1 Pass |
| Excused | `#6B7280` | 5.0:1 Pass |

### Sidebar Navigation Item

| State | Background | Text | Icon |
|-------|-----------|------|------|
| **Default** | transparent | `#94A3B8` | `#64748B` |
| **Hover** | `#252B3B` | `#94A3B8` | `#64748B` |
| **Active** | `#2F3749` | `#F1F5F9` | `#36CCA8` |

Active item has a 3px left accent bar in `#36CCA8` (sidebar-primary).

---

## 8. CSS Custom Properties

Ready to paste into `globals.css`. Replaces the `:root` and `@theme inline` blocks.

### Light Mode (`:root`)

```css
:root {
  --radius: 0.625rem;

  /* ── Core surfaces ── */
  --background: #F7F8FA;
  --foreground: #1A1D23;
  --card: #FFFFFF;
  --card-foreground: #1A1D23;
  --popover: #FFFFFF;
  --popover-foreground: #1A1D23;

  /* ── Primary — Meadow teal-green ── */
  --primary: #0B7464;
  --primary-foreground: #FFFFFF;

  /* ── Secondary ── */
  --secondary: #F1F3F5;
  --secondary-foreground: #4B5262;

  /* ── Muted ── */
  --muted: #F1F3F5;
  --muted-foreground: #6B7280;

  /* ── Accent ── */
  --accent: #EFFCF8;
  --accent-foreground: #0B7464;

  /* ── Destructive ── */
  --destructive: #DC2626;
  --destructive-foreground: #FFFFFF;

  /* ── Borders & inputs ── */
  --border: #E2E5E9;
  --input: #E2E5E9;
  --ring: #0B7464;

  /* ── Charts ── */
  --chart-1: #0B9178;
  --chart-2: #2563EB;
  --chart-3: #7C3AED;
  --chart-4: #EA580C;
  --chart-5: #4F46E5;

  /* ── Sidebar (always dark) ── */
  --sidebar: #1A1F2E;
  --sidebar-foreground: #94A3B8;
  --sidebar-primary: #36CCA8;
  --sidebar-primary-foreground: #1A1F2E;
  --sidebar-accent: #2F3749;
  --sidebar-accent-foreground: #F1F5F9;
  --sidebar-border: #2D3548;
  --sidebar-ring: #36CCA8;

  /* ── Module accents ── */
  --color-health: #059669;
  --color-attendance: #2563EB;
  --color-finance: #4F46E5;
  --color-alerts: #D97706;
  --color-learning: #7C3AED;
  --color-meals: #EA580C;
  --color-comms: #E11D48;
  --color-sleep: #0284C7;

  /* ── Module accent tints ── */
  --color-health-light: #ECFDF5;
  --color-attendance-light: #EFF6FF;
  --color-finance-light: #EEF2FF;
  --color-alerts-light: #FFFBEB;
  --color-learning-light: #F5F3FF;
  --color-meals-light: #FFF7ED;
  --color-comms-light: #FFF1F2;
  --color-sleep-light: #F0F9FF;

  /* ── Semantic colors ── */
  --color-success: #16A34A;
  --color-success-light: #ECFDF5;
  --color-success-dark: #15803D;
  --color-warning: #D97706;
  --color-warning-light: #FFFBEB;
  --color-warning-dark: #B45309;
  --color-error: #DC2626;
  --color-error-light: #FEF2F2;
  --color-error-dark: #B91C1C;
  --color-info: #2563EB;
  --color-info-light: #EFF6FF;
  --color-info-dark: #1D4ED8;

  /* ── Primary scale (decorative/illustration use) ── */
  --color-primary-50: #EFFCF8;
  --color-primary-100: #D1F7EC;
  --color-primary-200: #A6EFDB;
  --color-primary-300: #6DE1C3;
  --color-primary-400: #36CCA8;
  --color-primary-500: #17B394;
  --color-primary-600: #0B9178;
  --color-primary-700: #0B7464;
  --color-primary-800: #0D5C50;
  --color-primary-900: #104C44;
  --color-primary-950: #062D28;

  /* ── Extended neutrals ── */
  --color-bg-subtle: #F1F3F5;
  --color-bg-muted: #E8EAED;
  --color-text-disabled: #9CA3AF;
  --color-border-subtle: #ECEEF1;
  --color-border-strong: #C9CED4;

  /* ── Shadows ── */
  --shadow-xs: 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-md: 0 4px 6px rgba(15, 23, 42, 0.06), 0 2px 4px rgba(15, 23, 42, 0.04);
  --shadow-lg: 0 10px 15px rgba(15, 23, 42, 0.08), 0 4px 6px rgba(15, 23, 42, 0.04);
  --shadow-xl: 0 20px 25px rgba(15, 23, 42, 0.08), 0 8px 10px rgba(15, 23, 42, 0.03);
  --shadow-inner: inset 0 2px 4px rgba(15, 23, 42, 0.04);
  --shadow-ring: 0 0 0 3px rgba(11, 116, 100, 0.15);

  /* ── Transitions ── */
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --duration-fast: 100ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-slower: 500ms;
}
```

### Typography Properties

```css
:root {
  /* ── Font families ── */
  --font-heading: 'Nunito', 'Cairo', system-ui, -apple-system, sans-serif;
  --font-body: 'Cairo', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', monospace;
  --font-body-ar: 'Cairo', 'Noto Sans Arabic', sans-serif;

  /* ── Font sizes ── */
  --text-h1: 1.875rem;
  --text-h2: 1.5rem;
  --text-h3: 1.25rem;
  --text-h4: 1.125rem;
  --text-h5: 1rem;
  --text-h6: 0.875rem;
  --text-body-lg: 1rem;
  --text-body: 0.875rem;
  --text-body-sm: 0.8125rem;
  --text-caption: 0.75rem;
  --text-overline: 0.6875rem;
  --text-code: 0.8125rem;
  --text-code-sm: 0.75rem;

  /* ── Line heights ── */
  --leading-h1: 2.375rem;
  --leading-h2: 2rem;
  --leading-h3: 1.75rem;
  --leading-h4: 1.5rem;
  --leading-h5: 1.375rem;
  --leading-h6: 1.25rem;
  --leading-body-lg: 1.625rem;
  --leading-body: 1.375rem;
  --leading-body-sm: 1.25rem;
  --leading-caption: 1rem;

  /* ── Font weights ── */
  --weight-light: 300;
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;
  --weight-extrabold: 800;

  /* ── Letter spacing ── */
  --tracking-tight: -0.01em;
  --tracking-normal: 0;
  --tracking-wide: 0.02em;
  --tracking-wider: 0.06em;
}
```

### Tailwind `@theme inline` Block

Maps CSS custom properties to Tailwind utility classes.

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  /* Module accent colors */
  --color-health: var(--color-health);
  --color-attendance: var(--color-attendance);
  --color-finance: var(--color-finance);
  --color-alerts: var(--color-alerts);

  --font-sans: var(--font-body);
  --font-heading: var(--font-heading);
  --font-mono: var(--font-mono);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
}
```

---

## Accessibility Contract

Every color pairing in this system has been verified against WCAG 2.1:

| Combination | Ratio | Grade |
|------------|-------|-------|
| `--foreground` on `--background` | 15.6:1 | AAA |
| `--primary` on white | 5.69:1 | AA |
| `--secondary-foreground` on white | 7.9:1 | AAA |
| `--muted-foreground` on white | 5.0:1 | AA |
| White on `--primary` | 5.69:1 | AA |
| White on `--destructive` | 4.8:1 | AA |
| `--sidebar-foreground` on `--sidebar` | 6.2:1 | AA |
| `--sidebar-accent-foreground` on `--sidebar-accent` | 10.1:1 | AAA |
| `--sidebar-primary` on `--sidebar` | 8.4:1 | AAA |

**Rules:**
- Color is never the sole indicator of state — always paired with icons, text, or patterns
- Focus rings visible on all interactive elements
- Minimum 44×44px touch targets on mobile
- `prefers-reduced-motion` respected for all animations
