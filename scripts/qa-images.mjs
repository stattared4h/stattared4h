/**
 * Imports generated QA images or fills missing files with placeholders (02-§8.4, 8.23).
 *
 *   npm run qa:images [-- --import <dir>] [--data-dir <dir>] [--images-dir <dir>]
 *
 * Generated inputs are cropped, permanently marked and compressed into source/images-qa/.
 * Without --import, every missing image post instead gets a flat-coloured 1200×900 WebP
 * with its alt text. QA images never mix with the farm's real ones because the images
 * directory follows the dataset (04-§9.4, ADR 0017).
 *
 * The placeholders are named after the ids already in the data, never re-hashed: sharp
 * may encode the same SVG differently after an upgrade, and the committed ids must not
 * move when it does (04-§9.10).
 *
 * Idempotent: a file that already exists is left alone, so a rerun is instant.
 */
import { Buffer } from "node:buffer";
import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { parse } from "yaml";
import { imageFileName, isImageId } from "../source/ts/domain/image-id.ts";
import { SOURCE_EXTENSIONS, imagesDirFor, optimiseImage } from "../source/ts/build/images.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const WIDTH = 1200;
const HEIGHT = 900;
const MAX_BYTES = 50 * 1024;
const IMPORT_EDGES = [1200, 1000, 800, 640, 480];

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseArguments(argv) {
  const options = { dataDir: path.join(ROOT, "source", "data-qa"), imagesDir: undefined, importDir: undefined };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--data-dir") options.dataDir = path.resolve(argv[++i]);
    else if (arg === "--images-dir") options.imagesDir = path.resolve(argv[++i]);
    else if (arg === "--import") options.importDir = path.resolve(argv[++i]);
    else fail(`Okänd flagga ${arg}. Användning: npm run qa:images [-- --data-dir <katalog>] [--images-dir <katalog>]`);
  }
  options.imagesDir ??= imagesDirFor(options.dataDir);
  return options;
}

/**
 * The placeholder colours are the design tokens for a pale green plate with deep green
 * text (05-§6.20), read from tokens.css so the two never drift apart.
 */
async function readColours() {
  const css = await readFile(path.join(ROOT, "source", "assets", "css", "tokens.css"), "utf8");
  const token = (name) => {
    const match = new RegExp(`${name}\\s*:\\s*(#[0-9a-f]{6})`).exec(css);
    if (!match) fail(`Hittar inte ${name} i tokens.css.`);
    return match[1];
  };
  return {
    background: token("--color-green-pale"),
    text: token("--color-green-deep"),
    surface: token("--color-surface"),
  };
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function readYaml(file) {
  return parse(await readFile(file, "utf8"));
}

/** Every image post in the dataset: `{ id, alt }`, sorted by id. */
async function collectImages(dataDir) {
  const imagesDir = path.join(dataDir, "images");
  let entries;
  try {
    entries = await readdir(imagesDir);
  } catch {
    return [];
  }
  const images = [];
  for (const entry of entries.filter((name) => name.endsWith(".yaml")).sort()) {
    const post = await readYaml(path.join(imagesDir, entry));
    images.push({ id: path.basename(entry, ".yaml"), alt: post?.alt ?? "" });
  }
  return images;
}

function escapeXml(text) {
  return String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

const TEXT_SIZE = 56;
/**
 * Characters that fit on a line, at roughly 0.62 em per character for bold sans-serif,
 * across 90 % of the width so the text never touches the edge. Approximate on purpose:
 * SVG cannot measure text, and this is a placeholder, not a layout.
 */
const CHARS_PER_LINE = Math.floor((WIDTH * 0.9) / (TEXT_SIZE * 0.62));

/** Greedy word wrap. SVG has no text flow, so the lines are worked out here. */
function wrap(text, width) {
  const lines = [];
  let line = "";
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    const candidate = line === "" ? word : `${line} ${word}`;
    if (candidate.length > width && line !== "") {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line !== "") lines.push(line);
  return lines.length === 0 ? [""] : lines;
}

/**
 * The alt text wrapped across the middle with the id underneath, so a QA page shows
 * which picture is which. Long alt texts are what made the wrapping necessary: they are
 * whole sentences now that they live in the image post.
 */
function placeholderSvg({ id, alt }, colours) {
  const lines = wrap(alt, CHARS_PER_LINE);
  const step = TEXT_SIZE * 1.25;
  const start = HEIGHT / 2 - ((lines.length - 1) * step) / 2;
  const text = lines
    .map(
      (line, index) =>
        `<text x="50%" y="${Math.round(start + index * step)}" font-family="sans-serif" ` +
        `font-size="${TEXT_SIZE}" font-weight="bold" fill="${colours.text}" ` +
        `text-anchor="middle" dominant-baseline="middle">${escapeXml(line)}</text>`,
    )
    .join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">` +
    `<rect width="100%" height="100%" fill="${colours.background}"/>` +
    text +
    `<text x="50%" y="85%" font-family="sans-serif" font-size="36" ` +
    `fill="${colours.text}" text-anchor="middle">${escapeXml(id)}</text>` +
    `</svg>`
  );
}

function badgeSvg(edge, colours) {
  const width = Math.round(edge * 0.25);
  const height = Math.round(edge * 0.065);
  const fontSize = Math.round(edge * 0.024);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
      `<rect width="100%" height="100%" rx="${Math.round(height * 0.18)}" fill="${colours.text}"/>` +
      `<text x="50%" y="52%" font-family="sans-serif" font-size="${fontSize}" font-weight="bold" ` +
      `fill="${colours.surface}" text-anchor="middle" dominant-baseline="middle">AI-bild · QA</text>` +
      `</svg>`,
  );
}

async function markedImage(input, edge, colours) {
  const height = Math.round((edge * 3) / 4);
  return sharp(input)
    .rotate()
    .resize({ width: edge, height, fit: "cover", position: "attention" })
    .composite([{ input: badgeSvg(edge, colours), gravity: "southeast" }])
    .png()
    .toBuffer();
}

async function prepareGeneratedImage(input, colours) {
  let lastError;
  for (const edge of IMPORT_EDGES) {
    try {
      const marked = await markedImage(input, edge, colours);
      return await optimiseImage(marked, { maxEdge: edge, maxBytes: MAX_BYTES });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function importGenerated(importDir, dataDir, imagesDir, images, colours) {
  let entries;
  try {
    entries = await readdir(importDir, { withFileTypes: true });
  } catch {
    fail(`Hittar inte katalogen ${importDir}.`);
  }

  const known = new Set(images.map((image) => image.id));
  const seen = new Set();
  const sources = [];
  const issues = [];
  for (const entry of entries.filter((candidate) => candidate.isFile()).sort((a, b) => a.name.localeCompare(b.name))) {
    const extension = path.extname(entry.name).toLowerCase();
    const id = path.basename(entry.name, extension);
    if (!SOURCE_EXTENSIONS.includes(extension)) {
      issues.push(`${entry.name}: filen måste vara JPEG, PNG eller WebP.`);
    } else if (!isImageId(id)) {
      issues.push(`${entry.name}: filnamnet måste vara ett bild-id följt av filändelsen.`);
    } else if (!known.has(id)) {
      issues.push(`${entry.name}: okänt bild-id ${id}; det saknar bildpost i ${path.join(dataDir, "images")}.`);
    } else if (seen.has(id)) {
      issues.push(`${entry.name}: bild-id ${id} finns i flera källfiler.`);
    } else {
      seen.add(id);
      sources.push({ id, file: path.join(importDir, entry.name) });
    }
  }
  if (sources.length === 0 && issues.length === 0) issues.push(`${importDir}: katalogen innehåller inga bilder.`);
  if (issues.length > 0) fail(`Importen har ${issues.length} fel. Ingenting skrevs.\n${issues.join("\n")}`);

  const prepared = [];
  let existing = 0;
  const failures = [];
  for (const source of sources) {
    const outputPath = path.join(imagesDir, imageFileName(source.id));
    if (await exists(outputPath)) {
      existing += 1;
      continue;
    }
    try {
      const input = await readFile(source.file);
      const result = await prepareGeneratedImage(input, colours);
      prepared.push({ outputPath, data: result.data });
    } catch (error) {
      failures.push(`${path.basename(source.file)}: ${error.message}`);
    }
  }
  if (failures.length > 0) fail(`${failures.length} bilder gick inte att bereda. Ingenting skrevs.\n${failures.join("\n")}`);

  await mkdir(imagesDir, { recursive: true });
  for (const image of prepared) await writeFile(image.outputPath, image.data);
  const noun = prepared.length === 1 ? "AI-bild" : "AI-bilder";
  console.log(`Importerade ${prepared.length} ${noun} (${existing} fanns redan).`);
}

async function main() {
  const { dataDir, imagesDir, importDir } = parseArguments(process.argv.slice(2));

  if (path.basename(dataDir) === "data" || path.basename(imagesDir) === "images") {
    fail(`Vägrar skriva QA-bilder till ${imagesDir}: där ligger gårdens riktiga bilder.`);
  }

  const colours = await readColours();
  const images = await collectImages(dataDir);

  if (importDir !== undefined) {
    await importGenerated(importDir, dataDir, imagesDir, images, colours);
    return;
  }

  await mkdir(imagesDir, { recursive: true });

  let written = 0;
  let skipped = 0;
  for (const image of images) {
    const outputPath = path.join(imagesDir, imageFileName(image.id));
    if (await exists(outputPath)) {
      skipped += 1;
      continue;
    }
    const data = await sharp(Buffer.from(placeholderSvg(image, colours)))
      .webp({ quality: 80 })
      .toBuffer();
    await writeFile(outputPath, data);
    written += 1;
  }

  const shownDir = path.relative(process.cwd(), imagesDir) || ".";
  console.log(`Skapade ${written} platshållare i ${shownDir}/ (${skipped} fanns redan).`);
}

await main();
