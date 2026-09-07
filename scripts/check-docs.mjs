/**
 * Documentation check (02-§9.10): `npm run lint:docs`.
 *
 * Fails when a `§` id is defined twice, when the traceability matrix cites an id that
 * does not exist, when its summary does not match its rows, or when a comment in code or
 * configuration points at a file that is missing. The checks live in
 * scripts/lib/check-docs.ts so they can be unit-tested; Node runs the TypeScript directly
 * (02-§9.1).
 */

import path from "node:path";
import { checkDocs, formatFindings } from "./lib/check-docs.ts";

const ROOT = path.resolve(import.meta.dirname, "..");

const findings = checkDocs(ROOT);

if (findings.length > 0) {
  console.error(formatFindings(findings));
  console.error(`\nDokumentkontrollen hittade ${findings.length} fel.`);
  process.exit(1);
}

console.log("Dokumentkontrollen hittade inga fel.");
