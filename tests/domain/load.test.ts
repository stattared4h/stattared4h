/**
 * 02-§6.1 / 04-§2.3: only *.yaml is read, README.md is ignored, and a dataset with no
 * animals or locations — like source/data/ today — loads as empty.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { loadRawDataset } from "../../source/ts/domain/load.ts";
import { loadDataset, loadValidDataset } from "../../source/ts/domain/index.ts";
import { PROD_DIR, QA_DIR, tempDir, writeInto } from "./helpers.ts";

test("reads vocabulary, populations, animals and locations from the QA dataset", async () => {
  const raw = await loadRawDataset(QA_DIR);
  assert.equal(raw.species?.file, "species.yaml");
  assert.equal(raw.breeds?.file, "breeds.yaml");
  assert.equal(raw.populations?.file, "populations.yaml");
  assert.equal(raw.animals.length, 100);
  assert.equal(raw.locations.length, 10);
  assert.deepEqual(
    raw.animals.map((a) => a.id).slice(0, 3),
    ["bagaren", "bocken", "bomull"],
    "sorted by file name, id is the file name without .yaml",
  );
  assert.equal(raw.animals.find((a) => a.id === "rosa")?.file, "animals/rosa.yaml");
});

test("ignores files that are not *.yaml and treats missing directories as empty", async () => {
  const dir = await tempDir("s4h-load");
  await writeInto(dir, "README.md", "# ignored\n");
  await writeInto(dir, "animals/README.md", "# ignored\n");
  await writeInto(dir, "animals/notes.txt", "ignored\n");
  await writeInto(dir, "animals/tuva.yaml", "name: Tuva\nspecies: get\nsex: female\nstatus: here\n");
  const raw = await loadRawDataset(dir);
  assert.equal(raw.species, null);
  assert.equal(raw.breeds, null);
  assert.equal(raw.populations, null);
  assert.deepEqual(
    raw.animals.map((a) => a.id),
    ["tuva"],
  );
  assert.deepEqual(raw.locations, []);
});

test("keeps a YAML syntax error on the record instead of throwing", async () => {
  const dir = await tempDir("s4h-load");
  await writeInto(dir, "animals/bad.yaml", "name: [unclosed\n");
  const raw = await loadRawDataset(dir);
  assert.equal(raw.animals[0].data, null);
  assert.equal(typeof raw.animals[0].parseError, "string");
});

test("source/data (empty today) loads and validates without errors", async () => {
  const result = await loadDataset(PROD_DIR);
  assert.deepEqual(result.errors, []);
  assert.notEqual(result.dataset, null);
  const dataset = await loadValidDataset(PROD_DIR);
  assert.ok(Array.isArray(dataset.animals));
});

test("loadValidDataset throws one Swedish line per error", async () => {
  const dir = await tempDir("s4h-load");
  await writeInto(dir, "animals/rosa.yaml", "name: Rosa\nspecies: get\nsex: female\nstatus: here\nborn: 2021-13-40\n");
  await assert.rejects(loadValidDataset(dir), (error: Error) => {
    assert.match(error.message, /animals\/rosa\.yaml: fältet born: "2021-13-40" är inte ett giltigt datum\. Skriv YYYY-MM-DD eller YYYY\./);
    assert.match(error.message, /animals\/rosa\.yaml: fältet species: arten "get" finns inte i species\.yaml/);
    return true;
  });
});
