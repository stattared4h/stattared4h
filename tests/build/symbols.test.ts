/**
 * 02-§5.36, 03-§9.5, ADR 0019: one symbol per kind of place.
 *
 * The symbols are drawn in the page and must stay that way: a map that fetches its
 * icons is a blank map on the day the visitor stands in the yard without coverage
 * (02-§5.26).
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, test } from "node:test";
import { PLACE_SYMBOLS, symbolSvg } from "../../source/ts/build/symbols.ts";

/** The eight kinds, written out here so the test fails when the vocabulary drifts. */
const KINDS = ["boende", "djurplats", "grill", "husbil", "lek", "mat", "parkering", "toalett"];

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

  // 09-§1.5: the register carries a checksum for what we derive from a source, so that a
  // test can say it is unchanged. The three lifted road sign figures are that derivation.
  test("the lifted road sign figures are the ones the source register records", () => {
    const registered: Record<string, string> = {
      mat: "1be51ade43754e1f9f8a20b3d5000e08977bb1d3173865c198b1f5d71ce5eefd",
      boende: "a4f89b77f5972b9a45640127170394e42223d4f197c9c8ab87bb5c05af5be373",
      husbil: "66a5e69a2e6dc57f681b7fb8a7cd6fd7bda56fa5a0565c79a06bbff983f30c05",
    };
    for (const [kind, sha] of Object.entries(registered)) {
      const drawing = PLACE_SYMBOLS[kind as keyof typeof PLACE_SYMBOLS];
      const d = /<path d="([^"]+)"/.exec(drawing)?.[1];
      assert.ok(d, `${kind} carries a path`);
      assert.equal(
        createHash("sha256").update(d).digest("hex"),
        sha,
        `${kind} is still the figure registered in docs/09-kallor/index.md`,
      );
    }
  });

  test("symbolSvg wraps the drawing and keeps it out of the screen reader", () => {
    const svg = symbolSvg("toalett", "map__symbol");
    assert.match(svg, /^<svg class="map__symbol" aria-hidden="true" focusable="false" viewBox="0 0 24 24"[^>]*>/);
    assert.ok(svg.includes(PLACE_SYMBOLS.toalett), "the drawing is inside the svg");
    assert.match(svg, /<\/svg>$/);
  });
});
