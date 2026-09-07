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
const DEFAULT_MARGIN = 0.12;
/** The frame follows the shape of the ground, but never beyond these height/width ratios. */
const MIN_ASPECT = 0.6;
const MAX_ASPECT = 1.25;
/** Extent used when all places share a coordinate, so a single place still gets a frame. */
const MIN_EXTENT_DEGREES = 0.0005;

/**
 * The frame for `points` when there is no background: their bounding box, widened so
 * that a degree of longitude is as long on the drawing as it is on the ground, fitted
 * into `width` × `height` with `margin` around it, and centred. Without an explicit
 * height the frame takes the shape of the ground, within limits, so a farm that
 * stretches north–south gets a tall map rather than empty space at the sides. Null
 * without points.
 */
export function mapFrame(
  points: readonly MapPoint[],
  options: { width?: number; height?: number; margin?: number } = {},
): MapFrame | null {
  if (points.length === 0) return null;
  const { width = DEFAULT_WIDTH, margin = DEFAULT_MARGIN } = options;

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
  const aspect = Math.min(MAX_ASPECT, Math.max(MIN_ASPECT, groundHeight / groundWidth));
  const height = options.height ?? Math.round(width * aspect);

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

// --- Label placement ---------------------------------------------------------

/**
 * Which side of the marker its label sits on (02-§5.33). `below` is the plain case and
 * the fallback; the others are written on the marker as a modifier and placed by CSS.
 */
export type LabelSide = "below" | "above" | "right" | "left" | "hidden";

/**
 * Measurements the estimate needs, in pixels, mirrored from `tokens.css`. There is no
 * browser at build time, so the label's box is estimated rather than measured;
 * `tests/build/map.test.ts` compares these three against the tokens so the code and the
 * design decision cannot drift apart (05-§7.4).
 */
export const LABEL_METRICS = {
  /** `--tap-target-min`: the pin's box, centred on the place. */
  tapTarget: 44,
  /** `--font-size-small`: the label's type size. */
  fontSize: 15,
  /** `--space-xs`: the label's padding, at each end. */
  padding: 8,
  /** The narrowest the map gets, in the mobile layout (05-§5.1). */
  referenceWidth: 360,
  /** The widest it gets: `--container-narrow` less the container's padding (05-§5.2). */
  wideWidth: 648,
} as const;

/**
 * Width of an average character at `--font-size-small`, as a fraction of the type size.
 * Measured in Chromium over the QA place names, where the ratio ran between 0.62 and
 * 0.68; this value sits above the worst of them on purpose. Overestimating moves labels
 * apart that would have fitted; underestimating leaves them on top of each other — and
 * only the second is visible to a visitor.
 */
const CHAR_WIDTH_RATIO = 0.7;
/** The label is one line. Measured at 24 px against a 15 px type size. */
const LINE_HEIGHT_RATIO = 1.6;
/** Tried in this order, so the plain case wins whenever it is free. */
const LABEL_SIDES: readonly LabelSide[] = ["below", "above", "right", "left"];

/** A marker to place a label for, positioned in drawing units. */
export interface LabelMarker {
  id: string;
  name: string;
  x: number;
  y: number;
}

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** True when the two boxes share area. Boxes that only touch do not overlap. */
function overlaps(a: Box, b: Box): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

/** True when `inner` lies wholly inside `outer`. */
function contains(outer: Box, inner: Box): boolean {
  return (
    inner.left >= outer.left &&
    inner.right <= outer.right &&
    inner.top >= outer.top &&
    inner.bottom <= outer.bottom
  );
}

/** The label's box on one side of a marker standing at `x`, `y` in pixels. */
function labelBox(x: number, y: number, width: number, height: number, side: LabelSide): Box {
  const half = LABEL_METRICS.tapTarget / 2;
  switch (side) {
    case "below":
      return { left: x - width / 2, right: x + width / 2, top: y + half, bottom: y + half + height };
    case "above":
      return { left: x - width / 2, right: x + width / 2, top: y - half - height, bottom: y - half };
    case "right":
      return { left: x + half, right: x + half + width, top: y - height / 2, bottom: y + height / 2 };
    case "left":
      return { left: x - half - width, right: x - half, top: y - height / 2, bottom: y + height / 2 };
    case "hidden":
      // Never asked for while choosing; a hidden label occupies nothing.
      return { left: x, right: x, top: y, bottom: y };
  }
}

/**
 * Which side each label goes on so that labels do not cover each other or another
 * marker's pin (02-§5.33, 03-§9.3).
 *
 * The boxes are worked out in pixels for a `referenceWidth` drawing — the narrowest the
 * map gets — because that is where the labels crowd. Places are taken from north to
 * south, and each label gets the first free side. A side that would push the label off
 * the drawing is not free either, so a place at the edge turns its label inwards.
 *
 * There are four sides, so a fifth marker on the same spot has nowhere to go. Its label
 * is then `hidden`: the pin stays, and CSS keeps the name out of sight until the marker
 * is pointed at or focused. Stacked unreadable text would be worse than none, and the
 * place is never lost — it stands in the list under the map (02-§5.24).
 *
 * The estimate is an estimate. It tells a crowded map from an airy one; it does not
 * promise pixels.
 */
export function placeLabels(
  markers: readonly LabelMarker[],
  drawingWidth: number,
  drawingHeight: number,
  referenceWidth: number = LABEL_METRICS.referenceWidth,
): Map<string, LabelSide> {
  const scale = referenceWidth / drawingWidth;
  const edge: Box = { left: 0, right: referenceWidth, top: 0, bottom: drawingHeight * scale };
  const height = LABEL_METRICS.fontSize * LINE_HEIGHT_RATIO;
  const half = LABEL_METRICS.tapTarget / 2;

  const points = markers.map((marker) => ({
    id: marker.id,
    x: marker.x * scale,
    y: marker.y * scale,
    width: marker.name.length * LABEL_METRICS.fontSize * CHAR_WIDTH_RATIO + 2 * LABEL_METRICS.padding,
  }));
  const pins: Box[] = points.map((p) => ({
    left: p.x - half,
    right: p.x + half,
    top: p.y - half,
    bottom: p.y + half,
  }));

  // North to south, then west to east, then by id: the same places always place in the
  // same order, whatever order they arrived in.
  const order = [...points].sort((a, b) => a.y - b.y || a.x - b.x || (a.id < b.id ? -1 : 1));

  const taken: Box[] = [];
  const sides = new Map<string, LabelSide>();
  for (const point of order) {
    const free = LABEL_SIDES.find((side) => {
      const box = labelBox(point.x, point.y, point.width, height, side);
      return (
        contains(edge, box) &&
        !taken.some((other) => overlaps(box, other)) &&
        !pins.some((pin) => overlaps(box, pin))
      );
    });
    const side = free ?? "hidden";
    sides.set(point.id, side);
    // A hidden label takes no room, so it must not push the next one aside.
    if (side !== "hidden") taken.push(labelBox(point.x, point.y, point.width, height, side));
  }
  return sides;
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
  // No places, no map — not even the drawing. The page says the dataset is empty
  // (02-§6.2), and a drawing of the farm under that sentence would only puzzle.
  if (locations.length === 0) return { html: "", warnings: [] };
  const frame: MapFrame | null = options.background ?? mapFrame(locations, options);
  if (frame === null) return { html: "", warnings: [] };

  const warnings: string[] = [];
  const drawn: { location: MapLocation; position: { x: number; y: number } }[] = [];
  for (const location of locations) {
    const position = projectPoint(location, frame);
    if (!isInside(position, frame)) {
      warnings.push(
        `${BACKGROUND_YAML}: platsen ${location.id} (${location.lat}, ${location.lon}) ligger utanför ritningen och visas inte på kartan. Vidga north, south, west eller east.`,
      );
      continue;
    }
    drawn.push({ location, position });
  }

  // Only the markers that are actually drawn take part: a place outside the drawing
  // cannot crowd a label (02-§5.33). The placement is worked out twice, because what
  // crowds a 360 px map has room on a 648 px one, and the visitor sees one or the other.
  const points = drawn.map(({ location, position }) => ({
    id: location.id,
    name: location.name,
    ...position,
  }));
  const sides = placeLabels(points, frame.width, frame.height);
  const wideSides = placeLabels(points, frame.width, frame.height, LABEL_METRICS.wideWidth);

  const markers: string[] = [];
  for (const { location, position } of drawn) {
    const side = sides.get(location.id) ?? "below";
    const wide = wideSides.get(location.id) ?? "below";
    // `below` is the plain case and needs no modifier in the narrow layout, so most
    // markers keep bare markup there. The wide class is always written: from 600 px the
    // stylesheet starts from the default and follows it (05-§5.2).
    const className =
      (side === "below" ? "map__marker" : `map__marker map__marker--label-${side}`) +
      ` map__marker--wide-${wide}`;
    const style = `left: ${percent(position.x, frame.width)}; top: ${percent(position.y, frame.height)}`;
    markers.push(
      `<a class="${className}" href="${escapeAttribute(`${options.base}plats/${location.id}/`)}" style="${style}" data-place="${escapeAttribute(location.id)}">` +
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
