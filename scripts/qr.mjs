/**
 * `npm run qr` — writes one printable QR sign per location (02-§5.29).
 *
 *   SITE_URL=https://example.com/djur/ npm run qr [-- --out <dir>]
 *
 * Reads the dataset in DATA_DIR, validates it, and writes `qr/<id>.svg` for every
 * location, active or not: the address is permanent (04-§5.4). The address is
 * `<SITE_URL>plats/<id>/`, with the GitHub Pages address as the default. The output
 * directory is ignored by git; the signs are printed, not published.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";
import { defaultDataDir, loadValidDataset } from "../source/ts/domain/index.ts";
import { DEFAULT_SITE_URL, locationAddress, QR_ERROR_CORRECTION, renderQrSvg } from "../source/ts/build/qr.ts";

const ROOT = path.resolve(import.meta.dirname, "..");

function parseArguments(argv) {
  const options = { outDir: path.join(ROOT, "qr") };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--out") options.outDir = path.resolve(argv[++i]);
    else {
      console.error(`Okänd flagga ${arg}. Användning: npm run qr [-- --out <katalog>]`);
      process.exit(1);
    }
  }
  return options;
}

async function main() {
  const { outDir } = parseArguments(process.argv.slice(2));
  const siteUrl = process.env.SITE_URL || DEFAULT_SITE_URL;
  const dataset = await loadValidDataset(defaultDataDir());

  await mkdir(outDir, { recursive: true });
  for (const location of dataset.locations) {
    const url = locationAddress(siteUrl, location.id);
    const code = QRCode.create(url, { errorCorrectionLevel: QR_ERROR_CORRECTION });
    const svg = renderQrSvg({ modules: code.modules, name: location.name, url });
    await writeFile(path.join(outDir, `${location.id}.svg`), `${svg}\n`);
  }

  const shownDir = path.relative(process.cwd(), outDir) || ".";
  console.log(`Skrev ${dataset.locations.length} QR-koder till ${shownDir}/ för adresser under ${siteUrl}`);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
