/**
 * 02-§6.6 / 06-§2.1: `npm run validate` reads DATA_DIR, prints Swedish messages and
 * exits with code 1 on errors. Runs the script as a child process, the way CI does.
 */
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import path from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";
import { QA_DIR, ROOT, tempDir, writeInto } from "./helpers.ts";

const run = promisify(execFile);
const SCRIPT = path.join(ROOT, "scripts", "validate.mjs");

async function validateScript(dataDir: string): Promise<{ code: number; stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await run(process.execPath, [SCRIPT], {
      cwd: ROOT,
      env: { ...process.env, DATA_DIR: dataDir },
    });
    return { code: 0, stdout, stderr };
  } catch (error) {
    const failed = error as { code: number; stdout: string; stderr: string };
    return { code: failed.code, stdout: failed.stdout, stderr: failed.stderr };
  }
}

test("exits 0 for the QA dataset and prints its warnings", async () => {
  const result = await validateScript(QA_DIR);
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /är giltigt: 12 djur, 6 platser, 5 arter, 4 raser/);
  assert.match(result.stderr, /Varning: locations\/ovre-hagen\.yaml/);
});

test("exits 1 for an invalid dataset and names the file and field", async () => {
  const dir = await tempDir("s4h-validate");
  await writeInto(dir, "species.yaml", "species:\n  - id: get\n    name: Get\n    plural: Getter\n");
  await writeInto(dir, "animals/rosa.yaml", "name: Rosa\nspecies: get\nsex: female\nstatus: here\nlocation: gethagen\n");
  const result = await validateScript(dir);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /Fel: animals\/rosa\.yaml: fältet location: ett djur har ingen egen plats/);
  assert.match(result.stderr, /har 1 fel/);
});
