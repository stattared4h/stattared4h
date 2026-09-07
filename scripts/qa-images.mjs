/**
 * Generates the placeholder images the QA dataset refers to (02-§8.4).
 *
 *   npm run qa:images [-- --data-dir <dir>] [--images-dir <dir>]
 *
 * Reads every image post in source/data-qa/images/ and writes a flat-coloured 1200×900
 * WebP with its alt text into source/images-qa/, flat and named by the id (04-§9.1).
 * That directory is ignored by git: made-up photographs are never committed (ADR 0008),
 * and QA images never mix with the farm's real ones because the images directory follows
 * the dataset (04-§9.4).
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
import { imageFileName } from "../source/ts/domain/image-id.ts";
import { imagesDirFor } from "../source/ts/build/images.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const WIDTH = 1200;
const HEIGHT = 900;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseArguments(argv) {
  const options = { dataDir: path.join(ROOT, "source", "data-qa"), imagesDir: undefined };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--data-dir") options.dataDir = path.resolve(argv[++i]);
    else if (arg === "--images-dir") options.imagesDir = path.resolve(argv[++i]);
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
  return { background: token("--color-green-pale"), text: token("--color-green-deep") };
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

async function main() {
  const { dataDir, imagesDir } = parseArguments(process.argv.slice(2));

  if (path.basename(imagesDir) === "images") {
    fail(`Vägrar skriva platshållare till ${imagesDir}: där ligger gårdens riktiga bilder.`);
  }

  const colours = await readColours();
  const images = await collectImages(dataDir);

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
