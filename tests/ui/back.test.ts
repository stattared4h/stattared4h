/**
 * 02-§10.40: the way back is the way the visitor came, when they came from this site.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { returnsToSitePage } from "../../source/ts/ui/back.ts";

const ORIGIN = "https://stattared4h.github.io";
const BASE = "/stattared4h/";

describe("vägen tillbaka", () => {
  test("en sida på samma sajt är historiken", () => {
    assert.equal(returnsToSitePage(`${ORIGIN}${BASE}plats/brackebur/`, ORIGIN, BASE), true);
    assert.equal(returnsToSitePage(`${ORIGIN}${BASE}`, ORIGIN, BASE), true);
  });

  test("en QR-kod eller en delad länk har ingen hänvisning och går till startsidan", () => {
    assert.equal(returnsToSitePage("", ORIGIN, BASE), false);
  });

  test("en annan sajt går till startsidan", () => {
    assert.equal(returnsToSitePage("https://www.4h.se/stattared/", ORIGIN, BASE), false);
    assert.equal(returnsToSitePage("https://example.test/stattared4h/plats/x/", ORIGIN, BASE), false);
  });

  test("QA och produktion är olika appar och delar inte historik (ADR 0005)", () => {
    assert.equal(returnsToSitePage(`${ORIGIN}/qa/plats/brackebur/`, ORIGIN, BASE), false);
    assert.equal(returnsToSitePage(`${ORIGIN}${BASE}plats/brackebur/`, ORIGIN, "/qa/"), false);
  });

  test("en adress som inte går att tolka går till startsidan", () => {
    assert.equal(returnsToSitePage("inte en adress", ORIGIN, BASE), false);
  });

  test("bas-sökvägen / tar emot varje sida på samma ursprung", () => {
    assert.equal(returnsToSitePage("http://localhost:8080/plats/brackebur/", "http://localhost:8080", "/"), true);
  });
});
