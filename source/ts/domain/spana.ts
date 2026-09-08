/**
 * The rules of Spana! (02-§13, ADR 0009, ADR 0024, ADR 0025). Pure: no DOM, no storage,
 * no clock.
 *
 * A round is a handful of stops, each one a clue: a close-up of a detail somewhere on the
 * farm, and the place that is the answer. What can be asked comes from the clue catalogue
 * in the data (04-§11), not from the game; the build lists the catalogue on the page and
 * this module only draws from the list.
 *
 * The draw is `draw.ts`, shared with Djurbingo (03-§12.3). Where the board fills itself
 * even when the data is thin (02-§12.5), a round is cut short instead: the same swing
 * twice would read as a bug, not as a game (02-§13.8).
 *
 * The round is never mutated: `toggleStop` returns a new one. That keeps "found" and "not
 * found after all" the same move, which is what makes undoing as easy as marking
 * (02-§13.12).
 */
import { drawCandidates, type Random } from "./draw.ts";

/** How many stops the player asked for (02-§13.7). A round may end up shorter. */
export type HuntSize = 4 | 8;

/** What the player is shown: the clue's text on "Lätt", the picture alone on "Svårt". */
export type Level = "easy" | "hard";

export const HUNT_SIZES: readonly HuntSize[] = [4, 8];
export const LEVELS: readonly Level[] = ["easy", "hard"];

/** One clue the round can ask for. `key` is the clue's id, which is its picture's id. */
export interface Candidate {
  key: string;
  /** The place that is the answer, as the visitor reads it: a name, not an id. */
  location: string;
  /** The clue's own words, or null when the picture is the whole clue (04-§11.4). */
  text: string | null;
}

export interface Stop extends Candidate {
  found: boolean;
}

export interface Hunt {
  /** What the player chose, even when the catalogue could not fill it (02-§13.8). */
  size: HuntSize;
  level: Level;
  stops: Stop[];
}

/** What the browser stores between visits (02-§13.14): enough to rebuild the round from the page's clues. */
export interface StoredHunt {
  version: 1;
  size: HuntSize;
  level: Level;
  keys: string[];
  found: boolean[];
}

/** Spana!'s own key. Djurbingo has `s4h-bingo`, and the two must never meet. */
export const STORAGE_KEY = "s4h-spana";

/**
 * A fresh round of at most `size` stops, drawn from the catalogue without repeats
 * (02-§13.8). A catalogue smaller than the round gives a shorter round; the chosen size
 * is kept, because it is what the player asked for and what the stored round is measured
 * against.
 */
export function buildHunt(candidates: readonly Candidate[], size: HuntSize, level: Level, random: Random): Hunt {
  if (candidates.length === 0) throw new Error("Cannot build a hunt without clues");
  const count = Math.min(size, candidates.length);
  const stops = drawCandidates(candidates, count, random).map((candidate) => ({ ...candidate, found: false }));
  return { size, level, stops };
}

/** The same round with one stop flipped. Marking and unmarking are the same move (02-§13.12). */
export function toggleStop(hunt: Hunt, index: number): Hunt {
  if (index < 0 || index >= hunt.stops.length) throw new RangeError(`No stop ${index}`);
  const stops = hunt.stops.map((stop, i) => (i === index ? { ...stop, found: !stop.found } : stop));
  return { ...hunt, stops };
}

export function foundCount(hunt: Hunt): number {
  return hunt.stops.filter((stop) => stop.found).length;
}

/** The round is over when every stop is found (02-§13.16). */
export function isComplete(hunt: Hunt): boolean {
  return hunt.stops.every((stop) => stop.found);
}

export function serialiseHunt(hunt: Hunt): StoredHunt {
  return {
    version: 1,
    size: hunt.size,
    level: hunt.level,
    keys: hunt.stops.map((stop) => stop.key),
    found: hunt.stops.map((stop) => stop.found),
  };
}

/**
 * Rebuilds a round from what was stored, against the clues the page offers now. Returns
 * null when the stored data is malformed or names a clue the catalogue no longer has, so
 * a round saved against last season's catalogue is dropped rather than shown with holes
 * (02-§13.14). The place and the text come from the catalogue, never from storage: a
 * paddock that has been renamed says its new name.
 */
export function restoreHunt(stored: unknown, candidates: readonly Candidate[]): Hunt | null {
  if (typeof stored !== "object" || stored === null) return null;
  const data = stored as Partial<StoredHunt>;
  if (data.version !== 1) return null;
  if (!HUNT_SIZES.includes(data.size as HuntSize) || !LEVELS.includes(data.level as Level)) return null;
  const size = data.size as HuntSize;
  const level = data.level as Level;
  if (!Array.isArray(data.keys) || !Array.isArray(data.found)) return null;
  const count = data.keys.length;
  if (count < 1 || count > size || data.found.length !== count) return null;
  if (!data.found.every((value) => typeof value === "boolean")) return null;
  if (new Set(data.keys).size !== count) return null;

  const byKey = new Map(candidates.map((candidate) => [candidate.key, candidate]));
  const stops: Stop[] = [];
  for (let i = 0; i < count; i++) {
    const candidate = byKey.get(String(data.keys[i]));
    if (candidate === undefined) return null;
    stops.push({ ...candidate, found: data.found[i] });
  }
  return { size, level, stops };
}
