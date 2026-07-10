# Kiddz Online Redesign Progress

**Last updated:** 2026-07-10
**Plan:** `docs/redesign-master-plan.md`
**Program state:** Product discovery and benchmark research closed; territory-neutral IA, state, motion, jurisdiction, localization, reliability, accessibility, performance, and data-delivery contracts documented and tested; creative selection gate open
**Reported progress:** **46% done / 54% left**

The percentage is weighted by verified phase gates. It is not an estimate based on time or code volume.

## Phase Tracker

| Phase | Weight | Status | Earned | Evidence required to close |
| --- | ---: | --- | ---: | --- |
| 0. Safety and baseline | 3% | Complete | 3% | Clean branch, approved asset preservation, baseline screenshots and checks |
| 1. Product discovery | 12% | Complete | 12% | Flow inventory, role/task matrix, current journeys, friction/risk register |
| 2. Benchmark research | 10% | Complete | 10% | Pinterest taxonomy, Mobbin flow sheets, direct-competitor operations, benchmark synthesis |
| 3. Brand strategy and direction | 10% | In progress | 6% | Strategy, three complete territories, selected brand constitution |
| 4. IA and core UX | 12% | In progress | 4% | Sitemap, navigation model, Today model, tested wireframes |
| 5. Design system | 13% | In progress | 11% | Tokens, components, motion, responsive, accessibility, performance, and data-delivery foundations |
| 6. Pilot core flows | 15% | Not started | 0% | Shell, Today, attendance, ratios, child profile verified |
| 7. Full product rollout | 20% | Not started | 0% | All canonical flows migrated with parity evidence |
| 8. Hardening and award polish | 5% | Not started | 0% | QA, performance, accessibility, award scorecards and assets |
| **Total** | **100%** |  | **46%** |  |

## Confirmed Baseline

- Repository: `lelapinsauvage/KDDZ`.
- Local checkout: `/Users/karimsaab/Desktop/garderie`.
- Active redesign branch: `ux-redesign-awards`, created directly from verified `main` at `0359e26`.
- `main`, `legacy-parity-runbook`, `ux-redesign`, and their corresponding remote refs currently point to commit `0359e26`.
- The approved Remotion logo work and planning documents are preserved on the redesign branch.
- The rejected `src/app/design-lab/dashboard-cards/page.tsx` experiment was excluded from the redesign branch.
- Current product census: 244 page files, 83 route handlers, 113 React component files.
- The functional restoration parity matrix contains 1,713 rows and remains the preservation source.

### Foundation verification

- `pnpm exec eslint remotion --max-warnings=0`: passed.
- `pnpm exec next typegen`: passed.
- `pnpm exec tsc --noEmit --pretty false`: passed after removing the stale generated `.next/dev` cache.
- Remotion composition `KiddzOnlineLogoIntro` rendered successfully at frame 115.

### Discovery evidence

- Eleven authenticated 1440 x 900 browser baselines are stored in `docs/redesign/baseline/`.
- `docs/redesign/flow-inventory.md` maps 244 page files into 22 canonical domains and seven critical end-to-end journeys.
- `docs/redesign/current-state-findings.md` records current strengths, risks, problem statements, and research questions.
- `src/scripts/report-redesign-parity-domains.ts` assigns all 1,713 parity rows to canonical redesign or platform domains with zero unmapped rows.
- The first confirmed runtime defects include dashboard horizontal overflow, colliding chart labels, unsafe all-present attendance defaults, ambiguous time context, and missing live ratio state.
- `docs/redesign/role-runtime-audit.md` records authenticated manager, teacher, nurse, doctor, and parent structure without committing personal data; all temporary audit users were deleted.
- Role runtime confirms an admin-clone manager home, identical nurse/doctor homes, teacher redirection to Today with 14 children selected by default, and a 213-report parent history rendered eagerly.
- `docs/redesign/journey-state-audit.md` traces J01-J07 through source of truth, mutation, validation, completion, recovery, audit, downstream effects, and parity constraints.
- The state audit confirms that present child attendance is not persisted, factual care defaults can be submitted, drafts can appear done, medical transitions are not server-owned, live ratio resolution is absent, payment and balance stores are disconnected, and export descriptions overstate package content.
- `docs/redesign/responsive-runtime-audit.md` and its metrics cover Dashboard, Today, Children, Accounting, Daily Reports, and Settings at 1280 x 800, 1024 x 768, and 390 x 844 without committing personal-record screenshots.
- Responsive runtime confirms clipped chart meaning at 1024, page-level table overflow, a 9,085-pixel mobile Today flow, and desktop decision load carried almost unchanged into mobile.
- `docs/redesign/authorization-scope-audit.md` traces modern roles, legacy page/action grants, tenant/record checks, direct-route behavior, and the target capability/scope contract without preserving personal data.
- Permission runtime confirms that a branch-bound teacher can directly open several hidden organization-wide medical, staff, parent, export, alarm, and reporting surfaces; unconfigured legacy controls currently default allow.
- `docs/redesign/operational-architecture-synthesis.md` defines the live operating model, Today hierarchy, canonical objects, work-item lifecycle, role projections, and integrity gates.
- `docs/redesign/brand-expression-synthesis.md` translates the approved identity seed and research into governed color, typography, shape, illustration, voice, motion, and territory criteria.
- `docs/redesign/cross-device-synthesis.md` assigns desktop, tablet, mobile, parent, and native surfaces distinct jobs while preserving shared state, drafts, permissions, and compatibility contracts.
- `docs/redesign/targeted-reference-flow-study.md` adds source-linked Apple, Things, Headspace, Flighty, Airbnb, Stripe, and Anything evidence for motion purpose, consequence, recovery, live state, and handoff.
- `docs/redesign/brand-strategy.md` defines purpose, promise, positioning, audience tensions, narrative, value pillars, message hierarchy, personality, voice, terminology, and trust requirements around `Care, visibly handled.`
- `docs/redesign/creative-territory-briefs.md` defines Daylight, Signal, and Carebook as distinct build systems with shared realistic content, palette/type/motion hypotheses, screen requirements, risks, and kill criteria.

## Locked Decisions

| Decision | Status | Evidence |
| --- | --- | --- |
| Desktop is the primary design surface | Locked | User direction |
| The operational UI is approximately 90% white/near-white | Locked | User direction |
| Color must visually guide importance and action | Locked | User direction |
| The product must be expressive and unique, not generic SaaS | Locked | User direction and rejected prototypes |
| All restored functionality remains accessible | Locked | Product mission and parity matrix |
| No fake charts or unnecessary data visualization | Locked | User direction |
| No random decorative shapes, colored left borders, or filler | Locked | User direction and rejected prototypes |
| Motion should use purposeful springs, continuity, and morphs | Locked principle | User direction; final tokens pending research |
| Pinterest board is a living reference source | Locked | User-supplied board |
| Current approved logo intro is the identity baseline | Locked baseline | Completed Remotion iteration |

## Research Coverage

| Reference | Web | Mobile/Mobbin | Flow notes | Synthesis |
| --- | --- | --- | --- | --- |
| Pinterest board | Initial visible set reviewed | N/A | Complete first pass | Integrated in expression map |
| Revolut | Official product/design process reviewed | Sending-money flows inspected | Complete first pass | Integrated in three maps |
| Notion | Current spacing/adjacency system reviewed | Web creation/filter flows inspected | Complete first pass | Integrated in three maps |
| Cursor | Current public product and state model reviewed | Agent task/review flows inspected | Complete first pass | Integrated in three maps |
| Cosmos | Official web/App Store reviewed | Save/library flows inspected | Complete first pass | Integrated in three maps |
| Vercel / Geist | Official system reviewed | Project/deployment flows inspected | Complete first pass | Integrated in three maps |
| Duolingo | Official brand guidelines and saved motion reference identified | Lesson/completion flows inspected | Complete first pass | Integrated in expression/behavior maps |
| Duolingo ABC | Official context reviewed | Alphabet/story flows inspected | Complete first pass | Integrated in behavior map |
| Genie iOS | Exact App Store product identified | Text/image chat flows inspected | Complete first pass | Integrated with explicit rejection rules |
| Anything web/iOS | Official product/App Store reviewed | One exact Mobbin screen; multi-step flow unavailable | Partial | Cross-device promise retained; weak evidence labeled |
| Apple first-party apps | Current HIG motion/feedback/undo/alert guidance reviewed | Reminders creation flow inspected | Complete first pass | Consequence budget integrated |
| Things 3 | Official interaction, scheduling, and device guidance reviewed | Create/edit/delete flows inspected | Complete first pass | Progressive power and return integrated |
| Headspace | Saved references and current product context reviewed | Session/reflection/completion flows inspected | Complete first pass | Emotional moment and source return integrated |
| Flighty | Official live-state/Live Activities guidance reviewed | Detail/en-route/history flows inspected | Complete first pass | Live explainability integrated |
| Airbnb | Official booking requirements reviewed | Booking/pending/trip-detail flows inspected | Complete first pass | Consequence review integrated |
| Stripe | Official dashboard/refund state docs reviewed | Transaction/refund/cancel/history flows inspected | Complete first pass | Durable financial state integrated |
| Direct nursery competitors | Ten-product official-source capability pass complete | Live/Mobbin flows pending | Complete capability pass | Integrated in operational map |

## Current Tooling Note

The Mobbin MCP is registered, authenticated, and available in this task. Two flow studies now cover Revolut, Notion, Cursor, Cosmos, Vercel, Duolingo, Duolingo ABC, Genie, 7shifts, Headspace, Things, Flighty, Airbnb, Stripe, and Apple Reminders. One exact Anything screen was retained; exact multi-step Anything, Brightwheel, and Famly results were unavailable, and unrelated matches were excluded.

## Next Work Queue

1. Present the three scored territories and provisional Daylight recommendation at the creative-selection gate.
2. After selection, codify the final brand constitution, visual tokens, themes, component APIs, and motion tokens.
3. Build the desktop-first production pilot across shell, Today, live attendance/ratios, and child profile with parity evidence.
4. Validate the pilot with role, branch, permission, database, responsive, accessibility, and performance fixtures before rollout.
5. Continue operator, jurisdiction, real-device, and direct-nursery questions at their implementation gates.

## Definition of a Completed Tracker Item

An item is complete only when:

- Its expected artifact exists.
- Sources or product evidence are linked.
- Acceptance criteria are checked.
- Browser evidence exists when the item affects UI or behavior.
- Functional parity implications are recorded.
- Open risks and assumptions are documented.
- Relevant tests pass.
- The change is committed in a reviewable increment when implementation has begun.

## Decision Log

| Date | Decision | Why | Reversible |
| --- | --- | --- | --- |
| 2026-07-10 | Use a research-gated redesign process before further page styling | Previous styling attempts lacked a shared visual language and did not change the UX | Yes |
| 2026-07-10 | Separate benchmark principles from visual copying | The product needs its own identity while learning from excellent systems | Yes |
| 2026-07-10 | Weight progress by verified deliverables | Percentage estimates previously became misleading | Yes |
| 2026-07-10 | Keep functional parity as a parallel acceptance track | A beautiful redesign cannot remove restored legacy behavior | No for removal; mapping is revisable |
| 2026-07-10 | Create `ux-redesign-awards` directly from verified `main` | All local and remote restoration/design refs shared the same base, and the new name separates accepted work from rejected experiments | Yes |
| 2026-07-10 | Preserve the approved Remotion identity work and exclude the dashboard card lab | The user approved the logo direction and explicitly rejected the dashboard experiment | Yes |
| 2026-07-10 | Organize the product around a live, explainable operating model and owned resolution | Current modules expose facts but force managers to assemble readiness and responsibility mentally | Yes, pending prototype and operator validation |
| 2026-07-10 | Separate brand, guidance, operational, and evidence expression levels | Kiddz needs warmth and recognition without weakening dense or high-risk work | Yes, through territory testing |
| 2026-07-10 | Design desktop, tablet, mobile, parent, and native projections around distinct jobs | Runtime measurements show that stacked desktop hierarchy preserves too much decision load | Yes, while shared object contracts remain fixed |

## Work Log

### 2026-07-10 - Phase 0 foundation

- **Question:** Can the redesign begin from a clean, auditable branch without losing approved identity work?
- **Evidence:** Local/remote branch refs, worktree diff, Remotion source, rejected design-lab route, TypeScript and ESLint output, rendered frame 115.
- **Decision:** Create `ux-redesign-awards` from `main`, preserve Remotion and plan files, exclude the rejected dashboard lab.
- **Verification:** Remotion ESLint passed; Next route types regenerated; TypeScript passed; Remotion still rendered successfully.
- **Closure:** The authenticated eleven-screen browser baseline and runtime findings now close the remaining Phase 0 evidence requirement.
- **Next action:** Start the current-product canonical flow inventory and browser baseline.
- **Progress earned:** 1 additional percentage point; total 3%.

### 2026-07-10 - Phase 1 current-state discovery

- **Question:** What are the real user workflows beneath the legacy route count, and where does the current experience create operational risk?
- **Evidence:** Authenticated browser runs at 1440 x 900 across dashboard, Today, branches, children, child dossier, daily reports, staff, medical, accounting, messaging, and settings; role navigation source; Prisma roles; route and parity inventories.
- **Decision:** Treat 22 domains as canonical redesign surfaces and prioritize seven cross-domain journeys instead of redesigning 244 pages independently.
- **Artifacts:** `docs/redesign/flow-inventory.md`, `docs/redesign/current-state-findings.md`, eleven baseline PNGs, and the generated parity-domain ledger.
- **Open items:** Role-specific sessions, mutation/error traces, responsive baselines, and parity-row linking.
- **Next action:** Build the reproducible domain-to-parity ledger, then continue role and responsive runtime discovery.
- **Progress earned:** 3 additional percentage points; total 6%.

### 2026-07-10 - Phase 2 benchmark research pass 1

- **Question:** Which qualities from the user's references and named world-class products are transferable to Kiddz Online, and where must copying stop?
- **Evidence:** Public Pinterest board and ten saved pins; official sources from Revolut, Notion, Cursor, Cosmos, Vercel/Geist, Duolingo, Anything, Genie, Apple, and award/accessibility standards.
- **Decision:** Separate a high-expression brand/guidance layer from a precise operational layer; use state, contextual density, complete lifecycle feedback, and governed character/motion rules as cross-benchmark principles.
- **Artifacts:** `docs/redesign/pinterest-taxonomy.md`, `docs/redesign/benchmark-matrix.md`, and dated Pinterest screenshots.
- **Open items:** Mobbin screen-by-screen mobile flows, Duolingo ABC, direct nursery competitor refresh, and complete cross-device synthesis.
- **Next action:** Continue discovery responsive baselines while expanding direct competitor and mobile-flow research.
- **Progress earned:** 2 additional percentage points; total 8%.

### 2026-07-10 - Phase 2 direct competitor capability pass

- **Question:** Which nursery-management capabilities are category expectations, and where can Kiddz create a defensible manager experience without inventing unsupported competitor weaknesses?
- **Evidence:** Current official product and support sources for Famly, Brightwheel, Blossom, Connect Childcare, Tapestry, Cheqdin, Lillio, Procare, Illumine, and Nursery Story, compared with the current Kiddz flow inventory and runtime findings.
- **Decision:** Treat feature breadth as table stakes. Advance a reversible product thesis around a live, explainable, resolution-oriented desktop operating model, with role-specific companion surfaces and full restored parity.
- **Artifact:** `docs/redesign/competitor-gap-analysis.md`; direct-competitor synthesis added to `docs/redesign/benchmark-matrix.md`.
- **Evidence boundary:** Capability claims are supported; comparative usability, motion, accessibility, and flow quality remain pending live or Mobbin inspection.
- **Next action:** Continue role and journey discovery, then turn benchmark evidence into operational, brand-expression, and cross-device synthesis maps.
- **Progress earned:** 1 additional percentage point; total 9%.

### 2026-07-10 - Phase 0 closure

- **Question:** Does the redesign now have a clean, reproducible, browser-verified starting point?
- **Evidence:** Dedicated branch history, excluded rejected prototype, approved Remotion source and render, route/component census, TypeScript and ESLint checks, eleven authenticated desktop baselines, and a clean tracked worktree before this documentation increment.
- **Decision:** Close Phase 0. Future baseline expansion belongs to product discovery and cross-device validation, not repository safety.
- **Open item:** None for the Phase 0 gate.
- **Next action:** Continue Phase 1 role and end-to-end journey discovery.
- **Progress earned:** 1 additional percentage point; total 10%.

### 2026-07-10 - Phase 1 role-specific runtime

- **Question:** Does the current product adapt the work itself to each role, or only reduce navigation?
- **Evidence:** Authenticated 1440 x 900 browser sessions for manager, teacher, nurse, doctor, and parent using short-lived audit users; structural route, navigation, action, overflow, and DOM measurements; source role model and permission fallback behavior.
- **Decision:** Treat role-specific homes as a first-class IA requirement. Preserve shared records and permissions while changing hierarchy, ownership, urgency, and primary actions by role.
- **Artifact:** `docs/redesign/role-runtime-audit.md`; role evidence integrated into the current-state findings and canonical flow inventory.
- **Privacy:** No role screenshot or personal record content was committed. Four staff audit users and one parent audit user were deleted after sign-out; no operational record was mutated.
- **Open items:** Real permission variants, critical-journey mutations, responsive behavior, and operator validation.
- **Next action:** Trace J01-J07 through create, edit, confirmation, error, and recovery states.
- **Progress earned:** 2 additional percentage points; total 12%.

### 2026-07-10 - Phase 1 critical journey state audit

- **Question:** Do J01-J07 end in a durable, validated, recoverable, and auditable state, or only appear complete in the interface?
- **Evidence:** Dashboard/Today actions; child and staff attendance persistence; daily-report batch, validation, approval, and nested updates; medical form mutations; staff events/logs/classes; payment and accounting stores; monthly/settings/SQL exports; authenticated role runtime.
- **Decision:** Treat canonical operational state as a prerequisite to visual redesign. Establish explicit attendance sessions, room care sessions, staff presence/assignment and ratio snapshots, server-owned health transitions, one family ledger, work-item ownership, and versioned inspection packages while preserving compatibility projections.
- **Artifact:** `docs/redesign/journey-state-audit.md`; severe findings integrated into `current-state-findings.md` and `flow-inventory.md`.
- **Verification:** Read-only source trace across every journey; no migrated operational record mutated; parity constraints and unresolved legal/operator questions recorded.
- **Open items:** Operator validation, jurisdiction rules, real permission variants, offline conflict policy, responsive runtime, and final canonical object schemas.
- **Next action:** Capture responsive current-state behavior, then finish benchmark flow evidence and synthesis.
- **Progress earned:** 2 additional percentage points; total 14%.

### 2026-07-10 - Phase 1 responsive runtime audit

- **Question:** Does the current product intentionally adapt its hierarchy and interaction model for compact desktop, tablet, and mobile?
- **Evidence:** Authenticated in-app-browser measurements of six routes at 1280 x 800, 1024 x 768, and 390 x 844; four privacy-safe screenshots; geometry and interaction metrics.
- **Decision:** Preserve desktop as the primary manager workspace while designing a distinct tablet room workspace and mobile daily companion. Every chart, table, form, toolbar, card family, and fixed shell region must define responsive behavior.
- **Artifacts:** `docs/redesign/responsive-runtime-audit.md`, `docs/redesign/responsive-baseline-metrics.json`, and four baseline JPG captures.
- **Verification:** Temporary same-origin harness removed; `X-Frame-Options: DENY` restored; short-lived audit user signed out and deleted; zero audit users remained.
- **Open items:** Browser interaction/error states, 200% zoom, real device safe areas/keyboards, permission variants, and target prototype testing.
- **Next action:** Finish permission discovery and benchmark flow synthesis.
- **Progress earned:** 1 additional percentage point; total 15%.

### 2026-07-10 - Phase 2 Mobbin flow study

- **Question:** Which concrete interaction patterns from the named references improve Kiddz workflows, and which surface conventions or product assumptions must be rejected?
- **Evidence:** Mobbin flow previews for Revolut transactions; Notion database creation/filtering; Cosmos save/library; Cursor agent lifecycle/review; Vercel setup/deployment; Duolingo and Duolingo ABC learning/completion; Genie text/image chat; and 7shifts schedule preflight/publish.
- **Decision:** Center the redesign on preserved context, consequence review, durable status, adjacent progressive disclosure, stable feedback regions, semantic color, and named progress. Exclude fintech styling, blank-canvas ambiguity, AI transcript primacy, opaque automation, and gamified high-risk work.
- **Artifact:** `docs/redesign/mobbin-flow-study.md`; flow status and principles integrated into `benchmark-matrix.md`.
- **Evidence boundary:** Exact Anything, Brightwheel, and Famly searches returned unrelated apps, which were excluded. Static previews do not prove motion, accessibility, or performance.
- **Next action:** Complete permission discovery, then build the operational, brand-expression, and cross-device synthesis maps.
- **Progress earned:** 2 additional percentage points; total 17%.

### 2026-07-10 - Phase 1 authorization and scope audit

- **Question:** Do role navigation, direct routes, reads, mutations, exports, and imported legacy grants enforce one effective permission and data-scope policy?
- **Evidence:** Auth/layout/permission source; census of 39 action modules; aggregate database counts; authenticated direct-route pass across eleven high-impact routes using a short-lived branch-bound teacher.
- **Decision:** Introduce a fail-closed domain capability and scope service that intersects tenant, modern role, imported grants, assignments, record relationship, action transition, and policy version. Use the same decision for visibility and server enforcement.
- **Artifact:** `docs/redesign/authorization-scope-audit.md`; permission findings integrated into current-state findings and flow coverage.
- **Verification:** No record mutation; no identity or row content captured; audit persona signed out and deleted with sessions/accounts; zero audit users remained.
- **Open items:** Production meaning of branchless staff, multi-branch assignment, clinical qualification/approval, emergency override, and modern/legacy conflict rules.
- **Next action:** Build the three research synthesis maps, then begin brand strategy.
- **Progress earned:** 1 additional percentage point; total 18%.

### 2026-07-10 - Phase 2 research synthesis maps

- **Question:** What product, expression, and cross-device rules survive when current-state evidence, competitor gaps, benchmark flows, the Pinterest board, approved identity, authorization, and parity are considered together?
- **Evidence:** All discovery artifacts; nine Mobbin benchmark families; ten direct-competitor capability sets; approved Remotion identity source; responsive measurements at three additional viewports; user-locked visual and product constraints.
- **Decision:** Position Kiddz as a live, explainable, resolution-oriented nursery operating system; separate brand expression from operational and evidence layers; use shared canonical objects with task-specific desktop, tablet, mobile, parent, and native projections.
- **Artifacts:** `docs/redesign/operational-architecture-synthesis.md`, `docs/redesign/brand-expression-synthesis.md`, and `docs/redesign/cross-device-synthesis.md`.
- **Verification:** Each map names evidence, transfer rules, rejected patterns, parity boundaries, acceptance gates, and unresolved validation debt; repository diff checks passed and each artifact was committed independently.
- **Open items:** Live Apple/Headspace/Things/Flighty behavior; exact Anything and nursery product flows; operator policy; jurisdiction rules; production native-device matrix.
- **Next action:** Complete the targeted live reference pass, then produce three realistic creative territories and score them before selection.
- **Progress earned:** 2 additional percentage points; total 20%.

### 2026-07-10 - Phase 2 targeted motion, recovery, and live-state pass

- **Question:** Which visible behaviors make completion, pending work, reversal, live state, and cross-device boundaries trustworthy in the remaining high-value references?
- **Evidence:** Current Apple HIG; official Things, Flighty, Airbnb, Stripe, and Anything sources; 18 canonical Mobbin flows plus one exact Anything screen across Apple Reminders, Things, Headspace, Flighty, Airbnb, and Stripe.
- **Decision:** Match feedback to consequence; modify the source object after completion; preserve pending/failed/reversed states; use rich visuals only for rich truth; keep advanced power adjacent; disclose cross-device capability limits before handoff.
- **Artifact:** `docs/redesign/targeted-reference-flow-study.md`; `benchmark-matrix.md` flow coverage updated.
- **Evidence boundary:** Static captures do not prove timing, haptics, accessibility, network recovery, or performance. Exact direct-nursery and Anything multi-step flows remain unavailable.
- **Next action:** Write the final brand strategy and territory briefs, then build three complete territories on realistic product content.
- **Progress earned:** 1 additional percentage point; total 21%.

### 2026-07-10 - Phase 3 brand strategy and territory briefs

- **Question:** What can Kiddz own strategically, and which three expressive mechanisms can test that strategy without changing product truth or production UI?
- **Evidence:** Three synthesis maps, two benchmark flow studies, approved Remotion identity, current product risks, parity obligations, and locked user constraints.
- **Decision:** Use `Care, visibly handled.` as the strategic idea. Build Daylight, Signal, and Carebook from one shared synthetic manager scenario so visual difference cannot hide missing UX.
- **Artifacts:** `docs/redesign/brand-strategy.md` and `docs/redesign/creative-territory-briefs.md`.
- **Verification:** All required strategy outputs and territory screen/state requirements are explicit; each territory defines palette, type, geometry, motion, illustration, cross-device behavior, strengths, risks, and kill criteria.
- **Next action:** Build the shared territory lab and implement all three directions before scoring or recommendation.
- **Progress earned:** 1 percentage point; total 22%.

### 2026-07-10 - Phase 3 creative territory prototypes and provisional evaluation

- **Question:** Which creative system best makes one realistic nursery state immediately understandable, distinctly Kiddz, operationally trustworthy, and scalable across dense and cross-device work?
- **Evidence:** Three implemented Today compositions; shared Children, Daily care, and Safety review workflows; production screenshots; browser measurements at 1440, 1280, 1024, 768, and 390 widths; interaction checks for room/queue continuity, search, factual care submission, accident review history, and payment allocation.
- **Decision:** Advance Daylight as the provisional leading foundation. Reinterpret only Signal's dense alignment grammar and Carebook's record-first language inside Daylight if selected; do not blend their visual systems.
- **Artifacts:** `src/app/design-lab/territories`, `docs/redesign/territories`, and `docs/redesign/territory-evaluation.md`.
- **Verification:** Territory lint, repository TypeScript, diff checks, production build, clean production console, responsive overflow, 44px mobile targets, drawer focus return, and source-state interaction checks passed.
- **Evidence boundary:** Real-user observation, full automated semantics, actual 200% zoom, screen readers, real OS reduced motion, color-vision simulation, and native-device testing remain open. Computed contrast, source tokens, deterministic reduced motion, 320/390 reflow/targets, and drawer keyboard behavior are recorded in `territory-accessibility-validation.md`. User selection remains an irreversible gate; production UI is untouched.
- **Next action:** Continue territory-neutral IA and workflow specification while preparing the selected-direction constitution gate.
- **Progress earned:** 3 percentage points; total 25%.

### 2026-07-10 - Phase 4 territory-neutral IA and core workflow validation

- **Question:** Can one shallow domain model make daily work findable across manager, teacher, nurse, and doctor projections while preserving branch scope, source-object routing, legacy parity, and responsive behavior?
- **Evidence:** 22 canonical domains, 1,713 mapped parity rows, role/runtime audit, seven journey-state contracts, interactive IA lab, production captures, role/branch projection tests, search and queue routing tests, 768 and 390 responsive measurements.
- **Decision:** Use Today, Children, Rooms, Team, Messages, Finance, and Reports as the working staff domains, with Settings separated. Replace actionable alarm taxonomy with owned work that resolves to canonical source objects. Treat route renames and production navigation changes as gated hypotheses.
- **Artifacts:** `docs/redesign/information-architecture.md`, `docs/redesign/core-workflow-blueprints.md`, `docs/redesign/ia-validation.md`, `src/app/design-lab/ia`, and `docs/redesign/ia`.
- **Verification:** IA lint, repository TypeScript, diff checks, production build, clean route console, role and branch scope changes, global search, queue routing, 768 overflow, 390 overflow/targets, and mobile focus return passed.
- **Evidence boundary:** Operator card sorting/first-click tests, first-market terminology, capability fixtures, 200% zoom, screen readers, native comparison, and route compatibility analytics remain open.
- **Next action:** Define territory-neutral design-system acceptance criteria and build workflow wireflows that exercise loading, empty, validation, failure, waiting, success, correction, and offline states without selecting production visuals.
- **Progress earned:** 4 percentage points; total 29%.

### 2026-07-10 - Phase 5 acceptance contract and state-pattern fixtures

- **Question:** Can future components and screens share one strict accessibility, motion, performance, responsive, and workflow-state contract before final visual tokens are selected?
- **Evidence:** Current WCAG 2.2, Apple motion guidance, Vercel interface checks, current Web Vitals thresholds, motion-performance constraints, workflow contracts, and a 15-state interactive Meadow care fixture.
- **Decision:** Set semantic-token-only component rules, 44px operational touch targets, compositor-only interruptible motion, complete high-risk review/correction, stable source context, and mandatory initial/loading/empty/partial/unknown/draft/validation/denial/failure/offline/conflict/waiting/success/corrected/closed fixtures.
- **Artifacts:** `docs/redesign/design-system-acceptance.md`, `docs/redesign/state-pattern-validation.md`, `src/app/design-lab/states`, and `docs/redesign/states`.
- **Verification:** State-lab lint, repository TypeScript, diff checks, production build, clean route console, inline validation/focus, source-updating success, conflict-to-correction history, 390 reflow/targets, mobile drawer focus, and production captures passed.
- **Evidence boundary:** Final brand tokens, light/dark/high-contrast themes, shared production components, real server state machines, automated accessibility, 320 reflow, 200% zoom, screen readers, reduced motion, real-device performance, and offline security remain open.
- **Next action:** Build territory-neutral component anatomy fixtures and motion prototypes only for validated workflow transitions; continue to avoid production visual migration until territory selection.
- **Progress earned:** 3 percentage points; total 32%.

### 2026-07-10 - Phase 5 purposeful-motion contracts

- **Question:** Can spring motion make source continuity, authoritative completion, and contextual control clearer without decoration, blocked input, or motion-only state?
- **Evidence:** Official Motion React layout, presence, configuration, and accessibility guidance; three synthetic operational prototypes; dev and production browser runs; 1280, 768, and 390 viewport measurements; forced reduced-motion inspection; focus and interruption checks.
- **Decision:** Accept shared source continuity, server-confirmed settle, and interruptible panel motion as territory-neutral contracts. Limit these patterns to transform and opacity, preserve durable evidence, and remove geometry motion under reduced motion.
- **Artifacts:** `src/app/design-lab/motion`, `docs/redesign/motion`, and `docs/redesign/motion-pattern-validation.md`; `motion` `12.42.2` added as the lab/runtime dependency.
- **Verification:** Focused lint, repository TypeScript, performance-pattern scan, production build, empty production browser logs, handoff focus return, pending-to-confirmed source update, 60ms panel retarget, reduced-motion zero-transform check, responsive overflow, mobile target, and bottom-sheet checks passed.
- **Defects resolved:** Shared-source removal no longer shifts queue anatomy; mobile header wraps instead of ellipsizing; pointer scrim no longer creates a duplicate accessible close control.
- **Evidence boundary:** Final visual tokens, real operator testing, automated accessibility, 200% zoom, 320 reflow, screen readers, real-device frame timing, and production state-machine integration remain open.
- **Next action:** Close the creative-territory selection gate, then codify final tokens and shared components before beginning the production pilot.
- **Progress earned:** 2 percentage points; total 34%.

### 2026-07-10 - Phase 1 England and Ireland policy baseline

- **Question:** Which current official rules must shape ratio, attendance, qualification, funded-hours, finance, and inspection architecture before production UX can claim safety or compliance?
- **Evidence:** England EYFS framework effective September 2025, April 2026 early-education statutory guidance, 2026/2027 funding guide and model agreement guidance; Irish 2016 Early Years Services Regulations and Schedule 6, May 2026 qualification guidance, ECCE 2025/2026 rules, Core Funding conditions and 2026 announced changes.
- **Decision:** Model jurisdiction as versioned, effective-dated policy packs. Separate legal rules, regulator guidance, annual programme configuration, local agreements, and announced future changes. Missing policy, qualification, presence, or assignment evidence produces `Unknown` rather than `Safe`.
- **Artifacts:** `docs/redesign/jurisdiction-policy-baseline.md`; evidence linkage added to `operational-architecture-synthesis.md`; launch-market question narrowed in `journey-state-audit.md`.
- **Verification:** Every candidate ratio, record, deadline, retention, and funding claim in the baseline links to an official government, statutory, or regulator source; product implications and pre-production fixtures are explicit.
- **Evidence boundary:** Legal review, launch market, exact provider/service classes, mixed-age/school exceptions, local-authority agreements, current NCS provider pack, operator practice, and final retention schedule remain open.
- **Next action:** Convert the selected launch policy pack into schema and executable fixtures during the production pilot; keep calculations fixture-only until legal approval.
- **Progress earned:** 1 percentage point; total 35%.

### 2026-07-10 - Phase 1 localization and cross-device data audit

- **Question:** Can the redesign support branch-local operations, England/Ireland policy, Lebanese legacy data, Arabic content, PDFs, and native clients without ambiguous dates, currencies, or writing direction?
- **Evidence:** Reproducible scan of 755 production files; Prisma organization/branch/user/payment/address models; root font/language configuration; finance validation and formatting; PDF primitives; Arabic compliance and identity forms; parent/native compatibility modules; public-shell browser check.
- **Decision:** Make localization operational infrastructure. Branch time zone defines operational date, user locale defines display, legal templates own language, and existing native fields remain compatibility data. Plain dates, plain times, instants, local date-times, intervals, and money are distinct domain types.
- **Artifacts:** `docs/redesign/localization-runtime-audit.md`, `src/scripts/report-redesign-localization.ts`, and updated cross-device/master-plan evidence links.
- **Verification:** Scanner summary reports 181 UTC date truncations, 28 UTC-today defaults, 95 hard-coded English locales, zero centralized number formatters, 56 explicit RTL attributes, 16 production files with Arabic, no locale/time-zone schema fields, USD payment default, Lebanon address default, and no i18n/time-zone dependency. Focused lint and full TypeScript checks pass.
- **Evidence boundary:** Private settings runtime was not opened because displayed demo credentials were stale; field-level bidi behavior is source-confirmed. Launch languages, legal locales, base-currency ownership, address profiles, PDF fonts, and native release matrix remain selection gates.
- **Next action:** Add localization context and domain primitives during the selected production pilot, preserving legacy/native adapters and proving time-zone, money, RTL, PDF, and parser fixtures first.
- **Progress earned:** 1 percentage point; total 36%.

### 2026-07-10 - Phase 1 reliability, offline, and mutation-delivery audit

- **Question:** Can slow, interrupted, duplicated, or conflicting requests preserve user intent without exposing protected nursery data or claiming completion before server confirmation?
- **Evidence:** Reproducible scan of 755 production files and 39 action modules; Serwist source/default cache and generated worker; production offline fallback in Agent Browser; child enrollment storage; parent token flow; staff/parent logout; payment creation; medical aggregate update; journey, scope, native, and parity evidence; current OWASP, Serwist, MDN, Prisma, Next.js, and Stripe guidance.
- **Decision:** Treat offline tolerance as privacy and data-integrity architecture. Cache only explicit static assets; keep protected reads network-only; move sensitive drafts to scoped server records; require operation receipts/idempotency and aggregate versions; classify high-risk work as online-confirmed; preserve native contracts through adapters.
- **Artifacts:** `docs/redesign/reliability-offline-audit.md`, `src/scripts/report-redesign-reliability.ts`, and updated master-plan, current-state, journey-state, and cross-device evidence links.
- **Verification:** Scanner reports 11 browser-storage writes, root-scoped Serwist default caching, 230 transition calls, zero connectivity/retry/idempotency/optimistic-state infrastructure, 32 transaction calls, 12 multi-write action-file review targets, and no schema version or operation-receipt model. Browser confirms the production offline shell; generated worker confirms API/RSC/HTML catch-all cache routes; focused lint and full TypeScript checks pass.
- **Evidence boundary:** File-level multi-write counts are triage signals; representative medical and payment risks were manually confirmed. No protected cache/storage content was opened, no worker/cache was mutated, and no product capability was removed. Managed-device policy, queueable workflows, retention, parent-session migration, and native release matrix remain implementation gates.
- **Next action:** After creative selection, secure the worker/browser boundary and add receipt/version primitives before any production pilot claims optimistic or offline completion.
- **Progress earned:** 1 percentage point; Phase 1 closes at 12%; total 37%.

### 2026-07-10 - Phase 5 accessibility and input-method runtime audit

- **Question:** Can the selected design system make complete nursery workflows work for keyboard, screen-reader, touch, zoom, reduced-motion, color-vision, and interruption needs without hiding capability?
- **Evidence:** AST scan of 756 production files/533 TSX files; authenticated Agent Browser measurements on eight core routes at desktop and 320px; partial 640px zoom-equivalent pass; empty New Child validation; Global Search dialog/focus return; shared Button/Input and global motion/focus CSS; current token contrast; current WCAG 2.2, WAI forms/status/dialog, and Apple accessibility guidance.
- **Decision:** Make accessibility a component/API invariant and complete-process release gate. Require PageFrame/PageHeader/skip-link, Field/ErrorSummary, IconAction, StatusRegion, DataTable/RecordList, DataFigure, and focus-safe Dialog/Drawer contracts before pilot rollout. Keep WCAG 2.2 AA as the floor and the 44px Kiddz operational target.
- **Artifacts:** `docs/redesign/accessibility-runtime-audit.md`, `src/scripts/report-redesign-accessibility.ts`, and updated design-system, current-state, cross-device, master-plan, and progress evidence links.
- **Verification:** Runtime confirms no skip links/live regions, unnamed tables, missing/breakpoint-dependent H1s, widespread sub-44px targets, multiple page-overflow failures, five unannounced/unassociated child-form errors, lost dialog focus return, and failing primary/focus contrast. Scanner reports 74 name candidates, four non-semantic click targets, 216 sub-44px target candidates, zero missing-alt/positive-tab/autofocus candidates, and a global reduced-motion baseline. Focused lint, full TypeScript, and diff checks pass.
- **Privacy:** The short-lived local admin audit user was signed out and deleted with sessions/accounts; zero audit users remain. No operational record was mutated and no personal-record screenshot was captured.
- **Evidence boundary:** Scanner findings remain candidates until manual/runtime confirmation; no VoiceOver/NVDA or automated axe pass was performed; the 200% route matrix is incomplete after a browser load timeout. These remain pilot release gates, not hidden assumptions.
- **Next action:** Close creative selection, then codify accessible final tokens/primitives before production pilot implementation; meanwhile continue territory-neutral performance and data-contract evidence.
- **Progress earned:** 1 percentage point; total 38%.

### 2026-07-10 - Phase 5 performance and delivery architecture

- **Question:** Can the redesign remain fast at real nursery scale without hiding records, weakening authorization, trusting warm service-worker state, or confusing build files and wall-clock readiness with field Core Web Vitals?
- **Evidence:** Reproducible source/build scanner across 755 production files and build `WZpaVFGUMIcx9VwDs8l4F`; authenticated production-build route readiness, resource-count, DOM-density, geometry-stability, and console-log sampling on eight routes; manual source inspection of Dashboard, Today, Daily Reports, Accounting, Child enrollment, and Parent portal; current web.dev, Next.js, React, and Prisma guidance; existing reliability, accessibility, scope, journey, and cross-device contracts.
- **Decision:** Make privacy-safe field CWV, route-aware payload attribution, server/query timing, named collection bounds, server-first projections, stable streaming boundaries, route-local optional dependencies, representative scale fixtures, and cold/warm/service-worker-disabled traces design-system and pilot release gates. Preserve full history through pagination/export, never silent caps.
- **Artifacts:** `docs/redesign/performance-runtime-audit.md`, `src/scripts/report-redesign-performance.ts`, and updated master-plan, design-system, current-state, cross-device, and progress evidence links.
- **Verification:** Scanner reports 192 client files, 70 loading files covering 224 pages, two explicit Suspense boundaries, three dynamic imports, 423 `findMany` calls with 395 unbounded triage candidates and zero cursor calls, plus 7.72MB raw / 2.49MB gzip JavaScript across the complete build inventory. Runtime shows stable warm Dashboard around 827-844ms, Accounting around 738-760ms, variable Daily Reports at 726-1,332ms after one initial slow/load-event sample, Today and Accounting above 2,000 DOM elements, and zero captured console warnings/errors. Focused lint, full TypeScript, scanner rerun, and diff checks pass.
- **Privacy:** The short-lived local performance audit user was signed out and deleted with sessions/accounts; zero audit users remain. No operational record was mutated, no personal-record screenshot was captured, and browser tabs were finalized.
- **Evidence boundary:** Local warm readiness is not LCP or public-network performance; DOM geometry sampling is not CLS; build-disk totals are not one-route transfer; query candidates need semantic classification. Field RUM, route attribution, server traces, cold network traces, and representative hardware remain pilot gates.
- **Next action:** Close creative selection, then codify final tokens and implement instrumentation plus bounded server-first data architecture with the first production pilot; meanwhile continue only territory-neutral data-contract evidence.
- **Progress earned:** 1 percentage point; Phase 5 reaches 7 of 13%; total 39%.

### 2026-07-10 - Phase 5 data delivery and collection contract

- **Question:** How can interactive lists, complete room rosters, form selectors, comparison grids, histories, bulk actions, print, and export stop loading every record into the browser without hiding any authorized record or breaking legacy/native parity?
- **Evidence:** Reproducible AST/source scan across 755 production files; all `pageSize: "all"` callers and support branches; shared DataTable filtering, pagination, selection, print, and export behavior; Children, Daily Reports, Accounting, Today, Messages, alarms, medical, staff, parent, and Settings export sources; 27 legacy verifier files with 91 `pageSize`/`all` assertions; current TanStack Table, Prisma pagination, and WAI table/grid guidance; existing scope, reliability, accessibility, localization, performance, journey, and parity contracts.
- **Decision:** Classify every dataset as interactive collection, form option source, operational working set, comparison grid, history/feed, bounded reference set, explicit output, or background sweep. Make server scope/filter/sort/window/count authoritative; use stable IDs and explicit page/ID/all-matching selection; preserve complete reach with compatibility adapters; move large exports to durable authorized jobs.
- **Artifacts:** `docs/redesign/data-delivery-contract.md`, `src/scripts/report-redesign-data-delivery.ts`, and updated master-plan, design-system, current-state, cross-device, performance, and progress links.
- **Verification:** Scanner reports 85 explicit full-dataset requests across 49 production files: 54 interactive-collection candidates, 16 form-option sources, ten operational working sets, and five explicit export reads. It also finds 12 client filter/pagination pipelines, ten with all-row modes, 423 `findMany` calls, 395 top-level-`take` triage candidates, and zero cursor calls. Focused lint, scanner rerun, full TypeScript, and diff checks pass.
- **Evidence boundary:** Scanner categories and literal top-level query properties are triage heuristics. Date/branch/ID-bounded sets and small references can be valid; no `all` call or verifier was changed. Runtime/server scale traces and compatibility implementation remain pilot gates.
- **Next action:** After creative selection, add canonical query/result/selection types and migrate Daily Reports as the first server-list proof, then Accounting as the comparison-grid proof. Until selection, continue territory-neutral component API and data-state evidence only.
- **Progress earned:** 1 percentage point; Phase 5 reaches 8 of 13%; total 40%.

### 2026-07-10 - Phase 5 canonical collection contract foundation

- **Question:** Can future list, history, picker, grid, bulk-action, and output migrations share one typed protocol without changing any current route before a complete workflow is ready?
- **Decision:** Add territory-neutral requested/resolved scope, offset/cursor/working-set window, count, completeness, selection, result, and operation-receipt types with runtime normalization/validation. Report adjusted bounds explicitly, prohibit simultaneous forward/back cursors, require stable unique IDs, require query snapshot/token for all-matching selection, and reject receipts whose state contradicts their outcome counts.
- **Artifacts:** `src/lib/collection-contracts.ts`, `src/scripts/verify-collection-contracts.ts`, and the implementation section in `docs/redesign/data-delivery-contract.md`.
- **Verification:** Focused verifier covers normal/clamped windows, cursor exclusivity, ID normalization, explicit/all-matching selection, exact/estimated/unknown counts, and accepted/partial receipts. Focused ESLint, full TypeScript, and diff checks pass.
- **Parity:** No route imports the new foundation yet; no query, action, database behavior, verifier, legacy alias, export, or native contract changed.
- **Next action:** Close creative selection, then use the foundation in one complete Daily Reports server-list vertical slice with URL state, stable selection, bulk-submit receipts, print/export parity, scale tests, and Agent Browser evidence.
- **Progress earned:** 1 percentage point; Phase 5 reaches 9 of 13%; total 41%.

### 2026-07-10 - Phase 5 collection request-state foundation

- **Question:** Can collection screens distinguish initial loading, usable refresh, stale data, superseded responses, blocking failure, and refresh failure without blanking trusted context or accepting an old request over a new one?
- **Decision:** Add a framework-neutral collection state reducer keyed by request ID. Preserve the previous result while refreshing, ignore superseded success/failure, retain and mark rows stale after refresh failure, keep initial failure blocking, and honor server-reported stale completeness.
- **Artifacts:** `src/lib/collection-state.ts`, `src/scripts/verify-collection-state.ts`, and updated implementation evidence in `docs/redesign/data-delivery-contract.md`.
- **Verification:** Focused verifier proves initial load/success, stale-response rejection, refresh preservation, refresh failure with usable stale rows, server-stale success, blocking initial failure, explicit stale marking, reset, and invalid request IDs. Focused ESLint, full TypeScript, and diff checks pass.
- **Parity:** No route imports the reducer yet; current loading, query, database, export, verifier, legacy, and native behavior is unchanged.
- **Next action:** Use the state foundation only inside the first complete selected-direction collection pilot, with visible loading/stale/error semantics and Agent Browser evidence.
- **Progress earned:** 1 percentage point; Phase 5 reaches 10 of 13%; total 42%.

### 2026-07-10 - Phase 2 direct-competitor operational flow closure

- **Question:** Beyond feature claims, how do current nursery platforms connect configuration, booking, expected attendance, child/staff check-in, room moves, ratios, occupancy, correction, parent delivery, funding/billing, and evidence?
- **Evidence:** Current official Brightwheel student/staff Attendance Mode, Kiosk, QR, room-ratio, assignment, and overlapping-timecard recovery guidance; Famly separate check-in, Room Overview, Room Planner, and Occupancy guidance; Tapestry Config-to-Booking-to-Registers/Invoicing chain; Cheqdin room/ratio/access/PIN prerequisites, booked live registers, bulk sign-in, occupancy overrides, and NCS/ECCE reporting; repeated exact-name Mobbin flow/screen searches plus inspected adjacent Partiful/Luma check-in and reversal previews.
- **Decision:** Model the nursery as configured policy and access -> expected schedules -> observed child/staff transitions -> current room ratio/location -> owned staffing/capacity resolution -> finance/funding/parent/audit outcomes. Keep live occupancy, future staffing, sellable capacity, funded hours, and invoiced hours distinct.
- **Artifacts:** `docs/redesign/direct-competitor-flow-study.md`; updated `competitor-gap-analysis.md`, `benchmark-matrix.md`, master-plan artifact index, and progress tracker.
- **Evidence boundary:** Exact Brightwheel/Famly Mobbin results remain unavailable and unrelated results were excluded. Official support paths establish documented sequence, not usability, accessibility, motion, speed, or real failure quality. Authenticated-product and operator tests remain pilot gates.
- **Verification:** Source links, named paths, cross-product state chain, Kiddz transfers, rejects, remaining debt, and Mobbin boundaries are recorded; diff checks pass. No product code, route, database, or visual UI changed.
- **Next action:** Close creative selection; then codify the brand/design constitution and use the confirmed operating chain in the first production pilot.
- **Progress earned:** Final 1 percentage point for Phase 2; benchmark research closes at 10%; total 43%.

### 2026-07-10 - Phase 5 privacy-safe field metric foundation

- **Question:** Can future field Core Web Vitals be aggregated by useful product context without transmitting child, staff, parent, medical, financial, message, query, route-ID, or organization identity?
- **Evidence:** Current Next.js analytics/`useReportWebVitals` guidance; web.dev field-measurement and 75th-percentile guidance; performance, scope, reliability, and privacy contracts; real legacy/dynamic route shapes.
- **Decision:** Define a provider-neutral allowlisted payload for TTFB, FCP, LCP, CLS, and INP. Reduce pathname to a top-level route family, bucket device/connection/role/organization scale, validate navigation/build/value/rating, discard raw metric IDs and arbitrary attribution, and map unknown routes to `/other`.
- **Artifacts:** `src/lib/performance-metrics.ts`, `src/scripts/verify-performance-metrics.ts`, and updated implementation evidence in `performance-runtime-audit.md` and `design-system-acceptance.md`.
- **Verification:** Focused verifier proves private query/ID stripping, legacy alias mapping, unknown-route suppression, bucket boundaries, valid payload shape, arbitrary-field removal, and malformed metric rejection. Focused ESLint, full TypeScript, and diff checks pass.
- **Privacy boundary:** No metric component, endpoint, persistence, vendor, or network transmission is wired. Sampling, consent/legal basis where applicable, retention, access, aggregation, deletion, and provider review remain pilot gates.
- **Next action:** After creative selection, wire the isolated reporter and approved transport alongside route-aware bundle/server traces, then validate field and lab data separately.
- **Progress earned:** 1 percentage point; Phase 5 reaches 11 of 13%; total 44%.

### 2026-07-10 - Phase 3 creative-territory accessibility hardening

- **Question:** Do all three territory systems preserve readable status language, pointer/touch target policy, mobile reflow, drawer keyboard containment, and reduced-motion meaning across Today, Children, Daily care, and Safety review before selection?
- **Evidence:** Agent Browser matrix across 12 desktop combinations at 1440 x 900, 12 mobile combinations at 390 x 844, 12 narrow combinations at 320 x 568, three sticky-action checks, a 720 x 450 reflow-equivalent pass, deterministic reduced-motion inspection, drawer focus-cycle/return checks, dev log inspection, and a reproducible 28-pair source contrast reporter.
- **Decision:** Keep all directions eligible after remediation, retain Daylight as the recommendation, and record Carebook's original accessibility score as pre-fix invalid rather than retroactively inflating it. Separate accent display/action color from text-safe accent, require 32px dense-pointer and 44px mobile targets, and keep mobile navigation outside the main scroll region.
- **Artifacts:** `docs/redesign/territory-accessibility-validation.md`, `src/scripts/report-redesign-territory-accessibility.ts`, hardened territory lab CSS/components, and updated evaluation/acceptance/master-plan evidence.
- **Verification:** All 36 desktop/mobile/narrow territory/view combinations pass their target, overflow, H1, and unnamed-button checks; all 12 desktop combinations pass computed visible-text contrast; sticky actions clear navigation; drawer focus is contained and restored; deterministic reduced motion passes; source reporter and dev console pass.
- **Evidence boundary:** This is prototype-level evidence, not product WCAG conformance. Actual 200/400% zoom, axe/full semantics, VoiceOver/NVDA, real Windows forced colors, real OS reduced motion, real devices/native wrappers, production localization, color-vision simulation, operator observation, and field frame timing remain open.
- **Next action:** Present the hardened scored territories at the irreversible selection gate. After selection, write the brand/design constitution and codify final tokens before production pilot implementation.
- **Progress earned:** 1 percentage point; Phase 3 reaches 5 of 10%; total 45%.

### 2026-07-10 - Phase 3 territory localization and typography stress validation

- **Question:** Which territory preserves hierarchy, state, action, and dense-work comprehension when governed labels expand, writing direction becomes Arabic RTL, type reaches a deterministic 200% scale, and color is reduced to system roles?
- **Evidence:** 36 desktop combinations at 1440 x 900; 72 mobile/narrow combinations at 390 x 844 and 320 x 568; 24 worst-case combined-mode combinations at 320; 12 deterministic forced-color workflow combinations; computed cascade samples; visual captures; empty browser warning/error log; a reproducible source reporter; and focused `next start` proof against the fresh production build at 1440 x 900 and the 320 x 568 RTL/200%/forced-color worst case.
- **Decision:** Keep Daylight as the recommendation, preserve Signal's semantic-column grammar, and retain Carebook's higher typography/localization implementation cost in selection judgment. Convert the lab to 23 paired type tokens, logical inline CSS, nested Arabic language/direction, writing-system font fallback, and real/deterministic forced-color contracts.
- **Artifacts:** `docs/redesign/territory-localization-validation.md`, `src/app/design-lab/territories/_stress.ts`, `src/scripts/report-redesign-territory-localization.ts`, hardened territory components/CSS, and updated evaluation/accessibility/localization/acceptance/master-plan evidence.
- **Verification:** All 144 measured combinations pass required target, clipping, horizontal overflow, H1, and mobile nav-separation checks. Both territory source reporters, focused ESLint, full TypeScript, `pnpm build`, production route smoke, focused built-app browser checks, and development/production browser logs pass.
- **Evidence boundary:** Deterministic 200% text and forced-color hooks are not actual browser zoom or Windows high contrast. Full translation, time/money formatting, platform Arabic rendering, screen readers, PDFs, email/export, parent/native, and operator testing remain open.
- **Next action:** Present the now-hardened territories at the irreversible selection gate. After selection, write the brand/design constitution and codify final production tokens before pilot implementation.
- **Progress earned:** 1 percentage point; Phase 3 reaches 6 of 10%; total 46%.

## Work Log Template

Use this format for every autonomous work session:

```text
Date:
Phase / tracker item:
Question being answered:
Evidence inspected:
Decision or implementation:
Files changed:
Verification performed:
Screenshots / artifacts:
Parity rows or flows affected:
Open risks:
Next exact action:
Progress earned:
```

## Blocker Policy

Do not stop for ordinary design uncertainty. Research it, document the assumption, and choose the strongest reversible option. Stop only when the next step would:

- Remove or materially change a product capability.
- Commit the brand to an unreviewed direction.
- Require production credentials, private evidence, or a real external transaction.
- Expose sensitive child, parent, staff, medical, or financial data.
- Make an irreversible repository or infrastructure change.
