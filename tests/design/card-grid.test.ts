/**
 * 02-§5.50 and 05-§4.12–4.14: the animal cards are two across on a phone and three from
 * the desktop breakpoint, and the card's `sizes` says the same thing as the grid does.
 *
 * The two live in different files — the grid in `layout.css`, `sizes` in the card macro
 * — and a phone that lays out two columns while asking for full-width images is a bug
 * nobody sees until the data bill arrives. The test reads both and compares them, so
 * they cannot drift apart (05-§7.4).
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, test } from "node:test";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const DESKTOP_BREAKPOINT = 960;

async function read(file: string): Promise<string> {
  return readFile(path.join(ROOT, file), "utf8");
}

/** The `grid-template-columns` of `.card-grid`, outside and inside the desktop query. */
async function cardGridColumns(): Promise<{ narrow: string; wide: string }> {
  const css = await read("source/assets/css/layout.css");
  const rules = [...css.matchAll(/\.card-grid\s*\{([^}]*)\}/g)].map((match) => {
    const declaration = /grid-template-columns:\s*([^;]+);/.exec(match[1]);
    assert.ok(declaration, ".card-grid saknar grid-template-columns");
    return { at: match.index, columns: declaration[1].trim() };
  });
  assert.equal(rules.length, 2, ".card-grid sätts en gång för smal och en gång för bred skärm");
  const query = css.indexOf(`@media (min-width: ${DESKTOP_BREAKPOINT}px)`, rules[0].at);
  assert.ok(query > rules[0].at && query < rules[1].at, "den andra regeln ligger i desktopfrågan");
  return { narrow: rules[0].columns, wide: rules[1].columns };
}

/** The `sizes` the animal card asks for, as [media query, width] pairs. */
async function cardSizes(): Promise<Array<[string, string]>> {
  const macro = await read("source/layouts/animal-card.njk");
  const match = /picture card\.photo, "([^"]+)"/.exec(macro);
  assert.ok(match, "djurkortets picture-anrop hittades inte");
  return match[1].split(",").map((part) => {
    const trimmed = part.trim();
    const split = /^(\(.+\))\s+(\S+)$/.exec(trimmed);
    return split ? [split[1], split[2]] : ["", trimmed];
  });
}

describe("djurkortens rutnät (02-§5.50, 05-§4.12)", () => {
  test("två kolumner under desktopbrytpunkten, tre från den", async () => {
    const columns = await cardGridColumns();
    assert.match(columns.narrow, /repeat\(\s*2\s*,/, `två kolumner på mobil, inte "${columns.narrow}"`);
    assert.match(columns.wide, /repeat\(\s*3\s*,/, `tre kolumner på desktop, inte "${columns.wide}"`);
  });

  test("kortets sizes säger samma sak som rutnätet", async () => {
    const sizes = await cardSizes();
    assert.deepEqual(sizes, [[`(min-width: ${DESKTOP_BREAKPOINT}px)`, "33vw"], ["", "50vw"]]);
  });

  test("navkorten ligger i samma rutnät (02-§5.64)", async () => {
    const html = await read("source/layouts/home-card.njk");
    assert.match(html, /class="card-grid home-cards"/, "navet återanvänder djurkortens rutnät");
    const css = await read("source/assets/css/components.css");
    const rule = /\.home-card__symbol-plate\s*\{([^}]*)\}/.exec(css);
    assert.ok(rule, ".home-card__symbol-plate saknas");
    assert.match(rule[1], /aspect-ratio:\s*4\s*\/\s*3/, "plattan har fotots bildförhållande (05-§6.45)");
    assert.match(rule[1], /background:\s*var\(--color-green-pale\)/, "plattan är ljusgrön (05-§6.45)");
  });

  test("djurslagsrutorna växer fritt med bredden (05-§4.14)", async () => {
    const css = await read("source/assets/css/layout.css");
    const rule = /\.species-grid\s*\{([^}]*)\}/.exec(css);
    assert.ok(rule, ".species-grid saknas");
    assert.match(rule[1], /grid-template-columns:\s*repeat\(auto-fill,\s*minmax\(/);
  });
});
