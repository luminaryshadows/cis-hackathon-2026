# Tasks

The plan, in the order it actually has to happen. Nothing here is fixed until the idea is.

## 0. Decided — the idea is FeedLens

- [x] Mechanism chosen: how a short-video feed learns your interests and ranks what you see next.
- [x] The question a user would not have thought to ask, found and computable: *can watch time
      outweigh a dislike?* Past 11.4 seconds it does. See `docs/ALGORITHM.md`.
- [x] One-sentence pitch in `README.md`, and it fits in one sentence.

## 1. Scaffold — done

- [x] Public repo, GitHub Pages live from commit one, so the deploy path is proven on night one
      rather than discovered broken at 23:00 on the deadline.
- [x] Brief captured in `BRIEF.md`.
- [x] Placeholder `index.html` replaced with a landing page that links to the live build.

## 2. Build the mechanism — the part that must be ours

- [x] Pure computation module with no DOM and no dependencies: `src/engine.ts` imports nothing, so
      the tests run under plain Node with no install step.
- [x] Tests for the computation — 11 passing on a clean clone, zero installs.
- [x] UI wired to the computation. Every number on screen traces back to a function we wrote.
- [ ] Move the prototype source into this repository and deploy from here, so the live link does
      not depend on one teammate's account staying online.

## 3. The two-minute test — the part most entries lose on

- [ ] Hand the live link to someone who has never seen the project. Say nothing. Time them.
- [ ] Note where they hesitate. Where they hesitate is what needs fixing, not what needs explaining.
- [ ] Re-run with a second person. One person is noise, two is a signal.

## 4. Depth for people who stay

- [ ] The extra layer for users who want to explore past the main idea (rule 4 allows, judges reward).

## 5. Submission

- [ ] Live link stable and online
- [ ] Public repository, clean and readable
- [ ] Project page written
- [ ] Short demo video recorded
- [ ] `docs/CREDITS.md` — every component we did not write, and why we chose it
- [ ] Every team member can explain the mechanism out loud, unprompted

## Ownership

The idea is chosen and the mechanism is built, so ownership now follows the work that is left.

| Person | Owns | Decides |
|--------|------|---------|
| Alastair | Demo — demo video, project page, the two-minute walkthrough | what the demo shows and in what order |
| Oscar | Coding — implementation, tests, browser and keyboard support | how the code reaches the roadmap's P0 items |
| Yigit | The engine, the UI it already built, and `docs/ALGORITHM.md` | the model's behaviour and its limits |
| Aaden | Submission, deployment, documentation | what gets submitted |

Two people touching the same files in the last four days is how a working prototype breaks. Oscar
owns coding and Yigit owns the engine, so they need to agree on who edits what before either starts:
Yigit's `src/engine.ts` and `docs/ALGORITHM.md` are the model's behaviour, Oscar's work is the
implementation and validation around it. Whichever way it is split, say so in the group chat so
neither is surprised by a diff.

Work is judged on the three things that actually lose marks: does a stranger get it in two minutes
(Alastair's job to prove, with a real stranger, timed, saying nothing), is the work underneath
correct (Oscar's job to check, starting with the tests), and can every one of us explain the
mechanism out loud without notes (everyone's job, and it is not done until it has been tried).
