/**
 * Eleventy configuration — builds source/ into public/ (02-§9.1, ADR 0003).
 *
 * Environment variables the build honours (docs/06-MILJOER.md):
 *   BASE_PATH       where the site is served from: "/" locally, "/stattared4h/" on
 *                   GitHub Pages. Becomes Eleventy's pathPrefix, so every `| url` in a
 *                   template gets it in front (ADR 0005).
 *   DATA_DIR        which dataset the data-driven pages read (06-§2.1). The dataset
 *                   itself is wired in by the domain layer; here it only decides whether
 *                   this is a QA build (06-§1.3) and is passed on as `build.dataDir`.
 *   BUILD_VERSION   the version string from the deploy workflow (02-§10.25).
 *   GITHUB_ACTIONS  set by CI; without BUILD_VERSION no version is shown there.
 *
 * The data-driven pages (02-§5) read the validated dataset through two global data keys:
 *   dataset   the Dataset from source/ts/domain/index.ts, validated first (02-§6.2)
 *   views     one view model per page from source/ts/build/pages.ts, which the
 *             templates in source/pages/ paginate over
 * Images: source/ts/build/images-plugin.ts generates the srcset sizes before the build
 * and provides the `picture` and `placeholder` shortcodes (02-§8.5).
 */

import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import * as esbuild from "esbuild";
import { loadValidDataset } from "./source/ts/domain/index.ts";
import { readBuildVersion } from "./source/ts/domain/version.ts";
import { readSpeciesContent } from "./source/ts/build/content.ts";
import { imagesPlugin } from "./source/ts/build/images-plugin.ts";
import { bundleServiceWorker, listStaticAssets, readThemeColours } from "./source/ts/build/pwa.ts";
import { readContentFiles, renderMarkdown } from "./source/ts/build/markdown.ts";
import { imagesDirFor } from "./source/ts/build/images.ts";
import { loadMapBackground } from "./source/ts/build/map.ts";
import { buildViews } from "./source/ts/build/pages.ts";

const ROOT = import.meta.dirname;

/** 06-§3.1: the base path always starts and ends with a slash, so "/" + "assets" is never "//assets". */
function normaliseBasePath(raw) {
  const value = (raw ?? "/").trim() || "/";
  const withLeading = value.startsWith("/") ? value : `/${value}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}

/** Directories under source/ that are not Eleventy input: data, code and images have their own pipelines. */
function isIgnoredDirectory(name) {
  return name.startsWith("data") || name.startsWith("images") || name === "ts" || name === "content" || name === "map";
}

/** The species content directory and the map directory, relative to the input directory. */
const SPECIES_CONTENT_DIR = "content/arter";
const MAP_DIR = "map";

const TEMPLATE_FILE = /\.(njk|md|html)$/;
/** A hand-written absolute path in a template. Protocol-relative "//" is not a site path. */
const HAND_WRITTEN_ABSOLUTE = /\b(?:href|src|srcset|action|poster)="\/(?!\/)[^"]*"|url\(["']?\/(?!\/)[^"')]*/g;

/**
 * 06-§3.5: refuse to build when a template writes an absolute path itself instead of
 * going through the `url` filter. Such a path works on one deployment and silently
 * breaks on the other, so it is caught here, before any page is rendered. The output
 * test in tests/build/ guards the same rule from the other side.
 */
async function assertNoHandWrittenAbsolutePaths(dir) {
  const offenders = [];
  for (const entry of await readdir(dir, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile() || !TEMPLATE_FILE.test(entry.name)) continue;
    const relative = path.relative(dir, path.join(entry.parentPath, entry.name));
    if (relative.split(path.sep).some(isIgnoredDirectory)) continue;
    const text = await readFile(path.join(entry.parentPath, entry.name), "utf8");
    for (const match of text.matchAll(HAND_WRITTEN_ABSOLUTE)) {
      offenders.push(`${relative}: ${match[0]}`);
    }
  }
  if (offenders.length > 0) {
    throw new Error(
      `Hand-written absolute path(s) bypass the base path (ADR 0005). Use the url filter instead:\n  ${offenders.join("\n  ")}`,
    );
  }
}

export default function (eleventyConfig) {
  const pathPrefix = normaliseBasePath(process.env.BASE_PATH);
  const dataDir = (process.env.DATA_DIR || "source/data").replace(/\/+$/, "");
  const farm = "Stättareds 4H-gård";

  // Data, code and images are not templates; they have their own pipelines.
  eleventyConfig.ignores.add("source/data*/**");
  eleventyConfig.ignores.add("source/ts/**");
  eleventyConfig.ignores.add("source/images*/**");
  eleventyConfig.ignores.add("source/content/**");
  eleventyConfig.ignores.add("source/map/**");

  // Event handlers run in registration order, so the dataset below is validated
  // before the images plugin writes anything (02-§6.2).
  eleventyConfig.setEventEmitterMode("sequential");

  // The dataset and the page view models, loaded once per build. `eleventy.before`
  // starts the load so that a validation error stops the build before any file is
  // written; the global data keys then hand the same promise to the templates.
  let views = null;
  const loadViews = () => {
    views ??= (async () => {
      const imagesDir = imagesDirFor(dataDir);
      const dataset = await loadValidDataset(dataDir, { imagesDir: existsSync(imagesDir) ? imagesDir : null });
      const [speciesContent, mapBackground] = await Promise.all([
        readSpeciesContent(path.join("source", SPECIES_CONTENT_DIR)),
        loadMapBackground(path.join("source", MAP_DIR)),
      ]);
      const built = buildViews(dataset, { base: pathPrefix, farm, speciesContent, mapBackground });
      for (const warning of built.map.warnings) console.warn(`Varning: ${warning}`);
      return { dataset, views: built };
    })();
    return views;
  };
  eleventyConfig.on("eleventy.before", async () => {
    views = null;
    await loadViews();
  });
  eleventyConfig.addGlobalData("dataset", async () => (await loadViews()).dataset);
  eleventyConfig.addGlobalData("views", async () => (await loadViews()).views);

  // Static assets are copied as they are; CSS is hand-written and needs no build step (05-§7.3).
  eleventyConfig.addPassthroughCopy({ "source/assets/css": "assets/css", "source/assets/img": "assets/img" });

  // `npm start` rebuilds when anything under source/ changes (02-§9.4): the code esbuild
  // bundles, the dataset, the species content and the map background.
  eleventyConfig.addWatchTarget("source/ts/");
  eleventyConfig.addWatchTarget(`${dataDir}/`);
  eleventyConfig.addWatchTarget(`source/${SPECIES_CONTENT_DIR}/`);
  eleventyConfig.addWatchTarget(`source/${MAP_DIR}/`);
  // Eleventy's watch mode would otherwise parse every file this config imports with a
  // plain JavaScript parser, which cannot read the domain layer's TypeScript (03-§8.7).
  // The watch target above covers the same files, so nothing is lost.
  eleventyConfig.setWatchJavaScriptDependencies(false);

  // Global data available in every template (03-§10).
  eleventyConfig.addGlobalData("site", {
    name: "Djuren på Stättared",
    farm,
    mainSite: "https://www.4h.se/stattared/",
    repo: "https://github.com/stattared4h/stattared4h",
    isQa: dataDir.endsWith("data-qa"),
  });
  eleventyConfig.addGlobalData("build", {
    version: readBuildVersion(),
    dataDir,
  });

  // Images: srcset sizes into <output>/images/ and the `picture` shortcode (02-§8.5, 03-§6).
  eleventyConfig.addPlugin(imagesPlugin, { dataDir, outDir: "public", pathPrefix });

  // Manifest and service worker (02-§7, 03-§5): the colours from tokens.css, every
  // static asset for the precache, and the worker bundled to a string that
  // source/pages/sw.njk writes after the build's constants. Functions, so Eleventy
  // evaluates them per build.
  eleventyConfig.addGlobalData("theme", () => readThemeColours(path.join(ROOT, "source/assets/css/tokens.css")));
  eleventyConfig.addGlobalData("assets", () => listStaticAssets(path.join(ROOT, "source/assets")));
  eleventyConfig.addGlobalData("swCode", () => bundleServiceWorker(path.join(ROOT, "source/ts/sw.ts")));

  // Content pages in Markdown (CL-§2.2, 02-§10.27): source/content/*.md as `texts`,
  // rendered by the page that owns the address with the `markdown` filter.
  eleventyConfig.addGlobalData("texts", () => readContentFiles(path.join(ROOT, "source/content")));
  // Markdown from YAML and content files (02-§5.14, 02-§5.22): `html: false` in
  // source/ts/build/markdown.ts escapes any tag, which the validator already refuses (04-§10.9).
  eleventyConfig.addFilter("markdown", (text) => (text ? renderMarkdown(String(text)) : ""));

  // The client code is a handful of small modules bundled into one file (03-§10.2).
  // No dependencies reach the visitor (02-§9.5).
  eleventyConfig.on("eleventy.before", async ({ directories }) => {
    await assertNoHandWrittenAbsolutePaths(directories.input);
    await esbuild.build({
      entryPoints: [path.join(directories.input, "ts/ui/main.ts")],
      outfile: path.join(directories.output, "assets/main.js"),
      bundle: true,
      minify: true,
      format: "esm",
      target: "es2022",
      logLevel: "warning",
    });
  });

  return {
    dir: { input: "source", output: "public", layouts: "layouts", includes: "layouts" },
    pathPrefix,
    templateFormats: ["njk", "md"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
