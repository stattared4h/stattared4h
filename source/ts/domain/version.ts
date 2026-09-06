/**
 * The version string shown in the footer (02-§10.22, 02-§10.25, 03-§10.5).
 *
 * The deploy workflows compute the real version and hand it over as BUILD_VERSION. This
 * module only decides what to show when they have not: a local build gets the latest
 * tag (or X.Y.0 from VERSION) plus the local time, so that two people looking at two
 * screens can tell their builds apart; a CI build without a version shows none at all,
 * because a wrong version is worse than no version.
 *
 * `resolveBuildVersion` is pure so that every case is unit-tested in Node;
 * `readBuildVersion` is the thin shell around it that reads the environment.
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

export interface BuildVersionInput {
  /** BUILD_VERSION from the deploy workflow. Wins whenever it is set. */
  buildVersion: string | null | undefined;
  /** True in GitHub Actions. There the version is never guessed. */
  isCi: boolean;
  /** The latest git tag, expected as `vX.Y.P`. Null when the repository has none. */
  latestTag: string | null | undefined;
  /** The contents of the VERSION file: `X.Y` (02-§10.23). */
  versionFile: string;
  /** The build time; formatted in Europe/Stockholm. */
  now: Date;
}

const RELEASE_TAG = /^v(\d+\.\d+\.\d+)$/;
const MAJOR_MINOR = /^(\d+\.\d+)$/;

/** The version to print, or null when a CI build has none (02-§10.22). */
export function resolveBuildVersion(input: BuildVersionInput): string | null {
  const explicit = input.buildVersion?.trim();
  if (explicit) return explicit;
  if (input.isCi) return null;
  return `${baseVersion(input.latestTag, input.versionFile)} – lokal ${formatStockholm(input.now)}`;
}

/** `X.Y.P` from the latest release tag, otherwise `X.Y.0` from the VERSION file. */
function baseVersion(latestTag: string | null | undefined, versionFile: string): string {
  const tag = latestTag?.trim().match(RELEASE_TAG);
  if (tag) return tag[1];
  const file = versionFile.trim().match(MAJOR_MINOR);
  if (!file) throw new Error(`VERSION must contain X.Y, found "${versionFile.trim()}" (02-§10.23)`);
  return `${file[1]}.0`;
}

/** `YYYY-MM-DD HH:mm` in Europe/Stockholm, independent of the machine's locale and time zone. */
export function formatStockholm(date: Date): string {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes): string => parts.find((p) => p.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")} ${part("hour")}:${part("minute")}`;
}

/** The latest tag reachable from HEAD that looks like a release, or null when git or the tag is missing. */
function latestReleaseTag(root: string): string | null {
  try {
    return execFileSync("git", ["describe", "--tags", "--match", "v*", "--abbrev=0"], {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

/** Reads the environment and repository and resolves the version. Called from eleventy.config.js. */
export function readBuildVersion(root: string = path.resolve(import.meta.dirname, "..", "..", "..")): string | null {
  const buildVersion = process.env.BUILD_VERSION;
  const isCi = process.env.GITHUB_ACTIONS === "true";
  const needsLocalVersion = !buildVersion?.trim() && !isCi;
  return resolveBuildVersion({
    buildVersion,
    isCi,
    latestTag: needsLocalVersion ? latestReleaseTag(root) : null,
    versionFile: readFileSync(path.join(root, "VERSION"), "utf8"),
    now: new Date(),
  });
}
