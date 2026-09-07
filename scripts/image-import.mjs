/**
 * Bulk image import (02-§8.14–8.20).
 *
 * Two steps, with the editor's own work in between:
 *
 *   npm run image:import -- --scan ~/Bilder/gard [--out bilder.csv]
 *   # fill in post, alt and fotograf in bilder.csv
 *   npm run image:import -- bilder.csv --photos ~/Bilder/gard [--data-dir source/data]
 *
 * The first step writes a table with one row per photo, because a camera file name says
 * nothing about the subject and a hundred of them are not typed out by hand. The second
 * prepares every photo the way `npm run image` does, writes the image posts, and prints
 * the ids grouped by record, ready to paste into `photos:`.
 *
 * The import never touches the animals', locations' or species' files: where a picture
 * belongs is the editor's call, not the command's.
 *
 * It is all or nothing. Every row is checked, and every photo read and converted, before
 * the first file is written — a half-finished import is worse than none.
 *
 * Messages are in Swedish: they are read by the editor, not by a developer.
 */
import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { stringify } from "yaml";
import {
  formatIdsByPost,
  formatIssue,
  planImport,
  templateCsv,
} from "./lib/image-import.ts";
import { imageFileName, imageIdFor, imagePostFile } from "../source/ts/domain/image-id.ts";
import {
  MAX_IMAGE_BYTES,
  MAX_IMAGE_EDGE,
  SOURCE_EXTENSIONS,
  imagesDirFor,
  optimiseImage,
} from "../source/ts/build/images.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const DEFAULT_TABLE = "bilder.csv";

const USAGE = [
  "Användning:",
  "  npm run image:import -- --scan <fotokatalog> [--out <tabell>]",
  "  npm run image:import -- <tabell> --photos <fotokatalog> [--data-dir <datakatalog>]",
].join("\n");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseArguments(argv) {
  const options = {
    scan: undefined,
    out: undefined,
    photos: undefined,
    dataDir: path.join(ROOT, "source", "data"),
    table: undefined,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--scan") options.scan = argv[++i];
    else if (arg === "--out") options.out = argv[++i];
    else if (arg === "--photos") options.photos = argv[++i];
    else if (arg === "--data-dir") options.dataDir = path.resolve(argv[++i]);
    else if (arg.startsWith("--")) fail(`Okänd flagga ${arg}.\n${USAGE}`);
    else if (options.table === undefined) options.table = arg;
    else fail(`Ange bara en tabell åt gången.\n${USAGE}`);
  }
  return options;
}

/** Relative to the working directory when that is shorter, absolute when it is not. */
function shownPath(file) {
  const relative = path.relative(process.cwd(), file);
  return relative.startsWith("..") ? file : relative;
}

/** The images directory for a dataset, with the failure phrased for an editor, not a developer. */
function imagesDirOrFail(dataDir) {
  try {
    return imagesDirFor(dataDir);
  } catch {
    fail(
      `Kan inte räkna ut bildkatalogen ur ${shownPath(dataDir)}: datakatalogen måste heta ` +
        '"data" eller "data-" och något, som source/data eller source/data-qa.',
    );
  }
}

/** Every photo directly in `dir`, by extension. Other files are left alone. */
async function listPhotos(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    fail(`Hittar inte katalogen ${dir}.`);
  }
  return entries
    .filter((entry) => entry.isFile() && SOURCE_EXTENSIONS.includes(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name);
}

async function scan(options) {
  const photoDir = path.resolve(options.scan);
  const files = await listPhotos(photoDir);
  if (files.length === 0) fail(`Hittar inga bilder i ${shownPath(photoDir)}. Bilder är ${SOURCE_EXTENSIONS.join(", ")}.`);

  const outPath = path.resolve(options.out ?? DEFAULT_TABLE);
  await writeFile(outPath, templateCsv(files));
  console.log(
    `Skrev ${shownPath(outPath)} med ${files.length} rader.\n` +
      "Fyll i post, alt och fotograf för varje bild, och kör sedan:\n" +
      `  npm run image:import -- ${shownPath(outPath)} --photos ${shownPath(photoDir)}`,
  );
}

async function importTable(options) {
  if (!options.photos) fail(`Ange --photos: katalogen där fotona ligger.\n${USAGE}`);
  const tablePath = path.resolve(options.table);
  const photoDir = path.resolve(options.photos);

  let text;
  try {
    text = await readFile(tablePath, "utf8");
  } catch {
    fail(`Hittar inte tabellen ${options.table}.`);
  }

  // A spreadsheet saves its own format unless told otherwise, and that file is a zip.
  if (text.includes("\u0000") || text.startsWith("PK\u0003\u0004")) {
    fail(
      `${shownPath(tablePath)} är inte en textfil. Öppna tabellen i kalkylprogrammet och ` +
        'välj "Spara som" med formatet CSV.',
    );
  }

  const plan = planImport(text);
  if (plan.issues.length > 0) {
    // The photos are not read yet, and saying so keeps a second round of errors from
    // coming as a surprise: reading a hundred files takes a while, and doing it for a
    // table that is already wrong wastes the editor's time.
    console.error(
      `${shownPath(tablePath)} har ${plan.issues.length} fel. Ingenting skrevs, ` +
        "och fotona är inte kontrollerade än.\n",
    );
    for (const issue of plan.issues) console.error(formatIssue(issue));
    process.exit(1);
  }

  // Read and convert everything first, so a photo that is missing or unreadable stops
  // the run before any file is written (02-§8.16).
  const prepared = [];
  const failures = [];
  for (const row of plan.rows) {
    const photoPath = path.join(photoDir, row.file);
    let data;
    try {
      data = await readFile(photoPath);
    } catch {
      failures.push(`rad ${row.line}: hittar inte ${row.file} i ${shownPath(photoDir)}.`);
      continue;
    }
    try {
      const result = await optimiseImage(data, { maxEdge: MAX_IMAGE_EDGE, maxBytes: MAX_IMAGE_BYTES });
      prepared.push({ row, id: imageIdFor(result.data), data: result.data });
    } catch (error) {
      failures.push(`rad ${row.line}: kunde inte omvandla ${row.file}: ${error.message}`);
    }
  }

  if (failures.length > 0) {
    console.error(`${failures.length} bilder gick inte att läsa. Ingenting skrevs.\n`);
    for (const failure of failures) console.error(failure);
    process.exit(1);
  }

  const imagesDir = imagesDirOrFail(options.dataDir);
  const postsDir = path.join(options.dataDir, "images");
  await mkdir(imagesDir, { recursive: true });
  await mkdir(postsDir, { recursive: true });

  let written = 0;
  let existing = 0;
  for (const { row, id, data } of prepared) {
    const imagePath = path.join(imagesDir, imageFileName(id));
    const postPath = path.join(options.dataDir, imagePostFile(id));
    // The id is the content's hash, so an existing file is the same photo (02-§8.20).
    if (await exists(imagePath)) {
      existing += 1;
      continue;
    }
    await writeFile(imagePath, data);
    await writeFile(postPath, stringify({ alt: row.alt, credit: row.credit }, { lineWidth: 0 }));
    written += 1;
  }

  const ids = formatIdsByPost(prepared.map(({ row, id }) => ({ post: row.post, id })));
  const summary =
    written === 0
      ? `Alla ${existing} bilder fanns redan; ingenting skrevs.`
      : `Skrev ${written} ${written === 1 ? "bild" : "bilder"} till ${shownPath(imagesDir)} och ` +
        `lika många bildposter till ${shownPath(postsDir)}` +
        (existing === 0 ? "." : `. ${existing} fanns redan.`);
  console.log(`${summary}\n\nKlistra in id:na under photos i respektive fil:\n\n${ids}`);
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.scan !== undefined) {
    if (options.table !== undefined) fail(`--scan tar ingen tabell; den skriver en.\n${USAGE}`);
    await scan(options);
    return;
  }
  if (options.table === undefined) fail(USAGE);
  await importTable(options);
}

await main();
