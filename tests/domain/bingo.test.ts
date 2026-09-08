/**
 * 02-§12.4–12.11: the rules of Djurbingo, tested with an injected random so every draw
 * is reproducible. The browser is never involved (03-§2.1).
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  buildBoard,
  completedLines,
  drawCandidates,
  foundCount,
  isFull,
  lines,
  newlyCompletedLines,
  restoreBoard,
  serialiseBoard,
  shuffle,
  toggleSquare,
  type Board,
  type Candidate,
} from "../../source/ts/domain/bingo.ts";

/** A deterministic random: a fixed cycle of values in [0, 1). */
function sequence(values: readonly number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

/** Always 0: shuffle keeps the order, so draws are predictable. */
const keepOrder = () => 0;

function candidates(n: number, prefix = "c"): Candidate[] {
  return Array.from({ length: n }, (_, i) => ({ key: `${prefix}${i}`, name: `Namn ${i}` }));
}

function markAll(board: Board, indices: readonly number[]): Board {
  return indices.reduce((current, index) => toggleSquare(current, index), board);
}

describe("drawing squares (02-§12.5)", () => {
  test("with enough candidates every square is different", () => {
    const drawn = drawCandidates(candidates(20), 16, sequence([0.37, 0.91, 0.12, 0.66, 0.5]));
    assert.equal(drawn.length, 16);
    assert.equal(new Set(drawn.map((c) => c.key)).size, 16);
  });

  test("with too few candidates every candidate is used before any repeats", () => {
    const drawn = drawCandidates(candidates(5), 9, sequence([0.3, 0.8, 0.1]));
    assert.equal(drawn.length, 9);
    const firstPass = new Set(drawn.slice(0, 5).map((c) => c.key));
    assert.equal(firstPass.size, 5, "the first five are all different");
    const secondPass = new Set(drawn.slice(5).map((c) => c.key));
    assert.equal(secondPass.size, 4, "the next four are all different too");
  });

  test("a single candidate fills the whole board", () => {
    const drawn = drawCandidates(candidates(1), 9, keepOrder);
    assert.deepEqual(new Set(drawn.map((c) => c.key)), new Set(["c0"]));
  });

  test("nothing to draw from is an error, not an empty board", () => {
    assert.throws(() => drawCandidates([], 9, keepOrder));
  });

  test("the same random sequence gives the same draw", () => {
    const a = drawCandidates(candidates(12), 9, sequence([0.2, 0.7, 0.4]));
    const b = drawCandidates(candidates(12), 9, sequence([0.2, 0.7, 0.4]));
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

  test("a different random gives a different board: the draw really uses it", () => {
    const pool = candidates(9);
    const a = buildBoard(pool, 3, "species", sequence([0.1, 0.9, 0.4, 0.7]));
    const b = buildBoard(pool, 3, "species", sequence([0.8, 0.2, 0.6, 0.3]));
    assert.notDeepEqual(
      a.squares.map((s) => s.key),
      b.squares.map((s) => s.key),
      "two randoms, two orders",
    );
  });
});

describe("the board (02-§12.4, 02-§12.6)", () => {
  test("3×3 has nine squares and 4×4 sixteen, all unfound", () => {
    const small = buildBoard(candidates(20), 3, "species", keepOrder);
    const large = buildBoard(candidates(20), 4, "animal", keepOrder);
    assert.equal(small.squares.length, 9);
    assert.equal(large.squares.length, 16);
    assert.ok(small.squares.every((s) => !s.found));
    assert.equal(small.level, "species");
    assert.equal(large.level, "animal");
  });

  test("squares carry the candidate's key and name", () => {
    const board = buildBoard([{ key: "get", name: "Get" }], 3, "species", keepOrder);
    assert.deepEqual(board.squares[0], { key: "get", name: "Get", found: false });
  });
});

describe("marking and unmarking (02-§12.8)", () => {
  test("toggling marks a square and toggling again unmarks it", () => {
    const board = buildBoard(candidates(9), 3, "species", keepOrder);
    const marked = toggleSquare(board, 4);
    assert.equal(marked.squares[4].found, true);
    assert.equal(foundCount(marked), 1);
    const unmarked = toggleSquare(marked, 4);
    assert.equal(unmarked.squares[4].found, false);
    assert.equal(foundCount(unmarked), 0);
  });

  test("the original board is untouched", () => {
    const board = buildBoard(candidates(9), 3, "species", keepOrder);
    toggleSquare(board, 0);
    assert.equal(board.squares[0].found, false);
  });

  test("an index outside the board is an error", () => {
    const board = buildBoard(candidates(9), 3, "species", keepOrder);
    assert.throws(() => toggleSquare(board, 9), RangeError);
    assert.throws(() => toggleSquare(board, -1), RangeError);
  });
});

describe("lines and the win (02-§12.10, 02-§12.11)", () => {
  test("3×3 has eight lines and 4×4 ten: rows, columns and two diagonals", () => {
    assert.equal(lines(3).length, 8);
    assert.equal(lines(4).length, 10);
    assert.deepEqual(lines(3)[0], [0, 1, 2]);
    assert.deepEqual(lines(3)[3], [0, 3, 6]);
    assert.deepEqual(lines(3)[6], [0, 4, 8]);
    assert.deepEqual(lines(3)[7], [2, 4, 6]);
  });

  test("a row, a column and a diagonal each count as a completed line", () => {
    const board = buildBoard(candidates(9), 3, "species", keepOrder);
    assert.deepEqual(completedLines(markAll(board, [3, 4, 5])), [[3, 4, 5]]);
    assert.deepEqual(completedLines(markAll(board, [1, 4, 7])), [[1, 4, 7]]);
    assert.deepEqual(completedLines(markAll(board, [2, 4, 6])), [[2, 4, 6]]);
  });

  test("only the lines a toggle just finished are reported as new", () => {
    const board = buildBoard(candidates(9), 3, "species", keepOrder);
    const before = markAll(board, [0, 1, 3, 6]);
    const after = toggleSquare(before, 2);
    assert.deepEqual(newlyCompletedLines(before, after), [[0, 1, 2]]);
    const andCentre = toggleSquare(after, 4);
    assert.deepEqual(newlyCompletedLines(after, andCentre), [[2, 4, 6]], "the anti-diagonal 2, 4, 6 was one square short");
    const andEight = toggleSquare(andCentre, 8);
    assert.deepEqual(newlyCompletedLines(andCentre, andEight), [[0, 4, 8]]);
    const andFive = toggleSquare(andEight, 5);
    assert.deepEqual(newlyCompletedLines(andEight, andFive), [[3, 4, 5], [2, 5, 8]], "one square can finish two lines at once");
  });

  test("unmarking a square never reports a new line", () => {
    const board = markAll(buildBoard(candidates(9), 3, "species", keepOrder), [0, 1, 2]);
    assert.deepEqual(newlyCompletedLines(board, toggleSquare(board, 1)), []);
  });

  test("the board is full only when every square is found; a line is not a win", () => {
    const board = buildBoard(candidates(9), 3, "species", keepOrder);
    assert.equal(isFull(markAll(board, [0, 1, 2])), false);
    assert.equal(isFull(markAll(board, [0, 1, 2, 3, 4, 5, 6, 7, 8])), true);
  });
});

describe("storing and restoring (02-§12.9)", () => {
  const pool = { species: candidates(8, "s"), animal: candidates(20, "a") };

  test("a board survives a round trip and takes its names from the candidates", () => {
    const board = markAll(buildBoard(pool.animal, 4, "animal", sequence([0.3, 0.6])), [0, 5, 10, 15]);
    const stored = JSON.parse(JSON.stringify(serialiseBoard(board)));
    const restored = restoreBoard(stored, pool);
    assert.deepEqual(restored, board);
  });

  test("a stored square whose candidate is no longer offered drops the whole board", () => {
    const board = buildBoard(pool.species, 3, "species", keepOrder);
    const stored = serialiseBoard(board);
    const fewer = { ...pool, species: pool.species.filter((c) => c.key !== "s0") };
    assert.equal(restoreBoard(stored, fewer), null);
  });

  test("malformed storage is dropped, never thrown on", () => {
    assert.equal(restoreBoard(null, pool), null);
    assert.equal(restoreBoard("nonsense", pool), null);
    assert.equal(restoreBoard({ version: 2 }, pool), null);
    // A board that is complete in every other way, so only the version can reject it.
    // Without this the line above passes because `keys` and `found` are missing, and the
    // version gate could be deleted unnoticed (02-§12.9).
    const wellFormed = serialiseBoard(buildBoard(pool.species, 3, "species", keepOrder));
    assert.equal(restoreBoard({ ...wellFormed, version: 2 }, pool), null, "bara versionen skiljer");
    assert.equal(restoreBoard({ version: 1, size: 5, level: "species", keys: [], found: [] }, pool), null);
    assert.equal(restoreBoard({ version: 1, size: 3, level: "species", keys: ["s0"], found: [true] }, pool), null);
    assert.equal(
      restoreBoard({ version: 1, size: 3, level: "species", keys: Array(9).fill("s0"), found: Array(9).fill("ja") }, pool),
      null,
    );
  });
});
