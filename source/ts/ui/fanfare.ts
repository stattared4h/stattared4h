/**
 * The fanfare when a board is full (02-§12.11, ADR 0024): a short motif — four rising
 * notes and a chord to land on — played over and over until five seconds are full, and
 * the last chord held so it ends on the second. Synthesised with the Web Audio API. No
 * sound file is shipped, so there is nothing to license, nothing to cache and nothing to
 * download on the farm's coverage.
 *
 * `fanfareNotes` is pure data: frequency, start and length, no browser in sight, so the
 * length is a unit test rather than a stopwatch (CL-§2.14). Only `playFanfare` touches
 * Web Audio.
 *
 * Browsers only start audio after the visitor has interacted with the page. The call
 * comes from the press that fills the board, so that is always true; a browser without
 * Web Audio, or one that refuses anyway, gets silence and no error.
 */

const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const C6 = 1046.5;

/** How long the whole fanfare rings, in seconds (02-§12.11). */
export const FANFARE_SECONDS = 5;

/** One turn of the motif: [frequency, start in seconds, length in seconds]. */
const MOTIF: readonly [number, number, number][] = [
  [C5, 0, 0.14],
  [E5, 0.14, 0.14],
  [G5, 0.28, 0.14],
  [C6, 0.42, 0.55],
  [E5, 0.42, 0.55],
  [G5, 0.42, 0.55],
];

const MOTIF_SECONDS = Math.max(...MOTIF.map(([, at, length]) => at + length));

/**
 * The whole fanfare, note by note: the motif as many whole turns as fit, with the closing
 * chord of the last turn held until the five seconds are up. A whole number of turns
 * keeps the tune from being cut off mid-phrase, and the held chord is what makes the
 * ending land on the second instead of a beat early.
 */
export function fanfareNotes(): [number, number, number][] {
  const turns = Math.max(1, Math.floor(FANFARE_SECONDS / MOTIF_SECONDS));
  const notes: [number, number, number][] = [];
  for (let turn = 0; turn < turns; turn++) {
    const offset = turn * MOTIF_SECONDS;
    const lastTurn = turn === turns - 1;
    for (const [frequency, at, length] of MOTIF) {
      // The notes that close the motif — the chord — ring on to the end on the last turn.
      const until = lastTurn && at + length === MOTIF_SECONDS ? FANFARE_SECONDS - offset : at + length;
      notes.push([frequency, offset + at, until - at]);
    }
  }
  return notes;
}

export function playFanfare(): void {
  const Context = window.AudioContext;
  if (typeof Context !== "function") return;
  try {
    const context = new Context();
    const start = context.currentTime + 0.02;
    for (const [frequency, at, length] of fanfareNotes()) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start + at);
      gain.gain.exponentialRampToValueAtTime(0.25, start + at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + at + length);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start + at);
      oscillator.stop(start + at + length + 0.05);
    }
    const end = start + FANFARE_SECONDS + 0.2;
    window.setTimeout(() => void context.close(), (end - context.currentTime) * 1000);
  } catch {
    // Audio is a bonus, not the game.
  }
}
