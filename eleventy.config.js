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
 * Where the next steps plug in:
 *   - Data-driven pages: add a global data key next to `site` and `build` below
 *     (`eleventyConfig.addGlobalData("dataset", () => loadValidDataset(dataDir))`), or a
 *     file under source/_data/, and paginate over it from a template in source/pages/.
 *   - Images: source/ts/build/images-plugin.ts generates the srcset sizes before the
 *     build and provides the `picture` and `placeholder` shortcodes (02-§8.5).
 */

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import * as esbuild from "esbuild";
import { readBuildVersion } from "./source/ts/domain/version.ts";
import { imagesPlugin } from "./source/ts/build/images-plugin.ts";
import { bundleServiceWorker, listStaticAssets, readThemeColours } from "./source/ts/build/pwa.ts";
import { readContentFiles, renderMarkdown } from "./source/ts/build/content.ts";

const ROOT = import.meta.dirname;

/** 06-§3.1: the base path always starts and ends with a slash, so "/" + "assets" is never "//assets". */
function normaliseBasePath(raw) {
  const value = (raw ?? "/").trim() || "/";
  const withLeading = value.startsWith("/") ? value : `/${value}`;
  return withLeading.endsWith("/") ? withLeading : `${withLeading}/`;
}

/** Directories under source/ that are not Eleventy input: data, code and images have their own pipelines. */
function isIgnoredDirectory(name) {
  return name.startsWith("data") || name.startsWith("images") || name === "ts" || name === "content";
}

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

  // Data, code and images are not templates; they have their own pipelines.
  eleventyConfig.ignores.add("source/data*/**");
  eleventyConfig.ignores.add("source/ts/**");
  eleventyConfig.ignores.add("source/images*/**");
  eleventyConfig.ignores.add("source/content/**");

  // Static assets are copied as they are; CSS is hand-written and needs no build step (05-§7.3).
  eleventyConfig.addPassthroughCopy({ "source/assets/css": "assets/css", "source/assets/img": "assets/img" });

  // `npm start` rebuilds when anything under source/ changes (02-§9.4), including the code esbuild bundles.
  eleventyConfig.addWatchTarget("source/ts/");
  // Eleventy's watch mode would otherwise parse every file this config imports with a
  // plain JavaScript parser, which cannot read the domain layer's TypeScript (03-§8.7).
  // The watch target above covers the same files, so nothing is lost.
  eleventyConfig.setWatchJavaScriptDependencies(false);

  // Global data available in every template (03-§10).
  eleventyConfig.addGlobalData("site", {
    name: "Djuren på Stättared",
    farm: "Stättareds 4H-gård",
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
  eleventyConfig.addFilter("markdown", renderMarkdown);

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
