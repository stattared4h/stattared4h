/** QA prompt planning and import (02-§8.22–8.27, 03-§6.8). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildQaPromptRows, qaPromptCsv } from "../../scripts/lib/qa-images.ts";
import { qaDataset } from "../domain/helpers.ts";

test("one prompt row is written per QA image post with context and a stable target", async () => {
  const dataset = await qaDataset();
  const rows = buildQaPromptRows(dataset);

  assert.equal(rows.length, dataset.images.length);
  assert.deepEqual(
    rows.map((row) => row.id),
    [...dataset.images].map((image) => image.id).sort(),
  );
  for (const row of rows) {
    assert.equal(row.file, `${row.id}.png`);
    assert.match(row.prompt, /fotorealistiskt/i);
    assert.match(row.prompt, /inga personer/i);
    assert.match(row.prompt, /ingen text/i, "the import, not the generator, owns the badge");
  }

  const rosa = dataset.animals.find((animal) => animal.id === "rosa");
  assert.ok(rosa?.photos[0]);
  const row = rows.find((candidate) => candidate.id === rosa.photos[0].id);
  assert.ok(row);
  assert.match(row.prompt, /Rosa/);
  assert.match(row.prompt, /Get/);
  assert.match(row.prompt, /Jämtget/);
  assert.match(row.prompt, /gårdens mest framfusiga get/);
});

test("the prompt table is spreadsheet-safe CSV", async () => {
  const csv = qaPromptCsv(buildQaPromptRows(await qaDataset()));
  assert.match(csv, /^bild-id,fil,prompt\n/);
  assert.match(csv, /"[^"]*,[^"]*"/s, "a prompt containing a comma must be quoted");
  assert.equal(csv.endsWith("\n"), true);
});
