/**
 * 04-§5.9 / 02-§5.25 / 02-§5.30: every active place in every dataset has coordinates,
 * and every one of them lands inside the drawing.
 *
 * Both halves erode a file at a time, and neither fails the build — a place without
 * coordinates only warns (02-§5.25) and a place outside the drawing is silently left off
 * the map with a warning (02-§5.30). A visitor scanning the QR code on a pasture that is
 * missing from the map has no way to tell that it should have been there, so the rule is
 * held by a test instead. Like `no-location.test.ts` it reads the YAML directly, for both
 * source/data and source/data-qa, rather than trusting the validator alone.
 *
 * An inactive place is exempt: it is kept only so an old QR code still reaches a page
 * (04-§5.4), and it is not drawn.
 */
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { parse } from "yaml";
import { loadMapBackground, projectPoint } from "../../source/ts/build/map.ts";
import { PROD_DIR, QA_DIR, ROOT } from "./helpers.ts";

interface Place {
  file: string;
  name: unknown;
  lat: unknown;
  lon: unknown;
  active: unknown;
}

async function activePlaces(dir: string): Promise<Place[]> {
  let names: string[];
  try {
    names = await readdir(path.join(dir, "locations"));
  } catch {
    return [];
  }
  const places: Place[] = [];
  for (const name of names.filter((n) => n.endsWith(".yaml"))) {
    const file = path.join(dir, "locations", name);
    const data: unknown = parse(await readFile(file, "utf8"));
    assert.ok(typeof data === "object" && data !== null, `${file} is a mapping`);
    const place = { file, ...(data as Omit<Place, "file">) };
    if (place.active !== false) places.push(place);
  }
  return places;
}

/** The relative directory name, so the test titles say which dataset failed. */
function label(dir: string): string {
  return path.relative(ROOT, dir);
}

for (const dir of [PROD_DIR, QA_DIR]) {
  test(`every active place in ${label(dir)} has coordinates`, async () => {
    for (const place of await activePlaces(dir)) {
      assert.equal(
        typeof place.lat,
        "number",
        `${place.file}: aktiv plats utan lat syns inte på kartan (04-§5.9)`,
      );
      assert.equal(
        typeof place.lon,
        "number",
        `${place.file}: aktiv plats utan lon syns inte på kartan (04-§5.9)`,
      );
    }
  });

  test(`every active place in ${label(dir)} lands inside the drawing`, async () => {
    const background = await loadMapBackground(path.join(ROOT, "source", "map"));
    assert.ok(background !== null, "source/map/ ska innehålla en ritad bakgrund");
    for (const place of await activePlaces(dir)) {
      if (typeof place.lat !== "number" || typeof place.lon !== "number") continue;
      const { x, y } = projectPoint({ lat: place.lat, lon: place.lon }, background);
      assert.ok(
        x >= 0 && x <= background.width && y >= 0 && y <= background.height,
        `${place.file}: (${place.lat}, ${place.lon}) hamnar på ${x.toFixed(0)}, ${y.toFixed(0)} — utanför ritningen ${background.width} × ${background.height} (02-§5.30)`,
      );
    }
  });
}

test("both datasets have places to check, so the rules are actually exercised", async () => {
  assert.ok((await activePlaces(PROD_DIR)).length > 0);
  assert.ok((await activePlaces(QA_DIR)).length > 0);
});
