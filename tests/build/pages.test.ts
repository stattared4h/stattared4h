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
  ANIMAL_PLACES_HEADING,
  buildViews,
  GONE_LABEL,
  HERITAGE_LABEL,
  NO_SPECIES_AT_LOCATION_TEXT,
  NOT_ACCESSIBLE_TEXT,
  OTHER_PLACES_HEADING,
  portraitOf,
  spanaRounds,
  type SiteViews,
} from "../../source/ts/build/pages.ts";
import { PLACE_SYMBOLS } from "../../source/ts/build/symbols.ts";
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

/** A dataset with nothing in it: the farm before its first animal (02-§6.2). */
function emptyDataset(): Dataset {
  return { species: [], breeds: [], populations: [], animals: [], locations: [], images: [], clues: [] };
}

let emptyCached: SiteViews | null = null;

function emptyViews(): SiteViews {
  emptyCached ??= buildViews(emptyDataset(), { base: "/", farm: FARM });
  return emptyCached;
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

describe("the home page (02-§5.7, 02-§5.63)", () => {
  test("is a card per errand: the map, the animals and then a card per game (02-§12.2, 02-§13.1)", async () => {
    const { views } = await qaViews();
    assert.deepEqual(
      views.home.cards.map((card) => [card.id, card.url]),
      [
        ["karta", "/karta/"],
        ["djuren", "/djuren/"],
        ["bingo", "/bingo/"],
        ["spana", "/spana/"],
      ],
    );
    for (const card of views.home.cards) {
      assert.ok(card.title.length > 0, `${card.id} saknar rubrik`);
      assert.ok(card.text.length > 0, `${card.id} saknar rad`);
      assert.match(card.symbol, /^<(path|circle|g)\s/, `${card.id} saknar ritad symbol`);
    }
  });

  test("the cards carry no data of their own: an empty farm still has all four", () => {
    const views = buildViews(emptyDataset(), { base: "/", farm: FARM });
    assert.deepEqual(views.home.cards.map((card) => card.id), ["karta", "djuren", "bingo", "spana"]);
  });

  test("every card has a symbol of its own: no two errands look alike", () => {
    const symbols = new Set(emptyViews().home.cards.map((card) => card.symbol));
    assert.equal(symbols.size, emptyViews().home.cards.length);
  });
});

describe("the Spana! page (02-§13.5, 02-§13.6)", () => {
  test("lists every clue in the dataset's own order, with picture, text and place", async () => {
    const { views, dataset } = await qaViews();
    assert.deepEqual(
      views.spana.clues.map((clue) => clue.key),
      dataset.clues.map((clue) => clue.id),
      "the catalogue's order, unsorted and unfiltered (02-§13.6)",
    );
    for (const clue of views.spana.clues) {
      const source = dataset.clues.find((one) => one.id === clue.key);
      assert.ok(source, clue.key);
      assert.equal(clue.photo.id, source.image.id, "the clue shows its own picture");
      assert.equal(clue.text, source.text, "the text is passed on as written, null and all");
      const place = dataset.locations.find((one) => one.id === source.location);
      assert.equal(clue.location, place?.name, "the answer is the place's name, not its id (02-§13.13)");
    }
  });

  test("a clue with no text of its own is still a clue", async () => {
    const { views } = await qaViews();
    assert.ok(views.spana.clues.some((clue) => clue.text === null), "QA has a picture-only clue (04-§11.4)");
    assert.ok(views.spana.clues.some((clue) => clue.text !== null), "and one with a text");
  });

  test("no clues, no round: an empty dataset gives an empty list and nothing to choose", () => {
    assert.deepEqual(emptyViews().spana.clues, []);
    assert.deepEqual(emptyViews().spana.rounds, []);
  });

  test("the round lengths say how many stops they really give (02-§13.8)", async () => {
    const { views } = await qaViews();
    assert.deepEqual(
      views.spana.rounds.map((round) => [round.size, round.stops, round.label]),
      [
        [4, 4, "Kort runda, 4 stopp"],
        [8, 8, "Lång runda, 8 stopp"],
      ],
      "tolv ledtrådar räcker till båda",
    );
  });

  test("a small catalogue is offered fewer lengths, and never promises stops it cannot give", () => {
    // A length that would give no more stops than a shorter one is not a choice at all,
    // and a label that says eight while the round is five has told the player something
    // untrue (02-§13.8).
    assert.deepEqual(spanaRounds(0), []);
    assert.deepEqual(spanaRounds(1).map((round) => round.label), ["Kort runda, 1 stopp"]);
    assert.deepEqual(spanaRounds(4).map((round) => round.label), ["Kort runda, 4 stopp"]);
    assert.deepEqual(spanaRounds(5).map((round) => round.label), ["Kort runda, 4 stopp", "Lång runda, 5 stopp"]);
    assert.deepEqual(spanaRounds(20).map((round) => round.label), ["Kort runda, 4 stopp", "Lång runda, 8 stopp"]);
    for (const count of [1, 3, 4, 5, 8, 12]) {
      for (const round of spanaRounds(count)) {
        assert.ok(round.stops <= count, `${count} ledtrådar lovade ${round.stops} stopp`);
      }
    }
  });
});

describe("the bingo page (02-§12.4)", () => {
  test("offers every species with a photo, and every animal here with a portrait", async () => {
    const { views, dataset } = await qaViews();
    assert.deepEqual(
      views.bingo.species.map((c) => c.key),
      dataset.species.filter((s) => s.photo !== null).map((s) => s.id),
    );
    const here = dataset.animals.filter((a) => a.status === "here" && a.photos.length > 0);
    assert.equal(views.bingo.animals.length, here.length);
    assert.ok(views.bingo.animals.some((c) => c.key === "rosa"), "Rosa is here with a portrait");
    assert.ok(!views.bingo.animals.some((c) => c.key === "bocken"), "the gone Bocken is never a square");
    for (const candidate of [...views.bingo.species, ...views.bingo.animals]) {
      assert.ok(candidate.name.length > 0, `${candidate.key} saknar namn`);
      assert.match(candidate.photo.id, /^img-[0-9a-f]{12}$/, `${candidate.key} saknar bild`);
    }
  });

  test("a species without a photo and an animal without a portrait are left out", async () => {
    const { dataset } = await qaViews();
    const trimmed: Dataset = {
      ...dataset,
      species: dataset.species.map((s) => (s.id === "get" ? { ...s, photo: null } : s)),
      animals: dataset.animals.map((a) => (a.id === "rosa" ? { ...a, photos: [] } : a)),
    };
    const views = buildViews(trimmed, { base: "/", farm: FARM });
    assert.ok(!views.bingo.species.some((c) => c.key === "get"));
    assert.ok(!views.bingo.animals.some((c) => c.key === "rosa"));
  });

  test("an empty farm offers nothing, and the page says so instead of a board", () => {
    assert.deepEqual(emptyViews().bingo, { species: [], animals: [] });
  });
});

describe("the animal overview page (02-§5.66)", () => {
  test("lists the species with present animals or counted populations, linked to their pages", async () => {
    const { views } = await qaViews();
    assert.deepEqual(
      views.animalsOverview.species.map((s) => s.id),
      ["get", "far", "ko", "hast", "kanin", "gris", "hons", "katt"],
    );
    assert.equal(views.animalsOverview.species[0].url, "/arter/get/");
    assert.equal(views.animalsOverview.species[0].plural, "Getter");
  });
});

describe("the location page (02-§5.9–5.13)", () => {
  test("the same species on two places: both show the goats, in the species' order", async () => {
    const { views } = await qaViews();
    for (const id of ["tamossen", "brackebur"]) {
      const view = location(views, id);
      assert.equal(view.active, true);
      assert.deepEqual(view.species.map((s) => s.id), ["get"]);
      assert.equal(view.groups[0].heading, "Getterna på gården");
      assert.ok(view.groups[0].cards.some((card) => card.id === "rosa"), `${id} shows Rosa`);
      assert.ok(!view.groups[0].cards.some((card) => card.id === "bocken"), `${id} does not show the gone Bocken`);
      assert.equal(view.groups[0].populationSentence, null);
    }
    assert.equal(location(views, "brackebur").note, "Här går getterna på dagarna.");
    assert.equal(location(views, "brackebur").accessibility, ACCESSIBLE_TEXT);
    assert.equal(location(views, "brackebur").url, "/plats/brackebur/");
  });

  test("two species in one paddock get one group each", async () => {
    const { views } = await qaViews();
    const view = location(views, "lygnslatt-1");
    assert.deepEqual(view.groups.map((g) => g.heading), ["Fåren på gården", "Korna på gården"]);
    assert.equal(view.groups[0].cards.length, 20);
    assert.equal(view.groups[1].cards.length, 10);
    assert.equal(view.accessibility, NOT_ACCESSIBLE_TEXT);
    assert.match(view.description, /Lygnslätt 1 på Stättareds 4H-gård/);
  });

  test("an active place without species has no groups; an inactive one is marked", async () => {
    const { views } = await qaViews();
    const empty = location(views, "a");
    assert.equal(empty.active, true);
    assert.deepEqual(empty.species, []);
    assert.deepEqual(empty.groups, []);
    const inactive = location(views, "d");
    assert.equal(inactive.active, false);
    assert.equal(inactive.url, "/plats/d/");
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
  test("goats: four active places, present and gone animals, and the editorial text", async () => {
    const { views } = await qaViews();
    const get = species(views, "get");
    assert.equal(get.url, "/arter/get/");
    assert.equal(get.whereHeading, "Var finns getterna?");
    assert.deepEqual(get.locations, [
      { name: "Bräckebur", url: "/plats/brackebur/" },
      { name: "Gethuset", url: "/plats/gethuset/" },
      { name: "Trekanten", url: "/plats/trekanten/" },
      { name: "Tåmossen", url: "/plats/tamossen/" },
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
    assert.deepEqual(markers, ["ettan", "tvaan", "trean", "fyran", "a", "b", "brackebur", "c", "cafeet", "dalen", "dammen", "ekbacken", "gethuset", "grillplatsen-vid-gardsplanen", "honshuset", "kaninhagen", "kapphastbanan", "lekplatsen", "lilla-grishagen", "lottas-vaffelstuga", "lygnslatt-1", "lygnslatt-2", "parkeringen-vid-infarten", "parkeringen-vid-toaletterna", "stallet", "stora-grishagen", "stallplatsen", "toaletterna", "trekanten", "tamossen", "vandrarhemmet"]);
    assert.deepEqual(
      views.map.list.map((item) => [item.name, item.species]),
      [
        ["1:an", "Får"],
        ["2:an", "Kor"],
        ["3:an", "Får och kor"],
        ["4:an", "Får"],
        ["A", NO_SPECIES_AT_LOCATION_TEXT],
        ["B", "Kaniner"],
        ["Bräckebur", "Getter"],
        ["C", "Katter"],
        ["Caféet", ""],
        ["Dalen", "Kor"],
        ["Dammen", NO_SPECIES_AT_LOCATION_TEXT],
        ["Ekbacken", "Får"],
        ["Gethuset", "Getter"],
        ["Grillplatsen vid gårdsplanen", ""],
        ["Hönshuset", "Höns"],
        ["Kaninhagen", "Kaniner"],
        ["Käpphästbanan", ""],
        ["Lekplatsen", ""],
        ["Lilla grishagen", "Grisar"],
        ["Lottas våffelstuga", ""],
        ["Lygnslätt 1", "Får och kor"],
        ["Lygnslätt 2", "Grisar"],
        ["Parkeringen vid infarten", ""],
        ["Parkeringen vid toaletterna", ""],
        ["Stallet", "Katter"],
        ["Stora grishagen", "Grisar"],
        ["Ställplatsen", ""],
        ["Toaletterna", ""],
        ["Trekanten", "Getter"],
        ["Tåmossen", "Getter"],
        ["Vandrarhemmet", ""],
      ],
    );
    assert.ok(!views.map.list.some((item) => item.url === "/plats/d/"), "inactive places are not listed");
    assert.deepEqual(views.map.warnings, []);
  });

  test("the list carries the same symbol as the marker (02-§5.39)", async () => {
    const { views } = await qaViews();
    const cafe = views.map.list.find((item) => item.name === "Caféet");
    assert.ok(cafe);
    assert.match(cafe.symbol, /^<svg class="place-list__symbol"/);
    assert.ok(cafe.symbol.includes(PLACE_SYMBOLS.mat), "the café is listed with the food symbol");
    // Also the places the map leaves out: the list is the full way to the information
    // (02-§5.24), so it may not be the poorer of the two.
    assert.ok(
      views.map.list.every((item) => item.symbol.startsWith("<svg class=\"place-list__symbol\"")),
      "every listed place has a symbol",
    );
  });

  test("the list is split in two, animal places first (02-§5.51)", async () => {
    const { views } = await qaViews();
    assert.deepEqual(
      views.map.groups.map((group) => group.heading),
      [ANIMAL_PLACES_HEADING, OTHER_PLACES_HEADING],
    );
    const [animals, other] = views.map.groups;
    assert.ok(animals.items.every((item) => item.animalPlace), "the first group is only animal places");
    assert.ok(other.items.every((item) => !item.animalPlace), "the second group has no animal places");
    // A paddock with no animals right now is still a paddock (02-§5.51).
    assert.ok(
      animals.items.some((item) => item.species === NO_SPECIES_AT_LOCATION_TEXT),
      "an empty paddock stays under the animal heading",
    );
    assert.ok(other.items.some((item) => item.name === "Toaletterna"), "the toilets are under the other heading");
  });

  test("the groups together are exactly the list, in the same order (02-§5.24)", async () => {
    const { views } = await qaViews();
    const grouped = views.map.groups.flatMap((group) => group.items);
    assert.equal(grouped.length, views.map.list.length, "no place is lost and none is listed twice");
    assert.deepEqual(new Set(grouped), new Set(views.map.list), "the groups hold the same items as the list");
    for (const group of views.map.groups) {
      const order = group.items.map((item) => views.map.list.indexOf(item));
      assert.deepEqual(order, [...order].sort((a, b) => a - b), `${group.heading} keeps the list's order`);
    }
  });

  test("an empty group is left out rather than shown as a bare heading (02-§5.51)", async () => {
    const { dataset } = await qaViews();
    const onlyAnimalPlaces: Dataset = {
      ...dataset,
      locations: dataset.locations.filter((location) => location.kind === "djurplats"),
    };
    const views = buildViews(onlyAnimalPlaces, { base: "/", farm: FARM });
    assert.deepEqual(views.map.groups.map((group) => group.heading), [ANIMAL_PLACES_HEADING]);
  });

  test("a place without coordinates is listed but not drawn", async () => {
    const { dataset } = await qaViews();
    const altered: Dataset = {
      ...dataset,
      locations: dataset.locations.map((l) => (l.id === "brackebur" ? { ...l, lat: null, lon: null } : l)),
    };
    const views = buildViews(altered, { base: "/", farm: FARM });
    assert.doesNotMatch(views.map.html, /data-place="brackebur"/);
    assert.ok(views.map.list.some((item) => item.url === "/plats/brackebur/"));
  });
});

describe("an empty dataset (02-§5.7)", () => {
  test("builds views with no pages and no map", () => {
    const views = emptyViews();
    assert.deepEqual(views.animalsOverview.species, []);
    assert.deepEqual(views.locations, []);
    assert.deepEqual(views.animals, []);
    assert.deepEqual(views.species, []);
    // No place at all means no group either: an empty heading is not an answer (02-§5.51).
    assert.deepEqual(views.map, { html: "", list: [], groups: [], warnings: [] });
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
