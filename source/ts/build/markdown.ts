/**
 * Content pages written in Markdown (CL-§2.2, 02-§10.27).
 *
 * The files under source/content/ are not Eleventy input — the directory is ignored
 * so an editor's Markdown never becomes a page of its own with a guessed address.
 * Instead the build reads them all into one object, keyed by file name without
 * extension, and the page template that owns the address renders the one it wants:
 *
 *   {{ texts.om | markdown | safe }}
 *
 * The `markdown` filter is markdown-it with raw HTML turned off: the text comes from
 * editors, and a page built from it should never carry markup they did not intend.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import MarkdownIt from "markdown-it";

const markdownIt = new MarkdownIt({ html: false, linkify: false, typographer: false });

/** Markdown to HTML. Used as an Eleventy filter. */
export function renderMarkdown(text: string): string {
  return markdownIt.render(text);
}

/** `{ om: "# Om sajten\n…" }` for source/content/om.md. An empty directory gives an empty object. */
export async function readContentFiles(contentDir: string): Promise<Record<string, string>> {
  const texts: Record<string, string> = {};
  const entries = await readdir(contentDir).catch(() => [] as string[]);
  for (const name of entries.sort()) {
    if (!name.endsWith(".md")) continue;
    texts[path.basename(name, ".md")] = await readFile(path.join(contentDir, name), "utf8");
  }
  return texts;
}
