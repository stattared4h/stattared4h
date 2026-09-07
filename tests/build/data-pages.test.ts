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
  test("a location page for all 33 places, an animal page for all 100, a species page for all eight", async () => {
    const files = await listFiles(site);
    const locations = files.filter((f) => /^plats\/[^/]+\/index\.html$/.test(f));
    const animals = files.filter((f) => /^djur\/[^/]+\/index\.html$/.test(f));
    const species = files.filter((f) => /^arter\/[^/]+\/index\.html$/.test(f));
    assert.equal(locations.length, 33);
    assert.ok(locations.includes(path.join("plats", "gamla-stallet", "index.html")), "the inactive place keeps its page");
    assert.equal(animals.length, 100);
    assert.equal(species.length, 8);
    assert.ok(!files.some((f) => f.startsWith("karta")), "the map has no page of its own (02-§5.1)");
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

describe("the home page (02-§5.7–5.8)", () => {
  test("shows the map first, then the places, then the species on the farm", async () => {
    const html = main(await page(""));
    assert.match(html, /<svg class="map__drawing" [^>]*aria-label="Karta över Stättared med gårdens hagar">/);
    assert.ok(
      html.indexOf("map__drawing") < html.indexOf("place-list__link") &&
        html.indexOf("place-list__link") < html.indexOf("species-tile"),
      "map, then places, then species (02-§5.7)",
    );
    const tiles = [...html.matchAll(/<a class="species-tile" href="\/arter\/([^/]+)\/">/g)].map((m) => m[1]);
    assert.deepEqual(tiles, ["get", "far", "ko", "hast", "kanin", "gris", "hons", "katt"]);
    assert.match(html, /Getter<\/span>/);
    assert.match(html, /href="https:\/\/www\.4h\.se\/stattared\/"/);
    assert.doesNotMatch(html, /inte inlagda/);
  });
});

describe("the location page (02-§5.9–5.13, 05-§6.24)", () => {
  test("Björkhagen and Gethagen both show the goats under 'Getterna på gården'", async () => {
    for (const id of ["bjorkhagen", "gethagen"]) {
      const html = main(await page(`plats/${id}`));
      assert.match(html, /<h1>(Björkhagen|Gethagen)<\/h1>/);
      assert.match(html, /<a class="species-tile" href="\/arter\/get\/">/);
      assert.match(html, /<h2>Getterna på gården<\/h2>/);
      assert.match(html, /href="\/djur\/rosa\/"/);
      assert.doesNotMatch(html, /href="\/djur\/bocken\/"/, "gone animals are not on the location page");
      assert.match(html, /<button class="button button--secondary share-button" type="button" data-share-button hidden>Dela<\/button>/);
    }
    const gethagen = main(await page("plats/gethagen"));
    assert.match(gethagen, /<p class="place-note">Här går getterna på dagarna\.<\/p>/);
    assert.match(gethagen, /<p class="note">Hit når man med rullstol och barnvagn<\/p>/);
    assert.match(gethagen, /<div class="prose"><p>Den stora hagen närmast ladugården/);
  });

  test("Stora hagen has two species and is not accessible", async () => {
    const html = main(await page("plats/stora-hagen"));
    assert.deepEqual([...html.matchAll(/<a class="species-tile" href="\/arter\/([^/]+)\/">/g)].map((m) => m[1]), ["far", "ko"]);
    assert.match(html, /<h2>Fåren på gården<\/h2>/);
    assert.match(html, /<h2>Korna på gården<\/h2>/);
    assert.match(html, /Hit når man inte med rullstol eller barnvagn/);
  });

  test("the empty place, the inactive place and the counted population", async () => {
    const empty = main(await page("plats/ovre-hagen"));
    assert.match(empty, /Just nu går inga djur här/);
    assert.match(empty, /<a class="button" href="\/">Karta över gården<\/a>/);
    const inactive = main(await page("plats/gamla-stallet"));
    assert.match(inactive, /Den här platsen används inte just nu/);
    assert.match(inactive, /<a class="button" href="\/">Karta över gården<\/a>/);
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
    assert.match(html, /href="\/plats\/bjorkhagen\/">Björkhagen</);
    assert.match(html, /href="\/plats\/gethagen\/">Gethagen</);
    assert.match(html, /<h2>Getterna på gården<\/h2>/);
    const gone = html.slice(html.indexOf("<h2>Har lämnat gården</h2>"));
    assert.match(gone, /href="\/djur\/bocken\/"/);
    assert.match(gone, /<li class="tag">Har lämnat gården<\/li>/, "the card is marked too (02-§5.18)");
    assert.doesNotMatch(html.slice(0, html.indexOf("<h2>Har lämnat gården</h2>")), /href="\/djur\/bocken\/"/);
  });

  test("horses: nobody knows where; hens: a counted population; no empty editorial heading", async () => {
    const hast = main(await page("arter/hast"));
    assert.match(hast, /Just nu vet vi inte var hästarna går/);
    assert.match(hast, /<a class="button" href="\/">Karta över gården<\/a>/);
    const hons = main(await page("arter/hons"));
    assert.match(hons, /På gården finns 18 svarta dvärghöns och 14 orusthöns\./);
    assert.doesNotMatch(hons, /animal-card/);
    assert.doesNotMatch(hons, /class="prose"/);
  });
});

describe("the map on the home page (02-§5.23–5.27)", () => {
  test("a marker per active place with coordinates, the description, and the list", async () => {
    const html = main(await page(""));
    assert.match(html, /<svg class="map__drawing" [^>]*role="img" aria-label="Karta över Stättared med gårdens hagar">/);
    const markers = [...html.matchAll(/<a class="map__marker(?: map__marker--label-(?:above|right|left|hidden))? map__marker--wide-\w+" href="\/plats\/([^/]+)\/"/g)].map((m) => m[1]);
    assert.equal(markers.length, 32, "33 places minus the inactive one without coordinates");
    assert.ok(!markers.includes("gamla-stallet"));
    const list = html.slice(html.indexOf('<ul class="place-list">'));
    assert.match(
      list,
      /href="\/plats\/stora-hagen\/"><svg class="place-list__symbol"[^>]*>.*?<\/svg>Stora hagen<\/a>\s*<span class="place-list__species">Får och kor<\/span>/,
      "the list carries the same symbol in front of the name (02-§5.37)",
    );
    assert.doesNotMatch(list, /gamla-stallet/);
    // 02-§5.26 forbids fetching anything from outside; 02-§5.34 adds two ordinary
    // links out. Checking the two separately keeps both requirements honest.
    assert.doesNotMatch(html, /(?:src|srcset)="https?:|url\(\s*https?:/, "nothing is fetched from outside (02-§5.26)");
    assert.match(html, /<h2>Fler kartor i området<\/h2>/);
    assert.deepEqual(
      [...html.matchAll(/href="(https?:[^"]+)"/g)].map((m) => m[1]),
      [
        // The lead paragraph points at the main site (02-§5.8); the other two are the
        // area maps (02-§5.34). Nothing else may lead out of the site.
        "https://www.4h.se/stattared/",
        "https://www.4h.se/stattared/vandring-fiske/",
        "https://www.naturkartan.se/sv/kungsbacka",
      ],
      "only the main site and the two area maps lead out",
    );
  });
});

describe("a besoksmal never mentions animals (02-§5.35, ADR 0018)", () => {
  test("the café page shows its text and accessibility, and no animal sentence", async () => {
    const html = main(await page("plats/kaffestugan"));
    assert.match(html, /<h1>Kaffestugan<\/h1>/);
    assert.match(html, /Öppet när flaggan är uppe/, "the note is shown");
    assert.match(html, /Hit når man med rullstol och barnvagn/);
    assert.doesNotMatch(html, /Just nu går inga djur här/, "that sentence belongs to a djurplats");
    assert.doesNotMatch(html, /species-tile/, "no species boxes");
    assert.doesNotMatch(html, /animal-card/, "no animals");
  });

  test("a djurplats without animals still says so", async () => {
    const html = main(await page("plats/kattvinden"));
    assert.match(html, /<h1>Kattvinden<\/h1>/);
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
    assert.match(home, /Djuren är inte inlagda ännu/);
    assert.match(home, /href="https:\/\/www\.4h\.se\/stattared\/"/);
    assert.doesNotMatch(home, /species-tile/);
    assert.doesNotMatch(home, /class="map"/, "no places, no map (02-§5.7)");
    await assert.rejects(access(path.join(out, "karta")), "the map has no page of its own");
    await assert.rejects(access(path.join(out, "plats")), "no location pages");
  });

  test("an invalid dataset stops the build before anything is written", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "s4h-invalid-"));
    cleanup.push(root);
    const dataDir = path.join(root, "data-bad");
    await mkdir(path.join(dataDir, "animals"), { recursive: true });
    await writeFile(path.join(dataDir, "species.yaml"), "species:\n  - id: get\n    name: Get\n    plural: Getter\n");
    await writeFile(path.join(dataDir, "animals", "rosa.yaml"), "name: Rosa\nspecies: get\nsex: female\nstatus: here\nlocation: gethagen\n");
    const output = path.join(root, "public");
    await mkdir(output);
    await assert.rejects(buildSite({ env: { BASE_PATH: "/", DATA_DIR: dataDir }, output }), /animals\/rosa\.yaml: fältet location/);
    assert.deepEqual(await readdir(output), [], "nothing is written when validation fails");
  });
});
