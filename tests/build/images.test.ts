/**
 * The image pipeline (02-§8.3–8.6, 03-§6.1–6.3, 05-§6.17, 05-§6.20).
 *
 * The pure functions are tested on their strings. The file-system parts run against
 * images generated with sharp in a temporary directory, never against source/images/.
 */
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { promisify } from "node:util";
import sharp from "sharp";
import {
  MAX_IMAGE_BYTES,
  MAX_IMAGE_EDGE,
  generateImageSizes,
  imagesDirFor,
  renderPicture,
  renderPlaceholder,
  targetWidths,
  type ImageInfo,
} from "../../source/ts/build/images.ts";
import { imagesPlugin, normalisePathPrefix, type EleventyConfigLike } from "../../source/ts/build/images-plugin.ts";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const run = promisify(execFile);

/** Runs a script in scripts/ as a child process, the way `npm run` would. */
async function runScript(script: string, args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await run(process.execPath, [path.join(ROOT, "scripts", script), ...args], {
      cwd: ROOT,
    });
    return { code: 0, stdout, stderr };
  } catch (error) {
    const failure = error as { code?: number; stdout?: string; stderr?: string };
    return { code: failure.code ?? 1, stdout: failure.stdout ?? "", stderr: failure.stderr ?? "" };
  }
}

/** A smooth synthetic photo: gradients compress well enough to exercise the quality steps. */
function syntheticPhoto(width: number, height: number): Uint8Array {
  return new TextEncoder().encode(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0" stop-color="#15623e"/><stop offset="1" stop-color="#f2b134"/></linearGradient></defs>` +
      `<rect width="100%" height="100%" fill="url(#g)"/>` +
      `<circle cx="40%" cy="50%" r="30%" fill="#e7fdf3"/>` +
      `<circle cx="70%" cy="30%" r="12%" fill="#00863f"/>` +
      `</svg>`,
  );
}

describe("imagesDirFor", () => {
  test("follows the dataset: data ↔ images, data-qa ↔ images-qa", () => {
    assert.equal(imagesDirFor("source/data"), path.join("source", "images"));
    assert.equal(imagesDirFor("source/data-qa"), path.join("source", "images-qa"));
    assert.equal(imagesDirFor("source/data-qa/"), path.join("source", "images-qa"));
    assert.equal(imagesDirFor("/abs/source/data"), "/abs/source/images");
  });

  test("refuses a directory that is not a dataset", () => {
    assert.throws(() => imagesDirFor("source/content"), /must be named "data"/);
  });
});

describe("targetWidths", () => {
  test("every configured width below the source, plus the source itself", () => {
    assert.deepEqual(targetWidths(1600, [400, 800, 1600]), [400, 800, 1600]);
    assert.deepEqual(targetWidths(1200, [400, 800, 1600]), [400, 800, 1200]);
    assert.deepEqual(targetWidths(300, [400, 800, 1600]), [300]);
  });
});

describe("renderPicture", () => {
  const info: ImageInfo = { width: 1600, height: 1200, widths: [400, 800, 1600] };
  const base = { kind: "animals", file: "rosa-1.webp", alt: "Rosa i hagen.", info, base: "/" };

  test("srcset, sizes, width, height, lazy loading and async decoding", () => {
    const html = renderPicture({ ...base, sizes: "(min-width: 960px) 33vw, 100vw" });
    assert.equal(
      html,
      `<img src="/images/animals/rosa-1-800.webp" ` +
        `srcset="/images/animals/rosa-1-400.webp 400w, /images/animals/rosa-1-800.webp 800w, /images/animals/rosa-1-1600.webp 1600w" ` +
        `sizes="(min-width: 960px) 33vw, 100vw" width="1600" height="1200" alt="Rosa i hagen." ` +
        `loading="lazy" decoding="async">`,
    );
  });

  test("sizes defaults to the full viewport", () => {
    assert.match(renderPicture(base), /sizes="100vw"/);
  });

  test("the first image is eager with fetchpriority instead of lazy", () => {
    const html = renderPicture({ ...base, eager: true });
    assert.match(html, /fetchpriority="high"/);
    assert.doesNotMatch(html, /loading=/);
    assert.match(html, /decoding="async"/);
  });

  test("the base path prefixes every URL", () => {
    const html = renderPicture({ ...base, base: "/stattared4h/" });
    assert.match(html, /src="\/stattared4h\/images\/animals\/rosa-1-800\.webp"/);
    assert.equal((html.match(/\/stattared4h\/images\//g) ?? []).length, 4);
  });

  test("a base path without leading and trailing slash is an error (ADR 0005)", () => {
    assert.throws(() => renderPicture({ ...base, base: "stattared4h/" }), /ADR 0005/);
    assert.throws(() => renderPicture({ ...base, base: "/stattared4h" }), /ADR 0005/);
  });

  test("attributes are escaped", () => {
    const html = renderPicture({ ...base, alt: `Rosa "Rosie" <3 & co`, file: `a&b.webp` });
    assert.match(html, /alt="Rosa &quot;Rosie&quot; &lt;3 &amp; co"/);
    assert.match(html, /src="\/images\/animals\/a&amp;b-800\.webp"/);
    assert.doesNotMatch(html, /<3/);
  });

  test("src falls back to the largest width below 800 when 800 does not exist", () => {
    const small: ImageInfo = { width: 700, height: 500, widths: [400, 700] };
    const html = renderPicture({ ...base, info: small });
    assert.match(html, /src="\/images\/animals\/rosa-1-700\.webp"/);
    assert.match(html, /srcset="\/images\/animals\/rosa-1-400\.webp 400w, \/images\/animals\/rosa-1-700\.webp 700w"/);
    assert.match(html, /width="700" height="500"/);
  });
});

describe("renderPlaceholder", () => {
  test("a plate with the label, styled by .image-placeholder (05-§6.20)", () => {
    assert.equal(
      renderPlaceholder({ label: "Get" }),
      `<div class="image-placeholder"><span class="image-placeholder__label">Get</span></div>`,
    );
  });

  test("the label is escaped", () => {
    assert.match(renderPlaceholder({ label: "<b>Får & Getter</b>" }), /&lt;b&gt;Får &amp; Getter&lt;\/b&gt;/);
  });
});

describe("imagesPlugin", () => {
  test("normalisePathPrefix always yields leading and trailing slash", () => {
    assert.equal(normalisePathPrefix(undefined), "/");
    assert.equal(normalisePathPrefix(""), "/");
    assert.equal(normalisePathPrefix("stattared4h"), "/stattared4h/");
    assert.equal(normalisePathPrefix("/stattared4h/"), "/stattared4h/");
  });

  test("registers the picture and placeholder shortcodes and the imageInfo filter", () => {
    const shortcodes = new Map<string, (...args: never[]) => string>();
    const filters = new Map<string, (...args: never[]) => unknown>();
    const events: string[] = [];
    const config: EleventyConfigLike = {
      on: (event) => events.push(event),
      addShortcode: (name, fn) => shortcodes.set(name, fn),
      addFilter: (name, fn) => filters.set(name, fn),
    };
    imagesPlugin(config, { dataDir: "source/data-qa", outDir: "public", pathPrefix: "/" });

    assert.deepEqual(events, ["eleventy.before"]);
    assert.deepEqual([...shortcodes.keys()].sort(), ["picture", "placeholder"]);
    assert.deepEqual([...filters.keys()], ["imageInfo"]);

    // Before the build has generated anything, a photo renders as a placeholder.
    const picture = shortcodes.get("picture") as (...args: unknown[]) => string;
    const warnings: string[] = [];
    const originalWarn = console.warn;
    console.warn = (message: string) => warnings.push(message);
    try {
      const html = picture({ file: "rosa-1.webp", alt: "Rosa" }, "animals", undefined, false, "Get");
      assert.equal(html, renderPlaceholder({ label: "Get" }));
      assert.equal(warnings.length, 1);
      assert.match(warnings[0], /animals\/rosa-1\.webp/);
    } finally {
      console.warn = originalWarn;
    }
    const placeholder = shortcodes.get("placeholder") as (label?: string) => string;
    assert.equal(placeholder("Häst"), renderPlaceholder({ label: "Häst" }));
  });
});

describe("generateImageSizes", () => {
  let workDir: string;
  let imagesDir: string;
  let outDir: string;

  before(async () => {
    workDir = await mkdtemp(path.join(tmpdir(), "s4h-images-"));
    imagesDir = path.join(workDir, "images-qa");
    outDir = path.join(workDir, "public");
    await sharp(syntheticPhoto(1600, 1200)).webp({ quality: 80 }).toFile(await ensureDir(imagesDir, "animals", "rosa-1.webp"));
    await sharp(syntheticPhoto(1000, 750)).webp({ quality: 80 }).toFile(await ensureDir(imagesDir, "species", "get.webp"));
    await sharp(syntheticPhoto(300, 400)).webp({ quality: 80 }).toFile(await ensureDir(imagesDir, "places", "gethagen.webp"));
  });

  after(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  test("writes every width up to the source width and reports sizes (03-§6.1)", async () => {
    const written: string[] = [];
    const infos = await generateImageSizes({ imagesDir, outDir, widths: [400, 800, 1600], onWrite: (p) => written.push(p) });

    assert.deepEqual(infos.get("animals/rosa-1.webp"), { width: 1600, height: 1200, widths: [400, 800, 1600] });
    assert.deepEqual(infos.get("species/get.webp"), { width: 1000, height: 750, widths: [400, 800, 1000] });
    assert.deepEqual(infos.get("places/gethagen.webp"), { width: 300, height: 400, widths: [300] });
    assert.equal(written.length, 7);

    assert.deepEqual((await readdir(path.join(outDir, "images", "animals"))).sort(), [
      "rosa-1-1600.webp",
      "rosa-1-400.webp",
      "rosa-1-800.webp",
    ]);
    const derived = await sharp(path.join(outDir, "images", "species", "get-400.webp")).metadata();
    assert.equal(derived.width, 400);
    assert.equal(derived.height, 300);
    assert.equal(derived.format, "webp");
    assert.equal(derived.exif, undefined);
    assert.equal(derived.xmp, undefined);
    assert.equal(derived.icc, undefined);
  });

  test("a second run writes nothing, since the outputs are up to date", async () => {
    const written: string[] = [];
    const infos = await generateImageSizes({ imagesDir, outDir, widths: [400, 800, 1600], onWrite: (p) => written.push(p) });
    assert.equal(written.length, 0);
    assert.equal(infos.size, 3);
  });

  test("a missing kind directory is not an error", async () => {
    const emptyDir = path.join(workDir, "images-empty");
    const infos = await generateImageSizes({ imagesDir: emptyDir, outDir });
    assert.equal(infos.size, 0);
  });
});

describe("npm run image", () => {
  let workDir: string;
  let originalPath: string;
  let imagesDir: string;

  before(async () => {
    workDir = await mkdtemp(path.join(tmpdir(), "s4h-image-cli-"));
    imagesDir = path.join(workDir, "images");
    originalPath = path.join(workDir, "Kalle Original.png");
    // A 3000×2000 PNG that carries EXIF and an ICC profile, like a phone photo would.
    await sharp(syntheticPhoto(3000, 2000))
      .withExif({ IFD0: { Copyright: "Testfoto", Artist: "QA" } })
      .withIccProfile("srgb")
      .png()
      .toFile(originalPath);
    const original = await sharp(originalPath).metadata();
    assert.ok(original.exif, "the test photo should carry EXIF before conversion");
    assert.ok(original.icc, "the test photo should carry an ICC profile before conversion");
  });

  after(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  test("scales to 1600 px, stays under 250 KB and strips metadata (02-§8.3)", async () => {
    const result = await runScript("image.mjs", [originalPath, "--to", "animals", "--name", "kalle-1", "--images-dir", imagesDir]);
    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /Skrev .*kalle-1\.webp/);

    const outputPath = path.join(imagesDir, "animals", "kalle-1.webp");
    const metadata = await sharp(outputPath).metadata();
    assert.equal(metadata.format, "webp");
    assert.equal(metadata.width, MAX_IMAGE_EDGE);
    assert.equal(metadata.height, 1067);
    assert.equal(metadata.exif, undefined);
    assert.equal(metadata.xmp, undefined);
    assert.equal(metadata.icc, undefined);
    assert.ok((await stat(outputPath)).size <= MAX_IMAGE_BYTES);
  });

  test("the file name defaults to a slug of the original's name", async () => {
    const result = await runScript("image.mjs", [originalPath, "--to", "content", "--images-dir", imagesDir]);
    assert.equal(result.code, 0, result.stderr);
    await stat(path.join(imagesDir, "content", "kalle-original.webp"));
  });

  test("refuses to overwrite without --force", async () => {
    const refused = await runScript("image.mjs", [originalPath, "--name", "kalle-1", "--images-dir", imagesDir]);
    assert.equal(refused.code, 1);
    assert.match(refused.stderr, /finns redan.*--force/);

    const forced = await runScript("image.mjs", [originalPath, "--name", "kalle-1", "--images-dir", imagesDir, "--force"]);
    assert.equal(forced.code, 0, forced.stderr);
  });

  test("rejects an unknown kind and a missing file", async () => {
    const badKind = await runScript("image.mjs", [originalPath, "--to", "kor", "--images-dir", imagesDir]);
    assert.equal(badKind.code, 1);
    assert.match(badKind.stderr, /Okänd katalog "kor"/);

    const missing = await runScript("image.mjs", [path.join(workDir, "finns-inte.jpg"), "--images-dir", imagesDir]);
    assert.equal(missing.code, 1);
    assert.match(missing.stderr, /Hittar inte filen/);
  });
});

describe("npm run qa:images", () => {
  let workDir: string;

  before(async () => {
    workDir = await mkdtemp(path.join(tmpdir(), "s4h-qa-images-"));
  });

  after(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  test("creates a 1200×900 placeholder for every image the QA data refers to (02-§8.4)", async () => {
    const imagesDir = path.join(workDir, "images-qa");
    const dataDir = path.join(ROOT, "source", "data-qa");
    const result = await runScript("qa-images.mjs", ["--data-dir", dataDir, "--images-dir", imagesDir]);
    assert.equal(result.code, 0, result.stderr);

    const referenced = await referencedPhotos(dataDir);
    assert.ok(referenced.length >= 10, "the QA data should refer to photos");
    for (const file of referenced) {
      const metadata = await sharp(path.join(imagesDir, "animals", file)).metadata();
      assert.equal(metadata.width, 1200, file);
      assert.equal(metadata.height, 900, file);
      assert.equal(metadata.format, "webp", file);
    }
    for (const kind of ["animals", "species", "places"]) {
      assert.ok((await stat(path.join(imagesDir, kind))).isDirectory());
    }
    assert.match(result.stdout, new RegExp(`Skapade ${referenced.length} platshållare`));
  });

  test("is idempotent: a rerun creates nothing", async () => {
    const imagesDir = path.join(workDir, "images-qa");
    const result = await runScript("qa-images.mjs", ["--images-dir", imagesDir]);
    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /Skapade 0 platshållare/);
  });

  test("refuses to write into a directory named images", async () => {
    const result = await runScript("qa-images.mjs", ["--images-dir", path.join(workDir, "images")]);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /Vägrar/);
  });
});

async function ensureDir(root: string, kind: string, file: string): Promise<string> {
  const { mkdir } = await import("node:fs/promises");
  await mkdir(path.join(root, kind), { recursive: true });
  return path.join(root, kind, file);
}

/** The `photos[].file` values in the QA animals, read with a regex so the test does not depend on the domain layer. */
async function referencedPhotos(dataDir: string): Promise<string[]> {
  const { readFile } = await import("node:fs/promises");
  const animalsDir = path.join(dataDir, "animals");
  const files: string[] = [];
  for (const entry of await readdir(animalsDir)) {
    const yaml = await readFile(path.join(animalsDir, entry), "utf8");
    for (const match of yaml.matchAll(/^\s*- file:\s*(\S+\.webp)/gm)) files.push(match[1]);
  }
  return files;
}
