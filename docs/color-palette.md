# Garderie Color Palette

> **Design Vision:** "Apple meets nursery" — clean, premium, with purposeful pops of color. Warm and human, never corporate or childish.
>
> **Date:** February 2026

---

## Design Philosophy

This palette is built on three research-backed principles:

1. **Warm-shifted naturals over pure primaries.** The best childcare apps (Famly, Brightwheel, DaycareSOS) avoid raw primary colors. They use muted, warm-shifted versions — teal instead of blue, coral instead of red, sage instead of green. This feels *human and alive* rather than corporate.

2. **Restraint creates playfulness.** Paradoxically, using *fewer* colors feels more playful than a rainbow. Apple's design system proves that one bold brand color on a clean canvas creates more delight than ten competing hues. We use one distinctive primary, coordinated module accents, and let whitespace do the rest.

3. **Fresh, not warm-beige.** Many nursery apps default to cream/parchment backgrounds. We go the opposite direction — clean, slightly cool-tinted whites that feel modern and airy. The warmth comes from the brand color and content (children's photos), not from yellowed backgrounds.

---

## 1. Primary — "Meadow" (Warm Teal-Green)

A teal that leans distinctly toward green/emerald — warmer and more natural than standard teal, more vibrant than sage. Conveys **growth, trust, nature, and vitality** — the core emotions for a childcare brand.

This is NOT basic blue. It's NOT terracotta. It sits in the sweet spot between teal and emerald, giving Garderie a distinctive, recognizable identity.

### Full Scale

| Token | Hex | Usage | Preview |
|-------|-----|-------|---------|
| `primary-50` | `#EFFCF8` | Subtle background tint, selected row highlight | ![#EFFCF8](https://placehold.co/80x24/EFFCF8/EFFCF8) |
| `primary-100` | `#D1F7EC` | Light badge backgrounds, hover tint | ![#D1F7EC](https://placehold.co/80x24/D1F7EC/D1F7EC) |
| `primary-200` | `#A6EFDB` | Progress bar fills, light accents | ![#A6EFDB](https://placehold.co/80x24/A6EFDB/A6EFDB) |
| `primary-300` | `#6DE1C3` | Active toggles, selected chips | ![#6DE1C3](https://placehold.co/80x24/6DE1C3/6DE1C3) |
| `primary-400` | `#36CCA8` | Icons on light backgrounds | ![#36CCA8](https://placehold.co/80x24/36CCA8/36CCA8) |
| `primary-500` | `#17B394` | Brand accent — hero sections, large decorative elements | ![#17B394](https://placehold.co/80x24/17B394/17B394) |
| **`primary-600`** | **`#0B9178`** | **Brand primary — logo, brand identity, large UI surfaces** | ![#0B9178](https://placehold.co/80x24/0B9178/0B9178) |
| **`primary-700`** | **`#0B7464`** | **Interactive primary — buttons, links, text (passes AA on white)** | ![#0B7464](https://placehold.co/80x24/0B7464/0B7464) |
| `primary-800` | `#0D5C50` | Hover/pressed state for buttons | ![#0D5C50](https://placehold.co/80x24/0D5C50/0D5C50) |
| `primary-900` | `#104C44` | Dark emphasis, badges on light backgrounds | ![#104C44](https://placehold.co/80x24/104C44/104C44) |
| `primary-950` | `#062D28` | Near-black primary (dark mode text accent) | ![#062D28](https://placehold.co/80x24/062D28/062D28) |

### Two-Tier Usage

Like all modern design systems (GitHub Primer, Apple HIG, Material Design), we use two tiers:

- **Brand tier** (`primary-500` / `primary-600`): Vibrant. Used for large surfaces, decorative elements, logos, illustrations. Does NOT need to pass text contrast on white.
- **Interactive tier** (`primary-700`): Darker. Used wherever contrast matters — button labels (white on primary), text links (primary on white). Passes WCAG AA at **5.69:1** on white.

### Why "Meadow"?

| Considered | Why Not |
|-----------|---------|
| Standard teal (`#0D9488`) | Too common — every childcare app uses it. Cooler, less distinctive. |
| Basic blue (`#2563EB`) | Corporate. Every SaaS uses blue. Feels cold for childcare. |
| Terracotta (`#C2704B`) | Trendy but heavy. Doesn't convey growth/trust. Hard to build a full UI around. |
| Coral (`#F97316`) | Too energetic as primary. Works as accent, not as the dominant brand color. |
| Purple (`#7C3AED`) | Premium feel but no "nature/growth" association for childcare. |

Meadow teal-green was chosen because:
- **Color psychology:** Green/teal is the #1 recommended color family for childcare (trust, growth, calm)
- **Warm-shifted:** Greener than standard teal = warmer, more natural
- **Distinctive:** Not the standard Tailwind teal or generic SaaS blue
- **Versatile:** Works for buttons, backgrounds, icons, dark mode

---

## 2. Neutral Palette — "Fresh Canvas"

Slightly cool-tinted neutrals that feel **modern, clean, and airy**. The warmth in our UI comes from the brand color and content (photos of children), NOT from yellowed/cream backgrounds.

### Backgrounds & Surfaces

| Token | Hex | Usage | Contrast Notes |
|-------|-----|-------|----------------|
| `bg-page` | `#F7F8FA` | Page background — the "canvas" | Cool-neutral, fresh |
| `bg-surface` | `#FFFFFF` | Cards, modals, panels — content surfaces | Pure white, layered on page bg |
| `bg-subtle` | `#F1F3F5` | Secondary panels, table headers, sidebar (light mode) | Slightly darker than page |
| `bg-muted` | `#E8EAED` | Disabled backgrounds, skeleton loaders | Soft neutral |
| `bg-overlay` | `rgba(15, 23, 42, 0.5)` | Modal/dialog backdrop | 50% dark overlay |

### Text Colors

| Token | Hex | Usage | Contrast on White |
|-------|-----|-------|-------------------|
| `text-primary` | `#1A1D23` | Headings, primary body text | **15.6:1** AAA |
| `text-secondary` | `#4B5262` | Secondary text, descriptions | **7.9:1** AAA |
| `text-tertiary` | `#6B7280` | Placeholder text, timestamps | **5.0:1** AA |
| `text-disabled` | `#9CA3AF` | Disabled labels | **2.9:1** (decorative only) |
| `text-inverse` | `#FFFFFF` | Text on dark/primary backgrounds | Verify per background |

### Borders & Dividers

| Token | Hex | Usage |
|-------|-----|-------|
| `border-default` | `#E2E5E9` | Card borders, input borders |
| `border-subtle` | `#ECEEF1` | Table row dividers, section separators |
| `border-strong` | `#C9CED4` | Active input borders, emphasis |
| `border-focus` | `#0B7464` | Focus ring (matches interactive primary) |

---

## 3. Semantic Colors

Each semantic color has three variants: **base** (icons, badges), **light** (background tints), and **dark** (text that must pass AA). The base color is used for small visual indicators; the dark variant is required whenever the color carries meaning through text.

### Success (Growth, Completion, Positive)

| Variant | Hex | Usage | Contrast on White |
|---------|-----|-------|-------------------|
| `success-light` | `#ECFDF5` | Alert background, success banner bg | — |
| `success` | `#16A34A` | Icons, badges, progress indicators | 3.3:1 (icons OK) |
| `success-dark` | `#15803D` | Success text, accessible labels | **5.0:1** AA |

### Warning (Attention, Caution)

| Variant | Hex | Usage | Contrast on White |
|---------|-----|-------|-------------------|
| `warning-light` | `#FFFBEB` | Alert background, warning banner bg | — |
| `warning` | `#D97706` | Icons, badges, status indicators | 3.0:1 (icons OK) |
| `warning-dark` | `#B45309` | Warning text, accessible labels | **4.6:1** AA |

### Error (Critical, Destructive, Urgent)

| Variant | Hex | Usage | Contrast on White |
|---------|-----|-------|-------------------|
| `error-light` | `#FEF2F2` | Alert background, error banner bg | — |
| `error` | `#DC2626` | Icons, badges, error indicators | **4.8:1** AA |
| `error-dark` | `#B91C1C` | Error text, destructive button labels | **6.1:1** AA |

### Info (Neutral Information, Help)

| Variant | Hex | Usage | Contrast on White |
|---------|-----|-------|-------------------|
| `info-light` | `#EFF6FF` | Alert background, info banner bg | — |
| `info` | `#2563EB` | Icons, badges, info indicators | **4.8:1** AA |
| `info-dark` | `#1D4ED8` | Info text, accessible labels | **6.4:1** AA |

---

## 4. Module Accent Colors

Each major module gets a **dedicated accent color** for visual wayfinding. Users should instinctively know "I'm in the health section" from the color alone. These are used for module icons, tab highlights, section headers, and decorative badges — NOT for body text.

| Module | Color Name | Hex | Light Tint | Rationale |
|--------|-----------|-----|------------|-----------|
| **Health / Medical** | Emerald | `#059669` | `#ECFDF5` | Universal health/medical green. Growth, wellbeing. |
| **Attendance** | Blue | `#2563EB` | `#EFF6FF` | Reliability, tracking, consistency. |
| **Alerts / Safety** | Amber | `#D97706` | `#FFFBEB` | Urgency without panic. Warm attention-grab. |
| **Learning / Activities** | Violet | `#7C3AED` | `#F5F3FF` | Creativity, imagination, discovery. |
| **Meals / Nutrition** | Orange | `#EA580C` | `#FFF7ED` | Warmth, nourishment, energy. |
| **Finance / Billing** | Indigo | `#4F46E5` | `#EEF2FF` | Trust, professionalism, precision. |
| **Communication** | Rose | `#E11D48` | `#FFF1F2` | Connection, warmth, engagement. |
| **Sleep / Rest** | Sky | `#0284C7` | `#F0F9FF` | Calm, serenity, peace. |

### Usage Rules

1. **One module color per screen section.** Don't mix module colors within a single card or panel.
2. **Module color appears in:** Section icon, tab highlight bar, badge dot, section header accent.
3. **Module color does NOT appear in:** Body text, buttons (use primary instead), backgrounds (use the light tint).
4. **Light tint** is the module's subtle background — used behind stat cards, section headers, and empty state illustrations.

---

## 5. Sidebar — Dark Mode Navigation

Research confirms dark sidebars are the dominant SaaS pattern for 2025-2026. A dark sidebar creates **visual hierarchy**, separates navigation from content, reduces eye fatigue for power users, and feels premium.

Our sidebar uses a **deep slate-navy** — warmer than pure black, professional without being cold.

| Token | Hex | Usage |
|-------|-----|-------|
| `sidebar-bg` | `#1A1F2E` | Sidebar background |
| `sidebar-bg-hover` | `#252B3B` | Hovered menu item |
| `sidebar-bg-active` | `#2F3749` | Active/selected menu item |
| `sidebar-text` | `#94A3B8` | Inactive menu item text |
| `sidebar-text-active` | `#F1F5F9` | Active menu item text |
| `sidebar-text-heading` | `#CBD5E1` | Section headings in sidebar |
| `sidebar-accent` | `#36CCA8` | Active indicator bar (primary-400, pops on dark) |
| `sidebar-border` | `#2D3548` | Dividers within sidebar |
| `sidebar-icon` | `#64748B` | Inactive menu icons |
| `sidebar-icon-active` | `#36CCA8` | Active menu icon (matches accent) |

### Contrast Verification (Sidebar)

| Combination | Ratio | Grade |
|------------|-------|-------|
| `sidebar-text` (#94A3B8) on `sidebar-bg` (#1A1F2E) | **6.2:1** | AA |
| `sidebar-text-active` (#F1F5F9) on `sidebar-bg-active` (#2F3749) | **10.1:1** | AAA |
| `sidebar-accent` (#36CCA8) on `sidebar-bg` (#1A1F2E) | **8.4:1** | AAA |

---

## 6. Light & Dark Mode

### Light Mode (Default)

The default experience. Clean, bright, photo-forward. Designed for:
- Daytime use in well-lit nursery environments
- Parents checking updates on their phones
- Admin staff in bright offices

```
Page Background:  #F7F8FA
Card Background:  #FFFFFF
Primary Text:     #1A1D23
Primary Button:   #0B7464 bg, #FFFFFF text
Sidebar:          #1A1F2E (always dark — provides anchor)
```

### Dark Mode

For late-night parent check-ins and admin evening work. Follows the research finding that SaaS users expect dark mode as standard in 2025-2026.

| Token | Light Value | Dark Value |
|-------|------------|------------|
| `bg-page` | `#F7F8FA` | `#0F1117` |
| `bg-surface` | `#FFFFFF` | `#1A1D27` |
| `bg-subtle` | `#F1F3F5` | `#252831` |
| `text-primary` | `#1A1D23` | `#F1F3F5` |
| `text-secondary` | `#4B5262` | `#94A3B8` |
| `border-default` | `#E2E5E9` | `#2D3548` |
| `primary-interactive` | `#0B7464` | `#36CCA8` (primary-400, brighter on dark) |
| `primary-surface` | `#EFFCF8` | `#0B2E27` (dark tint of primary) |

### Dark Mode Principles

1. **Don't just invert.** Dark backgrounds are `#0F1117` (warm dark), not `#000000`. Cards are `#1A1D27`, not `#111111`.
2. **Lighten the primary.** Use `primary-400` (`#36CCA8`) instead of `primary-700` on dark backgrounds for sufficient contrast.
3. **Reduce shadows, increase borders.** Shadows disappear on dark backgrounds. Use subtle borders (`#2D3548`) to define card edges instead.
4. **Sidebar stays dark.** The sidebar doesn't change between modes — it's already dark. This provides continuity.
5. **Semantic colors stay vivid.** Error red, success green, etc. use their standard values (they already contrast well on dark backgrounds).

---

## 7. Contrast Ratio Verification

All critical text/background combinations verified against WCAG 2.1 guidelines.

### WCAG Requirements Reference

| Level | Normal Text (< 18pt) | Large Text (>= 18pt / 14pt bold) |
|-------|----------------------|----------------------------------|
| **AA** | 4.5:1 minimum | 3.0:1 minimum |
| **AAA** | 7.0:1 minimum | 4.5:1 minimum |

### Primary Color Combinations

| Foreground | Background | Ratio | Grade | Usage |
|-----------|-----------|-------|-------|-------|
| `#FFFFFF` | `#0B7464` (primary-700) | **5.69:1** | AA | Button text |
| `#0B7464` | `#FFFFFF` | **5.69:1** | AA | Links, interactive text |
| `#FFFFFF` | `#0B9178` (primary-600) | **3.94:1** | AA Large | Large headings, brand marks |
| `#FFFFFF` | `#0D5C50` (primary-800) | **8.12:1** | AAA | High-contrast buttons |
| `#0B7464` | `#EFFCF8` (primary-50) | **5.21:1** | AA | Text on tinted background |

### Text on White Background

| Foreground | Ratio | Grade |
|-----------|-------|-------|
| `#1A1D23` (text-primary) | **15.6:1** | AAA |
| `#4B5262` (text-secondary) | **7.9:1** | AAA |
| `#6B7280` (text-tertiary) | **5.0:1** | AA |
| `#DC2626` (error) | **4.8:1** | AA |
| `#2563EB` (info) | **4.8:1** | AA |
| `#B45309` (warning-dark) | **4.6:1** | AA |
| `#15803D` (success-dark) | **5.0:1** | AA |

### Text on Dark Backgrounds

| Foreground | Background | Ratio | Grade |
|-----------|-----------|-------|-------|
| `#F1F5F9` | `#1A1F2E` (sidebar) | **12.4:1** | AAA |
| `#94A3B8` | `#1A1F2E` (sidebar) | **6.2:1** | AA |
| `#F1F3F5` | `#0F1117` (dark mode bg) | **16.8:1** | AAA |
| `#36CCA8` | `#1A1F2E` (sidebar) | **8.4:1** | AAA |

---

## 8. Usage Quick Reference

### Buttons

| Type | Background | Text | Border |
|------|-----------|------|--------|
| **Primary** | `#0B7464` | `#FFFFFF` | none |
| **Primary Hover** | `#0D5C50` | `#FFFFFF` | none |
| **Secondary** | `#FFFFFF` | `#0B7464` | `#0B7464` |
| **Secondary Hover** | `#EFFCF8` | `#0B7464` | `#0B7464` |
| **Ghost** | transparent | `#0B7464` | none |
| **Destructive** | `#DC2626` | `#FFFFFF` | none |
| **Disabled** | `#E8EAED` | `#9CA3AF` | none |

### Form Inputs

| State | Border | Background | Text |
|-------|--------|-----------|------|
| **Default** | `#E2E5E9` | `#FFFFFF` | `#1A1D23` |
| **Hover** | `#C9CED4` | `#FFFFFF` | `#1A1D23` |
| **Focus** | `#0B7464` + ring | `#FFFFFF` | `#1A1D23` |
| **Error** | `#DC2626` | `#FFFFFF` | `#1A1D23` |
| **Disabled** | `#ECEEF1` | `#F1F3F5` | `#9CA3AF` |

### Badges & Tags

| Type | Background | Text |
|------|-----------|------|
| **Default** | `#F1F3F5` | `#4B5262` |
| **Primary** | `#D1F7EC` | `#0B7464` |
| **Success** | `#ECFDF5` | `#15803D` |
| **Warning** | `#FFFBEB` | `#B45309` |
| **Error** | `#FEF2F2` | `#B91C1C` |
| **Info** | `#EFF6FF` | `#1D4ED8` |

### Status Dots

Small colored dots (8px) next to attendance/health status. These are decorative (non-text) so they follow the 3:1 non-text contrast rule against their background:

| Status | Dot Color | On White (3:1) |
|--------|----------|----------------|
| Present | `#16A34A` | 3.3:1 Pass |
| Absent | `#DC2626` | 4.8:1 Pass |
| Late | `#D97706` | 3.0:1 Pass |
| Excused | `#6B7280` | 5.0:1 Pass |
| Pending | `#9CA3AF` | 2.9:1 (pair with text label) |

---

## 9. Color Tokens (CSS Custom Properties)

For implementation, define as CSS custom properties on `:root`:

```css
:root {
  /* Primary — Meadow */
  --color-primary-50:  #EFFCF8;
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

  /* Backgrounds & Surfaces */
  --color-bg-page:    #F7F8FA;
  --color-bg-surface: #FFFFFF;
  --color-bg-subtle:  #F1F3F5;
  --color-bg-muted:   #E8EAED;

  /* Text */
  --color-text-primary:   #1A1D23;
  --color-text-secondary: #4B5262;
  --color-text-tertiary:  #6B7280;
  --color-text-disabled:  #9CA3AF;
  --color-text-inverse:   #FFFFFF;

  /* Borders */
  --color-border-default: #E2E5E9;
  --color-border-subtle:  #ECEEF1;
  --color-border-strong:  #C9CED4;
  --color-border-focus:   #0B7464;

  /* Semantic — Success */
  --color-success-light: #ECFDF5;
  --color-success:       #16A34A;
  --color-success-dark:  #15803D;

  /* Semantic — Warning */
  --color-warning-light: #FFFBEB;
  --color-warning:       #D97706;
  --color-warning-dark:  #B45309;

  /* Semantic — Error */
  --color-error-light: #FEF2F2;
  --color-error:       #DC2626;
  --color-error-dark:  #B91C1C;

  /* Semantic — Info */
  --color-info-light: #EFF6FF;
  --color-info:       #2563EB;
  --color-info-dark:  #1D4ED8;

  /* Module Accents */
  --color-module-health:   #059669;
  --color-module-attend:   #2563EB;
  --color-module-alerts:   #D97706;
  --color-module-learning: #7C3AED;
  --color-module-meals:    #EA580C;
  --color-module-finance:  #4F46E5;
  --color-module-comms:    #E11D48;
  --color-module-sleep:    #0284C7;

  /* Sidebar */
  --color-sidebar-bg:          #1A1F2E;
  --color-sidebar-bg-hover:    #252B3B;
  --color-sidebar-bg-active:   #2F3749;
  --color-sidebar-text:        #94A3B8;
  --color-sidebar-text-active: #F1F5F9;
  --color-sidebar-accent:      #36CCA8;
  --color-sidebar-border:      #2D3548;
}
```

### Dark Mode Overrides

```css
[data-theme="dark"] {
  --color-bg-page:    #0F1117;
  --color-bg-surface: #1A1D27;
  --color-bg-subtle:  #252831;
  --color-bg-muted:   #2D3139;

  --color-text-primary:   #F1F3F5;
  --color-text-secondary: #94A3B8;
  --color-text-tertiary:  #64748B;
  --color-text-disabled:  #475569;

  --color-border-default: #2D3548;
  --color-border-subtle:  #1E2535;
  --color-border-strong:  #3D4760;
  --color-border-focus:   #36CCA8;

  /* Primary shifts lighter on dark backgrounds */
  --color-primary-interactive: #36CCA8;
  --color-primary-surface:     #0B2E27;
}
```

---

## 10. Accessibility Checklist

Before shipping any UI using this palette:

- [ ] All body text meets **4.5:1** contrast ratio (WCAG AA)
- [ ] All large text (18px+ or 14px+ bold) meets **3:1** (WCAG AA)
- [ ] Interactive elements (links, buttons) use `primary-700` or darker on white
- [ ] Color is **never the sole indicator** of state — always pair with icons, text, or patterns
- [ ] Error/success/warning states use both color AND text labels
- [ ] Focus rings (`border-focus`) are visible on all interactive elements
- [ ] Tested with color blindness simulators (protanopia, deuteranopia, tritanopia)
- [ ] Dark mode contrast ratios independently verified

---

## Sources & References

### Color Psychology Research
- [The Power of Color in Child Care](https://www.childcarerenovation.com/the-power-of-color-in-child-care/) — Color psychology in childcare environments
- [Color Psychology Nursery Paint Choices](https://www.tollbrothers.com/blog/color-psychology-nursery-paint-choices) — Nursery environment color effects
- [Colour Psychology in the Nursery](https://www.avery-row.com/blogs/news/colour-psychology-in-the-nursery-soothe-and-inspire-your-baby) — Soothing vs. stimulating color guidance

### SaaS Palette Design
- [Color Systems for SaaS](https://www.merveilleux.design/en/blog/article/color-systems-for-saas) — Structuring color systems for software
- [8 Color Palettes for SaaS Apps](https://saasdesigner.com/8-color-palettes-for-saas-apps-in-2024/) — SaaS-specific palette examples
- [Choosing Color Palette for SaaS Application](https://moldstud.com/articles/p-selecting-the-perfect-color-palette-to-enhance-your-saas-application-and-optimize-user-interface-design-strategies) — UI design strategies
- [How to Design Accessible Color Palette for B2B SaaS](https://standardbeagle.com/accessible-color-palette/) — Accessible SaaS palette guidelines

### 2026 Trends
- [5 Color Palettes for Balanced Web Design in 2026](https://www.elegantthemes.com/blog/design/color-palettes-for-balanced-web-design) — Current color trends
- [Top 2026 Web Design Color Trends](https://www.loungelizard.com/blog/web-design-color-trends/) — Emerging color directions
- [Top 20 Modern Color Combinations 2026](https://prodesignschool.com/design/top-20-modern-color-combinations-must-use-in-2026/) — Modern palette combinations

### Accessibility & WCAG
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) — WCAG contrast ratio verification
- [Accessible Palette](https://accessiblepalette.com/) — Accessible color system generator
- [InclusiveColors](https://www.inclusivecolors.com/) — WCAG-compliant palette creator
- [Color Safe](http://colorsafe.co/) — Accessible color combinations

### Education & Childcare UI
- [Best Color Combinations for Educational Websites](https://verpex.com/blog/website-tips/best-color-combinations-for-educational-websites) — Education sector color guidance
- [Top Colors for eLearning](https://www.learnworlds.com/top-colors-for-elearning/) — Learning platform color research
- [4 Tips to Use Color in eLearning](https://elearningindustry.com/4-tips-use-color-in-elearning) — Color application in education
- [Education Color Palettes](https://coolors.co/palettes/trending/education) — Trending education color schemes

### Sidebar & Dashboard UX
- [Best UX Practices for Sidebar Menu Design 2025](https://uiuxdesigntrends.com/best-ux-practices-for-sidebar-menu-in-2025/) — Sidebar design research
- [Dark Mode in SaaS UX](https://medium.com/@hashbyt/https-medium-com-hashbyt-dark-mode-saas-ux-design-benefits-0273c81c0af1) — Dark mode benefits and patterns
- [Top Dashboard Design Trends 2025](https://uitop.design/blog/design/top-dashboard-design-trends/) — SaaS dashboard color trends
