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
 *
 * Images go through the image posts (02-§8.12): `![](img-a3f2c1d8b901)` becomes the same
 * responsive markup the `picture` shortcode produces, with the alt text taken from the
 * post rather than from the Markdown, so it is written once. Anything the resolver
 * cannot place — an unknown id, or an address that is not an id at all — renders as the
 * placeholder, because no page shows a broken image (02-§8.6).
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import MarkdownIt, { type RenderRule } from "markdown-it";
import { isImageId } from "../domain/image-id.ts";
import { renderPlaceholder } from "./images.ts";

const MISSING_LABEL = "Bild saknas";

const markdownIt = new MarkdownIt({ html: false, linkify: false, typographer: false });

export interface MarkdownOptions {
  /** Markup for one image id, or null when the id is unknown. */
  renderImage?: (id: string) => string | null;
}

/** What `render` carries through to the image rule; markdown-it calls it `env`. */
interface MarkdownEnv {
  renderImage?: (id: string) => string | null;
}

const imageRule: RenderRule<MarkdownEnv> = (tokens, index, _options, env): string => {
  const id = tokens[index].attrGet("src") ?? "";
  const html = isImageId(id) ? (env?.renderImage?.(id) ?? null) : null;
  return html ?? renderPlaceholder({ label: MISSING_LABEL });
};
markdownIt.renderer.rules.image = imageRule as RenderRule<never>;

/** Markdown to HTML. Used as an Eleventy filter. */
export function renderMarkdown(text: string, options: MarkdownOptions = {}): string {
  const env: MarkdownEnv = { renderImage: options.renderImage };
  return markdownIt.render(text, env);
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
