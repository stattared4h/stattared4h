/**
 * Makes a photo web-ready and puts it where the site expects it (02-§8.3, ADR 0008).
 *
 *   npm run image -- <file> [--to animals|species|places|content] [--name <id-prefix>]
 *                          [--force] [--images-dir <dir>]
 *
 * Takes JPEG, PNG or WebP, scales to at most 1600 px on the longest side, converts to
 * WebP under 250 KB and strips all metadata (EXIF, XMP, ICC). Writes to
 * source/images/<kind>/<name>.webp and refuses to overwrite without --force.
 *
 * Messages are in Swedish: they are read by the editor adding a photo, not by a
 * developer.
 */
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { IMAGE_KINDS, MAX_IMAGE_BYTES, MAX_IMAGE_EDGE, optimiseImage } from "../source/ts/build/images.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const SUPPORTED = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const USAGE =
  "Användning: npm run image -- <fil> [--to animals|species|places|content] " +
  "[--name <namn>] [--force] [--images-dir <katalog>]";

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseArguments(argv) {
  const options = { to: "animals", name: undefined, force: false, imagesDir: undefined, file: undefined };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--to") options.to = argv[++i];
    else if (arg === "--name") options.name = argv[++i];
    else if (arg === "--images-dir") options.imagesDir = argv[++i];
    else if (arg === "--force") options.force = true;
    else if (arg.startsWith("--")) fail(`Okänd flagga ${arg}.\n${USAGE}`);
    else if (options.file === undefined) options.file = arg;
    else fail(`Ange bara en fil åt gången.\n${USAGE}`);
  }
  return options;
}

/** `Lilla Gumman.JPG` → `lilla-gumman`. Mirrors the id rule in 04-§3. */
function slugify(text) {
  return text
    .toLowerCase()
    .replaceAll(/[åä]/g, "a")
    .replaceAll("ö", "o")
    .replaceAll(/[éè]/g, "e")
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

function formatKilobytes(bytes) {
  return `${Math.round(bytes / 1024)} KB`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (!options.file) fail(USAGE);

  if (!IMAGE_KINDS.includes(options.to)) {
    fail(`Okänd katalog "${options.to}". Välj ${IMAGE_KINDS.join(", ")}.`);
  }

  const inputPath = path.resolve(options.file);
  if (!(await exists(inputPath))) fail(`Hittar inte filen ${options.file}.`);
  if (!SUPPORTED.has(path.extname(inputPath).toLowerCase())) {
    fail(`Filen måste vara JPEG, PNG eller WebP: ${options.file}`);
  }

  const name = options.name ?? slugify(path.basename(inputPath, path.extname(inputPath)));
  if (!NAME_PATTERN.test(name)) {
    fail(`Namnet "${name}" får bara innehålla små bokstäver a–z, siffror och bindestreck.`);
  }

  const imagesDir = path.resolve(options.imagesDir ?? path.join(ROOT, "source", "images"));
  const targetDir = path.join(imagesDir, options.to);
  const outputPath = path.join(targetDir, `${name}.webp`);
  const shownPath = path.relative(process.cwd(), outputPath);

  if (!options.force && (await exists(outputPath))) {
    fail(`${shownPath} finns redan. Använd --force för att skriva över.`);
  }

  let result;
  try {
    result = await optimiseImage(await readFile(inputPath), { maxEdge: MAX_IMAGE_EDGE, maxBytes: MAX_IMAGE_BYTES });
  } catch (error) {
    fail(`Kunde inte omvandla ${options.file}: ${error.message}`);
  }

  await mkdir(targetDir, { recursive: true });
  await writeFile(outputPath, result.data);
  console.log(
    `Skrev ${shownPath} (${result.width}×${result.height} px, ` +
      `${formatKilobytes(result.data.byteLength)}, kvalitet ${result.quality}). ` +
      `Referera filen som "${name}.webp" i YAML.`,
  );
}

await main();
