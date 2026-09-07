/**
 * 04-§8 / 03-§3 / 02-§6.8: the derived views, checked against the cases the QA README
 * documents — siblings via a shared mother, a gone parent, a species on two places, two
 * species in one paddock, and a species on no place at all.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  animalsAtLocation,
  animalsByBreed,
  animalsOfSpecies,
  breedOf,
  locationsForSpecies,
  offspring,
  parents,
  populationCount,
  populationsOfSpecies,
  siblings,
  speciesOf,
  speciesOnFarm,
} from "../../source/ts/domain/derive.ts";
import type { Animal, Dataset, Location } from "../../source/ts/domain/types.ts";
import { qaDataset } from "./helpers.ts";

function ids(items: { id: string }[]): string[] {
  return items.map((i) => i.id);
}

function animal(dataset: Dataset, id: string): Animal {
  const found = dataset.animals.find((a) => a.id === id);
  if (!found) throw new Error(`no animal ${id}`);
  return found;
}

function location(dataset: Dataset, id: string): Location {
  const found = dataset.locations.find((l) => l.id === id);
  if (!found) throw new Error(`no location ${id}`);
  return found;
}

test("animalsAtLocation: present animals of the location's species, grouped in species.yaml order", async () => {
  const dataset = await qaDataset();
  const groups = animalsAtLocation(dataset, location(dataset, "stora-hagen"));
  assert.deepEqual(
    groups.map((g) => g.species.id),
    ["far", "ko"],
  );
  assert.equal(groups[0].animals.length, 20);
  assert.equal(groups[1].animals.length, 10);
  assert.ok(ids(groups[0].animals).includes("bagaren"));
  assert.ok(ids(groups[1].animals).includes("majros"));

  const goats = animalsAtLocation(dataset, location(dataset, "gethagen"));
  assert.equal(goats[0].animals.length, 19, "bocken is gone");
  assert.ok(ids(goats[0].animals).includes("rosa"));
  assert.deepEqual(animalsAtLocation(dataset, location(dataset, "ovre-hagen")), []);
});

test("animalsAtLocation groups every matching present individual", async () => {
  const dataset = await qaDataset();
  const emptyKaninHus = { ...location(dataset, "smadjurshuset"), species: ["hast", "kanin"] };
  const groups = animalsAtLocation(dataset, emptyKaninHus);
  assert.deepEqual(groups.map((g) => g.species.id), ["hast", "kanin"]);
  assert.equal(groups[0].animals.length, 10);
  assert.equal(groups[1].animals.length, 16);
  const noOne = { ...emptyKaninHus, species: ["ko"] };
  const withGone = {
    ...dataset,
    animals: dataset.animals.map((a) => (a.species === "ko" ? { ...a, status: "gone" as const } : a)),
  };
  assert.deepEqual(
    animalsAtLocation(withGone, noOne).map((g) => [g.species.id, ids(g.animals)]),
    [["ko", []]],
  );
});

test("locationsForSpecies: the same species on several places, and only active places", async () => {
  const dataset = await qaDataset();
  assert.deepEqual(ids(locationsForSpecies(dataset, "get")), ["bjorkhagen", "gethagen", "gethuset", "trekanten"]);
  assert.deepEqual(ids(locationsForSpecies(dataset, "ko")), ["tvaan", "trean", "dalen", "stora-hagen"]);
  assert.deepEqual(ids(locationsForSpecies(dataset, "hast")), [], "hast is deliberately on no place");
  const inactive = {
    ...dataset,
    locations: dataset.locations.map((l) => (l.id === "gethagen" ? { ...l, active: false } : l)),
  };
  assert.deepEqual(ids(locationsForSpecies(inactive, "get")), ["bjorkhagen", "gethuset", "trekanten"]);
});

test("offspring: children of a gone parent, and of a mother of two", async () => {
  const dataset = await qaDataset();
  assert.deepEqual(ids(offspring(dataset, "bomull")), ["dagg", "nystan"]);
  assert.deepEqual(ids(offspring(dataset, "stjarna")), ["lilla-gumman", "rosa"]);
  assert.deepEqual(ids(offspring(dataset, "bocken")), ["rosa"]);
  assert.deepEqual(ids(offspring(dataset, "tuva")), []);
});

test("siblings: at least one shared parent, never the animal itself", async () => {
  const dataset = await qaDataset();
  assert.deepEqual(ids(siblings(dataset, "rosa")), ["lilla-gumman"]);
  assert.deepEqual(ids(siblings(dataset, "lilla-gumman")), ["rosa"]);
  assert.deepEqual(ids(siblings(dataset, "nystan")), ["dagg"]);
  assert.deepEqual(ids(siblings(dataset, "dagg")), ["nystan"]);
  assert.deepEqual(ids(siblings(dataset, "tuva")), [], "no known parents");
  assert.deepEqual(ids(siblings(dataset, "finns-inte")), []);
});

test("parents and breedOf resolve to records, or null", async () => {
  const dataset = await qaDataset();
  const rosa = parents(dataset, animal(dataset, "rosa"));
  assert.equal(rosa.mother?.name, "Stjärna");
  assert.equal(rosa.father?.name, "Bocken");
  const gumman = parents(dataset, animal(dataset, "lilla-gumman"));
  assert.equal(gumman.mother?.id, "stjarna");
  assert.equal(gumman.father, null);
  assert.equal(breedOf(dataset, animal(dataset, "rosa"))?.name, "Jämtget");
  assert.equal(breedOf(dataset, animal(dataset, "tuva")), null);
});

test("animalsByBreed and animalsOfSpecies, with optional status", async () => {
  const dataset = await qaDataset();
  assert.ok(ids(animalsByBreed(dataset, "jamtget")).includes("rosa"));
  assert.equal(animalsOfSpecies(dataset, "kanin").length, 18);
  assert.equal(animalsOfSpecies(dataset, "kanin", "here").length, 16);
  assert.deepEqual(ids(animalsOfSpecies(dataset, "kanin", "gone")), ["bomull", "dagg"]);
});

test("counted populations are available by species and included at locations", async () => {
  const dataset = await qaDataset();
  assert.equal(populationCount(dataset), 32);
  assert.equal(populationCount(dataset, "hons"), 32);
  assert.deepEqual(populationsOfSpecies(dataset, "hons"), [
    { species: "hons", breed: "svart-dvarghons", count: 18 },
    { species: "hons", breed: "orusthons", count: 14 },
  ]);
  const groups = animalsAtLocation(dataset, location(dataset, "honshuset"));
  assert.equal(groups[0].animals.length, 0);
  assert.equal(groups[0].populations.length, 2);
});

test("speciesOnFarm and speciesOf", async () => {
  const dataset = await qaDataset();
  assert.deepEqual(ids(speciesOnFarm(dataset)), ["get", "far", "ko", "hast", "kanin", "gris", "hons", "katt"]);
  const noRabbits = {
    ...dataset,
    animals: dataset.animals.map((a) => (a.species === "kanin" ? { ...a, status: "gone" as const } : a)),
  };
  assert.deepEqual(ids(speciesOnFarm(noRabbits)), ["get", "far", "ko", "hast", "gris", "hons", "katt"]);
  assert.equal(speciesOf(dataset, "far")?.plural, "Får");
  assert.equal(speciesOf(dataset, "lama"), null);
});
