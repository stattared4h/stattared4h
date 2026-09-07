/** 02-§6.14 / 04-§4.9: public animal IDs match regardless of simple formatting. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { isPublicIdFormat, normalisePublicId } from "../../source/ts/domain/public-id.ts";

test("normalises spaces, hyphens and letter case", () => {
  const expected = "SE0123450001";
  assert.equal(normalisePublicId("SE 012345 0001"), expected);
  assert.equal(normalisePublicId("se-012345-0001"), expected);
  assert.equal(normalisePublicId("SE0123450001"), expected);
});

test("accepts visitor-facing alphanumeric IDs with simple separators", () => {
  for (const value of ["SE 012345 0001", "SE-012345-0001", "ABC123", "Ö 12-34"]) {
    assert.equal(isPublicIdFormat(value), true, value);
  }
});

test("refuses empty IDs and punctuation that is not simple formatting", () => {
  for (const value of ["", "   ", "SE/123", "<b>SE123</b>", "-SE123-"]) {
    assert.equal(isPublicIdFormat(value), false, value);
  }
});
