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
 *   {% picture animal.photos[0], "animals", "(min-width: 960px) 33vw, 100vw", true, species.name %}
 *   {% placeholder species.name %}
 *   {{ photo.file | imageInfo("animals") }}
 *
 * `picture` takes the photo object from YAML, the kind (`animals`, `species`, `places`,
 * `content`), an optional `sizes` attribute, whether the image is the page's first
 * (eager, `fetchpriority="high"`), and the label to show if the file is missing. A
 * missing file logs a warning and renders the placeholder instead of a broken image.
 * The shortcodes return HTML; Eleventy's Nunjucks does not autoescape shortcode output,
 * so mark the result `safe` only if autoescape is turned on.
 */
import {
  generateImageSizes,
  imagesDirFor,
  renderPicture,
  renderPlaceholder,
  SRCSET_WIDTHS,
  type ImageInfo,
} from "./images.ts";

/** The slice of Eleventy's UserConfig this plugin uses. Eleventy ships no types. */
export interface EleventyConfigLike {
  on(event: string, handler: () => Promise<void> | void): unknown;
  addShortcode(name: string, fn: (...args: never[]) => string): unknown;
  addFilter(name: string, fn: (...args: never[]) => unknown): unknown;
}

export interface ImagesPluginOptions {
  /** Dataset directory; the images directory is derived from it (`imagesDirFor`). */
  dataDir: string;
  /** Eleventy's output directory. */
  outDir: string;
  /** Base path. Normalised to leading and trailing slash (ADR 0005). */
  pathPrefix?: string;
}

/** A `photos[]` entry for an animal or the `photo` of a species (04-§4, 04-§6). */
export interface PhotoLike {
  file: string;
  alt: string;
}

const MISSING_LABEL = "Bild saknas";

export function imagesPlugin(eleventyConfig: EleventyConfigLike, options: ImagesPluginOptions): void {
  const imagesDir = imagesDirFor(options.dataDir);
  const base = normalisePathPrefix(options.pathPrefix);
  let infos = new Map<string, ImageInfo>();

  eleventyConfig.on("eleventy.before", async () => {
    infos = await generateImageSizes({ imagesDir, outDir: options.outDir, widths: SRCSET_WIDTHS });
  });

  eleventyConfig.addShortcode(
    "picture",
    (photo?: PhotoLike, kind = "animals", sizes?: string, eager = false, label?: string): string => {
      const info = photo ? infos.get(`${kind}/${photo.file}`) : undefined;
      if (!photo || !info) {
        if (photo) {
          console.warn(`[bilder] ${kind}/${photo.file} finns inte i ${imagesDir}; platshållare används.`);
        }
        return renderPlaceholder({ label: label ?? photo?.alt ?? MISSING_LABEL });
      }
      return renderPicture({ kind, file: photo.file, alt: photo.alt, info, sizes, eager, base });
    },
  );

  eleventyConfig.addShortcode("placeholder", (label?: string): string =>
    renderPlaceholder({ label: label ?? MISSING_LABEL }),
  );

  eleventyConfig.addFilter(
    "imageInfo",
    (file: string, kind = "animals"): ImageInfo | undefined => infos.get(`${kind}/${file}`),
  );
}

/** Always starts and ends with a slash, so `${base}images/…` is always well formed. */
export function normalisePathPrefix(raw: string | undefined): string {
  const value = (raw ?? "/").trim() || "/";
  const withLeading = value.startsWith("/") ? value : `/${value}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}
