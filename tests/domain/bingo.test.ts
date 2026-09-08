/**
 * 02-§12.4–12.11: the rules of Djurbingo, tested with an injected random so every draw
 * is reproducible. The browser is never involved (03-§2.1).
 *
 * The draw itself belongs to both games and is tested in tests/domain/draw.test.ts
 * (03-§12.3); what is left here is the board built on top of it.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  buildBoard,
  completedLines,
  foundCount,
  isFull,
  lines,
  newlyCompletedLines,
  restoreBoard,
  serialiseBoard,
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

describe("the draw behind the board (02-§12.5)", () => {
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

  test("a board with more squares than candidates repeats rather than falling short", () => {
    // 02-§12.5 lets a small dataset give duplicates; the board is still full.
    const board = buildBoard(candidates(4), 3, "species", sequence([0.3, 0.8]));
    assert.equal(board.squares.length, 9);
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
  test("only the across rows are lines: three on 3×3, four on 4×4", () => {
    assert.deepEqual(lines(3), [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
    ]);
    assert.equal(lines(4).length, 4);
    assert.deepEqual(lines(4)[0], [0, 1, 2, 3]);
    assert.deepEqual(lines(4)[3], [12, 13, 14, 15]);
  });

  test("a full row counts; a full column or diagonal does not", () => {
    const board = buildBoard(candidates(9), 3, "species", keepOrder);
    assert.deepEqual(completedLines(markAll(board, [3, 4, 5])), [[3, 4, 5]]);
    assert.deepEqual(completedLines(markAll(board, [1, 4, 7])), [], "the middle column is no line");
    assert.deepEqual(completedLines(markAll(board, [0, 4, 8])), [], "nor is the diagonal");
    assert.deepEqual(completedLines(markAll(board, [2, 4, 6])), [], "nor the anti-diagonal");
  });

  test("only the lines a toggle just finished are reported as new", () => {
    const board = buildBoard(candidates(9), 3, "species", keepOrder);
    const before = markAll(board, [0, 1, 3, 4]);
    const after = toggleSquare(before, 2);
    assert.deepEqual(newlyCompletedLines(before, after), [[0, 1, 2]]);
    const andSix = toggleSquare(after, 6);
    assert.deepEqual(newlyCompletedLines(after, andSix), [], "a square that finishes nothing finishes nothing");
    const andFive = toggleSquare(andSix, 5);
    assert.deepEqual(newlyCompletedLines(andSix, andFive), [[3, 4, 5]]);
  });

  test("a square sits in one line only, so a press never finishes two at once", () => {
    // Every square but the middle one. With columns and diagonals counted this press
    // finished four lines at once, which is why the board confettied on nearly every
    // press near the end (02-§12.10).
    const board = buildBoard(candidates(9), 3, "species", keepOrder);
    const before = markAll(board, [0, 1, 2, 3, 5, 6, 7, 8]);
    const after = toggleSquare(before, 4);
    assert.deepEqual(newlyCompletedLines(before, after), [[3, 4, 5]]);
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
