# Tasks

The plan, in the order it actually has to happen. Nothing here is fixed until the idea is.

## 0. Not started — decide the idea (blocks everything)

- [ ] Shortlist 5 mechanisms that are genuinely worth explaining. For each, write down the
      *thing a user would not have thought to ask*, because that is the whole project.
- [ ] Score each against: can we compute it honestly in JS? can a stranger get it in 2 minutes?
      is there real depth to add underneath? is it distinguishable from the given examples?
- [ ] Kill anything on the banned/too-broad list in `BRIEF.md` before spending a day on it.
- [ ] Write the one-sentence pitch into `README.md`. If it needs two sentences, the scope is wrong.

## 1. Scaffold — done

- [x] Public repo, GitHub Pages live from commit one, so the deploy path is proven on night one
      rather than discovered broken at 23:00 on the deadline.
- [x] Brief captured in `BRIEF.md`.
- [ ] Replace the placeholder `index.html`.

## 2. Build the mechanism — the part that must be ours

- [ ] Pure computation module in `src/` with no DOM and no dependencies to start with, so it can
      be tested in isolation and explained line by line in an interview.
- [ ] Tests for the computation. Correctness is explicitly judged, and "it looked right" is not
      a defence.
- [ ] UI wired to the computation. Every number on screen traces back to a function we wrote.

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

Unassigned until the idea is picked — ownership follows the mechanism, not the person.
