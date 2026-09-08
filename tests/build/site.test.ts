/**
 * Tests on the built site (02-§9.8, 02-§5.2, 02-§5.6, 02-§10.10, 02-§10.22, 06-§1.3, 06-§3.5).
 *
 * Two builds are made once for the whole file: a QA build under the base path
 * `/prov/` with a version string, and a production build at `/` without one.
 */
import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { buildSite, listFiles, ROOT } from "./build-site.ts";
import { IMAGE_TOOL_PATH, IMAGE_TOOL_SCRIPT } from "../../source/ts/build/tool-page.ts";

const PREFIX = "/prov/";
const QA_VERSION = "1.0.4 – QA PR212";

let qa: string;
let prod: string;

before(async () => {
  [qa, prod] = await Promise.all([
    buildSite({ env: { BASE_PATH: PREFIX, DATA_DIR: "source/data-qa", BUILD_VERSION: QA_VERSION } }),
    buildSite({ env: { BASE_PATH: "/", DATA_DIR: "source/data" } }),
  ]);
});

after(async () => {
  await Promise.all([qa, prod].filter(Boolean).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function htmlFiles(dir: string): Promise<Array<{ file: string; html: string }>> {
  const files = (await listFiles(dir)).filter((file) => file.endsWith(".html"));
  return Promise.all(files.map(async (file) => ({ file, html: await readFile(path.join(dir, file), "utf8") })));
}

/** Every site-relative address a file refers to: attributes in HTML, url() in CSS, strings in a manifest or service worker. */
function siteReferences(file: string, text: string): string[] {
  const refs: string[] = [];
  if (file.endsWith(".html")) {
    for (const match of text.matchAll(/\b(?:href|src|action|poster)="([^"]*)"/g)) refs.push(match[1]);
    for (const match of text.matchAll(/\bsrcset="([^"]*)"/g)) {
      for (const candidate of match[1].split(",")) refs.push(candidate.trim().split(/\s+/)[0]);
    }
  }
  if (file.endsWith(".css")) {
    for (const match of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) refs.push(match[1]);
  }
  if (file.endsWith(".webmanifest") || file.endsWith(".json")) {
    const walk = (value: unknown): void => {
      if (typeof value === "string") refs.push(value);
      else if (value && typeof value === "object") Object.values(value).forEach(walk);
    };
    walk(JSON.parse(text));
  }
  if (path.basename(file) === "sw.js") {
    for (const match of text.matchAll(/["'](\/[^"']*)["']/g)) refs.push(match[1]);
  }
  return refs.filter((ref) => ref.startsWith("/") && !ref.startsWith("//"));
}

describe("bas-sökvägen (02-§9.8, 06-§3.2)", () => {
  test("varje absolut adress i utdatan börjar med bas-sökvägen", async () => {
    const files = await listFiles(qa);
    assert.ok(files.some((file) => file.endsWith(".html")), "bygget gav inga HTML-filer");
    const offenders: string[] = [];
    let prefixed = 0;
    for (const file of files) {
      const text = await readFile(path.join(qa, file), "utf8");
      for (const ref of siteReferences(file, text)) {
        if (ref.startsWith(PREFIX)) prefixed += 1;
        else offenders.push(`${file}: ${ref}`);
      }
    }
    assert.deepEqual(offenders, [], "adresser som kringgår bas-sökvägen (ADR 0005)");
    assert.ok(prefixed > 0, "inga adresser med bas-sökvägen hittades — matchar testet fortfarande markupen?");
  });

  test("bygget vägrar en mall med handskriven absolut sökväg (06-§3.5)", async () => {
    const input = await mkdtemp(path.join(os.tmpdir(), "stattared4h-input-"));
    try {
      await cp(path.join(ROOT, "source"), input, { recursive: true });
      await writeFile(
        path.join(input, "pages", "fel.njk"),
        '---\nlayout: base.njk\ntitle: Fel\ndescription: Fel\n---\n<a href="/karta/">Karta</a>\n',
      );
      await assert.rejects(buildSite({ input }), /absolute path.*\/karta\//s);
    } finally {
      await rm(input, { recursive: true, force: true });
    }
  });
});

describe("sidorna (02-§5.2, 02-§5.3, 02-§5.6, 02-§7.7)", () => {
  test("varje adress är index.html i en katalog, utom 404.html", async () => {
    const files = (await listFiles(prod)).filter((file) => file.endsWith(".html"));
    assert.ok(files.includes("index.html"), "startsidan saknas");
    assert.ok(files.includes("404.html"), "404-sidan saknas");
    assert.ok(files.includes(path.join("offline", "index.html")), "offline-sidan saknas");
    for (const file of files) {
      assert.ok(file === "404.html" || path.basename(file) === "index.html", `${file} är inte index.html i en katalog`);
    }
  });

  test("varje sida har en h1, lang=sv, titel och beskrivning", async () => {
    for (const { file, html } of await htmlFiles(prod)) {
      assert.match(html, /^<!DOCTYPE html>/, `${file}: doctype`);
      assert.match(html, /<html lang="sv"[ >]/, `${file}: lang`);
      assert.equal(html.match(/<h1[\s>]/g)?.length, 1, `${file}: exakt en h1`);
      const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
      assert.match(title, /^\S.* – Stättareds 4H-gård$/, `${file}: titeln "${title}" ska börja med sidnamnet och sluta med gårdens namn`);
      const description = html.match(/<meta name="description" content="([^"]*)">/)?.[1] ?? "";
      assert.ok(description.trim().length > 0, `${file}: meta description saknas`);
    }
  });

  test("404- och offline-sidan har sin text och länkar till startsidan", async () => {
    const notFound = await readFile(path.join(prod, "404.html"), "utf8");
    assert.match(notFound, /<h1>Sidan finns inte<\/h1>/);
    const offline = await readFile(path.join(prod, "offline", "index.html"), "utf8");
    assert.match(offline, /<h1>Du är offline<\/h1>/);
    for (const html of [notFound, offline]) {
      const main = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
      assert.match(main, /href="\/"/, "länk till startsidan");
      assert.match(main, /<a href="\/karta\/">Karta över gården<\/a>/, "länk till kartsidan");
    }
  });
});

describe("sidhuvud och sidfot (02-§1.9, 02-§10.10, 02-§10.22)", () => {
  test("sidhuvudet saknar länk till 4h.se; sidfoten har den", async () => {
    for (const { file, html } of await htmlFiles(prod)) {
      const header = html.slice(html.indexOf("<header"), html.indexOf("</header>"));
      const footer = html.slice(html.indexOf("<footer"), html.indexOf("</footer>"));
      assert.ok(header.length > 0 && footer.length > 0, `${file}: sidhuvud och sidfot`);
      assert.doesNotMatch(header, /4h\.se/, `${file}: sidhuvudet får inte länka till huvudsidan`);
      assert.match(footer, /href="https:\/\/www\.4h\.se\/stattared\/"/, `${file}: sidfoten länkar till huvudsidan`);
      assert.match(footer, /Sidan samlar inga uppgifter om dig\./, `${file}: integritetsmeningen`);
    }
  });

  test("menyn har ett överlägg och en knapp med båda lägena (02-§10.4, 02-§10.38, 05-§6.42)", async () => {
    for (const { file, html } of await htmlFiles(prod)) {
      const header = html.slice(html.indexOf("<header"), html.indexOf("</header>"));
      assert.match(header, /<div class="site-menu-overlay" data-menu-overlay hidden><\/div>/, `${file}: överlägget saknas`);
      const tag = header.slice(header.lastIndexOf("<button", header.indexOf("data-menu-button")), header.indexOf("data-menu-button"));
      const button = header.slice(header.indexOf("data-menu-button"));
      assert.match(tag, /aria-expanded="false"/, `${file}: menyknappen börjar hopfälld`);
      assert.match(button, /icon-button__label--closed">Meny</, `${file}: etiketten Meny`);
      assert.match(button, /icon-button__label--open">Stäng</, `${file}: etiketten Stäng`);
      assert.match(button, /icon-button__icon--closed/, `${file}: ikonen för stängt läge`);
      assert.match(button, /icon-button__icon--open/, `${file}: ikonen för öppet läge`);
    }
  });

  test("menyn har en rad per ärende, i ordning (02-§10.5)", async () => {
    for (const { file, html } of await htmlFiles(prod)) {
      const card = html.slice(html.indexOf('id="site-menu"'), html.indexOf("</nav>", html.indexOf('id="site-menu"')));
      const rows = [...card.matchAll(/class="site-menu__link[^"]*"[^>]*>([^<]+)</g)].map((m) => m[1]);
      const summary = [...card.matchAll(/class="site-menu__summary-label"[^>]*>([^<]+)</g)].map((m) => m[1]);
      assert.ok(rows.includes("Startsidan"), `${file}: raden Startsidan`);
      assert.ok(rows.includes("Kartan"), `${file}: raden Kartan`);
      assert.ok(rows.includes("Djurbingo"), `${file}: raden Djurbingo (02-§12.2)`);
      assert.ok(rows.includes("Spana!"), `${file}: raden Spana! (02-§13.1)`);
      assert.ok(rows.includes("Om sajten"), `${file}: raden Om sajten`);
      assert.deepEqual(summary, ["Djuren"], `${file}: Djuren är den enda fällbara raden (02-§10.45)`);
      assert.ok(
        card.indexOf(">Startsidan<") < card.indexOf(">Kartan<") &&
          card.indexOf(">Kartan<") < card.indexOf("site-menu__summary") &&
          card.indexOf("site-menu__summary") < card.indexOf(">Djurbingo<") &&
          card.indexOf(">Djurbingo<") < card.indexOf(">Spana!<") &&
          card.indexOf(">Spana!<") < card.indexOf(">Om sajten<"),
        `${file}: ordningen Startsidan, Kartan, Djuren, Djurbingo, Spana!, Om sajten`,
      );
    }
  });

  // The QA dataset is the one with species; production's data has only places so far, and
  // a fold with nothing but "Alla djuren" is what the farm's own site shows until then.
  test("Djuren fäller ut arterna, hopfällt och utan JavaScript (02-§10.43–10.44)", async () => {
    const html = await readFile(path.join(qa, "index.html"), "utf8");
    const card = html.slice(html.indexOf('id="site-menu"'), html.indexOf("</nav>", html.indexOf('id="site-menu"')));
    const details = card.slice(card.indexOf("<details"), card.indexOf("</details>"));
    assert.ok(details.length > 0, "fällan är ett details-element");
    assert.doesNotMatch(details.slice(0, details.indexOf(">")), /\bopen\b/, "fällan är hopfälld när menyn öppnas");
    assert.match(details, /<summary class="site-menu__summary"/);
    const rows = [...details.matchAll(/<a class="site-menu__link site-menu__link--child" href="([^"]+)"[^>]*>([^<]+)</g)];
    assert.ok(rows.length > 0, "fällan har underrader");
    assert.deepEqual([rows[0][1], rows[0][2]], [`${PREFIX}djuren/`, "Alla djuren"], "första underraden är vägen till sidan");
    assert.deepEqual(
      rows.slice(1).map((m) => m[1]),
      ["get", "far", "ko", "hast", "kanin", "gris", "hons", "katt"].map((id) => `${PREFIX}arter/${id}/`),
      "ett djurslag per rad, i arternas ordning",
    );
  });

  test("menyns utfällning kräver ingen klientkod (02-§10.44)", async () => {
    const menu = await readFile(path.join(ROOT, "source", "ts", "ui", "menu.ts"), "utf8");
    assert.doesNotMatch(menu, /details|summary/i, "menu.ts rör bara kortet, inte fällan");
  });

  test("överlägget ligger före menykortet och under sidhuvudets rad (02-§10.38)", async () => {
    const html = await readFile(path.join(prod, "index.html"), "utf8");
    const header = html.slice(html.indexOf("<header"), html.indexOf("</header>"));
    const row = header.indexOf("site-header__inner");
    const overlay = header.indexOf("data-menu-overlay");
    const card = header.indexOf('id="site-menu"');
    assert.ok(row < overlay, "raden står före överlägget i markupen");
    assert.ok(overlay < card, "överlägget står före menykortet i markupen");
  });

  test("varje sida utom startsidan har Tillbaka som länk till startsidan (02-§10.40–10.42)", async () => {
    const pages = await htmlFiles(prod);
    assert.ok(pages.length > 1);
    for (const { file, html } of pages) {
      const header = html.slice(html.indexOf("<header"), html.indexOf("</header>"));
      if (file === "index.html") {
        assert.doesNotMatch(header, /data-back-button/, "startsidan har ingen Tillbaka");
        continue;
      }
      assert.match(header, /<a class="[^"]*site-header__back[^"]*" href="\/" aria-label="Tillbaka" data-back-button>/, `${file}: Tillbaka saknas eller ser annorlunda ut`);
    }
  });

  test("menyknappen står först i sidhuvudets rad, Tillbaka efter den (02-§10.3)", async () => {
    const html = await readFile(path.join(prod, "om", "index.html"), "utf8");
    const header = html.slice(html.indexOf("<header"), html.indexOf("</header>"));
    // Markupens ordning är radens ordning, så tabbordningen följer ögats.
    assert.ok(header.indexOf("data-menu-button") < header.indexOf("data-back-button"), "menyknappen står före Tillbaka");
    assert.ok(header.indexOf("data-back-button") < header.indexOf("data-to-top-button"), "Tillbaka står före till toppen");
    assert.ok(header.indexOf("data-to-top-button") < header.indexOf("data-install-button"), "till toppen står före installknappen");
    assert.ok(header.indexOf("data-install-button") < header.indexOf("data-feedback-button"), "installknappen står före feedbackknappen");
  });

  test("versionsraden visar BUILD_VERSION och saknas i ett CI-bygge utan version", async () => {
    const withVersion = await readFile(path.join(qa, "index.html"), "utf8");
    assert.match(withVersion, new RegExp(`<p class="site-footer__version">Version ${QA_VERSION}</p>`));
    const without = await readFile(path.join(prod, "index.html"), "utf8");
    assert.doesNotMatch(without, /site-footer__version/);
  });
});

const TOOL_PAGE = path.join(...IMAGE_TOOL_PATH.slice(1, -1).split("/"), "index.html");

describe("QA-bygget (06-§1.3)", () => {
  test("varje QA-sida bär noindex; i produktion bär bara bildverktyget det (02-§11.2)", async () => {
    const noindex = /<meta name="robots" content="noindex">/;
    const qaPages = await htmlFiles(qa);
    assert.ok(qaPages.length > 0);
    for (const { file, html } of qaPages) assert.match(html, noindex, `${file} i QA saknar noindex`);
    let tools = 0;
    for (const { file, html } of await htmlFiles(prod)) {
      if (file === TOOL_PAGE) {
        assert.match(html, noindex, `${file} saknar noindex, men adressen står i ett publikt README`);
        tools += 1;
      } else {
        assert.doesNotMatch(html, noindex, `${file} i produktion har noindex`);
      }
    }
    assert.equal(tools, 1, "bildverktygets sida saknas i produktionsbygget");
  });
});

describe("bildverktyget (02-§11.1–11.6, 02-§11.22, ADR 0022)", () => {
  test("sidan och dess egen bunt byggs på den svårgissade adressen", async () => {
    const files = await listFiles(prod);
    assert.ok(files.includes(TOOL_PAGE), `${TOOL_PAGE} byggdes inte`);
    const script = path.join(path.dirname(TOOL_PAGE), IMAGE_TOOL_SCRIPT);
    assert.ok(files.includes(script), `${script} byggdes inte`);
    const html = await readFile(path.join(prod, TOOL_PAGE), "utf8");
    assert.match(html, new RegExp(`src="${IMAGE_TOOL_PATH}${IMAGE_TOOL_SCRIPT}"`), "sidan laddar sin egen bunt");
  });

  // Stilarna delar besökarens components.css — det är ett kilobyte och sajtens enda
  // stilmönster. Koden är det som ska hållas borta: den är hundratals rader som en
  // besökare vid en hage aldrig kör.
  test("ingen JS-bunt under assets/ bär verktygets kod (02-§11.6)", async () => {
    const files = (await listFiles(prod)).filter((file) => file.startsWith(`assets${path.sep}`) && file.endsWith(".js"));
    assert.ok(files.length > 0, "hittade ingen bunt under assets/ att pröva");
    for (const file of files) {
      const text = await readFile(path.join(prod, file), "utf8");
      assert.doesNotMatch(text, /image-tool|Ladda ner alla som zip/i, `${file} bär verktygets kod`);
    }
  });

  test("ingen annan sida länkar dit, och robots.txt pekar inte ut den (02-§11.1, 02-§11.3)", async () => {
    for (const { file, html } of await htmlFiles(prod)) {
      if (file === TOOL_PAGE) continue;
      assert.equal(html.includes(IMAGE_TOOL_PATH), false, `${file} länkar till verktyget`);
    }
    const robots = await readFile(path.join(prod, "robots.txt"), "utf8");
    assert.equal(robots.includes("verktyg"), false, "robots.txt får inte peka ut adressen");
  });

  test("sidan visar vägen vidare till GitHubs uppladdningsvy (02-§11.22)", async () => {
    const html = await readFile(path.join(prod, TOOL_PAGE), "utf8");
    const main = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
    assert.match(main, /href="https:\/\/github\.com\/stattared4h\/stattared4h\/upload\/main\/source\/images"/);
    assert.match(main, /href="https:\/\/github\.com\/stattared4h\/stattared4h\/upload\/main\/source\/data\/images"/);
  });
});
