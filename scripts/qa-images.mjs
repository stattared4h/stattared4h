/**
 * Generates the placeholder images the QA dataset refers to (02-§8.4).
 *
 *   npm run qa:images [-- --data-dir <dir>] [--images-dir <dir>]
 *
 * Reads the `photos[].file` of every animal and the `photo.file` of every species in
 * source/data-qa/ and writes a flat-coloured 1200×900 WebP with the record's name for
 * each one into source/images-qa/. That directory is ignored by git: made-up photographs
 * are never committed (ADR 0008), and QA images never mix with the farm's real ones
 * because the images directory follows the dataset (04-§9.4).
 *
 * Idempotent: a file that already exists is left alone, so a rerun is instant.
 */
import { Buffer } from "node:buffer";
import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { parse } from "yaml";
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

/** Every image the dataset refers to: `{ kind, file, title }`. */
async function collectImages(dataDir) {
  const images = [];

  const animalsDir = path.join(dataDir, "animals");
  for (const entry of (await readdir(animalsDir)).filter((f) => f.endsWith(".yaml")).sort()) {
    const animal = await readYaml(path.join(animalsDir, entry));
    for (const photo of animal.photos ?? []) {
      if (photo?.file) images.push({ kind: "animals", file: photo.file, title: animal.name });
    }
  }

  const speciesFile = path.join(dataDir, "species.yaml");
  if (await exists(speciesFile)) {
    const { species = [] } = await readYaml(speciesFile);
    for (const entry of species) {
      if (entry.photo?.file) images.push({ kind: "species", file: entry.photo.file, title: entry.name });
    }
  }

  return images;
}

function escapeXml(text) {
  return String(text).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function placeholderSvg({ title, file }, colours) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">` +
    `<rect width="100%" height="100%" fill="${colours.background}"/>` +
    `<text x="50%" y="50%" font-family="sans-serif" font-size="120" font-weight="bold" ` +
    `fill="${colours.text}" text-anchor="middle" dominant-baseline="middle">${escapeXml(title)}</text>` +
    `<text x="50%" y="70%" font-family="sans-serif" font-size="48" ` +
    `fill="${colours.text}" text-anchor="middle">${escapeXml(file)}</text>` +
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

  for (const kind of ["animals", "species", "places"]) {
    await mkdir(path.join(imagesDir, kind), { recursive: true });
  }

  let written = 0;
  let skipped = 0;
  for (const image of images) {
    const outputPath = path.join(imagesDir, image.kind, image.file);
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
