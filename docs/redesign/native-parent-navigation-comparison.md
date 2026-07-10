# Native And Parent Navigation Comparison

**Date:** 2026-07-10
**Status:** Source comparison and executable contract complete; real-device acceptance open
**Contract:** `src/lib/redesign-native-parent-navigation.ts`
**Verifier:** `src/scripts/verify-redesign-native-parent-navigation.ts`

## Decision Question

What parent product actually exists across the preserved iOS app, Android app, current parent web portal, restored PHP routes, and modern parent API, and what must a redesign preserve, repair, or replace?

## Boundary

This is a source-level and browser comparison. It does not claim that either legacy native project currently builds, signs, installs, reaches a production host, receives provider push, or works on a current device. Those remain `PROD-NATIVE` and provider gates.

No native source, signing file, credential, child record, parent record, token, or production endpoint response is copied into the public repository. The local iOS folder contains signing material and the Android source contains credential literals; neither is reproduced here, and neither legacy folder should ever be imported wholesale.

## Sources Inspected

### Preserved iOS source

- `Desktop/Garderie Project/KiddzOnline/KiddzOnline/Base.lproj/Main.storyboard`
- `ViewControllers/LoginViewController.swift`
- `ViewControllers/HomeViewController.swift`
- `ViewControllers/MessagesViewController.swift`
- `ViewControllers/NotificationsViewController.swift`
- `Classes/WebFunctions.swift`
- `Classes/GlobalVariables.swift`

### Preserved Android source

- `Desktop/Garderie Project/kiddzonline-master/app/src/main/res/navigation/nav_graph.xml`
- `res/layout/main_fragment.xml`
- `java/com/kiddzonline/android/ui/main/MainViewModel.java`
- `java/com/kiddzonline/android/net/WebService.java`
- `java/com/kiddzonline/android/net/WebServiceFunctions.java`
- Messages and Notifications fragments/view models
- `LoginActivity.java`, `SplashActivity.java`, manifest, and Gradle configuration

### Current product

- `/parent` and `/parent/login`
- `src/app/(parent)/parent/parent-portal-client.tsx`
- `/api/parent/**`
- `/master.php`, `/ws/*.php`, and `/[legacyPath]/ws/[endpoint]`
- `parent-api-contract-matrix.md`, `native-acceptance-ledger.md`, and existing native parser/E2E verifiers

## Executive Finding

There is no single current parent IA.

- iOS has six visible working destinations, one hidden broken Messages stub, a login-payload full-report handoff, iOS push registration, and an eleven-group notification payload that the UI can render only partly.
- Android visibly advertises seven destinations, but only Daily Report, Absence Report, Food Calendar, Holiday Calendar, and Payments call Retrofit. Messages and Notifications are empty placeholders.
- Parent web is the only surface with complete message list/open/reply/compose behavior, grouped notifications, browser push controls, and all parent datasets available from one authenticated session.
- The modern backend already restores more capability than either old native UI exposes. The redesign must converge the clients on those real capabilities, not preserve dead buttons or silently declare them parity.

## iOS Journey

```text
Launch
  -> GET/POST-compatible master.php nursery registry
  -> parent enters nursery + username + password
  -> selected nursery path constructs /{legacyPath}/ws/
  -> ws/login.php
  -> fixed portrait home
  -> native lists and external full-report handoff
```

### iOS home destinations

| Order | Source destination | Source state | Legacy contract | Target treatment |
| ---: | --- | --- | --- | --- |
| 1 | Daily Report | Visible and operational | `newdaily.php` | Preserve complete daily-care meaning and redesign |
| 2 | Absence Report | Visible and operational | `absence.php` | Preserve and redesign under parent attendance |
| 3 | Food Calendar | Visible and operational | `foodcalendar.php` | Preserve inside Calendar |
| 4 | Holiday Calendar | Visible and operational | `holcalendar.php` | Preserve inside Calendar |
| 5 | Notifications | Visible, data-bearing, defective | `notifications_master.php` plus older `notifications.php` alias | Repair category access and redesign as Activity |
| 6 | Payments | Visible and operational | `finance.php` | Preserve and redesign |
| Hidden | Messages | Hidden storyboard button and broken callback/controller | `messages.php` | Restore as a complete first-class capability |
| Utility | Full report | External URL from login payload | Dynamic handoff | Preserve only through an allowlisted, authenticated handoff or replace with equivalent in-app evidence |
| Background | Push registration | OneSignal player registration/deactivation | `pnotifications.php` | Preserve delivery contract during cutover |

### iOS defects and risks

1. Transport URLs are cleartext HTTP.
2. Nursery discovery builds a runtime directory path and stores it locally.
3. Username and password are stored for automatic re-login.
4. The Messages button is hidden; its controller listens for the wrong completion event and never presents a useful message experience.
5. Notification parsing creates eleven category arrays, but `numberOfSections` returns eight. Payments, Other, and Requests cannot receive a section even when data exists.
6. The UI is a fixed 375-point storyboard with many fixed frames.
7. OneSignal integration and dependencies are from the archived client generation.
8. A local distribution certificate exists beside the source and must remain private.

The notification section defect is a source bug, not a contract to preserve. The eleven-group payload remains compatibility evidence; the target Activity UI must expose every authorized category.

## Android Journey

```text
Splash
  -> retry stored username/password against one fixed tenant endpoint
  -> Login or Main
  -> seven-tile portrait home
  -> five Retrofit-backed lists + two empty placeholders
```

### Android home destinations

| Order | Source destination | Source state | Retrofit contract | Target treatment |
| ---: | --- | --- | --- | --- |
| 1 | Daily Report | Visible and operational | `daily.php` | Preserve legacy summary plus converge on complete daily care |
| 2 | Absence Report | Visible and operational | `absence.php` | Preserve and redesign under parent attendance |
| 3 | Food Calendar | Visible and operational | `foodcalendar.php` | Preserve inside Calendar |
| 4 | Holiday Calendar | Visible and operational | `holcalendar.php` | Preserve inside Calendar |
| 5 | Notifications | Visible placeholder | No Retrofit method | Build the real Activity experience |
| 6 | Messages | Visible placeholder | No Retrofit method | Build complete message list, thread, compose, reply, and delivery state |
| 7 | Payments | Visible and operational | `finance.php` | Preserve and redesign |

### Android defects and risks

1. The API base is one hard-coded cleartext demo tenant; there is no iOS-style nursery discovery.
2. Credential defaults are present as source literals. Their values are deliberately not recorded here. They must be removed and rotated if still valid.
3. Stored credentials are replayed from the splash screen.
4. Messages and Notifications have routes, fragments, and buttons but only TODO view models.
5. No notification provider or push-token registration was found in this backup.
6. The project targets Android API 28 and the pre-AndroidX support stack.
7. The only unit/instrumentation tests are generated examples.

Visible-but-empty buttons count as restoration debt. The target may reorganize them, but it may not omit the intended Messages or Notifications jobs.

## Parent Web Journey

```text
/parent
  -> missing/invalid browser session redirects to /parent/login
  -> /api/parent/login
  -> eager parallel load of seven parent feeds
  -> Today summary + six content tabs
```

### Current parent web structure

| Position | Destination | Current capability |
| ---: | --- | --- |
| 0 | Today summary | Latest daily care, recent notifications, aggregate counts |
| 1 | Daily | Detailed daily reports |
| 2 | Payments | Payment history |
| 3 | Absence | Absence history |
| 4 | Messages | Compose, thread list, open, reply, refresh |
| 5 | Calendar | Food and holidays |
| 6 | Notifications | All grouped details plus push enable/disable |

Browser evidence confirms that signed-out `/parent` resolves to `/parent/login`, the login form has properly named username/password controls and a named password-visibility button, and the 390 x 844 entry has no horizontal overflow or unnamed button.

### Parent web strengths

- One authenticated product surface reaches every real parent dataset.
- Messages restore the intended native capability instead of exposing a stub.
- Notification groups and push controls are visible.
- The current API and legacy adapters already share parser-safe mappers.

### Parent web redesign debt

- It is a dense legacy-parity page, not the award-level parent experience.
- All seven feeds load eagerly before the first useful state settles.
- The top summary duplicates counts instead of prioritizing what changed or needs acknowledgment.
- Six tabs overflow horizontally on phones.
- Payments use a desktop-width table inside a phone-first surface.
- Browser tokens are stored in local storage; native clients need platform-protected token storage.
- Loading and error behavior are page-wide and do not preserve successful partial feeds.

## Capability Convergence

| Target parent domain | iOS source | Android source | Parent web | Decision |
| --- | --- | --- | --- | --- |
| Today | Tile home only | Tile home only | Summary exists | Build a personal day timeline: latest care, changes, requests, and unread work |
| Daily care | Detailed `newdaily` | Older `daily` summary | Detailed | Use the detailed canonical model with graceful legacy field fallback |
| Attendance | Absence history | Absence history | Absence history | Preserve history; add request/correction only when server capability exists |
| Calendar | Separate food/holiday | Separate food/holiday | Combined | Combine navigation without merging the underlying records |
| Messages | Hidden broken stub | Visible empty placeholder | Complete | Parent web behavior is the minimum target capability |
| Payments | Operational | Operational | Operational | Preserve exact transaction meaning, currency, period, and receipt links |
| Activity | Partial grouped notifications | Empty placeholder | Complete groups + browser push | Expose every authorized group with read/acknowledgment and source-object routing |
| Reports | External login URL | None | Daily report detail only | Preserve external handoff until a secure in-app equivalent passes parity |

No target domain removes a legacy endpoint or data family. Navigation consolidation is allowed only when the underlying records, meanings, history, and correction paths remain reachable.

## Technical Direction

### Recommendation

Do not incrementally reskin either archived native project. Build a new Expo/React Native parent companion with Expo Router and the React Native New Architecture, sharing TypeScript/Zod contracts, semantic tokens, fixtures, and analytics taxonomy with the Next.js product. Keep the current parent web portal as the browser fallback and the first live parent-flow proving ground. Keep all existing `/master.php`, `/ws/*.php`, and directory-prefixed adapters until installed legacy-client usage and real-device acceptance permit retirement.

Why this direction:

1. The parent client is a focused data, messaging, notification, and calendar product; two separate native implementations already drifted into hidden and empty features.
2. Expo Router provides typed file-based routes, native navigation, automatic deep linking, lazy route evaluation, and platform-specific components while keeping iOS and Android in one product codebase.
3. React Native's New Architecture is the default framework direction and supports higher-quality native interaction without the old asynchronous bridge.
4. Expo SecureStore maps small secrets/tokens to encrypted Android storage and iOS Keychain services; raw passwords do not belong in preferences or source.
5. One shared TypeScript contract package can compile fixtures against the same modern API while the legacy PHP adapters retain parser compatibility.

Official implementation references:

- Expo Router introduction: <https://docs.expo.dev/router/introduction/>
- Expo Router core concepts: <https://docs.expo.dev/router/basics/core-concepts/>
- Expo SecureStore: <https://docs.expo.dev/versions/v55.0.0/sdk/securestore/>
- React Native New Architecture: <https://reactnative.dev/architecture/landing-page>

### Proposed repository boundary

```text
apps/
  web/                 current Next.js product
  parent-native/       new Expo Router application
packages/
  parent-contracts/    Zod schemas, fixtures, route identities, error semantics
  design-tokens/       selected visual, type, spacing, motion, and accessibility tokens
  product-analytics/   privacy-safe event names and route taxonomy
```

This is the recommended target shape, not permission to move the current repository before the creative, build, and migration gates are approved.

## Native Product Requirements

1. HTTPS only; no tenant or API hostname assembled from untrusted payload text.
2. Token/session material in Keychain/SecureStore; never persist raw passwords.
3. Nursery/account discovery is server-owned and signed or replaced with organization-aware login.
4. Parent identity is separate from staff identity and limited to linked children.
5. Today, Daily care, Attendance, Calendar, Messages, Payments, and Activity are deep-linkable routes.
6. Push opens an allowlisted route and source object after authorization; notification text never becomes navigation code.
7. Latest successful data remains visible when one feed fails; each collection owns loading, stale, offline, retry, and empty state.
8. Message sends and absence requests use idempotency keys and durable queued/sent/failed states.
9. Daily care and payments remain read-only unless a named parent mutation capability exists.
10. Dynamic type, screen readers, reduced motion, high contrast, RTL, and 200% text are first-class acceptance fixtures.
11. No hidden feature button and no visible placeholder can pass release.
12. Native and web share object meaning, not necessarily identical layout or navigation chrome.

## Migration Sequence

### N0 - Freeze and observe

- Keep old iOS/Android contracts live.
- Run current parser, route-handler, and credentialed native E2E verifiers.
- Add privacy-safe legacy-client route/version observation only after governance approval.
- Never upload signing material or credential literals into the public repository.

### N1 - Shared contract package

- Promote parent payload schemas and fixtures from current helpers.
- Add server capability, scope, error, pagination, stale, and version fields without removing legacy output keys.
- Generate adapter tests for modern JSON and legacy PHP shapes from the same canonical fixture.

### N2 - Parent web pilot

- Redesign one complete parent vertical flow after creative selection.
- Prove partial loading, offline/stale behavior, message recovery, deep links, and responsive accessibility.
- Keep the remaining current parent portal available during the pilot.

### N3 - New native shell

- Create the Expo app only after repository/package structure and signing ownership are approved.
- Implement secure login, Today, Daily care, and Activity first.
- Add Messages, Calendar, Attendance, Payments, and report handoff as complete vertical flows.
- Test iOS and Android from the same fixture pack and against local/staging APIs.

### N4 - Legacy-client cutover

- Run real iOS and Android acceptance against root and directory-prefixed PHP routes.
- Validate active parent login, parser stability, all visible journeys, push, deep links, offline recovery, and accessibility.
- Release the new native clients without disabling legacy adapters.
- Retire an adapter only after installed-version evidence, stakeholder approval, a documented compatibility window, and parity closure.

## Executable Verification

```bash
pnpm exec tsx src/scripts/verify-redesign-native-parent-navigation.ts --require-legacy-source
pnpm exec tsx src/scripts/verify-redesign-route-compatibility.ts
pnpm exec tsx src/scripts/verify-parent-native-parser-fields.ts
pnpm exec eslint src/lib/redesign-native-parent-navigation.ts src/scripts/verify-redesign-native-parent-navigation.ts --max-warnings=0
pnpm exec tsc --noEmit --pretty false
```

The verifier checks 24 destination contracts, all current parent/API/PHP routes, staff-analytics separation, iOS visible/hidden/background source states, Android operational/placeholder source states, parent-web tabs and feeds, and local source fingerprints when the preserved folders are available.

## Local Build Readiness

The archived projects were inspected without modifying them:

- `xcodebuild -workspace ... -list` cannot run because the selected developer directory is Command Line Tools rather than a full Xcode installation.
- The Android wrapper targets Gradle 5.1.1, is not executable in the backup, and `bash gradlew tasks --all` cannot start because no Java runtime is installed.
- Android source targets API 28 and the old support libraries; a current toolchain upgrade is expected before any emulator acceptance.

These are environment and age findings, not reasons to rewrite contracts or claim a native pass. Install full Xcode and a compatible isolated Java/Android toolchain at the real-device gate; do not globally downgrade the redesign workstation or edit the preserved source merely to make old build scripts appear green.

## Open Gates

- Current iOS build and simulator/device acceptance.
- Current Android build and emulator/device acceptance.
- Production HTTPS/base-path plan for legacy installs.
- Signing, bundle/package ownership, certificates, stores, and release access.
- Production parent accounts and non-sensitive acceptance fixtures.
- Provider push delivery and deep-link acceptance.
- Exact production notification-nature order and names after import.
- Parent card sorting and first-click tests for the target domains.
- Creative territory selection and parent-specific application of the brand system.
- Final approval to create the new native workspace/package structure.

## Decision

The source comparison gate is closed. The old clients remain compatibility fixtures, not implementation foundations. Parent web is the complete behavioral baseline. A new shared Expo/React Native client is the recommended native target, while legacy PHP and directory-prefixed routes remain mandatory until real-device and installed-client cutover evidence proves they can change.
