/**
 * QR code signs for the locations (02-§5.29).
 *
 * `npm run qr` (scripts/qr.mjs) computes the code with the `qrcode` package and hands
 * the module matrix to `renderQrSvg`, which draws a printable sign: the code, the
 * location's name under it, and the address as the SVG's `<title>` so the file says
 * where it leads. Pure: the matrix comes in as an argument, so the tests can check the
 * markup without the package.
 */
import { escapeText } from "./images.ts";

/** The default site address, used when SITE_URL is not set. */
export const DEFAULT_SITE_URL = "https://stattared4h.github.io/stattared4h/";

/** Error correction level for the signs: M survives a scratched or faded print. */
export const QR_ERROR_CORRECTION = "M";

/** A square matrix of modules, row by row: 1 for dark, 0 for light. As `qrcode` returns it. */
export interface QrModules {
  size: number;
  data: ArrayLike<number>;
}

export interface QrSignOptions {
  modules: QrModules;
  /** The location's name, printed under the code. */
  name: string;
  /** The full address the code encodes. */
  url: string;
  /** Sign width in millimetres; the code fills it minus the quiet zone. */
  widthMm?: number;
}

/** Quiet zone around the code, in modules, as the QR standard asks for. */
const QUIET_ZONE = 4;
/** Height reserved under the code for the name, in modules. */
const LABEL_HEIGHT = 6;

/** The full address of a location page: `<site>plats/<id>/`. */
export function locationAddress(siteUrl: string, id: string): string {
  const base = siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`;
  return `${base}plats/${id}/`;
}

/**
 * One `<path>` for all dark modules — a printable SVG scales without losing its edges.
 * Colours are literal black on white on purpose: a sign is printed, not styled.
 */
export function renderQrSvg(options: QrSignOptions): string {
  const { modules, name, url, widthMm = 100 } = options;
  const total = modules.size + 2 * QUIET_ZONE;
  const height = total + LABEL_HEIGHT;
  const heightMm = (widthMm * height) / total;

  const squares: string[] = [];
  for (let row = 0; row < modules.size; row += 1) {
    for (let col = 0; col < modules.size; col += 1) {
      if (modules.data[row * modules.size + col]) {
        squares.push(`M${col + QUIET_ZONE} ${row + QUIET_ZONE}h1v1h-1z`);
      }
    }
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${height}" ` +
    `width="${widthMm}mm" height="${heightMm}mm" shape-rendering="crispEdges">` +
    `<title>${escapeText(url)}</title>` +
    `<rect width="${total}" height="${height}" fill="#ffffff"/>` +
    `<path fill="#000000" d="${squares.join("")}"/>` +
    `<text x="${total / 2}" y="${total + LABEL_HEIGHT / 2}" font-family="sans-serif" font-size="3" ` +
    `font-weight="bold" fill="#000000" text-anchor="middle" dominant-baseline="middle">${escapeText(name)}</text>` +
    `</svg>`
  );
}
