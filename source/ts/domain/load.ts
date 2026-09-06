/**
 * Reads a dataset directory into raw, unvalidated records (02-§6.1, 04-§2).
 *
 * Only `*.yaml` files are read; a README.md in the directory is ignored. Missing
 * files and directories are treated as empty, so an empty `source/data/` still builds.
 * Nothing is interpreted here — the validator does that with the file names kept for
 * its messages.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";

/** One YAML file as read from disk. `data` is whatever the parser produced. */
export interface RawRecord {
  /** Path relative to the dataset directory, e.g. "animals/rosa.yaml". */
  file: string;
  /** File name without `.yaml` — the record's id (04-§3.1). */
  id: string;
  data: unknown;
  /** Set when the file could not be parsed as YAML; `data` is then null. */
  parseError: string | null;
}

export interface RawDataset {
  /** The directory the dataset was read from. */
  dir: string;
  /** `species.yaml`, or null when the file does not exist. */
  species: RawRecord | null;
  /** `breeds.yaml`, or null when the file does not exist. */
  breeds: RawRecord | null;
  /** `animals/*.yaml`, sorted by file name. */
  animals: RawRecord[];
  /** `locations/*.yaml`, sorted by file name. */
  locations: RawRecord[];
}

const YAML_SUFFIX = ".yaml";

async function readRecord(dir: string, file: string): Promise<RawRecord> {
  const id = path.basename(file, YAML_SUFFIX);
  const text = await readFile(path.join(dir, file), "utf8");
  try {
    return { file, id, data: parse(text), parseError: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { file, id, data: null, parseError: message };
  }
}

async function readOptionalRecord(dir: string, file: string): Promise<RawRecord | null> {
  try {
    return await readRecord(dir, file);
  } catch (error) {
    if (isMissing(error)) return null;
    throw error;
  }
}

/** All `*.yaml` files directly under `dir/subdir`, sorted; empty when the directory is missing. */
async function readRecordsIn(dir: string, subdir: string): Promise<RawRecord[]> {
  let names: string[];
  try {
    names = await readdir(path.join(dir, subdir));
  } catch (error) {
    if (isMissing(error)) return [];
    throw error;
  }
  const files = names.filter((name) => name.endsWith(YAML_SUFFIX)).sort();
  return Promise.all(files.map((name) => readRecord(dir, path.posix.join(subdir, name))));
}

function isMissing(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

/** Reads `species.yaml`, `breeds.yaml`, `animals/*.yaml` and `locations/*.yaml` from `dir`. */
export async function loadRawDataset(dir: string): Promise<RawDataset> {
  const [species, breeds, animals, locations] = await Promise.all([
    readOptionalRecord(dir, "species.yaml"),
    readOptionalRecord(dir, "breeds.yaml"),
    readRecordsIn(dir, "animals"),
    readRecordsIn(dir, "locations"),
  ]);
  return { dir, species, breeds, animals, locations };
}
