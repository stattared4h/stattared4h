/**
 * The domain layer's front door: read, validate and hand over a Dataset.
 *
 * `loadDataset` returns every error and warning; `loadValidDataset` is what the build
 * calls — it throws on errors (02-§6.2) and prints warnings, all in Swedish (02-§6.5).
 * The dataset directory comes from DATA_DIR, `source/data` by default (06-§2.1).
 */
import { loadRawDataset, type RawDataset, type RawRecord } from "./load.ts";
import { isPublicIdFormat, normalisePublicId } from "./public-id.ts";
import { formatIssue, validateDataset as validateCoreDataset, type ValidateOptions } from "./validate.ts";
import type { Dataset, Issue, ValidationResult } from "./types.ts";

export type * from "./types.ts";
export type { RawDataset, RawRecord } from "./load.ts";
export { loadRawDataset } from "./load.ts";
export { formatIssue, MAX_IMAGE_BYTES, MAX_IMAGE_SIDE, type ValidateOptions } from "./validate.ts";
export { formatBorn, normaliseBorn, type BornResult } from "./born.ts";
export { isPublicIdFormat, normalisePublicId } from "./public-id.ts";
export { compareByName, sortAnimals, sortLocations } from "./sort.ts";
export { definitePlural, joinSwedish, lowerFirst } from "./swedish.ts";
export * from "./derive.ts";

/** The dataset directory for this build: DATA_DIR, or `source/data`. */
export function defaultDataDir(): string {
  return process.env.DATA_DIR ?? "source/data";
}

interface PublicIdRead {
  stripped: RawDataset;
  values: Map<string, string>;
  errors: Issue[];
}

/**
 * Validates the additive visitor-facing `publicId` field before the core contract
 * validator runs. The core validator stays strict about unknown legacy fields while
 * this front door owns the complete current public dataset contract.
 */
function readPublicIds(raw: RawDataset): PublicIdRead {
  const values = new Map<string, string>();
  const normalised = new Map<string, string>();
  const errors: Issue[] = [];
  const animals: RawRecord[] = raw.animals.map((record) => {
    if (record.parseError !== null || typeof record.data !== "object" || record.data === null || Array.isArray(record.data)) {
      return record;
    }
    const data = { ...(record.data as Record<string, unknown>) };
    const value = data.publicId;
    delete data.publicId;
    if (value === undefined || value === null) return { ...record, data };
    if (typeof value !== "string" || value.trim() === "" || !isPublicIdFormat(value)) {
      errors.push({
        file: record.file,
        field: "publicId",
        message:
          "måste vara ett publikt id med bokstäver och siffror; mellanslag och bindestreck får användas som avskiljare.",
      });
      return { ...record, data };
    }
    const key = normalisePublicId(value);
    const previous = normalised.get(key);
    if (previous !== undefined) {
      errors.push({
        file: record.file,
        field: "publicId",
        message: `${JSON.stringify(value)} används redan av ${previous}. Varje publikt djur-id måste vara unikt även om mellanslag eller bindestreck skrivs olika.`,
      });
    } else {
      normalised.set(key, record.file);
      values.set(record.id, value);
    }
    return { ...record, data };
  });
  return { stripped: { ...raw, animals }, values, errors };
}

/** Validates and normalises an already loaded dataset against the complete contract. */
export async function validateDataset(raw: RawDataset, options: ValidateOptions = {}): Promise<ValidationResult> {
  const publicIds = readPublicIds(raw);
  const result = await validateCoreDataset(publicIds.stripped, options);
  const errors = [...result.errors, ...publicIds.errors];
  if (result.dataset === null || errors.length > 0) return { ...result, errors, dataset: null };
  const animals = result.dataset.animals.map((animal) => ({
    ...animal,
    publicId: publicIds.values.get(animal.id) ?? null,
  }));
  return { ...result, errors, dataset: { ...result.dataset, animals } };
}

/** Reads and validates the dataset in `dir`. Never throws on data errors. */
export async function loadDataset(dir: string = defaultDataDir(), options: ValidateOptions = {}): Promise<ValidationResult> {
  return validateDataset(await loadRawDataset(dir), options);
}

/**
 * Reads the dataset in `dir` and returns it, or throws an Error whose message lists
 * every problem, one per line. Warnings go to `console.warn`.
 */
export async function loadValidDataset(dir: string = defaultDataDir(), options: ValidateOptions = {}): Promise<Dataset> {
  const result = await loadDataset(dir, options);
  for (const warning of result.warnings) console.warn(`Varning: ${formatIssue(warning)}`);
  if (result.dataset === null) {
    const lines = result.errors.map(formatIssue);
    throw new Error(`Datat i ${dir} har ${lines.length} fel:\n${lines.join("\n")}`);
  }
  return result.dataset;
}
