/** Writes one generation prompt per QA image post (02-§8.22). */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { loadValidDataset } from "../source/ts/domain/index.ts";
import { buildQaPromptRows, qaPromptCsv } from "./lib/qa-images.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const USAGE = "Användning: npm run qa:prompts [-- --data-dir <katalog>] [--out <fil>]";

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseArguments(argv) {
  const options = {
    dataDir: path.join(ROOT, "source", "data-qa"),
    out: path.join(ROOT, "qa-prompts.csv"),
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--data-dir") options.dataDir = path.resolve(argv[++index]);
    else if (arg === "--out") options.out = path.resolve(argv[++index]);
    else fail(`Okänd flagga ${arg}. ${USAGE}`);
  }
  if (path.basename(options.dataDir) === "data") fail("Vägrar skapa QA-prompter från gårdens riktiga data.");
  return options;
}

const options = parseArguments(process.argv.slice(2));
const dataset = await loadValidDataset(options.dataDir);
const rows = buildQaPromptRows(dataset);
await writeFile(options.out, qaPromptCsv(rows));
console.log(`Skrev ${rows.length} prompter till ${path.relative(process.cwd(), options.out) || options.out}.`);
