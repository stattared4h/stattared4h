/**
 * 02-§5.7–5.28 / 03-§4: the page view models, checked against the QA dataset and the
 * cases its README documents. The templates only print what is tested here.
 */
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, test } from "node:test";
import { readSpeciesContent } from "../../source/ts/build/content.ts";
import {
  ACCESSIBLE_TEXT,
  animalCard,
  buildViews,
  GONE_LABEL,
  HERITAGE_LABEL,
  NO_SPECIES_AT_LOCATION_TEXT,
  NOT_ACCESSIBLE_TEXT,
  portraitOf,
  type SiteViews,
} from "../../source/ts/build/pages.ts";
import type { Dataset } from "../../source/ts/domain/types.ts";
import { qaDataset } from "../domain/helpers.ts";

const FARM = "Stättareds 4H-gård";

let cached: { dataset: Dataset; views: SiteViews } | null = null;

async function qaViews(): Promise<{ dataset: Dataset; views: SiteViews }> {
  if (cached === null) {
    const dataset = await qaDataset();
    cached = { dataset, views: buildViews(dataset, { base: "/", farm: FARM, speciesContent: { get: "## Om getter\n\nText." } }) };
  }
  return cached;
}

function location(views: SiteViews, id: string) {
  const found = views.locations.find((l) => l.id === id);
  if (!found) throw new Error(`no location view ${id}`);
  return found;
}

function animal(views: SiteViews, id: string) {
  const found = views.animals.find((a) => a.id === id);
  if (!found) throw new Error(`no animal view ${id}`);
  return found;
}

function species(views: SiteViews, id: string) {
  const found = views.species.find((s) => s.id === id);
  if (!found) throw new Error(`no species view ${id}`);
  return found;
}

describe("the home page (02-§5.7)", () => {
  test("lists the species with present animals or counted populations, linked to their pages", async () => {
    const { views } = await qaViews();
    assert.deepEqual(
      views.home.species.map((s) => s.id),
      ["get", "far", "ko", "hast", "kanin", "gris", "hons", "katt"],
    );
    assert.equal(views.home.species[0].url, "/arter/get/");
    assert.equal(views.home.species[0].plural, "Getter");
  });
});

describe("the location page (02-§5.9–5.13)", () => {
  test("the same species on two places: both show the goats, in the species' order", async () => {
    const { views } = await qaViews();
    for (const id of ["bjorkhagen", "gethagen"]) {
      const view = location(views, id);
      assert.equal(view.active, true);
      assert.deepEqual(view.species.map((s) => s.id), ["get"]);
      assert.equal(view.groups[0].heading, "Getterna på gården");
      assert.ok(view.groups[0].cards.some((card) => card.id === "rosa"), `${id} shows Rosa`);
      assert.ok(!view.groups[0].cards.some((card) => card.id === "bocken"), `${id} does not show the gone Bocken`);
      assert.equal(view.groups[0].populationSentence, null);
    }
    assert.equal(location(views, "gethagen").note, "Här går getterna på dagarna.");
    assert.equal(location(views, "gethagen").accessibility, ACCESSIBLE_TEXT);
    assert.equal(location(views, "gethagen").url, "/plats/gethagen/");
  });

  test("two species in one paddock get one group each", async () => {
    const { views } = await qaViews();
    const view = location(views, "stora-hagen");
    assert.deepEqual(view.groups.map((g) => g.heading), ["Fåren på gården", "Korna på gården"]);
    assert.equal(view.groups[0].cards.length, 20);
    assert.equal(view.groups[1].cards.length, 10);
    assert.equal(view.accessibility, NOT_ACCESSIBLE_TEXT);
    assert.match(view.description, /Stora hagen på Stättareds 4H-gård/);
  });

  test("an active place without species has no groups; an inactive one is marked", async () => {
    const { views } = await qaViews();
    const empty = location(views, "ovre-hagen");
    assert.equal(empty.active, true);
    assert.deepEqual(empty.species, []);
    assert.deepEqual(empty.groups, []);
    const inactive = location(views, "gamla-stallet");
    assert.equal(inactive.active, false);
    assert.equal(inactive.url, "/plats/gamla-stallet/");
    assert.match(inactive.description, /används inte just nu/);
  });

  test("a counted population becomes a sentence instead of cards (02-§5.11)", async () => {
    const { views } = await qaViews();
    const view = location(views, "honshuset");
    assert.equal(view.groups.length, 1);
    assert.equal(view.groups[0].heading, "Hönsen på gården");
    assert.deepEqual(view.groups[0].cards, []);
    assert.equal(view.groups[0].populationSentence, "På gården finns 18 svarta dvärghöns och 14 orusthöns.");
  });
});

describe("the animal page (02-§5.14–5.18)", () => {
  test("Rosa: every fact, the portrait, the other photo, and the family as links", async () => {
    const { views } = await qaViews();
    const rosa = animal(views, "rosa");
    assert.equal(rosa.url, "/djur/rosa/");
    assert.equal(rosa.gone, false);
    const dataset = await qaDataset();
    const rosaData = dataset.animals.find((a) => a.id === "rosa");
    assert.equal(rosa.portrait?.id, rosaData?.photos[0].id);
    assert.deepEqual(rosa.otherPhotos.map((p) => p.id), rosaData?.photos.slice(1).map((p) => p.id));
    assert.equal(rosa.species.name, "Get");
    assert.equal(rosa.species.url, "/arter/get/");
    assert.equal(rosa.breed, "Jämtget (lantras)");
    assert.equal(rosa.sex, "Hona");
    assert.equal(rosa.born, "Född 12 april 2021");
    assert.match(rosa.body ?? "", /framfusiga get/);
    assert.deepEqual(rosa.mother, { name: "Stjärna", url: "/djur/stjarna/" });
    assert.deepEqual(rosa.father, { name: "Bocken", url: "/djur/bocken/" });
    assert.deepEqual(rosa.siblings, [{ name: "Lilla Gumman", url: "/djur/lilla-gumman/" }]);
    assert.deepEqual(rosa.offspring, []);
    assert.equal(rosa.whereQuestion, "Var finns getterna?");
    assert.equal(rosa.description, "Rosa, get på Stättareds 4H-gård – art, ras, släkt och bilder.");
  });

  test("missing facts are null so the template can leave them out; a year-only birth", async () => {
    const { views } = await qaViews();
    const tuva = animal(views, "tuva");
    assert.equal(tuva.breed, null);
    assert.equal(tuva.born, null);
    assert.equal(tuva.portrait?.id, "img-726495c0fd03");
    assert.equal(tuva.body, null);
    assert.equal(tuva.mother, null);
    const vinter = animal(views, "vinter");
    assert.equal(vinter.sex, null, "unknown sex is not shown");
    assert.equal(animal(views, "stjarna").born, "Född 2016");
    assert.deepEqual(animal(views, "stjarna").offspring.map((o) => o.name), ["Lilla Gumman", "Rosa"]);
  });

  test("a gone animal is marked, on its page and on its card", async () => {
    const { views } = await qaViews();
    const { dataset } = await qaViews();
    const bocken = animal(views, "bocken");
    assert.equal(bocken.gone, true);
    assert.deepEqual(bocken.offspring, [{ name: "Rosa", url: "/djur/rosa/" }]);
    const card = animalCard(dataset, dataset.animals.find((a) => a.id === "bocken")!);
    assert.deepEqual(card.tags, ["Jämtget", HERITAGE_LABEL, GONE_LABEL]);
    assert.equal(card.gone, true);
    assert.equal(card.photo?.id, "img-778c1a75a67c");
    assert.equal(card.speciesName, "Get");
  });

  test("the portrait is the first photo in the list (02-§8.11)", () => {
    const photos = [
      { id: "img-000000000001", alt: "a", credit: "c" },
      { id: "img-000000000002", alt: "b", credit: "c" },
    ];
    const base = { id: "a", name: "A", species: "get", breed: null, sex: "female" as const, born: null, mother: null, father: null, status: "here" as const, description: null };
    assert.equal(portraitOf({ ...base, photos })?.id, "img-000000000001");
    assert.equal(portraitOf({ ...base, photos: [photos[1]] })?.id, "img-000000000002");
    assert.equal(portraitOf({ ...base, photos: [] }), null);
  });
});

describe("the species page (02-§5.19–5.22)", () => {
  test("goats: two active places, present and gone animals, and the editorial text", async () => {
    const { views } = await qaViews();
    const get = species(views, "get");
    assert.equal(get.url, "/arter/get/");
    assert.equal(get.whereHeading, "Var finns getterna?");
    assert.deepEqual(get.locations, [
      { name: "Björkhagen", url: "/plats/bjorkhagen/" },
      { name: "Gethagen", url: "/plats/gethagen/" },
    ]);
    assert.equal(get.unknownWhere, null);
    assert.equal(get.hereHeading, "Getterna på gården");
    assert.equal(get.here.length, 19);
    assert.deepEqual(get.gone.map((c) => c.id), ["bocken"]);
    assert.equal(get.body, "## Om getter\n\nText.");
    assert.equal(get.description, "Var getterna finns på Stättareds 4H-gård, och vilka de är.");
  });

  test("horses are on no active place; hens are a counted population; no content is null", async () => {
    const { views } = await qaViews();
    const hast = species(views, "hast");
    assert.deepEqual(hast.locations, []);
    assert.equal(hast.unknownWhere, "Just nu vet vi inte var hästarna går");
    assert.equal(hast.body, null);
    const hons = species(views, "hons");
    assert.equal(hons.populationSentence, "På gården finns 18 svarta dvärghöns och 14 orusthöns.");
    assert.deepEqual(hons.here, []);
    assert.equal(species(views, "far").unknownWhere, null);
    assert.equal(species(views, "far").whereHeading, "Var finns fåren?");
  });
});

describe("the map page (02-§5.23–5.25)", () => {
  test("a marker per active place with coordinates; the list has every active place", async () => {
    const { views } = await qaViews();
    const markers = [...views.map.html.matchAll(/data-place="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(markers, ["bjorkhagen", "gethagen", "grishagen", "honshuset", "kattvinden", "smadjurshuset", "stora-hagen", "ovre-hagen"]);
    assert.deepEqual(
      views.map.list.map((item) => [item.name, item.species]),
      [
        ["Björkhagen", "Getter"],
        ["Gethagen", "Getter"],
        ["Grishagen", "Grisar"],
        ["Hönshuset", "Höns"],
        ["Kattvinden", "Katter"],
        ["Smådjurshuset", "Kaniner"],
        ["Stora hagen", "Får och kor"],
        ["Övre hagen", NO_SPECIES_AT_LOCATION_TEXT],
      ],
    );
    assert.ok(!views.map.list.some((item) => item.url === "/plats/gamla-stallet/"), "inactive places are not listed");
    assert.deepEqual(views.map.warnings, []);
  });

  test("a place without coordinates is listed but not drawn", async () => {
    const { dataset } = await qaViews();
    const altered: Dataset = {
      ...dataset,
      locations: dataset.locations.map((l) => (l.id === "gethagen" ? { ...l, lat: null, lon: null } : l)),
    };
    const views = buildViews(altered, { base: "/", farm: FARM });
    assert.doesNotMatch(views.map.html, /data-place="gethagen"/);
    assert.ok(views.map.list.some((item) => item.url === "/plats/gethagen/"));
  });
});

describe("an empty dataset (02-§5.7)", () => {
  test("builds views with no pages and no map", () => {
    const empty: Dataset = { species: [], breeds: [], populations: [], animals: [], locations: [], images: [] };
    const views = buildViews(empty, { base: "/", farm: FARM });
    assert.deepEqual(views.home.species, []);
    assert.deepEqual(views.locations, []);
    assert.deepEqual(views.animals, []);
    assert.deepEqual(views.species, []);
    assert.deepEqual(views.map, { html: "", list: [], warnings: [] });
  });
});

describe("species content (02-§5.22)", () => {
  test("readSpeciesContent reads <id>.md files and ignores everything else", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "s4h-content-"));
    try {
      assert.deepEqual(await readSpeciesContent(path.join(dir, "missing")), {});
      await writeFile(path.join(dir, "get.md"), "Om getter.\n");
      await writeFile(path.join(dir, "README.txt"), "not content");
      assert.deepEqual(await readSpeciesContent(dir), { get: "Om getter.\n" });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
