/**
 * 02-§12.11: fanfaren vid full bricka ringer i fem sekunder. Bara tonlistan prövas här —
 * uppspelningen är Web Audio och hör till den manuella kontrollpunkten.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { fanfareNotes, FANFARE_SECONDS } from "../../source/ts/ui/fanfare.ts";

/** Sekunden tonen tystnar. */
function end([, at, length]: readonly [number, number, number]): number {
  return at + length;
}

/** Flyttal: en tiondels millisekund är närmare än något öra hör. */
const CLOSE = 1e-4;

describe("fanfaren (02-§12.11)", () => {
  test("den ringer i fem sekunder, varken mer eller mindre", () => {
    assert.equal(FANFARE_SECONDS, 5);
    const notes = fanfareNotes();
    const last = Math.max(...notes.map(end));
    assert.ok(Math.abs(last - FANFARE_SECONDS) < CLOSE, `sista tonen tystnar ${last} s in`);
    assert.ok(
      notes.every((note) => end(note) <= FANFARE_SECONDS + CLOSE),
      "ingen ton klingar förbi slutet",
    );
  });

  test("slingan spelas om — det är inte en enda vända följd av tystnad", () => {
    const notes = fanfareNotes();
    const starts = notes.map(([, at]) => at);
    assert.ok(notes.length > 6, "fler toner än en enda vända");
    // Den längsta luckan mellan två anslag: hörs den som en paus är slingan slut i förtid.
    const ordered = [...starts].sort((a, b) => a - b);
    const gaps = ordered.slice(1).map((at, i) => at - ordered[i]);
    assert.ok(Math.max(...gaps) < 1, "ingen tystnad mitt i fanfaren");
  });

  test("varje ton har en hörbar frekvens, en start och en längd", () => {
    for (const [frequency, at, length] of fanfareNotes()) {
      assert.ok(frequency > 20 && frequency < 5000, `${frequency} Hz ligger utanför det hörbara`);
      assert.ok(at >= 0, "ingen ton börjar före noll");
      assert.ok(length > 0, "ingen ton är noll lång");
    }
  });

  test("tonerna kommer i tidsordning, så uppspelningen kan läsas uppifrån och ned", () => {
    const starts = fanfareNotes().map(([, at]) => at);
    assert.deepEqual(starts, [...starts].sort((a, b) => a - b));
  });
});
