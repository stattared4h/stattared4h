/**
 * The farm map (02-§5.23–5.27, 02-§5.30, 03-§9).
 *
 * The map is generated at build time from the locations' `lat`/`lon`. The projection
 * is linear: the bounding box of the places, with a margin, is mapped onto the drawing
 * frame. At the size of a farm the curvature of the earth is negligible.
 *
 * Two layers make up the map:
 *   - an inline SVG, the drawing: a plain plate, or the hand-drawn background
 *     (`background.svg` with `background.yaml` under source/map/) when it exists
 *     (03-§9.2), and
 *   - one HTML `<a>` per place on top of it, positioned in percent of the drawing.
 *
 * The markers are HTML rather than SVG so that they keep their size — at least the
 * tap target minimum (05-§4.15) — and their readable label at every viewport width,
 * while the drawing scales with the page. Pure functions: everything comes in as
 * arguments, so the tests never touch the file system except in `loadMapBackground`.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { escapeAttribute, escapeText } from "./images.ts";

export const MAP_DESCRIPTION = "Karta över Stättared med gårdens hagar";

/** File names under the map directory (`source/map/`). */
export const BACKGROUND_SVG = "background.svg";
export const BACKGROUND_YAML = "background.yaml";

export interface MapPoint {
  lat: number;
  lon: number;
}

/** An active location with coordinates. */
export interface MapLocation extends MapPoint {
  id: string;
  name: string;
}

/**
 * The frame the points are projected into: a drawing of `width` × `height` units whose
 * edges lie at the given latitudes and longitudes.
 */
export interface MapFrame {
  width: number;
  height: number;
  north: number;
  south: number;
  west: number;
  east: number;
}

/** A hand-drawn background, already parsed (02-§5.30). */
export interface MapBackground extends MapFrame {
  /** The drawing's own markup, without the outer `<svg>` element. */
  content: string;
}

export interface MapOptions {
  /** Base path with leading and trailing slash (ADR 0005). */
  base: string;
  /** Drawing size in SVG units when there is no background. */
  width?: number;
  height?: number;
  /** Space between the outermost places and the edge, as a fraction of the drawing. */
  margin?: number;
  background?: MapBackground | null;
}

export interface RenderedMap {
  html: string;
  /** Swedish messages for places the background does not cover. */
  warnings: string[];
}

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;
const DEFAULT_MARGIN = 0.12;
/** Extent used when all places share a coordinate, so a single place still gets a frame. */
const MIN_EXTENT_DEGREES = 0.0005;

/**
 * The frame for `points` when there is no background: their bounding box, widened so
 * that a degree of longitude is as long on the drawing as it is on the ground, fitted
 * into `width` × `height` with `margin` around it, and centred. Null without points.
 */
export function mapFrame(
  points: readonly MapPoint[],
  options: { width?: number; height?: number; margin?: number } = {},
): MapFrame | null {
  if (points.length === 0) return null;
  const { width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT, margin = DEFAULT_MARGIN } = options;

  const lats = points.map((p) => p.lat);
  const lons = points.map((p) => p.lon);
  let north = Math.max(...lats);
  let south = Math.min(...lats);
  let west = Math.min(...lons);
  let east = Math.max(...lons);
  if (north - south < MIN_EXTENT_DEGREES) {
    const mid = (north + south) / 2;
    north = mid + MIN_EXTENT_DEGREES / 2;
    south = mid - MIN_EXTENT_DEGREES / 2;
  }
  if (east - west < MIN_EXTENT_DEGREES) {
    const mid = (east + west) / 2;
    east = mid + MIN_EXTENT_DEGREES / 2;
    west = mid - MIN_EXTENT_DEGREES / 2;
  }

  // Ground distances: a degree of longitude shrinks with the cosine of the latitude.
  const lonScale = Math.cos(((north + south) / 2) * (Math.PI / 180));
  const groundWidth = (east - west) * lonScale;
  const groundHeight = north - south;

  // Units of drawing per degree, so the places fill the frame inside the margin.
  const innerWidth = width * (1 - 2 * margin);
  const innerHeight = height * (1 - 2 * margin);
  const scale = Math.min(innerWidth / groundWidth, innerHeight / groundHeight);

  // Degrees covered by the whole frame, centred on the places.
  const frameLonSpan = width / scale / lonScale;
  const frameLatSpan = height / scale;
  const lonMid = (east + west) / 2;
  const latMid = (north + south) / 2;
  return {
    width,
    height,
    north: latMid + frameLatSpan / 2,
    south: latMid - frameLatSpan / 2,
    west: lonMid - frameLonSpan / 2,
    east: lonMid + frameLonSpan / 2,
  };
}

/** Where `point` lands in `frame`, in drawing units; outside the frame when off the map. */
export function projectPoint(point: MapPoint, frame: MapFrame): { x: number; y: number } {
  return {
    x: ((point.lon - frame.west) / (frame.east - frame.west)) * frame.width,
    y: ((frame.north - point.lat) / (frame.north - frame.south)) * frame.height,
  };
}

function isInside(position: { x: number; y: number }, frame: MapFrame): boolean {
  return position.x >= 0 && position.x <= frame.width && position.y >= 0 && position.y <= frame.height;
}

function percent(value: number, whole: number): string {
  return `${Math.round((value / whole) * 10000) / 100}%`;
}

function assertBasePath(base: string): void {
  if (!base.startsWith("/") || !base.endsWith("/")) {
    throw new Error(`Base path must start and end with "/", got "${base}" (ADR 0005).`);
  }
}

/** The drawing layer alone: the `<svg>` with its description, ground plate and background. */
export function renderMapSvg(frame: MapFrame, background: MapBackground | null = null): string {
  const size = `width="${frame.width}" height="${frame.height}"`;
  return (
    `<svg class="map__drawing" viewBox="0 0 ${frame.width} ${frame.height}" role="img" aria-label="${MAP_DESCRIPTION}">` +
    `<title>${MAP_DESCRIPTION}</title>` +
    `<rect class="map__ground" ${size}/>` +
    (background ? `<g class="map__background">${background.content}</g>` : "") +
    `</svg>`
  );
}

/**
 * The whole map: drawing plus one link per location, placed by `projectPoint`. With a
 * background the frame is the drawing's own; without one it is fitted to the places.
 * A place outside the background is left out with a warning, never drawn off the edge.
 */
export function renderMap(locations: readonly MapLocation[], options: MapOptions): RenderedMap {
  assertBasePath(options.base);
  const frame: MapFrame | null = options.background ?? mapFrame(locations, options);
  if (frame === null) return { html: "", warnings: [] };

  const warnings: string[] = [];
  const markers: string[] = [];
  for (const location of locations) {
    const position = projectPoint(location, frame);
    if (!isInside(position, frame)) {
      warnings.push(
        `${BACKGROUND_YAML}: platsen ${location.id} (${location.lat}, ${location.lon}) ligger utanför ritningen och visas inte på kartan. Vidga north, south, west eller east.`,
      );
      continue;
    }
    const style = `left: ${percent(position.x, frame.width)}; top: ${percent(position.y, frame.height)}`;
    markers.push(
      `<a class="map__marker" href="${escapeAttribute(`${options.base}plats/${location.id}/`)}" style="${style}" data-place="${escapeAttribute(location.id)}">` +
        `<span class="map__pin" aria-hidden="true"></span>` +
        `<span class="map__label">${escapeText(location.name)}</span>` +
        `</a>`,
    );
  }

  return {
    html: `<div class="map">${renderMapSvg(frame, options.background ?? null)}${markers.join("")}</div>`,
    warnings,
  };
}

// --- Background --------------------------------------------------------------

/** Markup the build refuses in a background: it would run code or fetch from outside the site. */
const FORBIDDEN_IN_BACKGROUND: ReadonlyArray<[RegExp, string]> = [
  [/<script[\s/>]/i, "<script>"],
  [/<style[\s/>]/i, "<style> (ett <style> inuti sidan skulle påverka hela sidan; sätt fill och stroke som attribut i stället)"],
  [/<foreignObject[\s/>]/i, "<foreignObject>"],
  [/<image[\s/>]/i, "<image> (kartan får inte hämta bilder; rita i stället)"],
  [/\b(?:xlink:)?href\s*=\s*["'](?:https?:)?\/\//i, "en länk till en annan sajt"],
  [/url\(\s*["']?(?:https?:)?\/\//i, "url() mot en annan sajt"],
];

const EDGES = ["north", "south", "west", "east"] as const;

/**
 * Parses the two background files (02-§5.30). Throws an Error with a Swedish message
 * when a file is unusable; the build then fails and says what to fix.
 */
export function parseMapBackground(svgText: string, yamlText: string): MapBackground {
  const edges = parseEdges(yamlText);
  const { content, width, height } = parseSvg(svgText);
  return { content, width, height, ...edges };
}

function parseEdges(yamlText: string): Pick<MapFrame, "north" | "south" | "west" | "east"> {
  const data: unknown = parseYaml(yamlText);
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error(`${BACKGROUND_YAML}: filen måste ha fälten north, south, west och east.`);
  }
  const record = data as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!(EDGES as readonly string[]).includes(key)) {
      throw new Error(`${BACKGROUND_YAML}: okänt fält ${key}. Bara north, south, west och east finns.`);
    }
  }
  const values = {} as Record<(typeof EDGES)[number], number>;
  for (const edge of EDGES) {
    const value = record[edge];
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(`${BACKGROUND_YAML}: fältet ${edge} saknas eller är inte ett tal. Skriv WGS84 i decimalgrader.`);
    }
    values[edge] = value;
  }
  if (values.north <= values.south) {
    throw new Error(`${BACKGROUND_YAML}: north (${values.north}) måste vara större än south (${values.south}).`);
  }
  if (values.east <= values.west) {
    throw new Error(`${BACKGROUND_YAML}: east (${values.east}) måste vara större än west (${values.west}).`);
  }
  return values;
}

function parseSvg(svgText: string): { content: string; width: number; height: number } {
  for (const [pattern, what] of FORBIDDEN_IN_BACKGROUND) {
    if (pattern.test(svgText)) {
      throw new Error(`${BACKGROUND_SVG}: innehåller ${what}, vilket inte tillåts i kartan.`);
    }
  }
  const open = /<svg\b([^>]*)>/i.exec(svgText);
  const close = svgText.lastIndexOf("</svg>");
  if (open === null || close === -1 || open.index === undefined || close < open.index) {
    throw new Error(`${BACKGROUND_SVG}: hittar inget <svg>-element som omsluter ritningen.`);
  }
  const attributes = open[1];
  const inner = svgText.slice(open.index + open[0].length, close).trim();

  const viewBox = /\bviewBox\s*=\s*["']\s*([-\d.]+)[\s,]+([-\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*["']/i.exec(attributes);
  let width: number;
  let height: number;
  let content = inner;
  if (viewBox) {
    const [minX, minY] = [Number(viewBox[1]), Number(viewBox[2])];
    [width, height] = [Number(viewBox[3]), Number(viewBox[4])];
    if (minX !== 0 || minY !== 0) content = `<g transform="translate(${-minX} ${-minY})">${inner}</g>`;
  } else {
    const w = /\bwidth\s*=\s*["']\s*([\d.]+)(?:px)?\s*["']/i.exec(attributes);
    const h = /\bheight\s*=\s*["']\s*([\d.]+)(?:px)?\s*["']/i.exec(attributes);
    if (!w || !h) {
      throw new Error(`${BACKGROUND_SVG}: <svg> saknar viewBox (och width/height i px). Ritprogrammet kan spara det.`);
    }
    [width, height] = [Number(w[1]), Number(h[1])];
  }
  if (!(width > 0) || !(height > 0)) {
    throw new Error(`${BACKGROUND_SVG}: viewBox måste ha en bredd och höjd större än noll.`);
  }
  return { content, width, height };
}

/**
 * Reads `background.svg` and `background.yaml` from `dir`. Null when neither exists;
 * an error when only one does, since half a background is a mistake.
 */
export async function loadMapBackground(dir: string): Promise<MapBackground | null> {
  const [svgText, yamlText] = await Promise.all([
    readOptional(path.join(dir, BACKGROUND_SVG)),
    readOptional(path.join(dir, BACKGROUND_YAML)),
  ]);
  if (svgText === null && yamlText === null) return null;
  if (svgText === null || yamlText === null) {
    const missing = svgText === null ? BACKGROUND_SVG : BACKGROUND_YAML;
    throw new Error(`${path.join(dir, missing)} saknas. Kartbakgrunden består av både ${BACKGROUND_SVG} och ${BACKGROUND_YAML}.`);
  }
  return parseMapBackground(svgText, yamlText);
}

async function readOptional(file: string): Promise<string | null> {
  try {
    return await readFile(file, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}
