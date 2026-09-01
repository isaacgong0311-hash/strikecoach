# StrikeCoach — path to submission

Deadline: **Sep 30, 2026, 11:59pm** (Shipaton submissions close). Today: ~Aug 30, 2026 — about
4.5 weeks out. Target: **Next Gen Award** (student track), stretch: Best Game Award doesn't apply
(this isn't a game — see the Veer postmortem in git history for why that pivot got scrapped), so
the real stretch targets are **RevenueCat Design Award** and **HAMM**.

## Status as of this plan (verified, not aspirational)

- Full app built: options payoff-math engine (12 strategies, exact not sampled), 48-question
  content bank, streak/progress tracking, RevenueCat entitlement gating, 6 screens.
- 32 Jest tests passing, clean `tsc --noEmit`.
- Design matches StrikeLab's actual brand (`globals.css` colors, `--font-mono` convention) and
  passed a `refined-ui` skill review (no pill badges, no AI-slop tells, consistent radii).
- Real 1024×1024 icon + 1179×2556 screenshot, generated from the app's actual color values.
- Public repo: [github.com/isaacgong0311-hash/strikecoach](https://github.com/isaacgong0311-hash/strikecoach)
- Web preview live: [strikecoach.vercel.app](https://strikecoach.vercel.app) — UI/gameplay only,
  RevenueCat purchases are iOS-only and inert on web by design.
- Verified interactively multiple times via rebuilt web preview: zero console errors.

**Everything above is Windows-doable and done.** Everything below needs a Mac (Xcode) or a
`.edu`-equivalent email, and is the actual remaining critical path.

## 🔴 Blocking unknown — needs your answer before Phase 1

Next Gen's real rule (from the rubric you pasted): *"student-only category... active students with
a .edu (or equivalent) email address."* I don't know if you have one to register with. If not,
this needs resolving before anything else — it decides whether Next Gen is even viable, or whether
StrikeCoach needs a full store release instead (a much bigger lift with ~4 weeks left).

## Phase 1 — Mac session (the critical path, budget ~2-3 hours)

Do this in one sitting if possible — StoreKit config is fiddly the first time, easier uninterrupted.

1. **Clone and build** (~15 min):
   ```bash
   git clone https://github.com/isaacgong0311-hash/strikecoach.git
   cd strikecoach && npm install
   npx expo prebuild --platform ios
   npx expo run:ios
   ```
   Confirm it launches in the simulator and the full drill loop works (same behavior already
   verified on web — this just confirms the native build isn't broken).

2. **RevenueCat account** (~15 min): free account at [app.revenuecat.com](https://app.revenuecat.com) →
   add an iOS app → create one auto-renewable subscription product → create an entitlement named
   exactly `pro` (this string is hardcoded in `src/lib/revenuecat.tsx` as `PRO_ENTITLEMENT_ID` —
   don't rename it, or match your rename there). Copy the public API key into `.env`:
   ```
   EXPO_PUBLIC_REVENUECAT_IOS_KEY=<your key>
   ```

3. **StoreKit Testing config** (~30-45 min, the fiddly part):
   - In Xcode: File → New → File → StoreKit Configuration File, add it to the `ios/` project.
   - Add one auto-renewable subscription matching the product ID from step 2.
   - Product → Scheme → Edit Scheme → Run → Options → set StoreKit Configuration to that file.
   - Rebuild, tap through to the paywall, complete a sandbox purchase, confirm the app unlocks
     (unlimited drills, Payoff Reading category, Stats screen) without a real network call.
   - This is the part that satisfies Next Gen's "no paid account" rule while still exercising a
     real purchase — don't skip it for a mocked/faked purchase, judges can tell.

4. **Restore purchases + edge cases** (~10 min): Settings → Restore purchases works; force-quit
   and relaunch keeps entitlement; cancel a purchase mid-flow doesn't crash.

## Phase 2 — Demo video (budget ~45 min, script below)

**Hard constraint: ≤2 minutes of essential footage.** Judges aren't required to watch past that.
Screen-record the simulator (Xcode → Simulator → File → Record Screen, or QuickTime).

| Time | Shot |
|---|---|
| 0:00–0:12 | Landing page: hero, then **scroll through the strategy library** — twelve sparklines with real computed max profit/loss. This is the strongest single shot in the app; don't rush past it |
| 0:12–0:18 | Tap "Start drilling" → Home dashboard (activity strip + today's drill meter visible) |
| 0:18–0:50 | Full drill session: payoff diagram → choose → feedback animates in. Answer all 5 |
| 0:50–1:02 | **Session summary** with the per-question recap (✓/✗ + correct answers) |
| 1:02–1:10 | Tap "Drill again" → out of free drills → RevenueCat Paywall appears |
| 1:10–1:30 | **Complete a real StoreKit sandbox purchase** — the shot that proves the RevenueCat integration actually works. Don't cut it short |
| 1:30–1:45 | Back on dashboard: PRO badge, "∞ unlimited" on the meter, Payoff Reading unlocked — answer one (shows the mono `$` choice styling) |
| 1:45–1:55 | Stats screen (Pro-gated): accuracy breakdown |
| 1:55–2:00 | Settings: "StrikeCoach Pro — active", close on that |

**Recording note — the paywall now fires on "Drill again", not mid-session.** Completing a
session always shows the summary first; the cap is enforced on the *next* attempt. So to reach
the paywall on camera: finish all 5 free drills, land on the summary, then tap "Drill again".
(Before, the paywall interrupted at the 5th answer and the summary was never reachable on the
free tier — fixed, but it means the older shot order no longer matches the app.)

No third-party music or trademarked content — voiceover or captions only, per the submission rules.

## Phase 3 — Devpost submission (budget ~30 min)

Required fields (Next Gen doesn't need the store-URL field, everything else still applies):
text description, demo video link (YouTube/Vimeo, public), 1024×1024 icon (done —
`assets/icon.png`), 1179×2556 screenshot (done — `assets/store/screenshot-1179x2556.png`), public
GitHub repo link (done), free trial or promo code for judges (N/A for Next Gen — StoreKit sandbox
purchase in the video substitutes for this).

**Description draft** (copy-paste, edit to taste):

> StrikeCoach is a daily drill app for options-trading intuition — think Duolingo, but for reading
> payoff diagrams instead of vocabulary. Each drill shows a live-rendered payoff diagram (SVG,
> generated from real options math — 12 strategies, exact max profit/loss/breakeven calculation,
> not sampled or hand-drawn) and asks you to identify the strategy, read off the breakeven, or
> call the max profit/loss. Free users get 5 drills a day; StrikeCoach Pro (RevenueCat-powered
> subscription) unlocks unlimited drills, a second question category, and an accuracy-tracking
> stats screen. Built solo in React Native/Expo, with the same payoff-math engine and options
> content as [StrikeLab](https://strikelab.dev), an existing options-education platform I built
> and run — StrikeCoach is the mobile, drill-focused sibling to that.

## Recommended timeline

Don't do this the week of Sep 30 — StoreKit config and video editing both eat more time than
expected on a first try. Suggested pacing:

- **This week:** resolve the `.edu` email question, do Phase 1 (Mac session).
- **Week of Sep 7-13:** Phase 2 (video) — do it right after Phase 1 while the flow is fresh.
- **Week of Sep 14-20:** Phase 3 (submit) — submitting 1-2 weeks early leaves room to fix anything
  Devpost's own validation flags (broken video link, wrong image dimensions, etc.).
- **Sep 21-30:** buffer, not a work window.
