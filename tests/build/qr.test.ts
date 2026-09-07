/**
 * 02-§5.29: `npm run qr` writes one printable SVG per location with the page address.
 * The markup is tested on a hand-made matrix; the script runs against the QA data into
 * a temporary directory, the way `npm run qr` would.
 */
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, test } from "node:test";
import { promisify } from "node:util";
import { DEFAULT_SITE_URL, locationAddress, renderQrSvg } from "../../source/ts/build/qr.ts";
import { QA_DIR, ROOT } from "../domain/helpers.ts";

const run = promisify(execFile);

describe("renderQrSvg", () => {
  test("draws the dark modules, the name and the address as title, at a printable size", () => {
    const svg = renderQrSvg({
      modules: { size: 2, data: [1, 0, 0, 1] },
      name: "Gethagen <vid> ån",
      url: "https://example.com/plats/gethagen/",
      widthMm: 100,
    });
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 10 16" width="100mm" height="160mm"/);
    assert.match(svg, /<title>https:\/\/example\.com\/plats\/gethagen\/<\/title>/);
    // Modules (0,0) and (1,1) inside a quiet zone of 4.
    assert.match(svg, /<path fill="#000000" d="M4 4h1v1h-1zM5 5h1v1h-1z"\/>/);
    assert.match(svg, />Gethagen &lt;vid&gt; ån<\/text>/);
  });

  test("locationAddress joins the site address and the page path", () => {
    assert.equal(locationAddress("https://example.com/djur", "gethagen"), "https://example.com/djur/plats/gethagen/");
    assert.equal(locationAddress(DEFAULT_SITE_URL, "gamla-stallet"), "https://stattared4h.github.io/stattared4h/plats/gamla-stallet/");
  });
});

describe("npm run qr", () => {
  test("writes one file per location, inactive included, with the address from SITE_URL", async () => {
    const out = await mkdtemp(path.join(os.tmpdir(), "s4h-qr-"));
    try {
      const { stdout } = await run(process.execPath, [path.join(ROOT, "scripts", "qr.mjs"), "--out", out], {
        cwd: ROOT,
        env: { ...process.env, DATA_DIR: QA_DIR, SITE_URL: "https://example.com/djur/" },
      });
      assert.match(stdout, /Skrev 10 QR-koder/);
      const files = (await readdir(out)).sort();
      assert.equal(files.length, 10);
      assert.ok(files.includes("gethagen.svg"));
      assert.ok(files.includes("gamla-stallet.svg"), "the inactive place gets a code too");
      const gethagen = await readFile(path.join(out, "gethagen.svg"), "utf8");
      assert.match(gethagen, /<title>https:\/\/example\.com\/djur\/plats\/gethagen\/<\/title>/);
      assert.match(gethagen, />Gethagen<\/text>/);
      assert.match(gethagen, /<path fill="#000000" d="M/);
    } finally {
      await rm(out, { recursive: true, force: true });
    }
  });

  test("fails on an invalid dataset", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "s4h-qr-bad-"));
    try {
      const dataDir = path.join(dir, "data-bad");
      await mkdir(path.join(dataDir, "locations"), { recursive: true });
      await writeFile(path.join(dataDir, "locations", "hagen.yaml"), "name: Hagen\nspecies: []\n");
      await assert.rejects(
        run(process.execPath, [path.join(ROOT, "scripts", "qr.mjs"), "--out", path.join(dir, "out")], {
          cwd: ROOT,
          env: { ...process.env, DATA_DIR: dataDir },
        }),
        (error: { code?: number; stderr?: string }) => error.code === 1 && /har \d+ fel/.test(error.stderr ?? ""),
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
