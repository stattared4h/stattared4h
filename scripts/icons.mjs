#!/usr/bin/env node
/**
 * Generates the raster icons from source/assets/img/favicon.svg (02-§10.31):
 *
 *   favicon.ico            32 px, a PNG inside a minimal ICO container
 *   apple-touch-icon.png  180 px, for "Lägg till på hemskärmen" in Safari
 *   icon-192.png          192 px, manifest icon
 *   icon-512.png          512 px, manifest icon
 *   icon-maskable-512.png 512 px, full-bleed background with the mark inside the
 *                         safe zone (the centre 80 %), for Android's adaptive icons
 *
 * Run with `npm run icons` after changing the SVG, and commit the results: the files
 * are small and static, so the build does not regenerate them (02-§9.5 keeps the
 * build free of steps nobody needs to repeat).
 */
import { Buffer } from "node:buffer";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const IMG = path.join(ROOT, "source", "assets", "img");
const SVG_SIZE = 64;
const MASKABLE_SAFE_ZONE = 0.8;

/** Renders the SVG at exactly `size` px by scaling the rasteriser's density, never by resizing a bitmap. */
function renderPng(svg, size) {
  return sharp(Buffer.from(svg), { density: (72 * size) / SVG_SIZE }).resize(size, size).png().toBuffer();
}

/** The same mark on a square background, scaled to sit inside the safe zone. */
function maskableSvg(svg) {
  const scale = MASKABLE_SAFE_ZONE;
  const offset = (SVG_SIZE * (1 - scale)) / 2;
  return svg
    .replace(/<rect ([^>]*)rx="[^"]*"/, "<rect $1rx=\"0\"")
    .replace('<g id="hoof"', `<g id="hoof" transform="translate(${offset} ${offset}) scale(${scale})"`);
}

/**
 * A minimal ICO: a 6-byte header, one 16-byte directory entry and a PNG image. ICO has
 * allowed PNG-compressed entries since Windows Vista, and every current browser reads
 * them, so no BMP encoder is needed.
 */
function icoFromPng(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // one image
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size, 0);
  entry.writeUInt8(size, 1);
  entry.writeUInt8(0, 2); // no palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(header.length + entry.length, 12); // offset of the image data
  return Buffer.concat([header, entry, png]);
}

const svg = await readFile(path.join(IMG, "favicon.svg"), "utf8");
const outputs = [
  ["favicon.ico", icoFromPng(await renderPng(svg, 32), 32)],
  ["apple-touch-icon.png", await renderPng(svg, 180)],
  ["icon-192.png", await renderPng(svg, 192)],
  ["icon-512.png", await renderPng(svg, 512)],
  ["icon-maskable-512.png", await renderPng(maskableSvg(svg), 512)],
];
for (const [name, data] of outputs) {
  await writeFile(path.join(IMG, name), data);
  console.log(`${name}: ${data.length} byte`);
}
