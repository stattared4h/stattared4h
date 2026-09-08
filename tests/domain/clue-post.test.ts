/**
 * 02-§11.25–11.29: the clue file the image tool hands over beside the picture.
 *
 * The strongest check here is the last one: the file the tool writes is read back by the
 * real validator, in a real dataset directory. Two shapes that are meant to match — the
 * tool's output and the contract's rules — will drift apart the day one of them is
 * edited alone, and a test that only compares strings would not notice (02-§11.23).
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { parse } from "yaml";
import { cluePostFile, cluePostProblems, formatCluePost, MAX_CLUE_TEXT_LENGTH } from "../../source/ts/domain/clue-post.ts";
import { loadDataset } from "../../source/ts/domain/index.ts";
import { TODAY, tempDir, writeInto } from "./helpers.ts";

const IMAGE_ID = "img-a3f2c1d8b901";

test("the clue lives under the picture's own id (04-§11.2)", () => {
  assert.equal(cluePostFile(IMAGE_ID), `clues/${IMAGE_ID}.yaml`);
});

test("a clue with a text is two lines; one without is a single line", () => {
  assert.equal(formatCluePost({ location: "brackebur", text: "Vid grinden." }), "location: brackebur\ntext: Vid grinden.\n");
  assert.equal(formatCluePost({ location: "brackebur", text: "" }), "location: brackebur\n");
  assert.equal(formatCluePost({ location: "brackebur", text: "   " }), "location: brackebur\n", "blanks are no text at all");
});

test("text that YAML would misread is quoted and still parses back unchanged", () => {
  const tricky = ["Vid grinden: den vänstra", "#2 från vägen", "- inte en lista", 'Den "gula" luckan', "true", "2021-04-12"];
  for (const text of tricky) {
    assert.deepEqual(parse(formatCluePost({ location: "brackebur", text })), { location: "brackebur", text }, text);
  }
});

test("a missing place is a problem; an empty text is not", () => {
  assert.deepEqual(cluePostProblems({ location: "", text: "Vid grinden." }).map((p) => p.field), ["location"]);
  assert.deepEqual(cluePostProblems({ location: "   ", text: "" }).map((p) => p.field), ["location"]);
  assert.deepEqual(cluePostProblems({ location: "brackebur", text: "" }), []);
});

test("a text that is markup or too long is refused, and the limit is the one the contract states", () => {
  assert.deepEqual(cluePostProblems({ location: "brackebur", text: "<b>Vid grinden</b>" }).map((p) => p.field), ["text"]);
  assert.deepEqual(cluePostProblems({ location: "brackebur", text: "x".repeat(MAX_CLUE_TEXT_LENGTH) }), []);
  const tooLong = cluePostProblems({ location: "brackebur", text: "x".repeat(MAX_CLUE_TEXT_LENGTH + 1) });
  assert.deepEqual(tooLong.map((p) => p.field), ["text"]);
  assert.match(tooLong[0].message, new RegExp(String(MAX_CLUE_TEXT_LENGTH)));
});

test("what the tool writes passes the validator without any tidying (02-§11.23)", async () => {
  const dir = await tempDir("s4h-clue");
  const dataDir = `${dir}/data`;
  await writeInto(dataDir, "species.yaml", "species: []\n");
  await writeInto(dataDir, "breeds.yaml", "breeds: []\n");
  await writeInto(
    dataDir,
    "locations/brackebur.yaml",
    "name: Bräckebur\nkind: djurplats\nspecies: []\naccessible: true\nactive: true\n",
  );
  await writeInto(dataDir, `images/${IMAGE_ID}.yaml`, "alt: Närbild på grinden.\ncredit: Anna Karlsson\n");
  await writeInto(dataDir, cluePostFile(IMAGE_ID), formatCluePost({ location: "brackebur", text: "Den öppnas varje morgon." }));

  const result = await loadDataset(dataDir, { today: TODAY });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.dataset?.clues.map((clue) => [clue.id, clue.location, clue.text]), [
    [IMAGE_ID, "brackebur", "Den öppnas varje morgon."],
  ]);
});

test("a clue without a text passes too: the picture is the whole clue", async () => {
  const dir = await tempDir("s4h-clue-bare");
  const dataDir = `${dir}/data`;
  await writeInto(dataDir, "species.yaml", "species: []\n");
  await writeInto(dataDir, "breeds.yaml", "breeds: []\n");
  await writeInto(dataDir, "locations/lekplatsen.yaml", "name: Lekplatsen\nkind: lek\nspecies: []\naccessible: true\nactive: true\n");
  await writeInto(dataDir, `images/${IMAGE_ID}.yaml`, "alt: Närbild på en gunga.\ncredit: Anna Karlsson\n");
  await writeInto(dataDir, cluePostFile(IMAGE_ID), formatCluePost({ location: "lekplatsen", text: "" }));

  const result = await loadDataset(dataDir, { today: TODAY });
  assert.deepEqual(result.errors, []);
  assert.equal(result.dataset?.clues[0].text, null);
});
