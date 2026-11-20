# CIS Hackathon 2026 — Team Entry

Interactive web project for the **CIS Hackathon**, released 19 November 2026.
Submissions close **25 November 2026, 23:59 AoE**.

> **Status: scaffold.** The technology and mechanism have not been chosen yet.
> This repo exists so the team has one place for the brief, the plan and the code.
> Replace this banner once the idea is locked in — see `TASKS.md`.

---

## The one-sentence pitch

_Pick a technology people use every day without knowing how it works. Pick the one mechanism
inside it that does the work. Build it, make it interactive, and let a first-time user
understand it in under two minutes without any help._

<!-- Replace with our chosen technology + mechanism. Keep it to one sentence. -->

---

## What this project is

_(fill in once the idea is chosen)_

- **Technology:** TBD
- **Mechanism we are exposing:** TBD
- **What the user changes:** TBD
- **What they see change:** TBD
- **The thing they had not thought to ask about:** TBD

---

## Live link

Judges open this **before anything else**, with nobody from the team present.
Everything needed to understand the project must live in the page itself.

```
https://luminaryshadows.github.io/cis-hackathon-2026/
```

_Live from the first commit, so the deploy pipeline is proven early rather than at 23:00 on the last night._

---

## Running locally

No build step. No dependencies. Open the file, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

Deployment is GitHub Pages on `main` — push to `main` and the live link updates.

---

## Repo layout

```
index.html      the thing judges open. everything user-facing starts here
BRIEF.md        the challenge rules, kept in-repo so we stop re-reading email
TASKS.md        who is doing what, and what "done" means
src/            the mechanism itself — the computation we are explaining
docs/           notes, research, the "why we chose it" reasoning
```

---

## Hard rules we must not break

Summarised from `BRIEF.md`, but read that file in full:

1. **Public link, no sign-in, no download, no API key.** Must stay online until judging ends.
2. **Interactive.** The user changes something and the project responds. No videos, no slideshows,
   no walls of text standing in for the project.
3. **Outputs are computed, not replayed.** Simulations are fine if they actually compute.
   Pre-recorded animations and canned results are not.
4. **The mechanism runs in our own code.** Hosted AI is allowed elsewhere in the project,
   but never for the part we are explaining.
5. **Two minutes, no help.** A first-time user must get the idea within two minutes.
   Depth can go as far as we like after that.
6. **We must be able to explain every line we wrote**, and justify every component we did not.

---

## Team

| Name | GitHub | Owns |
|------|--------|------|
| Aaden Yick | [@luminaryshadows](https://github.com/luminaryshadows) | TBD |
| Alastair | [@alastairchupy](https://github.com/alastairchupy) | TBD |
| Oscar | _handle pending_ | TBD |
| Yigit Gumus | [@yg-gms](https://github.com/yg-gms) | TBD |

Everyone above has write access to this repo — accept the invitation in your GitHub
notifications if you have not already. Ownership gets filled in once the mechanism is chosen.

---

## Licence

Our own code is MIT. Every third-party component gets named in `docs/CREDITS.md` with
the reason we chose it over the alternatives — rule 7 asks us to defend those choices.
