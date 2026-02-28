# Garderie Typography Guide

> **Design Vision:** "Apple meets nursery" — warm, readable, modern. Typography that feels friendly and human while maintaining the professionalism of a SaaS dashboard.
>
> **Date:** February 2026

---

## Design Philosophy

This type system is built on three principles from our design research:

1. **Rounded warmth, not childishness.** The best childcare apps (Famly, Brightwheel, DaycareSOS) use rounded sans-serifs for headings — soft terminals that convey warmth without resorting to comic/handwritten fonts. We pair a rounded display font with a clean geometric body font for the balance of personality and professionalism.

2. **Bilingual from day one.** Garderie's compliance forms use Arabic (ministry requirements). Rather than bolting on Arabic as an afterthought, our body font natively supports both Latin and Arabic scripts with harmonious metrics. One font, two scripts, zero compromise.

3. **Two fonts, one voice.** Following the industry standard (Famly: 2 fonts; Brightwheel: 1; DaycareSOS: 1), we use exactly two text fonts — one for personality in headings, one for clarity in body — plus a monospace for technical content. Fewer fonts = faster loads, tighter visual consistency.

---

## 1. Font Selection

### Display / Heading Font: Nunito

| Property | Value |
|----------|-------|
| **Name** | Nunito |
| **Designer** | Vernon Adams, Cyreal |
| **Category** | Geometric sans-serif with rounded terminals |
| **Google Fonts** | https://fonts.google.com/specimen/Nunito |
| **CDN** | `https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800&display=swap` |
| **Weights needed** | SemiBold (600), Bold (700), ExtraBold (800) |
| **Variable font** | Yes — `wght` axis 200–1000 |
| **License** | SIL Open Font License 1.1 |

#### Why Nunito?

- **Rounded terminals** on every stroke ending — gives instant warmth without illustrations or decorative elements. This is the single most important quality for a nursery brand heading font.
- **Wide letterforms with open counters** — legible at every size, from page titles down to card headings. Critical for dashboard-dense UIs where headings compete for attention.
- **The gold standard for childcare apps.** Our design research found Nunito/Nunito Sans recommended as the #1 typeface for childcare software across multiple independent sources. It sits in the exact sweet spot: playful without being childish, warm without being unprofessional.
- **Geometric skeleton with humanist curves** — shares geometric DNA with Cairo (our body font), so the two pair naturally without clashing.
- **Not Inter, not Roboto, not system fonts.** Nunito has genuine personality — you recognize it. The rounded terminals are its signature, and they align perfectly with our design system's rounded corners (12px cards, 8px buttons).

#### What it's NOT for

Nunito is a heading/display font only. Its rounded terminals reduce readability at body text sizes (14–16px) compared to Cairo's crisper forms. Do not use Nunito for body paragraphs, form labels, or table data.

---

### Body / UI Font: Cairo

| Property | Value |
|----------|-------|
| **Name** | Cairo |
| **Designer** | Mohamed Gaber (TitraShop, Egypt) |
| **Category** | Contemporary geometric sans-serif |
| **Google Fonts** | https://fonts.google.com/specimen/Cairo |
| **CDN** | `https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap` |
| **Weights needed** | Light (300), Regular (400), Medium (500), SemiBold (600), Bold (700) |
| **Variable font** | Yes — `wght` axis 200–1000 |
| **Scripts** | Latin, Arabic, Farsi, Urdu |
| **License** | SIL Open Font License 1.1 |

#### Why Cairo?

- **Native bilingual: Latin + Arabic in one font.** Cairo was designed from the ground up as a dual-script typeface. The Latin and Arabic characters share metrics, proportions, and stroke weight — they sit on the same baseline with harmonious x-heights. When our compliance forms switch to Arabic, the visual rhythm doesn't break.
- **Kufi-influenced Arabic, Naskh readability.** The Arabic script blends geometric Kufi aesthetics (modern, authoritative) with Naskh readability principles (easy on the eyes for body text). This is exactly the "professional yet warm" balance we target.
- **9 weights from Thin to Black.** Full weight range gives us fine-grained hierarchy within body content — Light for secondary captions, Regular for body, Medium for emphasis, SemiBold for subheadings, Bold for strong labels.
- **Generous x-height and open counters.** Optimized for screen readability at 14–16px body sizes. The letterforms don't collapse or blur at small sizes on mobile screens.
- **Geometric DNA complements Nunito.** Both fonts share a geometric skeleton. Nunito adds rounded warmth on top; Cairo keeps it clean and crisp. The pairing feels like one family, not two strangers.
- **NOT generic.** Cairo has character — it's recognizably Egyptian-designed, modern, and fresh. It doesn't look like every other SaaS dashboard (unlike Inter/Roboto). The subtle Kufi influence in letterforms gives it a distinctive quality.
- **Strong ligature and diacritics support.** Critical for Arabic compliance forms that require proper tashkeel (diacritical marks) for official ministry documents.

#### What it's for

Everything that isn't a heading or code: body paragraphs, form labels, table data, navigation items, button labels, captions, descriptions, tooltips, Arabic text of any kind.

---

### Monospace Font: JetBrains Mono

| Property | Value |
|----------|-------|
| **Name** | JetBrains Mono |
| **Designer** | JetBrains, Philipp Nurullin |
| **Category** | Monospace |
| **Google Fonts** | https://fonts.google.com/specimen/JetBrains+Mono |
| **CDN** | `https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap` |
| **Weights needed** | Regular (400), Medium (500) |
| **License** | SIL Open Font License 1.1 |

#### Why JetBrains Mono?

- **Increased letter height for readability** — taller characters make IDs, codes, and numbers scannable at a glance in tables and cards.
- **Distinct character differentiation** — `0` vs `O`, `1` vs `l` vs `I` are unambiguous. Critical for student IDs, invoice numbers, and registration codes.
- **Functional ligatures** — programming ligatures can be disabled; what remains is a clean, modern monospace that doesn't look "developer-y" in a nursery context.
- **Pairs well visually** — its geometric structure harmonizes with Cairo and Nunito without feeling jarring in a card or badge.

#### What it's for

Student IDs, invoice numbers, registration codes, timestamps in logs, phone numbers in tables, any data where character-level alignment matters.

---

## 2. Font Pairing Rationale

### Why this combination works

```
┌─────────────────────────────────────────────────┐
│  Nunito ExtraBold                               │
│  "Welcome back, Sarah"              ← Display   │
│                                                 │
│  Cairo Regular                                  │
│  Here's what happened at Little Stars           │
│  Nursery today. Luna had a wonderful     ← Body │
│  morning with her friends.                      │
│                                                 │
│  Student ID: JS-2024-0847           ← Mono      │
│  JetBrains Mono Regular                         │
└─────────────────────────────────────────────────┘
```

| Quality | Nunito (Heading) | Cairo (Body) | Relationship |
|---------|-----------------|--------------|--------------|
| Skeleton | Geometric | Geometric | Shared foundation |
| Terminals | Rounded | Clean/straight | Contrast creates hierarchy |
| Personality | Warm, friendly | Modern, precise | Complementary moods |
| X-height | Tall | Tall | Visual harmony |
| Weight range | 600–800 (we use) | 300–700 (we use) | Non-overlapping roles |

### The bilingual story

| Context | Heading | Body |
|---------|---------|------|
| **English UI** | Nunito Bold | Cairo Regular |
| **Arabic compliance forms** | Cairo Bold | Cairo Regular |
| **Mixed content (labels in Arabic, UI in English)** | Nunito Bold (English headings), Cairo Bold (Arabic headings) | Cairo Regular (both scripts) |

When the UI switches to Arabic or renders Arabic form content, Cairo handles both heading and body roles. Its Bold weight is strong enough for headings, and its Arabic script has inherent calligraphic authority. Nunito steps aside gracefully — no fallback hacks needed.

---

## 3. Type Scale

Based on a **1.250 ratio** (Major Third) — creates clear hierarchy without extreme jumps. Optimized for dashboard density where space is tight but readability is paramount.

### Heading Scale

| Token | Size | Line Height | Weight | Font | Usage |
|-------|------|-------------|--------|------|-------|
| `h1` | 30px / 1.875rem | 38px (1.27) | Nunito 800 | Nunito | Page titles: "Dashboard", "Students" |
| `h2` | 24px / 1.5rem | 32px (1.33) | Nunito 700 | Nunito | Section titles: "Today's Attendance" |
| `h3` | 20px / 1.25rem | 28px (1.40) | Nunito 700 | Nunito | Card titles: "Health Records" |
| `h4` | 18px / 1.125rem | 24px (1.33) | Nunito 600 | Nunito | Subsection headings |
| `h5` | 16px / 1rem | 22px (1.38) | Cairo 600 | Cairo | Small headings, table group headers |
| `h6` | 14px / 0.875rem | 20px (1.43) | Cairo 600 | Cairo | Sidebar section labels, card subtitles |

### Body Scale

| Token | Size | Line Height | Weight | Font | Usage |
|-------|------|-------------|--------|------|-------|
| `body-lg` | 16px / 1rem | 26px (1.625) | Cairo 400 | Cairo | Primary body text, descriptions |
| `body` | 14px / 0.875rem | 22px (1.571) | Cairo 400 | Cairo | Default UI text, form labels, table cells |
| `body-medium` | 14px / 0.875rem | 22px (1.571) | Cairo 500 | Cairo | Emphasized body text, active nav items |
| `body-sm` | 13px / 0.8125rem | 20px (1.538) | Cairo 400 | Cairo | Secondary descriptions, helper text |

### Utility Scale

| Token | Size | Line Height | Weight | Font | Usage |
|-------|------|-------------|--------|------|-------|
| `caption` | 12px / 0.75rem | 16px (1.33) | Cairo 500 | Cairo | Timestamps, metadata, badge text |
| `overline` | 11px / 0.6875rem | 16px (1.45) | Cairo 600 | Cairo | Section overlines, category labels (UPPERCASE) |
| `code` | 13px / 0.8125rem | 20px (1.538) | JetBrains Mono 400 | JetBrains Mono | Student IDs, invoice numbers |
| `code-sm` | 12px / 0.75rem | 16px (1.33) | JetBrains Mono 400 | JetBrains Mono | Timestamps in tables, registration codes |

### Arabic-Specific Adjustments

When rendering Arabic text, apply these overrides:

| Property | Latin Value | Arabic Override | Reason |
|----------|------------|-----------------|--------|
| Line height | 1.5–1.625 | 1.7–1.8 | Arabic diacritics (tashkeel) need vertical room |
| Letter spacing | 0 to +0.01em | 0 (never positive) | Arabic is cursive; positive tracking breaks ligatures |
| Font size (body) | 14px | 15px | Arabic glyphs render slightly smaller at same px size |
| Direction | `ltr` | `rtl` | Bidirectional layout support |
| Text alignment | `left` | `right` | Follows reading direction |

---

## 4. Line Height Guidelines

### Principles

- **Tighter for headings** (1.25–1.40) — headings are short, scanned quickly, and need compact visual presence
- **Looser for body** (1.5–1.625) — body text needs breathing room for sustained reading
- **Extra room for Arabic** (1.7–1.8) — diacritical marks above and below characters require additional vertical space

### Quick Reference

| Context | Line Height | Notes |
|---------|------------|-------|
| Page titles (h1) | 1.27 | Tight — large text self-spaces |
| Section titles (h2–h3) | 1.33–1.40 | Moderate — may wrap to 2 lines on mobile |
| Body text | 1.571–1.625 | Generous — optimized for 14–16px reading |
| Captions & small text | 1.33 | Tighter — short strings, rarely multi-line |
| Arabic body text | 1.7–1.8 | Extra room for tashkeel marks |
| Table cells | 1.43 | Moderate — keeps row height reasonable |
| Button labels | 1.0 | Single-line, vertically centered with padding |

---

## 5. Letter Spacing (Tracking)

### Principles

- **Default is zero.** Both Nunito and Cairo are designed with optimal spacing at their native metrics. Don't track body text.
- **Slight positive tracking for overlines/labels.** Small uppercase text benefits from +0.05–0.08em spacing.
- **Never add positive tracking to Arabic text.** Arabic is a connected script — adding space between characters breaks word shapes and destroys readability.

### Specifications

| Context | Letter Spacing | Notes |
|---------|---------------|-------|
| Headings (h1–h4) | `-0.01em` | Slight tightening — large text looks looser |
| Body text | `0` | Native spacing is optimal |
| Small text (caption) | `0` | Cairo handles small sizes well |
| Overline / labels | `+0.06em` | Opens up uppercase small text |
| Button labels | `+0.02em` | Subtle — improves scannability |
| Monospace (code) | `0` | JetBrains Mono is pre-optimized |
| Arabic (any size) | `0` | Never track Arabic script |

---

## 6. Font Loading Strategy

### Performance Budget

| Font | File Size (woff2, variable) | Priority |
|------|----------------------------|----------|
| Cairo (variable) | ~85 KB | **Critical** — loads first, used everywhere |
| Nunito (variable) | ~75 KB | **High** — loads second, used for headings |
| JetBrains Mono (2 weights) | ~45 KB | **Low** — loads last, used sparingly |
| **Total** | **~205 KB** | Under 250 KB budget |

### Loading Implementation

```html
<!-- Preconnect for faster resolution -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- Critical font first (body text — prevents layout shift) -->
<link rel="preload" as="style"
  href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap">

<!-- Load all fonts -->
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&family=Nunito:wght@600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
  rel="stylesheet">
```

### CSS Font Stack (Fallbacks)

```css
:root {
  --font-heading: 'Nunito', 'Cairo', system-ui, -apple-system, sans-serif;
  --font-body: 'Cairo', 'Nunito Sans', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;

  /* Arabic-specific stack (used when dir="rtl") */
  --font-body-ar: 'Cairo', 'Noto Sans Arabic', 'Segoe UI', sans-serif;
  --font-heading-ar: 'Cairo', 'Noto Sans Arabic', sans-serif;
}
```

### `font-display: swap`

All fonts use `display=swap` in the Google Fonts URL. This means:
- Text renders immediately in the fallback system font
- Swaps to the custom font once loaded (typically < 200ms on broadband)
- No invisible text (FOIT) — only a brief flash of unstyled text (FOUT)

---

## 7. CSS Custom Properties (Tokens)

```css
:root {
  /* Font Families */
  --font-heading: 'Nunito', 'Cairo', system-ui, -apple-system, sans-serif;
  --font-body: 'Cairo', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', monospace;

  /* Font Sizes */
  --text-h1: 1.875rem;     /* 30px */
  --text-h2: 1.5rem;       /* 24px */
  --text-h3: 1.25rem;      /* 20px */
  --text-h4: 1.125rem;     /* 18px */
  --text-h5: 1rem;         /* 16px */
  --text-h6: 0.875rem;     /* 14px */
  --text-body-lg: 1rem;    /* 16px */
  --text-body: 0.875rem;   /* 14px */
  --text-body-sm: 0.8125rem; /* 13px */
  --text-caption: 0.75rem; /* 12px */
  --text-overline: 0.6875rem; /* 11px */
  --text-code: 0.8125rem;  /* 13px */
  --text-code-sm: 0.75rem; /* 12px */

  /* Line Heights */
  --leading-h1: 2.375rem;    /* 38px */
  --leading-h2: 2rem;        /* 32px */
  --leading-h3: 1.75rem;     /* 28px */
  --leading-h4: 1.5rem;      /* 24px */
  --leading-h5: 1.375rem;    /* 22px */
  --leading-h6: 1.25rem;     /* 20px */
  --leading-body-lg: 1.625rem; /* 26px */
  --leading-body: 1.375rem;  /* 22px */
  --leading-body-sm: 1.25rem; /* 20px */
  --leading-caption: 1rem;   /* 16px */

  /* Font Weights */
  --weight-light: 300;
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;
  --weight-extrabold: 800;

  /* Letter Spacing */
  --tracking-tight: -0.01em;
  --tracking-normal: 0;
  --tracking-wide: 0.02em;
  --tracking-wider: 0.06em;
}
```

---

## 8. Usage Examples

### Dashboard Header

```
Font:    Nunito ExtraBold (800)
Size:    30px (h1)
Color:   text-primary (#1A1D23)
Spacing: -0.01em
Example: "Good morning, Sarah ☀️"
```

### Section Title

```
Font:    Nunito Bold (700)
Size:    24px (h2)
Color:   text-primary (#1A1D23)
Spacing: -0.01em
Example: "Today's Attendance"
```

### Card Title

```
Font:    Nunito Bold (700)
Size:    20px (h3)
Color:   text-primary (#1A1D23)
Spacing: -0.01em
Example: "Luna's Daily Report"
```

### Body Text

```
Font:    Cairo Regular (400)
Size:    14px (body)
Color:   text-primary (#1A1D23)
Line-H:  22px (1.571)
Example: "Luna had a great morning! She played with building blocks
          during free time and ate all her lunch."
```

### Arabic Compliance Form Label

```
Font:    Cairo SemiBold (600)
Size:    15px (body, +1px Arabic override)
Color:   text-primary (#1A1D23)
Line-H:  27px (1.8, Arabic override)
Dir:     rtl
Example: "اسم الطفل الكامل"
```

### Arabic Form Body Text

```
Font:    Cairo Regular (400)
Size:    15px
Color:   text-secondary (#4B5262)
Line-H:  27px (1.8)
Dir:     rtl
Example: "يرجى ملء جميع الحقول المطلوبة بدقة لضمان التوافق مع متطلبات الوزارة"
```

### Table Data

```
Font:    Cairo Regular (400)
Size:    14px (body)
Color:   text-primary (#1A1D23)
Example: "Luna Mahmoud    |  Pre-K  |  Present  |  8:15 AM"
```

### Student ID in Badge

```
Font:    JetBrains Mono Regular (400)
Size:    12px (code-sm)
Color:   text-secondary (#4B5262)
Example: "STD-2026-0847"
```

### Sidebar Navigation Item

```
Font:    Cairo Medium (500)
Size:    14px (body)
Color:   sidebar-text (#94A3B8) → sidebar-text-active (#F1F5F9)
Example: "Students"
```

### Button Label

```
Font:    Cairo SemiBold (600)
Size:    14px (body)
Color:   text-inverse (#FFFFFF)
Spacing: +0.02em
Example: "Check In"
```

---

## 9. Responsive Adjustments

### Mobile (< 640px)

| Token | Desktop | Mobile | Change |
|-------|---------|--------|--------|
| `h1` | 30px | 24px | Scaled down — less screen estate |
| `h2` | 24px | 20px | Scaled down |
| `h3` | 20px | 18px | Slight reduction |
| `h4` | 18px | 16px | Slight reduction |
| `body-lg` | 16px | 16px | **No change** — minimum readable size |
| `body` | 14px | 14px | **No change** — minimum for mobile |
| `caption` | 12px | 12px | **No change** — absolute minimum |

### Tablet (640px – 1024px)

Use desktop sizes. The dashboard layout adjusts, not the typography.

### Large Desktop (> 1440px)

Consider scaling h1 to 36px and h2 to 28px if the content area exceeds 900px width. Body text stays at 14–16px — larger body text on wide screens reduces reading speed.

---

## 10. Fonts We Considered But Didn't Choose

| Font | Why Considered | Why Rejected |
|------|---------------|--------------|
| **Inter** | Industry standard UI font. Excellent readability. | Too generic — it's the "default" SaaS font. Zero personality. Requirement explicitly excluded it. |
| **Roboto** | Google's workhorse. Huge weight range. | Feels "Android/Material" — not aligned with our Apple-meets-nursery vision. Excluded by requirement. |
| **Plus Jakarta Sans** | Modern geometric, stylistic alternates. | No Arabic support. Looks great for Latin-only SaaS but doesn't solve our bilingual requirement. |
| **Figtree** | Friendly geometric, rising star in SaaS. | No Arabic support. Latin-only character set. |
| **Quicksand** | Rounded, soft, distinctive personality. | Too rounded for body text — readability drops at 14px. Better as a display-only font, but Nunito fills that role with better readability. |
| **Poppins** | Geometric, popular, wide weight range. | Overused. No Arabic. Circular forms can feel "bubbly" rather than "warm." |
| **Nunito Sans** | Clean companion to Nunito. | No Arabic support. Cairo fills the body role better with its bilingual capability. |
| **IBM Plex Sans Arabic** | Excellent Arabic. Professional. | Too corporate — feels "IBM" in a nursery context. Cairo has more warmth and character. |
| **Noto Sans Arabic** | Google's universal Arabic solution. | Functional but generic. Cairo is purpose-designed for modern Arabic UI with more distinctive character. |
| **Space Grotesk** | Used by DaycareSOS. Quirky personality. | No Arabic. More "tech startup" than "nursery." |

---

## Sources

### Font Research
- [Typography in Digital Products for Kids](https://medium.com/ux-of-edtech/typography-in-digital-products-for-kids-f10ce0588555) — EdTech typography principles
- [Education Typography: Font Best Practices](https://www.progress.com/blogs/best-practices-choosing-typography-education-websites-apps) — Education website font guidelines
- [Best Fonts for Apps in 2025](https://www.frontmatter.io/blog/best-fonts-for-apps-in-2025-top-picks-for-ios-and-android-ui-design) — Mobile app typography trends
- [Best Child-Friendly Print Fonts from Google Fonts](https://www.colourmylearning.com/2025/08/best-child-friendly-print-fonts-from-google-fonts-for-early-readers/) — Child-friendly font selection

### SaaS Typography
- [Top 20 Open-Source Fonts for SaaS Products](https://www.artacitko.com/single-post/top-20-open-source-fonts-and-pairings-for-saas-products) — SaaS font pairing guide
- [Best UI Design Fonts 2026](https://www.designmonks.co/blog/best-fonts-for-ui-design) — Current UI font trends
- [Best Font Combinations for SaaS](https://princepaluiux.com/blog/best-font-combinations-saas-application-typography-guide/) — SaaS typography combinations
- [7 Font Combinations for SaaS UI Designers](https://saasdesigner.com/7-font-combinations-for-saas-ui-designers/) — Proven SaaS pairings
- [10 Trending Fonts for SaaS Websites in 2025](https://medium.com/@mypippa.studio/10-trending-fonts-for-saas-websites-in-2025-for-ui-ux-design-a8860171721d) — Trending SaaS typefaces

### Arabic Typography
- [10 Arabic Fonts Every UX Designer Should Know in 2025](https://ahmedelramlawy.com/10-arabic-fonts-every-ux-designer-should-know-in-2025/) — Arabic UX font guide
- [Modernizing Arabic Fonts — Google Design](https://design.google/library/modernizing-arabic-typography-type-design) — Google's Arabic type design principles
- [Advancing Arabic Fonts and the Ideal UI for Arabic Typography](https://blog.29lt.com/2025/12/09/advancing-arabic-fonts-and-the-ideal-ui-for-arabic-typography/) — Arabic UI typography research
- [Cairo — Google Fonts](https://fonts.google.com/specimen/Cairo) — Cairo typeface specimen
- [Cairo GitHub Repository](https://github.com/Gue3bara/Cairo) — Cairo typeface source and documentation

### Font Specimens
- [Nunito — Google Fonts](https://fonts.google.com/specimen/Nunito)
- [Cairo — Google Fonts](https://fonts.google.com/specimen/Cairo)
- [JetBrains Mono — Google Fonts](https://fonts.google.com/specimen/JetBrains+Mono)
- [IBM Plex Sans Arabic — Google Fonts](https://fonts.google.com/specimen/IBM+Plex+Sans+Arabic)
- [Noto Sans Arabic — Google Fonts](https://fonts.google.com/noto/specimen/Noto+Sans+Arabic)
