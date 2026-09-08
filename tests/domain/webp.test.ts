/**
 * The WebP inspector behind 04-§10.7 and 02-§8.2: dimensions from VP8, VP8L and VP8X,
 * and metadata from the VP8X flags or the ICCP/EXIF/XMP chunks.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { inspectWebp, stripWebpMetadata } from "../../source/ts/domain/webp.ts";
import {
  chunk,
  extendedWebp,
  losslessWebp,
  lossyWebp,
  riff,
  VP8X_EXIF,
  VP8X_ICC,
  VP8X_XMP,
} from "./webp-fixtures.ts";

test("reads width and height from a lossy VP8 bitstream", () => {
  assert.deepEqual(inspectWebp(lossyWebp(1600, 900)), { ok: true, width: 1600, height: 900, hasMetadata: false });
});

test("reads width and height from a lossless VP8L bitstream", () => {
  assert.deepEqual(inspectWebp(losslessWebp(1, 16383)), { ok: true, width: 1, height: 16383, hasMetadata: false });
});

test("reads the canvas size from a VP8X header", () => {
  assert.deepEqual(inspectWebp(extendedWebp(2400, 1200)), { ok: true, width: 2400, height: 1200, hasMetadata: false });
});

test("reports metadata for each VP8X flag", () => {
  for (const flag of [VP8X_ICC, VP8X_EXIF, VP8X_XMP]) {
    assert.equal(inspectWebp(extendedWebp(10, 10, flag)).hasMetadata, true, `flag ${flag}`);
  }
  assert.equal(inspectWebp(extendedWebp(10, 10, 0x10)).hasMetadata, false, "alpha flag is not metadata");
});

test("reports metadata when an EXIF, XMP or ICCP chunk is present without the flag", () => {
  for (const id of ["EXIF", "XMP ", "ICCP"]) {
    assert.equal(inspectWebp(extendedWebp(10, 10, 0, [chunk(id, [1, 2, 3])])).hasMetadata, true, id);
  }
});

test("rejects bytes that are not WebP", () => {
  assert.equal(inspectWebp(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0])).ok, false, "JPEG");
  assert.equal(inspectWebp(new Uint8Array()).ok, false, "empty");
  assert.equal(inspectWebp(riff([chunk("XXXX", [0, 0])])).ok, false, "no bitstream chunk");
  assert.equal(inspectWebp(riff([chunk("VP8 ", [0, 0, 0, 1, 2, 3, 0, 0, 0, 0])])).ok, false, "bad start code");
});

test("stripping removes an ICC profile and the flag that announced it (02-§11.9)", () => {
  const withIcc = extendedWebp(1600, 900, VP8X_ICC, [chunk("ICCP", new Array(64).fill(7))]);
  assert.equal(inspectWebp(withIcc).hasMetadata, true, "utgångsläget bär metadata");
  const stripped = stripWebpMetadata(withIcc);
  assert.deepEqual(inspectWebp(stripped), { ok: true, width: 1600, height: 900, hasMetadata: false });
  assert.ok(stripped.length < withIcc.length, "filen blir mindre när profilen försvinner");
});

test("stripping removes EXIF and XMP too, and keeps the picture", () => {
  const loaded = extendedWebp(800, 600, VP8X_EXIF | VP8X_XMP | VP8X_ICC, [
    chunk("EXIF", new Array(30).fill(1)),
    chunk("XMP ", new Array(31).fill(2)),
    chunk("ICCP", new Array(16).fill(3)),
  ]);
  const stripped = stripWebpMetadata(loaded);
  assert.deepEqual(inspectWebp(stripped), { ok: true, width: 800, height: 600, hasMetadata: false });
  const text = new TextDecoder("latin1").decode(stripped);
  for (const id of ["EXIF", "XMP ", "ICCP"]) assert.equal(text.includes(id), false, `${id} ligger kvar`);
  assert.ok(text.includes("VP8 "), "bildströmmen ligger kvar");
});

test("a file without metadata comes back byte for byte", () => {
  const plain = lossyWebp(1200, 800);
  assert.deepEqual([...stripWebpMetadata(plain)], [...plain]);
});

test("bytes that are not a WebP are left alone rather than rewritten", () => {
  const rubbish = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
  assert.deepEqual([...stripWebpMetadata(rubbish)], [...rubbish]);
});
