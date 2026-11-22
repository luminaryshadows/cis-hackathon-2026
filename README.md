# CIS Hackathon 2026 — Team Entry

**FeedLens** is an interactive web project for the **CIS Hackathon**, released 19 November 2026.
Submissions close **25 November 2026, 23:59 AoE**.

> **Status: working prototype in a separate checkout.** The FeedLens prototype contains four connected sections and a browser-based recommendation engine. This repository currently contains the submission scaffold.

---

## The one-sentence pitch

FeedLens lets you train a simulated short-video feed and trace how a watch, like, dislike, or skip changes your next recommendation.

---

## What this project is

Recommendation feeds make it easy to react to a post and hard to see what the system learns from that reaction. FeedLens makes the feedback loop visible so a first-time user can explain, within two minutes, how their actions affect what they see next.

- **Technology:** Personalized short-video feeds.
- **Mechanism we are exposing:** A ranking engine that learns topic weights from your actions and scores unseen posts.
- **What the user changes:** Watch time, reactions, skips, and sliders that control learning and ranking.
- **What they see change:** An interactive interest constellation or bar chart, the upcoming queue, and each post's score breakdown.
- **The thing they had not thought to ask about:** Can watching a post long enough raise interest in its topic even after you tap Dislike?

**Implemented in the separate FeedLens prototype**

- **Interactive Feed (Your Feed)** — Watch, like, dislike, or skip simulated posts and see the interest profile and upcoming queue update.
- **Algorithm X-Ray (Behind the Feed)** — Inspect a candidate's score, see its strongest contributing action, and adjust ranking weights.
- **Time Machine** — Change or remove a past interaction in a saved branch and compare interest weights and upcoming rankings with the original.
- **Experiment Lab (Algorithm Lab)** — Predict and test whether watch time can outweigh a dislike, how gaming likes create a feedback loop, and how exploration or diversity can change the top pick.

The opening prompt and **How it works** dialog give users a short guided start. A step-by-step onboarding walkthrough, animated history replay, and side-by-side algorithm comparisons are planned. See the [roadmap](docs/ROADMAP.md) and [algorithm guide](docs/ALGORITHM.md).

---

## Live link

Judges open this **before anything else**, so the public demo must explain itself without help from the team.

```
https://luminaryshadows.github.io/cis-hackathon-2026/
```

This is the Pages URL from the hackathon scaffold. This checkout still contains the placeholder page. Publishing a public FeedLens build is tracked in the [roadmap](docs/ROADMAP.md).

---

## Running locally

To preview this checkout's placeholder page, run:

```bash
python3 -m http.server 8000
```

Open http://localhost:8000. This checkout uses GitHub Pages on `main`.

To run the FeedLens prototype, use Node.js 22.12 or later and npm. From the separate prototype checkout containing `package.json`, run:

```bash
npm ci
npm run dev
# Open the URL printed by Vite, typically http://localhost:5173
```

Like the opening post and inspect **Up next**, then select a recommendation to open its score breakdown. Use **Reset session** to start again with a neutral profile and default settings.

Run `npm test` for the model tests and `npm run build` to produce the static site in `dist/`. Run `npm run build:portable` to write a standalone `FeedLens.html` one directory above the source.

---

## Repo layout

```
index.html          placeholder page for GitHub Pages
BRIEF.md            challenge rules and submission deadline
TASKS.md            original team checklist
src/README.md       notes on the planned source layout
docs/CREDITS.md     third-party credits template
docs/ROADMAP.md     milestone checklist and demo criteria
docs/ALGORITHM.md   scoring, learning, and simulation limits
```

The separate prototype checkout contains the engine and UI in `src/`, the artwork in `public/art/`, and automated tests in `tests/`.

---

## Hard rules we must not break

See the [challenge brief](BRIEF.md) for the full rules.

1. **Public link, no sign-in, no download, no API key.** Keep the demo online until judging ends.
2. **Interactive.** The user changes an input and sees the project respond.
3. **Computed outputs.** The recommendations and experiment outcomes come from the user's inputs.
4. **Our own mechanism.** The recommendation engine runs in our own code in the browser.
5. **Two minutes, no help.** A first-time user should understand the main idea within two minutes.
6. **Explain every line we wrote** and justify the third-party components we chose.

---

## Team

| Name | GitHub | Owns |
|------|--------|------|
| Aaden | [@luminaryshadows](https://github.com/luminaryshadows) | TBD |
| Alastair | [@alastairchupy](https://github.com/alastairchupy) | TBD |
| Oscar | [@lojekoscar-web](https://github.com/lojekoscar-web) | TBD |
| Yigit | [@yg-gms](https://github.com/yg-gms) | TBD |

First names only, handles for identity — this page is public, and handles are already public.
Full names belong on the submission form, not in a repo the whole internet can read.

Everyone above has write access to this repo — accept the invitation in your GitHub
notifications if you have not already. Ownership gets filled in once the mechanism is chosen.

---

## Licence

Our own code is MIT. Every third-party component gets named in `docs/CREDITS.md` with
the reason we chose it over the alternatives — rule 7 asks us to defend those choices.
