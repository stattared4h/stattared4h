/**
 * Image ids (02-§8.9, 04-§9.7–9.10, ADR 0015).
 *
 * The id is derived from the file's content, so the same photo always gets the same id
 * and no counter has to be kept anywhere.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  IMAGE_ID_PATTERN,
  imageFileName,
  imageIdFor,
  isImageId,
} from "../../source/ts/domain/image-id.ts";

const photo = new TextEncoder().encode("pretend this is a WebP file");

test("an id is img- followed by twelve hexadecimal characters", async () => {
  const id = await imageIdFor(photo);
  assert.match(id, IMAGE_ID_PATTERN);
  assert.equal(id.length, "img-".length + 12);
  assert.equal(id.slice(0, 4), "img-");
});

test("the same bytes always give the same id, different bytes a different one", async () => {
  assert.equal(await imageIdFor(photo), await imageIdFor(photo));
  assert.notEqual(await imageIdFor(photo), await imageIdFor(new TextEncoder().encode("another photo")));
});

test("isImageId accepts the form and rejects everything else", () => {
  assert.ok(isImageId("img-a3f2c1d8b901"));
  assert.ok(isImageId("img-000000000000"), "an id of nothing but digits is still an id");
  for (const value of [
    "a3f2c1d8b901", // no prefix
    "img-a3f2c1d8b90", // eleven characters
    "img-a3f2c1d8b9012", // thirteen
    "img-A3F2C1D8B901", // uppercase
    "img-a3f2c1d8b90g", // g is not hexadecimal
    "rosa-1", // the old naming
    "img-a3f2c1d8b901.webp", // the file name, not the id
    "",
  ]) {
    assert.equal(isImageId(value), false, value);
  }
});

test("the file name is the id with .webp", () => {
  assert.equal(imageFileName("img-a3f2c1d8b901"), "img-a3f2c1d8b901.webp");
});

test("the prefix keeps YAML from reading an all-digit id as a number", async () => {
  // The prefix is the whole reason ids are not bare hex (04-§9.9). A bare all-digit id
  // would parse as an integer and lose its leading zeros; the prefixed one stays text.
  const { parse } = await import("yaml");
  assert.equal(parse("photos:\n  - img-012345678901\n").photos[0], "img-012345678901");
  assert.equal(typeof parse("photos:\n  - 012345678901\n").photos[0], "number");
});
