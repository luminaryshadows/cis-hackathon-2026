# The Brief

Verbatim record of the CIS Hackathon mission, so the team is not re-reading a forwarded
email in a hurry. Source: challenge release email, 19 November 2026.

---

## Mission

Choose a technology that people use every day without knowing how it works, and identify the
mechanism that does the work inside it. Build a working, interactive version of that mechanism
that runs in a web browser. Someone using it for the first time should be able to change the
inputs, see the outputs change, and understand one thing about the technology that they had not
thought to ask about.

Keep the project to one idea, and take that idea as far as you can.

## Constraint

A first-time user, with no help from your team, must understand your idea within two minutes of
opening your project.

## Full rules

1. Judges open your live link before they look at anything else you have submitted, and nobody
   from your team is present. Anything a user needs to know has to be in the project itself.

2. The project must be interactive: the user changes something and the project responds.
   Videos, slideshows and pages of text are not accepted as the project.

3. It must run in a current web browser at a public link, with no sign-in, download or API key,
   and stay online until judging ends.

4. The two-minute limit applies to the main idea. You can add as much further depth as you like
   for users who want to explore.

5. Outputs must be computed by your code from the user's inputs. Simulations are fine if they
   actually compute; pre-recorded animations and prepared results are not.

6. The mechanism must run in your own code. You may use hosted AI services elsewhere in the
   project, but not for the part you are explaining.

7. Work starts when the challenge is released on 19 November. Open-source components and AI
   tools are allowed under the Terms. Your team must be able to explain all of your own code,
   and why you chose any component you did not write.

8. Submissions close on 25 November at 23:59 Anywhere on Earth (AoE). The Round 1 form lists
   what to submit: the live link, a public repository, a project page and a short demo video.

9. The fairness page sets out how AI use, authorship and each round are assessed.

## Examples given

Each is deliberately simple — smaller than a strong entry, which should go considerably further,
especially in depth. We may build on one, but a project that stops where its example stops will
not score well.

- **Noise-cancelling headphones.** A simulated microphone picks up the drone of a jet engine, and
  the project generates an inverted wave to cancel it. Delaying that wave by a fraction of a
  millisecond lets the higher frequencies back through first.
- **Predictive text.** The project counts which words follow which in a few sentences the user
  types, then suggests the next word. Selecting a suggestion shows the counts behind it.
- **Photo compression.** The user uploads a photo and reduces the number of 8x8 frequency patterns
  used to rebuild it, while the file size updates.
- **Route finding.** Closing a road on a map makes the route recalculate, and every road the
  algorithm examined is highlighted.
- **Reference project (not competing):** *The throat in your phone* —
  https://cishackathon.github.io/exemplar/ · https://github.com/cishackathon/exemplar
  You record yourself and hear your voice the way a 1980s phone would have sent it, rebuilt at the
  other end from a throat shape, a pitch and a loudness 50 times a second, then hear why hold music
  falls apart on the same phone. Its README explains where it falls short of a winning entry.
  You do not need to reach this level to do well, especially in the junior division.

## Scope traps

- **Phone-call voice compression is banned outright** — same subject as the exemplar.
- **"How the internet works"** is too broad: too many mechanisms. "How a message is split into
  packets and reassembled" is suitable scope.
- **An explainer video** fails — the user only watches.
- **A chatbot that answers questions about a technology** fails — it never shows anything working.

## Judging criteria

Human judges score **the product, the code, and the interviews**. Above all they weigh:

- whether a first-time user quickly understands the idea,
- whether the work underneath is correct and goes deep,
- whether the team can explain and defend it in their own words.

## Deadline

**25 November 2026, 23:59 Anywhere on Earth.** AoE is UTC-12, so the cutoff at UTC+8 is
**19:59 on Thursday 26 November** — six days, not seven. Do not treat the 25th as local;
that mistake costs a day the team does not have.
