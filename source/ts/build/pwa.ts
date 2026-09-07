/**
 * Build-time helpers for the manifest and the service worker (02-§7, 03-§5).
 *
 * Three things the templates cannot find out on their own:
 *
 *   - `readThemeColours`  the manifest's `theme_color` and `background_color` are the
 *                         tokens --color-green and --color-page (02-§7.1). They are read
 *                         from tokens.css so the manifest can never drift from the CSS.
 *   - `bundleServiceWorker`  source/ts/sw.ts bundled to a string with esbuild. The
 *                         template source/pages/sw.njk writes the build's constants
 *                         (cache name, base path, precache list) first and this code
 *                         after them, so the worker is one plain script.
 *   - `listStaticAssets`  every file under source/assets/, as site paths without the
 *                         base path, for the precache list (02-§7.4). Listing the
 *                         directory means a new icon or stylesheet is never forgotten.
 *
 * eleventy.config.js registers the results as global data (`theme`, `swCode`, `assets`).
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import * as esbuild from "esbuild";

export interface ThemeColours {
  /** --color-green: the browser chrome around an installed app. */
  themeColor: string;
  /** --color-page: the splash screen behind the icon while the app starts. */
  backgroundColor: string;
}

function token(css: string, name: string): string {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`));
  if (!match) throw new Error(`tokens.css saknar --${name} som sexsiffrig hex (05-§7.4)`);
  return match[1].toLowerCase();
}

export async function readThemeColours(tokensFile: string): Promise<ThemeColours> {
  const css = await readFile(tokensFile, "utf8");
  return { themeColor: token(css, "color-green"), backgroundColor: token(css, "color-page") };
}

/** The worker's code as one script without imports. Free variables PRECACHE, CACHE_NAME and BASE are supplied by sw.njk. */
export async function bundleServiceWorker(entry: string): Promise<string> {
  const result = await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    minify: true,
    write: false,
    format: "iife",
    target: "es2022",
    logLevel: "warning",
  });
  return result.outputFiles.map((file) => file.text).join("\n");
}

/** `assets/css/tokens.css`, `assets/img/favicon.svg`, … for every file under `assetsDir`, sorted. */
export async function listStaticAssets(assetsDir: string): Promise<string[]> {
  const entries = await readdir(assetsDir, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(path.dirname(assetsDir), path.join(entry.parentPath, entry.name)).split(path.sep).join("/"))
    .sort();
}
