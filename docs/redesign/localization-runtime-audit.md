# Localization, Time, Money, And Writing-System Audit

**Date:** 2026-07-10  
**Scope:** Production runtime source, Prisma schema, PDFs, public shell, and preserved parent/native contracts  
**Visual direction:** Territory-neutral  
**Production behavior changed:** No

## Question

Can the redesigned product support England, Ireland, the existing Lebanese legacy model, Arabic content, and preserved native clients without letting the browser, server host, or a hard-coded currency decide what a date, time, amount, name, or address means?

## Method

The audit combines:

- a reproducible source scanner: `pnpm tsx src/scripts/report-redesign-localization.ts --summary`;
- direct inspection of `prisma/schema.prisma`, the root layout, financial validation/actions, PDF primitives, address/name forms, and parent-native compatibility modules;
- an unauthenticated browser check of the live public shell at port 3001;
- the jurisdiction policy baseline and existing operational-time findings.

The scanner covers 755 production TypeScript/TSX files. It excludes generated Prisma code, scripts, and design-lab fixtures so current product debt is not inflated by tooling or prototypes.

The local demo credentials displayed by the login page were stale, so private settings runtime was not opened. No account or nursery record was created or changed. Root language/direction is browser-confirmed; private-field direction is source-confirmed.

## Reproducible Baseline

| Pattern | Occurrences | Risk |
| --- | ---: | --- |
| ISO date truncation/splitting | 181 | Critical where a timestamp is treated as a plain date |
| UTC-derived `today` defaults | 28 | Critical for operational work around local midnight |
| Hard-coded `en-US` | 43 | High |
| Hard-coded `en-GB` | 52 | High |
| `toLocaleDateString` calls | 73 | Medium; behavior is distributed |
| `toLocaleTimeString` calls | 10 | Medium |
| `toLocaleString` calls | 25 | Medium |
| Direct `Intl.DateTimeFormat` | 2 | Inventory |
| Direct `Intl.NumberFormat` | 0 | High gap for money and counts |
| `date-fns`-style `format(...)` calls | 40 | Medium; fixed English patterns dominate |
| Unconfigured `localeCompare` calls | 39 | Medium for multilingual names and lists |
| Explicit RTL attributes | 56 | Existing capability, not a complete bidi system |
| Runtime `USD` tokens | 11 | High |
| Runtime `LBP` tokens | 10 | High |
| Runtime `EUR` tokens | 0 | Confirms current finance remains Lebanon/US-dollar specific |

Writing-system inventory:

- 2,088 Arabic codepoints across 16 production files.
- Arabic appears primarily in Lebanese ministry/compliance, address, child, and employee forms.
- The application document is always `<html lang="en">` with LTR direction.
- The root web font loads Open Sans only with `latin` and `latin-ext`; the mono font loads only `latin`.
- No explicit internationalization or time-zone package is installed.

Schema inventory:

- Organization, branch, and user have no locale field.
- Organization, branch, and user have no IANA time-zone field.
- `Payment.currency` defaults to `USD`.
- `BranchCompliance.country` and `ChildAddress.country` default to `Lebanon`.
- Payment validation currently permits only `USD` and `LBP`.

## Findings

### L01 - No authoritative localization context

**Severity:** P0 architecture

The runtime has no persisted answer for:

- the branch's operational time zone;
- organization and branch country/jurisdiction;
- default display locale;
- user display locale and hour-cycle preference;
- accounting/base currency;
- parent communication language;
- legal document language;
- week start and programme calendar.

The browser and Node process therefore become accidental policy. A manager in Paris viewing a London branch, a server running in UTC, and a parent using Arabic can derive different labels from the same value.

**Target:** resolve one explicit localization context for every request and include its identifiers in operational calculations, display formatting, exports, and audit evidence.

### L02 - `today` can be the wrong operational date

**Severity:** P0 correctness

Twenty-eight defaults generate a date key by truncating `new Date().toISOString()`. Confirmed consumers include Today, child and staff attendance, daily care, absence, incidents, calls, medical records, notifications, and payments.

ISO timestamps are UTC. Before or after local midnight, the UTC date can differ from the branch's operational date. The user can therefore open a form for the wrong day even though the displayed clock looks local.

**Target:** derive operational date from an instant plus the branch's IANA time zone. The user device time zone may format personal context but does not define a nursery's legal day.

### L03 - Plain dates, times of day, and instants are conflated

**Severity:** P0 correctness

The application often:

- turns a `@db.Date` or `YYYY-MM-DD` value into JavaScript `Date`;
- truncates a timestamp back into `YYYY-MM-DD`;
- stores time-of-day values in `DateTime` using `1970-01-01T<time>`;
- compares a local form date with a UTC timestamp;
- serializes SQL-style date/time strings for legacy and native consumers.

These represent different concepts:

| Concept | Example | Required representation |
| --- | --- | --- |
| Plain date | Child date of birth, report date, policy effective date | `YYYY-MM-DD`, no time zone conversion |
| Plain time | Lunch at 12:30, opening at 07:30 | `HH:mm[:ss]` plus owning schedule context |
| Instant | Submission at a globally ordered moment | UTC instant with offset-normalized storage |
| Local operational date-time | Room assignment from 12:30 at Riverside | local date/time plus IANA zone, resolved to instant |
| Interval | Shift, attendance session, entitlement period | typed start/end with boundary policy |

**Target:** the domain type chooses parsing and formatting. Feature code cannot convert between types through generic `new Date(value)`.

### L04 - Date and time presentation is contradictory

**Severity:** P1 usability and evidence

The same product mixes:

- `en-GB` day-first dates;
- `en-US` month-first or month-name dates;
- fixed `MMM d, yyyy` English date-fns patterns;
- browser-default locale;
- raw ISO dates;
- 12-hour and 24-hour time;
- UTC getter formatting in child and native compatibility surfaces.

Printed records, PDFs, lists, and forms can represent the same day differently. Ambiguous numeric dates are unacceptable in medical, attendance, finance, and inspection evidence.

**Target:** semantic format presets with explicit locale, time zone, calendar, and hour cycle. High-risk evidence uses an unambiguous localized long date or ISO date alongside context where needed.

### L05 - Money is formatted as a symbol branch, not a financial type

**Severity:** P0 finance

Current finance is explicitly Lebanese/US-dollar specific:

- payments default to `USD`;
- validation permits `USD` or `LBP` only;
- UI helpers branch between `$` and `LL`;
- number formatting is hard-coded to `en-US`;
- no production `Intl.NumberFormat` call centralizes currency fraction, grouping, sign, or locale;
- invoice wording hard-codes `US DOLLAR` or `LEBANESE POUND`.

The new territory prototypes use synthetic EUR data, but that does not make production finance EUR-ready.

**Target:** amount and ISO 4217 currency code remain machine data. Display uses a governed formatter; exchange rate, rounding, base currency, settlement currency, funded credit, parent charge, and ledger allocation remain separate concepts.

### L06 - Arabic exists, but bidi and typography are partial

**Severity:** P1 accessibility and legal data

The product has meaningful Arabic content and explicit RTL containers/fields, which is valuable legacy capability. However:

- the document language and direction stay English/LTR;
- most Arabic fields have `dir="rtl"` but no `lang="ar"`;
- mixed Arabic/Latin names, email, telephone, identifiers, punctuation, and currency can reorder unexpectedly;
- Latin-only web-font subsets force an uncontrolled fallback for Arabic;
- layout CSS is not governed around logical start/end properties;
- directional icons and navigation behavior have no product-level RTL contract.

**Target:** language, script, and direction are independent but coordinated. Structured Arabic fields declare Arabic; mixed user text uses safe automatic direction and bidi isolation; the chosen type system proves every required script and weight.

### L07 - Address, phone, and identity models encode one country

**Severity:** P1 market readiness

Current address and identity structures preserve important Lebanese ministry data: governorate, district, registry, Arabic/Latin names, property information, and default country. Child and contact forms use `+961` examples. These fields cannot be removed or flattened.

They also cannot serve as a universal UK/Ireland address and contact model.

**Target:** preserve the Lebanese compliance projection while introducing canonical country-aware postal address, phone, and identity objects. Country-specific regulatory fields remain policy-owned extensions, not optional columns shown to everyone.

Phone numbers need original input, normalized E.164 where possible, country context, extension, verification state, and display formatting. Names need script/language attribution and display-order rules without assuming one Western `first last` shape.

### L08 - Search and sorting are locale-implicit

**Severity:** P1 daily usability

Thirty-nine `localeCompare` calls omit a governed collator. Search normalization is inconsistent and some flows strip accents while others do not. Arabic and Latin variants of one person are stored separately but have no shared search/display policy.

**Target:** use a context-owned `Intl.Collator` and search-normalization strategy. Search may match alternate script forms while display preserves the authored name. Sorting must be stable, testable, and appropriate for the active locale.

### L09 - PDFs and exports can disagree with the UI or lose glyphs

**Severity:** P0 evidence

Shared PDFs hard-code `en-GB` date/time and built-in Helvetica. Several PDF routes repeat fixed formatters. Built-in Helvetica is not a proven Arabic font/shaping solution. A screen can show Arabic source data while its exported legal evidence renders missing or malformed glyphs.

**Target:** every document template owns locale, direction, approved font subset, number/date presets, time-zone context, and page-flow tests. The rendered PDF, not React source alone, is the acceptance artifact.

### L10 - Native compatibility cannot be localized in place

**Severity:** P0 parity

Parent/native compatibility modules intentionally preserve legacy SQL-style date strings, UTC getters, historical keys, and currency fields. Existing iOS/Android parsers may depend on exact shapes. Replacing a legacy date or amount string with a localized label can break parsing even if the web UI improves.

**Target:** freeze existing payloads behind compatibility adapters. Add versioned machine fields or endpoints for new clients; never repurpose a legacy field. New contracts carry plain date, instant, time zone, amount, currency code, locale metadata, and optional display labels separately.

## Target Localization Context

### Persisted policy

`OrganizationLocalizationPolicy` or equivalent needs:

```text
organizationId
countryCode
jurisdictionCode
defaultLocale
supportedLocales
legalLocales
defaultTimeZone
defaultCurrency
calendarSystem
weekStartsOn
defaultHourCycle
numberingSystem
effectiveFrom / effectiveTo
source / reviewer / revision
```

Each branch can override operational time zone, jurisdiction/provider policy pack, address, week/calendar, and accounting context. A branch override is explicit and auditable.

### User and communication preferences

User preferences can choose display locale, hour cycle, numbering system, and personal time zone for personal/non-operational context. Parent/child relationships can store preferred communication language and accessible-format needs.

User preference never changes the branch operational date or the currency of an existing ledger entry.

### Resolution order

1. Record and jurisdiction policy determine legal meaning, retention, and legal document language.
2. Branch determines operational time zone, calendar, and active accounting context.
3. User determines display locale and allowed personal presentation preferences.
4. Browser/device locale is an onboarding suggestion and fallback warning only.
5. Missing required context produces `Unknown` or configuration work; it never silently falls back to the server host.

The resolved context and revision travel with server actions and audit events.

## Formatting And Parsing Contract

Shared APIs should expose semantic operations, not raw pattern strings:

```text
resolveLocalizationContext(scope, user)
operationalDate(instant, branchTimeZone)
parsePlainDate(yyyyMmDd)
formatPlainDate(date, preset, context)
formatPlainTime(time, preset, context)
formatInstant(instant, preset, context)
formatInterval(interval, preset, context)
formatMoney(amount, currency, preset, context)
formatNumber(value, preset, context)
formatCount(count, messageKey, context)
collate(values, context)
```

Rules:

- Feature components do not call locale/date/currency formatters directly once migrated.
- Server and client receive the same explicit context and fixture tests.
- Parsing user-entered numbers is separate from formatting; decimal and grouping separators are validated by locale.
- Relative time never replaces an absolute timestamp in high-risk history.
- ISO is a transport/storage representation, not the default user-facing format.
- Date-only values remain strings or a dedicated plain-date type through transport.
- Time-of-day is not modeled as a 1970 instant in new domain objects.

## Design-System Contract

### Direction and layout

- Set document `lang` and `dir` from resolved UI locale.
- Mark passages that change language.
- Use CSS logical properties (`margin-inline`, `padding-inline`, `inset-inline`, `border-start-start-radius`) in shared components.
- Mirror only directional navigation/action icons. Status, media, brand, and universal symbols do not mirror automatically.
- Use `<bdi>` or equivalent isolation for user names, identifiers, currency, phone, and mixed-script values.
- Use `dir="auto"` for genuinely mixed authored text; use explicit direction for structured known-script fields.
- Keyboard order, focus movement, drawer origin, breadcrumb direction, and table pinning must be tested in both directions.

### Typography

- Final product fonts must support every launch script, required weight, tabular figures, currency symbols, and PDF embedding rights.
- Arabic is tested for joining, diacritics, line height, truncation, numerals, and bold hierarchy, not merely glyph presence.
- Long English, Arabic, and translated labels must fit at 200% zoom without font-size-by-viewport hacks.
- Product, evidence, and brand type may use different families only if all required scripts have an intentional pairing.

### Forms and tables

- Labels remain persistent; placeholders do not carry translation or formatting rules alone.
- Date controls show explicit day/month/year meaning and preserve the plain date.
- Telephone fields accept international input without forcing `+961` outside Lebanese context.
- Address forms render fields from the active country/jurisdiction profile while preserving legacy fields in evidence and migration views.
- Money fields always show currency code or unambiguous symbol context.
- Dense tables use locale-aware sort but stable machine keys and tabular figures.

## Native And Compatibility Contract

### Existing clients

- Preserve all current `/ws/**` and parent API field names, date strings, null behavior, currency strings, ordering, and status codes.
- Continue regression tests for Swift/Java parser assumptions.
- Do not localize compatibility payloads by changing their existing values.

### New clients

Versioned responses should expose:

```json
{
  "localDate": "2026-07-10",
  "instant": "2026-07-10T09:18:00Z",
  "timeZone": "Europe/London",
  "amount": "240.00",
  "currency": "EUR",
  "locale": "en-GB",
  "display": "EUR 240.00"
}
```

`display` is optional convenience. Machine fields remain authoritative. Legal documents and regulator exports are server-rendered from approved templates; ordinary device UI can format machine values using the resolved user context.

## Migration Plan

### Wave 0 - Freeze and measure

- Keep the scanner in CI/reporting.
- Snapshot high-risk web, PDF, parent, and native payloads.
- Add time-zone boundary, currency, Arabic, and bidi fixtures before behavior changes.

### Wave 1 - Add context without changing output

- Add versioned organization/branch localization policy and user preferences.
- Backfill explicit Lebanon/USD/current-host assumptions as reviewed migration data rather than silent defaults.
- Resolve context in server actions and include its revision in audit events.

### Wave 2 - Introduce domain primitives

- Add plain-date, plain-time, instant, interval, money, phone, address, localized text, and collator helpers.
- Migrate Today, attendance, daily care, incidents, calls, medicine, and payments first.
- Ban new direct `toISOString().slice/split` date logic in feature code.

### Wave 3 - Correct temporal storage and workflows

- Replace new 1970-anchored time-of-day fields with explicit time values.
- Preserve adapters for existing database and native fields.
- Reconcile operational date from branch time zone on the server.

### Wave 4 - Correct finance and funded-hours display

- Expand currency validation through policy rather than a global enum.
- Centralize money formatting and ledger semantics.
- Prove England and Ireland programme-year configurations without changing Lebanese legacy entries.

### Wave 5 - Add full bidi and script support

- Choose tested web/PDF fonts after creative-territory selection.
- Convert shared components to logical layout properties.
- Add locale bundles, translation workflow, copy ownership, and mixed-script search.

### Wave 6 - PDFs, exports, and native evolution

- Render and visually inspect every evidence template in every supported legal language.
- Add versioned native machine fields while preserving old adapters.
- Release new native parsing only after contract fixtures pass on iOS and Android.

### Wave 7 - Remove compatibility only with evidence

Legacy formatters, default-country behavior, and compatibility fields remain until parity rows and real-client telemetry or signed acceptance prove retirement is safe.

## Acceptance Fixtures

### Time and date

1. The same instant resolves to different operational dates for `Europe/London`, `Europe/Paris`, and `Asia/Beirut` where applicable.
2. Plain date `2026-03-29` survives client/server/database/PDF round trip through a DST boundary.
3. A London attendance check-in around midnight belongs to the branch date, not the manager laptop date.
4. A scheduled future policy change uses the future zone/rule without rewriting historical records.
5. Leap day, year boundary, DST gap, and DST overlap have explicit outcomes.

### Number and money

1. `USD`, `LBP`, and `EUR` values preserve exact stored amounts across `en-US`, `en-GB`, `fr-FR`, and Arabic display fixtures.
2. A currency change never mutates an existing ledger entry's code.
3. Negative, zero, large, and fractional amounts remain unambiguous in table, form, PDF, and native payload.
4. Localized number input rejects ambiguous grouping instead of silently changing value.

### Language and direction

1. Arabic-only, Latin-only, and mixed-script child/staff names render and sort predictably.
2. Email, phone, currency, date, and record IDs remain readable inside RTL context.
3. Drawer, breadcrumbs, table pinning, back/forward icons, and focus order pass RTL keyboard tests.
4. Screen readers announce the correct page and passage language.
5. Every selected font and PDF template renders Arabic joining and diacritics correctly.
6. Long translated copy and 200% zoom produce no overlap, clipping, or inaccessible ellipsis.

### Compatibility

1. Existing parent/native snapshots remain byte/shape compatible where required.
2. New versioned fields parse on representative iOS and Android clients.
3. Web and native show the same source instant, local date, amount, and status after independent formatting.

## Decisions

1. Localization is operational infrastructure, not a final translation layer.
2. Branch time zone defines nursery operational date; user locale defines display.
3. Legal/template language and programme policy remain effective-dated and source-owned.
4. Plain date, plain time, instant, local date-time, and interval are distinct domain types.
5. Money is amount plus ISO currency and ledger context, never a symbol-prefixed number.
6. Lebanese and Arabic legacy capability is preserved through country/script-specific projections, not made the global default.
7. Existing native payloads remain stable; localization evolves through versioned machine fields.
8. Missing required localization context is visible configuration debt and cannot resolve to `Safe`, `Submitted`, or legally complete evidence.

## Open Gates

1. First launch jurisdiction, supported UI languages, legal document languages, and native release matrix.
2. Whether branch or organization owns base accounting currency in multi-country groups.
3. Required Arabic font style and numeral convention within the selected creative territory.
4. Address and identity fields required by England, Ireland, and Lebanese ministry workflows.
5. Country-specific phone validation and verification provider.
6. Translation ownership, review, terminology, and release process.
7. Calendar systems beyond Gregorian and accessibility preferences beyond locale.
8. Approved PDF fonts, shaping engine behavior, and archival requirements.

Until these gates close, the audit defines architecture and fixtures; it does not enable a language switcher or alter production records.
