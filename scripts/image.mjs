/**
 * Makes a photo web-ready and adds it to the dataset (02-§8.3, ADR 0008, ADR 0015).
 *
 *   npm run image -- <fil> --alt "<alternativtext>" --credit "<fotograf>"
 *                          [--data-dir <katalog>]
 *
 * Takes JPEG, PNG or WebP, scales to at most 1600 px on the longest side, converts to
 * WebP under 250 KB and strips all metadata (EXIF, XMP, ICC). The id is the hash of the
 * result, so the command writes two files and prints the id to reference:
 *
 *   source/images/<bild-id>.webp          the picture
 *   source/data/images/<bild-id>.yaml     the alt text and the photographer
 *
 * The same photo added twice yields the same id, so a rerun reports the existing image
 * instead of writing a copy.
 *
 * Messages are in Swedish: they are read by the editor adding a photo, not by a
 * developer.
 */
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { stringify } from "yaml";
import { imageFileName, imageIdFor, imagePostFile } from "../source/ts/domain/image-id.ts";
import { MAX_IMAGE_BYTES, MAX_IMAGE_EDGE, imagesDirFor, optimiseImage } from "../source/ts/build/images.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const SUPPORTED = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const USAGE =
  'Användning: npm run image -- <fil> --alt "<alternativtext>" --credit "<fotograf>" ' +
  "[--data-dir <katalog>]";

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseArguments(argv) {
  const options = { alt: undefined, credit: undefined, dataDir: path.join(ROOT, "source", "data"), file: undefined };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--alt") options.alt = argv[++i];
    else if (arg === "--credit") options.credit = argv[++i];
    else if (arg === "--data-dir") options.dataDir = path.resolve(argv[++i]);
    else if (arg.startsWith("--")) fail(`Okänd flagga ${arg}.\n${USAGE}`);
    else if (options.file === undefined) options.file = arg;
    else fail(`Ange bara en fil åt gången.\n${USAGE}`);
  }
  return options;
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

/** Relative to the working directory when that is shorter, absolute when it is not. */
function shownPath(file) {
  const relative = path.relative(process.cwd(), file);
  return relative.startsWith("..") ? file : relative;
}

/** The image post as YAML: two lines, quoted only where the yaml package says it must be. */
function imagePostYaml({ alt, credit }) {
  return stringify({ alt, credit }, { lineWidth: 0 });
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (!options.file) fail(USAGE);
  if (!options.alt) fail(`Ange --alt: en mening som beskriver vad som är viktigt i bilden.\n${USAGE}`);
  if (!options.credit) fail(`Ange --credit: vem som tagit bilden.\n${USAGE}`);

  const inputPath = path.resolve(options.file);
  if (!(await exists(inputPath))) fail(`Hittar inte filen ${options.file}.`);
  if (!SUPPORTED.has(path.extname(inputPath).toLowerCase())) {
    fail(`Filen måste vara JPEG, PNG eller WebP: ${options.file}`);
  }

  let result;
  try {
    result = await optimiseImage(await readFile(inputPath), { maxEdge: MAX_IMAGE_EDGE, maxBytes: MAX_IMAGE_BYTES });
  } catch (error) {
    fail(`Kunde inte omvandla ${options.file}: ${error.message}`);
  }

  const id = imageIdFor(result.data);
  const imagesDir = imagesDirFor(options.dataDir);
  const imagePath = path.join(imagesDir, imageFileName(id));
  const postPath = path.join(options.dataDir, imagePostFile(id));

  if (await exists(imagePath)) {
    // The id comes from the content, so this is the same photo, not a name clash. The
    // alt text and credit given on the command line are not applied: the post already
    // describes this picture, and silently overwriting it would lose someone's wording.
    console.log(
      `Bilden finns redan som ${id} och ingenting skrevs.\n` +
        `Referera den som "${id}". Vill du ändra alt-texten eller fotografen, ` +
        `redigera ${shownPath(postPath)}.`,
    );
    return;
  }

  await mkdir(imagesDir, { recursive: true });
  await mkdir(path.dirname(postPath), { recursive: true });
  await writeFile(imagePath, result.data);
  await writeFile(postPath, imagePostYaml(options));

  console.log(
    `Skrev ${shownPath(imagePath)} ` +
      `(${result.width}×${result.height} px, ${formatKilobytes(result.data.byteLength)}, kvalitet ${result.quality}) ` +
      `och ${shownPath(postPath)}.\n` +
      `Referera bilden som "${id}" under photos hos ett djur eller en plats, eller som photo hos en art.`,
  );
}

await main();
