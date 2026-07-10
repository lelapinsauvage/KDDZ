# Kiddz Online Redesign Progress

**Last updated:** 2026-07-10
**Plan:** `docs/redesign-master-plan.md`
**Program state:** Brand strategy and three build-ready creative territories active
**Reported progress:** **22% done / 78% left**

The percentage is weighted by verified phase gates. It is not an estimate based on time or code volume.

## Phase Tracker

| Phase | Weight | Status | Earned | Evidence required to close |
| --- | ---: | --- | ---: | --- |
| 0. Safety and baseline | 3% | Complete | 3% | Clean branch, approved asset preservation, baseline screenshots and checks |
| 1. Product discovery | 12% | In progress | 9% | Flow inventory, role/task matrix, current journeys, friction/risk register |
| 2. Benchmark research | 10% | In progress | 9% | Pinterest taxonomy, Mobbin flow sheets, benchmark synthesis |
| 3. Brand strategy and direction | 10% | In progress | 1% | Strategy, three complete territories, selected brand constitution |
| 4. IA and core UX | 12% | Not started | 0% | Sitemap, navigation model, Today model, tested wireframes |
| 5. Design system | 13% | Not started | 0% | Tokens, components, motion, responsive and accessibility docs |
| 6. Pilot core flows | 15% | Not started | 0% | Shell, Today, attendance, ratios, child profile verified |
| 7. Full product rollout | 20% | Not started | 0% | All canonical flows migrated with parity evidence |
| 8. Hardening and award polish | 5% | Not started | 0% | QA, performance, accessibility, award scorecards and assets |
| **Total** | **100%** |  | **22%** |  |

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

1. Build the shared synthetic scenario and neutral information anatomy for the territory lab.
2. Implement Daylight, Signal, and Carebook independently across realistic Today, table, form, high-risk, and cross-device content.
3. Verify all required viewports, interactions, contrast, keyboard, zoom, and reduced motion in Agent Browser.
4. Score the territories against operational clarity, accessibility, award, and usability criteria.
5. Recommend one direction and wait for selection before production UI implementation.
6. Keep direct-nursery, operator, jurisdiction, and real-device questions open at their implementation gates.

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
