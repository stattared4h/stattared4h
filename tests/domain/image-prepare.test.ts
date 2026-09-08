/**
 * 02-§11.8, 02-§11.10: the two decisions in the browser's image preparation that do not
 * need a browser — how far to scale down, and which quality step to keep.
 *
 * `encodeUnderLimit` takes the encoder as an argument precisely so this file can hand it
 * one made of numbers (ADR 0021).
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { encodeUnderLimit, fitWithin } from "../../source/ts/domain/image-prepare.ts";
import { IMAGE_QUALITY_STEPS } from "../../source/ts/domain/image-limits.ts";

test("a landscape photo is scaled by its long side", () => {
  assert.deepEqual(fitWithin({ width: 4000, height: 3000 }, 1600), { width: 1600, height: 1200 });
});

test("a portrait photo stays standing", () => {
  assert.deepEqual(fitWithin({ width: 3000, height: 4000 }, 1600), { width: 1200, height: 1600 });
});

test("an image already inside the limit is left alone", () => {
  assert.deepEqual(fitWithin({ width: 800, height: 600 }, 1600), { width: 800, height: 600 });
  assert.deepEqual(fitWithin({ width: 1600, height: 1600 }, 1600), { width: 1600, height: 1600 });
});

test("the short side is rounded and never becomes zero", () => {
  assert.deepEqual(fitWithin({ width: 1601, height: 900 }, 1600), { width: 1600, height: 899 });
  assert.deepEqual(fitWithin({ width: 20000, height: 3 }, 1600), { width: 1600, height: 1 });
});

/** An encoder whose output is `bytesAt(quality)` bytes, recording what it was asked for. */
function encoderOf(bytesAt: (quality: number) => number): { encode: (quality: number) => Promise<Uint8Array>; asked: number[] } {
  const asked: number[] = [];
  return {
    asked,
    encode: async (quality: number) => {
      asked.push(quality);
      return new Uint8Array(bytesAt(quality));
    },
  };
}

test("the first quality that fits is the one kept, and no further step is tried", async () => {
  const encoder = encoderOf((quality) => quality * 10);
  const result = await encodeUnderLimit(encoder.encode, { maxBytes: 700 });
  assert.equal(result.quality, IMAGE_QUALITY_STEPS[2]);
  assert.equal(result.data.byteLength, IMAGE_QUALITY_STEPS[2] * 10);
  assert.deepEqual(encoder.asked, IMAGE_QUALITY_STEPS.slice(0, 3));
});

test("the highest quality is tried first", async () => {
  const encoder = encoderOf(() => 1);
  const result = await encodeUnderLimit(encoder.encode, { maxBytes: 10 });
  assert.equal(result.quality, IMAGE_QUALITY_STEPS[0]);
  assert.deepEqual(encoder.asked, [IMAGE_QUALITY_STEPS[0]]);
});

test("a photo that is too large even at the lowest step is an error, in Swedish", async () => {
  const encoder = encoderOf(() => 1_000_000);
  await assert.rejects(() => encodeUnderLimit(encoder.encode, { maxBytes: 1000 }), /för stor|kunde inte/i);
  assert.deepEqual(encoder.asked, [...IMAGE_QUALITY_STEPS]);
});

test("the steps fall from high quality to low, and the limits are the shared ones", () => {
  assert.ok(IMAGE_QUALITY_STEPS.length > 1);
  for (let index = 1; index < IMAGE_QUALITY_STEPS.length; index += 1) {
    assert.ok(IMAGE_QUALITY_STEPS[index] < IMAGE_QUALITY_STEPS[index - 1], "stegen sjunker");
  }
});
