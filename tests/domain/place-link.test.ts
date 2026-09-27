/**
 * 02-§11.37, 02-§11.38: what the editor adds to the place's file, and where that file is.
 *
 * The tool never writes the place's file itself; it tells the editor which lines to add.
 * The test pastes those lines into a place file the way the page tells the editor to and
 * parses the result, so what is shown is checked by what it does, not by how it looks.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { parse } from "yaml";
import { placeFileUrl, placePhotoLines } from "../../source/ts/domain/place-link.ts";

const ID = "img-a3f2c1d8b901";
const WITH_PHOTOS = "name: Bräckebur\nkind: djurplats\nspecies: []\naccessible: true\nactive: true\nphotos:\n  - img-38555d3899c2\n";
const WITHOUT_PHOTOS = "name: A\nkind: djurplats\nspecies: []\naccessible: true\nactive: true\n";

test("a place with photos gets one line, last in its list", () => {
  const lines = placePhotoLines(ID, true);
  assert.equal(lines, `  - ${ID}`);
  assert.deepEqual(parse(`${WITH_PHOTOS}${lines}\n`).photos, ["img-38555d3899c2", ID]);
});

test("a place without photos gets the list as well", () => {
  const lines = placePhotoLines(ID, false);
  assert.equal(lines, `photos:\n  - ${ID}`);
  assert.deepEqual(parse(`${WITHOUT_PHOTOS}${lines}\n`).photos, [ID]);
});

test("the link goes to the place's file in the repository on github.com", () => {
  assert.equal(
    placeFileUrl("https://github.com/stattared4h/stattared4h", "brackebur"),
    "https://github.com/stattared4h/stattared4h/blob/main/source/data/locations/brackebur.yaml",
  );
});
