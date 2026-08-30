# StrikeCoach — Design Spec

Date: 2026-08-29
Status: Approved
Context: Built for the RevenueCat Shipaton 2026 hackathon, Next Gen (student) award track.

## Problem / Goal

Ship a genuinely finished, well-designed mobile app between now (2026-08-29) and the Sep 30, 2026
Shipaton deadline (~4.5 weeks) that:

- Is a brand-new app, never previously released.
- Integrates the RevenueCat SDK to power a real in-app purchase.
- Is submittable to the Next Gen track: a demo video + public source code, no paid Apple/Google
  developer account required.
- Reinforces the same quant/options domain the rest of the builder's project portfolio
  (options-pricer, OptionRun, StrikeLab) is built around.

## Concept

**StrikeCoach**: a Duolingo-style daily drill app for options trading intuition. The user is shown
a payoff diagram (rendered live as SVG, not a static image) and answers a multiple-choice question
about it — identify the strategy, read off max profit/loss/breakeven, or judge which direction a
Greek moves. Instant feedback with a one-line explanation. Daily streak. A free tier caps daily
drills; a Pro subscription unlocks unlimited drills, a second question category, and a stats screen.

## Scope (v1, ~45-55 hours over 4.5 weeks)

**In scope:**
- 2 question categories: Strategy ID (name the strategy from its payoff shape) and Payoff Reading
  (max profit / max loss / breakeven from a diagram).
- ~40-50 hand-authored questions, bundled locally (TS/JSON) — no backend.
- Local progress: daily drill count, streak, per-category accuracy — via AsyncStorage.
- One RevenueCat subscription product, "StrikeCoach Pro" (~$4.99/mo), gating: drills beyond the
  daily free cap (5/day), the Payoff Reading category, and the stats screen.
- RevenueCat's prebuilt Paywall UI component (not custom-built).
- 7 screens: Home, Drill, Session Summary, Paywall, Stats (Pro-gated), Settings, single Welcome
  screen (no multi-step onboarding).
- iOS only, tested via Xcode's local StoreKit Testing config (no Apple Developer Program
  enrollment — satisfies Next Gen's no-paid-account rule while exercising the real purchase path).

**Explicitly out of scope for v1:**
- Push notifications.
- Backend or auth of any kind.
- More than 2 question categories.
- Android build.
- Custom animation beyond React Native / RevenueCat defaults.
- Multi-leg / advanced strategies (straddle, strangle, iron condor are in-scope as *answers*
  within Strategy ID; building an interactive multi-leg constructor is not).

## Architecture

- **Framework:** Expo (React Native) with a custom dev client (`expo prebuild` +
  `npx expo run:ios`), since `react-native-purchases` (RevenueCat's SDK) requires native code and
  won't load under plain Expo Go.
- **Navigation:** `expo-router` (file-based), single stack — no tabs needed for this screen count.
- **State/persistence:** local `AsyncStorage` for progress (streak, daily count + last-reset date,
  per-question-category stats). No backend, no remote sync.
- **Content:** a single typed question bank module (`src/content/questions.ts`) — each question has
  a category, a payoff-diagram spec (array of piecewise-linear (price, P&L) points), the correct
  answer, distractors, and a one-line explanation.
- **Diagrams:** rendered with `react-native-svg` directly from the piecewise-linear point data —
  no chart library, no bundled images. Keeps the diagrams crisp, themeable, and consistent with a
  deliberate visual design (relevant to the RevenueCat Design Award).
- **Monetization:** `react-native-purchases` + `react-native-purchases-ui` (RevenueCat's Paywall
  component). Entitlement check (`Pro` entitlement) gates the daily-limit overflow, the second
  category, and the Stats screen.
- **Purchase testing:** Xcode `.storekit` local configuration file (one subscription product) +
  RevenueCat's "Preview" test mode — purchases resolve locally in the simulator, no App Store
  Connect account, no network dependency on Apple's servers.

## Data flow

1. App launch → load question bank (bundled) + read local progress from AsyncStorage.
2. Home screen shows streak, drills remaining today, category unlock state (from entitlement
   cache).
3. User taps "Start Drill" → drill engine picks the next question (weighted to avoid repeats
   within a session, filtered to unlocked categories) → renders payoff diagram + MC choices.
4. User answers → immediate correct/incorrect feedback + explanation → progress updated
   (attempt count, streak logic, category accuracy) → daily count decremented.
5. When daily free count hits 0 (free users) or a locked category/Stats screen is tapped →
   RevenueCat Paywall presented.
6. Purchase completes → entitlement refreshes → gates lift immediately, no restart needed.

## Error handling

- Purchase failure/cancellation: RevenueCat SDK error callback → non-blocking toast, user returns
  to previous screen, no crash, no partial-unlock state.
- Offline: drills work fully offline (local content + local storage); only the paywall/purchase
  flow needs connectivity — show a clear "connect to purchase" state if the purchase call fails
  for network reasons.
- Daily reset: computed from a stored `lastResetDate` compared against local device date at app
  foreground — handles the user opening the app across a day boundary without a background job.
- Empty/edge states: no more unseen questions in a category → engine falls back to spaced
  repetition over previously-missed questions rather than a dead end.

## Testing

- Jest unit tests for the drill engine: question selection/weighting, streak increment/reset
  logic, daily-count reset-at-midnight logic, accuracy calculation. Runs on any machine (Windows
  or Mac), no simulator required.
- Manual QA checklist (Mac-side, run in Xcode simulator with the `.storekit` config): full
  purchase flow, cancel flow, restore-purchases flow, entitlement gating before/after purchase.
- No end-to-end device farm / automated UI testing — out of scope for a hackathon timeline.

## Open items handed to the builder (Mac-side, cannot be done from this Windows session)

- Running `npx expo run:ios` and the Xcode build itself.
- Creating the `.storekit` configuration file's product entry inside Xcode (Claude can generate
  the file contents, but adding/wiring it to the Xcode scheme is a GUI step).
- Recording the 2-minute demo video and writing the Devpost submission text.
- Creating a free RevenueCat account and pasting the project's public API key into the app's
  config.
