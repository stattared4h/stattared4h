/**
 * Build-time image pipeline (02-§8, 03-§6).
 *
 * Runs in Node with sharp and never reaches the visitor: the browser only ever sees the
 * WebP files this module writes and the markup `renderPicture` returns.
 *
 * Two kinds of function live here on purpose:
 *   - the ones that touch the file system (`generateImageSizes`, `optimiseImage`), and
 *   - pure string functions (`renderPicture`, `renderPlaceholder`, `imagesDirFor`) that
 *     take everything they need as arguments, so they can be unit tested without images.
 */
import { copyFile, mkdir, readdir, stat, utimes } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/** Limits from ADR 0008: longest edge in pixels and file size in bytes. */
export const MAX_IMAGE_EDGE = 1600;
export const MAX_IMAGE_BYTES = 250 * 1024;

/**
 * Originals `optimiseImage` accepts. WebP is in the list because a photo can already be
 * WebP without holding the limits — it is re-encoded like any other.
 */
export const SOURCE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

/** Widths generated for `srcset` (02-§8.5). */
export const SRCSET_WIDTHS: readonly number[] = [400, 800, 1600];

/** WebP quality steps tried in order until the file fits under the size limit. */
const QUALITY_STEPS = [82, 74, 66, 58, 50, 42, 34, 26];

/** Quality for the derived `srcset` sizes. The source is already compressed once. */
const DERIVED_QUALITY = 80;

export interface ImageInfo {
  /** Intrinsic size of the source image. */
  width: number;
  height: number;
  /** Widths that exist in the output, ascending. The last one is the source width. */
  widths: number[];
}

/**
 * The images directory follows the dataset (04-§9.4): `source/data` ↔ `source/images`,
 * `source/data-qa` ↔ `source/images-qa`. Generated QA placeholders can therefore never
 * end up among the farm's real photos.
 */
export function imagesDirFor(dataDir: string): string {
  const name = path.basename(dataDir);
  const match = /^data(-[a-z0-9-]+)?$/.exec(name);
  if (!match) {
    throw new Error(
      `Cannot derive an images directory from "${dataDir}": ` +
        `the data directory must be named "data" or "data-<suffix>".`,
    );
  }
  return path.join(path.dirname(dataDir), `images${match[1] ?? ""}`);
}

/**
 * Which widths to write for a source of `originalWidth`: every configured width smaller
 * than the source, plus the source itself in its own width. A 1200 px source therefore
 * gets 400, 800 and 1200; nothing is ever enlarged.
 */
export function targetWidths(originalWidth: number, widths: readonly number[]): number[] {
  return [...widths.filter((width) => width < originalWidth), originalWidth];
}

export interface GenerateImageSizesOptions {
  /** The flat images directory (see `imagesDirFor`), one `<bild-id>.webp` per image. */
  imagesDir: string;
  /** Build output directory; files are written under `<outDir>/images/`. */
  outDir: string;
  widths?: readonly number[];
  /** Called for every file actually written. Files that are up to date are skipped. */
  onWrite?: (outPath: string) => void;
}

/**
 * Writes `<outDir>/images/<bild-id>-<width>.webp` for every source image and returns
 * `{ width, height, widths }` keyed by the image id.
 *
 * Output files carry the source file's mtime, so a file whose mtime already matches is
 * skipped. That keeps rebuilds fast and makes the step idempotent.
 */
export async function generateImageSizes(
  options: GenerateImageSizesOptions,
): Promise<Map<string, ImageInfo>> {
  const { imagesDir, outDir, widths = SRCSET_WIDTHS, onWrite } = options;
  const infos = new Map<string, ImageInfo>();
  const files = (await listWebpFiles(imagesDir)).sort();
  if (files.length === 0) return infos;

  const targetDir = path.join(outDir, "images");
  await mkdir(targetDir, { recursive: true });

  for (const file of files) {
    const sourcePath = path.join(imagesDir, file);
    const sourceStat = await stat(sourcePath);
    const metadata = await sharp(sourcePath).metadata();
    const { width, height } = metadata;
    const id = file.replace(/\.webp$/, "");
    const sizes = targetWidths(width, widths);

    for (const size of sizes) {
      const outPath = path.join(targetDir, `${id}-${size}.webp`);
      if (await isUpToDate(outPath, sourceStat.mtime)) continue;

      if (size === width) {
        await copyFile(sourcePath, outPath);
      } else {
        await sharp(sourcePath).resize({ width: size }).webp({ quality: DERIVED_QUALITY }).toFile(outPath);
      }
      await utimes(outPath, new Date(), sourceStat.mtime);
      onWrite?.(outPath);
    }

    infos.set(id, { width, height, widths: sizes });
  }

  return infos;
}

async function listWebpFiles(dir: string): Promise<string[]> {
  try {
    return (await readdir(dir)).filter((file) => file.endsWith(".webp"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function isUpToDate(outPath: string, sourceMtime: Date): Promise<boolean> {
  try {
    const outStat = await stat(outPath);
    return Math.floor(outStat.mtimeMs / 1000) === Math.floor(sourceMtime.getTime() / 1000);
  } catch {
    return false;
  }
}

export interface OptimiseImageOptions {
  maxEdge?: number;
  maxBytes?: number;
}

export interface OptimisedImage {
  data: Buffer;
  width: number;
  height: number;
  /** The WebP quality that got the file under the limit. */
  quality: number;
}

/**
 * Turns an original photo (JPEG, PNG or WebP) into a web-ready WebP (02-§8.3): rotated
 * upright, at most `maxEdge` on the longest side, under `maxBytes`, and without any
 * metadata — sharp strips EXIF, XMP and ICC unless asked to keep them, and this function
 * never asks. Quality is lowered step by step until the size limit holds.
 */
export async function optimiseImage(
  input: string | Uint8Array,
  options: OptimiseImageOptions = {},
): Promise<OptimisedImage> {
  const { maxEdge = MAX_IMAGE_EDGE, maxBytes = MAX_IMAGE_BYTES } = options;
  const pipeline = sharp(input)
    .rotate()
    .resize({ width: maxEdge, height: maxEdge, fit: "inside", withoutEnlargement: true });

  for (const quality of QUALITY_STEPS) {
    const { data, info } = await pipeline.clone().webp({ quality }).toBuffer({ resolveWithObject: true });
    if (data.byteLength <= maxBytes) {
      return { data, width: info.width, height: info.height, quality };
    }
  }
  throw new Error(`Image is still larger than ${maxBytes} bytes at the lowest quality.`);
}

export interface PictureOptions {
  /** The image id, e.g. `img-a3f2c1d8b901` (04-§9.7). */
  id: string;
  alt: string;
  info: ImageInfo;
  /** The `sizes` attribute. Defaults to the full viewport width. */
  sizes?: string;
  /** The first image on a page: loaded eagerly with `fetchpriority="high"` (03-§6.3). */
  eager?: boolean;
  /** Base path with leading and trailing slash (ADR 0005), e.g. `/` or `/stattared4h/`. */
  base: string;
}

/**
 * Markup for one responsive image (02-§8.5). Pure: everything comes from the arguments.
 * `src` points at the 800 px size when it exists, since that fits most phones.
 */
export function renderPicture(options: PictureOptions): string {
  const { id, alt, info, sizes = "100vw", eager = false, base } = options;
  assertBasePath(base);

  const url = (width: number): string => `${base}images/${id}-${width}.webp`;
  const srcWidth = pickSrcWidth(info.widths);
  const srcset = info.widths.map((width) => `${url(width)} ${width}w`).join(", ");

  const attributes = [
    `src="${escapeAttribute(url(srcWidth))}"`,
    `srcset="${escapeAttribute(srcset)}"`,
    `sizes="${escapeAttribute(sizes)}"`,
    `width="${info.width}"`,
    `height="${info.height}"`,
    `alt="${escapeAttribute(alt)}"`,
    eager ? `fetchpriority="high"` : `loading="lazy"`,
    `decoding="async"`,
  ];
  return `<img ${attributes.join(" ")}>`;
}

/** 800 when available; otherwise the largest width below it, or the smallest there is. */
function pickSrcWidth(widths: number[]): number {
  const preferred = 800;
  if (widths.includes(preferred)) return preferred;
  const below = widths.filter((width) => width < preferred);
  return below.length > 0 ? Math.max(...below) : Math.min(...widths);
}

function assertBasePath(base: string): void {
  if (!base.startsWith("/") || !base.endsWith("/")) {
    throw new Error(`Base path must start and end with "/", got "${base}" (ADR 0005).`);
  }
}

export interface PlaceholderOptions {
  /** What the image would have shown — normally the species name (05-§6.20). */
  label: string;
}

/**
 * Markup shown instead of a missing photo (02-§8.6, 05-§6.20): a pale green plate with
 * the label in deep green, styled by `.image-placeholder` in components.css.
 */
export function renderPlaceholder(options: PlaceholderOptions): string {
  return (
    `<div class="image-placeholder">` +
    `<span class="image-placeholder__label">${escapeText(options.label)}</span>` +
    `</div>`
  );
}

export function escapeText(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function escapeAttribute(value: string): string {
  return escapeText(value).replaceAll('"', "&quot;");
}
