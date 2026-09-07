/**
 * 02-§10.22 and 02-§10.25: what the footer's version row says in each situation.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { formatStockholm, resolveBuildVersion } from "../../source/ts/domain/version.ts";

/** 18:40 in Stockholm on a summer-time day (UTC+2) — the example in 02-§10.22. */
const SUMMER = new Date("2026-09-06T16:40:00Z");

const base = { buildVersion: null, isCi: false, latestTag: "v1.0.4", versionFile: "1.0\n", now: SUMMER };

test("produktion: BUILD_VERSION visas som den är", () => {
  assert.equal(resolveBuildVersion({ ...base, buildVersion: "1.0.4", isCi: true }), "1.0.4");
});

test("QA: BUILD_VERSION med suffix visas som den är", () => {
  assert.equal(resolveBuildVersion({ ...base, buildVersion: "1.0.4 – QA PR212", isCi: true }), "1.0.4 – QA PR212");
  assert.equal(resolveBuildVersion({ ...base, buildVersion: "0.0.0 – QA PR31", isCi: true }), "0.0.0 – QA PR31");
});

test("CI utan BUILD_VERSION: ingen version alls", () => {
  assert.equal(resolveBuildVersion({ ...base, isCi: true }), null);
  assert.equal(resolveBuildVersion({ ...base, buildVersion: "   ", isCi: true }), null, "tom sträng räknas som saknad");
});

test("lokalt: senaste taggen och klockslaget i Europe/Stockholm", () => {
  assert.equal(resolveBuildVersion(base), "1.0.4 – lokal 2026-09-06 18:40");
});

test("lokalt utan tagg: X.Y.0 ur VERSION", () => {
  assert.equal(resolveBuildVersion({ ...base, latestTag: null, versionFile: "0.0\n" }), "0.0.0 – lokal 2026-09-06 18:40");
  assert.equal(resolveBuildVersion({ ...base, latestTag: "v1.0.4-rc1" }), "1.0.0 – lokal 2026-09-06 18:40", "en tagg som inte är vX.Y.P räknas inte");
});

test("lokalt: en ogiltig VERSION-fil fäller bygget", () => {
  assert.throws(() => resolveBuildVersion({ ...base, latestTag: null, versionFile: "1.0.0\n" }), /VERSION must contain X\.Y/);
});

test("klockslaget följer svensk normaltid på vintern", () => {
  assert.equal(formatStockholm(new Date("2026-01-10T17:05:00Z")), "2026-01-10 18:05");
  assert.equal(formatStockholm(new Date("2026-06-30T23:30:00Z")), "2026-07-01 01:30", "datumet följer med över midnatt");
});
