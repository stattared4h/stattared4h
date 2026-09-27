/**
 * 02-§11.31, 02-§11.32: the GPS position read out of the original photo before the
 * canvas throws every byte of metadata away (ADR 0026).
 *
 * The real files are written by sharp, which puts the GPS block where cameras put it, so
 * the reader is tested against someone else's encoder rather than against itself. The
 * container cases that sharp cannot write — HEIC, a TIFF without the `Exif` marker — are
 * built by hand around the same block.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import sharp from "sharp";
import { readExifPosition } from "../../source/ts/domain/exif-position.ts";

/** 57° 20′ 14.67″ N, 12° 20′ 27.13″ E: a point on the farm. */
const GPS = {
  GPSLatitudeRef: "N",
  GPSLatitude: "57/1 20/1 1467/100",
  GPSLongitudeRef: "E",
  GPSLongitude: "12/1 20/1 2713/100",
};
const LAT = 57 + 20 / 60 + 14.67 / 3600;
const LON = 12 + 20 / 60 + 27.13 / 3600;

function blank(): sharp.Sharp {
  return sharp({ create: { width: 8, height: 8, channels: 3, background: "#7a9a5a" } });
}

async function jpegWith(gps: Record<string, string>): Promise<Uint8Array> {
  return new Uint8Array(await blank().jpeg().withExif({ IFD0: { Make: "Test" }, IFD3: gps }).toBuffer());
}

function near(actual: number | undefined, expected: number, label: string): void {
  assert.ok(actual !== undefined && Math.abs(actual - expected) < 1e-9, `${label}: ${actual} ≠ ${expected}`);
}

test("a JPEG straight from the camera gives its position in decimal degrees", async () => {
  const position = readExifPosition(await jpegWith(GPS));
  near(position?.lat, LAT, "lat");
  near(position?.lon, LON, "lon");
});

test("south and west are negative", async () => {
  const position = readExifPosition(await jpegWith({ ...GPS, GPSLatitudeRef: "S", GPSLongitudeRef: "W" }));
  near(position?.lat, -LAT, "lat");
  near(position?.lon, -LON, "lon");
});

test("WebP and PNG carry the same block and give the same answer", async () => {
  const exif = { IFD0: { Make: "Test" }, IFD3: GPS };
  for (const data of [await blank().webp().withExif(exif).toBuffer(), await blank().png().withExif(exif).toBuffer()]) {
    const position = readExifPosition(new Uint8Array(data));
    near(position?.lat, LAT, "lat");
    near(position?.lon, LON, "lon");
  }
});

test("the block is found by its signature wherever the container keeps it, as in HEIC", async () => {
  const jpeg = await jpegWith(GPS);
  const start = Buffer.from(jpeg).indexOf("Exif\0\0");
  const block = jpeg.subarray(start);
  // An ISO box of noise in front, as a HEIC file keeps its EXIF item deep in `mdat`.
  const heicLike = new Uint8Array([...Buffer.from("\0\0\0\x18ftypheic\0\0\0\0mif1heic"), ...new Uint8Array(4096), 0, 0, 0, 6, ...block]);
  const position = readExifPosition(heicLike);
  near(position?.lat, LAT, "lat");
  near(position?.lon, LON, "lon");
});

test("a photo without a GPS block has no position — nothing is guessed (02-§11.32)", async () => {
  const withoutGps = new Uint8Array(await blank().jpeg().withExif({ IFD0: { Make: "Test" } }).toBuffer());
  assert.equal(readExifPosition(withoutGps), null);
  const noExif = new Uint8Array(await blank().jpeg().toBuffer());
  assert.equal(readExifPosition(noExif), null);
});

test("a position that a picker has zeroed out instead of removing is no position", async () => {
  const zeroed = await jpegWith({ ...GPS, GPSLatitude: "0/1 0/1 0/1", GPSLongitude: "0/1 0/1 0/1" });
  assert.equal(readExifPosition(zeroed), null);
});

test("a block with only half a position, or a nonsensical one, is no position", async () => {
  assert.equal(readExifPosition(await jpegWith({ GPSLatitudeRef: "N", GPSLatitude: GPS.GPSLatitude })), null);
  assert.equal(readExifPosition(await jpegWith({ ...GPS, GPSLatitude: "95/1 0/1 0/1" })), null);
  assert.equal(readExifPosition(await jpegWith({ ...GPS, GPSLongitude: "12/0 20/1 2713/100" })), null);
});

test("a cut-off or garbled file never throws: the picture is still prepared, just without a position", async () => {
  const jpeg = await jpegWith(GPS);
  for (let length = 0; length < jpeg.length; length += 7) {
    assert.doesNotThrow(() => readExifPosition(jpeg.subarray(0, length)), `cut at ${length}`);
  }
  const garbled = new Uint8Array(jpeg);
  for (let index = 20; index < 200; index += 3) garbled[index] = 0xff;
  assert.doesNotThrow(() => readExifPosition(garbled));
});
