# Kiddz Online Redesign Progress

**Last updated:** 2026-07-11
**Plan:** `docs/redesign-master-plan.md`
**Program state:** Product discovery and benchmark research closed; territory-neutral staff IA, capability-derived navigation and global search, Calls-under-Messages placement, route compatibility, native/parent convergence, executable state matrix, multi-room live operations, accountable handover closure, source-linked Action Center behavior, capability-safe child workspace behavior, accountable medical incident lifecycle, and reconciled family-ledger behavior, plus motion, jurisdiction, localization, reliability, accessibility, performance, and data-delivery contracts documented and tested; Phase 4 is complete, the creative selection packet is ready, and the explicit production choice remains open
**Reported progress:** **55% done / 45% left**

The percentage is weighted by verified phase gates. It is not an estimate based on time or code volume.

## Phase Tracker

| Phase | Weight | Status | Earned | Evidence required to close |
| --- | ---: | --- | ---: | --- |
| 0. Safety and baseline | 3% | Complete | 3% | Clean branch, approved asset preservation, baseline screenshots and checks |
| 1. Product discovery | 12% | Complete | 12% | Flow inventory, role/task matrix, current journeys, friction/risk register |
| 2. Benchmark research | 10% | Complete | 10% | Pinterest taxonomy, Mobbin flow sheets, direct-competitor operations, benchmark synthesis |
| 3. Brand strategy and direction | 10% | In progress | 6% | Strategy, three complete territories, selected brand constitution |
| 4. IA and core UX | 12% | Complete | 12% | Sitemap, navigation model, Today model, tested wireframes |
| 5. Design system | 13% | In progress | 12% | Tokens, components, motion, responsive, accessibility, performance, and data-delivery foundations |
| 6. Pilot core flows | 15% | Not started | 0% | Shell, Today, attendance, ratios, child profile verified |
| 7. Full product rollout | 20% | Not started | 0% | All canonical flows migrated with parity evidence |
| 8. Hardening and award polish | 5% | Not started | 0% | QA, performance, accessibility, award scorecards and assets |
| **Total** | **100%** |  | **55%** |  |

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
- `docs/redesign/navigation-capability-fixtures.md` and its verifier close the territory-neutral shell projection for seven role/scope fixtures, while keeping production route/query/mutation authorization explicitly open.
- `docs/redesign/operational-architecture-synthesis.md` defines the live operating model, Today hierarchy, canonical objects, work-item lifecycle, role projections, and integrity gates.
- `docs/redesign/brand-expression-synthesis.md` translates the approved identity seed and research into governed color, typography, shape, illustration, voice, motion, and territory criteria.
- `docs/redesign/cross-device-synthesis.md` assigns desktop, tablet, mobile, parent, and native surfaces distinct jobs while preserving shared state, drafts, permissions, and compatibility contracts.
- `docs/redesign/native-parent-navigation-comparison.md` maps 24 actual iOS, Android, and parent-web destinations, identifies hidden/placeholder native debt, and recommends a shared Expo/React Native replacement while preserving installed-client adapters.
- `docs/redesign/calls-communication-placement.md` closes the internal Calls-under-Messages source and first-click hypothesis without inventing callback state; operator validation remains open.
- `docs/redesign/targeted-reference-flow-study.md` adds source-linked Apple, Things, Headspace, Flighty, Airbnb, Stripe, and Anything evidence for motion purpose, consequence, recovery, live state, and handoff.
- `docs/redesign/brand-strategy.md` defines purpose, promise, positioning, audience tensions, narrative, value pillars, message hierarchy, personality, voice, terminology, and trust requirements around `Care, visibly handled.`
- `docs/redesign/creative-territory-briefs.md` defines Daylight, Signal, and Carebook as distinct build systems with shared realistic content, palette/type/motion hypotheses, screen requirements, risks, and kill criteria.
- `docs/redesign/medical-incident-contract.md`, its executable contract, verifier, and `/design-lab/incident` close the reversible J04 lifecycle boundary across evidence recovery, typed reviews, parent delivery and acknowledgment, follow-up, fresh-revision closure, correction, and role-safe publication.
- `docs/redesign/family-ledger-contract.md`, its executable contract, verifier, and `/design-lab/finance` close the reversible J06 boundary across source conflict, duplicate review, atomic allocation, shared balances, receipt delivery, parent-safe projection, and append-only reversal.
- `docs/redesign/inspection-package-contract.md`, its executable contract, verifier, and `/design-lab/inspection` close the reversible J07 boundary across policy profiles, evidence preflight, exceptions, redaction, retryable generation, checksummed provenance, expiring access, audit, source drift, and backup separation.

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

1. Receive the explicit Daylight, Signal, or Carebook production selection from the completed creative-selection packet.
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

### 2026-07-10 - Phase 3 territory automated semantic validation

- **Question:** Do the three territory systems preserve valid names, roles, structure, steady-state contrast, and dynamic feedback across desktop, mobile, worst-case localization/type/color conditions, and consequential interaction states?
- **Evidence:** Pinned `axe-core@4.12.1`; 24 default desktop/mobile territory-view scans; 12 Arabic RTL + 200% text + forced-color scans at 320 x 568; 18 interactive-state scans; manual inspection of every axe incomplete result; computed forced-color badge styles; and corrected Signal drawer visual evidence.
- **Decision:** Keep all territories eligible and Daylight provisionally recommended. Add a query-gated, viewport-signed, animation-stabilized axe harness to the isolated lab; preserve violations and incompletes separately; require explicit manual disposition rather than hiding uncertain results.
- **Defects corrected:** Invalid Signal button-row roles, labels on unnamed generic containers, invalid dialog role ownership, translucent Signal mobile drawer bleed-through, an untranslated audit suffix, and non-deterministic audit timing/signatures.
- **Artifacts:** `docs/redesign/territory-semantic-validation.md`, `src/app/design-lab/territories/_components/territory-axe-harness.tsx`, semantic corrections in territory components/CSS, and updated evaluation/accessibility/acceptance/master-plan evidence.
- **Verification:** All 24 default surfaces have zero violations and zero incomplete results. All 12 worst-case surfaces have zero violations; one single-character forced-color badge remains an axe incomplete with computed black-on-white manual evidence. All 18 interactive states have zero violations; modal bypass and sticky-overlay incompletes are manually dispositioned. Focused ESLint, full TypeScript, both territory source reporters, two successful production builds, focused built-app axe checks, corrected production drawer inspection, empty production browser logs, and diff checks pass.
- **Parity:** The harness is isolated behind `?audit=axe`; normal routes do not request axe. No production UI, database behavior, permission, legacy alias, export, or native contract changed.
- **Next action:** Build and smoke the production bundle, then present the complete territory decision packet at the irreversible selection gate.
- **Progress earned:** 0 percentage points. This closes prototype semantic debt without claiming the selected brand constitution required for the remaining Phase 3 weight; total remains 46%.

### 2026-07-10 - Phase 4 route compatibility and analytics baseline

- **Question:** Can the working IA acquire new user-facing domain names without breaking restored modern routes, legacy PHP deep links, server-owned identity translation, browser history, authorization, output handlers, or native parent contracts?
- **Evidence:** The full 332-route App Router census; 244 staff route entries; all eight working IA domains; 28 critical home/child/room/team/message/finance/report/settings aliases; current legacy identity helpers and query mappings; `/ws`, legacy-install `/ws`, `/api/parent`, and `/parent` compatibility surfaces; the 1,713-row parity matrix; existing privacy-safe performance route handling.
- **Decision:** Separate desired target roots from safe current landings. Keep `/rooms`, `/team`, `/finance`, and the `/reports` root explicitly planned and absent; run the first selected-direction pilot on current routes. Treat `.php` entries as redirect, canonical-render, or request-delegate contracts; keep native/parent routes outside staff navigation; allowlist context; translate legacy identities only on the server; emit only privacy-safe IA domain observations.
- **Artifacts:** `docs/redesign/route-compatibility-plan.md`, `src/lib/redesign-route-compatibility.ts`, `src/scripts/verify-redesign-route-compatibility.ts`, and updated IA, validation, master-plan, and progress artifacts.
- **Verification:** The focused verifier passes against 332 routes and 28 critical aliases; it proves live/current route existence, planned-root absence, alias/destination integrity, design-lab exclusion, context declarations, privacy-safe observations, and native separation. A signed-out production browser smoke confirms same-origin legacy callback preservation plus Back/Forward restoration with an empty warning/error log. Focused ESLint, full TypeScript, and diff checks pass.
- **Parity:** No production route imports the registry. No navigation, redirect, database behavior, permission, output, legacy alias, native response, or product UI changed.
- **Evidence boundary:** The registry is the critical migration baseline, not an exhaustive replacement for 1,713 parity rows. Operator label/first-click evidence, production capability enforcement, real-record browser history/deep-link testing, real-device native acceptance, analytics governance, and rollout-by-rollout alias linkage remain open.
- **Next action:** Close creative selection, codify the selected constitution, then run the first vertical pilot on safe current routes and execute the route-entry/browser-history matrix before promoting any planned root.
- **Progress earned:** 1 percentage point; Phase 4 reaches 5 of 12%; total 47%.

### 2026-07-10 - Phase 4 capability-derived navigation fixtures

- **Question:** Can staff destinations and branch context be derived from effective capability decisions and assignment scope without treating the role label or hidden navigation as authorization?
- **Evidence:** Current role-filtered production sidebar; organization-wide shell branch/class loading; direct-route and server-action gaps from the authorization audit; working seven-domain IA; safe current landings from the route registry; branchless staff evidence; browser checks across administrator, manager, teacher, nurse, and doctor projections.
- **Decision:** Add a territory-neutral projector whose input is one effective decision per shell capability plus organization/assignment scope. Missing or conflicting decisions default deny; imported explicit denial removes a destination; all-branch oversight requires explicit organization read-all authority and remains read-only; writes always use concrete branches; unknown branch IDs are dropped without disclosure.
- **Artifacts:** `docs/redesign/navigation-capability-fixtures.md`, `src/lib/redesign-navigation-contracts.ts`, `src/scripts/verify-redesign-navigation-contracts.ts`, and the IA lab integration plus authorization/route/acceptance documentation updates.
- **Verification:** Seven fixtures across all five staff roles pass; adversarial missing/conflicting/read-all/unknown-branch/role-provenance checks pass; the IA lab no longer contains hard-coded role navigation or branch tables; browser role projections and branch options pass; focused ESLint, full TypeScript, route compatibility, and diff checks pass.
- **Parity:** Production navigation, authorization, routes, queries, mutations, database behavior, exports, aliases, and native contracts are unchanged. The lab uses synthetic records only.
- **Evidence boundary:** This closes shell projection fixtures, not production authorization. First-organization fallback, direct-route gaps, assignment-aware reads/writes, transition capabilities, denial UX, and non-disclosure tests remain open release blockers.
- **Next action:** Present the creative-territory decision packet. After selection, codify the brand constitution and begin the first vertical pilot on safe current routes with server authorization integration.
- **Progress earned:** 1 percentage point; Phase 4 reaches 6 of 12%; total 48%.

### 2026-07-10 - Phase 4 native and parent navigation convergence

- **Question:** What parent product actually exists across the preserved iOS app, Android app, current parent web portal, restored PHP routes, and modern API, and what must be preserved, repaired, or replaced?
- **Evidence:** Actual local UIKit/Storyboard/Swift and Android Java/XML/Retrofit source; iOS login, home, messaging, notification, push, and endpoint dispatch; Android login, home, navigation graph, Retrofit interface, placeholder view models, manifest, and build configuration; current parent web source and signed-out 390 x 844 browser entry; PHP/API compatibility matrix, native acceptance ledger, and route registry; current official Expo Router, SecureStore, and React Native architecture guidance.
- **Decision:** Treat the archived apps as parent-only compatibility fixtures, not implementation foundations. Preserve working parser and PHP contracts, repair hidden/placeholder Messages and Notifications capability, use parent web as the complete behavioral baseline, and recommend a new Expo/React Native parent companion sharing typed contracts and selected tokens while legacy adapters remain live through installed-client cutover.
- **Findings:** iOS has six operational home destinations, hidden/broken Messages, and eleven notification groups constrained by an eight-section UI. Android has five Retrofit-backed destinations and visible empty Messages/Notifications placeholders. Parent web alone has complete messaging, grouped notifications, and push controls. Legacy cleartext transport, stored credentials, Android credential literals, old platform stacks, signing ownership, and absent Android push are explicit migration risks; no secret value was copied.
- **Artifacts:** `docs/redesign/native-parent-navigation-comparison.md`, `src/lib/redesign-native-parent-navigation.ts`, `src/scripts/verify-redesign-native-parent-navigation.ts`, and updates to cross-device, IA, route, API, native-acceptance, master-plan, and progress artifacts.
- **Verification:** The verifier passes 24 destination contracts against all live parent/PHP/API routes and the preserved local native source; focused ESLint and full TypeScript pass. Browser confirms signed-out parent redirect/login semantics, named controls, zero 390px horizontal overflow, and no unnamed buttons. Public-repository tracked files contain no native signing/keystore artifact.
- **Parity:** No production page, endpoint, payload, database, permission, legacy alias, or native source changed. The contract makes broken source states explicit so they cannot be mistaken for acceptable parity.
- **Evidence boundary:** This is not a signed native build, simulator/emulator run, physical-device pass, provider push test, store release, or installed-version census. Those remain external acceptance gates.
- **Next action:** Present the creative-territory decision packet. After selection, codify the brand constitution and start the parent-web or staff Today vertical pilot; create the new native workspace only after repository/signing ownership approval.
- **Progress earned:** 1 percentage point; Phase 4 reaches 7 of 12%; total 49%.

### 2026-07-10 - Phase 4 Calls-under-Messages placement

- **Question:** Can Calls sit under Messages without hiding child history, breaking restored legacy Form 6 behavior, or inventing a callback workflow the database cannot represent?
- **Evidence:** `CallLog`, `CallDirection`, attachments, migrated legacy fields, call actions and validation, global/branch/child/detail routes, production navigation, the legacy calls verifier, all call `.php` bridges, the Messages route contract, and manager/teacher desktop plus 390px Agent Browser first-click checks.
- **Decision:** Place the global Calls collection and draft reports at `Messages / Calls`; retain a contextual Calls view under each child over the same records. Treat only `CallLog.isDraft = true` as current unfinished call work. Keep `MISSED` as direction/history until explicit owner, callback, due, status, resolution, and audit state exists.
- **Artifacts:** `docs/redesign/calls-communication-placement.md`, `src/lib/redesign-call-workflow-contracts.ts`, `src/scripts/verify-redesign-call-workflow.ts`, the IA draft-call fixture, and expanded route compatibility for `/bcalls.php` and `/call.php`.
- **Verification:** Three surfaces, three states, six target capabilities, and four legacy call aliases pass the new verifier; the 332-route registry passes with 30 critical aliases; the restored legacy calls suite passes. Manager and teacher first-click paths resolve correctly; the mobile queue has no overflow, unnamed button, or sub-44px visible target; browser warnings/errors are empty. Focused ESLint, full TypeScript, production build, and diff checks pass; the build retains its documented legacy dynamic-prerender messages and print CSS warning.
- **Parity:** Production call pages, actions, database, permissions, exports, attachments, legacy route behavior, and visuals are unchanged. The design-lab task is synthetic.
- **Evidence boundary:** Operator terminology/card sorting, production call capability enforcement, assigned-scope tests, audited voiding, authenticated real-record route/history tests, and runtime database aggregates remain open. The local database was unavailable during this source audit.
- **Next action:** Present the creative-territory decision packet. After selection, codify the brand constitution and begin the first selected-direction pilot on safe current routes with production capability integration.
- **Progress earned:** 1 percentage point; Phase 4 reaches 8 of 12%; total 50%.

### 2026-07-10 - Phase 3 creative-selection decision packet

- **Question:** Can the completed territory evidence be reviewed as one honest desktop and phone decision instead of requiring the user to reconstruct the recommendation from prototypes and long documents?
- **Evidence:** All three implemented territory Today captures and routes; the seven-criterion evaluation; accessibility, localization, semantic, responsive, motion, and state-continuity evidence; the explicit production-selection boundary; Agent Browser at default desktop, 390 x 844, and 320 x 568.
- **Decision:** Replace the generic territory index with a decision surface using real product captures, exact scores, one strongest use and one implementation cost per direction, the provisional Daylight recommendation, the full scorecard, and a clear list of what selection can and cannot change. Keep selection explicit; do not set production tokens or migrate UI.
- **Correction:** The executable score check found that Daylight's displayed criteria total `89.9`, not the previously published `90.0`; the source evaluation, packet, and decision artifact now use the exact value. Ranking is unchanged.
- **Artifacts:** `docs/redesign/creative-selection-gate.md`, the redesigned `/design-lab/territories` packet, shared typed score evidence, and `src/scripts/verify-redesign-territory-selection.ts`.
- **Verification:** Three directions, seven criteria totaling 100%, exact weighted totals, one Daylight recommendation, three real captures, all prototype links, and no persisted selection pass the verifier. TypeScript, focused ESLint, territory accessibility/localization contracts, and the production build pass; the build retains its documented legacy dynamic-prerender messages and print CSS warning. Browser checks find one H1, no page overflow, no clipped critical copy, no unnamed button, no sub-44px visible target, and a named keyboard-scrollable scorecard at 320px. All three territory routes and Back navigation pass. A lazy-image LCP warning was corrected by eagerly loading the three decision-critical captures.
- **Parity:** No production route, visual component, data, permission, mutation, legacy alias, native contract, or restored capability changed.
- **Evidence boundary:** The user has not selected a production direction. Actual zoom, assistive technology, OS/device settings, nursery operators, and field performance remain later gates for the selected system.
- **Next action:** Receive the explicit Daylight, Signal, or Carebook selection; then write the brand/design constitution and begin final token and production pilot work.
- **Progress earned:** 0 percentage points; Phase 3 remains 6 of 10% and total remains 50% because the irreversible selection gate is still open.

### 2026-07-10 - Phase 5 executable state contract and full matrix audit

- **Question:** Can every required data, input, system, and result state be one executable contract rather than duplicated prose and component-local logic, and does every fixture survive the same semantic and narrow-screen gate?
- **Decision:** Extract all 15 state definitions, source status, completion, revision, and common/state-specific rules into a typed territory-neutral contract. Make the lab consume it, expose deterministic audit URLs, and share one axe harness with the creative-territory prototypes.
- **Artifacts:** `src/lib/redesign-state-contracts.ts`, `src/scripts/verify-redesign-state-contracts.ts`, the shared `AxeAuditHarness`, `/design-lab/states?audit=axe&state=<id>`, and updated state/design-system/master-plan evidence.
- **Verification:** The source verifier passes 15 unique states, four groups, and 60 acceptance assertions. All 15 states pass Agent Browser at `1440 x 900`, `390 x 844`, and `320 x 568`: zero axe violations, zero unresolved findings, one H1, no unnamed visible controls, no overflow, no clipped critical text, and no sub-44px phone target. The shared Daylight harness regression, focused ESLint, TypeScript, diff check, and production build pass; the build retains its documented legacy dynamic-prerender messages and print CSS warning.
- **Defects closed:** Replaced unsupported skeleton labeling with a live busy status; corrected warning and unavailable-row contrast; named the icon-only mobile reset control.
- **Parity:** No production route consumes the contract yet. No production visual, query, mutation, database behavior, permission, export, legacy alias, native contract, or restored capability changed.
- **Evidence boundary:** Automated semantics and responsive geometry do not replace actual 200% zoom, VoiceOver/NVDA, reduced-motion, offline/privacy policy, real-device, final-theme, or server-state integration tests. Creative selection remains open.
- **Next action:** Receive the explicit creative direction, then codify final tokens and consume this contract in the first complete production pilot with server-owned state and audit history.
- **Progress earned:** 1 percentage point; Phase 5 reaches 12 of 13% and total reaches 51%.

### 2026-07-10 - Phase 4 executable live-operations flow

- **Question:** Can one accepted attendance observation update current room state, ratio evidence, forecast work, and append-only history without treating absence, daily-report completion, or a browser flag as proof of presence?
- **Evidence:** Current `AttendanceMarker`, `markBulkAttendance`, Today local-storage completion, `DailyReport`/`AbsenceReport` presence inference, `TeacherAttendance`, `EmployeeEvent`, class membership, jurisdiction policy baseline, J01/J02/J05 blueprints, and the failed authenticated `/today` attempt using the stale credentials printed on the local login page.
- **Decision:** Add an executable territory-neutral contract for operational context, expected roster, explicit child presence events, optimistic revision and idempotency, append-only correction, staff countability, policy-supplied ratio decisions, current/forecast room readiness, source-derived work, and time-bounded floating cover. Do not calculate law or activate production state from the prototype.
- **Artifacts:** `src/lib/redesign-live-operations.ts`, `src/lib/redesign-live-operations-fixtures.ts`, `src/scripts/verify-redesign-live-operations.ts`, `/design-lab/operations`, and `docs/redesign/live-operations-contract.md` with blueprint, audit, and master-plan links.
- **Verification:** Deterministic checks pass explicit unknowns, attendance transitions, stale-revision defenses, idempotent replay, contradictory-state rejection, session submission, append-only correction, missing/stale policy, policy-condition failure, current risk, branch precedence, and cover-candidate conflict. Agent Browser replays attendance -> forecast cover -> handled at `1440 x 900`, `390 x 844`, and `320 x 568`; all nine states produce `Unknown -> Safe with exceptions -> Safe`, one H1, no overflow, unnamed controls, clipped critical text, or undersized targets, and zero axe violations/incomplete findings. Visual review removed a duplicate derivative forecast task. Focused ESLint, TypeScript, route/navigation/state/selection regressions, diff checks, and the production build pass; `/design-lab/operations` emits statically with only the documented legacy dynamic-prerender messages and print CSS warning.
- **Parity:** No production route, query, mutation, Prisma model, database row, permission, export, legacy alias, native payload, or product visual changed. The migration plan is additive and requires dual-read compatibility evidence.
- **Evidence boundary:** Printed demo credentials are stale, so authenticated current-Today runtime reproduction remains open. The fixture uses synthetic data and a supplied policy decision; production persistence, legal approval, authorization, cross-room transactions, operator validation, offline/privacy, native adapters, assistive technology, and real devices remain release gates.
- **Next action:** Receive the explicit creative direction, codify final tokens, then consume this contract in the first complete server-owned Today/attendance/ratio pilot with parity adapters and database evidence.
- **Progress earned:** 1 percentage point; Phase 4 reaches 9 of 12% and total reaches 52%.

### 2026-07-11 - Phase 4 multi-room cover consequence preview

- **Question:** Can a manager preview a cover move and resolve Meadow without silently creating a new staffing risk in the candidate's source room?
- **Evidence:** The executable attendance/staff/policy contract, J05 staffing blueprint, multi-room synthetic fixture, and the first complete desktop Agent Browser replay of attendance unknown -> cover unselected -> Noor blocked -> Sam acceptable -> resolved.
- **Decision:** Add explicit source-room identity to time-bounded assignments; project every affected source and target room before commit; classify the preview as `ACCEPTABLE`, `BLOCKED`, or `UNKNOWN`; and accept only when every affected room remains safe.
- **Artifacts:** `src/lib/redesign-live-operations.ts`, `src/lib/redesign-live-operations-fixtures.ts`, `src/scripts/verify-redesign-live-operations.ts`, `/design-lab/operations`, `docs/redesign/live-operations-contract.md`, and the J05 blueprint update.
- **Verification:** Deterministic checks prove Noor would reduce Seedlings to one counted adult against a supplied requirement of two and is rejected, while floating Sam affects only Meadow and resolves the branch. Agent Browser replays attendance unknown -> cover unselected -> Noor blocked -> Sam acceptable -> resolved at `1440 x 900`, `390 x 844`, and `320 x 568`. All 15 combinations preserve the expected `1 -> 1 -> 1 -> 1 -> 0` work sequence, one H1, no overflow, clipping, unnamed controls, or undersized targets, and zero axe violations/incomplete findings. Normal 390px visual captures confirm the overview and blocked consequence panel reflow cleanly. Focused lint, full TypeScript, the live-operations verifier, 333-route compatibility, navigation/state/selection regressions, diff hygiene, and the production build pass; `/design-lab/operations` remains static with only the documented legacy build warnings.
- **Parity:** The slice remains synthetic and additive. No production route, query, action, Prisma model, database row, permission, export, legacy alias, native payload, or product visual changed.
- **Evidence boundary:** Production still needs transactional source/target recalculation against fresh revisions; automated responsive and axe evidence does not replace actual assistive-technology, shared-tablet, physical-device, operator, or legal-policy acceptance.
- **Next action:** Proceed to the next reversible server-owned core-UX contract while the irreversible creative-direction selection remains open.
- **Progress earned:** 1 percentage point; Phase 4 reaches 10 of 12% and total reaches 53%.

### 2026-07-11 - Phase 4 capability-safe global search contract

- **Question:** Can global search expose the restored product's breadth without leaking a protected record, denied capability, out-of-scope task, or write action outside a concrete branch context?
- **Evidence:** Current `globalSearch` organization-only queries; the production command dialog's static pages/actions and origin-wide recents; authorization, route, reliability, localization, and data-delivery audits; executable navigation fixtures; and focused Agent Browser runs across manager, teacher, administrator, desktop, and narrow-screen states.
- **Decision:** Make search a server-owned capability and effective-scope projection. Every candidate declares kind, canonical path, domain, capability, read/write mode, and organization/branch/room/record scope. Missing/conflicting policy fails closed; all-branches context is read-only; one-character protected search returns `TOO_SHORT`; ranking and grouping occur only after authorization.
- **Artifacts:** `src/lib/redesign-search-contracts.ts`, `src/scripts/verify-redesign-search-contracts.ts`, `docs/redesign/global-search-contract.md`, the shared axe harness and grouped search integration in `/design-lab/ia`, plus IA and route-plan evidence updates.
- **Verification:** Deterministic manager, teacher, all-branches, denied, missing-policy, pending-scope, duplicate-ID, Unicode-normalization, limit, and stable-ranking checks pass. Agent Browser covers 12 focused states at `1280 x 800`, `390 x 844`, and `320 x 568`, including `Command/Control + K`, Escape, suggestions, grouped results, denied payment, attendance, all-branches write suppression, short query, canonical path, and post-selection focus. Measured states retain one H1, no overflow, unnamed or undersized controls, zero axe violations/incomplete findings, and an empty warning/error browser log. Focused lint, full TypeScript, search/navigation/route/state/selection regressions, diff hygiene, and the production build pass; `/design-lab/ia` remains static with only documented legacy build warnings.
- **Defects closed:** Implemented the advertised command shortcut; added search result grouping and source-heading focus; fixed role-group semantics, two contrast failures, desktop compact-control height, and machine-verifiable short-query layering.
- **Parity:** No production search query, command dialog, route, action, Prisma model, database row, permission, export, legacy alias, native payload, or restored capability changed. Production migration remains additive and server-gated.
- **Evidence boundary:** The current production dialog still has organization-only scope, static client actions/pages, raw browser recents, and stale-response risk. Canonical person identity, server scope integration, privacy approval, representative scale, operator validation, assistive technology, and selected-system polish remain open.
- **Next action:** Use this contract in the selected-direction shell after the irreversible territory decision; continue the last reversible Phase 4 gate without changing production visuals.
- **Progress earned:** 1 percentage point; Phase 4 reaches 11 of 12% and total reaches 54%.

### 2026-07-11 - Phase 4 accountable handover and closure contract

- **Question:** Can a nursery team close a lunch or end-of-day handover without treating an unknown attendance state, draft report, dismissed notification, or unacknowledged carry-forward as completed work?
- **Evidence:** Current Today browser-local completion, explicit `DRAFT`/`SUBMITTED` care state, fragmented attendance/care/medical/message/staff alert sources, J01/J02/J05 workflow evidence, and a synthetic Riverside/Meadow source-revision fixture.
- **Decision:** Make handover a versioned server transition. A session snapshots source obligations and their revisions; unknown and blocking work prevent closure; policy-approved carry requires a concrete incoming owner, reason, and acknowledgment; close revalidates every source revision and appends a receipt without erasing carried work.
- **Artifacts:** `src/lib/redesign-handover-contracts.ts`, `src/scripts/verify-redesign-handover-contracts.ts`, `/design-lab/handover`, `docs/redesign/handover-contract.md`, and linked workflow and operational-architecture evidence.
- **Verification:** Deterministic checks prove initial unknowns, blocked premature close, exact idempotent replay, changed-input rejection, blocker carry rejection, acknowledged allowed carry, stale-source close rejection, capability enforcement, append-only five-event closure, and visible carried work after close. Agent Browser covers seven states at `1440 x 900`, `390 x 844`, and `320 x 568` for 21 combinations: every state has one H1, expected source/event counts, accepted-transition focus, zero overflow, unnamed or undersized controls, axe violations, incomplete findings, or browser warnings/errors. Focused ESLint, full TypeScript, handover/live-operations/search/navigation/route/state/selection verifiers, diff hygiene, and the production build pass; the route verifier covers 334 app routes and `/design-lab/handover` emits statically with only documented legacy build warnings.
- **Parity:** The slice is synthetic and additive. It changes no production Today behavior, report mutation, attendance source, alert, message, Prisma model, database row, permission, route, export, legacy alias, native payload, or restored capability.
- **Evidence boundary:** Real manager/practitioner policy, production persistence and transactions, authorization, source adapters, operator acceptance, representative scale, offline/shared-device behavior, notification and parent delivery, assistive technology, exports, native clients, and selected-system polish remain release gates.
- **Next action:** Phase 4 is closed. Receive the explicit Daylight, Signal, or Carebook selection, then write the final brand/design constitution, codify selected production tokens, and begin the first server-owned vertical pilot. Until that irreversible decision, continue only reversible contracts that do not alter production visuals.
- **Progress earned:** 1 percentage point; Phase 4 reaches 12 of 12% and total reaches 55%.

### 2026-07-11 - Wave 1 source-linked Action Center contract

- **Question:** Can Today present one truthful queue across attendance, ratios, care, messages, finance, medical, documents, and handover without exposing denied records or treating read, claim, defer, snooze, or alarm dismissal as source completion?
- **Evidence:** Current static alarm urgency mapping, `Alarm.isActive` resolution, snooze rewriting `Alarm.dueDate`, message/notification read receipts, daily and medical draft states, payment status, live-operations work, handover obligations, operational architecture, and manager/practitioner synthetic scope fixtures.
- **Decision:** Project work only from capability-visible canonical sources. Keep viewed, claimed, deferred, and source-resolved independent; leave canonical due time unchanged when attention is deferred; close only from a newer source revision with evidence; return no hidden denied count.
- **Artifacts:** `src/lib/redesign-action-center-contracts.ts`, `src/scripts/verify-redesign-action-center-contracts.ts`, `/design-lab/action-center`, `docs/redesign/action-center-contract.md`, the new living `decision-log.md`, and linked workflow/architecture updates.
- **Verification:** Deterministic checks prove manager/practitioner capability filtering, organization/branch scope, stable grouping, truthful counts, read-without-close, claim-without-close, critical deferral rejection, policy-bounded reply deferral with preserved 15:00 due time, stale/idempotency guards, source capability, newer revision, resolution receipt, and append-only history. Agent Browser covers seven states at `1440 x 900`, `390 x 844`, and `320 x 568` for 21 combinations; all retain one H1, expected counts/events, accepted-transition focus, zero overflow, unnamed or undersized controls, axe violations, incomplete findings, or browser warnings/errors. The first 320px run exposed ellipsized source paths; wrapped-path remediation passes the full rerun. Normal 390px captures confirm initial and deferred hierarchy. Focused ESLint, full TypeScript, Action Center/handover/live-operations/search/navigation/route/state/selection/Calls/native-parent verifiers, diff hygiene, and the production build pass; the route verifier covers 335 app routes and 30 critical aliases, and `/design-lab/action-center` emits statically with only documented legacy build warnings.
- **Parity:** The slice is synthetic and additive. No production query, alarm/message/report/payment mutation, ratio or handover source, Prisma model, database row, permission, route, export, legacy alias, native payload, or restored capability changed.
- **Evidence boundary:** Source adapters, production persistence/outbox, escalation policy, authorization integration, operator validation, representative scale, offline/shared-device behavior, parent/native delivery, assistive technology, exports, and selected-system polish remain release gates.
- **Next action:** Receive the explicit Daylight, Signal, or Carebook selection, then codify the brand/design constitution and consume the Action Center, handover, live-operations, search, navigation, state, reliability, and data contracts in the first server-owned production pilot.
- **Progress earned:** 0 percentage points. This is real Wave 1 behavior evidence but does not satisfy the selected brand constitution or final component-review gate; total remains 55%.

### 2026-07-11 - Phase 6 capability-safe child workspace foundation

- **Question:** Can one child workspace preserve the restored dossier while exposing only the sections, safety notices, source events, actions, and parent summaries each viewer is authorized to use?
- **Evidence:** Current organization-wide `getChild` dossier include; fixed ten-item child subnav; cross-domain timeline queries for reports, absence, medical, vaccination, accident, payment, and calls; separate parent daily/finance/message/notification adapters; child-specific legacy routes and parity evidence; J02/J03/J04/J06 workflow contracts.
- **Decision:** Resolve base child access first, then independently authorize sections, events, notices, and actions. Give each timeline event full source scope, revision, effective/recorded time, provenance, publication, sensitivity, and separate staff/parent content. Append corrections; retain originals for audit users while ordinary staff and parents see only the current fact. Return no hidden denied count.
- **Artifacts:** `src/lib/redesign-child-workspace-contracts.ts`, `src/scripts/verify-redesign-child-workspace-contracts.ts`, `/design-lab/child-workspace`, `docs/redesign/child-workspace-contract.md`, and linked architecture, blueprint, and decision-log updates.
- **Verification:** Deterministic checks prove base organization/branch/relationship access, eight independently authorized sections, manager/practitioner/nurse/parent event and notice projections, parent draft/clinical/call/safeguarding redaction, stable chronology, no denied counts, exact idempotency, stale/conflicting revision rejection, required audit/source capability, newer source revision, parent-safe correction content, and append-only correction. Agent Browser covers eight states at `1440 x 900`, `390 x 844`, and `320 x 568` for 24 combinations; all retain one H1, exact role counts, accepted-correction focus, zero overflow, clipped critical text, unnamed or undersized controls, axe violations, incomplete findings, or browser warnings/errors. Browser remediation removed superseded-row opacity contrast failures and replaced partially obscured phone section scrolling with a visible two-column grid. Focused ESLint, full TypeScript, child-workspace/Action Center/handover/live-operations/search/navigation/route/state/selection/Calls/native-parent verifiers, parent daily/notification and child attendance/history/report/header parity contracts, diff hygiene, and the production build pass; the route verifier covers 336 app routes and 30 critical aliases, and `/design-lab/child-workspace` emits statically with only documented legacy build warnings.
- **Parity:** The slice is synthetic and additive. No production child query, dossier, subnav, timeline, report, medical form, attendance source, payment, call, attachment, action, Prisma model, database row, permission, route, print/export, legacy alias, parent/native payload, or restored capability changed.
- **Evidence boundary:** Production section/source capabilities, assignment and parent policy, canonical adapters, correction persistence, pagination, operator validation, representative scale, notification/acknowledgment, offline/shared-device behavior, assistive technology, print/export, native clients, and selected-system polish remain release gates.
- **Next action:** Receive the explicit Daylight, Signal, or Carebook selection, codify the brand/design constitution and final tokens, then implement the first server-owned pilot using the proven shell, Today, attendance, ratio, Action Center, handover, and child-workspace contracts.
- **Progress earned:** 0 percentage points. This closes child-profile behavioral uncertainty but is not the selected-direction production implementation required to start earning Phase 6; total remains 55%.

### 2026-07-11 - J04 accountable medical incident lifecycle foundation

- **Question:** Can the restored medical and accident surface gain an accountable lifecycle without losing imported forms, attachments, alarms, receipts, PDFs, routes, or native/parent compatibility?
- **Evidence:** Current Prisma medical status and rows; create/update/delete actions; accident capture/upload behavior; legacy medical form definitions and migration matrix; medical alarm, staff/parent receipt, push-delivery, route, PDF, and parity contracts; J04 audit and workflow blueprint.
- **Decision:** Keep one versioned incident source and create independent policy-derived obligations for manager review, clinical review, parent delivery, parent acknowledgment, and follow-up. Require typed capability, expected source revisions, actor, timestamp, and idempotency for every transition. Failed delivery creates retry work without rolling back submission; correction appends a new obligation cycle and retains old receipts.
- **Artifacts:** `src/lib/redesign-medical-incident-contracts.ts`, `src/scripts/verify-redesign-medical-incident-contracts.ts`, `/design-lab/incident`, `docs/redesign/medical-incident-contract.md`, and linked architecture, blueprint, and decision-log updates.
- **Verification:** Deterministic checks prove retained facts through evidence failure, ready-state validation, five policy obligations, exact replay, changed-input rejection, typed review dependency, provider failure and retry receipt, separate parent acknowledgment, named follow-up, stale-close rejection, capability enforcement, fresh-revision closure, and append-only correction reopening. Agent Browser covers ten states at `1440 x 900`, `390 x 844`, and `320 x 568` for 30 combinations; all retain one H1, expected status, zero overflow, unnamed or undersized controls, axe violations, or incomplete findings. Parent-before/after-publication checks expose no internal evidence or provider/review detail; accepted submission and acknowledgment update the live region and focus the changed heading. The 320px pass closed a wrapped-brand header issue. Focused ESLint, full TypeScript, every current redesign regression, static medical/accident parity contracts, both database-backed medical delivery verifiers, diff hygiene, and the production build pass; the route verifier covers 337 app routes and 30 critical aliases, and `/design-lab/incident` emits statically with only documented repository warnings.
- **Parity:** The slice is synthetic and additive. No production medical query, form, entry, attachment, upload, alarm, notification receipt, parent endpoint, server action, Prisma model, database row, route, PDF, export, legacy alias, native payload, permission, or restored capability changed.
- **Evidence boundary:** Jurisdiction/severity policy, dual approval, deadlines, regulator reporting, production persistence and outbox, transactions, provider integration, authorization, migration/backfill, representative scale, operator validation, assistive technology, real-device/native behavior, retention, and selected-system polish remain release gates.
- **Next action:** Continue the next highest-risk reversible canonical contract while awaiting explicit Daylight, Signal, or Carebook selection; production visual migration and Phase 6 credit remain gated on that choice.
- **Progress earned:** 0 percentage points. This closes J04 behavioral uncertainty but does not satisfy the selected-direction production implementation required for Phase 6; total remains 55%.

### 2026-07-11 - J06 reconciled family ledger foundation

- **Question:** Can the restored payment, accounting, receipt, alarm, parent, and native surfaces converge on one explainable balance without discarding imported evidence or inventing historical allocations?
- **Evidence:** `Payment`, `AccountingEntry`, and `PaymentReminder` schema; create/update/soft-delete and quick-payment actions; child and organization accounting projections; legacy receipt voucher; parent/native finance mapper; `t_payments`, `t_accounting`, and `newpayment` migration; accounting, invoice, parent push, parser, and page parity contracts; J06 audit and blueprint.
- **Decision:** Withhold canonical totals when imported sources disagree. Use integer minor units and immutable charge, payment, allocation, receipt, delivery, and reversal events. Derive family balance, invoice outstanding, and unallocated credit from one event set, require duplicate review and exact source revisions, validate multi-line allocation atomically, and append reasoned reversal instead of editing/deleting history.
- **Artifacts:** `src/lib/redesign-family-ledger-contracts.ts`, `src/scripts/verify-redesign-family-ledger-contracts.ts`, `/design-lab/finance`, `docs/redesign/family-ledger-contract.md`, and linked architecture, blueprint, and decision-log updates.
- **Verification:** Deterministic checks prove source-conflict fail-closed, reversed-history duplicate detection, reasoned duplicate acceptance, exact idempotent replay, changed-input rejection, rejected over-allocation without partial change, charge/payment revision guards, partial/full allocation, shared-balance equation, receipt-after-allocation, separate delivery receipt, parent-safe projection, exact allocation-set reversal, capability enforcement, and retained payment/allocation/receipt history after correction. Agent Browser covers nine states at `1440 x 900`, `390 x 844`, and `320 x 568` for 27 combinations; all retain one H1, expected status, true reconciliation equation, zero overflow, unnamed or undersized controls, axe violations, or incomplete findings. Parent conflict/settled runs expose no internal source/actor/duplicate detail; accepted payment and reversal transitions update the live region and focus the changed heading. Focused ESLint, full TypeScript, every current redesign regression, accounting/invoice/payment-alarm/parent-parser contracts, three database-backed finance delivery verifiers, diff hygiene, and the production build pass; the route verifier covers 338 app routes and 30 critical aliases, and `/design-lab/finance` emits statically with only documented repository warnings.
- **Parity:** The slice is synthetic and additive. No production payment, accounting entry, reminder, alarm, notification receipt, parent endpoint, native payload, invoice/receipt, print, export, server action, Prisma model, database row, permission, route, or legacy alias changed.
- **Evidence boundary:** Source reconciliation, family-vs-child account identity, gross/net/discount interpretation, currency/rounding, allocation defaults, invoice numbering/tax, refund/credit-note policy, production persistence and transactions, authorization, representative scale, operator validation, assistive technology, real-device/native behavior, stationery/print, and selected-system polish remain release gates.
- **Next action:** Continue the next highest-risk reversible canonical contract while awaiting explicit Daylight, Signal, or Carebook selection; production visual migration and Phase 6 credit remain gated on that choice.
- **Progress earned:** 0 percentage points. This closes J06 behavioral uncertainty but does not satisfy selected-direction production implementation required for Phase 6; total remains 55%.

### 2026-07-11 - J07 trustworthy inspection package foundation

- **Question:** Can the restored compliance, document, monthly-report, export, storage, and SQL-backup surfaces support an inspection-ready workflow without claiming that a convenient download is complete, current, recipient-safe evidence?
- **Evidence:** `BranchCompliance`, `BranchDocument`, staff/child document and attachment schema; branch compliance actions and pages; `/settings/export`; monthly attendance exports; `/exportdb.php` and the database dump engine; local/object storage access; parity rows; J07 audit, architecture, IA, jurisdiction, authorization, and workflow blueprints.
- **Decision:** Require a policy-supplied versioned profile before preflight. Bind every manifest entry, authorized exception, and recipient redaction to an exact source revision. Separate preflight, sensitive view, contribution, exception, generation, download, and audit capabilities. Generate asynchronously against a fixed manifest, retain failure/retry attempts, require manifest/artifact checksums, issue expiring grants, append download events, mark output historical after source drift, and reject `DATABASE_BACKUP` as an inspection package.
- **Artifacts:** `src/lib/redesign-inspection-package-contracts.ts`, `src/scripts/verify-redesign-inspection-package-contracts.ts`, `/design-lab/inspection`, `docs/redesign/inspection-package-contract.md`, and linked architecture, blueprint, and decision-log updates.
- **Verification:** Deterministic checks prove profile-required failure, blocking expiry, stale evidence rejection, exact idempotent replay, changed-input rejection, exception authority/reason, revision-bound redaction, capability-safe no-leak projection, generation authorization, fixed-manifest failure/retry, checksum enforcement, access expiry/regeneration, download audit, historical source drift, and SQL-backup separation. Agent Browser covers all eleven lifecycle fixtures across manager `1440 x 900`, contributor `390 x 844`, and auditor `768 x 1024` for 33 combinations; every run retains one H1 and its expected status with zero overflow, unnamed controls, undersized mobile targets, axe violations, or incomplete findings. Non-sensitive roles expose no restricted medical title, owner, or source path. The seven-action manager flow advances from profile selection through audited download with live-region confirmation and focus return after every transition; failed generation retries attempt two from the same manifest, auditor access regeneration succeeds, the contributor redaction action is disabled, the mobile layout remains coherent, and browser logs are empty. Focused ESLint, full TypeScript, all 14 redesign regression suites, export/monthly/new-year/archive/attachment parity gates, diff hygiene, and the production build pass; the route verifier covers 339 app routes and 30 critical aliases, and `/design-lab/inspection` emits statically with only documented repository warnings. A clean built-app smoke at `390 x 844` confirms `READY_TO_DOWNLOAD`, one H1, zero overflow, zero restricted-evidence leakage, zero axe findings, and empty browser logs.
- **Parity:** The slice is synthetic and additive. No production compliance field/document, staff/child attachment, monthly report, CSV/XLSX/PDF/print path, SQL backup, storage object, query, mutation, server action, Prisma model, database row, permission, route, native payload, legacy alias, or restored capability changed.
- **Evidence boundary:** Approved first-market requirement profiles, legal/privacy review, production source identities and revisions, schema/persistence, transactional job orchestration, private encryption and expiring delivery, retention/deletion, authorization integration, representative scale, operator/inspector validation, assistive technology, real-device contribution, and selected-system polish remain release gates.
- **Next action:** Receive the explicit Daylight, Signal, or Carebook selection, then codify the brand/design constitution and consume the seven executable workflow contracts in the first server-owned production pilot. Until selection, continue only reversible parity and contract evidence that does not alter production visuals.
- **Progress earned:** 0 percentage points. This closes J07 behavioral uncertainty but does not satisfy selected-direction production implementation required for Phase 6; total remains 55%.

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
