/**
 * Tests on the PWA parts of the built site: manifest, service worker, icons, the about
 * page, the feedback dialog and the status bar (02-§7.1–7.9, 02-§10.11–10.20,
 * 02-§10.26–10.32, 03-§5, 06-§1.4).
 *
 * Two builds are made once for the whole file: a QA build under `/prov/qa/` with a
 * version string, and a production build at `/` without one, as CI would make it.
 */
import assert from "node:assert/strict";
import { readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { ISSUE_LABEL, ISSUE_TEMPLATE } from "../../source/ts/domain/feedback.ts";
import { buildSite, listFiles, ROOT } from "./build-site.ts";

const PREFIX = "/prov/qa/";
const VERSION = "1.2.3 – QA PR9";
const ICON_FILES = ["favicon.svg", "favicon.ico", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];

let qa: string;
let prod: string;

before(async () => {
  [qa, prod] = await Promise.all([
    buildSite({ env: { BASE_PATH: PREFIX, DATA_DIR: "source/data-qa", BUILD_VERSION: VERSION } }),
    buildSite({ env: { BASE_PATH: "/", DATA_DIR: "source/data" } }),
  ]);
});

after(async () => {
  await Promise.all([qa, prod].filter(Boolean).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function read(dir: string, file: string): Promise<string> {
  return readFile(path.join(dir, file), "utf8");
}

async function htmlFiles(dir: string): Promise<Array<{ file: string; html: string }>> {
  const files = (await listFiles(dir)).filter((file) => file.endsWith(".html"));
  return Promise.all(files.map(async (file) => ({ file, html: await read(dir, file) })));
}

async function exists(file: string): Promise<boolean> {
  return stat(file).then(() => true, () => false);
}

/** `--color-green` and `--color-page` as written in tokens.css, the manifest's two colours (02-§7.1). */
async function tokenColours(): Promise<{ green: string; page: string }> {
  const css = await readFile(path.join(ROOT, "source/assets/css/tokens.css"), "utf8");
  const token = (name: string): string => {
    const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`));
    assert.ok(match, `tokens.css saknar --${name}`);
    return match[1];
  };
  return { green: token("color-green"), page: token("color-page") };
}

/** The PRECACHE array the build wrote into sw.js. */
function precacheOf(sw: string): string[] {
  const match = sw.match(/const PRECACHE = \[([\s\S]*?)\];/);
  assert.ok(match, "sw.js saknar PRECACHE");
  return JSON.parse(`[${match[1].trim().replace(/,\s*$/, "")}]`);
}

function cacheNameOf(sw: string): string {
  const match = sw.match(/const CACHE_NAME = ("[^"]*");/);
  assert.ok(match, "sw.js saknar CACHE_NAME");
  return JSON.parse(match[1]);
}

/** The output file an address in the precache points at. */
function fileFor(url: string): string {
  const relative = url.slice(PREFIX.length);
  return relative.endsWith("/") || relative === "" ? path.join(relative, "index.html") : relative;
}

describe("manifestet (02-§7.1–7.2, 02-§7.9, 06-§1.4)", () => {
  test("namn, visningsläge, språk, färger ur tokens.css och ikoner", async () => {
    const manifest = JSON.parse(await read(qa, "manifest.webmanifest"));
    const colours = await tokenColours();
    assert.equal(manifest.name, "Djuren på Stättared");
    assert.equal(manifest.short_name, "Stättared");
    assert.equal(manifest.display, "standalone");
    assert.equal(manifest.lang, "sv");
    assert.equal(manifest.theme_color, colours.green, "theme_color är 05-§2.1");
    assert.equal(manifest.background_color, colours.page, "background_color är 05-§2.4");
    const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes);
    assert.ok(sizes.includes("192x192") && sizes.includes("512x512"), `ikoner i 192 och 512 px, fick ${sizes}`);
    assert.ok(manifest.icons.some((icon: { purpose?: string }) => icon.purpose === "maskable"), "en maskbar ikon");
    for (const icon of manifest.icons as Array<{ src: string }>) {
      assert.ok(icon.src.startsWith(PREFIX), `${icon.src} saknar bas-sökvägen`);
      assert.ok(await exists(path.join(qa, fileFor(icon.src))), `${icon.src} finns inte i utdatan`);
    }
  });

  test("start_url, scope och id är bas-sökvägen; versionen följer med", async () => {
    const manifest = JSON.parse(await read(qa, "manifest.webmanifest"));
    assert.equal(manifest.start_url, PREFIX);
    assert.equal(manifest.scope, PREFIX);
    assert.equal(manifest.id, PREFIX);
    assert.equal(manifest.version, VERSION);
    const production = JSON.parse(await read(prod, "manifest.webmanifest"));
    assert.equal(production.id, "/");
    assert.equal(production.start_url, "/");
    assert.equal("version" in production, false, "ett CI-bygge utan version skriver inget versionsfält");
  });

  test("varje sida länkar manifestet, ikonerna och temafärgen", async () => {
    const colours = await tokenColours();
    for (const { file, html } of await htmlFiles(qa)) {
      assert.match(html, new RegExp(`<link rel="manifest" href="${PREFIX}manifest.webmanifest">`), `${file}: manifest`);
      assert.match(html, new RegExp(`<meta name="theme-color" content="${colours.green}">`), `${file}: theme-color`);
      assert.match(html, new RegExp(`<link rel="icon" href="${PREFIX}assets/img/favicon.svg" type="image/svg\\+xml">`), `${file}: favicon.svg`);
      assert.match(html, new RegExp(`<link rel="icon" href="${PREFIX}assets/img/favicon.ico" sizes="any">`), `${file}: favicon.ico`);
      assert.match(html, new RegExp(`<link rel="apple-touch-icon" href="${PREFIX}assets/img/apple-touch-icon.png">`), `${file}: apple-touch-icon`);
    }
  });
});

describe("service workern (02-§7.3–7.9, 02-§10.26, 03-§5)", () => {
  test("cachenamnet är bas-sökvägen och versionen; s4h-dev utan version", async () => {
    assert.equal(cacheNameOf(await read(qa, "sw.js")), `${PREFIX}${VERSION}`);
    assert.equal(cacheNameOf(await read(prod, "sw.js")), "/s4h-dev");
  });

  test("förcachen har varje sida, CSS, JS, manifestet, ikonerna och offline-sidan (02-§7.4)", async () => {
    const precache = precacheOf(await read(qa, "sw.js"));
    const files = await listFiles(qa);
    const expected = [
      ...files.filter((file) => file.endsWith(".html")).map((file) => (file === "404.html" ? file : path.dirname(file) === "." ? "" : `${path.dirname(file)}/`)),
      ...files.filter((file) => file.startsWith("assets/")),
      "manifest.webmanifest",
    ].map((relative) => `${PREFIX}${relative}`);
    const missing = expected.filter((url) => !precache.includes(url));
    assert.deepEqual(missing, [], "saknas i förcachen");
    assert.ok(precache.includes(`${PREFIX}offline/`), "offline-sidan");
    assert.ok(precache.includes(`${PREFIX}404.html`), "404-sidan");
    assert.ok(precache.includes(`${PREFIX}assets/main.js`), "buntad JS");
    for (const icon of ICON_FILES) assert.ok(precache.includes(`${PREFIX}assets/img/${icon}`), icon);
    assert.ok(precache.length > 5, "förcachen är misstänkt kort");
  });

  test("varje post i förcachen finns i utdatan och ligger under bas-sökvägen", async () => {
    const precache = precacheOf(await read(qa, "sw.js"));
    for (const url of precache) {
      assert.ok(url.startsWith(PREFIX), `${url} ligger utanför bas-sökvägen`);
      assert.ok(await exists(path.join(qa, fileFor(url))), `${url} finns inte i utdatan`);
    }
    assert.equal(new Set(precache).size, precache.length, "dubbletter i förcachen");
  });

  test("ingen sträng i sw.js eller main.js pekar på en annan värd (02-§7.8, 02-§10.20)", async () => {
    for (const file of ["sw.js", "assets/main.js"]) {
      const text = await read(qa, file);
      assert.doesNotMatch(text, /https?:\/\//, `${file} nämner en adress på en annan värd`);
    }
  });

  test("varje sida bär bas-sökvägen som data-base och registreringen läser den (02-§7.3, 02-§7.9)", async () => {
    for (const { file, html } of await htmlFiles(qa)) {
      assert.match(html, new RegExp(`<html lang="sv" data-base="${PREFIX}"`), `${file}: data-base`);
    }
    for (const { file, html } of await htmlFiles(prod)) {
      assert.match(html, /<html lang="sv" data-base="\/"/, `${file}: data-base i produktion`);
    }
    const main = await read(qa, "assets/main.js");
    assert.match(main, /sw\.js/, "main.js registrerar sw.js");
    assert.match(main, /\.base\b|\["base"\]/, "main.js läser data-base");
    assert.doesNotMatch(main, /["'`]\/sw\.js/, "sökvägen till sw.js är inte hårdkodad från roten");
  });
});

describe("om-sidan (02-§10.27)", () => {
  test("finns med texten, källkodslänken och versionen sist", async () => {
    const html = await read(qa, path.join("om", "index.html"));
    assert.match(html, /<h1>Om sajten<\/h1>/);
    assert.match(html, /hemskärmen/i, "hur den läggs på hemskärmen");
    assert.match(html, /iPhone/, "iOS");
    assert.match(html, /Android/, "Android");
    assert.match(html, /utan uppkoppling|offline/i, "att den fungerar offline");
    assert.match(html, /samlar inte in några uppgifter/, "inga uppgifter om besökaren");
    assert.match(html, /href="https:\/\/github\.com\/stattared4h\/stattared4h"/, "länk till källkoden");
    const main = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
    assert.match(main, new RegExp(`Version ${VERSION}</p>\\s*</div>\\s*$`), "versionen sist i innehållet");
    const production = await read(prod, path.join("om", "index.html"));
    assert.doesNotMatch(production, /data-version-row/, "ingen versionsrad utan version");
  });
});

describe("feedback (02-§10.15, 02-§10.19)", () => {
  test("dialogen med rubrik, kategorier, fält, etiketter och Skicka finns på varje sida", async () => {
    for (const { file, html } of await htmlFiles(qa)) {
      assert.match(html, /<button [^>]*aria-label="Ge feedback"[^>]*data-feedback-button>/, `${file}: feedbackknappen`);
      assert.match(html, /<dialog class="dialog" data-feedback-dialog data-repo="https:\/\/github\.com\/stattared4h\/stattared4h"/, `${file}: dialogen med data-repo`);
      assert.match(html, /<h2 class="dialog__title" id="feedback-heading">Feedback om sajten<\/h2>/, `${file}: rubriken`);
      assert.match(html, /gäller[^<]*sajten|om något på den här sajten/, `${file}: meningen om sajten, inte gården`);
      for (const category of ["Fel", "Förslag", "Övrigt"]) {
        assert.match(html, new RegExp(`<input class="choice__input" type="radio" name="category" value="${category}"`), `${file}: kategorin ${category}`);
      }
      assert.match(html, /<label class="field__label" for="feedback-title">Rubrik<\/label>/, `${file}: etiketten Rubrik`);
      assert.match(html, /<input class="field__input" id="feedback-title" name="title" type="text" maxlength="200"/, `${file}: fältet Rubrik`);
      assert.match(html, /<label class="field__label" for="feedback-body">Beskrivning<\/label>/, `${file}: etiketten Beskrivning`);
      assert.match(html, /<textarea class="field__input field__input--multiline" id="feedback-body" name="body" rows="\d+" maxlength="2000">/, `${file}: fältet Beskrivning`);
      assert.match(html, /<button class="icon-button dialog__close" type="button" aria-label="Stäng" data-feedback-close>/, `${file}: kryssknappen`);
      assert.match(html, /<button class="button" type="submit" data-feedback-submit disabled>Skicka<\/button>/, `${file}: Skicka`);
      assert.match(html, /data-feedback-hint[^>]*>Fyll i rubrik och beskrivning/, `${file}: förklaringen till att Skicka inte går att trycka`);
    }
  });

  test("issue-mallen finns med etiketten feedback och rubrikprefixet", async () => {
    const template = await readFile(path.join(ROOT, ".github", "ISSUE_TEMPLATE", ISSUE_TEMPLATE), "utf8");
    const frontMatter = template.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
    assert.match(frontMatter, /^name: .+$/m);
    assert.match(frontMatter, /^about: .+$/m);
    assert.match(frontMatter, /^title: "\[Feedback\] "$/m);
    assert.match(frontMatter, new RegExp(`^labels: ${ISSUE_LABEL}$`, "m"));
  });
});

describe("ikoner (02-§10.31–10.32)", () => {
  test("favicon.svg, favicon.ico, apple-touch-icon och manifestikonerna finns och har rätt storlek", async () => {
    const dir = path.join(ROOT, "source", "assets", "img");
    for (const icon of ICON_FILES) assert.ok(await exists(path.join(dir, icon)), `${icon} saknas`);
    const pngSize = async (name: string): Promise<number> => {
      const png = await readFile(path.join(dir, name));
      assert.equal(png.toString("ascii", 1, 4), "PNG", `${name} är inte en PNG`);
      return png.readUInt32BE(16);
    };
    assert.equal(await pngSize("apple-touch-icon.png"), 180);
    assert.equal(await pngSize("icon-192.png"), 192);
    assert.equal(await pngSize("icon-512.png"), 512);
    assert.equal(await pngSize("icon-maskable-512.png"), 512);
    const ico = await readFile(path.join(dir, "favicon.ico"));
    assert.equal(ico.readUInt16LE(2), 1, "ICO-typ");
    assert.equal(ico.readUInt8(6), 32, "favicon.ico är 32 px");
    const svg = await readFile(path.join(dir, "favicon.svg"), "utf8");
    const colours = await tokenColours();
    assert.ok(svg.includes(colours.green), "ikonen använder sajtens gröna (05-§2.1)");
    assert.doesNotMatch(svg, /4h-logo/i, "ikonen bygger inte på 4H-loggan (ADR 0007)");
  });

  test("varje inline-SVG i markupen har aria-hidden", async () => {
    for (const { file, html } of await htmlFiles(qa)) {
      const svgs = html.match(/<svg[^>]*>/g) ?? [];
      assert.ok(svgs.length >= 5, `${file}: sidhuvudets och dialogens ikoner`);
      for (const svg of svgs) assert.match(svg, /aria-hidden="true"/, `${file}: ${svg}`);
    }
  });
});

describe("sidhuvudets knappar och statusraden (02-§10.11, 02-§10.13–10.14, 05-§6.36)", () => {
  test("installknapp och till toppen är dolda i markupen med sina aria-label; statusraden ligger direkt under sidhuvudet", async () => {
    for (const { file, html } of await htmlFiles(qa)) {
      assert.match(html, /<button [^>]*aria-label="Installera appen" hidden data-install-button>/, `${file}: installknappen`);
      assert.match(html, /<button [^>]*aria-label="Till toppen" hidden data-to-top-button>/, `${file}: till toppen`);
      assert.match(html, /<\/header>\s*<div class="status-bar" role="status" data-status-bar hidden>/, `${file}: statusraden`);
      assert.match(html, /<button class="button button--secondary status-bar__action" type="button" data-status-action hidden><\/button>/, `${file}: statusradens knapp`);
    }
  });
});
