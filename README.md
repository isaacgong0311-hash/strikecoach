# StrikeCoach

Daily options-strategy drills — read a payoff diagram, name the strategy, call the max
profit/loss and breakeven. Built for the [RevenueCat Shipaton 2026](https://www.shipaton.com/),
Next Gen (student) award track.

Full design rationale: [docs/specs/2026-08-29-strikecoach-design.md](docs/specs/2026-08-29-strikecoach-design.md).

## What's implemented

- Real options-payoff math (`src/lib/payoff.ts`) — long/short calls, puts, and stock legs
  composed into 12 standard strategies (long call/put, covered call, protective put, bull/bear
  spreads, straddles, strangles, iron condor, butterfly, collar), with exact max profit/loss and
  breakeven calculation (not sampled/approximated).
- A generated content bank of ~48 drill questions across 2 categories (`src/content/`), built
  from that payoff math so every question's answer is provably correct.
- Local progress tracking — streak, daily free-drill cap, per-category accuracy — persisted with
  AsyncStorage, no backend (`src/lib/progress.ts`).
- A drill session engine that avoids repeats and re-serves missed questions (`src/lib/drillEngine.ts`).
- 6 screens under Expo Router (`src/app/`): Home (folds in the one-time welcome card), Drill,
  Session Summary, Stats (Pro-gated), Settings.
- RevenueCat integration (`src/lib/revenuecat.tsx`) — entitlement-aware context provider, gating
  the daily cap, the Payoff Reading category, and Stats behind a "StrikeCoach Pro" subscription,
  presented via RevenueCat's built-in Paywall UI.
- 32 Jest unit tests covering the payoff math, streak/daily-reset logic, and drill selection —
  `npm test`. Full project typechecks clean — `npm run typecheck`.

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
