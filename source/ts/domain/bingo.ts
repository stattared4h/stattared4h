/**
 * The rules of Djurbingo (02-§12, ADR 0009, ADR 0024). Pure: no DOM, no storage, no clock.
 *
 * A board is `size × size` squares, each showing one thing to find. What can be found
 * comes from the dataset, not from the game: on the species level every species with a
 * photo, on the animal level every animal that is here and has a portrait (02-§12.4).
 * The build lists those candidates on the page; this module only draws from the list.
 *
 * Randomness is injected as a `() => number` in [0, 1), so the tests can hand in a fixed
 * sequence and the browser hands in `Math.random` (ADR 0009). The draw takes every
 * candidate once before any is repeated, so a small demo dataset gives duplicates and a
 * real one does not (02-§12.5).
 *
 * The board is never mutated: `toggleSquare` returns a new board. That keeps "found"
 * and "not found after all" the same operation, which is what makes undoing as easy as
 * marking (02-§12.8).
 */

export type BoardSize = 3 | 4;
export type Level = "species" | "animal";

export const BOARD_SIZES: readonly BoardSize[] = [3, 4];
export const LEVELS: readonly Level[] = ["species", "animal"];

/** One thing the visitor can look for. `key` is the species or animal id. */
export interface Candidate {
  key: string;
  name: string;
}

export interface Square extends Candidate {
  found: boolean;
}

export interface Board {
  size: BoardSize;
  level: Level;
  /** Row by row, `size * size` of them. */
  squares: Square[];
}

/** What the browser stores between visits (02-§12.9): enough to rebuild the board from the page's candidates. */
export interface StoredBoard {
  version: 1;
  size: BoardSize;
  level: Level;
  keys: string[];
  found: boolean[];
}

export const STORAGE_KEY = "s4h-bingo";

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
 * so on until the count is reached (02-§12.5). With enough candidates there are no
 * duplicates; with fewer, every candidate appears about equally often.
 */
export function drawCandidates(candidates: readonly Candidate[], count: number, random: Random): Candidate[] {
  if (candidates.length === 0) throw new Error("Cannot draw from an empty candidate list");
  const drawn: Candidate[] = [];
  while (drawn.length < count) {
    for (const candidate of shuffle(candidates, random)) {
      if (drawn.length === count) break;
      drawn.push(candidate);
    }
  }
  return drawn;
}

export function buildBoard(candidates: readonly Candidate[], size: BoardSize, level: Level, random: Random): Board {
  const squares = drawCandidates(candidates, size * size, random).map((candidate) => ({ ...candidate, found: false }));
  return { size, level, squares };
}

/** The same board with one square flipped. Marking and unmarking are the same move (02-§12.8). */
export function toggleSquare(board: Board, index: number): Board {
  if (index < 0 || index >= board.squares.length) throw new RangeError(`No square ${index}`);
  const squares = board.squares.map((square, i) => (i === index ? { ...square, found: !square.found } : square));
  return { ...board, squares };
}

/** Every line that counts: rows, columns and the two diagonals, as lists of square indices. */
export function lines(size: BoardSize): number[][] {
  const result: number[][] = [];
  for (let r = 0; r < size; r++) result.push(Array.from({ length: size }, (_, c) => r * size + c));
  for (let c = 0; c < size; c++) result.push(Array.from({ length: size }, (_, r) => r * size + c));
  result.push(Array.from({ length: size }, (_, i) => i * size + i));
  result.push(Array.from({ length: size }, (_, i) => i * size + (size - 1 - i)));
  return result;
}

/** The lines whose every square is found, as lists of square indices. */
export function completedLines(board: Board): number[][] {
  return lines(board.size).filter((line) => line.every((index) => board.squares[index].found));
}

/** Lines that are complete in `after` but were not in `before`: what a single toggle just finished (02-§12.10). */
export function newlyCompletedLines(before: Board, after: Board): number[][] {
  const wasComplete = new Set(completedLines(before).map((line) => line.join(",")));
  return completedLines(after).filter((line) => !wasComplete.has(line.join(",")));
}

export function foundCount(board: Board): number {
  return board.squares.filter((square) => square.found).length;
}

/** The win: every square found (02-§12.11). */
export function isFull(board: Board): boolean {
  return board.squares.every((square) => square.found);
}

export function serialiseBoard(board: Board): StoredBoard {
  return {
    version: 1,
    size: board.size,
    level: board.level,
    keys: board.squares.map((square) => square.key),
    found: board.squares.map((square) => square.found),
  };
}

/**
 * Rebuilds a board from what was stored, against the candidates the page offers now.
 * Returns null when the stored data is malformed or names something the page no longer
 * has, so a board saved against last season's animals is dropped rather than shown with
 * holes (02-§12.9). Names come from the candidates, never from storage.
 */
export function restoreBoard(stored: unknown, candidatesByLevel: Readonly<Record<Level, readonly Candidate[]>>): Board | null {
  if (typeof stored !== "object" || stored === null) return null;
  const data = stored as Partial<StoredBoard>;
  if (data.version !== 1) return null;
  if (!BOARD_SIZES.includes(data.size as BoardSize) || !LEVELS.includes(data.level as Level)) return null;
  const size = data.size as BoardSize;
  const level = data.level as Level;
  const count = size * size;
  if (!Array.isArray(data.keys) || !Array.isArray(data.found)) return null;
  if (data.keys.length !== count || data.found.length !== count) return null;
  if (!data.found.every((value) => typeof value === "boolean")) return null;

  const byKey = new Map(candidatesByLevel[level].map((candidate) => [candidate.key, candidate]));
  const squares: Square[] = [];
  for (let i = 0; i < count; i++) {
    const candidate = byKey.get(String(data.keys[i]));
    if (candidate === undefined) return null;
    squares.push({ ...candidate, found: data.found[i] });
  }
  return { size, level, squares };
}
