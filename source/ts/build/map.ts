/**
 * The farm map (02-§5.23–5.27, 02-§5.30, 03-§9).
 *
 * The map is generated at build time from the locations' `lat`/`lon`. The projection
 * is linear: the bounding box of the places, with a margin, is mapped onto the drawing
 * frame. At the size of a farm the curvature of the earth is negligible.
 *
 * Three layers make up the map:
 *   - an inline SVG, the drawing: a plain plate, or the hand-drawn background
 *     (`background.svg` with `background.yaml` under source/map/) when it exists
 *     (03-§9.2), and
 *   - one HTML `<a>` per place on top of it, positioned in percent of the drawing, and
 *   - the zoom controls, which lie outside the zoomed frame so they keep their place
 *     (02-§5.41).
 *
 * The first two sit in `.map__canvas`, the element the zoom transforms (ADR 0020).
 *
 * The markers are HTML rather than SVG so that they keep their size — at least the
 * tap target minimum (05-§4.15) — and their readable label at every viewport width,
 * while the drawing scales with the page. Each one carries the symbol for its kind of
 * place (02-§5.38), drawn in the page like everything else on the map. Pure functions: everything comes in as
 * arguments, so the tests never touch the file system except in `loadMapBackground`.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { escapeAttribute, escapeText } from "./images.ts";
import { symbolSvg } from "./symbols.ts";
import type { LocationKind } from "../domain/types.ts";

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
  /** Decides the marker's symbol (02-§5.38, 04-§5.7). */
  kind: LocationKind;
  /** The place's short human note, or null (02-§5.46). */
  note: string | null;
  /** "Hit når man med rullstol och barnvagn" or its negation (02-§5.10). */
  accessibility: string;
  /** "Får och kor" or "Inga djur just nu" for a djurplats; empty for the rest. */
  species: string;
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
 * Where the label sits around the marker (02-§5.33, 02-§5.53). Eight positions: four
 * slanted and four straight. `below` is the stylesheet's base case and the fallback;
 * every other position is written on the marker as a modifier and placed by CSS.
 */
export type LabelSide =
  | "above-left"
  | "above-right"
  | "below-left"
  | "below-right"
  | "below"
  | "above"
  | "right"
  | "left"
  | "hidden";

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
  /** `--space-md`: the container's padding, which the map does not get to use. */
  containerPadding: 24,
  /**
   * The map's own width, not the window's: the canvas is the viewport less the
   * container's padding at each side. A 360 px phone — the narrowest width the design
   * targets (05-§5.1) — leaves the map 312 px, and estimating against 360 would let a
   * label hang over the edge.
   */
  referenceWidth: 360 - 2 * 24,
  /** The same at 600 px, where the wide placement takes over (05-§5.2). */
  wideWidth: 600 - 2 * 24,
  /** `--space-sm`: how far the zoom controls sit in from the map's bottom-right corner. */
  controlInset: 16,
  /** `--space-xs`: the gap between the control buttons. */
  controlGap: 8,
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
/**
 * Tried in this order (02-§5.53). The four slanted positions come first, because a
 * slanted label leaves both the lane straight below the marker and the lane straight
 * beside it free for a neighbour.
 *
 * Among the slanted four, the pasture decides the order. Its bands run north-west to
 * south-east, so a label up-and-left or down-and-right follows the paddock it belongs to,
 * while one on the other diagonal drifts across the fence into the next paddock. The two
 * along that axis are therefore tried before the two across it. The straight four come
 * last, in the order they have always had.
 */
const LABEL_SIDES: readonly LabelSide[] = [
  "above-left",
  "below-right",
  "above-right",
  "below-left",
  "below",
  "above",
  "right",
  "left",
];

/**
 * The order to try for a marker standing at `x` in a drawing `width` px wide, both in the
 * reference pixels the placement is worked out in (02-§5.54).
 *
 * A marker whose own pin reaches the drawing's left or right edge is *in the margin*, and
 * there the straight side pointing inwards comes first. The reason is what the visitor
 * sees: a straight label sits level with the pin, so the name plainly belongs to it, while
 * a slanted one meets the pin corner to corner. Corner to corner is fine out in the
 * pasture, where the markers are spread out — but the places that lie outside the drawing
 * are parked along these very edges (04-§5.9), one under the other, and there a corner
 * points at two pins as readily as one.
 *
 * Half a tap target is the threshold rather than a chosen fraction: it is exactly when the
 * marker stops being a dot in the drawing and becomes a dot on its edge. It also scales
 * with the layout, so the same markers count as edge markers at 312 px and at 552 px.
 * Anywhere else nothing changes — there the pasture's bands decide (02-§5.53).
 */
function sidesFor(x: number, width: number): readonly LabelSide[] {
  const half = LABEL_METRICS.tapTarget / 2;
  const inwards: LabelSide | null = x < half ? "right" : x > width - half ? "left" : null;
  if (inwards === null) return LABEL_SIDES;
  return [inwards, ...LABEL_SIDES.filter((side) => side !== inwards)];
}

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
    // The slanted positions sit corner to corner with the pin's box, so they clear both
    // the lane under the marker and the lane beside it (02-§5.53).
    case "above-left":
      return { left: x - half - width, right: x - half, top: y - half - height, bottom: y - half };
    case "above-right":
      return { left: x + half, right: x + half + width, top: y - half - height, bottom: y - half };
    case "below-left":
      return { left: x - half - width, right: x - half, top: y + half, bottom: y + half + height };
    case "below-right":
      return { left: x + half, right: x + half + width, top: y + half, bottom: y + half + height };
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
 * south, and each label gets the first free position. A position that would push the
 * label off the drawing is not free either, so a place at the edge turns its label
 * inwards.
 *
 * There are eight positions, so a ninth marker on the same spot has nowhere to go. Its label
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

  // The zoom controls sit over the bottom-right corner (02-§5.41), so a label placed
  // there would end up behind a button. Only the two buttons that are always on screen
  // are reserved: "Visa hela kartan" appears while zoomed, and a zoomed map shows every
  // name anyway (02-§5.44), so the overview's placement is not what the visitor sees then.
  const controls: Box = {
    left: referenceWidth - LABEL_METRICS.controlInset - LABEL_METRICS.tapTarget,
    right: referenceWidth - LABEL_METRICS.controlInset,
    top: edge.bottom - LABEL_METRICS.controlInset - 2 * LABEL_METRICS.tapTarget - LABEL_METRICS.controlGap,
    bottom: edge.bottom - LABEL_METRICS.controlInset,
  };

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
    const free = sidesFor(point.x, referenceWidth).find((side) => {
      const box = labelBox(point.x, point.y, point.width, height, side);
      return (
        contains(edge, box) &&
        !overlaps(box, controls) &&
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

/**
 * The zoom controls (02-§5.41, 05-§6.41). Written by the build but useless without
 * `source/ts/ui/map-zoom.ts`, so the whole group starts `hidden` and the module shows it —
 * the same bargain the install button makes (02-§10.11). Without JavaScript the map is the
 * still picture it has always been (02-§5.45).
 */
const MAP_CONTROLS =
  `<div class="map__controls" hidden data-map-controls>` +
  `<button class="icon-button map__control" type="button" aria-label="Zooma in" data-map-zoom="in">` +
  `<svg class="icon-button__icon" aria-hidden="true" viewBox="0 0 24 24" width="22" height="22">` +
  `<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>` +
  `</svg></button>` +
  `<button class="icon-button map__control" type="button" aria-label="Zooma ut" data-map-zoom="out">` +
  `<svg class="icon-button__icon" aria-hidden="true" viewBox="0 0 24 24" width="22" height="22">` +
  `<path d="M5 12h14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>` +
  `</svg></button>` +
  `<button class="icon-button map__control" type="button" aria-label="Visa hela kartan" hidden data-map-zoom="home">` +
  `<svg class="icon-button__icon" aria-hidden="true" viewBox="0 0 24 24" width="22" height="22">` +
  `<path d="M9 4H4v5M20 9V4h-5M15 20h5v-5M4 15v5h5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>` +
  `</svg></button>` +
  `</div>`;

/**
 * The popup on a marker (02-§5.46, 03-§9.7). Written once and empty: `map-popup.ts` fills
 * it with `textContent` from the marker's own `data-` attributes and opens it.
 *
 * It is a `<dialog>`, opened in the middle of the screen with `showModal()` — the same
 * component as the feedback dialog (05-§6.35). A card anchored at the marker was tried and
 * abandoned: the map clips what leaves it so the zoom has an edge, and on a phone the map
 * is some 270 px tall, too little for a card with a name, a line about the animals and a
 * way onwards to fit above or below a marker in the middle. In the middle of the screen
 * there is always room, and the browser gives Escape, the focus trap and the backdrop for
 * free. Without JavaScript it never opens, and the marker's link goes to the place page as
 * it always did (02-§5.49).
 */
const MAP_POPUP =
  `<dialog class="dialog map-popup" data-map-popup aria-labelledby="map-popup-name">` +
  `<div class="dialog__body">` +
  `<div class="dialog__header" data-map-popup-header>` +
  `<button class="icon-button dialog__close" type="button" aria-label="Stäng" data-map-popup-close>` +
  `<svg class="icon-button__icon" aria-hidden="true" viewBox="0 0 24 24" width="22" height="22">` +
  `<path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>` +
  `</svg></button></div>` +
  `<div class="map-popup__facts" data-map-popup-facts></div>` +
  `</div></dialog>`;

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
    // `below` is the stylesheet's base case and needs no modifier in the narrow layout.
    // The wide class is always written: from 600 px the stylesheet starts from the
    // default and follows it (05-§5.2).
    const className =
      (side === "below" ? "map__marker" : `map__marker map__marker--label-${side}`) +
      ` map__marker--wide-${wide}`;
    const style = `left: ${percent(position.x, frame.width)}; top: ${percent(position.y, frame.height)}`;
    // What the popup shows, carried on the marker so the client needs no second source
    // (03-§9.7). Only a djurplats reports animals (02-§5.47), and a place without a note
    // carries no empty attribute — an absent fact and an empty one are not the same.
    const facts =
      ` data-kind="${escapeAttribute(location.kind)}"` +
      ` data-access="${escapeAttribute(location.accessibility)}"` +
      (location.note === null ? "" : ` data-note="${escapeAttribute(location.note)}"`) +
      (location.kind === "djurplats" ? ` data-species="${escapeAttribute(location.species)}"` : "");
    markers.push(
      `<a class="${className}" href="${escapeAttribute(`${options.base}plats/${location.id}/`)}" style="${style}" data-place="${escapeAttribute(location.id)}"${facts}>` +
        `<span class="map__pin map__pin--${location.kind}" aria-hidden="true">${symbolSvg(location.kind, "map__symbol")}</span>` +
        `<span class="map__label">${escapeText(location.name)}</span>` +
        `</a>`,
    );
  }

  return {
    html:
      `<div class="map" data-map>` +
      `<div class="map__canvas" data-map-canvas>` +
      renderMapSvg(frame, options.background ?? null) +
      markers.join("") +
      `</div>` +
      MAP_CONTROLS +
      `</div>` +
      MAP_POPUP,
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
