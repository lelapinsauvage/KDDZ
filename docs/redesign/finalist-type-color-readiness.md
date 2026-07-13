# Kiddz Online Finalist Type And Color Readiness

**Date:** 2026-07-13
**Status:** Reversible pre-lock due diligence complete; Arabic family and production brand lock open
**Live evidence:** `/design-lab/brand-directions/finalists`
**Production redesign:** Paused

## Question

Can Kinetic Kindness and Living Record become production brand systems without
weakening dense data, multilingual operation, semantic state, privacy, loading,
or licensing requirements?

## Source Findings

### Licensing and delivery

- [Fredoka's official Google Fonts license](https://github.com/google/fonts/blob/main/ofl/fredoka/OFL.txt),
  [Newsreader's official license](https://github.com/google/fonts/blob/main/ofl/newsreader/OFL.txt),
  and [Inter's official license](https://github.com/google/fonts/blob/main/ofl/inter/OFL.txt)
  are SIL Open Font License 1.1.
- The license permits use, embedding, bundling, and redistribution subject to its
  terms. This is production-feasible evidence, not legal advice.
- [Next.js font optimization](https://nextjs.org/docs/app/getting-started/fonts)
  includes self-hosting and serves Google Font assets from the deployment domain,
  so the browser does not request them from Google.
- The current design lab uses variable families through `next/font/google` and
  `display: "swap"`. A selected constitution still needs a measured subset,
  preload, fallback-metric, and route-budget decision.

### Script coverage

Official Google Fonts metadata reports:

| Family | Upstream subsets relevant to Kiddz | Current lab load | Readiness |
| --- | --- | --- | --- |
| [Fredoka](https://github.com/google/fonts/blob/main/ofl/fredoka/METADATA.pb) | Latin, Latin extended, Hebrew | Latin | Viable identity/display face; no Arabic |
| [Newsreader](https://github.com/google/fonts/blob/main/ofl/newsreader/METADATA.pb) | Latin, Latin extended, Vietnamese | Latin | Viable editorial display face; no Arabic |
| [Inter](https://github.com/google/fonts/blob/main/ofl/inter/METADATA.pb) | Latin, Latin extended, Greek, Cyrillic, Vietnamese | Latin | Viable product face; no Arabic |

Neither finalist's current pair covers Arabic. The prior territory stress test
correctly replaces all Latin display/product families with `system-ui` under
Arabic, but that is an implementation fallback rather than a distinctive brand
decision.

## Arabic Candidate Lane

No Arabic family is selected in this slice. The production constitution should
compare these source-supported lanes against real Lebanese Arabic, English,
French, mixed-name, numeric, form, PDF, email, iOS, and Android fixtures:

1. **Shared product baseline:**
   [Noto Sans Arabic](https://github.com/google/fonts/blob/main/ofl/notosansarabic/METADATA.pb)
   is OFL, variable across weight and width, and covers Arabic plus Latin,
   symbols, and math. It is the strongest neutral baseline for forms, tables,
   labels, and evidence.
2. **Kinetic expressive candidate:**
   [Readex Pro](https://github.com/google/fonts/blob/main/ofl/readexpro/METADATA.pb)
   covers Arabic, Latin, Latin extended, and Vietnamese. Its warmer geometry may
   relate to Kinetic Kindness, but it must be rejected if it reads as childish,
   changes dense metrics too much, or weakens high-risk authority.
3. **Living Record editorial candidate:**
   [Noto Naskh Arabic](https://github.com/google/fonts/blob/main/ofl/notonaskharabic/METADATA.pb)
   provides an Arabic reading voice for narrative and parent-facing moments. It
   must remain outside compact controls and tabular evidence, matching
   Newsreader's restricted Latin role.

The three candidate families are available to the installed Next.js font
loader. Candidate availability does not equal selection or cross-platform
approval.

## Role Contract

Both finalists keep the same production-safe role boundary:

| Role | Kinetic Kindness | Living Record | Shared rule |
| --- | --- | --- | --- |
| Identity / low-risk display | Fredoka | Newsreader | Never carries facts by itself |
| Navigation, form, table, evidence | Inter | Inter | Tabular numerals and explicit state |
| Arabic product | Open; Noto Sans Arabic baseline | Open; Noto Sans Arabic baseline | Dedicated tested family required |
| Arabic expressive display | Open; Readex Pro candidate | Open; Noto Naskh Arabic candidate | May not leak into dense tools |
| Fallback | Writing-system-aware system stack | Writing-system-aware system stack | Visible only as fallback, never called brand-ready |

At 200% text, display, product, body, label, metadata, and numeric proof roles
scale independently from layout. The specimen uses source-backed `1:6`,
`12:30-13:00`, and revision 13 values rather than invented dashboard data.

## Color Contract

The finalists may differ in brand hue and emotional temperature, but both must
preserve the same semantic grammar:

- **Safe:** confirmed source and completed consequence.
- **Forecast:** future change that requires planned work.
- **Unknown:** a missing or stale source, never an implied safe state.
- **Critical:** immediate risk or failed high-risk obligation.
- **Action:** interaction hierarchy, not a duplicate status taxonomy.
- **Brand:** identity and selected emotional moments, not universal dashboard
  categorization.

Every proof state uses a label and shape/icon in addition to color. No gradient,
rainbow card taxonomy, colored left border, or fabricated chart is introduced.

## Finalist Impact

### Kinetic Kindness

Fredoka remains viable only when it is restricted to identity and selected
low-risk display. The shared Inter product layer protects data and authority.
Its principal unresolved cost is finding an Arabic expressive family that feels
related without becoming juvenile. Readex Pro is a candidate, not an answer.

### Living Record

Newsreader remains viable for narrative headings and parent/evidence reading
moments. It cannot enter compact controls or tables. Noto Naskh Arabic offers a
credible editorial lane, but a second expressive script family increases
governance and performance cost.

### Recommendation impact

The evidence does not reverse the ranking. Kinetic Kindness remains the research
lead because type roles can keep its warmth out of high-risk data. Living Record
remains the stronger evidence-led alternative. Neither finalist is multilingual
brand-ready until an Arabic family is selected and verified during the brand
constitution.

## Verification Boundary

The controlled appendix must pass both finalists at default and 200% specimen
text on desktop and mobile with:

- one H1 and one active finalist;
- correct `lang`, `dir`, and isolated mixed-number behavior;
- no page, readiness panel, or semantic-grid overflow;
- no unnamed or undersized visible control;
- readable labels independent of color;
- zero axe violations and zero incomplete findings;
- deterministic source checks, TypeScript, ESLint, route compatibility, diff
  hygiene, and production build.

Still open: actual browser zoom, real Arabic font rendering, translation,
VoiceOver/NVDA/TalkBack, PDF/email/export/native typography, measured font
payloads, operator testing, font selection approval, legal review, and the
production brand lock.
