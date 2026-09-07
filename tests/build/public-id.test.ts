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

test("startsidan erbjuder sökning på öronmärke med QA-id:n i sökdatat (02-§5.36)", async () => {
  const html = await page("");
  assert.match(html, /Hitta ett djur via öronmärket/);
  assert.match(html, /data-animal-id-search/);
  assert.match(html, /SE 012345 0001/);
  assert.match(html, /SE-012345-0002/);
});

test("sökningen är sista avsnittet före Fler kartor i området (02-§5.52)", async () => {
  const html = await page("");
  const species = html.indexOf("Djuren på gården");
  const search = html.indexOf("Hitta ett djur via öronmärket");
  const areaMaps = html.indexOf("Fler kartor i området");
  assert.ok(species > 0 && search > 0 && areaMaps > 0, "alla tre avsnitten finns");
  assert.ok(species < search, "sökningen står efter djurslagen");
  assert.ok(search < areaMaps, "sökningen står före Fler kartor i området");
});

test("djursidan visar originalvärdet med etiketten Öronmärke (02-§5.36)", async () => {
  const html = await page("djur/far-astrid");
  assert.match(html, /<dt>Öronmärke<\/dt>/);
  assert.match(html, /<dd>SE 012345 0001<\/dd>/);
});
