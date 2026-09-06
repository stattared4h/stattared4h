/**
 * 02-§6.7 / 04-§4.6: `born` is accepted as date, integer or text, normalised to
 * "YYYY-MM-DD" or "YYYY", and refused when invalid or in the future. formatBorn renders
 * the Swedish text the pages show.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { formatBorn, normaliseBorn } from "../../source/ts/domain/born.ts";
import { TODAY } from "./helpers.ts";

function value(input: unknown): string | null {
  const result = normaliseBorn(input, TODAY);
  assert.ok(result.ok, `expected ${JSON.stringify(input)} to be valid: ${result.ok ? "" : result.message}`);
  return result.value;
}

function message(input: unknown): string {
  const result = normaliseBorn(input, TODAY);
  assert.ok(!result.ok, `expected ${JSON.stringify(input)} to be refused`);
  return result.message;
}

test("normalises a full date given as text", () => {
  assert.equal(value("2021-04-12"), "2021-04-12");
});

test("normalises a year given as an integer or as text", () => {
  assert.equal(value(2016), "2016");
  assert.equal(value("2016"), "2016");
});

test("normalises a Date instance to YYYY-MM-DD", () => {
  assert.equal(value(new Date("2021-04-12T00:00:00Z")), "2021-04-12");
});

test("null and undefined mean unknown", () => {
  assert.equal(value(null), null);
  assert.equal(value(undefined), null);
});

test("refuses a date that does not exist", () => {
  assert.match(message("2021-13-40"), /"2021-13-40" är inte ett giltigt datum\. Skriv YYYY-MM-DD eller YYYY\./);
  assert.match(message("2021-02-30"), /inte ett giltigt datum/);
});

test("refuses other shapes than YYYY-MM-DD and YYYY", () => {
  for (const input of ["12/04/2021", "2021-4-12", "april 2021", 2021.5, true, 99, {}]) {
    assert.match(message(input), /inte ett giltigt datum/, JSON.stringify(input));
  }
});

test("refuses a date or year in the future", () => {
  assert.match(message("2026-09-07"), /ligger i framtiden/);
  assert.match(message(2027), /ligger i framtiden/);
  assert.equal(value("2026-09-06"), "2026-09-06", "today itself is allowed");
  assert.equal(value(2026), "2026", "the current year is allowed");
});

test("formats a full date in Swedish, lowercase month, no leading zero", () => {
  assert.equal(formatBorn("2021-04-12"), "Född 12 april 2021");
  assert.equal(formatBorn("2019-05-20"), "Född 20 maj 2019");
  assert.equal(formatBorn("2024-12-01"), "Född 1 december 2024");
});

test("formats a bare year", () => {
  assert.equal(formatBorn("2016"), "Född 2016");
});

test("formats unknown as null", () => {
  assert.equal(formatBorn(null), null);
});
