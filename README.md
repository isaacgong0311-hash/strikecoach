# StrikeCoach

Daily options-strategy drills — read a payoff diagram, name the strategy, call the max
profit/loss and breakeven. Built for the [RevenueCat Shipaton 2026](https://www.shipaton.com/),
Next Gen (student) award track.

**▶ Try it now: [strikecoach.vercel.app](https://strikecoach.vercel.app)** — the full app running
in the browser, no install. (Purchases are iOS-only, so the paywall is inert there; everything
else is live.)

Full design rationale: [docs/specs/2026-08-29-strikecoach-design.md](docs/specs/2026-08-29-strikecoach-design.md).
Step-by-step path to actually submitting: [docs/SUBMISSION-PLAN.md](docs/SUBMISSION-PLAN.md) —
start there.

## What's implemented

**The engine.** Real options-payoff math (`src/lib/payoff.ts`) — long/short calls, puts, and
stock legs composed into 12 standard strategies (long call/put, covered call, protective put,
bull/bear spreads, straddles, strangles, iron condor, butterfly, collar). Max profit, max loss and
breakevens are computed *analytically* from the legs, not sampled off a plot: an unbounded tail is
reported as "Unlimited" rather than as whatever number the chart happened to stop at. Every drill
question is generated from that engine (`src/content/`), so no answer is hand-entered and none can
silently drift out of sync with its diagram.

**The app** — 6 screens under Expo Router (`src/app/`):

- **Landing** (`components/WelcomeScreen.tsx`) — hero, a live sample drill, and the full strategy
  library: twelve rows, each with a real payoff sparkline and its computed max profit / max loss /
  breakevens, rendered from the engine at runtime.
- **Dashboard** — stat strip, a 7-day activity strip, and today's drill-budget meter.
- **Drill** — SVG payoff diagram, multiple choice, animated correct/incorrect reveal.
- **Session summary** — score plus a per-question recap with the correct answers.
- **Stats** (Pro) — overall accuracy, lifetime drills, and per-category accuracy bars.
- **Settings** — subscription status and restore purchases.

**Monetization.** RevenueCat integration (`src/lib/revenuecat.tsx`) — an entitlement-aware context
provider gating the daily drill cap, the Payoff Reading category, and the Stats screen behind a
"StrikeCoach Pro" subscription, presented via RevenueCat's built-in Paywall UI. The paywall fires
on "Drill again" after a completed session, so the ask lands on a finished result rather than
interrupting one.

**Testing.** 82 Jest tests — the payoff math for all 12 strategies (hand-computed expected values),
content-bank integrity, streak and daily-reset rules, activity history, persisted-schema migration,
and the session-log encode/decode round trip. `npm test`. Typechecks clean: `npm run typecheck`.

## What's left (Mac-required — this was built from a Windows machine)

Everything below needs Xcode, so it couldn't be done or verified from here:

1. **Generate the native iOS project and run it:**
   ```bash
   npx expo prebuild --platform ios
   npx expo run:ios
   ```
2. **Create a free RevenueCat account** at [app.revenuecat.com](https://app.revenuecat.com), add
   an iOS app, and create one subscription product and an entitlement named exactly `pro` (this
   id is hardcoded in `src/lib/revenuecat.tsx` as `PRO_ENTITLEMENT_ID`). Copy the public API key
   into a `.env` file (see `.env.example`) as `EXPO_PUBLIC_REVENUECAT_IOS_KEY`.
3. **Set up local StoreKit Testing** (no paid Apple Developer account needed — this satisfies
   Next Gen's no-paid-account requirement while exercising a real purchase flow):
   - In Xcode, add a new file → StoreKit Configuration File to the generated `ios/` project.
   - Add one auto-renewable subscription product matching the product ID you configured in
     RevenueCat (e.g. `strikecoach_pro_monthly`).
   - In the Xcode scheme editor (Product → Scheme → Edit Scheme → Run → Options), set the
     StoreKit Configuration to the file you just created.
   - Run the app in the simulator — purchases now resolve locally against that config file, no
     network call to Apple, no developer account required.
4. **Record the 2-minute demo video** (screen-record the simulator): show the drill loop, hitting
   the free daily cap, the paywall, completing a purchase against the StoreKit sandbox, and the
   unlocked Payoff Reading category + Stats screen.
5. **1024×1024 app icon** and a **1179×2556 screenshot** (no device frame) for the Devpost
   submission — not yet created.
6. ~~Push this repo to a public GitHub repo~~ — done: [github.com/isaacgong0311-hash/strikecoach](https://github.com/isaacgong0311-hash/strikecoach).

## Web preview

There's also a web build (`react-native-web`) deployed for quick browsing without a simulator —
useful for judges/reviewers who just want to click through the UI. **It's a visual preview only:
RevenueCat purchases are iOS-only and are disabled on web**, so the paywall trigger is a no-op
there. The real purchase flow only exists in the iOS build (see below).

## Local development (works on any machine)

```bash
npm install
npm test          # 32 unit tests, no simulator required
npm run typecheck
```

## Scope

See the [design spec](docs/specs/2026-08-29-strikecoach-design.md) for what's in/out of scope
for v1 and why (tightened for a ~4.5-week solo build window).
