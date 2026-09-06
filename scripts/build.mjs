/**
 * Builds the site into public/.
 *
 * Deliberately tiny: it renders the pages that exist today and proves the base-path
 * mechanism end to end. The data-driven pages (animals, places, species) arrive with
 * Eleventy — see docs/03-arkitektur/index.md.
 *
 * BASE_PATH decides where the site is served from: "/" locally, "/stattared4h/" on
 * GitHub Pages. Templates never write an absolute path themselves; they use {{base}},
 * and this script is the only place that resolves it (ADR 0005).
 */

import { mkdir, readdir, readFile, writeFile, rm, cp } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "public");

/** Always starts and ends with a slash, so {{base}}foo.css is always well formed. */
function normaliseBasePath(raw) {
  const value = (raw ?? "/").trim() || "/";
  const withLeading = value.startsWith("/") ? value : `/${value}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}

const BASE = normaliseBasePath(process.env.BASE_PATH);

/**
 * Guards ADR 0005: a hand-written absolute path works on one deployment and breaks on
 * the other, and the failure is silent. Catching it at build time is the whole point.
 *
 * Runs on the TEMPLATE, before {{base}} is resolved. Checking the output instead would
 * flag every correctly resolved path whenever the base path is "/".
 */
function assertNoAbsolutePaths(template, file) {
  const offenders = [...template.matchAll(/(?:href|src)="(\/[^"]*)"/g)].map((m) => m[1]);
  if (offenders.length > 0) {
    throw new Error(
      `${file}: absolute path(s) bypassing the base path: ${offenders.join(", ")}\n` +
        `Use {{base}} instead — see ADR 0005.`,
    );
  }
}

async function build() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const pagesDir = path.join(ROOT, "source", "pages");
  const pages = (await readdir(pagesDir)).filter((f) => f.endsWith(".html"));

  for (const page of pages) {
    const template = await readFile(path.join(pagesDir, page), "utf8");
    assertNoAbsolutePaths(template, page);
    const html = template.replaceAll("{{base}}", BASE);
    await writeFile(path.join(OUT, page), html);
  }

  await cp(path.join(ROOT, "source", "assets"), path.join(OUT, "assets"), {
    recursive: true,
  });

  const robots = path.join(ROOT, "source", "robots.txt");
  if (existsSync(robots)) {
    const text = (await readFile(robots, "utf8")).replaceAll("{{base}}", BASE);
    await writeFile(path.join(OUT, "robots.txt"), text);
  }

  console.log(`Built ${pages.length} page(s) into public/ with base path "${BASE}"`);
}

await build();
