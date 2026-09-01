# StrikeCoach — comprehensive work plan

Reviewed through three lenses (strategy, engineering, design) against the actual code, not
aspirationally. Every finding below was checked against the repo directly — nothing here is
guessed. Present for approval before any of it gets executed.

## Strategy & scope

**Premise check.** Is Next Gen + a mobile options-drill app still the right bet? Yes — this was
already stress-tested against your actual GitHub history (30 repos, zero games, strong quant/AI-
tool pattern) after the Veer detour, and StrikeCoach is the one that actually matches what you
build. Not re-litigating that call, just confirming it holds under a second look.

**The one real strategic risk: the purchase flow is unverified.** Every other piece of this app
has been tested — 32 unit tests, live in a browser, refined-ui reviewed. The RevenueCat
entitlement flow (paywall → purchase → unlock) has never actually run, because that requires
Xcode and a Mac. This is the single highest-risk unknown in the whole plan, and it's also the
*judging-critical* path — a Next Gen submission whose demo video can't show a real purchase
working is a materially weaker submission. **Recommendation: do Phase 1 of the submission plan
first, before any further polish work** — confirming the purchase flow works is higher priority
than any of the engineering/design items below.

**Competitive differentiation, for the Devpost description:** most Next Gen entries will be
generic subscription-gated apps. StrikeCoach's story is specific — the payoff math is real
(exact analytical max profit/loss/breakeven, not sampled), and it's the mobile sibling to an
already-live product (StrikeLab) you built and run, not a hackathon-only toy. That's a genuine
differentiator worth leading with in the video, not just the description.

**Not recommending:** chasing HAMM, Catvertising, or Grand Prize. Already ruled out earlier in
this build for good reasons (no real revenue/traction possible in the time left, no ads
integration) — restating here only to confirm the scope hasn't drifted.

## Engineering

**Finding 1 — content correctness has no regression guard (real gap, worth fixing).**
5 of 12 strategies (long call, long put, covered call, long straddle, iron condor) have direct
unit tests on their payoff math. The other 7 — protective put, bull call spread, bear put spread,
short straddle, long strangle, butterfly spread, collar — are only exercised indirectly through
content generation, which doesn't fail loudly if the math is subtly wrong. I ran a live check
just now: all 48 generated questions currently have exactly 4 unique choices and a valid
`correctIndex` — nothing is broken today. But there's no test *preventing* that from regressing,
and this is an education app — a wrong answer in the content bank is a credibility problem, not
just a bug. **Recommendation:** add a content-integrity test (every question has 4 unique
choices, valid index) as a permanent regression guard, and add direct math tests for the 7
untested strategies, mirroring the existing pattern in `__tests__/payoff.test.ts`. Small,
mechanical, high-value — this is the one item I'd actually prioritize doing now, before Phase 1.

**Finding 2 — AsyncStorage read failures aren't defensively handled.** `loadProgress()` wraps
`JSON.parse` in a try/catch but not the `AsyncStorage.getItem` call itself — rare on iOS, but if
it throws (corrupted storage, some Android edge cases), the app would crash on launch instead of
falling back to fresh progress. Cheap fix, low priority — flagging so it's a decision, not an
oversight.

**Everything else checked and clean:** RevenueCat SDK misconfiguration is already handled
gracefully (console.warn, no crash, gated behind `isConfigured`); no race conditions in the drill
answer flow (`isAnswered` gates double-taps); strict TypeScript, clean `tsc --noEmit`; no PII
collected, no security surface beyond the RevenueCat SDK itself.

## Design

**Finding — the Design Award rubric explicitly calls out animations, and the app currently has
none.** Every screen transition and every correct/incorrect feedback state is an instant color
swap, no motion at all. That's a safe, non-slop baseline (per the refined-ui pass), but "beautiful
app design and animations" is *literally named* in the award criteria, and right now there's
nothing to show on that dimension. **Recommendation:** one targeted addition — a brief
scale/opacity transition on the correct/incorrect feedback state in `drill.tsx` (150-250ms,
ease-out, matching refined-ui's motion guidance exactly). Not a redesign, one focused animation
where it has the most judging leverage.

**Finding — no accessibility labels anywhere.** No `accessibilityLabel`/`accessibilityRole` on
any interactive element. Not blocking, but cheap to add and reads as craft. Lower priority than
the two engineering items above.

**Explicitly not recommending:** dark mode support. Real work (doubling every color token,
retesting both), and Design Award judges see the video, not a live toggle — the return on that
effort is low against a 4-week budget. Flagging as a deliberate cut, not a silent gap.

## What I'm NOT proposing to touch

No architecture changes, no new features, no scope expansion. Everything above is either a test
(safety net, doesn't change behavior) or one small, scoped addition (one animation, some
accessibility labels). Nothing here delays Phase 1 of the submission plan by more than an hour or
two if approved.
