/**
 * The validated, normalised shape of the farm's data (docs/04-DATAKONTRAKT.md).
 *
 * Everything else in the domain layer produces or consumes these types. Pages and the
 * build code against them, never against raw YAML. The domain layer has no browser
 * APIs (03-§2.1), so these types are plain data.
 */

export type Sex = "female" | "male" | "unknown";
export type Status = "here" | "gone";

export interface Photo {
  file: string;
  alt: string;
  credit: string;
  portrait: boolean;
}

export interface SpeciesPhoto {
  file: string;
  alt: string;
  credit: string;
}

export interface Animal {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  sex: Sex;
  /** Normalised to "YYYY-MM-DD" or "YYYY" (02-§6.7). */
  born: string | null;
  mother: string | null;
  father: string | null;
  status: Status;
  description: string | null;
  photos: Photo[];
}

export interface Location {
  id: string;
  name: string;
  species: string[];
  note: string | null;
  description: string | null;
  lat: number | null;
  lon: number | null;
  accessible: boolean;
  active: boolean;
}

export interface Species {
  id: string;
  name: string;
  plural: string;
  photo: SpeciesPhoto | null;
}

export interface Breed {
  id: string;
  name: string;
  species: string;
  heritage: boolean;
}

/** A species kept as a headcount rather than named individuals. */
export interface Population {
  species: string;
  breed: string;
  count: number;
}

/** Always sorted according to 02-§6.9: animals and locations by name, species in file order. */
export interface Dataset {
  species: Species[];
  breeds: Breed[];
  populations: Population[];
  animals: Animal[];
  locations: Location[];
}

/** One error or warning. `message` is Swedish and says what to fix (02-§6.5). */
export interface Issue {
  file: string;
  field: string | null;
  message: string;
}

/** `dataset` is null when there is at least one error. */
export interface ValidationResult {
  errors: Issue[];
  warnings: Issue[];
  dataset: Dataset | null;
}
