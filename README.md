# CIS Hackathon 2026 — FeedLens

**FeedLens** is our entry for the **CIS Hackathon**, released 19 November 2026.
Submissions close **25 November 2026, 23:59 AoE**.

The `feedlens-demo` branch contains the working app in [FeedLens](FeedLens/) and the hackathon [brief](BRIEF.md).

## Try the branch demo

Scroll past the phone to add up to 12 seconds of watch time, or set **Watch time** yourself to keep a chosen duration. Follow the points from one disliked Earth story through **Signals**, **Learning**, **Scoring** and **Ranking**. A full watch adds 4.2 points. The dislike subtracts 4, leaving Earth at +0.2. Each chapter uses the same ranking engine as the simulator.

Choose **Instagram** to compare the accounts in your own viewing history with the accounts whose posts you liked or saved. **Try example data** runs the same analysis with a fictional export. To use your own, request a JSON export from Instagram and choose its ZIP, all ZIP parts together, or the extracted activity files. The report runs entirely in the tab. It shows counts, dates and the most frequent named accounts for the activity Instagram included. The files do not contain the original ranking scores. [Instagram export instructions](https://help.instagram.com/181231772500920)

**Explore feed** opens the full workspace with that watch and dislike already in its history. The original feed, X-Ray, experiments and Time Machine also have direct links at `#feed`, `#behind`, `#lab` and `#history`.

Run the branch locally with the commands below, or download **FeedLens-preview** from a successful [branch check](https://github.com/luminaryshadows/cis-hackathon-2026/actions/workflows/feedlens.yml?query=branch%3Afeedlens-demo), unzip it and open `FeedLens.html`. The [original public prototype](https://yg-gms.github.io/feedlens-demo/) is the earlier build.

---

## The one-sentence pitch

FeedLens lets you train a recommendation model on real photo stories and trace how a watch, like, dislike or skip
changes your next recommendation.

---

## What this project is

A recommendation feed is the one algorithm most people interact with daily and the one they can
least easily inspect. You tap a heart and the feed changes, but nothing shows you the causal link
between the tap and the next post.

FeedLens makes that link visible, and computable.

- **Technology:** personalised short-video feeds.
- **Mechanism we are exposing:** a ranking engine that learns topic weights from your actions, then
  scores unseen posts to decide what comes next.
- **What the user changes:** watch seconds, reactions, skips, and seven sliders split between how
  the feed *learns* and how it *ranks*.
- **What they see change:** a topic weight profile, the upcoming queue, every candidate's score
  broken into its four components, and the exact event that produced those points.
- **The thing they had not thought to ask about:** *can watching a post long enough raise your
  interest in its topic even after you tap Dislike?* Every dislike costs 4 points and every second
  watched earns 0.35, so anything past **11.4 seconds outvotes the dislike** — and the timer
  runs for up to 12 seconds. The Experiment Lab is built around that question and computes the crossover live
  rather than asserting it.

---

## What the prototype does

Four connected sections, one shared session, all state in the browser.

### Your Feed
A dated edition of 16 real photo stories. Like a story, dislike it, start the reading timer, or skip.
Advancing before three seconds without a reaction is recorded as a quick skip. The topic profile,
the ranked queue and the candidate list all update from what you just did.

### Behind the Feed (Algorithm X-Ray)
Select any candidate and see its score split into **interest match**, **edition order**,
**exploration** and **diversity**. The panel names the single recorded event with the largest
contribution to that post's interest score — not a summary of your history, but the specific
action that put this post here.

### Algorithm Lab
Three predict-and-reveal experiments, each computed from the same engine the live feed uses, with
inputs isolated from your session so an experiment cannot corrupt the feed you are watching:

- **Watch versus dislike** — how many seconds of watch time does it take to outvote a dislike?
- **The Earth loop** — like every Earth story and watch the topic entrench itself, then see how
  much share it holds.
- **Escaping the loop** — raise exploration and diversity and see whether a different topic can
  reach the top three.

### Time Machine
Pick a past interaction, change it (remove it, flip the reaction, rewrite the watch seconds), and
replay the whole history twice with identical settings and the same already-seen posts. Compare
both timelines' interest weights, scores and ranks. Later actions stay exactly as recorded, so the
difference is attributable to the one edit.

---

## How the mechanism works, in the real numbers

Everything below is what `src/engine.ts` actually computes — this is the code we have to defend,
so the description matches it exactly. Fuller version in [docs/ALGORITHM.md](docs/ALGORITHM.md).

**What an action is worth**

| Action | Base signal |
|--------|------------:|
| Watch | +0.35 per second watched |
| Like | +4 |
| Dislike | −4 |
| Quick skip | −2 |

The post's main topic takes the full signal; a related topic, where the post has one, takes a
quarter of it. Watch signals scale with the *Watch time* slider, likes/dislikes/skips with
*Explicit feedback*, and everything with *Learning speed* — each divided by 50, so the base values
apply at the default of 50.

**How a post is scored**

```
interest match = (main topic weight + ¼ × related weight) × Personalization ÷ 100
edition order  = editorial starting weight                × Edition order      ÷ 100
exploration    = 2 ÷ (1 + times this topic appeared)       × Exploration     ÷ 100
diversity      = −4 × occurrences in the last three posts  × Content diversity ÷ 100
```

Highest total wins; the opening post is fixed so every user starts the same. The profile is a
weight vector, never a display value: the percentages shown in the constellation and bar views are
a softmax of the raw weights, rounded to tenths that sum to exactly 100.

**Why it actually computes.** Remove an interaction in Time Machine and the ranking changes because
the profile was replayed, not because a different screen was loaded. Same for every experiment
outcome and every score breakdown.

---

## What is honestly simplified

Judges and interviews will probe this, so it is written down rather than discovered.

- The simulator uses a dated edition of 16 sourced photo stories covering Earth, Cities, Space and Sport. Its scores come from the visitor’s simulated actions. The optional Instagram report uses only the activity files the visitor selects and never changes the simulator’s history.
- Weights accumulate and never decay, so a long history can outweigh recent actions. The original
  projection with a decay term is P2 on the roadmap.
- Session history and Time Machine branches live in browser memory; a reload clears them.
- The reading timer measures time spent with each photograph and passes it to the watch-time model.
- This is a small, inspectable model of a feedback loop. It is not a reproduction of any real
  platform's recommender, and the numbers describe this catalog only.

---

## Tech

React renders the four views of one browser session. Vite bundles the TypeScript app and local artwork. The ranking engine runs as pure functions, so the Node tests exercise the same calculations as the live interface. Playwright checks the built site in Chromium. See [component credits](docs/CREDITS.md).

## Running locally

From the root of this branch, with Node.js 24 and npm installed, run

```bash
cd FeedLens
npm ci
npm run dev
```

Open the URL Vite prints. To reproduce the automated checks and build the offline demo, run these in the same directory

```bash
npm test
npx playwright install chromium
npm run test:browser
npm audit --audit-level=low
npm run build:portable
```

The browser tests build and exercise both the production site in `FeedLens/dist/` and the standalone `FeedLens.html` at the repository root, including importing a ZIP offline.

---

## Repo layout

**This repository — submission and documentation**

```
BRIEF.md            challenge rules, scope traps, deadline in local time
TASKS.md            the working plan
docs/ALGORITHM.md   scoring, learning, attribution and the model's limits
docs/PROTOTYPE.md   what the shipped build contains, file by file
docs/ROADMAP.md     milestones, priorities and demo criteria
docs/CREDITS.md     every component we did not write, and why we chose it
index.html          placeholder page still served at the scaffold URL
```

**Application files inside [FeedLens/](FeedLens/)**

```
src/engine.ts       learning, weighting, scoring, ranking — no DOM, no React
src/catalog.ts      16 dated photo stories across four topics, with sources and photo credits
src/session.ts      the live feed state machine: reactions, ticks, round advance
src/history.ts      forking and replaying an edited history
src/experiments.ts  the three Lab scenarios
src/main.tsx        shell and section routing
src/{XRay,TimeMachine,Lab,LivePanels}.tsx   the four sections
tests/              engine, history and experiment tests
public/photos/      Local editorial photographs for the edition
```

---

## Hard rules we must not break

See [BRIEF.md](BRIEF.md) for the full rules.

1. **Public link, no sign-in, no download, no API key.** Keep the demo online until judging ends.
2. **Interactive.** The user changes an input and sees the project respond.
3. **Computed outputs.** Every recommendation and experiment outcome derives from user input.
4. **Our own mechanism.** The ranking engine is our code, in the browser, with no hosted service in
   the loop — there is no AI call anywhere in the mechanism being explained.
5. **Two minutes, no help.** A first-time user should understand the main idea within two minutes.
6. **Explain every line we wrote** and justify the third-party components we chose.

---

## Team

| Name | GitHub | Owns |
|------|--------|------|
| Aaden | [@luminaryshadows](https://github.com/luminaryshadows) | submission, deployment, documentation |
| Alastair | [@alastairchupy](https://github.com/alastairchupy) | demo — video, project page, two-minute walkthrough |
| Oscar | [@lojekoscar-web](https://github.com/lojekoscar-web) | implementation, tests, browser and keyboard support |
| Yigit | [@yg-gms](https://github.com/yg-gms) | engine, UI, algorithm spec |

First names only, handles for identity — this page is public, and handles are already public.
Full names belong on the submission form, not in a repo the whole internet can read.

---

## Licence

Our own code is MIT. Every third-party component is named in `docs/CREDITS.md` with the reason we
chose it over the alternatives — rule 7 asks us to defend those choices.
