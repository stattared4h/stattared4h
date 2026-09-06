/**
 * The WebP inspector behind 04-§10.7 and 02-§8.2: dimensions from VP8, VP8L and VP8X,
 * and metadata from the VP8X flags or the ICCP/EXIF/XMP chunks.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { inspectWebp } from "../../source/ts/domain/webp.ts";
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
