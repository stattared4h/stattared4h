/**
 * The domain layer's front door: read, validate and hand over a Dataset.
 *
 * `loadDataset` returns every error and warning; `loadValidDataset` is what the build
 * calls — it throws on errors (02-§6.2) and prints warnings, all in Swedish (02-§6.5).
 * The dataset directory comes from DATA_DIR, `source/data` by default (06-§2.1).
 */
import { loadRawDataset } from "./load.ts";
import { formatIssue, validateDataset, type ValidateOptions } from "./validate.ts";
import type { Dataset, ValidationResult } from "./types.ts";

export type * from "./types.ts";
export type { RawDataset, RawRecord } from "./load.ts";
export { loadRawDataset } from "./load.ts";
export { formatIssue, validateDataset, MAX_IMAGE_BYTES, MAX_IMAGE_SIDE, type ValidateOptions } from "./validate.ts";
export { formatBorn, normaliseBorn, type BornResult } from "./born.ts";
export { compareByName, sortAnimals, sortLocations } from "./sort.ts";
export * from "./derive.ts";

/** The dataset directory for this build: DATA_DIR, or `source/data`. */
export function defaultDataDir(): string {
  return process.env.DATA_DIR ?? "source/data";
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
