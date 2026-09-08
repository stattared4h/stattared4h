/**
 * Shared helpers for the domain tests.
 *
 * The tests run against source/data-qa/ (02-§6.10, 06-§2.2). Invalid records are never
 * added to the dataset; they are built in memory by mutating a copy of the raw QA data.
 */
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { loadDataset, validateDataset, type ValidateOptions } from "../../source/ts/domain/index.ts";
import { loadRawDataset, type RawDataset, type RawRecord } from "../../source/ts/domain/load.ts";
import type { Dataset, Issue, ValidationResult } from "../../source/ts/domain/types.ts";

export const ROOT = path.resolve(import.meta.dirname, "..", "..");
export const QA_DIR = path.join(ROOT, "source", "data-qa");
export const PROD_DIR = path.join(ROOT, "source", "data");

/** A fixed "today" so the future-date checks never depend on the clock. */
export const TODAY = new Date("2026-09-06T12:00:00Z");

type Obj = Record<string, unknown>;

let cached: RawDataset | null = null;

/** A deep copy of the raw QA dataset, safe to mutate. */
export async function rawQa(): Promise<RawDataset> {
  cached ??= await loadRawDataset(QA_DIR);
  return structuredClone(cached);
}

/** The validated QA dataset; fails the test if the QA data is not valid. */
export async function qaDataset(): Promise<Dataset> {
  const result = await loadDataset(QA_DIR, { today: TODAY });
  if (result.dataset === null) {
    throw new Error(`QA data is invalid:\n${result.errors.map((e) => `${e.file}: ${e.message}`).join("\n")}`);
  }
  return result.dataset;
}

/** Validates a mutated raw fixture through the same complete contract as the build. */
export async function validate(raw: RawDataset, options: ValidateOptions = {}): Promise<ValidationResult> {
  return validateDataset(raw, { today: TODAY, ...options });
}

function record(records: RawRecord[], id: string): RawRecord {
  const found = records.find((r) => r.id === id);
  if (!found) throw new Error(`no record ${id} in QA data`);
  return found;
}

/** Applies `change` to the raw data of animal `id`. */
export function editAnimal(raw: RawDataset, id: string, change: (data: Obj) => void): void {
  change(record(raw.animals, id).data as Obj);
}

/** Applies `change` to the raw data of location `id`. */
export function editLocation(raw: RawDataset, id: string, change: (data: Obj) => void): void {
  change(record(raw.locations, id).data as Obj);
}

/** Adds a new raw animal file named `<id>.yaml`. */
export function addAnimal(raw: RawDataset, id: string, data: Obj): void {
  raw.animals.push({ file: `animals/${id}.yaml`, id, data, parseError: null });
}

/** Adds a new raw location file named `<id>.yaml`. */
export function addLocation(raw: RawDataset, id: string, data: Obj): void {
  raw.locations.push({ file: `locations/${id}.yaml`, id, data, parseError: null });
}

/** Applies `change` to the raw data of image `id`. */
export function editImage(raw: RawDataset, id: string, change: (data: Obj) => void): void {
  change(record(raw.images, id).data as Obj);
}

/** Applies `change` to the raw data of the clue for image `id` (04-§11.2). */
export function editClue(raw: RawDataset, id: string, change: (data: Obj) => void): void {
  change(record(raw.clues, id).data as Obj);
}

/** Adds a new raw clue named `<id>.yaml`, where the id is the picture's (04-§11.2). */
export function addClue(raw: RawDataset, id: string, data: Obj): void {
  raw.clues.push({ file: `clues/${id}.yaml`, id, data, parseError: null });
}

/** Adds a new raw image post named `<id>.yaml`. */
export function addImage(raw: RawDataset, id: string, data: Obj = { alt: "En bild.", credit: "QA" }): void {
  raw.images.push({ file: `images/${id}.yaml`, id, data, parseError: null });
}

/** The id of image number `index` on animal `id` in the QA data. */
export async function photoId(animalId: string, index = 0): Promise<string> {
  const dataset = await qaDataset();
  const animal = dataset.animals.find((a) => a.id === animalId);
  if (!animal) throw new Error(`no animal ${animalId} in QA data`);
  const photo = animal.photos[index];
  if (!photo) throw new Error(`animal ${animalId} has no photo ${index}`);
  return photo.id;
}

/** The list under `species:` in species.yaml, for mutation. */
export function speciesList(raw: RawDataset): Obj[] {
  return (raw.species?.data as { species: Obj[] }).species;
}

/** The list under `breeds:` in breeds.yaml, for mutation. */
export function breedList(raw: RawDataset): Obj[] {
  return (raw.breeds?.data as { breeds: Obj[] }).breeds;
}

/** The errors that mention `file` (and `field`, when given). */
export function errorsFor(result: ValidationResult, file: string, field?: string): Issue[] {
  return result.errors.filter((e) => e.file === file && (field === undefined || e.field === field));
}

/** A fresh temporary directory under os.tmpdir(). */
export async function tempDir(prefix: string): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), `${prefix}-`));
}

/** Writes `content` to `dir/relative`, creating parent directories. */
export async function writeInto(dir: string, relative: string, content: string | Uint8Array): Promise<void> {
  const fullPath = path.join(dir, relative);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, content);
}
