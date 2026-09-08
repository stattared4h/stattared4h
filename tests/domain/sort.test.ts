/**
 * 02-§6.9: Swedish order with Å, Ä and Ö after Z, and id as the tie-breaker.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { compareByName, sortAnimals, sortLocations } from "../../source/ts/domain/sort.ts";
import type { Animal, Location } from "../../source/ts/domain/types.ts";
import { qaDataset } from "./helpers.ts";

function animal(id: string, name: string): Animal {
  return {
    id,
    name,
    species: "get",
    breed: null,
    sex: "unknown",
    born: null,
    mother: null,
    father: null,
    status: "here",
    description: null,
    photos: [],
  };
}

function location(id: string, name: string): Location {
  return { id, name, shortName: null, kind: "djurplats" as const, species: [], note: null, description: null, lat: null, lon: null, accessible: true, active: true, label: null, photos: [] };
}

test("Å, Ä and Ö sort after Z, not among A and O", () => {
  const names = ["Örn", "Anna", "Ärlig", "Zeb", "Åke", "Olle"];
  const sorted = sortAnimals(names.map((n, i) => animal(`a${i}`, n))).map((a) => a.name);
  assert.deepEqual(sorted, ["Anna", "Olle", "Zeb", "Åke", "Ärlig", "Örn"]);
});

test("equal names fall back to id", () => {
  const sorted = sortAnimals([animal("rosa-2", "Rosa"), animal("rosa", "Rosa"), animal("rosa-1", "Rosa")]);
  assert.deepEqual(
    sorted.map((a) => a.id),
    ["rosa", "rosa-1", "rosa-2"],
  );
});

test("sorting is case-insensitive and returns a copy", () => {
  const input = [animal("b", "bocken"), animal("a", "Anna")];
  const sorted = sortAnimals(input);
  assert.deepEqual(
    sorted.map((a) => a.id),
    ["a", "b"],
  );
  assert.equal(input[0].id, "b", "input is not mutated");
});

test("locations sort the same way", () => {
  // Å sorterar efter Z i svenskan, så Tåmossen hamnar sist trots att T kommer före Ä.
  const sorted = sortLocations([location("t", "Tåmossen"), location("e", "Ekbacken"), location("b", "Bräckebur")]);
  assert.deepEqual(
    sorted.map((l) => l.id),
    ["b", "e", "t"],
  );
  assert.ok(compareByName(location("x", "Ö"), location("y", "Z")) > 0);
});

test("the validated QA dataset is already sorted", async () => {
  const dataset = await qaDataset();
  assert.deepEqual(
    dataset.animals.map((a) => a.name),
    [...dataset.animals].sort(compareByName).map((a) => a.name),
  );
  assert.equal(dataset.animals[0].name, "Agda");
  assert.equal(dataset.animals.at(-1)?.name, "Vinter");
  assert.deepEqual(
    dataset.locations.map((l) => l.id),
    [
      "ettan",
      "tvaan",
      "trean",
      "fyran",
      "a",
      "b",
      "brackebur",
      "c",
      "cafeet",
      "d",
      "dalen",
      "dammen",
      "ekbacken",
      "gethuset",
      "grillplatsen-vid-gardsplanen",
      "honshuset",
      "kaninhagen",
      "kapphastbanan",
      "lekplatsen",
      "lilla-grishagen",
      "lottas-vaffelstuga",
      "lygnslatt-1",
      "lygnslatt-2",
      "parkeringen-vid-infarten",
      "parkeringen-vid-toaletterna",
      "stallet",
      "stora-grishagen",
      "stallplatsen",
      "toaletterna",
      "trekanten",
      "tamossen",
      "vandrarhemmet",
    ],
  );
  assert.deepEqual(
    dataset.species.map((s) => s.id),
    ["get", "far", "ko", "hast", "kanin", "gris", "hons", "katt"],
    "species keep the order of species.yaml",
  );
});
