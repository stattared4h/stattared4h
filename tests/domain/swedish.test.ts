/**
 * 02-§5.11 / 02-§5.17 / 02-§5.21: the Swedish wording helpers behind "Getterna på
 * gården", "Var finns fåren?" and "18 svarta dvärghöns och 14 orusthöns".
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { definitePlural, joinSwedish, lowerFirst } from "../../source/ts/domain/swedish.ts";

test("definitePlural covers every plural in the QA vocabulary and the common farm animals", () => {
  const cases: Array<[string, string]> = [
    ["Getter", "Getterna"],
    ["Får", "Fåren"],
    ["Kor", "Korna"],
    ["Hästar", "Hästarna"],
    ["Kaniner", "Kaninerna"],
    ["Grisar", "Grisarna"],
    ["Höns", "Hönsen"],
    ["Katter", "Katterna"],
    ["Ankor", "Ankorna"],
    ["Gäss", "Gässen"],
    ["Lamm", "Lammen"],
    ["Marsvin", "Marsvinen"],
    ["Åsnor", "Åsnorna"],
    ["Djur", "Djuren"],
  ];
  for (const [plural, definite] of cases) {
    assert.equal(definitePlural(plural), definite);
  }
});

test("lowerFirst lowers only the first letter, Swedish letters included", () => {
  assert.equal(lowerFirst("Fåren"), "fåren");
  assert.equal(lowerFirst("Åsnorna"), "åsnorna");
  assert.equal(lowerFirst("Svarta dvärghöns"), "svarta dvärghöns");
  assert.equal(lowerFirst(""), "");
});

test("joinSwedish joins with commas and 'och'", () => {
  assert.equal(joinSwedish([]), "");
  assert.equal(joinSwedish(["får"]), "får");
  assert.equal(joinSwedish(["får", "kor"]), "får och kor");
  assert.equal(joinSwedish(["får", "kor", "getter"]), "får, kor och getter");
});
