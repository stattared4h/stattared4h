/**
 * Validates a raw dataset against the data contract (04-§10, 02-§6.3–6.5, 02-§8.2).
 *
 * Errors fail the build; warnings are printed and tolerated. Every message is Swedish
 * and names the file, the field and what to change, because the reader is an editor
 * looking at a pull-request log, not a developer.
 *
 * The validator also normalises: `born` becomes "YYYY-MM-DD" or "YYYY", missing
 * optional fields become null or [], and the resulting Dataset is sorted (02-§6.9).
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { normaliseBorn } from "./born.ts";
import { MAX_CLUE_TEXT_LENGTH } from "./clue-post.ts";
import {
  IMAGE_ID_DESCRIPTION,
  IMAGE_SUFFIX,
  imageFileName,
  imageIdFromFileName,
  imagePostFile,
  isImageId,
} from "./image-id.ts";
import { MAX_IMAGE_BYTES, MAX_IMAGE_EDGE } from "./image-limits.ts";
import { HTML_PATTERN } from "./plain-text.ts";
import type { RawDataset, RawRecord } from "./load.ts";
import { sortAnimals, sortLocations } from "./sort.ts";
import type {
  Animal,
  Breed,
  Clue,
  LabelPlacement,
  Dataset,
  Image,
  Issue,
  Location,
  LocationKind,
  Population,
  Sex,
  Species,
  Status,
  ValidationResult,
} from "./types.ts";
import { inspectWebp } from "./webp.ts";

export interface ValidateOptions {
  /**
   * The flat images directory (04-§9.1). When given, every image post's file is checked
   * on disk; when null or omitted, file checks are skipped.
   */
  imagesDir?: string | null;
  /** "Today" for the future-date check on `born`; defaults to the real date. */
  today?: Date;
  /**
   * Markdown that lives outside the dataset and may reference images — the content
   * pages under `source/content/` (02-§8.12). Without it an image used only by a
   * content page would be reported as unused, and the warning would stop being worth
   * reading. The dataset's own Markdown fields are always checked.
   */
  markdown?: readonly MarkdownSource[];
}

/** One Markdown text to scan for image references. `file` is shown in messages. */
export interface MarkdownSource {
  file: string;
  text: string;
}

/** A `MarkdownSource` that came from a field of a record, so messages can name it. */
interface MarkdownField extends MarkdownSource {
  field?: string | null;
}


/** 04-§3.2: lowercase a–z, digits and single hyphens between groups. */
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** 04-§10.9: anything that looks like the start of an HTML tag, comment or doctype. */
/** A Markdown image, `![](img-a3f2c1d8b901)`. The address is checked with `isImageId`. */
const MARKDOWN_IMAGE_PATTERN = /!\[[^\]]*\]\(([^)\s]*)\)/g;
const IMAGE_FIELDS = new Set(["alt", "credit", "animals", "locations", "species"]);

const SEXES: readonly Sex[] = ["female", "male", "unknown"];
const STATUSES: readonly Status[] = ["here", "gone"];
const LOCATION_KINDS: readonly LocationKind[] = ["djurplats", "mat", "grill", "toalett", "parkering", "lek", "boende", "husbil"];
const LABEL_PLACEMENTS: readonly LabelPlacement[] = ["under", "over", "hoger", "vanster"];

const ANIMAL_FIELDS = new Set([
  "name",
  "species",
  "breed",
  "sex",
  "born",
  "mother",
  "father",
  "status",
  "description",
  "portrait",
]);
const LOCATION_FIELDS = new Set([
  "name",
  "shortName",
  "kind",
  "species",
  "note",
  "description",
  "lat",
  "lon",
  "accessible",
  "active",
  "label",
  "portrait",
]);
const CLUE_FIELDS = new Set(["location", "text"]);
const SPECIES_FIELDS = new Set(["id", "name", "plural", "portrait"]);
const BREED_FIELDS = new Set(["id", "name", "species", "heritage"]);
const POPULATION_FIELDS = new Set(["species", "breed", "count"]);

type Obj = Record<string, unknown>;

function isObject(value: unknown): value is Obj {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function quote(value: unknown): string {
  return JSON.stringify(value);
}

/** Collects errors and warnings in the order they are found. */
class Issues {
  readonly errors: Issue[] = [];
  readonly warnings: Issue[] = [];

  error(file: string, field: string | null, message: string): void {
    this.errors.push({ file, field, message });
  }

  warn(file: string, field: string | null, message: string): void {
    this.warnings.push({ file, field, message });
  }
}

/**
 * The ids in `species.yaml` as they stand in the file, before validation drops any
 * entry. `attachPhotos` needs them so a broken species entry fails once, on itself.
 */
function readSpeciesIds(record: RawRecord | null): Set<string> {
  const entries = (record?.data as { species?: unknown } | undefined)?.species;
  if (!Array.isArray(entries)) return new Set();
  const ids = entries.filter(isObject).map((entry) => entry.id);
  return new Set(ids.filter((id): id is string => typeof id === "string"));
}

/** Formats an issue the way the CLI and the build print it: `file: fältet x: message`. */
export function formatIssue(issue: Issue): string {
  const field = issue.field === null ? "" : `fältet ${issue.field}: `;
  return `${issue.file}: ${field}${issue.message}`;
}

// --- Field helpers -------------------------------------------------------------

/** Validates one file's field set; `file` and `issues` are fixed so call sites stay short. */
class Fields {
  private readonly file: string;
  private readonly issues: Issues;

  constructor(file: string, issues: Issues) {
    this.file = file;
    this.issues = issues;
  }

  private error(field: string, message: string): void {
    this.issues.error(this.file, field, message);
  }

  unknown(obj: Obj, allowed: ReadonlySet<string>, prefix = ""): void {
    for (const key of Object.keys(obj)) {
      if (!allowed.has(key)) {
        this.error(
          `${prefix}${key}`,
          `okänt fält. Kontraktet känner bara till ${[...allowed].join(", ")}. Är fältnamnet felstavat?`,
        );
      }
    }
  }

  requiredString(obj: Obj, field: string): string | null {
    const value = obj[field];
    if (value === undefined || value === null) {
      this.error(field, "saknas. Fältet är obligatoriskt.");
      return null;
    }
    return this.string(field, value);
  }

  optionalString(obj: Obj, field: string): string | null {
    const value = obj[field];
    if (value === undefined || value === null) return null;
    return this.string(field, value);
  }

  private string(field: string, value: unknown): string | null {
    if (typeof value !== "string") {
      this.error(field, `${quote(value)} måste vara text.`);
      return null;
    }
    if (value.trim() === "") {
      this.error(field, "får inte vara tomt. Ta bort raden om uppgiften saknas.");
      return null;
    }
    return value;
  }

  requiredBoolean(obj: Obj, field: string): boolean | null {
    const value = obj[field];
    if (value === undefined || value === null) {
      this.error(field, "saknas. Skriv true eller false.");
      return null;
    }
    if (typeof value !== "boolean") {
      this.error(field, `${quote(value)} måste vara true eller false.`);
      return null;
    }
    return value;
  }

  requiredPositiveInteger(obj: Obj, field: string): number | null {
    const value = obj[field];
    if (!Number.isInteger(value) || (value as number) < 1) {
      this.error(field, `${quote(value)} måste vara ett positivt heltal.`);
      return null;
    }
    return value as number;
  }

  optionalNumber(obj: Obj, field: string): number | null {
    const value = obj[field];
    if (value === undefined || value === null) return null;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      this.error(field, `${quote(value)} måste vara ett tal.`);
      return null;
    }
    return value;
  }

  requiredEnum<T extends string>(obj: Obj, field: string, allowed: readonly T[]): T | null {
    const value = obj[field];
    if (value === undefined || value === null) {
      this.error(field, `saknas. Skriv ${listOr(allowed)}.`);
      return null;
    }
    if (typeof value !== "string" || !allowed.includes(value as T)) {
      this.error(field, `${quote(value)} är inte ett giltigt värde. Skriv ${listOr(allowed)}.`);
      return null;
    }
    return value as T;
  }

  /** Like `requiredEnum`, but an absent field is simply null (04-§5.10). */
  optionalEnum<T extends string>(obj: Obj, field: string, allowed: readonly T[]): T | null {
    const value = obj[field];
    if (value === undefined || value === null) return null;
    if (typeof value !== "string" || !allowed.includes(value as T)) {
      this.error(field, `${quote(value)} är inte ett giltigt värde. Skriv ${listOr(allowed)}, eller utelämna fältet.`);
      return null;
    }
    return value as T;
  }

  id(field: string, value: string): boolean {
    if (!ID_PATTERN.test(value)) {
      this.error(
        field,
        `${quote(value)} är inte ett giltigt id. Använd små bokstäver a–z, siffror och bindestreck; å och ä blir a, ö blir o.`,
      );
      return false;
    }
    return true;
  }

  /** Walks every string in `value` and fails on anything that looks like HTML. */
  noHtml(value: unknown, field: string | null): void {
    if (typeof value === "string") {
      const match = HTML_PATTERN.exec(value);
      if (match) {
        this.issues.error(
          this.file,
          field,
          `innehåller HTML (${quote(value.slice(match.index, match.index + 20))}). Skriv ren text eller markdown.`,
        );
      }
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => this.noHtml(item, `${field ?? ""}[${index}]`));
    } else if (isObject(value)) {
      for (const [key, item] of Object.entries(value)) {
        this.noHtml(item, field === null ? key : `${field}.${key}`);
      }
    }
  }

  /**
   * One image reference (04-§9.11): a bild-id that has a post. Returns the resolved
   * image, or null when the reference is unusable — the caller then leaves it out.
   */
  imageReference(field: string, value: unknown, images: ReadonlyMap<string, Image>): Image | null {
    if (!isImageId(value)) {
      this.error(
        field,
        `${quote(value)} är inte ett bild-id. Skriv ${IMAGE_ID_DESCRIPTION}. ` +
          "npm run image skriver ut id:t när bilden läggs till.",
      );
      return null;
    }
    const image = images.get(value);
    if (image === undefined) {
      this.error(field, `bilden ${quote(value)} finns inte i ${imagePostFile(value)}.`);
      return null;
    }
    return image;
  }

  /**
   * A record's `portrait` (02-§8.28): the one picture that is its main one, or null when
   * the field is absent. That the picture actually shows the record is checked later, in
   * `attachPhotos`, where the image posts' subject lists are known.
   */
  portrait(data: Obj, images: ReadonlyMap<string, Image>, field = "portrait"): Image | null {
    const raw = data.portrait;
    if (raw === undefined || raw === null) return null;
    return this.imageReference(field, raw, images);
  }

  /**
   * One of an image post's subject lists (04-§9.13): record ids, each in the form of
   * §3 and each at most once. That the ids exist is checked in `attachPhotos`, which is
   * the first point where every record has been read.
   */
  idList(data: Obj, field: string): string[] {
    const raw = data[field];
    if (raw === undefined || raw === null) return [];
    if (!Array.isArray(raw)) {
      this.error(field, "måste vara en lista med id:n, ett per streck.");
      return [];
    }
    const ids: string[] = [];
    raw.forEach((entry, index) => {
      const at = `${field}[${index}]`;
      if (typeof entry !== "string") {
        this.error(
          at,
          `${quote(entry)} är inte ett id. Använd små bokstäver a–z, siffror och bindestreck; å och ä blir a, ö blir o.`,
        );
        return;
      }
      if (!this.id(at, entry)) return;
      if (ids.includes(entry)) {
        this.error(at, `${quote(entry)} står med två gånger. Ta bort den ena raden.`);
        return;
      }
      ids.push(entry);
    });
    return ids;
  }
}

function listOr(values: readonly string[]): string {
  if (values.length <= 1) return values.join("");
  return `${values.slice(0, -1).join(", ")} eller ${values[values.length - 1]}`;
}

/** Shared preamble for every record: parse errors, id format and mapping shape. */
function openRecord(record: RawRecord, issues: Issues, kind: string): Obj | null {
  if (record.parseError !== null) {
    issues.error(record.file, null, `kunde inte läsas som YAML: ${record.parseError}`);
    return null;
  }
  new Fields(record.file, issues).id("filnamn", record.id);
  if (!isObject(record.data)) {
    issues.error(record.file, null, `filen måste innehålla ${kind} som fält och värden, en per rad.`);
    return null;
  }
  return record.data;
}

// --- Image posts ---------------------------------------------------------------

/**
 * `images/<id>.yaml` (04-§9.5). The file name is the id, so the id check is the file
 * name check; a post with an unusable id is dropped, and every reference to it then
 * fails on its own with a message the editor can act on.
 */
function validateImagePosts(
  records: readonly RawRecord[],
  issues: Issues,
  allowAiCredit: boolean,
): { images: Map<string, Image>; subjects: Map<string, Subjects> } {
  const images = new Map<string, Image>();
  const subjects = new Map<string, Subjects>();
  for (const record of records) {
    if (record.parseError !== null) {
      issues.error(record.file, null, `kunde inte läsas som YAML: ${record.parseError}`);
      continue;
    }
    if (!isImageId(record.id)) {
      issues.error(
        record.file,
        "filnamn",
        `${quote(record.id)} är inte ett bild-id. Filnamnet ska vara ${IMAGE_ID_DESCRIPTION}.`,
      );
      continue;
    }
    if (!isObject(record.data)) {
      issues.error(record.file, null, "filen måste innehålla alt och credit som fält och värden, en per rad.");
      continue;
    }
    const fields = new Fields(record.file, issues);
    fields.unknown(record.data, IMAGE_FIELDS);
    fields.noHtml(record.data, null);
    const alt = fields.requiredString(record.data, "alt");
    const credit = fields.requiredString(record.data, "credit");
    if (alt === null || credit === null) continue;
    if (!allowAiCredit && credit.startsWith("AI-genererad")) {
      issues.error(record.file, "credit", "AI-genererade bilder får bara finnas i QA-datasetet.");
    }
    images.set(record.id, { id: record.id, alt, credit });
    subjects.set(record.id, {
      file: record.file,
      animals: fields.idList(record.data, "animals"),
      locations: fields.idList(record.data, "locations"),
      species: fields.idList(record.data, "species"),
    });
  }
  return { images, subjects };
}

/**
 * What one image post says it shows (04-§9.13, ADR 0026). The ids are kept as written
 * and resolved in `attachPhotos`, because the animals, places and species have not been
 * read yet when the image posts are.
 */
/** Every id that was read from a file, valid or not; see `attachPhotos`. */
interface KnownIds {
  animals: ReadonlySet<string>;
  locations: ReadonlySet<string>;
  species: ReadonlySet<string>;
}

interface Subjects {
  /** The post's own file, so a bad id is reported where it stands. */
  file: string;
  animals: string[];
  locations: string[];
  species: string[];
}

/**
 * Turns the image posts' subject lists into each record's `photos` (04-§8, 04-§9.14).
 *
 * This is the one place the reversed reference is resolved: the picture names the
 * animal, and the animal's page needs the picture. The record's own `portrait` is
 * already first in `photos`; everything else follows in image-id order, which is
 * arbitrary but the same in every build (02-§6.9).
 */
function attachPhotos(
  subjects: ReadonlyMap<string, Subjects>,
  images: ReadonlyMap<string, Image>,
  known: KnownIds,
  animals: readonly Animal[],
  locations: readonly Location[],
  species: readonly Species[],
  files: ReadonlyMap<string, string>,
  speciesFile: string,
  issues: Issues,
): void {
  const byAnimal = new Map<string, Image[]>();
  const byLocation = new Map<string, Image[]>();
  const bySpecies = new Map<string, Image[]>();

  // The ids are checked against every record that was *read*, not against the ones that
  // came through validation: an animal held back by its own broken `born` would
  // otherwise make each picture of it report a second, misleading error.
  const lists = [
    { field: "animals", known: known.animals, into: byAnimal, missing: (id: string) => `djuret ${quote(id)} finns inte i animals/.` },
    { field: "locations", known: known.locations, into: byLocation, missing: (id: string) => `platsen ${quote(id)} finns inte i locations/.` },
    { field: "species", known: known.species, into: bySpecies, missing: (id: string) => `arten ${quote(id)} finns inte i ${speciesFile}.` },
  ] as const;

  for (const imageId of [...subjects.keys()].sort()) {
    const post = subjects.get(imageId) as Subjects;
    const image = images.get(imageId);
    if (image === undefined) continue;
    for (const list of lists) {
      post[list.field].forEach((id, index) => {
        if (!list.known.has(id)) {
          issues.error(post.file, `${list.field}[${index}]`, `${list.missing(id)} Skriv id:t så som filen heter, utan .yaml.`);
          return;
        }
        const found = list.into.get(id);
        if (found === undefined) list.into.set(id, [image]);
        else found.push(image);
      });
    }
  }

  /** The record's pictures: its portrait first, then the rest in image-id order. */
  function ordered(portrait: Image | null, shown: readonly Image[]): Image[] {
    const rest = shown.filter((image) => image.id !== portrait?.id);
    return portrait === null ? rest : [portrait, ...rest];
  }

  /** 04-§10.19: a main picture that does not show the record is a mistake, not a choice. */
  function checkPortrait(portrait: Image | null, shown: readonly Image[], file: string, field: string, noun: string): void {
    if (portrait === null || shown.some((image) => image.id === portrait.id)) return;
    issues.error(
      file,
      field,
      `bilden ${quote(portrait.id)} visar inte ${noun}. ` +
        `Skriv posten i bildens egen lista, eller välj en bild som redan står där.`,
    );
  }

  for (const animal of animals) {
    const shown = byAnimal.get(animal.id) ?? [];
    const file = files.get(animal.id) ?? `animals/${animal.id}.yaml`;
    checkPortrait(animal.photos[0] ?? null, shown, file, "portrait", "djuret");
    animal.photos = ordered(animal.photos[0] ?? null, shown);
  }

  for (const location of locations) {
    const shown = byLocation.get(location.id) ?? [];
    const file = files.get(`locations/${location.id}`) ?? `locations/${location.id}.yaml`;
    checkPortrait(location.photos[0] ?? null, shown, file, "portrait", "platsen");
    location.photos = ordered(location.photos[0] ?? null, shown);
  }

  for (const entry of species) {
    const shown = bySpecies.get(entry.id) ?? [];
    checkPortrait(entry.photo, shown, speciesFile, `species[${entry.id}].portrait`, "arten");
    entry.photo = ordered(entry.photo, shown)[0] ?? null;
  }
}

// --- Clues ---------------------------------------------------------------------

/**
 * `clues/<bild-id>.yaml` (04-§11, ADR 0025). The file name is the image id, so the id
 * check and the picture check are the same check: a clue whose name is not an image with
 * a post has no picture to show and is refused rather than dropped quietly.
 *
 * The place is checked here too, against the ids the location files gave. A clue that
 * points at a paddock nobody kept is a stop the player would walk to for nothing.
 */
function validateClues(
  records: readonly RawRecord[],
  images: ReadonlyMap<string, Image>,
  locationIds: ReadonlySet<string>,
  issues: Issues,
): Clue[] {
  const clues: Clue[] = [];
  for (const record of records) {
    if (record.parseError !== null) {
      issues.error(record.file, null, `kunde inte läsas som YAML: ${record.parseError}`);
      continue;
    }
    if (!isImageId(record.id)) {
      issues.error(
        record.file,
        "filnamn",
        `${quote(record.id)} är inte ett bild-id. Ledtrådens filnamn ska vara bildens: ${IMAGE_ID_DESCRIPTION}.`,
      );
      continue;
    }
    const image = images.get(record.id);
    if (image === undefined) {
      issues.error(
        record.file,
        "filnamn",
        `ledtråden har ingen bildpost. Lägg bilden i ${imagePostFile(record.id)}, eller ta bort ledtråden.`,
      );
      continue;
    }
    if (!isObject(record.data)) {
      issues.error(record.file, null, "filen måste innehålla location, och gärna text, som fält och värden.");
      continue;
    }
    const fields = new Fields(record.file, issues);
    fields.unknown(record.data, CLUE_FIELDS);
    fields.noHtml(record.data, null);
    const location = fields.requiredString(record.data, "location");
    const text = fields.optionalString(record.data, "text");
    if (text !== null && text.length > MAX_CLUE_TEXT_LENGTH) {
      issues.error(
        record.file,
        "text",
        `ledtråden är ${text.length} tecken; högst ${MAX_CLUE_TEXT_LENGTH} tillåts. Skriv en mening, inte en beskrivning.`,
      );
      continue;
    }
    if (location === null) continue;
    if (!locationIds.has(location)) {
      issues.error(record.file, "location", `platsen ${quote(location)} finns inte i locations/.`);
      continue;
    }
    clues.push({ id: record.id, image, text, location });
  }
  return clues;
}

// --- Vocabulary files ----------------------------------------------------------

/** Reads the list under `key` in species.yaml or breeds.yaml; null when the file is unusable. */
function openList(record: RawRecord | null, key: string, issues: Issues): Obj[] | null {
  if (record === null) return [];
  if (record.parseError !== null) {
    issues.error(record.file, null, `kunde inte läsas som YAML: ${record.parseError}`);
    return null;
  }
  if (!isObject(record.data)) {
    issues.error(record.file, null, `filen måste börja med raden "${key}:" följd av en lista.`);
    return null;
  }
  new Fields(record.file, issues).unknown(record.data, new Set([key]));
  const list = record.data[key];
  if (list === undefined || list === null) return [];
  if (!Array.isArray(list)) {
    issues.error(record.file, key, "måste vara en lista.");
    return null;
  }
  const entries: Obj[] = [];
  list.forEach((entry, index) => {
    if (isObject(entry)) entries.push(entry);
    else issues.error(record.file, `${key}[${index}]`, "varje post i listan måste ha fält och värden.");
  });
  return entries;
}

function validateSpecies(record: RawRecord | null, images: ReadonlyMap<string, Image>, issues: Issues): Species[] {
  const entries = openList(record, "species", issues);
  if (entries === null || record === null) return [];
  const fields = new Fields(record.file, issues);
  const seen = new Set<string>();
  const result: Species[] = [];

  entries.forEach((entry, index) => {
    const label = typeof entry.id === "string" ? entry.id : String(index);
    const prefix = `species[${label}].`;
    fields.unknown(entry, SPECIES_FIELDS, prefix);
    fields.noHtml(entry, `species[${label}]`);
    const id = fields.requiredString(entry, "id");
    const name = fields.requiredString(entry, "name");
    const plural = fields.requiredString(entry, "plural");
    if (id !== null && !fields.id(`${prefix}id`, id)) return;
    if (id !== null && seen.has(id)) {
      issues.error(record.file, `${prefix}id`, `${quote(id)} finns redan. Varje art har ett eget id.`);
      return;
    }
    if (id !== null) seen.add(id);

    // The species' picture is its `portrait`; every other picture that names the
    // species is attached later, in `attachPhotos` (ADR 0026).
    let photo: Image | null = null;
    if (entry.portrait !== undefined && entry.portrait !== null) {
      photo = fields.imageReference(`${prefix}portrait`, entry.portrait, images);
      if (photo === null) return;
    }

    if (id === null || name === null || plural === null) return;
    result.push({ id, name, plural, photo });
  });

  return result;
}

function validateBreeds(record: RawRecord | null, speciesIds: ReadonlySet<string>, issues: Issues): Breed[] {
  const entries = openList(record, "breeds", issues);
  if (entries === null || record === null) return [];
  const fields = new Fields(record.file, issues);
  const seen = new Set<string>();
  const result: Breed[] = [];

  entries.forEach((entry, index) => {
    const label = typeof entry.id === "string" ? entry.id : String(index);
    const prefix = `breeds[${label}].`;
    fields.unknown(entry, BREED_FIELDS, prefix);
    fields.noHtml(entry, `breeds[${label}]`);
    const id = fields.requiredString(entry, "id");
    const name = fields.requiredString(entry, "name");
    const species = fields.requiredString(entry, "species");
    const heritage = fields.requiredBoolean(entry, "heritage");
    if (id !== null && !fields.id(`${prefix}id`, id)) return;
    if (id !== null && seen.has(id)) {
      issues.error(record.file, `${prefix}id`, `${quote(id)} finns redan. Varje ras har ett eget id.`);
      return;
    }
    if (id !== null) seen.add(id);
    if (species !== null && !speciesIds.has(species)) {
      issues.error(record.file, `${prefix}species`, `arten ${quote(species)} finns inte i species.yaml.`);
      return;
    }
    if (id === null || name === null || species === null || heritage === null) return;
    result.push({ id, name, species, heritage });
  });

  return result;
}

function validatePopulations(
  record: RawRecord | null,
  speciesIds: ReadonlySet<string>,
  breeds: ReadonlyMap<string, Breed>,
  individualSpecies: ReadonlySet<string>,
  issues: Issues,
): Population[] {
  const entries = openList(record, "populations", issues);
  if (entries === null || record === null) return [];
  const fields = new Fields(record.file, issues);
  const seen = new Set<string>();
  const result: Population[] = [];

  entries.forEach((entry, index) => {
    const prefix = `populations[${index}].`;
    fields.unknown(entry, POPULATION_FIELDS, prefix);
    fields.noHtml(entry, `populations[${index}]`);
    const species = fields.requiredString(entry, "species");
    const breed = fields.requiredString(entry, "breed");
    const count = fields.requiredPositiveInteger(entry, "count");
    if (species !== null && !speciesIds.has(species)) {
      issues.error(record.file, `${prefix}species`, `arten ${quote(species)} finns inte i species.yaml.`);
    }
    if (breed !== null) {
      const knownBreed = breeds.get(breed);
      if (knownBreed === undefined) {
        issues.error(record.file, `${prefix}breed`, `rasen ${quote(breed)} finns inte i breeds.yaml.`);
      } else if (species !== null && knownBreed.species !== species) {
        issues.error(record.file, `${prefix}breed`, `rasen ${quote(breed)} hör till arten ${quote(knownBreed.species)}, inte ${quote(species)}.`);
      }
    }
    if (species !== null && breed !== null) {
      const key = `${species}/${breed}`;
      if (seen.has(key)) issues.error(record.file, prefix.slice(0, -1), "arten och rasen finns redan som ett räknat bestånd.");
      seen.add(key);
      if (individualSpecies.has(species)) {
        issues.error(record.file, `${prefix}species`, `arten ${quote(species)} finns också som individer i animals/. Välj bara en modell.`);
      }
    }
    if (species !== null && breed !== null && count !== null) result.push({ species, breed, count });
  });
  return result;
}

// --- Animals -------------------------------------------------------------------

/** The reference fields of an animal, kept even when other fields in the file are invalid. */
interface AnimalRefs {
  id: string;
  file: string;
  species: string | null;
  breed: string | null;
  mother: string | null;
  father: string | null;
}

/**
 * Validates one animal file. `refs` is set whenever the file is a mapping, so reference
 * and pedigree checks still run when another field in the file is wrong; `animal` is
 * set only when every field is valid.
 */
function validateAnimal(
  record: RawRecord,
  images: ReadonlyMap<string, Image>,
  issues: Issues,
  today: Date,
): { animal: Animal | null; refs: AnimalRefs | null } {
  const data = openRecord(record, issues, "ett djur");
  if (data === null) return { animal: null, refs: null };
  const fields = new Fields(record.file, issues);

  // 04-§10.8 gets its own message before the generic unknown-field check.
  if ("location" in data) {
    issues.error(
      record.file,
      "location",
      "ett djur har ingen egen plats. Ta bort fältet; djurslaget står på platsen i stället (ADR 0012).",
    );
  }
  const known = new Set(ANIMAL_FIELDS);
  known.add("location");
  fields.unknown(data, known);
  fields.noHtml(data, null);

  const name = fields.requiredString(data, "name");
  const species = fields.requiredString(data, "species");
  const breed = fields.optionalString(data, "breed");
  const sex = fields.requiredEnum(data, "sex", SEXES);
  const status = fields.requiredEnum(data, "status", STATUSES);
  const mother = fields.optionalString(data, "mother");
  const father = fields.optionalString(data, "father");
  const description = fields.optionalString(data, "description");
  const portrait = fields.portrait(data, images);

  const bornResult = normaliseBorn(data.born, today);
  if (!bornResult.ok) issues.error(record.file, "born", bornResult.message);

  const refs: AnimalRefs = { id: record.id, file: record.file, species, breed, mother, father };
  if (
    "location" in data ||
    name === null ||
    species === null ||
    sex === null ||
    status === null ||
    !bornResult.ok
  ) {
    return { animal: null, refs };
  }
  const animal: Animal = {
    id: record.id,
    name,
    species,
    breed,
    sex,
    born: bornResult.value,
    mother,
    father,
    status,
    description,
    // The portrait is the only picture the record itself names; `attachPhotos` adds the
    // ones whose posts name the animal (ADR 0026).
    photos: portrait === null ? [] : [portrait],
  };
  return { animal, refs };
}

function validateAnimalReferences(
  animals: Map<string, AnimalRefs>,
  species: ReadonlySet<string>,
  breeds: Map<string, Breed>,
  issues: Issues,
): void {
  for (const animal of animals.values()) {
    const file = animal.file;
    if (animal.species !== null && !species.has(animal.species)) {
      issues.error(file, "species", `arten ${quote(animal.species)} finns inte i species.yaml. Lägg till den där först.`);
    }
    if (animal.breed !== null) {
      const breed = breeds.get(animal.breed);
      if (breed === undefined) {
        issues.error(file, "breed", `rasen ${quote(animal.breed)} finns inte i breeds.yaml. Lägg till den där först.`);
      } else if (breed.species !== animal.species) {
        issues.error(
          file,
          "breed",
          `rasen ${quote(animal.breed)} hör till arten ${quote(breed.species)}, inte ${quote(animal.species)}.`,
        );
      }
    }
    for (const role of ["mother", "father"] as const) {
      const parent = animal[role];
      if (parent === null) continue;
      if (parent === animal.id) {
        issues.error(file, role, "ett djur kan inte vara sin egen förälder.");
      } else if (!animals.has(parent)) {
        issues.error(
          file,
          role,
          `djuret ${quote(parent)} finns inte i animals/. Skriv förälderns id, eller ta bort raden om föräldern inte finns i registret.`,
        );
      }
    }
  }
}

/** 04-§10.6: no pedigree may loop. Each cycle is reported once, on its first member. */
function validatePedigreeCycles(animals: Map<string, AnimalRefs>, issues: Issues): void {
  const reported = new Set<string>();
  for (const [start, animal] of animals) {
    if (reported.has(start)) continue;
    const cycle = findCycle(start, animals);
    if (cycle === null) continue;
    for (const id of cycle) reported.add(id);
    issues.error(
      animal.file,
      null,
      `stamtavlan går i cirkel: ${cycle.join(" → ")} → ${cycle[0]}. Ingen kan vara sin egen förfader.`,
    );
  }
}

/** Depth-first walk up the parent links from `start`; returns the loop if `start` is reached again. */
function findCycle(start: string, animals: Map<string, AnimalRefs>): string[] | null {
  const stack: { id: string; path: string[] }[] = [{ id: start, path: [start] }];
  const seen = new Set<string>();
  while (stack.length > 0) {
    const { id, path: trail } = stack.pop() as { id: string; path: string[] };
    const animal = animals.get(id);
    if (animal === undefined) continue;
    for (const parent of [animal.mother, animal.father]) {
      if (parent === null) continue;
      if (parent === start) return trail;
      if (seen.has(parent)) continue;
      seen.add(parent);
      stack.push({ id: parent, path: [...trail, parent] });
    }
  }
  return null;
}

// --- Locations -----------------------------------------------------------------

function validateLocation(
  record: RawRecord,
  speciesIds: ReadonlySet<string>,
  images: ReadonlyMap<string, Image>,
  issues: Issues,
): Location | null {
  const data = openRecord(record, issues, "en plats");
  if (data === null) return null;
  const fields = new Fields(record.file, issues);
  fields.unknown(data, LOCATION_FIELDS);
  fields.noHtml(data, null);

  const name = fields.requiredString(data, "name");
  const shortName = fields.optionalString(data, "shortName");
  const kind = fields.requiredEnum(data, "kind", LOCATION_KINDS);
  const note = fields.optionalString(data, "note");
  const description = fields.optionalString(data, "description");
  const lat = fields.optionalNumber(data, "lat");
  const lon = fields.optionalNumber(data, "lon");
  const accessible = fields.requiredBoolean(data, "accessible");
  const active = fields.requiredBoolean(data, "active");
  const label = fields.optionalEnum(data, "label", LABEL_PLACEMENTS);
  const portrait = fields.portrait(data, images);

  let species: string[] | null = null;
  if (data.species === undefined || data.species === null) {
    issues.error(record.file, "species", "saknas. Skriv en lista med art-id:n, eller [] om inget djurslag går här.");
  } else if (!Array.isArray(data.species)) {
    issues.error(record.file, "species", "måste vara en lista med art-id:n, eller [] om inget djurslag går här.");
  } else {
    species = [];
    for (const entry of data.species) {
      if (typeof entry !== "string") {
        issues.error(record.file, "species", `${quote(entry)} måste vara ett art-id ur species.yaml.`);
        species = null;
        break;
      }
      if (!speciesIds.has(entry)) {
        issues.error(record.file, "species", `arten ${quote(entry)} finns inte i species.yaml. Lägg till den där först.`);
        species = null;
        break;
      }
      if (species.includes(entry)) {
        issues.error(record.file, "species", `arten ${quote(entry)} står med två gånger.`);
        species = null;
        break;
      }
      species.push(entry);
    }
  }

  let coordinatesValid = true;
  if ((lat === null) !== (lon === null)) {
    issues.error(record.file, lat === null ? "lat" : "lon", "saknas. lat och lon anges tillsammans, eller inte alls.");
    coordinatesValid = false;
  }
  if (lat !== null && (lat < -90 || lat > 90)) {
    issues.error(record.file, "lat", `${lat} ligger utanför -90 till 90. Skriv WGS84 i decimalgrader, t.ex. 57.412300.`);
    coordinatesValid = false;
  }
  if (lon !== null && (lon < -180 || lon > 180)) {
    issues.error(record.file, "lon", `${lon} ligger utanför -180 till 180. Skriv WGS84 i decimalgrader, t.ex. 12.213400.`);
    coordinatesValid = false;
  }

  // Animals on anything but a paddock is almost always a paddock file copied for a café
  // (ADR 0019), so it stops the build rather than passing with a warning.
  if (kind !== null && kind !== "djurplats" && species !== null && species.length > 0) {
    issues.error(record.file, "species", `bara en djurplats har djurslag, och den här platsen är ${kind}. Skriv [], eller sätt kind: djurplats.`);
    species = null;
  }

  if (
    name === null ||
    kind === null ||
    species === null ||
    accessible === null ||
    active === null ||
    !coordinatesValid
  ) {
    return null;
  }
  const photos = portrait === null ? [] : [portrait];
  return { id: record.id, name, shortName, kind, species, note, description, lat, lon, accessible, active, label, photos };
}

// --- Warnings ------------------------------------------------------------------

function collectWarnings(
  species: Species[],
  animals: Animal[],
  populations: Population[],
  locations: Location[],
  images: ReadonlyMap<string, Image>,
  clues: readonly Clue[],
  inMarkdown: ReadonlySet<string>,
  files: Map<string, string>,
  speciesFile: string,
  issues: Issues,
): void {
  // 02-§8.13: an image post with no subject that nothing else uses either. The file is
  // in the repository for good (ADR 0008), and until someone says what it shows it
  // reaches no visitor. This warning is the queue the categorising tool works through.
  const used = new Set([
    ...animals.flatMap((animal) => animal.photos.map((photo) => photo.id)),
    ...locations.flatMap((location) => location.photos.map((photo) => photo.id)),
    ...species.flatMap((entry) => (entry.photo === null ? [] : [entry.photo.id])),
    // A clue's picture is used by the clue, and usually by nothing else: it shows a
    // detail, not an animal (04-§11.5). Without this line the farm's first clue photo
    // would be reported as an orphan the day it was added.
    ...clues.map((clue) => clue.image.id),
    ...inMarkdown,
  ]);
  for (const id of images.keys()) {
    if (used.has(id)) continue;
    issues.warn(
      imagePostFile(id),
      null,
      "bilden har inget motiv och används ingenstans. Skriv vilket djur, vilken plats " +
        "eller vilken art den visar, eller ta bort posten och filen.",
    );
  }

  for (const animal of animals) {
    if (animal.photos.length === 0) {
      issues.warn(
        files.get(animal.id) ?? `animals/${animal.id}.yaml`,
        null,
        "djuret har inget foto och visas med en platshållare. Skriv djurets id i en bildposts animals.",
      );
    }
  }

  for (const location of locations) {
    if (!location.active) continue;
    const file = files.get(`locations/${location.id}`) ?? `locations/${location.id}.yaml`;
    // Only a djurplats is expected to have animals; a café with none is not a mistake.
    if (location.kind === "djurplats" && location.species.length === 0) {
      issues.warn(file, "species", "platsen är aktiv men har inget djurslag. Platssidan blir tom.");
    }
    if (location.lat === null) {
      issues.warn(file, "lat", "platsen är aktiv men saknar koordinater och visas inte på kartan.");
    }
  }

  const activeLocations = new Set(locations.filter((location) => location.active).map((location) => location.id));
  for (const clue of clues) {
    if (activeLocations.has(clue.location)) continue;
    issues.warn(
      `clues/${clue.id}.yaml`,
      "location",
      `platsen ${quote(clue.location)} används inte just nu, så ledtråden skickar spelaren till en hage som står tom.`,
    );
  }

  const speciesAtActiveLocations = new Set(locations.filter((l) => l.active).flatMap((l) => l.species));
  for (const entry of species) {
    if (entry.photo === null) {
      issues.warn(
        speciesFile,
        `species[${entry.id}].portrait`,
        "arten har ingen bild och visas med sitt namn på en platta. Skriv artens id i en bildposts species.",
      );
    }
    const hasAnimalsHere =
      animals.some((a) => a.species === entry.id && a.status === "here") ||
      populations.some((population) => population.species === entry.id && population.count > 0);
    if (hasAnimalsHere && !speciesAtActiveLocations.has(entry.id)) {
      issues.warn(
        speciesFile,
        `species[${entry.id}]`,
        `arten har djur på gården men finns på ingen aktiv plats. Lägg till ${quote(entry.id)} i en platsfils species.`,
      );
    }
  }
}

// --- Images in Markdown --------------------------------------------------------

/**
 * The image ids referenced from Markdown (02-§8.12). Every reference must resolve, the
 * same way `photos` must: a Markdown image the build cannot place would silently become
 * a placeholder, and the editor would never learn why.
 */
function collectMarkdownImages(
  sources: readonly MarkdownField[],
  images: ReadonlyMap<string, Image>,
  issues: Issues,
): Set<string> {
  const used = new Set<string>();
  for (const source of sources) {
    for (const match of source.text.matchAll(MARKDOWN_IMAGE_PATTERN)) {
      const id = match[1];
      if (isImageId(id) && images.has(id)) {
        used.add(id);
        continue;
      }
      issues.error(
        source.file,
        source.field ?? null,
        isImageId(id)
          ? `bilden ${quote(id)} finns inte i ${imagePostFile(id)}.`
          : `bilden ${quote(id)} är inte ett bild-id. Skriv ![](<bild-id>) med ${IMAGE_ID_DESCRIPTION}.`,
      );
    }
  }
  return used;
}

// --- Image files ---------------------------------------------------------------

/**
 * The file behind every image post (04-§10.7). The error is reported on the image post,
 * not on the records that use it: the file belongs to the post, and a photo shared by
 * three animals should not produce the same message three times.
 */
async function validateImageFiles(images: readonly Image[], imagesDir: string, issues: Issues): Promise<void> {
  for (const image of images) {
    const file = imagePostFile(image.id);
    const name = imageFileName(image.id);
    // Read once and measure the bytes we read, so the check and the parse never
    // disagree about which file version they saw.
    let bytes: Buffer;
    try {
      bytes = await readFile(path.join(imagesDir, name));
    } catch {
      issues.error(file, null, `bilden ${name} finns inte under ${imagesDir}.`);
      continue;
    }
    const size = bytes.byteLength;
    if (size > MAX_IMAGE_BYTES) {
      issues.error(
        file,
        null,
        `bilden ${name} är ${Math.round(size / 1024)} KB; högst ${MAX_IMAGE_BYTES / 1024} KB tillåts. Kör npm run image.`,
      );
    }
    const info = inspectWebp(new Uint8Array(bytes));
    if (!info.ok) {
      issues.error(file, null, `bilden ${name} är inte en WebP-fil. Kör npm run image.`);
      continue;
    }
    if (info.width > MAX_IMAGE_EDGE || info.height > MAX_IMAGE_EDGE) {
      issues.error(
        file,
        null,
        `bilden ${name} är ${info.width}×${info.height} px; högst ${MAX_IMAGE_EDGE} px på längsta sidan tillåts. Kör npm run image.`,
      );
    }
    if (info.hasMetadata) {
      issues.error(
        file,
        null,
        `bilden ${name} bär EXIF-, XMP- eller ICC-metadata, som kan röja var bilden togs. Kör npm run image.`,
      );
    }
  }
}

/**
 * 02-§8.13: a `.webp` in the images directory that no image post accounts for. It never
 * reaches a visitor but stays in the git history for good (ADR 0008), so it is worth a
 * warning. Reported on the dataset's images directory, since there is no post to blame.
 */
async function warnAboutStrayImageFiles(
  images: readonly Image[],
  imagesDir: string,
  issues: Issues,
): Promise<void> {
  let names: string[];
  try {
    names = await readdir(imagesDir);
  } catch {
    return;
  }
  const known = new Set(images.map((image) => imageFileName(image.id)));
  for (const name of names.filter((entry) => entry.endsWith(IMAGE_SUFFIX)).sort()) {
    if (known.has(name)) continue;
    issues.warn(
      "images/",
      null,
      `bildfilen ${name} har ingen bildpost och visas aldrig. ` +
        `Lägg till ${imagePostFile(imageIdFromFileName(name))} eller ta bort filen.`,
    );
  }
}

// --- Entry point ---------------------------------------------------------------

/** Validates and normalises `raw`. `dataset` is null whenever `errors` is non-empty. */
export async function validateDataset(raw: RawDataset, options: ValidateOptions = {}): Promise<ValidationResult> {
  const issues = new Issues();
  const today = options.today ?? new Date();
  const speciesFile = raw.species?.file ?? "species.yaml";

  const { images, subjects } = validateImagePosts(raw.images, issues, path.basename(raw.dir).startsWith("data-"));
  const species = validateSpecies(raw.species, images, issues);
  const speciesIds = new Set(species.map((s) => s.id));
  const breeds = validateBreeds(raw.breeds, speciesIds, issues);
  const breedsById = new Map(breeds.map((b) => [b.id, b]));

  const files = new Map<string, string>();
  const animals: Animal[] = [];
  const animalRefs = new Map<string, AnimalRefs>();
  for (const record of raw.animals) {
    files.set(record.id, record.file);
    const { animal, refs } = validateAnimal(record, images, issues, today);
    if (animal !== null) animals.push(animal);
    if (refs !== null) animalRefs.set(refs.id, refs);
  }
  validateAnimalReferences(animalRefs, speciesIds, breedsById, issues);
  validatePedigreeCycles(animalRefs, issues);
  const individualSpecies = new Set(animals.map((animal) => animal.species));
  const populations = validatePopulations(raw.populations, speciesIds, breedsById, individualSpecies, issues);

  const locations: Location[] = [];
  for (const record of raw.locations) {
    files.set(`locations/${record.id}`, record.file);
    const location = validateLocation(record, speciesIds, images, issues);
    if (location !== null) locations.push(location);
  }

  const known: KnownIds = {
    animals: new Set(raw.animals.map((record) => record.id)),
    locations: new Set(raw.locations.map((record) => record.id)),
    species: readSpeciesIds(raw.species),
  };
  attachPhotos(subjects, images, known, animals, locations, species, files, speciesFile, issues);

  const clues = validateClues(raw.clues, images, new Set(locations.map((location) => location.id)), issues);

  const inMarkdown = collectMarkdownImages(
    [
      ...animals.map((animal) => ({
        file: files.get(animal.id) ?? `animals/${animal.id}.yaml`,
        field: "description",
        text: animal.description ?? "",
      })),
      ...locations.map((location) => ({
        file: files.get(`locations/${location.id}`) ?? `locations/${location.id}.yaml`,
        field: "description",
        text: location.description ?? "",
      })),
      ...(options.markdown ?? []),
    ],
    images,
    issues,
  );

  collectWarnings(species, animals, populations, locations, images, clues, inMarkdown, files, speciesFile, issues);

  const imageList = [...images.values()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  if (options.imagesDir) {
    await validateImageFiles(imageList, options.imagesDir, issues);
    await warnAboutStrayImageFiles(imageList, options.imagesDir, issues);
  }

  if (issues.errors.length > 0) {
    return { errors: issues.errors, warnings: issues.warnings, dataset: null };
  }
  const dataset: Dataset = {
    species,
    breeds,
    populations,
    animals: sortAnimals(animals),
    locations: sortLocations(locations),
    images: imageList,
    // The records are read in file-name order (02-§6.1), which for clues is id order
    // (04-§11.8): the file name is the id, so nothing has to be sorted again here.
    clues,
  };
  return { errors: [], warnings: issues.warnings, dataset };
}
