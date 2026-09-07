/**
 * Editorial Markdown per species (02-§5.22, 04-§6.2): `source/content/arter/<id>.md`.
 *
 * Only the reading lives here; the view models in pages.ts take the result as a plain
 * record, so they stay free of the file system.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const MARKDOWN_SUFFIX = ".md";

/** `{ get: "…markdown…" }` for every `<id>.md` in `dir`; empty when the directory is missing. */
export async function readSpeciesContent(dir: string): Promise<Record<string, string>> {
  let names: string[];
  try {
    names = await readdir(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw error;
  }
  const content: Record<string, string> = {};
  for (const name of names.filter((n) => n.endsWith(MARKDOWN_SUFFIX)).sort()) {
    content[path.basename(name, MARKDOWN_SUFFIX)] = await readFile(path.join(dir, name), "utf8");
  }
  return content;
}
