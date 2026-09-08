/**
 * 02-§12.5, 02-§13.8: the draw both games share (03-§12.3), tested with an injected
 * random so every draw is reproducible. The browser is never involved (03-§2.1).
 *
 * These tests were Djurbingo's before Spana! was built. They live here now because the
 * rule they prove — every candidate is taken once before any is repeated — is the draw's,
 * not the board's, and proving it once is what makes it safe for two games to lean on it.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { drawCandidates, shuffle } from "../../source/ts/domain/draw.ts";

/** A deterministic random: a fixed cycle of values in [0, 1). */
function sequence(values: readonly number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

/** Always 0: shuffle keeps the order, so draws are predictable. */
const keepOrder = () => 0;

interface Item {
  key: string;
  name: string;
}

function items(n: number, prefix = "c"): Item[] {
  return Array.from({ length: n }, (_, i) => ({ key: `${prefix}${i}`, name: `Namn ${i}` }));
}

describe("drawing (02-§12.5, 02-§13.8)", () => {
  test("with enough candidates every draw is different", () => {
    const drawn = drawCandidates(items(20), 16, sequence([0.37, 0.91, 0.12, 0.66, 0.5]));
    assert.equal(drawn.length, 16);
    assert.equal(new Set(drawn.map((c) => c.key)).size, 16);
  });

  test("with too few candidates every candidate is used before any repeats", () => {
    const drawn = drawCandidates(items(5), 9, sequence([0.3, 0.8, 0.1]));
    assert.equal(drawn.length, 9);
    const firstPass = new Set(drawn.slice(0, 5).map((c) => c.key));
    assert.equal(firstPass.size, 5, "the first five are all different");
    const secondPass = new Set(drawn.slice(5).map((c) => c.key));
    assert.equal(secondPass.size, 4, "the next four are all different too");
  });

  test("a single candidate fills the whole draw", () => {
    const drawn = drawCandidates(items(1), 9, keepOrder);
    assert.deepEqual(new Set(drawn.map((c) => c.key)), new Set(["c0"]));
  });

  test("nothing to draw from is an error, not an empty result", () => {
    assert.throws(() => drawCandidates([], 9, keepOrder));
  });

  test("the same random sequence gives the same draw", () => {
    const a = drawCandidates(items(12), 9, sequence([0.2, 0.7, 0.4]));
    const b = drawCandidates(items(12), 9, sequence([0.2, 0.7, 0.4]));
    assert.deepEqual(a, b);
  });

  test("shuffle actually permutes, and keeps every item exactly once", () => {
    // The exact order a known random sequence produces. Asserting only that the items
    // survive would pass for a shuffle that returns the list untouched, which is the one
    // bug worth catching here (02-§12.5).
    const shuffled = shuffle([1, 2, 3, 4, 5], sequence([0.9, 0.1, 0.5]));
    assert.deepEqual(shuffled, [4, 3, 2, 1, 5]);
    assert.deepEqual([...shuffled].sort(), [1, 2, 3, 4, 5], "every item exactly once");
  });

  test("the draw knows nothing about what it draws: plain strings work too", () => {
    // The reason the module exists: bingo draws species and animals, Spana! draws clues,
    // and neither shape is written down here (03-§12.3).
    const drawn = drawCandidates(["gunga", "grind", "stubbe"], 3, sequence([0.6, 0.2]));
    assert.deepEqual([...drawn].sort(), ["grind", "gunga", "stubbe"]);
  });

  test("drawing zero gives nothing, and never touches the random", () => {
    let calls = 0;
    const counted = (): number => {
      calls += 1;
      return 0;
    };
    assert.deepEqual(drawCandidates(items(3), 0, counted), []);
    assert.equal(calls, 0);
  });
});
