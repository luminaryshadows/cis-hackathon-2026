# The Prototype — what actually shipped

A map of the first deployed build, so anyone on the team (or a judge) can find the part that
computes a number they saw on screen. Source:
[yg-gms/feedlens-demo](https://github.com/yg-gms/feedlens-demo) · Live:
https://yg-gms.github.io/feedlens-demo/

The scoring formulas themselves are in [ALGORITHM.md](ALGORITHM.md). This document is about
structure: where the code lives and what each piece is responsible for.

---

## One session, four views

Every section reads the same single session object. There is no per-section state and no server —
which is why an action in **Your Feed** is visible in **Behind the Feed** and **Time Machine**
without anything being copied between them.

`src/main.tsx` holds the whole app state in one `useReducer(update, undefined, fresh)` call, with
`update` from `src/session.ts` as the only way to change it. Section switching is a URL hash
(`#feed`, `#behind`, `#lab`, `#history`), so a section is linkable and the browser's back button
works. An `IntersectionObserver` pauses the simulated player when the feed scrolls out of view —
the clock only runs while you can actually see the post, so watch seconds cannot accumulate
off-screen.

| Section | Hash | Component | What it computes |
|---------|------|-----------|------------------|
| Your Feed | `#feed` | `main.tsx` + `LivePanels.tsx` | Applies actions to the session and re-ranks the queue |
| Behind the Feed | `#behind` | `XRay.tsx` | Splits one candidate's score into four parts and attributes the interest term to a specific event |
| Algorithm Lab | `#lab` | `Lab.tsx` | Runs three sandboxed experiments on the same engine |
| Time Machine | `#history` | `TimeMachine.tsx` | Forks one past event, replays both histories, diffs the results |

---

## What each file is for

### The engine — no DOM, no React, no dependencies

| File | Responsibility |
|------|----------------|
| `src/engine.ts` | Learning (`learn`, `eventWeight`), history replay (`replay`), display shares (`shares`), scoring and ordering (`rank`), event attribution (`eventContribution`), and the slider defaults. Roughly 90 lines of logic. |
| `src/catalog.ts` | The fixed catalog: 32 posts across 8 topics, each with a duration, a discovery value, and an optional related topic. `postById` is a lookup map built once. |
| `src/session.ts` | The state machine. `fresh()` builds a new session; `update()` is a reducer over actions (`like`, `dislike`, `next`, `play`, `pause`, `tick`, `setting`, `remove`, `round`, `reset`). Owns the rules that make the numbers meaningful: a quick skip only counts before 3 seconds, a repeated reaction removes rather than doubles, a new round keeps the learned profile. |
| `src/history.ts` | `forkHistory()` produces an edited copy of the event list; `readHistory()` replays a given list into a profile and a ranking. Used by Time Machine so both timelines run the identical code path. |
| `src/experiments.ts` | The three Lab scenarios as pure functions returning before/after rankings, so an experiment's answer is computed the same way the live feed's is. |

The important structural claim: **the engine imports nothing.** `session.ts` and `experiments.ts`
call it; the components call those. So `npm test` runs the actual scoring logic under plain Node
with no browser, and an interview answer about the scoring never needs to involve React.

### The interface

| File | Responsibility |
|------|----------------|
| `src/main.tsx` | Shell: session reducer, hash routing, section nav, "How it works" dialog, reset. |
| `src/LivePanels.tsx` | Interest weights and shares, shown as ranked bars or a constellation. |
| `src/RankingReplay.tsx` | The three posts in Up next, with scores before and after the last change and links to each score breakdown. |
| `src/XRay.tsx` | Candidate list, score-component bars, and the event-attribution panel. |
| `src/Lab.tsx` | Slider controls plus the three predict-and-reveal experiments. |
| `src/TimeMachine.tsx` | Event timeline, edit controls, and the original-versus-alternate comparison. |
| `src/Icon.tsx`, `src/art.ts` | Icon set and the mapping from post id to its cover illustration. |
| `src/*.css` | One stylesheet per section plus a shared base; no CSS framework. |

### Assets and build

| Path | Purpose |
|------|---------|
| `public/art/*.webp` | 32 illustrated post covers, one per catalog entry. |
| `scripts/portable.mjs` | Inlines the build into a single standalone `FeedLens.html`, so the demo can run from a file with no server. |
| `.github/workflows/pages.yml` | Builds with Vite and publishes to GitHub Pages on every push to `main`. |

---

## What is tested

`npm test` runs `node --test` over three suites — no test framework, no fixtures, no mocks. The
engine suite covers six properties, each chosen because getting them wrong would produce a
plausible-looking feed that is quietly incorrect:

1. Starting shares are balanced, learning is signed, and shares stay finite across long sessions.
2. Each of the three learning sliders independently reweights already-recorded events, and replay
   is deterministic.
3. The ranking components actually explain the observed order, and each ranking slider moves only
   its own term.
4. Watch segments aggregate correctly, pausing stops learning, explicit reactions replace or undo
   each other, and a skip is counted once.
5. Removing individual events replays the remainder, and tuning settings leaves the current post in
   place.
6. All 32 posts appear exactly once per round, and a new round preserves learning while resetting
   reaction state.

The history and experiment suites cover branch isolation and the three Lab outcomes. Test 3 is the
one to be able to describe unprompted: it is what makes "this post is here because of that number"
a checkable claim rather than a design opinion.

---

## Simplifications, stated plainly

Carried over from [ALGORITHM.md](ALGORITHM.md) because they will be asked about:

- The catalog, topics, durations and discovery values are authored by hand. No real platform data.
- Weights accumulate without decay, so long histories can outweigh recent actions.
- Session history and Time Machine branches are in memory only; a reload starts fresh.
- The "player" is a timer, not video decoding. Watch time is the signal being modelled.
- The model is a small inspectable feedback loop, not a reproduction of any real recommender.

Anything added from here should either deepen the mechanism (decay, a second ranking strategy) or
sharpen the two-minute explanation. Anything that only adds polish without doing either is P2 at
best — see [ROADMAP.md](ROADMAP.md).
