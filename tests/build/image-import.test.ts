/**
 * The bulk image import (02-§8.14–8.20, 03-§6.7).
 *
 * The planning is pure and tested here on strings; the CLI is exercised as a child
 * process against a temporary dataset, the way tests/build/images.test.ts does it.
 */
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, test } from "node:test";
import { promisify } from "node:util";
import sharp from "sharp";
import { isImageId } from "../../source/ts/domain/image-id.ts";
import {
  formatIdsByPost,
  parseTable,
  planImport,
  templateCsv,
  TABLE_COLUMNS,
} from "../../scripts/lib/image-import.ts";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const run = promisify(execFile);

const HEADER = TABLE_COLUMNS.join(",");

async function runScript(args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await run(process.execPath, [path.join(ROOT, "scripts", "image-import.mjs"), ...args], {
      cwd: ROOT,
    });
    return { code: 0, stdout, stderr };
  } catch (error) {
    const failure = error as { code?: number; stdout?: string; stderr?: string };
    return { code: failure.code ?? 1, stdout: failure.stdout ?? "", stderr: failure.stderr ?? "" };
  }
}

/** A flat-coloured JPEG, so every generated photo has different bytes and its own id. */
function photo(shade: number): Promise<Buffer> {
  return sharp({ create: { width: 1200, height: 900, channels: 3, background: { r: shade, g: 120, b: 90 } } })
    .jpeg()
    .toBuffer();
}

describe("parseTable", () => {
  test("plain fields", () => {
    assert.deepEqual(parseTable("a,b\n1,2\n"), [
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  test("a quoted field may contain the delimiter, quotes and newlines (02-§8.19)", () => {
    const text = `fil,alt\nIMG.jpg,"Rosa, en get med ""vit"" nos.\nHon står i hagen."\n`;
    assert.deepEqual(parseTable(text), [
      ["fil", "alt"],
      ["IMG.jpg", 'Rosa, en get med "vit" nos.\nHon står i hagen.'],
    ]);
  });

  test("semicolons are accepted, since a Swedish spreadsheet saves them (02-§8.19)", () => {
    assert.deepEqual(parseTable("fil;post;alt;fotograf\nIMG.jpg;rosa;En get, i hagen.;Anna\n"), [
      ["fil", "post", "alt", "fotograf"],
      ["IMG.jpg", "rosa", "En get, i hagen.", "Anna"],
    ]);
  });

  test("a byte order mark is ignored", () => {
    assert.deepEqual(parseTable("\uFEFFfil,post\nIMG.jpg,rosa\n")[0], ["fil", "post"]);
  });

  test("CRLF line endings and a missing final newline", () => {
    assert.deepEqual(parseTable("a,b\r\n1,2"), [
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  test("blank lines are dropped, so a trailing newline is not a row", () => {
    assert.deepEqual(parseTable("a,b\n1,2\n\n\n").length, 2);
  });
});

describe("planImport", () => {
  const valid = `${HEADER}\nIMG_0001.jpg,rosa,"Rosa, en brun get, tittar in i kameran.",Anna Karlsson\nIMG_0002.jpg,rosa,Rosa på en stubbe.,Anna Karlsson\nIMG_0003.jpg,gethagen,Gethagen en sommarmorgon.,Erik Eriksson\n`;

  test("a filled-in table plans one row per photo, in file order", () => {
    const plan = planImport(valid);
    assert.deepEqual(plan.issues, []);
    assert.deepEqual(
      plan.rows.map((row) => [row.file, row.post, row.credit]),
      [
        ["IMG_0001.jpg", "rosa", "Anna Karlsson"],
        ["IMG_0002.jpg", "rosa", "Anna Karlsson"],
        ["IMG_0003.jpg", "gethagen", "Erik Eriksson"],
      ],
    );
    assert.equal(plan.rows[0].alt, "Rosa, en brun get, tittar in i kameran.");
    assert.equal(plan.rows[0].line, 2, "the header is line 1");
  });

  test("a wrong header is refused, and the message names the columns", () => {
    const plan = planImport("file,animal,alt,credit\nIMG.jpg,rosa,En get.,Anna\n");
    assert.equal(plan.rows.length, 0);
    assert.match(plan.issues[0].message, /fil, post, alt, fotograf/);
  });

  test("an empty table with only a header is refused rather than silently doing nothing", () => {
    const plan = planImport(`${HEADER}\n`);
    assert.equal(plan.rows.length, 0);
    assert.match(plan.issues[0].message, /ingen rad/i);
  });

  test("a missing field names the line and the column (02-§8.18)", () => {
    const plan = planImport(`${HEADER}\nIMG_0001.jpg,,En get.,Anna\nIMG_0002.jpg,rosa,,Anna\nIMG_0003.jpg,rosa,En get.,\n`);
    assert.deepEqual(
      plan.issues.map((issue) => [issue.line, issue.column]),
      [
        [2, "post"],
        [3, "alt"],
        [4, "fotograf"],
      ],
    );
    for (const issue of plan.issues) assert.match(issue.message, /fylls i|saknas/);
  });

  test("post must be a valid record id (04-§3.2)", () => {
    const plan = planImport(`${HEADER}\nIMG.jpg,Lilla Gumman,En get.,Anna\n`);
    assert.equal(plan.issues.length, 1);
    assert.equal(plan.issues[0].column, "post");
    assert.match(plan.issues[0].message, /små bokstäver/);
  });

  test("a row with the wrong number of fields is reported, not guessed at", () => {
    const plan = planImport(`${HEADER}\nIMG.jpg,rosa,En get.\n`);
    assert.equal(plan.issues.length, 1);
    assert.match(plan.issues[0].message, /4 kolumner/);
  });

  test("the same file twice is refused; two rows would be one image (02-§8.20)", () => {
    const plan = planImport(`${HEADER}\nIMG.jpg,rosa,En get.,Anna\nIMG.jpg,stjarna,En annan get.,Anna\n`);
    assert.equal(plan.issues.length, 1);
    assert.equal(plan.issues[0].line, 3);
    assert.match(plan.issues[0].message, /står med två gånger/);
  });

  test("every issue is reported at once, so the table is fixed in one pass", () => {
    const plan = planImport(`${HEADER}\nIMG_0001.jpg,,En get.,Anna\nIMG_0002.jpg,Rosa,,Anna\n`);
    assert.ok(plan.issues.length >= 3, "one for the missing post, one for the id, one for the alt");
    assert.equal(plan.rows.length, 0, "nothing is planned when anything is wrong (02-§8.16)");
  });
});

describe("templateCsv", () => {
  test("a header and one row per file, with only the file filled in (02-§8.14)", () => {
    assert.equal(templateCsv(["IMG_0002.jpg", "IMG_0001.jpg"]), `${HEADER}\nIMG_0001.jpg,,,\nIMG_0002.jpg,,,\n`);
  });

  test("a file name with a comma is quoted, so the template reads back", () => {
    const text = templateCsv(["Rosa, 2021.jpg"]);
    assert.match(text, /"Rosa, 2021\.jpg",,,/);
    assert.equal(parseTable(text)[1][0], "Rosa, 2021.jpg");
  });
});

describe("formatIdsByPost", () => {
  test("grouped by post, in the form photos takes in YAML (02-§8.17)", () => {
    const text = formatIdsByPost([
      { post: "rosa", id: "img-000000000001" },
      { post: "gethagen", id: "img-000000000003" },
      { post: "rosa", id: "img-000000000002" },
    ]);
    assert.equal(text, "rosa:\n  - img-000000000001\n  - img-000000000002\n\ngethagen:\n  - img-000000000003\n");
  });
});

describe("npm run image:import", () => {
  let workDir: string;
  let photoDir: string;
  let dataDir: string;
  let imagesDir: string;
  let tablePath: string;

  before(async () => {
    workDir = await mkdtemp(path.join(tmpdir(), "s4h-import-"));
    photoDir = path.join(workDir, "foton");
    dataDir = path.join(workDir, "data-qa");
    imagesDir = path.join(workDir, "images-qa");
    tablePath = path.join(workDir, "bilder.csv");
    const { mkdir } = await import("node:fs/promises");
    await mkdir(photoDir, { recursive: true });
    for (const [index, name] of ["IMG_0001.jpg", "IMG_0002.jpg", "IMG_0003.jpg"].entries()) {
      await writeFile(path.join(photoDir, name), await photo(40 + index * 60));
    }
    await writeFile(path.join(photoDir, "anteckningar.txt"), "inte en bild");
  });

  after(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  test("--scan writes a template listing only the images (02-§8.14)", async () => {
    const result = await runScript(["--scan", photoDir, "--out", tablePath]);
    assert.equal(result.code, 0, result.stderr);
    const text = await readFile(tablePath, "utf8");
    assert.equal(text, `${HEADER}\nIMG_0001.jpg,,,\nIMG_0002.jpg,,,\nIMG_0003.jpg,,,\n`);
    assert.doesNotMatch(text, /anteckningar/, "a text file is not a photo");
    assert.match(result.stdout, /3/);
  });

  test("the import writes one image and one post per row, and prints the ids (02-§8.15, 8.17)", async () => {
    await writeFile(
      tablePath,
      `${HEADER}\nIMG_0001.jpg,rosa,"Rosa, en brun get, tittar in i kameran.",Anna Karlsson\n` +
        `IMG_0002.jpg,rosa,Rosa på en stubbe.,Anna Karlsson\n` +
        `IMG_0003.jpg,gethagen,Gethagen en sommarmorgon.,Erik Eriksson\n`,
    );
    const result = await runScript([tablePath, "--photos", photoDir, "--data-dir", dataDir]);
    assert.equal(result.code, 0, result.stderr);

    const images = (await readdir(imagesDir)).sort();
    const posts = (await readdir(path.join(dataDir, "images"))).sort();
    assert.equal(images.length, 3);
    assert.equal(posts.length, 3);
    for (const name of images) assert.ok(isImageId(name.replace(/\.webp$/, "")), name);

    const { parse } = await import("yaml");
    const first = parse(await readFile(path.join(dataDir, "images", posts[0]), "utf8"));
    assert.ok(typeof first.alt === "string" && first.alt.length > 0);
    assert.ok(typeof first.credit === "string" && first.credit.length > 0);

    // The printed ids are grouped and ready to paste into photos:.
    assert.match(result.stdout, /rosa:\n {2}- img-[0-9a-f]{12}\n {2}- img-[0-9a-f]{12}/);
    assert.match(result.stdout, /gethagen:\n {2}- img-[0-9a-f]{12}/);
  });

  test("it never touches the animals, locations or species files (02-§8.15)", async () => {
    const entries = await readdir(dataDir);
    assert.deepEqual(entries, ["images"]);
  });

  test("a rerun writes nothing, since the ids come from the content (02-§8.20)", async () => {
    const before = (await readdir(imagesDir)).length;
    const result = await runScript([tablePath, "--photos", photoDir, "--data-dir", dataDir]);
    assert.equal(result.code, 0, result.stderr);
    assert.equal((await readdir(imagesDir)).length, before);
    assert.match(result.stdout, /fanns redan/);
  });

  test("a table with an error writes nothing at all (02-§8.16)", async () => {
    const badTable = path.join(workDir, "fel.csv");
    const cleanData = path.join(workDir, "data-tom");
    await writeFile(badTable, `${HEADER}\nIMG_0001.jpg,rosa,En get.,Anna\nIMG_0002.jpg,,Ingen post.,Anna\n`);
    const result = await runScript([badTable, "--photos", photoDir, "--data-dir", cleanData]);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /rad 3/);
    assert.match(result.stderr, /post/);
    await assert.rejects(readdir(path.join(cleanData, "images")), "nothing was written");
  });

  test("a spreadsheet saved in its own format is recognised, not read as a header", async () => {
    const xlsx = path.join(workDir, "bilder.xlsx");
    // A .xlsx is a zip; the editor who never chose "save as CSV" gets this file.
    await writeFile(xlsx, Buffer.from("PK\u0003\u0004\u0014\u0000\u0000\u0000\u0008\u0000", "binary"));
    const result = await runScript([xlsx, "--photos", photoDir, "--data-dir", path.join(workDir, "data-xlsx")]);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /inte en textfil/);
    assert.match(result.stderr, /CSV/);
  });

  test("a data directory that cannot name an images directory fails in Swedish", async () => {
    const result = await runScript([tablePath, "--photos", photoDir, "--data-dir", path.join(workDir, "underlag")]);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /datakatalogen måste heta/);
    assert.doesNotMatch(result.stderr, /at .*images\.ts/, "no stack trace reaches the editor");
  });

  test("a missing photo is reported with its line before anything is written", async () => {
    const badTable = path.join(workDir, "saknas.csv");
    const cleanData = path.join(workDir, "data-tom2");
    await writeFile(badTable, `${HEADER}\nIMG_0001.jpg,rosa,En get.,Anna\nFINNS_INTE.jpg,rosa,En get till.,Anna\n`);
    const result = await runScript([badTable, "--photos", photoDir, "--data-dir", cleanData]);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /rad 3.*FINNS_INTE\.jpg/s);
    await assert.rejects(readdir(path.join(cleanData, "images")), "nothing was written");
  });
});
