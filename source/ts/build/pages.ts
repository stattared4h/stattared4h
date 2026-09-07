/**
 * View models for the data-driven pages (02-§5, 03-§4).
 *
 * The templates in source/pages/ are deliberately dumb: every list, label, heading and
 * sentence is computed here from the validated Dataset with the derivations in
 * source/ts/domain/derive.ts, so the wording and the selections can be tested in Node.
 * `url` fields are site-relative ("/plats/gethagen/"); the templates put the base path
 * in front with Eleventy's `url` filter (ADR 0005). The one exception is the map, whose
 * markup is rendered here in full and therefore takes the base path as an option.
 *
 * Markdown fields (`body`) are handed over as written; the `markdown` filter in
 * eleventy.config.js renders them.
 */
import {
  animalsAtLocation,
  animalsOfSpecies,
  breedOf,
  formatBorn,
  locationsForSpecies,
  offspring,
  parents,
  populationsOfSpecies,
  siblings,
  sortLocations,
  speciesOnFarm,
  type Animal,
  type Dataset,
  type Image,
  type Location,
  type LocationKind,
  type Population,
  type Species,
} from "../domain/index.ts";
import { definitePlural, joinSwedish, lowerFirst } from "../domain/swedish.ts";
import { renderMap, type MapBackground, type MapLocation } from "./map.ts";
import { symbolSvg } from "./symbols.ts";

/** A species as a tappable box with its picture (05-§6.24), on the home and location pages. */
export interface SpeciesTileView {
  id: string;
  name: string;
  plural: string;
  url: string;
  photo: Image | null;
}

/** One animal card (02-§5.28, 05-§6.18). */
export interface AnimalCardView {
  id: string;
  name: string;
  url: string;
  /** Singular species name, shown on the placeholder when there is no photo (05-§6.20). */
  speciesName: string;
  photo: Image | null;
  /** Breed, "Lantras" and "Har lämnat gården", in that order, only when they apply (05-§6.19). */
  tags: string[];
  gone: boolean;
}

export interface LinkView {
  name: string;
  url: string;
}

/** The animals of one species on a location page, or the counted population instead. */
export interface SpeciesGroupView {
  species: SpeciesTileView;
  /** "Getterna på gården" (05-§6.26). */
  heading: string;
  cards: AnimalCardView[];
  /** "På gården finns 18 svarta dvärghöns och 14 orusthöns." — null without populations. */
  populationSentence: string | null;
}

export interface HomeView {
  species: SpeciesTileView[];
}

export interface LocationPageView {
  id: string;
  name: string;
  url: string;
  /** The page's meta description. */
  description: string;
  active: boolean;
  /** What the place is (04-§5.7). Only a djurplats page mentions animals (02-§5.35). */
  kind: LocationKind;
  species: SpeciesTileView[];
  note: string | null;
  /** The location's `description` field, Markdown. */
  body: string | null;
  /** The location's photos, in data order (02-§5.31). */
  photos: Image[];
  /** "Hit når man med rullstol och barnvagn" or its negation (02-§5.10). */
  accessibility: string;
  groups: SpeciesGroupView[];
}

export interface AnimalPageView {
  id: string;
  name: string;
  url: string;
  description: string;
  gone: boolean;
  /** The first photo in the list (02-§8.11), or null. */
  portrait: Image | null;
  /** Every other photo, in data order. */
  otherPhotos: Image[];
  species: SpeciesTileView;
  /** Breed name with " (lantras)" when heritage; null without breed. */
  breed: string | null;
  /** "Hona" or "Hane"; null when unknown. */
  sex: string | null;
  /** "Född 12 april 2021" or "Född 2021"; null when unknown. */
  born: string | null;
  body: string | null;
  mother: LinkView | null;
  father: LinkView | null;
  offspring: LinkView[];
  siblings: LinkView[];
  /** "Var finns getterna?" — the link text to the species page (02-§5.17). */
  whereQuestion: string;
}

export interface SpeciesPageView {
  id: string;
  name: string;
  plural: string;
  url: string;
  description: string;
  photo: Image | null;
  /** "Var finns getterna?" */
  whereHeading: string;
  locations: LinkView[];
  /** "Just nu vet vi inte var getterna går" when no active location has the species (02-§5.21). */
  unknownWhere: string | null;
  populationSentence: string | null;
  /** "Getterna på gården" */
  hereHeading: string;
  here: AnimalCardView[];
  gone: AnimalCardView[];
  /** Editorial Markdown from source/content/arter/<id>.md (02-§5.22), or null. */
  body: string | null;
}

export interface MapListItem extends LinkView {
  /** "Får och kor", or "Inga djur just nu". */
  species: string;
  /** The same symbol the marker carries, as an `<svg>` (02-§5.37). */
  symbol: string;
}

export interface MapPageView {
  /** The map markup from renderMap; empty when no active location has coordinates. */
  html: string;
  list: MapListItem[];
  warnings: string[];
}

export interface SiteViews {
  home: HomeView;
  locations: LocationPageView[];
  animals: AnimalPageView[];
  species: SpeciesPageView[];
  map: MapPageView;
}

export interface BuildViewsOptions {
  /** Base path with leading and trailing slash (ADR 0005); only the map needs it. */
  base: string;
  /** The farm's name for meta descriptions. */
  farm: string;
  /** Markdown per species id from source/content/arter/. */
  speciesContent?: Readonly<Record<string, string>>;
  mapBackground?: MapBackground | null;
}

export const GONE_LABEL = "Har lämnat gården";
export const HERITAGE_LABEL = "Lantras";
export const EMPTY_LOCATION_TEXT = "Just nu går inga djur här";
export const INACTIVE_LOCATION_TEXT = "Den här platsen används inte just nu";
export const ACCESSIBLE_TEXT = "Hit når man med rullstol och barnvagn";
export const NOT_ACCESSIBLE_TEXT = "Hit når man inte med rullstol eller barnvagn";
export const NO_SPECIES_AT_LOCATION_TEXT = "Inga djur just nu";

export function locationUrl(id: string): string {
  return `/plats/${id}/`;
}

export function animalUrl(id: string): string {
  return `/djur/${id}/`;
}

export function speciesUrl(id: string): string {
  return `/arter/${id}/`;
}

export function speciesTile(species: Species): SpeciesTileView {
  return { id: species.id, name: species.name, plural: species.plural, url: speciesUrl(species.id), photo: species.photo };
}

/** The portrait is the first photo in the list (02-§8.11). */
export function portraitOf(animal: Animal): Image | null {
  return animal.photos[0] ?? null;
}

export function animalCard(dataset: Dataset, animal: Animal): AnimalCardView {
  const species = dataset.species.find((s) => s.id === animal.species);
  const breed = breedOf(dataset, animal);
  const tags: string[] = [];
  if (breed !== null) tags.push(breed.name);
  if (breed?.heritage) tags.push(HERITAGE_LABEL);
  if (animal.status === "gone") tags.push(GONE_LABEL);
  return {
    id: animal.id,
    name: animal.name,
    url: animalUrl(animal.id),
    speciesName: species?.name ?? animal.species,
    photo: portraitOf(animal),
    tags,
    gone: animal.status === "gone",
  };
}

/** "På gården finns 18 svarta dvärghöns och 14 orusthöns." (02-§5.11) */
export function populationSentence(dataset: Dataset, populations: readonly Population[]): string | null {
  if (populations.length === 0) return null;
  const parts = populations.map((population) => {
    const breed = dataset.breeds.find((b) => b.id === population.breed);
    return `${population.count} ${lowerFirst(breed?.name ?? population.breed)}`;
  });
  return `På gården finns ${joinSwedish(parts)}.`;
}

/** "Getterna på gården" */
export function groupHeading(species: Species): string {
  return `${definitePlural(species.plural)} på gården`;
}

/** "Var finns getterna?" */
export function whereQuestion(species: Species): string {
  return `Var finns ${lowerFirst(definitePlural(species.plural))}?`;
}

/** "Just nu vet vi inte var getterna går" */
export function unknownWhereText(species: Species): string {
  return `Just nu vet vi inte var ${lowerFirst(definitePlural(species.plural))} går`;
}

function link(animal: Animal): LinkView {
  return { name: animal.name, url: animalUrl(animal.id) };
}

export function homeView(dataset: Dataset): HomeView {
  return { species: speciesOnFarm(dataset).map(speciesTile) };
}

export function locationView(dataset: Dataset, location: Location, farm: string): LocationPageView {
  const groups = animalsAtLocation(dataset, location).map((group) => ({
    species: speciesTile(group.species),
    heading: groupHeading(group.species),
    cards: group.animals.map((animal) => animalCard(dataset, animal)),
    populationSentence: populationSentence(dataset, group.populations),
  }));
  const description = !location.active
    ? `${location.name} på ${farm} används inte just nu.`
    : location.kind !== "djurplats"
      ? `${location.name} på ${farm}: var den ligger och hur man når den.`
      : `Vilka djurslag som går i ${location.name} på ${farm}, och djuren av de slagen.`;
  return {
    id: location.id,
    name: location.name,
    url: locationUrl(location.id),
    description,
    active: location.active,
    kind: location.kind,
    species: groups.map((group) => group.species),
    note: location.note,
    body: location.description,
    photos: location.photos,
    accessibility: location.accessible ? ACCESSIBLE_TEXT : NOT_ACCESSIBLE_TEXT,
    groups,
  };
}

export function animalView(dataset: Dataset, animal: Animal, farm: string): AnimalPageView {
  const species = dataset.species.find((s) => s.id === animal.species);
  if (species === undefined) throw new Error(`Animal ${animal.id} has unknown species ${animal.species}.`);
  const breed = breedOf(dataset, animal);
  const portrait = portraitOf(animal);
  const family = parents(dataset, animal);
  return {
    id: animal.id,
    name: animal.name,
    url: animalUrl(animal.id),
    description: `${animal.name}, ${lowerFirst(species.name)} på ${farm} – art, ras, släkt och bilder.`,
    gone: animal.status === "gone",
    portrait,
    otherPhotos: animal.photos.slice(1),
    species: speciesTile(species),
    breed: breed === null ? null : breed.heritage ? `${breed.name} (lantras)` : breed.name,
    sex: animal.sex === "female" ? "Hona" : animal.sex === "male" ? "Hane" : null,
    born: formatBorn(animal.born),
    body: animal.description,
    mother: family.mother === null ? null : link(family.mother),
    father: family.father === null ? null : link(family.father),
    offspring: offspring(dataset, animal.id).map(link),
    siblings: siblings(dataset, animal.id).map(link),
    whereQuestion: whereQuestion(species),
  };
}

export function speciesView(
  dataset: Dataset,
  species: Species,
  farm: string,
  content: string | null = null,
): SpeciesPageView {
  const locations = locationsForSpecies(dataset, species.id).map((location) => ({
    name: location.name,
    url: locationUrl(location.id),
  }));
  return {
    id: species.id,
    name: species.name,
    plural: species.plural,
    url: speciesUrl(species.id),
    description: `Var ${lowerFirst(definitePlural(species.plural))} finns på ${farm}, och vilka de är.`,
    photo: species.photo,
    whereHeading: whereQuestion(species),
    locations,
    unknownWhere: locations.length === 0 ? unknownWhereText(species) : null,
    populationSentence: populationSentence(dataset, populationsOfSpecies(dataset, species.id)),
    hereHeading: groupHeading(species),
    here: animalsOfSpecies(dataset, species.id, "here").map((animal) => animalCard(dataset, animal)),
    gone: animalsOfSpecies(dataset, species.id, "gone").map((animal) => animalCard(dataset, animal)),
    body: content,
  };
}

/** Active locations with coordinates, for the map (02-§5.23, 02-§5.25). */
export function mapLocations(dataset: Dataset): MapLocation[] {
  return sortLocations(dataset.locations)
    .filter((location) => location.active && location.lat !== null && location.lon !== null)
    .map((location) => ({
      id: location.id,
      name: location.name,
      kind: location.kind,
      lat: location.lat as number,
      lon: location.lon as number,
    }));
}

export function mapView(dataset: Dataset, options: Pick<BuildViewsOptions, "base" | "mapBackground">): MapPageView {
  const rendered = renderMap(mapLocations(dataset), { base: options.base, background: options.mapBackground ?? null });
  const list = sortLocations(dataset.locations)
    .filter((location) => location.active)
    .map((location) => {
      const plurals = dataset.species.filter((s) => location.species.includes(s.id)).map((s) => s.plural);
      // Only a paddock has animals to report, and saying "inga djur just nu" about the
      // café would be answering a question nobody asked (02-§5.35).
      const species =
        location.kind !== "djurplats"
          ? ""
          : plurals.length === 0
            ? NO_SPECIES_AT_LOCATION_TEXT
            : joinSwedish([plurals[0], ...plurals.slice(1).map(lowerFirst)]);
      return {
        name: location.name,
        url: locationUrl(location.id),
        species,
        symbol: symbolSvg(location.kind, "place-list__symbol"),
      };
    });
  return { html: rendered.html, list, warnings: rendered.warnings };
}

/** Every page's view model, in the dataset's deterministic order (02-§6.9). */
export function buildViews(dataset: Dataset, options: BuildViewsOptions): SiteViews {
  const content = options.speciesContent ?? {};
  return {
    home: homeView(dataset),
    locations: dataset.locations.map((location) => locationView(dataset, location, options.farm)),
    animals: dataset.animals.map((animal) => animalView(dataset, animal, options.farm)),
    species: dataset.species.map((species) => speciesView(dataset, species, options.farm, content[species.id] ?? null)),
    map: mapView(dataset, options),
  };
}
