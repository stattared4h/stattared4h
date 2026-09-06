/**
 * 02-§6.11 / 04-§4.2 / 03-§8.6: no animal in any dataset has a `location` field. The
 * rule is the core of ADR 0012 and would otherwise erode one file at a time, so the test
 * reads the YAML directly — both source/data and source/data-qa — rather than trusting
 * the validator alone.
 */
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { parse } from "yaml";
import { PROD_DIR, QA_DIR } from "./helpers.ts";

async function animalFiles(dir: string): Promise<string[]> {
  try {
    const names = await readdir(path.join(dir, "animals"));
    return names.filter((n) => n.endsWith(".yaml")).map((n) => path.join(dir, "animals", n));
  } catch {
    return [];
  }
}

for (const dir of [PROD_DIR, QA_DIR]) {
  test(`no animal in ${path.relative(path.dirname(path.dirname(dir)), dir)} has a location field`, async () => {
    for (const file of await animalFiles(dir)) {
      const data: unknown = parse(await readFile(file, "utf8"));
      assert.ok(typeof data === "object" && data !== null, `${file} is a mapping`);
      assert.ok(!("location" in data), `${file} has a location field — see ADR 0012`);
    }
  });
}

test("the QA dataset has animals to check, so the rule is actually exercised", async () => {
  assert.ok((await animalFiles(QA_DIR)).length > 0);
});
