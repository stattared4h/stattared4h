/**
 * 02-§13.7–13.16: the rules of Spana!, tested with an injected random so every round is
 * reproducible. The browser is never involved (03-§2.1); the draw itself is proven in
 * tests/domain/draw.test.ts (03-§12.3).
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { STORAGE_KEY as BINGO_STORAGE_KEY } from "../../source/ts/domain/bingo.ts";
import {
  buildHunt,
  foundCount,
  isComplete,
  restoreHunt,
  serialiseHunt,
  toggleStop,
  HUNT_SIZES,
  LEVELS,
  STORAGE_KEY,
  type Candidate,
  type Hunt,
} from "../../source/ts/domain/spana.ts";

/** A deterministic random: a fixed cycle of values in [0, 1). */
function sequence(values: readonly number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

/** Always 0: shuffle keeps the order, so rounds are predictable. */
const keepOrder = () => 0;

/** `n` clues, every third one without a text, as the catalogue allows (04-§11.4). */
function candidates(n: number, prefix = "c"): Candidate[] {
  return Array.from({ length: n }, (_, i) => ({
    key: `${prefix}${i}`,
    location: `Plats ${i}`,
    text: i % 3 === 0 ? null : `Ledtråd ${i}`,
  }));
}

function markAll(hunt: Hunt, indices: readonly number[]): Hunt {
  return indices.reduce((current, index) => toggleStop(current, index), hunt);
}

describe("the round (02-§13.7, 02-§13.8)", () => {
  test("a short round is four stops and a long one eight, all unfound", () => {
    const short = buildHunt(candidates(12), 4, "easy", keepOrder);
    const long = buildHunt(candidates(12), 8, "hard", keepOrder);
    assert.equal(short.stops.length, 4);
    assert.equal(long.stops.length, 8);
    assert.ok(short.stops.every((stop) => !stop.found));
    assert.equal(short.level, "easy");
    assert.equal(long.level, "hard");
    assert.deepEqual([...HUNT_SIZES], [4, 8]);
    assert.deepEqual([...LEVELS], ["easy", "hard"]);
  });

  test("a stop carries the clue's key, its place and its text", () => {
    const hunt = buildHunt([{ key: "img-a1", location: "Bräckebur", text: "Vid grinden." }], 4, "easy", keepOrder);
    assert.deepEqual(hunt.stops[0], { key: "img-a1", location: "Bräckebur", text: "Vid grinden.", found: false });
  });

  test("the same clue never appears twice in one round", () => {
    for (const size of HUNT_SIZES) {
      const hunt = buildHunt(candidates(12), size, "easy", sequence([0.71, 0.13, 0.44, 0.92]));
      const keys = hunt.stops.map((stop) => stop.key);
      assert.equal(new Set(keys).size, keys.length, `storleken ${size} gav en dubblett`);
    }
  });

  test("a catalogue smaller than the round gives a shorter round, not a repeated one", () => {
    // 02-§13.8: a hunt with the same swing twice would read as a mistake, so the round
    // is cut instead. The chosen size is kept, because it is what the player asked for.
    const hunt = buildHunt(candidates(3), 8, "easy", sequence([0.4, 0.9]));
    assert.equal(hunt.stops.length, 3);
    assert.equal(hunt.size, 8);
    assert.equal(new Set(hunt.stops.map((stop) => stop.key)).size, 3);
  });

  test("an empty catalogue is an error, not an empty round", () => {
    assert.throws(() => buildHunt([], 4, "easy", keepOrder));
  });

  test("a different random gives a different round: the draw really uses it", () => {
    const pool = candidates(12);
    const a = buildHunt(pool, 8, "easy", sequence([0.1, 0.9, 0.4, 0.7]));
    const b = buildHunt(pool, 8, "easy", sequence([0.8, 0.2, 0.6, 0.3]));
    assert.notDeepEqual(a.stops.map((s) => s.key), b.stops.map((s) => s.key), "two randoms, two orders");
  });

  test("the level decides what is shown, not which clues are drawn (02-§13.9)", () => {
    const pool = candidates(12);
    const easy = buildHunt(pool, 8, "easy", sequence([0.2, 0.7, 0.4]));
    const hard = buildHunt(pool, 8, "hard", sequence([0.2, 0.7, 0.4]));
    assert.deepEqual(easy.stops.map((s) => s.key), hard.stops.map((s) => s.key));
  });
});

describe("marking and unmarking (02-§13.12)", () => {
  test("tapping marks a stop and tapping again unmarks it", () => {
    const hunt = buildHunt(candidates(12), 4, "easy", keepOrder);
    const marked = toggleStop(hunt, 2);
    assert.equal(marked.stops[2].found, true);
    assert.equal(foundCount(marked), 1);
    const unmarked = toggleStop(marked, 2);
    assert.equal(unmarked.stops[2].found, false);
    assert.equal(foundCount(unmarked), 0);
  });

  test("the original round is untouched", () => {
    const hunt = buildHunt(candidates(12), 4, "easy", keepOrder);
    toggleStop(hunt, 0);
    assert.equal(hunt.stops[0].found, false);
  });

  test("an index outside the round is an error", () => {
    const hunt = buildHunt(candidates(12), 4, "easy", keepOrder);
    assert.throws(() => toggleStop(hunt, 4), RangeError);
    assert.throws(() => toggleStop(hunt, -1), RangeError);
  });

  test("the round is complete only when every stop is found (02-§13.16)", () => {
    const hunt = buildHunt(candidates(12), 4, "easy", keepOrder);
    assert.equal(isComplete(hunt), false);
    assert.equal(isComplete(markAll(hunt, [0, 1, 2])), false);
    assert.equal(isComplete(markAll(hunt, [0, 1, 2, 3])), true);
  });
});

describe("storing and restoring (02-§13.14)", () => {
  const pool = candidates(12);

  test("the round has a key of its own, so the two games never overwrite each other", () => {
    assert.notEqual(STORAGE_KEY, BINGO_STORAGE_KEY);
  });

  test("a round survives a round trip and takes its words from the catalogue", () => {
    const hunt = markAll(buildHunt(pool, 8, "hard", sequence([0.3, 0.6])), [0, 3, 7]);
    const stored = JSON.parse(JSON.stringify(serialiseHunt(hunt)));
    assert.deepEqual(restoreHunt(stored, pool), hunt);
  });

  test("a shortened round survives a round trip too", () => {
    const small = candidates(3);
    const hunt = markAll(buildHunt(small, 8, "easy", keepOrder), [1]);
    assert.deepEqual(restoreHunt(JSON.parse(JSON.stringify(serialiseHunt(hunt))), small), hunt);
  });

  test("the place and the text come from the catalogue, never from storage", () => {
    // Storage is the visitor's own browser, but it is still not where facts live: a
    // renamed paddock must show its new name (02-§13.14).
    const hunt = buildHunt(pool, 4, "easy", keepOrder);
    const stored = { ...serialiseHunt(hunt), location: "Fel plats", text: "Fel ledtråd" } as unknown;
    const restored = restoreHunt(stored, pool);
    assert.ok(restored);
    for (const stop of restored.stops) {
      const source = pool.find((candidate) => candidate.key === stop.key);
      assert.equal(stop.location, source?.location);
      assert.equal(stop.text, source?.text);
    }
  });

  test("a stored stop whose clue the catalogue no longer has drops the whole round", () => {
    const hunt = buildHunt(pool, 4, "easy", keepOrder);
    const stored = serialiseHunt(hunt);
    const fewer = pool.filter((candidate) => candidate.key !== stored.keys[0]);
    assert.equal(restoreHunt(stored, fewer), null);
  });

  test("malformed storage is dropped, never thrown on", () => {
    assert.equal(restoreHunt(null, pool), null);
    assert.equal(restoreHunt("nonsense", pool), null);
    assert.equal(restoreHunt({ version: 2 }, pool), null);
    // A round that is complete in every other way, so only the version can reject it.
    const wellFormed = serialiseHunt(buildHunt(pool, 4, "easy", keepOrder));
    assert.equal(restoreHunt({ ...wellFormed, version: 2 }, pool), null, "bara versionen skiljer");
    assert.equal(restoreHunt({ ...wellFormed, size: 5 }, pool), null, "en storlek spelet inte erbjuder");
    assert.equal(restoreHunt({ ...wellFormed, level: "lagom" }, pool), null, "en nivå spelet inte har");
    assert.equal(restoreHunt({ ...wellFormed, found: wellFormed.found.slice(1) }, pool), null, "olika längd");
    assert.equal(restoreHunt({ ...wellFormed, found: wellFormed.found.map(() => "ja") }, pool), null, "bockar som inte är booleska");
    assert.equal(restoreHunt({ ...wellFormed, keys: [], found: [] }, pool), null, "en runda utan stopp");
    assert.equal(
      restoreHunt({ ...wellFormed, keys: [...wellFormed.keys, wellFormed.keys[0]], found: [...wellFormed.found, false] }, pool),
      null,
      "fler stopp än rundan valdes till",
    );
    assert.equal(
      restoreHunt({ ...wellFormed, keys: [wellFormed.keys[0], ...wellFormed.keys.slice(0, 3)] }, pool),
      null,
      "samma ledtråd två gånger i rundan (02-§13.8)",
    );
  });
});
