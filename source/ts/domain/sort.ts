/**
 * Deterministic Swedish ordering (02-§6.9, 03-§3.3).
 *
 * Animals and locations sort by name with Swedish collation — Å, Ä and Ö after Z — and
 * by id when two names are equal, so two builds of the same data are byte-identical.
 * Species keep the order of species.yaml and are never sorted here.
 */
import type { Animal, Location } from "./types.ts";

const collator = new Intl.Collator("sv");

interface Named {
  id: string;
  name: string;
}

/** Name first (Swedish order), id as the tie-breaker. */
export function compareByName(a: Named, b: Named): number {
  return collator.compare(a.name, b.name) || collator.compare(a.id, b.id);
}

/** Returns a sorted copy; the input is left untouched. */
export function sortAnimals(animals: readonly Animal[]): Animal[] {
  return [...animals].sort(compareByName);
}

/** Returns a sorted copy; the input is left untouched. */
export function sortLocations(locations: readonly Location[]): Location[] {
  return [...locations].sort(compareByName);
}
