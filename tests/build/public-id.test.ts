import assert from "node:assert/strict";
import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { after, before, test } from "node:test";
import { buildSite } from "./build-site.ts";

let site: string;

before(async () => {
  site = await buildSite({ env: { BASE_PATH: "/", DATA_DIR: "source/data-qa" } });
});

after(async () => {
  await rm(site, { recursive: true, force: true });
});

async function page(relative: string): Promise<string> {
  return readFile(path.join(site, relative, "index.html"), "utf8");
}

test("djurinfosidan erbjuder sökning på öronmärke med QA-id:n i sökdatat (02-§5.36)", async () => {
  const html = await page("djuren");
  assert.match(html, /Hitta ett djur via öronmärket/);
  assert.match(html, /data-animal-id-search/);
  assert.match(html, /SE 012345 0001/);
  assert.match(html, /SE-012345-0002/);
});

test("sökningen är djurinfosidans första avsnitt (02-§5.52)", async () => {
  const html = await page("djuren");
  const main = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
  const search = main.indexOf("Hitta ett djur via öronmärket");
  const species = main.indexOf("species-tile");
  assert.ok(search > 0 && species > 0, "båda avsnitten finns");
  assert.ok(search < species, "sökningen står före djurslagen");
});

test("startsidan bär ingen sökning: den hör till djurinfosidan (02-§5.7)", async () => {
  const html = await page("");
  assert.doesNotMatch(html, /data-animal-id-search/);
});

test("djursidan visar originalvärdet med etiketten Öronmärke (02-§5.36)", async () => {
  const html = await page("djur/far-astrid");
  assert.match(html, /<dt>Öronmärke<\/dt>/);
  assert.match(html, /<dd>SE 012345 0001<\/dd>/);
});
