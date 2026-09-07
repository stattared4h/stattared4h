import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { loadDataset } from "../../source/ts/domain/index.ts";

async function datasetWith(ids: readonly string[]) {
  const dir = await mkdtemp(path.join(tmpdir(), "stattared-public-id-"));
  await mkdir(path.join(dir, "animals"));
  await writeFile(path.join(dir, "species.yaml"), "species:\n  - id: far\n    name: Får\n    plural: Får\n");
  for (const [index, publicId] of ids.entries()) {
    await writeFile(
      path.join(dir, "animals", `far-${index + 1}.yaml`),
      `name: Får ${index + 1}\nspecies: far\nsex: female\npublicId: ${publicId}\nstatus: here\n`,
    );
  }
  return dir;
}

test("loadDataset keeps valid public IDs on the public animal model", async () => {
  const dir = await datasetWith(["SE 012345 0001", "SE-012345-0002"]);
  try {
    const result = await loadDataset(dir);
    assert.ok(result.dataset);
    assert.deepEqual(result.dataset.animals.map((animal) => animal.publicId), ["SE 012345 0001", "SE-012345-0002"]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("normalised duplicate public IDs fail validation", async () => {
  const dir = await datasetWith(["SE 012345 0001", "se-012345-0001"]);
  try {
    const result = await loadDataset(dir);
    assert.equal(result.dataset, null);
    assert.ok(result.errors.some((error) => error.field === "publicId" && /unikt/.test(error.message)));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
