/**
 * The image pipeline (02-§8.3–8.6, 03-§6.1–6.3, 05-§6.17, 05-§6.20).
 *
 * The pure functions are tested on their strings. The file-system parts run against
 * images generated with sharp in a temporary directory, never against source/images/.
 */
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
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
import { imageIdFor, isImageId } from "../../source/ts/domain/image-id.ts";
import { imagesPlugin, normalisePathPrefix, type EleventyConfigLike } from "../../source/ts/build/images-plugin.ts";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const run = promisify(execFile);

// Fixture ids. They only have to look like image ids; generateImageSizes never hashes.
const WIDE = "img-000000000001";
const MEDIUM = "img-000000000002";
const SMALL = "img-000000000003";

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
  const id = "img-a3f2c1d8b901";
  const base = { id, alt: "Rosa i hagen.", info, base: "/" };

  test("srcset, sizes, width, height, lazy loading and async decoding", () => {
    const html = renderPicture({ ...base, sizes: "(min-width: 960px) 33vw, 100vw" });
    assert.equal(
      html,
      `<img src="/images/${id}-800.webp" ` +
        `srcset="/images/${id}-400.webp 400w, /images/${id}-800.webp 800w, /images/${id}-1600.webp 1600w" ` +
        `sizes="(min-width: 960px) 33vw, 100vw" width="1600" height="1200" alt="Rosa i hagen." ` +
        `loading="lazy" decoding="async">`,
    );
  });

  test("the path has no sub-directory: the images directory is flat (04-§9.1)", () => {
    assert.doesNotMatch(renderPicture(base), /images\/(animals|species|places|content)\//);
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
    assert.match(html, new RegExp(`src="/stattared4h/images/${id}-800\\.webp"`));
    assert.equal((html.match(/\/stattared4h\/images\//g) ?? []).length, 4);
  });

  test("a base path without leading and trailing slash is an error (ADR 0005)", () => {
    assert.throws(() => renderPicture({ ...base, base: "stattared4h/" }), /ADR 0005/);
    assert.throws(() => renderPicture({ ...base, base: "/stattared4h" }), /ADR 0005/);
  });

  test("the alt text is escaped", () => {
    const html = renderPicture({ ...base, alt: `Rosa "Rosie" <3 & co` });
    assert.match(html, /alt="Rosa &quot;Rosie&quot; &lt;3 &amp; co"/);
    assert.doesNotMatch(html, /<3/);
  });

  test("src falls back to the largest width below 800 when 800 does not exist", () => {
    const small: ImageInfo = { width: 700, height: 500, widths: [400, 700] };
    const html = renderPicture({ ...base, info: small });
    assert.match(html, new RegExp(`src="/images/${id}-700\\.webp"`));
    assert.match(html, new RegExp(`srcset="/images/${id}-400\\.webp 400w, /images/${id}-700\\.webp 700w"`));
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
      const html = picture({ id: "img-a3f2c1d8b901", alt: "Rosa" }, undefined, false, "Get");
      assert.equal(html, renderPlaceholder({ label: "Get" }));
      assert.equal(warnings.length, 1);
      assert.match(warnings[0], /img-a3f2c1d8b901\.webp/);
      assert.equal(picture(undefined, undefined, false, "Get"), renderPlaceholder({ label: "Get" }));
      assert.equal(warnings.length, 1, "a record without a photo is not a warning");
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
    await sharp(syntheticPhoto(1600, 1200)).webp({ quality: 80 }).toFile(await ensureFile(imagesDir, `${WIDE}.webp`));
    await sharp(syntheticPhoto(1000, 750)).webp({ quality: 80 }).toFile(await ensureFile(imagesDir, `${MEDIUM}.webp`));
    await sharp(syntheticPhoto(300, 400)).webp({ quality: 80 }).toFile(await ensureFile(imagesDir, `${SMALL}.webp`));
  });

  after(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  test("writes every width up to the source width and reports sizes (03-§6.1)", async () => {
    const written: string[] = [];
    const infos = await generateImageSizes({ imagesDir, outDir, widths: [400, 800, 1600], onWrite: (p) => written.push(p) });

    assert.deepEqual(infos.get(WIDE), { width: 1600, height: 1200, widths: [400, 800, 1600] });
    assert.deepEqual(infos.get(MEDIUM), { width: 1000, height: 750, widths: [400, 800, 1000] });
    assert.deepEqual(infos.get(SMALL), { width: 300, height: 400, widths: [300] });
    assert.equal(written.length, 7, "3 + 3 + 1 sizes");

    assert.deepEqual(
      (await readdir(path.join(outDir, "images"))).filter((f) => f.startsWith(WIDE)).sort(),
      [`${WIDE}-1600.webp`, `${WIDE}-400.webp`, `${WIDE}-800.webp`],
    );
    const derived = await sharp(path.join(outDir, "images", `${MEDIUM}-400.webp`)).metadata();
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

  test("a missing images directory is not an error", async () => {
    const emptyDir = path.join(workDir, "images-empty");
    const infos = await generateImageSizes({ imagesDir: emptyDir, outDir });
    assert.equal(infos.size, 0);
  });

  test("a file that is not a .webp is ignored", async () => {
    const otherDir = path.join(workDir, "images-mixed");
    await ensureFile(otherDir, "README.md");
    const { writeFile } = await import("node:fs/promises");
    await writeFile(path.join(otherDir, "README.md"), "# bilder");
    const infos = await generateImageSizes({ imagesDir: otherDir, outDir });
    assert.equal(infos.size, 0);
  });
});

describe("npm run image", () => {
  let workDir: string;
  let originalPath: string;
  let dataDir: string;
  let imagesDir: string;

  before(async () => {
    workDir = await mkdtemp(path.join(tmpdir(), "s4h-image-cli-"));
    dataDir = path.join(workDir, "data-qa");
    imagesDir = path.join(workDir, "images-qa");
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

  /** Runs the CLI with the temporary dataset and returns the id it printed. */
  async function addImage(args: string[] = []): Promise<{ code: number; stdout: string; stderr: string; id: string }> {
    const result = await runScript("image.mjs", [
      originalPath,
      "--alt",
      "Kalle betar i hagen.",
      "--credit",
      "QA",
      "--data-dir",
      dataDir,
      ...args,
    ]);
    return { ...result, id: /\b(img-[0-9a-f]{12})\b/.exec(result.stdout)?.[1] ?? "" };
  }

  test("scales to 1600 px, stays under 250 KB and strips metadata (02-§8.3)", async () => {
    const { code, stderr, id } = await addImage();
    assert.equal(code, 0, stderr);
    assert.ok(isImageId(id), `printed a usable id, got ${JSON.stringify(id)}`);

    const outputPath = path.join(imagesDir, `${id}.webp`);
    const metadata = await sharp(outputPath).metadata();
    assert.equal(metadata.format, "webp");
    assert.equal(metadata.width, MAX_IMAGE_EDGE);
    assert.equal(metadata.height, 1067);
    assert.equal(metadata.exif, undefined);
    assert.equal(metadata.xmp, undefined);
    assert.equal(metadata.icc, undefined);
    assert.ok((await stat(outputPath)).size <= MAX_IMAGE_BYTES);
  });

  test("the id is the hash of the written file (02-§8.9)", async () => {
    const { id } = await addImage();
    const { readFile } = await import("node:fs/promises");
    assert.equal(imageIdFor(await readFile(path.join(imagesDir, `${id}.webp`))), id);
  });

  test("writes the image post with alt and credit beside the file (02-§8.8)", async () => {
    const { id } = await addImage();
    const { readFile } = await import("node:fs/promises");
    const { parse } = await import("yaml");
    const post = parse(await readFile(path.join(dataDir, "images", `${id}.yaml`), "utf8"));
    assert.deepEqual(post, { alt: "Kalle betar i hagen.", credit: "QA" });
  });

  test("the same photo twice gives the same id and writes nothing the second time", async () => {
    const first = await addImage();
    const second = await addImage();
    assert.equal(second.code, 0, second.stderr);
    assert.equal(second.id, first.id);
    assert.match(second.stdout, /finns redan/);
  });

  test("alt and credit are required, and a missing file is reported", async () => {
    const noAlt = await runScript("image.mjs", [originalPath, "--credit", "QA", "--data-dir", dataDir]);
    assert.equal(noAlt.code, 1);
    assert.match(noAlt.stderr, /--alt/);

    const noCredit = await runScript("image.mjs", [originalPath, "--alt", "En bild.", "--data-dir", dataDir]);
    assert.equal(noCredit.code, 1);
    assert.match(noCredit.stderr, /--credit/);

    const missing = await runScript("image.mjs", [
      path.join(workDir, "finns-inte.jpg"),
      "--alt",
      "En bild.",
      "--credit",
      "QA",
      "--data-dir",
      dataDir,
    ]);
    assert.equal(missing.code, 1);
    assert.match(missing.stderr, /Hittar inte filen/);
  });

  test("an unknown flag is refused rather than silently ignored", async () => {
    const result = await runScript("image.mjs", [originalPath, "--to", "animals", "--data-dir", dataDir]);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /Okänd flagga --to/);
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

  test("creates a 1200×900 placeholder for every image post (02-§8.4)", async () => {
    const imagesDir = path.join(workDir, "images-qa");
    const dataDir = path.join(ROOT, "source", "data-qa");
    const result = await runScript("qa-images.mjs", ["--data-dir", dataDir, "--images-dir", imagesDir]);
    assert.equal(result.code, 0, result.stderr);

    const ids = await imagePostIds(dataDir);
    assert.ok(ids.length >= 10, "the QA data should have image posts");
    for (const id of ids) {
      const metadata = await sharp(path.join(imagesDir, `${id}.webp`)).metadata();
      assert.equal(metadata.width, 1200, id);
      assert.equal(metadata.height, 900, id);
      assert.equal(metadata.format, "webp", id);
    }
    const written = (await readdir(imagesDir)).filter((f) => f.endsWith(".webp"));
    assert.equal(written.length, ids.length, "one file per image post, and nothing else");
    assert.match(result.stdout, new RegExp(`Skapade ${ids.length} platshållare`));
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

  test("imports, marks and compresses generated images under their existing ids", async () => {
    const root = path.join(workDir, "import-valid");
    const dataDir = path.join(root, "data-qa");
    const imagesDir = path.join(root, "images-qa");
    const inputDir = path.join(root, "generated");
    const id = "img-123456789abc";
    await mkdir(path.join(dataDir, "images"), { recursive: true });
    await mkdir(inputDir, { recursive: true });
    await writeFile(
      path.join(dataDir, "images", `${id}.yaml`),
      "alt: En vit testbild.\ncredit: AI-genererad med OpenAI ImageGen\n",
    );
    await sharp({
      create: { width: 1600, height: 1200, channels: 3, background: "white" },
    })
      .withExif({ IFD0: { Artist: "ska bort" } })
      .png()
      .toFile(path.join(inputDir, `${id}.png`));

    const result = await runScript("qa-images.mjs", [
      "--data-dir",
      dataDir,
      "--images-dir",
      imagesDir,
      "--import",
      inputDir,
    ]);
    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /Importerade 1 AI-bild/);

    const output = path.join(imagesDir, `${id}.webp`);
    const metadata = await sharp(output).metadata();
    assert.equal(metadata.format, "webp");
    assert.equal(metadata.width, 1200);
    assert.equal(metadata.height, 900);
    assert.equal(metadata.exif, undefined);
    assert.equal(metadata.xmp, undefined);
    assert.equal(metadata.icc, undefined);
    assert.ok((await stat(output)).size <= 50 * 1024);

    const pixel = await sharp(output)
      .extract({ left: 1165, top: 865, width: 1, height: 1 })
      .removeAlpha()
      .raw()
      .toBuffer();
    assert.ok([...pixel].every((channel) => channel < 100), "the bottom-right badge surface should be dark");
  });

  test("QA import is all-or-nothing when a generated file has an unknown id", async () => {
    const root = path.join(workDir, "import-invalid");
    const dataDir = path.join(root, "data-qa");
    const imagesDir = path.join(root, "images-qa");
    const inputDir = path.join(root, "generated");
    const known = "img-123456789abc";
    const unknown = "img-ffffffffffff";
    await mkdir(path.join(dataDir, "images"), { recursive: true });
    await mkdir(inputDir, { recursive: true });
    await writeFile(path.join(dataDir, "images", `${known}.yaml`), "alt: Test.\ncredit: AI-genererad\n");
    for (const id of [known, unknown]) {
      await sharp(syntheticPhoto(1600, 1200)).png().toFile(path.join(inputDir, `${id}.png`));
    }

    const result = await runScript("qa-images.mjs", [
      "--data-dir",
      dataDir,
      "--images-dir",
      imagesDir,
      "--import",
      inputDir,
    ]);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /okänt bild-id.*img-ffffffffffff/i);
    await assert.rejects(access(path.join(imagesDir, `${known}.webp`)));
  });

  test("QA import leaves an existing target byte-for-byte unchanged", async () => {
    const root = path.join(workDir, "import-existing");
    const dataDir = path.join(root, "data-qa");
    const imagesDir = path.join(root, "images-qa");
    const inputDir = path.join(root, "generated");
    const id = "img-123456789abc";
    await mkdir(path.join(dataDir, "images"), { recursive: true });
    await mkdir(imagesDir, { recursive: true });
    await mkdir(inputDir, { recursive: true });
    await writeFile(path.join(dataDir, "images", `${id}.yaml`), "alt: Test.\ncredit: AI-genererad\n");
    await sharp(syntheticPhoto(400, 300)).webp().toFile(path.join(imagesDir, `${id}.webp`));
    const before = await readFile(path.join(imagesDir, `${id}.webp`));
    await sharp(syntheticPhoto(1600, 1200)).png().toFile(path.join(inputDir, `${id}.png`));

    const result = await runScript("qa-images.mjs", [
      "--data-dir",
      dataDir,
      "--images-dir",
      imagesDir,
      "--import",
      inputDir,
    ]);
    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /0 AI-bilder.*1 fanns redan/);
    assert.deepEqual(await readFile(path.join(imagesDir, `${id}.webp`)), before);
  });
});

async function ensureFile(root: string, file: string): Promise<string> {
  const { mkdir } = await import("node:fs/promises");
  await mkdir(root, { recursive: true });
  return path.join(root, file);
}

/** The image post ids in a dataset, read from the file names so the test stays independent of the domain layer. */
async function imagePostIds(dataDir: string): Promise<string[]> {
  const entries = await readdir(path.join(dataDir, "images"));
  return entries.filter((name) => name.endsWith(".yaml")).map((name) => name.replace(/\.yaml$/, "")).sort();
}
