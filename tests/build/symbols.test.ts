/**
 * 02-§5.36, 03-§9.5, ADR 0019: one symbol per kind of place.
 *
 * The symbols are drawn in the page and must stay that way: a map that fetches its
 * icons is a blank map on the day the visitor stands in the yard without coverage
 * (02-§5.26).
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { PLACE_SYMBOLS, symbolSvg } from "../../source/ts/build/symbols.ts";

/** The seven kinds, written out here so the test fails when the vocabulary drifts. */
const KINDS = ["boende", "djurplats", "grill", "lek", "mat", "parkering", "toalett"];

describe("place symbols (02-§5.36)", () => {
  test("every kind of place has a symbol, and no two kinds share one", () => {
    assert.deepEqual(Object.keys(PLACE_SYMBOLS).sort(), KINDS);
    const drawings = Object.values(PLACE_SYMBOLS);
    assert.equal(new Set(drawings).size, drawings.length, "no two kinds share a symbol");
    for (const [kind, drawing] of Object.entries(PLACE_SYMBOLS)) {
      assert.match(drawing, /<(?:path|circle|rect|line)\b/, `${kind} draws something`);
    }
  });

  test("a symbol fetches nothing and runs nothing (02-§5.26)", () => {
    for (const [kind, drawing] of Object.entries(PLACE_SYMBOLS)) {
      assert.doesNotMatch(drawing, /<script|<image|<style|https?:|url\(|xlink:href/i, kind);
    }
  });

  test("symbolSvg wraps the drawing and keeps it out of the screen reader", () => {
    const svg = symbolSvg("toalett", "map__symbol");
    assert.match(svg, /^<svg class="map__symbol" aria-hidden="true" focusable="false" viewBox="0 0 24 24"[^>]*>/);
    assert.ok(svg.includes(PLACE_SYMBOLS.toalett), "the drawing is inside the svg");
    assert.match(svg, /<\/svg>$/);
  });
});
