/**
 * Derived views over a validated Dataset (04-§8, 03-§3).
 *
 * Nothing here is stored in the data: which animals stand in a paddock, where a
 * species lives, who is whose offspring — all of it is computed from the primary
 * records so that no fact exists in two places. Pure functions, no browser APIs, so
 * the pages and the games can share them and the tests run in Node.
 *
 * Every list returned is sorted (02-§6.9). Species keep the order of species.yaml.
 */
import { sortAnimals, sortLocations } from "./sort.ts";
import type { Animal, Breed, Dataset, Location, Population, Species, Status } from "./types.ts";

/** One species and the animals of it that are present, for a location page. */
export interface SpeciesGroup {
  species: Species;
  animals: Animal[];
  populations: Population[];
}

/** The species with `id`, or null when it is unknown. */
export function speciesOf(dataset: Dataset, id: string): Species | null {
  return dataset.species.find((s) => s.id === id) ?? null;
}

/** The animal's breed, or null when it has none. */
export function breedOf(dataset: Dataset, animal: Animal): Breed | null {
  if (animal.breed === null) return null;
  return dataset.breeds.find((b) => b.id === animal.breed) ?? null;
}

/** Animals of a species, optionally filtered by status. */
export function animalsOfSpecies(dataset: Dataset, speciesId: string, status?: Status): Animal[] {
  return sortAnimals(
    dataset.animals.filter((a) => a.species === speciesId && (status === undefined || a.status === status)),
  );
}

/** Animals of a breed, all statuses. */
export function animalsByBreed(dataset: Dataset, breedId: string): Animal[] {
  return sortAnimals(dataset.animals.filter((a) => a.breed === breedId));
}

/** Counted populations of a species. */
export function populationsOfSpecies(dataset: Dataset, speciesId: string): Population[] {
  return dataset.populations.filter((population) => population.species === speciesId);
}

/** Total number of animals in counted populations, optionally for one species. */
export function populationCount(dataset: Dataset, speciesId?: string): number {
  return dataset.populations
    .filter((population) => speciesId === undefined || population.species === speciesId)
    .reduce((sum, population) => sum + population.count, 0);
}

/**
 * The animals a visitor can meet at a location: the present animals of each species
 * listed on it, grouped per species in species.yaml order. A listed species with no
 * present animals still gets its (empty) group, so the page can show the species box.
 */
export function animalsAtLocation(dataset: Dataset, location: Location): SpeciesGroup[] {
  return dataset.species
    .filter((species) => location.species.includes(species.id))
    .map((species) => ({
      species,
      animals: animalsOfSpecies(dataset, species.id, "here"),
      populations: populationsOfSpecies(dataset, species.id),
    }));
}

/** Active locations where a species is listed (04-§8.1). */
export function locationsForSpecies(dataset: Dataset, speciesId: string): Location[] {
  return sortLocations(dataset.locations.filter((l) => l.active && l.species.includes(speciesId)));
}

/** Animals whose mother or father is `animalId`. */
export function offspring(dataset: Dataset, animalId: string): Animal[] {
  return sortAnimals(dataset.animals.filter((a) => a.mother === animalId || a.father === animalId));
}

/** Animals sharing at least one known parent with `animalId`, excluding the animal itself. */
export function siblings(dataset: Dataset, animalId: string): Animal[] {
  const self = dataset.animals.find((a) => a.id === animalId);
  if (self === undefined) return [];
  const parents = [self.mother, self.father].filter((p): p is string => p !== null);
  if (parents.length === 0) return [];
  return sortAnimals(
    dataset.animals.filter(
      (a) => a.id !== animalId && parents.some((p) => a.mother === p || a.father === p),
    ),
  );
}

/** The animal's known parents. */
export function parents(dataset: Dataset, animal: Animal): { mother: Animal | null; father: Animal | null } {
  const find = (id: string | null): Animal | null =>
    id === null ? null : (dataset.animals.find((a) => a.id === id) ?? null);
  return { mother: find(animal.mother), father: find(animal.father) };
}

/** Species with at least one present animal (02-§5.7), in species.yaml order. */
export function speciesOnFarm(dataset: Dataset): Species[] {
  return dataset.species.filter(
    (s) =>
      dataset.animals.some((a) => a.species === s.id && a.status === "here") ||
      dataset.populations.some((population) => population.species === s.id && population.count > 0),
  );
}
