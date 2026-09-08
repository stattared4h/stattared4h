/**
 * The validated, normalised shape of the farm's data (docs/04-DATAKONTRAKT.md).
 *
 * Everything else in the domain layer produces or consumes these types. Pages and the
 * build code against them, never against raw YAML. The domain layer has no browser
 * APIs (03-§2.1), so these types are plain data.
 */

export type Sex = "female" | "male" | "unknown";
export type Status = "here" | "gone";

/**
 * One image, as `source/data/images/<id>.yaml` describes it (04-§9.5, ADR 0015).
 *
 * Records refer to images by id; the validator resolves every reference into this shape,
 * so pages and templates never look anything up themselves (03-§6.5). The same object
 * therefore appears in every record that uses the image, which is the point: the alt
 * text and the credit are written once.
 */
export interface Image {
  /** `img-` and twelve hex characters (04-§9.7). */
  id: string;
  alt: string;
  credit: string;
}

export interface Animal {
  id: string;
  /** Public identifier visible on the animal, for example an ear-tag number. */
  publicId?: string | null;
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
  /** In data order; the first one is the portrait (02-§8.11). */
  photos: Image[];
}

/**
 * What a place is (04-§5.7, ADR 0019). Decides whether the page talks about animals,
 * and which symbol the map marker carries (02-§5.38).
 */
export type LocationKind =
  | "djurplats"
  | "mat"
  | "grill"
  | "toalett"
  | "parkering"
  | "lek"
  | "boende"
  | "husbil";

export interface Location {
  id: string;
  name: string;
  kind: LocationKind;
  species: string[];
  note: string | null;
  description: string | null;
  lat: number | null;
  lon: number | null;
  accessible: boolean;
  active: boolean;
  /**
   * The side of the marker the name stands on in the map (02-§5.60, 04-§5.10), or null to
   * let the build choose. The one field about appearance: four positions are not enough
   * for the farmyard's cluster, and only the farm knows which of two neighbours matters.
   */
  label: LabelPlacement | null;
  /** In data order; the first one is shown at the top of the page (02-§8.11). */
  photos: Image[];
}

/** Where a place asks for its name, in the data's own words (04-§5.10). */
export type LabelPlacement = "under" | "over" | "hoger" | "vanster";

export interface Species {
  id: string;
  name: string;
  plural: string;
  photo: Image | null;
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
  /** Every image post, sorted by id. Records hold the same objects (04-§9.5). */
  images: Image[];
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
