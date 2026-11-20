# Credits and choices

Rule 7 asks two things of every component we did not write: that we can explain our own code,
and that we can say **why we chose that component**. This file is that answer, kept current as
we add things, including the ones we evaluated and rejected.

Nothing yet — the scaffold is hand-written with no dependencies.

When we add something, record it in this shape:

---

## `<component name>` — `<version>` — `<link>`

**What it does for us:** one sentence.

**Why this one:** what we compared it against, and the specific property that decided it.
"They're the popular one" is not a reason a judge will accept.

**Cost:** what we took on by not writing it ourselves — bundle size, an abstraction we now have
to explain, a behaviour we cannot control.

**Rejected:** the alternatives and why they lost.
