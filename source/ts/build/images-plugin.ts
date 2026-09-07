/**
 * Eleventy plugin for the image pipeline (02-§8.5–8.6, 03-§6).
 *
 * Wire it up in eleventy.config.js:
 *
 *   import { imagesPlugin } from "./source/ts/build/images-plugin.ts";
 *
 *   eleventyConfig.addPlugin(imagesPlugin, {
 *     dataDir: process.env.DATA_DIR ?? "source/data",
 *     outDir: "public",
 *     pathPrefix: process.env.BASE_PATH ?? "/",
 *   });
 *
 * Before the build runs, every source image gets its `srcset` sizes generated into
 * `<outDir>/images/`. Templates then use:
 *
 *   {% picture animal.photos[0], "(min-width: 960px) 33vw, 100vw", true, species.name %}
 *   {% placeholder species.name %}
 *   {{ photo.id | imageInfo }}
 *
 * `picture` takes the resolved image from the dataset (`{ id, alt, credit }`), an
 * optional `sizes` attribute, whether the image is the page's first (eager,
 * `fetchpriority="high"`), and the label to show if the file is missing. A missing file
 * logs a warning and renders the placeholder instead of a broken image. The shortcodes
 * return HTML; Eleventy's Nunjucks does not autoescape shortcode output, so mark the
 * result `safe` only if autoescape is turned on.
 *
 * The same rendering is what content Markdown needs for `![](img-…)` (02-§8.12). Since
 * only this plugin knows the generated sizes, it fills in `options.markdownImages`, a
 * handle the configuration hands to the `markdown` filter.
 */
import type { Image } from "../domain/types.ts";
import {
  generateImageSizes,
  imagesDirFor,
  renderPicture,
  renderPlaceholder,
  SRCSET_WIDTHS,
  type ImageInfo,
} from "./images.ts";

/** What Eleventy passes to "eleventy.before"; `directories.output` follows the --output flag. */
export interface EleventyEventPayload {
  directories?: { output?: string };
}

/** The slice of Eleventy's UserConfig this plugin uses. Eleventy ships no types. */
export interface EleventyConfigLike {
  on(event: string, handler: (payload: EleventyEventPayload) => Promise<void> | void): unknown;
  addShortcode(name: string, fn: (...args: never[]) => string): unknown;
  addFilter(name: string, fn: (...args: never[]) => unknown): unknown;
}

/**
 * How the `markdown` filter reaches this plugin's rendering. The plugin replaces
 * `render` once the build has generated the sizes; before that it returns null and the
 * caller falls back to a placeholder.
 */
export interface MarkdownImages {
  render: (id: string) => string | null;
}

export interface ImagesPluginOptions {
  /** Dataset directory; the images directory is derived from it (`imagesDirFor`). */
  dataDir: string;
  /** Eleventy's output directory; overridden by `directories.output` from the build event when present. */
  outDir: string;
  /** Base path. Normalised to leading and trailing slash (ADR 0005). */
  pathPrefix?: string;
  /** The dataset's image posts, read once per build so Markdown can resolve an id to its alt text. */
  getImages?: () => Promise<readonly Image[]> | readonly Image[];
  /** Filled in by the plugin; hand the same object to the `markdown` filter (03-§6.6). */
  markdownImages?: MarkdownImages;
}

/** What a template passes to `picture`: the resolved image, or nothing when the record has none. */
export interface PhotoLike {
  id: string;
  alt: string;
}

const MISSING_LABEL = "Bild saknas";

export function imagesPlugin(eleventyConfig: EleventyConfigLike, options: ImagesPluginOptions): void {
  const imagesDir = imagesDirFor(options.dataDir);
  const base = normalisePathPrefix(options.pathPrefix);
  let infos = new Map<string, ImageInfo>();
  let images = new Map<string, Image>();

  eleventyConfig.on("eleventy.before", async (payload) => {
    const outDir = payload?.directories?.output ?? options.outDir;
    infos = await generateImageSizes({ imagesDir, outDir, widths: SRCSET_WIDTHS });
    const posts = (await options.getImages?.()) ?? [];
    images = new Map(posts.map((image) => [image.id, image]));
  });

  /** The markup for one image, or null when the build generated no sizes for it. */
  const render = (photo: PhotoLike, sizes?: string, eager = false): string | null => {
    const info = infos.get(photo.id);
    if (info === undefined) {
      console.warn(`[bilder] ${photo.id}.webp finns inte i ${imagesDir}; platshållare används.`);
      return null;
    }
    return renderPicture({ id: photo.id, alt: photo.alt, info, sizes, eager, base });
  };

  eleventyConfig.addShortcode(
    "picture",
    (photo?: PhotoLike, sizes?: string, eager = false, label?: string): string => {
      const html = photo ? render(photo, sizes, eager) : null;
      return html ?? renderPlaceholder({ label: label ?? photo?.alt ?? MISSING_LABEL });
    },
  );

  eleventyConfig.addShortcode("placeholder", (label?: string): string =>
    renderPlaceholder({ label: label ?? MISSING_LABEL }),
  );

  eleventyConfig.addFilter("imageInfo", (id: string): ImageInfo | undefined => infos.get(id));

  if (options.markdownImages) {
    options.markdownImages.render = (id: string): string | null => {
      const image = images.get(id);
      return image ? render(image) : null;
    };
  }
}

/** Always starts and ends with a slash, so `${base}images/…` is always well formed. */
export function normalisePathPrefix(raw: string | undefined): string {
  const value = (raw ?? "/").trim() || "/";
  const withLeading = value.startsWith("/") ? value : `/${value}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}
