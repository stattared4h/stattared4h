/**
 * 02-§5.30, 05-§2, 09-§1.1: the drawing under the map markers keeps to the palette in
 * docs/05-design/index.md §2, fetches nothing from outside, and states its edges.
 *
 * The drawing is artwork — someone will open it in Inkscape and move a shed — so the
 * test guards the properties that must survive every such edit, not the shapes
 * themselves. It reads the palette from the design document, so a colour the decision
 * does not know about fails here rather than reaching a visitor.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

import { parseMapBackground } from "../../source/ts/build/map.ts";

const ROOT = path.resolve(import.meta.dirname, "..", "..");

function read(file: string): Promise<string> {
  return readFile(path.join(ROOT, file), "utf8");
}

/** Every hex value in the palette table of docs/05-design/index.md §2. */
async function palette(): Promise<Set<string>> {
  const doc = await read("docs/05-design/index.md");
  const colours = [...doc.matchAll(/^\| `05-§2\.\d+` \| [^|]+ \| `(#[0-9a-f]{6})` \|/gm)];
  assert.ok(colours.length >= 8, "hittade ingen palett i designdokumentet");
  return new Set(colours.map((match) => match[1]));
}

test("ritningen använder bara färger ur paletten (05-§2)", async () => {
  const svg = await read("source/map/background.svg");
  const allowed = await palette();
  const used = new Set([...svg.matchAll(/(?:fill|stroke)="([^"]+)"/g)].map((m) => m[1]));
  used.delete("none");
  for (const colour of used) {
    assert.ok(allowed.has(colour), `${colour} står inte i paletten i docs/05-design/index.md §2`);
  }
  assert.ok(used.size > 0, "ritningen sätter inga färger alls");
});

test("ritningen hämtar ingenting utifrån (02-§5.26, 02-§5.30)", async () => {
  const svg = await read("source/map/background.svg");
  for (const forbidden of ["<script", "<style", "<image", "<foreignObject", "url(", "href"]) {
    assert.ok(!svg.includes(forbidden), `ritningen innehåller ${forbidden}`);
  }
  // `xmlns="http://www.w3.org/2000/svg"` names the SVG namespace and fetches nothing;
  // every other address in the file would be a request out of the site.
  const addresses = [...svg.matchAll(/https?:\/\/[^"\s]+/g)].map((m) => m[0]);
  assert.deepEqual(addresses, ["http://www.w3.org/2000/svg"], "bara SVG-namnrymden får stå i filen");
});

test("ritningen och dess kanter läses av bygget (02-§5.30)", async () => {
  const background = parseMapBackground(
    await read("source/map/background.svg"),
    await read("source/map/background.yaml"),
  );
  assert.ok(background.width > 0 && background.height > 0);
  assert.ok(background.north > background.south, "north ska ligga norr om south");
  assert.ok(background.east > background.west, "east ska ligga öster om west");
  // The farm sits in Halland; a drawing pointing somewhere else is a typo in the edges.
  assert.ok(background.south > 57.3 && background.north < 57.4, "latituden ligger utanför gården");
  assert.ok(background.west > 12.3 && background.east < 12.4, "longituden ligger utanför gården");
});
