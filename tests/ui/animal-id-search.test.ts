import assert from "node:assert/strict";
import { test } from "node:test";
import { findAnimalByPublicId } from "../../source/ts/ui/animal-id-search.ts";

const entries = [
  { publicId: "SE 012345 0001", url: "/djur/astrid/", name: "Astrid" },
  { publicId: "SE 012345 0002", url: "/djur/bertil/", name: "Bertil" },
];

test("finds the same animal despite spaces, hyphens and case", () => {
  assert.equal(findAnimalByPublicId(entries, "se-012345-0001")?.name, "Astrid");
  assert.equal(findAnimalByPublicId(entries, "SE0123450001")?.name, "Astrid");
});

test("does not use suffix matching or invent an ambiguous result", () => {
  assert.equal(findAnimalByPublicId(entries, "0001"), null);
  assert.equal(findAnimalByPublicId(entries, ""), null);
});
