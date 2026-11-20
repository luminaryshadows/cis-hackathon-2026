// The mechanism lives here.

Rule for this folder: **pure computation, no DOM, no framework.**

`src/` should be able to compute the thing we are explaining without knowing a browser
exists. That keeps three promises at once:

1. It can be tested in isolation, which matters because correctness is judged directly.
2. It can be explained line by line in an interview without dragging UI code into the answer.
3. The UI becomes a thin projection of the computation, so every number on screen traces
   back to a function we wrote — which is what rule 5 requires.

Nothing here yet. The idea is not chosen.
