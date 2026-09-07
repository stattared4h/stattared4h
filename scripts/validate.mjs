/**
 * `npm run validate` — validates the dataset in DATA_DIR on its own (02-§6.6).
 *
 * Prints every error and warning in Swedish and exits with code 1 on errors, so an
 * editor can read what to fix in the pull-request log. Image files are checked when
 * the matching image directory exists: `source/images-qa` for the QA dataset,
 * otherwise `source/images`; when neither exists the file checks are skipped.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { defaultDataDir, formatIssue, loadDataset } from "../source/ts/domain/index.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const dataDir = defaultDataDir();

/** The image directory that belongs to `dataDir`, or null when it does not exist yet. */
function imagesDirFor(dir) {
  const candidates = [];
  if (path.resolve(dir) === path.resolve(ROOT, "source", "data-qa")) {
    candidates.push(path.join(ROOT, "source", "images-qa"));
  }
  candidates.push(path.join(ROOT, "source", "images"));
  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

const imagesDir = imagesDirFor(dataDir);
const result = await loadDataset(dataDir, { imagesDir });

for (const warning of result.warnings) console.warn(`Varning: ${formatIssue(warning)}`);
for (const error of result.errors) console.error(`Fel: ${formatIssue(error)}`);

const imagesNote = imagesDir === null ? "; bildfilerna kontrollerades inte" : "";
if (result.dataset === null) {
  console.error(`\nDatat i ${dataDir} har ${result.errors.length} fel${imagesNote}.`);
  process.exit(1);
}

const { species, breeds, populations, animals, locations } = result.dataset;
const countedAnimals = populations.reduce((sum, population) => sum + population.count, 0);
console.log(
  `Datat i ${dataDir} är giltigt: ${animals.length} individer, ${countedAnimals} djur i ` +
    `${populations.length} räknade bestånd, ${locations.length} platser, ` +
    `${species.length} arter, ${breeds.length} raser. ${result.warnings.length} varningar${imagesNote}.`,
);
