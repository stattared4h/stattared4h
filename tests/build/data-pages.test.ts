/**
 * The data-driven pages in the built site (02-§5.1, 02-§5.7–5.28, 02-§6.2, 02-§8.5–8.7,
 * 06-§2.1). One QA build is made for the whole file; an empty dataset is built once
 * more to prove the build works before the farm's data exists.
 */
import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { buildSite, listFiles } from "./build-site.ts";
import { qaDataset } from "../domain/helpers.ts";

let site: string;
const cleanup: string[] = [];

before(async () => {
  site = await buildSite({ env: { BASE_PATH: "/", DATA_DIR: "source/data-qa" } });
  cleanup.push(site);
});

after(async () => {
  await Promise.all(cleanup.map((dir) => rm(dir, { recursive: true, force: true })));
});

async function page(url: string): Promise<string> {
  return readFile(path.join(site, url, "index.html"), "utf8");
}

function main(html: string): string {
  return html.slice(html.indexOf("<main"), html.indexOf("</main>"));
}

describe("every page exists (02-§5.1–5.2)", () => {
  test("a location page for all 32 places, an animal page for all 100, a species page for all eight", async () => {
    const files = await listFiles(site);
    const locations = files.filter((f) => /^plats\/[^/]+\/index\.html$/.test(f));
    const animals = files.filter((f) => /^djur\/[^/]+\/index\.html$/.test(f));
    const species = files.filter((f) => /^arter\/[^/]+\/index\.html$/.test(f));
    assert.equal(locations.length, 32);
    assert.ok(locations.includes(path.join("plats", "d", "index.html")), "the inactive place keeps its page");
    assert.equal(animals.length, 100);
    assert.equal(species.length, 8);
    assert.ok(files.includes(path.join("karta", "index.html")), "the map has a page of its own (02-§5.1)");
    assert.ok(files.includes(path.join("djuren", "index.html")), "the animals have a page of their own (02-§5.1)");
  });

  test("every internal link and image points at a file in the output", async () => {
    const files = await listFiles(site);
    const existing = new Set(files.map((f) => f.split(path.sep).join("/")));
    const missing: string[] = [];
    let checked = 0;
    for (const file of files.filter((f) => f.endsWith(".html"))) {
      const html = await readFile(path.join(site, file), "utf8");
      const refs: string[] = [];
      for (const match of html.matchAll(/\b(?:href|src)="([^"#?]*)/g)) refs.push(match[1]);
      for (const match of html.matchAll(/\bsrcset="([^"]*)"/g)) {
        for (const candidate of match[1].split(",")) refs.push(candidate.trim().split(/\s+/)[0]);
      }
      for (const ref of refs) {
        if (!ref.startsWith("/") || ref.startsWith("//")) continue;
        checked += 1;
        const target = ref.endsWith("/") ? `${ref.slice(1)}index.html` : ref.slice(1);
        if (!existing.has(target)) missing.push(`${file}: ${ref}`);
      }
    }
    assert.deepEqual(missing, [], "broken internal links");
    assert.ok(checked > 500, `only ${checked} internal references found — does the test still match the markup?`);
  });

  test("every page has exactly one h1 and never the word location", async () => {
    for (const file of (await listFiles(site)).filter((f) => f.endsWith(".html"))) {
      const html = await readFile(path.join(site, file), "utf8");
      assert.equal(html.match(/<h1[\s>]/g)?.length, 1, `${file}: exakt en h1`);
      assert.doesNotMatch(html, /location/i, `${file}: the word location (ADR 0012)`);
    }
  });
});

describe("the home page (02-§5.7–5.8, 02-§5.63–5.64)", () => {
  test("is a nav of cards: the map first, the animals second, then a card per game, and nothing else", async () => {
    const html = main(await page(""));
    const cards = [...html.matchAll(/<a class="home-card" href="\/([^"]*)">/g)].map((m) => `/${m[1]}`);
    assert.deepEqual(
      cards,
      ["/karta/", "/djuren/", "/bingo/", "/spana/"],
      "ett kort per ärende, kartan först (02-§5.7, 02-§12.2, 02-§13.1)",
    );
    assert.match(html, /<h2 class="home-card__title">Kartan<\/h2>/);
    assert.match(html, /<h2 class="home-card__title">Djuren<\/h2>/);
    assert.match(html, /<h2 class="home-card__title">Djurbingo<\/h2>/);
    assert.match(html, /<h2 class="home-card__title">Spana!<\/h2>/);
    assert.match(html, /<ul class="card-grid">/, "korten ligger i djurkortens rutnät (02-§5.64)");
    assert.match(html, /href="https:\/\/www\.4h\.se\/stattared\/"/, "meningen om vad sajten är (02-§5.8)");
  });

  test("carries none of the content the cards lead to (02-§5.7)", async () => {
    const html = main(await page(""));
    for (const marker of ["map__drawing", "place-list__link", "species-tile", "data-animal-id-search", "Fler kartor i området", "data-bingo-board", "data-spana-list"]) {
      assert.ok(!html.includes(marker), `startsidan bär inte ${marker}`);
    }
  });

  test("every card's symbol is decorative; the heading carries the text (05-§6.45)", async () => {
    const html = main(await page(""));
    const symbols = [...html.matchAll(/<svg class="home-card__symbol"([^>]*)>/g)].map((m) => m[1]);
    assert.equal(symbols.length, 4);
    for (const attributes of symbols) assert.match(attributes, /aria-hidden="true"/);
  });
});

describe("the animal overview page (02-§5.66, 02-§5.52)", () => {
  test("shows the ear tag search first, then the species on the farm", async () => {
    const html = main(await page("djuren"));
    assert.ok(
      html.indexOf("data-animal-id-search") < html.indexOf("species-tile"),
      "sökningen står överst, djurslagen under (02-§5.52)",
    );
    const tiles = [...html.matchAll(/<a class="species-tile" href="\/arter\/([^/]+)\/">/g)].map((m) => m[1]);
    assert.deepEqual(tiles, ["get", "far", "ko", "hast", "kanin", "gris", "hons", "katt"]);
    assert.match(html, /Getter<\/span>/);
    assert.doesNotMatch(html, /inte inlagda/);
    assert.doesNotMatch(html, /map__drawing/, "kartan bor på kartsidan");
  });
});

describe("the location page (02-§5.9–5.13, 05-§6.24)", () => {
  test("Tåmossen and Bräckebur both show the goats under 'Getterna på gården'", async () => {
    for (const id of ["tamossen", "brackebur"]) {
      const html = main(await page(`plats/${id}`));
      assert.match(html, /<h1>(Tåmossen|Bräckebur)<\/h1>/);
      assert.match(html, /<a class="species-tile" href="\/arter\/get\/">/);
      assert.match(html, /<h2>Getterna på gården<\/h2>/);
      assert.match(html, /href="\/djur\/rosa\/"/);
      assert.doesNotMatch(html, /href="\/djur\/bocken\/"/, "gone animals are not on the location page");
      assert.match(html, /<button class="button button--secondary share-button" type="button" data-share-button hidden>Dela<\/button>/);
    }
    const brackebur = main(await page("plats/brackebur"));
    assert.match(brackebur, /<p class="place-note">Här går getterna på dagarna\.<\/p>/);
    assert.match(brackebur, /<p class="note">Hit når man med rullstol och barnvagn<\/p>/);
    assert.match(brackebur, /<div class="prose"><p>Hage med stubbar att klättra på/);
  });

  test("Lygnslätt 1 has two species and is not accessible", async () => {
    const html = main(await page("plats/lygnslatt-1"));
    assert.deepEqual([...html.matchAll(/<a class="species-tile" href="\/arter\/([^/]+)\/">/g)].map((m) => m[1]), ["far", "ko"]);
    assert.match(html, /<h2>Fåren på gården<\/h2>/);
    assert.match(html, /<h2>Korna på gården<\/h2>/);
    assert.match(html, /Hit når man inte med rullstol eller barnvagn/);
  });

  test("the empty place, the inactive place and the counted population", async () => {
    const empty = main(await page("plats/a"));
    assert.match(empty, /Just nu går inga djur här/);
    assert.match(empty, /<a class="button" href="\/karta\/">Karta över gården<\/a>/);
    const inactive = main(await page("plats/d"));
    assert.match(inactive, /Den här platsen används inte just nu/);
    assert.match(inactive, /<a class="button" href="\/karta\/">Karta över gården<\/a>/);
    assert.doesNotMatch(inactive, /species-tile|animal-card/);
    const hens = main(await page("plats/honshuset"));
    assert.match(hens, /<h2>Hönsen på gården<\/h2>/);
    assert.match(hens, /På gården finns 18 svarta dvärghöns och 14 orusthöns\./);
    assert.doesNotMatch(hens, /animal-card/);
  });
});

describe("the animal page (02-§5.14–5.18, 02-§8.5–8.7)", () => {
  test("Rosa: facts, birth date, Markdown, family links, photos with credit, and the species link", async () => {
    const html = main(await page("djur/rosa"));
    assert.match(html, /<h1>Rosa<\/h1>/);
    assert.match(html, /<dt>Art<\/dt>\s*<dd><a href="\/arter\/get\/">Get<\/a><\/dd>/);
    assert.match(html, /<dt>Ras<\/dt>\s*<dd>Jämtget \(lantras\)<\/dd>/);
    assert.match(html, /<dt>Kön<\/dt>\s*<dd>Hona<\/dd>/);
    assert.match(html, /Född 12 april 2021/);
    assert.match(html, /<p>Hon är dotter till Stjärna\.<\/p>/, "Markdown paragraphs");
    assert.match(html, /<dt>Mor<\/dt>\s*<dd><a href="\/djur\/stjarna\/">Stjärna<\/a><\/dd>/);
    assert.match(html, /<dt>Far<\/dt>\s*<dd><a href="\/djur\/bocken\/">Bocken<\/a><\/dd>/);
    assert.match(html, /<dt>Syskon<\/dt>[\s\S]*?<a href="\/djur\/lilla-gumman\/">Lilla Gumman<\/a>/);
    assert.match(html, /<a class="button" href="\/arter\/get\/">Var finns getterna\?<\/a>/);
    assert.doesNotMatch(html, /Har lämnat gården/);

    const images = [...html.matchAll(/<img [^>]+>/g)].map((m) => m[0]);
    assert.equal(images.length, 3, "the portrait, a second photo, and the one shared with Lilla Gumman");
    assert.match(images[0], /src="\/images\/img-[0-9a-f]{12}-800\.webp"/, "flat path, id as name (04-§9.1)");
    assert.match(images[0], /fetchpriority="high"/, "the first image is eager (03-§6.3)");
    assert.doesNotMatch(images[0], /loading="lazy"/);
    assert.match(images[1], /loading="lazy"/);
    for (const image of images) {
      assert.match(image, /\balt="[^"]+"/);
      assert.match(image, /\bwidth="\d+" height="\d+"/);
      assert.match(image, /\bsrcset="[^"]*400\.webp 400w/);
    }
    assert.equal(
      (html.match(/Foto: AI-genererad med OpenAI ImageGen/g) ?? []).length,
      3,
      "a credit next to every photo (02-§8.7)",
    );
  });

  test("Bocken has left the farm; Tuva has a shared photo but no optional facts", async () => {
    const bocken = main(await page("djur/bocken"));
    assert.match(bocken, /<h1>Bocken<\/h1>\s*<p><span class="tag">Har lämnat gården<\/span><\/p>/);
    assert.match(bocken, /Född 2015/);
    assert.match(bocken, /<dt>Avkomma<\/dt>[\s\S]*?<a href="\/djur\/rosa\/">Rosa<\/a>/);
    assert.match(bocken, /<img [^>]*img-778c1a75a67c/);
    const tuva = main(await page("djur/tuva"));
    assert.doesNotMatch(tuva, /<dt>Ras<\/dt>|Född|<h2>Släkt<\/h2>/);
    assert.match(tuva, /<img [^>]*img-726495c0fd03/);
    assert.match(tuva, /Foto: AI-genererad med OpenAI ImageGen/);
    const vinter = main(await page("djur/vinter"));
    assert.doesNotMatch(vinter, /<dt>Kön<\/dt>/, "unknown sex is not shown");
  });
});

describe("images as their own posts (02-§8.8–8.12, ADR 0015)", () => {
  test("no image URL carries a per-kind sub-directory", async () => {
    for (const file of (await listFiles(site)).filter((f) => f.endsWith(".html"))) {
      const html = await readFile(path.join(site, file), "utf8");
      assert.doesNotMatch(html, /\/images\/(animals|species|places|content)\//, file);
    }
  });

  test("a photo shared by two records is one file and one alt text (02-§8.10)", async () => {
    const dataset = await qaDataset();
    const shared = dataset.animals
      .flatMap((animal) => animal.photos.map((photo) => photo.id))
      .find((id, index, all) => all.indexOf(id) !== index);
    assert.ok(shared, "the QA data should share a photo between two animals (02-§6.12)");

    const users = dataset.animals.filter((animal) => animal.photos.some((photo) => photo.id === shared));
    assert.ok(users.length >= 2);
    const alts = new Set(
      users.flatMap((animal) => animal.photos.filter((photo) => photo.id === shared).map((photo) => photo.alt)),
    );
    assert.equal(alts.size, 1, "the alt text lives in the image post, so it cannot differ");

    for (const animal of users) {
      const html = main(await page(`djur/${animal.id}`));
      assert.match(html, new RegExp(`${shared}-[0-9]+\\.webp`), animal.id);
    }
  });

  test("the location page shows the place's photos with a credit (02-§5.31)", async () => {
    const dataset = await qaDataset();
    const withPhotos = dataset.locations.find((location) => location.photos.length > 0);
    assert.ok(withPhotos, "the QA data should have a location with photos (02-§6.12)");

    const html = main(await page(`plats/${withPhotos.id}`));
    for (const photo of withPhotos.photos) {
      assert.match(html, new RegExp(`${photo.id}-[0-9]+\\.webp`));
    }
    assert.match(html, new RegExp(`Foto: ${withPhotos.photos[0].credit}`));
    // The species tiles stay above the photos, so they are still reachable without
    // scrolling on a phone (05-§6.24).
    const tiles = html.indexOf("species-tile");
    const firstPhoto = html.indexOf(withPhotos.photos[0].id);
    assert.ok(tiles >= 0, "the location page should have species tiles");
    assert.ok(firstPhoto >= 0, "the location page should show the first photo");
    assert.ok(tiles < firstPhoto, "the species tiles come before the photos");
  });

  test("a location without photos shows no placeholder (02-§5.31)", async () => {
    const dataset = await qaDataset();
    const without = dataset.locations.find((location) => location.photos.length === 0 && location.active);
    assert.ok(without);
    const html = main(await page(`plats/${without.id}`));
    assert.doesNotMatch(html, /class="photo"/);
  });

  test("a Markdown image in a description becomes a responsive image (02-§8.12)", async () => {
    const dataset = await qaDataset();
    const location = dataset.locations.find((l) => /!\[\]\(img-/.test(l.description ?? ""));
    assert.ok(location, "the QA data should have a location whose description contains an image");
    const id = /!\[\]\((img-[0-9a-f]{12})\)/.exec(location.description ?? "")?.[1];
    const html = main(await page(`plats/${location.id}`));
    assert.match(html, new RegExp(`<img [^>]*src="/images/${id}-[0-9]+\\.webp"`));
    assert.match(html, /<img [^>]*\balt="[^"]+"/, "the alt text comes from the image post");
    assert.doesNotMatch(html, /!\[\]/, "the Markdown source never reaches the page");
  });
});

describe("the species page (02-§5.19–5.22)", () => {
  test("goats: places as links, present animals, and the gone ones under their heading", async () => {
    const html = main(await page("arter/get"));
    assert.match(html, /<h1>Getter<\/h1>/);
    assert.match(html, /<h2>Var finns getterna\?<\/h2>/);
    assert.match(html, /href="\/plats\/tamossen\/">Tåmossen</);
    assert.match(html, /href="\/plats\/brackebur\/">Bräckebur</);
    assert.match(html, /<h2>Getterna på gården<\/h2>/);
    const gone = html.slice(html.indexOf("<h2>Har lämnat gården</h2>"));
    assert.match(gone, /href="\/djur\/bocken\/"/);
    assert.match(gone, /<li class="tag">Har lämnat gården<\/li>/, "the card is marked too (02-§5.18)");
    assert.doesNotMatch(html.slice(0, html.indexOf("<h2>Har lämnat gården</h2>")), /href="\/djur\/bocken\/"/);
  });

  test("horses: nobody knows where; hens: a counted population; no empty editorial heading", async () => {
    const hast = main(await page("arter/hast"));
    assert.match(hast, /Just nu vet vi inte var hästarna går/);
    assert.match(hast, /<a class="button" href="\/karta\/">Karta över gården<\/a>/);
    const hons = main(await page("arter/hons"));
    assert.match(hons, /På gården finns 18 svarta dvärghöns och 14 orusthöns\./);
    assert.doesNotMatch(hons, /animal-card/);
    assert.doesNotMatch(hons, /class="prose"/);
  });
});

describe("the map page (02-§5.23–5.27, 02-§5.65)", () => {
  test("a marker per active place with coordinates, the description, and the list", async () => {
    const html = main(await page("karta"));
    assert.match(html, /<svg class="map__drawing" [^>]*role="img" aria-label="Karta över Stättared med gårdens hagar">/);
    const markers = [...html.matchAll(/<a class="map__marker map__marker--wide-[\w-]+ map__marker--desktop-[\w-]+(?: map__marker--zoom-[\w-]+)?" href="\/plats\/([^/]+)\/"/g)].map((m) => m[1]);
    assert.equal(markers.length, 31, "32 places minus the inactive one without coordinates");
    assert.ok(!markers.includes("d"));
    const list = html.slice(html.indexOf('<ul class="place-list">'));
    assert.match(
      list,
      /href="\/plats\/lygnslatt-1\/"><svg class="place-list__symbol"[^>]*>.*?<\/svg>Lygnslätt 1<\/a>\s*<span class="place-list__species">Får och kor<\/span>/,
      "the list carries the same symbol in front of the name (02-§5.39)",
    );
    assert.doesNotMatch(list, /href="\/plats\/d\/"/, "den inaktiva platsen står inte i listan");
    // 02-§5.26 forbids fetching anything from outside; 02-§5.34 adds two ordinary
    // links out. Checking the two separately keeps both requirements honest.
    assert.doesNotMatch(html, /(?:src|srcset)="https?:|url\(\s*https?:/, "nothing is fetched from outside (02-§5.26)");
    assert.match(html, /<h2>Fler kartor i området<\/h2>/);
    assert.ok(
      html.indexOf("map__drawing") < html.indexOf("place-list__link") &&
        html.indexOf("place-list__link") < html.indexOf("Fler kartor i området"),
      "kartan, sedan platslistan, sist fler kartor (02-§5.65)",
    );
    assert.ok(
      html.indexOf("<h2>Hagar och djurhus</h2>") < html.indexOf("<h2>Annat på gården</h2>"),
      "the animal places are listed before everything else (02-§5.51)",
    );
    assert.deepEqual(
      [...html.matchAll(/href="(https?:[^"]+)"/g)].map((m) => m[1]),
      [
        // The two area maps (02-§5.34). Nothing else may lead out of the map page; the
        // sentence about the main site belongs to the home page (02-§5.8).
        "https://www.4h.se/stattared/vandring-fiske/",
        "https://www.naturkartan.se/sv/kungsbacka",
      ],
      "only the two area maps lead out",
    );
  });
});

describe("a place that is not a djurplats never mentions animals (02-§5.35, ADR 0019)", () => {
  test("the café page shows its text and accessibility, and no animal sentence", async () => {
    const html = main(await page("plats/cafeet"));
    assert.match(html, /<h1>Caféet<\/h1>/);
    assert.match(html, /Öppet på helger i sommar/, "the note is shown");
    assert.match(html, /Hit når man med rullstol och barnvagn/);
    assert.doesNotMatch(html, /Just nu går inga djur här/, "that sentence belongs to a djurplats");
    assert.doesNotMatch(html, /species-tile/, "no species boxes");
    assert.doesNotMatch(html, /animal-card/, "no animals");
  });

  // The other half of 02-§5.35: the sentence the café must not show is exactly the one an
  // empty paddock must (02-§5.12). A is the QA dataset's active place without
  // species; C has cats and would say nothing either way.
  test("a djurplats without animals still says so", async () => {
    const html = main(await page("plats/a"));
    assert.match(html, /<h1>A<\/h1>/);
    assert.match(html, /Just nu går inga djur här/);
    assert.match(html, /Karta över gården/, "and a way back to the map (02-§5.12)");
  });
});

describe("the bingo page (02-§12.2–12.4, 02-§12.7, 02-§12.13)", () => {
  test("has the start screen, the game, one template per candidate and the dialog", async () => {
    const html = main(await page("bingo"));
    const dataset = await qaDataset();
    assert.match(html, /<h1>Djurbingo<\/h1>/);
    assert.match(html, /data-bingo-start/, "startskärmen");
    assert.match(html, /name="size" value="3" checked/);
    assert.match(html, /name="size" value="4"/);
    assert.match(html, /name="level" value="species" checked/);
    assert.match(html, /name="level" value="animal"/, "the QA data has animals with portraits, so the level is offered");
    assert.match(html, /data-bingo-game hidden/, "the game waits for the script");
    assert.match(html, /data-bingo-dialog/, "dialogen");
    assert.match(html, /<noscript>/, "utan JavaScript säger sidan det (02-§12.13)");
    const species = html.match(/<template data-level="species"/g) ?? [];
    const animals = html.match(/<template data-level="animal"/g) ?? [];
    assert.equal(species.length, dataset.species.filter((s) => s.photo !== null).length);
    assert.equal(animals.length, dataset.animals.filter((a) => a.status === "here" && a.photos.length > 0).length);
    assert.match(html, /<template data-level="species" data-key="get" data-name="Get"><img [^>]*srcset=/, "the template holds the site's own picture markup");
    assert.doesNotMatch(html, /<template[^>]*><img [^>]*fetchpriority/, "a template is never the page's eager image");
  });

  test("the home page and the menu lead to it (02-§12.2)", async () => {
    const home = main(await page(""));
    assert.match(home, /href="\/bingo\/"[\s\S]*?<h2 class="home-card__title">Djurbingo<\/h2>/);
    const menu = await page("karta");
    assert.match(menu, /href="\/bingo\/"/);
  });
});

describe("the Spana! page (02-§13.1, 02-§13.4, 02-§13.7, 02-§13.10, 02-§13.11)", () => {
  test("has the start screen, the round, one template per clue and the dialog", async () => {
    const html = main(await page("spana"));
    const dataset = await qaDataset();
    assert.match(html, /<h1>Spana!<\/h1>/);
    assert.match(html, /data-spana-start/, "startskärmen");
    assert.match(html, /name="size" value="4" checked/);
    assert.match(html, /name="size" value="8"/, "QA har fler än fyra ledtrådar, så den långa rundan erbjuds (02-§13.8)");
    assert.match(html, /name="level" value="easy" checked/);
    assert.match(html, /name="level" value="hard"/);
    assert.match(html, /data-spana-game hidden/, "spelet väntar på skriptet");
    assert.match(html, /data-spana-dialog/, "dialogen");
    assert.match(html, /<noscript>/, "utan JavaScript säger sidan det (02-§13.4)");
    const templates = html.match(/<template data-clue=/g) ?? [];
    assert.equal(templates.length, dataset.clues.length);
    assert.match(
      html,
      /<template data-clue="img-[0-9a-f]{12}" data-place="[^"]+"[^>]*><img [^>]*srcset=/,
      "malldelen bär sidans egen bildmarkup och platsens namn",
    );
    assert.doesNotMatch(html, /<template[^>]*><img [^>]*fetchpriority/, "en malldel är aldrig sidans ivriga bild");
  });

  test("a clue with a text carries it, and one without carries none", async () => {
    const html = main(await page("spana"));
    const dataset = await qaDataset();
    const withText = dataset.clues.find((clue) => clue.text !== null);
    const without = dataset.clues.find((clue) => clue.text === null);
    assert.ok(withText && without, "QA har båda sorterna");
    assert.ok(
      html.includes(`data-clue="${withText.id}" data-place="`) && html.includes(`data-text="${withText.text}"`),
      "ledtrådstexten står på malldelen",
    );
    const bare = html.slice(html.indexOf(`data-clue="${without.id}"`));
    assert.doesNotMatch(bare.slice(0, bare.indexOf(">")), /data-text=/, "en ledtråd utan text får inget tomt attribut");
  });

  test("the answer is never written into the page as plain text (02-§13.13)", async () => {
    // The place is the answer, and it belongs in the dialog after "Hittat!", not in the
    // list the player reads before looking. It reaches the page only as an attribute on
    // the inert template.
    const html = main(await page("spana"));
    const list = html.slice(0, html.indexOf("data-spana-pool"));
    assert.doesNotMatch(list, /Bräckebur/);
  });

  test("the home page and the menu lead to it (02-§13.1)", async () => {
    const home = main(await page(""));
    assert.match(home, /href="\/spana\/"[\s\S]*?<h2 class="home-card__title">Spana!<\/h2>/);
    assert.match(home, /Hitta detaljen på bilden, någonstans på gården\./);
    const other = await page("karta");
    assert.match(other, /href="\/spana\/"/);
  });
});

describe("the dataset in the build (02-§6.2, 06-§2.1)", () => {
  test("an empty dataset builds: the home page says so and the map is empty", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "s4h-empty-"));
    cleanup.push(root);
    const dataDir = path.join(root, "data-empty");
    await mkdir(dataDir);
    await writeFile(path.join(dataDir, "species.yaml"), "species: []\n");
    await writeFile(path.join(dataDir, "breeds.yaml"), "breeds: []\n");
    const out = await buildSite({ env: { BASE_PATH: "/", DATA_DIR: dataDir } });
    cleanup.push(out);
    const home = main(await readFile(path.join(out, "index.html"), "utf8"));
    assert.match(home, /home-card/, "navet står kvar utan data (02-§5.7)");
    const animals = main(await readFile(path.join(out, "djuren", "index.html"), "utf8"));
    assert.match(animals, /Djuren är inte inlagda ännu/);
    assert.match(animals, /href="https:\/\/www\.4h\.se\/stattared\/"/);
    assert.doesNotMatch(animals, /species-tile/);
    const map = main(await readFile(path.join(out, "karta", "index.html"), "utf8"));
    assert.doesNotMatch(map, /class="map"/, "no places, no map (02-§5.65)");
    const bingo = main(await readFile(path.join(out, "bingo", "index.html"), "utf8"));
    assert.match(bingo, /Djuren är inte inlagda ännu/, "no candidates, no board (02-§12.12)");
    assert.doesNotMatch(bingo, /data-bingo-start/);
    const spana = main(await readFile(path.join(out, "spana", "index.html"), "utf8"));
    assert.match(spana, /Ledtrådarna är inte inlagda ännu/, "no clues, no round (02-§13.3)");
    assert.match(spana, /href="https:\/\/www\.4h\.se\/stattared\/"/, "and a way on to the main site");
    assert.doesNotMatch(spana, /data-spana-start/);
    await assert.rejects(access(path.join(out, "plats")), "no location pages");
  });

  test("an invalid dataset stops the build before anything is written", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "s4h-invalid-"));
    cleanup.push(root);
    const dataDir = path.join(root, "data-bad");
    await mkdir(path.join(dataDir, "animals"), { recursive: true });
    await writeFile(path.join(dataDir, "species.yaml"), "species:\n  - id: get\n    name: Get\n    plural: Getter\n");
    await writeFile(path.join(dataDir, "animals", "rosa.yaml"), "name: Rosa\nspecies: get\nsex: female\nstatus: here\nlocation: brackebur\n");
    const output = path.join(root, "public");
    await mkdir(output);
    await assert.rejects(buildSite({ env: { BASE_PATH: "/", DATA_DIR: dataDir }, output }), /animals\/rosa\.yaml: fältet location/);
    assert.deepEqual(await readdir(output), [], "nothing is written when validation fails");
  });
});
