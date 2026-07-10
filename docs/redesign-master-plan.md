# Kiddz Online Award-Level Redesign Master Plan

**Status:** Authoritative redesign plan
**Created:** 2026-07-10
**Product:** Kiddz Online nursery management platform
**Primary surface:** Desktop web application
**Secondary surfaces:** Tablet, mobile web, legacy iOS, and legacy Android workflows
**Execution tracker:** `docs/redesign-progress.md`

## 1. Mission

Redesign Kiddz Online as a world-class daily operations product for nursery teams. The result must preserve the restored application's functional breadth while replacing its legacy information architecture, interaction patterns, visual language, and motion with a coherent, distinctive system.

This is not a reskin. It is a controlled product redesign covering:

- Brand strategy and identity.
- Information architecture and navigation.
- Role-specific daily workflows.
- Interaction design and content design.
- Visual and motion systems.
- Accessibility and performance.
- Desktop, tablet, and mobile behavior.
- Implementation, browser verification, and regression protection.

The ambition is award-level craft, but awards are a quality framework rather than a reason to make the product theatrical. Nursery operations must become faster, clearer, safer, and more pleasant.

## 2. Non-Negotiable Product Truths

1. **Desktop first.** The manager's desktop workspace defines the information architecture and density. Tablet and mobile are intentionally adapted, not stretched desktop layouts.
2. **No functional regression.** Every current route, action, role, permission, database behavior, legacy alias, native contract, and production gate remains available until an accepted replacement is verified.
3. **A white-dominant product canvas.** Approximately 90% of the operational interface should remain white or near-white. Color carries hierarchy, status, emotion, and action; it is not page wallpaper.
4. **Playful, never childish.** Kiddz Online serves adults doing serious care work. The brand may be warm, expressive, and joyful without turning compliance, medicine, finance, or safeguarding into a game.
5. **No generic component-library appearance.** Radix and existing primitives may remain implementation foundations, but the rendered product must not look like stock shadcn UI.
6. **No invented information.** Charts, trends, alerts, status badges, and insights must be backed by real product data and a real user decision.
7. **No decorative filler.** Random blobs, corner ornaments, gradients, fake bars, colored left borders, and motion without meaning are prohibited.
8. **Color has a job.** Every semantic color must represent a documented state, category, or emphasis rule. A new color cannot be added because a screen feels empty.
9. **Motion has a job.** Motion explains continuity, confirms completion, directs attention, or communicates state. It must be brief, interruptible, and reduced when the user requests reduced motion.
10. **Accessibility is a design input.** WCAG 2.2 AA, keyboard completion, zoom, large text, color-independent states, and reduced motion are part of every component and flow.

## 3. Current Product Baseline

The modern repository currently contains:

- 244 `page.tsx` files, including modern pages and legacy compatibility aliases.
- 83 `route.ts` handlers.
- 113 React component files.
- A 1,713-row legacy parity matrix covering web, data, native, and production expectations.
- Existing dashboard, attendance, children, staff, medical, reports, messages, accounting, compliance, and settings modules.

This scale rules out a page-by-page paint exercise. The redesign must first identify canonical workflows, consolidate duplicate aliases behind shared experiences, and then migrate the application by reusable patterns.

### Baseline artifacts

- `docs/page-parity-matrix.json`: functional preservation source.
- `docs/legacy-inventory.md`: legacy surface inventory.
- `docs/ux-research.md`: earlier secondary nursery UX research.
- `docs/design-research.md`: earlier category research; useful as input, not the new creative direction.
- `docs/design-system.md`: current component documentation; must be audited rather than treated as final.
- Pinterest board: <https://fr.pinterest.com/karims2381/_pins/>

## 4. Preliminary Creative Thesis

The first visible group on the Pinterest board combines Duolingo, Headspace-like communication, Klarna-style editorial color, friendly characters, warm neutrals, and highly legible product layouts. The shared quality is not "rounded cards." It is a tension between disciplined white space and confident moments of personality.

The intended Kiddz Online expression is therefore:

> **Operational clarity with a living pulse.** A precise, white, desktop productivity product whose important moments become warm, tactile, colorful, and recognizably Kiddz Online.

This thesis is provisional until the creative-direction gate. It should guide research, not predetermine the final palette or component shapes.

## 5. Benchmark Research Program

Research must extract transferable principles and reject superficial copying. Each reference produces a short evidence sheet with screenshots, flow maps, observed rules, strengths, failures, and a Kiddz Online implication.

### 5.1 Named benchmark products

| Product | What to study | What not to copy blindly |
| --- | --- | --- |
| Revolut | Simplifying a very broad feature set, progressive disclosure, home hierarchy, contextual actions, onboarding, transaction confidence, status feedback | Fintech darkness, promotional modules, or financial visual metaphors |
| Notion | Content-first composition, predictable rhythm, flexible objects, inline actions, contextual menus, low visual noise | Excessive neutrality or blank-document assumptions |
| Cursor | Desktop density, command palette, keyboard workflows, contextual panels, focus management, multi-pane continuity | Developer jargon, dark-only aesthetics, or IDE complexity |
| Cosmos | Visual calm, one-tap capture, curation, search by multiple modes, minimal metadata, cross-device continuity | Image-led layouts where operational text or data must dominate |
| Vercel | Grid rigor, typography, high contrast, technical precision, consistent component geometry | Monochrome austerity or developer-tool coldness |
| Duolingo | Complete brand world, emotional color, character behavior, illustration, sound/motion feedback, motivation loops | Gamifying legal, medical, finance, or safeguarding responsibilities |
| Duolingo ABC | Child-safe clarity, guided progression, accessible interaction, friendly instruction | Designing the manager product as a children's app |
| Genie iOS | Immersive assistant entry points, quick actions, media generation states, conversational transitions | AI-first assumptions where structured workflows are faster |
| Anything web/iOS | Cross-device continuity, prompt-to-result progress, mobile creation, voice entry, fast preview loops | Generic AI-generated UI patterns |

### 5.2 Additional world-class references to study

- **Apple first-party apps:** spatial hierarchy, direct manipulation, platform-native feedback, transitions, accessibility.
- **Things 3:** calm task hierarchy, completion feedback, progressive disclosure, excellent empty and done states.
- **Linear:** speed, keyboard navigation, issue/action density, optimistic updates, command architecture.
- **Headspace:** warmth, emotional safety, brand voice, illustration consistency, organic color relationships.
- **Klarna:** confident editorial composition, expressive campaigns, controlled high-chroma color.
- **Stripe:** complex form flows, validation, documentation-grade clarity, data-heavy surfaces.
- **Airbnb:** trust, date and occupancy interactions, search/filter structure, polished forms.
- **Flighty:** glanceable operational status, live activity, meaningful motion, exception handling.
- **Gentler Streak:** humane data visualization and color without anxiety.
- **Craft and Arc:** spatial transitions, responsive sidebars, tactile navigation, strong product character.

### 5.3 Direct competitor research

Study Famly, Brightwheel, Blossom, Connect Childcare, Tapestry, Cheqdin, Lillio, Procare, Illumine, and Nursery Story for domain coverage. Competitors are primarily used to identify required jobs, terminology, and failure patterns. They do not set the visual ceiling.

### 5.4 Mandatory flows to inspect in Mobbin and live products

For every relevant benchmark, capture the complete flow where available:

1. First launch and onboarding.
2. Sign-in, recovery, and organization selection.
3. Home/dashboard first scan.
4. Global and contextual navigation.
5. Search, filtering, and saved views.
6. Primary quick action.
7. Long form and multi-step form.
8. Create, edit, delete, undo, and confirmation.
9. Empty, loading, offline, error, and permission states.
10. Notifications and action-needed states.
11. Detail page and related-record navigation.
12. Customization and preferences.
13. Mobile-to-desktop continuity.
14. Success, completion, and return-to-work transitions.

Each flow record must include:

- Entry point and user intent.
- Number of steps and decisions.
- Information revealed at each step.
- Navigation and back behavior.
- Validation and error prevention.
- Motion and feedback.
- Accessibility observations.
- What Kiddz Online should borrow, adapt, or reject.

### 5.5 Reference board taxonomy

The Pinterest board remains the user's living creative source. Saved references must be tagged into:

- Brand soul and personality.
- Logo and wordmark.
- Typography.
- Color relationships.
- Editorial composition.
- Product shell and navigation.
- Dashboards and operational summaries.
- Forms and data entry.
- Tables and dense records.
- Data visualization.
- Illustration and characters.
- Motion and transitions.
- Empty, success, error, and onboarding states.
- Mobile and tablet patterns.
- Anti-references.

An image without a written reason is inspiration, not a decision.

## 6. Research Method

The program follows the Design Council's Discover, Define, Develop, and Deliver model, with explicit divergence and convergence gates.

### Discover

- Inventory the product, roles, routes, data, permissions, and legacy aliases.
- Reproduce the current application end to end in the browser.
- Observe or interview nursery managers, room leaders, practitioners, administrators, nurses, and parents where access is possible.
- Study benchmarks, competitors, brand references, award criteria, accessibility, and motion guidance.
- Record problems before proposing visual solutions.

### Define

- Synthesize jobs, anxieties, frequency, risk, and time pressure.
- Establish experience principles and measurable target outcomes.
- Create the canonical information architecture and workflow map.
- Select the brand territory and visual principles.
- Prioritize the core daily loop.

### Develop

- Produce multiple solutions for critical flows.
- Prototype behavior before generalizing components.
- Test with realistic data, roles, and interruption scenarios.
- Convert accepted patterns into tokens, components, and templates.

### Deliver

- Implement in small vertical slices.
- Verify behavior, accessibility, responsive layout, and performance in-browser.
- Compare against baseline functional contracts.
- Run task-based usability tests and iterate.
- Complete award-quality polish only after the workflow is correct.

## 7. User and Workflow Discovery

### 7.1 Primary roles

| Role | Core outcome | Dominant pressure |
| --- | --- | --- |
| Nursery manager | Know the nursery is safe, staffed, compliant, occupied, and financially controlled | Time, legal anxiety, interruptions, incomplete information |
| Room leader | Keep a room safe and coordinated while supporting practitioners | Ratio changes, handovers, urgent exceptions |
| Practitioner | Record care quickly while remaining present with children | One-handed use, interruptions, repetitive entry |
| Administrator/owner | Control branches, billing, occupancy, staff, settings, and reporting | Breadth, reconciliation, auditability |
| Nurse/doctor | Review and update sensitive health records safely | Accuracy, privacy, urgency |
| Parent | Understand the child's day, communicate, and complete obligations | Trust, clarity, responsiveness |

### 7.2 Critical daily jobs

- Opening readiness and unresolved overnight issues.
- Staff presence and room-to-child ratios.
- Child arrivals, absences, and departures.
- Safeguarding, allergies, medication, accidents, and medical exceptions.
- Daily care records and batch updates.
- Occupancy, future places, and funded hours.
- Rota, cover, staff attendance, and cost.
- Billing, unpaid invoices, payments, and reconciliation.
- Parent communication and action tracking.
- Compliance evidence and inspection readiness.
- Cross-branch oversight.

### 7.3 Discovery outputs

- Role-to-task matrix.
- Day-in-the-life timelines.
- Current-state journey maps.
- Friction and risk register.
- Terminology glossary.
- Permission and data-sensitivity matrix.
- Canonical flow inventory linked to parity rows.
- Top-task ranking by frequency, urgency, risk, and business value.

## 8. Information Architecture Strategy

The application should be organized around work, not legacy database entities.

### Proposed top-level model to validate

1. **Today**: live nursery state, ratios, attendance, urgent actions, schedule, handovers.
2. **Children**: child records, daily care, development, attendance, health, contacts, finance.
3. **People**: staff, roles, rota, attendance, qualifications, permissions.
4. **Places**: branches, rooms/classes, capacity, occupancy, compliance.
5. **Communication**: inbox, announcements, calls, parent requests, notifications.
6. **Finance**: invoices, payments, funding, payroll, exports.
7. **Reports**: operational, compliance, attendance, finance, custom/saved reports.
8. **Settings**: organization, users, access, calendars, integrations, data administration.

This is a hypothesis. It becomes final only after every existing route and role is mapped and no essential action is buried.

### Navigation requirements

- Persistent desktop sidebar with role-aware content and stable landmarks.
- Global search and command launcher for records and actions.
- Contextual sub-navigation inside child, branch, staff, and finance workspaces.
- Breadcrumbs only where hierarchy genuinely helps.
- Recently viewed and saved views for high-frequency records.
- Keyboard completion for frequent manager tasks.
- Clear route continuity for every legacy URL alias.

## 9. Brand Strategy and Identity Phase

No production page redesign begins until the creative-direction gate is passed.

### Required strategy outputs

- Brand purpose, promise, positioning, and audience truth.
- Personality spectrum with behavioral examples.
- Voice and tone by context: routine, success, warning, medical, financial, safeguarding.
- Brand narrative and message hierarchy.
- Competitive and cultural whitespace.
- Moodboard with explained references and anti-references.

### Required creative territories

Create three genuinely different territories. Each territory must include:

- A written concept and emotional goal.
- Logo behavior and typography.
- Full palette with relationships, not isolated swatches.
- Illustration or graphic language.
- Motion sample.
- Today/dashboard sample using realistic data.
- Form sample.
- Dense table or records sample.
- Success, warning, and urgent state.
- Desktop and mobile crop.
- Explicit strengths, risks, and reasons it fits Kiddz Online.

The selected territory becomes `docs/brand-design-constitution.md`, the single source of truth for brand and product expression.

### Existing identity decisions to preserve unless deliberately revised

- Name: **Kiddz Online**.
- Capitalized `Kiddz`; `Online` provides the digital contrast.
- Current wordmark direction uses a warmer display face for Kiddz and Inter for Online.
- The `O` may act as the friendly face/ring mark.
- Warm off-white is preferred to cold gray as a brand canvas.
- The approved logo intro contains no decorative corner circles or pupil inside the O.

## 10. Experience Principles

Every design decision must satisfy these principles.

1. **State before statistics.** Show what is happening, what changed, and what needs action before showing generalized metrics.
2. **Risk is visible.** Ratio, safeguarding, health, staffing, payment, and compliance exceptions are never buried.
3. **Routine work collapses.** Batch actions, smart defaults, remembered choices, and templates minimize repetition.
4. **Exceptions expand.** Normal states stay compact; unusual states reveal the depth needed to resolve them.
5. **Everything is traceable.** Users can understand who changed what, when, and why.
6. **One clear next action.** Each surface has a dominant task without hiding secondary work.
7. **Context follows the user.** Branch, room, date, and role remain clear through navigation and actions.
8. **Completion feels handled.** Success feedback is immediate, restrained, and reassuring.
9. **No dead ends.** Empty and error states preserve the user's context and offer a valid next step.
10. **Beauty survives density.** Tables, forms, and compliance screens receive the same craft as the dashboard.

## 11. Design System Program

The design system is built from accepted workflows, then generalized. It is not a gallery made before the product is understood.

### 11.1 Foundations

- Color: brand, neutral, semantic, categorical, data visualization, light/dark, contrast pairs.
- Typography: display, title, body, label, numeric, tabular, Arabic/RTL fallback, responsive and large-text behavior.
- Spacing: documented base grid and density modes.
- Shape: radii by component role, borders, dividers, focus rings.
- Elevation: a small semantic scale for layers, menus, drawers, and draggable surfaces.
- Iconography: consistent library, optical sizing, filled/outlined state rules.
- Illustration and character behavior.
- Motion: duration, easing, spring, stagger, morph, entrance, exit, feedback, reduced-motion equivalents.
- Sound/haptics principles for native surfaces, where appropriate.

### 11.2 Core components

- Buttons, icon buttons, split buttons, segmented controls.
- Inputs, text areas, selects, comboboxes, date/time controls.
- Checkboxes, switches, radios, steppers, sliders.
- Badges, tags, avatars, status indicators.
- Tooltips, popovers, menus, command palette.
- Dialogs, sheets, drawers, banners, toasts.
- Tabs, sidebar, contextual navigation, breadcrumbs.
- Tables, lists, cards, timelines, calendars.
- Charts only for validated analytical questions.
- Loading, empty, error, offline, permission, and success states.

Every component documents anatomy, variants, states, behavior, accessibility, content rules, motion, responsive behavior, and prohibited use.

### 11.3 Product patterns

- Live status and action-needed pattern.
- Ratio and capacity pattern.
- Attendance/check-in pattern.
- Batch data-entry pattern.
- Child, staff, and branch profile pattern.
- Long-form and save/draft pattern.
- Messaging and action tracking pattern.
- Invoice/payment pattern.
- Compliance evidence pattern.
- Sensitive medical data pattern.
- Audit trail and change history pattern.

### 11.4 Motion implementation direction

- Use `motion/react` for layout continuity, shared-element transitions, and physically coherent springs after a prototype proves the need.
- Prefer transform and opacity animations; avoid layout thrashing and expensive blur.
- Use native view transitions where support and fallback behavior are reliable.
- Frequent actions receive minimal motion; meaningful state changes can receive richer feedback.
- No blocking animation. Inputs remain usable during transitions.
- Every motion pattern has a reduced-motion equivalent.

## 12. Redesign and Implementation Waves

### Wave 0: Product shell

- Sidebar and global navigation.
- Header/context controls.
- Search and command launcher.
- Page layout, density, responsive behavior.
- Notifications, global feedback, loading transitions.

### Wave 1: The daily operational core

- Today/home.
- Live attendance and check-in/out.
- Room ratios and staffing exceptions.
- Action center and handover.
- Branch overview and cross-branch switching.

### Wave 2: Children and care

- Children list and search.
- Child profile and timeline.
- Daily reports and batch reporting.
- Absence, accidents, medical, vaccinations, assessments.
- Parent and authorized-contact context.

### Wave 3: Staff and organization

- Staff directory and profiles.
- Attendance, rota, cover, qualifications.
- Rooms/classes, capacity, branch details.
- Role and access management.

### Wave 4: Communication

- Inbox and conversation detail.
- Direct, class, and broadcast composition.
- Calls, parent requests, notifications, and follow-up states.

### Wave 5: Finance, occupancy, and reporting

- Accounting overview.
- Invoices, payments, funding, payroll.
- Occupancy and future capacity.
- Operational and management reports.

### Wave 6: Compliance, administration, and edge surfaces

- Branch compliance and evidence.
- Calendars, food, holidays, events.
- Settings, exports, integrations, legacy user administration.
- Print and PDF experiences.
- Legacy aliases and native/parent compatibility views.

Each wave is delivered as vertical flows with real data, all states, browser evidence, and parity verification. A visually complete page with broken actions does not count.

## 13. Verification Protocol

### 13.1 Browser verification for every slice

Use the Agent Browser continuously to verify:

- Real navigation and data loading.
- Primary and secondary actions.
- Loading, empty, partial, error, and offline states.
- Keyboard order, focus visibility, escape/back behavior.
- Hover, pressed, selected, disabled, and destructive states.
- Text wrapping, long names, localization, RTL, and zoom.
- Motion quality and reduced motion.
- Console and runtime errors.

Minimum visual viewports:

- 1440 x 900 desktop.
- 1280 x 800 compact desktop.
- 1024 x 768 tablet landscape.
- 768 x 1024 tablet portrait.
- 390 x 844 mobile.

### 13.2 Functional regression

- Map redesigned flows to `docs/page-parity-matrix.json`.
- Preserve permissions and role visibility.
- Preserve database writes and audit behavior.
- Preserve legacy URLs through redirect or compatibility rendering.
- Preserve native API shapes and file behavior.
- Add focused automated tests for shared components and critical workflows.

### 13.3 Usability testing

Test task scenarios rather than asking whether screens look good:

- Resolve an unsafe ratio before opening.
- Check in a child with a medical alert.
- Record the same meal for a room and edit one exception.
- Find an overdue payment and contact the parent.
- Prepare evidence for an inspection.
- Find who changed a child's health record.
- Reassign staff cover during an absence.

Record completion, time, wrong turns, hesitation, recovery, confidence, and subjective workload. Iterate with small groups per distinct role rather than relying on one large final test.

## 14. Performance and Quality Budgets

- No layout shift from counters, charts, images, or loading states.
- Core interactions must acknowledge input immediately.
- Avoid long blocking spinners; preserve context with skeletons or optimistic updates where safe.
- Animation should hold 60 fps on representative hardware.
- Route and component bundles are measured before adding heavy visual libraries.
- Large tables use pagination or virtualization appropriate to real dataset sizes.
- Images are sized, compressed, and lazy-loaded appropriately.
- The app remains usable on unreliable nursery Wi-Fi.

## 15. Award Quality Scorecard

The project uses two external quality lenses.

### Awwwards-style weighting

- **Design: 40%.** Visual system, typography, composition, consistency, responsive craft.
- **Usability: 30%.** Task success, clarity, accessibility, speed, error recovery.
- **Creativity: 20%.** Distinctive interaction and brand expression tied to the product.
- **Content: 10%.** Language, hierarchy, realistic data, empty/error/help content.

### Apple Design Award lens

- Delight and fun.
- Interaction.
- Inclusivity.
- Innovation.
- Social impact.
- Visuals and graphics.

Every core flow is scored against both lenses before final polish. A high visual score cannot compensate for poor task completion.

## 16. Autonomous Operating Loop

While the user is unavailable, work proceeds in this loop:

1. Read the next tracker item and its acceptance criteria.
2. Gather missing evidence from the current app, legacy source, Mobbin, official guidance, or live benchmarks.
3. Record the finding and its source.
4. Produce alternatives when the decision is consequential.
5. Select the strongest reversible option using the decision ladder below.
6. Implement the smallest complete vertical slice.
7. Verify it in-browser and against functional parity.
8. Capture screenshots, test results, and known limitations.
9. Update the tracker and decision log.
10. Commit a reviewable increment only when the slice is coherent and verified.

### Decision ladder

When uncertain, decide in this order:

1. Observed user need or user-approved direction.
2. Current Kiddz Online product and legacy behavior.
3. Real task and data requirements.
4. Direct evidence from Mobbin or a live benchmark.
5. Official platform, accessibility, and design guidance.
6. Design-system consistency.
7. The most conservative reversible choice.

Only block for a decision that is irreversible, changes product meaning, removes functionality, or commits the brand to a direction the user has not seen. Otherwise proceed, document the assumption, and keep it easy to revise.

## 17. Phase Plan and Completion Gates

| Phase | Weight | Required result | Gate |
| --- | ---: | --- | --- |
| 0. Safety and baseline | 3% | Clean redesign branch, preserved approved logo work, baseline screenshots/tests, inventory commands | No rejected design code or unrelated dirty files enter the branch |
| 1. Product discovery | 12% | Canonical flow inventory, role/task matrix, current journeys, friction/risk register | Every current capability has an owner and workflow |
| 2. Benchmark research | 10% | Pinterest taxonomy, Mobbin flow sheets, competitor and world-class benchmark synthesis | Findings name transferable principles and anti-patterns |
| 3. Brand strategy and direction | 10% | Strategy, three complete territories, selected direction, brand constitution | Direction is demonstrated on real product surfaces |
| 4. IA and core UX | 12% | Validated sitemap, navigation, Today model, wireframes, content hierarchy | Top tasks are reachable and no essential capability is buried |
| 5. Design system | 13% | Tokens, components, motion, responsive/accessibility rules, system documentation | Core components pass visual, behavior, and accessibility review |
| 6. Pilot core flows | 15% | Shell, Today, attendance, ratios, child profile prototype and implementation | Real tasks pass browser and usability checks |
| 7. Full product rollout | 20% | Remaining modules migrated by pattern with parity evidence | All canonical flows implemented and verified |
| 8. Hardening and award polish | 5% | Cross-device QA, performance, accessibility, motion, content, award submission assets | No critical defects; scorecards and acceptance evidence complete |

Progress is earned only when the gate evidence exists. Time spent, code volume, and visual enthusiasm do not increase the percentage.

## 18. Git and Delivery Workflow

Before implementation begins:

1. Verify `main`, `legacy-parity-runbook`, and the remote state.
2. Preserve the approved logo animation deliberately.
3. Exclude or remove rejected design-lab work only after confirming it has no approved assets.
4. Create a clean redesign branch from updated `main`; proposed name: `ux-redesign-awards`.
5. Keep functional restoration and redesign history auditable.

Commit pattern:

- `docs: record <research or decision>`
- `design: add <tokens or component pattern>`
- `ux: redesign <complete flow>`
- `test: verify <flow or component>`
- `fix: correct <specific regression>`

Commits must be small enough to review but complete enough to run. Do not mix unrelated modules or generated artifacts.

## 19. Required Living Artifacts

- `docs/redesign-master-plan.md`: this plan.
- `docs/redesign-progress.md`: weighted status, queue, evidence, and blockers.
- `docs/brand-design-constitution.md`: selected brand and product design rules.
- `docs/redesign/benchmark-matrix.md`: product-by-product findings.
- `docs/redesign/flow-inventory.md`: canonical current and target flows.
- `docs/redesign/information-architecture.md`: navigation and sitemap decisions.
- `docs/redesign/motion-system.md`: motion tokens and behavior.
- `docs/redesign/accessibility-checklist.md`: component and flow acceptance.
- `docs/redesign/decision-log.md`: dated decisions with evidence and reversibility.
- `docs/redesign/award-scorecard.md`: final external-quality assessment.

## 20. Sources and Standards

- User's Pinterest board: <https://fr.pinterest.com/karims2381/_pins/>
- Design Council Double Diamond: <https://www.designcouncil.org.uk/resources/the-double-diamond/>
- Apple Human Interface Guidelines, design principles: <https://developer.apple.com/design/human-interface-guidelines/design-principles>
- Apple Human Interface Guidelines, motion: <https://developer.apple.com/design/human-interface-guidelines/motion>
- Apple Design Awards: <https://developer.apple.com/design/awards/>
- W3C WCAG 2.2: <https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/>
- Awwwards evaluation system: <https://www.awwwards.com/about-evaluation/>
- Vercel Geist design system: <https://vercel.com/geist/introduction>
- Duolingo brand guidelines: <https://design.duolingo.com/>
- Cosmos: <https://www.cosmos.so/>
- Revolut Product and Design: <https://www.revolut.com/careers/team/product-design/>
- Notion design-system guidance: <https://www.notion.com/use-case/design-system>

## 21. Immediate Next Action

Begin Phase 0 and Phase 1 together: establish the clean branch and baseline, then build the canonical flow inventory from the current app and parity matrix. In parallel, complete the Pinterest taxonomy and Mobbin benchmark sheets. No new dashboard visual direction should be coded before the brand and IA evidence is ready.
