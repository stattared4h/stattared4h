/**
 * The draw both games share (03-§12.3, 02-§12.5, 02-§13.8). Pure: no DOM, no storage,
 * no clock.
 *
 * Djurbingo draws species and animals; Spana! draws clues. Neither shape is written down
 * here — the module knows only that it is handed a list and asked for `count` items. That
 * is what keeps the rule *every candidate is taken once before any is repeated* in one
 * place, proven once in tests/domain/draw.test.ts.
 *
 * Randomness is injected as a `() => number` in [0, 1), so the tests can hand in a fixed
 * sequence and the browser hands in `Math.random` (ADR 0009).
 */

export type Random = () => number;

/** Fisher–Yates with the injected random, so a fixed sequence gives a fixed order. */
export function shuffle<T>(items: readonly T[], random: Random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Draws `count` candidates: a shuffled pass through all of them, then another pass and
 * so on until the count is reached. With enough candidates there are no duplicates; with
 * fewer, every candidate appears about equally often.
 *
 * A caller that must not repeat itself asks for no more than the list holds — that is
 * Spana!'s rule (02-§13.8), while Djurbingo fills its board either way (02-§12.5).
 */
export function drawCandidates<T>(candidates: readonly T[], count: number, random: Random): T[] {
  if (count <= 0) return [];
  if (candidates.length === 0) throw new Error("Cannot draw from an empty candidate list");
  const drawn: T[] = [];
  while (drawn.length < count) {
    for (const candidate of shuffle(candidates, random)) {
      if (drawn.length === count) break;
      drawn.push(candidate);
    }
  }
  return drawn;
}
