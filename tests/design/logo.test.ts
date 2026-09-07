/**
 * 02-§10.9, 02-§10.37, 05-§2.19, 09-§1.1 and 09-§1.5: the 4H logo in the repository is the
 * federation's own artwork, unaltered, in one of the colours its graphic profile permits,
 * and its origin is recorded in the source register.
 *
 * "Unaltered" is the whole point of these tests, so they do not trust a comment saying so.
 * The artwork digest is taken over the path data itself and compared with the value the
 * register records, which means an edit to the shape fails the build (ADR 0016).
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

const ROOT = path.resolve(import.meta.dirname, "..", "..");

const COLOUR_LOGO = "source/assets/img/4h-logo.svg";
const WHITE_LOGO = "source/assets/img/4h-logo-white.svg";
const REGISTER = "docs/09-kallor/index.md";

function read(file: string): Promise<string> {
  return readFile(path.join(ROOT, file), "utf8");
}

/** The `d` attributes of an SVG, sorted and de-duplicated: the artwork, free of ordering. */
function artworkPaths(svg: string): string[] {
  return [...new Set([...svg.matchAll(/\sd="([^"]+)"/g)].map((match) => match[1]))].sort();
}

/** The digest the register records for the artwork, and the one a file actually carries. */
function artworkDigest(svg: string): string {
  return createHash("sha256").update(artworkPaths(svg).join("\n")).digest("hex");
}

/** Every `fill="…"` value in the file. */
function fills(svg: string): Set<string> {
  return new Set([...svg.matchAll(/fill="([^"]+)"/g)].map((match) => match[1].toLowerCase()));
}

/** The logo green as the palette in 05-§2.19 defines it. */
async function logoGreen(): Promise<string> {
  const doc = await read("docs/05-design/index.md");
  const match = doc.match(/^\| `05-§2\.19` \| [^|]+ \| `(#[0-9a-f]{6})` \|/m);
  assert.ok(match, "05-§2.19 saknas i paletttabellen");
  return match[1];
}

test("båda logotypfilerna bär samma oförändrade konstverk (02-§10.9)", async () => {
  const colour = await read(COLOUR_LOGO);
  const white = await read(WHITE_LOGO);

  assert.deepEqual(
    artworkPaths(colour),
    artworkPaths(white),
    "den vita varianten ska vara samma banor som den gröna, inte en egen ritning",
  );
  assert.equal(artworkPaths(colour).length, 7, "logotypen består av sju banor: klöver, 4, H och fyra H:n i bladen");

  const register = await read(REGISTER);
  const recorded = register.match(/^([0-9a-f]{64})$/m);
  assert.ok(recorded, "källregistret saknar konstverkets kontrollsumma (09-§1.5)");
  assert.equal(artworkDigest(colour), recorded[1], `${COLOUR_LOGO} avviker från kontrollsumman i ${REGISTER}`);
  assert.equal(artworkDigest(white), recorded[1], `${WHITE_LOGO} avviker från kontrollsumman i ${REGISTER}`);
});

test("logotypen är vektorbanor, inte ett textmärke", async () => {
  for (const file of [COLOUR_LOGO, WHITE_LOGO]) {
    const svg = await read(file);
    assert.ok(!svg.includes("<text"), `${file}: ett <text>-element beror på ett typsnitt och är inte logotypen`);
    assert.ok(!/font-family/.test(svg), `${file}: logotypen ska inte bero på ett typsnitt`);
  }
});

test("logotypen har bara färger profilen tillåter (02-§10.37, 05-§2.19)", async () => {
  const green = await logoGreen();

  const colour = await read(COLOUR_LOGO);
  assert.deepEqual(
    [...fills(colour)].sort(),
    [green, "#ffffff"].sort(),
    `${COLOUR_LOGO} ska bara innehålla logotypgrönt och vitt`,
  );

  const white = await read(WHITE_LOGO);
  assert.ok(!white.includes(green), `${WHITE_LOGO}: den vita varianten ska inte bära grönt`);
  assert.deepEqual(
    [...fills(white)].sort(),
    ["#000000", "#ffffff"],
    `${WHITE_LOGO} ska vara vit, med svart bara som hål i masken`,
  );
});

test("båda varianterna har samma ruta, så sidhuvudets höjd inte ändras (05-§6.37)", async () => {
  const box = /viewBox="([^"]+)"/;
  const colour = (await read(COLOUR_LOGO)).match(box);
  const white = (await read(WHITE_LOGO)).match(box);
  assert.ok(colour && white, "båda filerna ska ha en viewBox");
  assert.equal(colour[1], white[1]);
  assert.equal(colour[1], "0 0 152.651 105.775", "rutan är förbundets egen sidbox, oavkortad");
});

test("källregistret har adress, datum och kontrollsumma för varje källa (09-§1.1)", async () => {
  const register = await read(REGISTER);
  const sources = register.split(/^### /m).slice(1);
  assert.ok(sources.length >= 2, "registret ska ha minst logotypen och den grafiska profilen");

  for (const source of sources) {
    const name = source.split("\n", 1)[0];
    if (!source.includes("| Utgivare |")) continue;
    assert.match(source, /\| Adress \| `https:\/\/[^`]+` \|/, `${name}: saknar adress`);
    assert.match(source, /\| Hämtad \| \d{4}-\d{2}-\d{2} \|/, `${name}: saknar hämtdatum`);
    assert.match(source, /\| I repot \| /, `${name}: saknar besked om filen ligger i repot`);
  }
});

test("källfilen i repot stämmer med sin kontrollsumma (09-§1.3)", async () => {
  const register = await read(REGISTER);
  const row = register.match(/\| SHA-256 \| `([0-9a-f]{64})` \|\n\| I repot \| `([^`]+)`/);
  assert.ok(row, "registret ska ha minst en källa som ligger i repot");
  const [, expected, file] = row;
  const digest = createHash("sha256")
    .update(await readFile(path.join(ROOT, file)))
    .digest("hex");
  assert.equal(digest, expected, `${file} är inte längre filen registret beskriver`);
});
