/**
 * The fanfare when a board is full (02-§12.11, ADR 0024): four rising notes and a chord
 * to land on, synthesised with the Web Audio API. No sound file is shipped, so there is
 * nothing to license, nothing to cache and nothing to download on the farm's coverage.
 *
 * Browsers only start audio after the visitor has interacted with the page. The call
 * comes from the press that fills the board, so that is always true; a browser without
 * Web Audio, or one that refuses anyway, gets silence and no error.
 */

const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const C6 = 1046.5;

/** [frequency, start in seconds, length in seconds] */
const NOTES: readonly [number, number, number][] = [
  [C5, 0, 0.14],
  [E5, 0.14, 0.14],
  [G5, 0.28, 0.14],
  [C6, 0.42, 0.55],
  [E5, 0.42, 0.55],
  [G5, 0.42, 0.55],
];

export function playFanfare(): void {
  const Context = window.AudioContext;
  if (typeof Context !== "function") return;
  try {
    const context = new Context();
    const start = context.currentTime + 0.02;
    for (const [frequency, at, length] of NOTES) {
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
    const end = start + Math.max(...NOTES.map(([, at, length]) => at + length)) + 0.2;
    window.setTimeout(() => void context.close(), (end - context.currentTime) * 1000);
  } catch {
    // Audio is a bonus, not the game.
  }
}
