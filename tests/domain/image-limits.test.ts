/**
 * 02-§11.24: the image limits are declared once, and everything reads that one module.
 *
 * The identity checks catch a re-export that starts pointing somewhere else; the source
 * scan catches the more likely mistake — someone writing 1600 into a third file rather
 * than importing it.
 */
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { MAX_IMAGE_BYTES, MAX_IMAGE_EDGE } from "../../source/ts/domain/image-limits.ts";
import * as validate from "../../source/ts/domain/validate.ts";
import * as buildImages from "../../source/ts/build/images.ts";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const LIMITS_FILE = path.join("source", "ts", "domain", "image-limits.ts");

test("the validator and the build read the same limits", () => {
  assert.equal(validate.MAX_IMAGE_EDGE, MAX_IMAGE_EDGE);
  assert.equal(validate.MAX_IMAGE_BYTES, MAX_IMAGE_BYTES);
  assert.equal(buildImages.MAX_IMAGE_EDGE, MAX_IMAGE_EDGE);
  assert.equal(buildImages.MAX_IMAGE_BYTES, MAX_IMAGE_BYTES);
});

test("the limits are the ones ADR 0008 names", () => {
  assert.equal(MAX_IMAGE_EDGE, 1600);
  assert.equal(MAX_IMAGE_BYTES, 250 * 1024);
});

test("no other file declares a limit of its own", async () => {
  const declaration = /(?:const|let|var)\s+MAX_IMAGE_[A-Z_]*\s*=/;
  const offenders: string[] = [];
  for (const dir of ["source/ts", "scripts"]) {
    const base = path.join(ROOT, dir);
    for (const entry of await readdir(base, { withFileTypes: true, recursive: true })) {
      if (!entry.isFile() || !/\.(ts|mjs)$/.test(entry.name)) continue;
      const file = path.relative(ROOT, path.join(entry.parentPath, entry.name));
      if (file === LIMITS_FILE) continue;
      if (declaration.test(await readFile(path.join(ROOT, file), "utf8"))) offenders.push(file);
    }
  }
  assert.deepEqual(offenders, [], `gränsvärdet hör hemma i ${LIMITS_FILE} och ska importeras därifrån`);
});
