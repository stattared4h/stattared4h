/**
 * Builds the site into a temporary directory for the tests in this folder.
 *
 * Eleventy runs as a child process, exactly as `npm run build` does, so the tests see
 * what a deploy sees. The environment is pinned: GITHUB_ACTIONS keeps the version
 * module from guessing a local version (02-§10.25), and each test passes the
 * variables it is about.
 */
import { execFileSync } from "node:child_process";
import { mkdtemp, readdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export const ROOT = path.resolve(import.meta.dirname, "..", "..");
const ELEVENTY = path.join(ROOT, "node_modules", "@11ty", "eleventy", "cmd.cjs");

export interface BuildOptions {
  env?: Record<string, string>;
  /** Alternative input directory, for builds that must fail. */
  input?: string;
  /** Output directory; a fresh temporary one by default. */
  output?: string;
}

/** Runs Eleventy and returns the output directory. Throws with Eleventy's stderr when the build fails. */
export async function buildSite(options: BuildOptions = {}): Promise<string> {
  const output = options.output ?? (await mkdtemp(path.join(os.tmpdir(), "stattared4h-build-")));
  const args = [ELEVENTY, `--output=${output}`, "--quiet"];
  if (options.input) args.push(`--input=${options.input}`);
  try {
    execFileSync(process.execPath, args, {
      cwd: ROOT,
      env: { ...process.env, BUILD_VERSION: "", GITHUB_ACTIONS: "true", ...options.env },
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    const stderr = (error as { stderr?: Buffer }).stderr?.toString() ?? "";
    throw new Error(`Eleventy failed:\n${stderr}`, { cause: error });
  }
  return output;
}

/** Every file under `dir`, as paths relative to it, sorted. */
export async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(dir, path.join(entry.parentPath, entry.name)))
    .sort();
}
