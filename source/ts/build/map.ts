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
import { NAMES_AT_SCALE } from "../domain/map-view.ts";
import type { LabelPlacement, LocationKind } from "../domain/types.ts";

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
  /** What the marker's label says, when the full name is too long for the map. */
  shortName: string | null;
  /** Decides the marker's symbol (02-§5.38, 04-§5.7). */
  kind: LocationKind;
  /** The place's short human note, or null (02-§5.46). */
  note: string | null;
  /** "Hit når man med rullstol och barnvagn" or its negation (02-§5.10). */
  accessibility: string;
  /** "Får och kor" or "Inga djur just nu" for a djurplats; empty for the rest. */
  species: string;
  /** The side the place asks its name to stand on, or null for the build to choose. */
  label: LabelPlacement | null;
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
export type LabelSide = "below" | "above" | "right" | "left" | "hidden";

/** The data's word for a side (04-§5.10) turned into the one the placement uses. */
const SIDE_FOR_PLACEMENT: Readonly<Record<LabelPlacement, LabelSide>> = {
  under: "below",
  over: "above",
  hoger: "right",
  vanster: "left",
};

/**
 * Measurements the estimate needs, in pixels, mirrored from `tokens.css`. There is no
 * browser at build time, so the label's box is estimated rather than measured;
 * `tests/build/map.test.ts` compares these three against the tokens so the code and the
 * design decision cannot drift apart (05-§7.4).
 */
export const LABEL_METRICS = {
  /** `--tap-target-min`: the pin's box, centred on the place. */
  tapTarget: 44,
  /**
   * `--space-md`: the drawn dot inside that box. The rest of the tap target is invisible
   * air, and it is the dot a label has to keep clear of, not the air (02-§5.58).
   */
  dot: 24,
  /**
   * How far from the place the label's nearest edge sits: exactly the drawn dot's radius,
   * so the two touch. Air between them is air the eye has to bridge, and the name belongs
   * to the dot it is resting against.
   */
  labelOffset: 24 / 2,
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
  /**
   * And at 960 px, the design's desktop breakpoint (05-§5.3). Without a placement of its
   * own, the narrowest tablet in portrait would decide where the names sit on every wider
   * screen too (02-§5.61).
   */
  desktopWidth: 960 - 2 * 24,
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
 * Tried in this order (02-§5.53). All four sit square on the marker — straight below,
 * straight above, straight beside — so a label points at its own pin and no other. The
 * slanted positions that once came first are gone: they met the marker corner to corner,
 * and on a map of thirty-four places a corner points at the neighbour as readily as at the
 * place it belongs to. They were introduced to stop a paddock's name drifting across the
 * fence (issue #50), but the cause of that was a coordinate at the paddock's edge rather
 * than its middle, which `04-§5.8` has since fixed.
 */
const LABEL_SIDES: readonly LabelSide[] = ["below", "above", "right", "left"];

/**
 * The order to try for a marker standing at `x` in a drawing `width` px wide, both in the
 * reference pixels the placement is worked out in (02-§5.59).
 *
 * A marker whose own pin reaches the drawing's left or right edge is *in the margin*, and
 * there the straight side pointing inwards comes first. A straight label sits level with
 * the pin, so the name plainly belongs to it; a slanted one meets the pin corner to
 * corner. Corner to corner is fine out in the pasture, where the markers are spread out —
 * but the places that lie outside the drawing are parked along these very edges
 * (04-§5.9), one under the other, and there a corner points at two pins as readily as one.
 *
 * Half a tap target is the threshold rather than a chosen fraction: it is exactly when the
 * marker stops being a dot in the drawing and becomes a dot on its edge. It also scales
 * with the layout, so the same markers count as edge markers at 312 px and at 552 px.
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
  /** The side the place asked for (02-§5.60), or null to let the order decide. */
  side?: LabelSide | null;
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

/** How much area the two boxes share, in square pixels; zero when they only touch. */
function overlapArea(a: Box, b: Box): number {
  const wide = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const tall = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return wide > 0 && tall > 0 ? wide * tall : 0;
}

/**
 * How much worse it is to cover a pin than another label (02-§5.54). A covered name can
 * still be read past; a covered pin is a place the visitor cannot find or tap, so the
 * placement pays several times over for hiding one.
 */
const PIN_PENALTY = 8;

/** True when `inner` lies wholly inside `outer`. */
function contains(outer: Box, inner: Box): boolean {
  return (
    inner.left >= outer.left &&
    inner.right <= outer.right &&
    inner.top >= outer.top &&
    inner.bottom <= outer.bottom
  );
}

/**
 * The label's box on one side of a marker standing at `x`, `y` in pixels. It hangs
 * `labelOffset` from the place rather than clearing the whole tap target: what the eye
 * has to connect is the name and the drawn dot, and every pixel between them is a pixel
 * the reader has to bridge.
 */
function labelBox(x: number, y: number, width: number, height: number, side: LabelSide): Box {
  const off = LABEL_METRICS.labelOffset;
  switch (side) {
    case "below":
      return { left: x - width / 2, right: x + width / 2, top: y + off, bottom: y + off + height };
    case "above":
      return { left: x - width / 2, right: x + width / 2, top: y - off - height, bottom: y - off };
    case "right":
      return { left: x + off, right: x + off + width, top: y - height / 2, bottom: y + height / 2 };
    case "left":
      return { left: x - off - width, right: x - off, top: y - height / 2, bottom: y + height / 2 };
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
    side: marker.side ?? null,
    x: marker.x * scale,
    y: marker.y * scale,
    width: marker.name.length * LABEL_METRICS.fontSize * CHAR_WIDTH_RATIO + 2 * LABEL_METRICS.padding,
  }));
  // What a label must not cover is the drawn dot, not the tap target around it (02-§5.58).
  // The tap target is 44 px so a finger can hit it; the dot is --space-md, and the rest is
  // air nobody can see. Guarding the whole target pushed labels out of positions where
  // nothing was in the way — the places along the edge lost their straight position to a
  // neighbour they never touched. A label may end up over that air; it takes no pointer
  // events (05-§6.44), so the neighbour's target still answers every tap.
  const dot = LABEL_METRICS.dot / 2;
  const pins: Box[] = points.map((p) => ({
    left: p.x - dot,
    right: p.x + dot,
    top: p.y - dot,
    bottom: p.y + dot,
  }));

  // North to south, then west to east, then by id: the same places always place in the
  // same order, whatever order they arrived in.
  const order = [...points].sort((a, b) => a.y - b.y || a.x - b.x || (a.id < b.id ? -1 : 1));

  const taken: Box[] = [];
  const sides = new Map<string, LabelSide>();

  // A place that asks for a side gets it, before anything is placed automatically
  // (02-§5.60). It still may not leave the drawing or hide behind a zoom button; there
  // 02-§5.54 weighs more, and the place falls through to the automatic pass instead.
  for (const point of order) {
    const asked = point.side;
    if (!asked || asked === "hidden") continue;
    const box = labelBox(point.x, point.y, point.width, height, asked);
    if (!contains(edge, box) || overlaps(box, controls)) continue;
    sides.set(point.id, asked);
    taken.push(box);
  }

  for (const point of order) {
    if (sides.has(point.id)) continue;
    const free = sidesFor(point.x, referenceWidth).find((side) => {
      const box = labelBox(point.x, point.y, point.width, height, side);
      return (
        contains(edge, box) &&
        !overlaps(box, controls) &&
        !taken.some((other) => overlaps(box, other)) &&
        !pins.some((pin) => overlaps(box, pin))
      );
    });
    // Nothing free: take the position that grazes least rather than drop the name
    // (02-§5.54). A name partly over another is still a name; a name nobody can see is
    // not, and the place it belongs to then exists only in the list under the map. The
    // drawing's edge and the zoom controls do not bend — a label outside the drawing is
    // clipped into nonsense, and one behind a button cannot be read at all.
    const side =
      free ??
      (LABEL_SIDES.map((candidate) => {
        const box = labelBox(point.x, point.y, point.width, height, candidate);
        if (!contains(edge, box) || overlaps(box, controls)) return null;
        const cost =
          taken.reduce((sum, other) => sum + overlapArea(box, other), 0) +
          PIN_PENALTY * pins.reduce((sum, pin) => sum + overlapArea(box, pin), 0);
        return { side: candidate, cost };
      })
        // A tie keeps the order of LABEL_SIDES, so the placement stays deterministic.
        .reduce<{ side: LabelSide; cost: number } | null>(
          (best, next) => (next !== null && (best === null || next.cost < best.cost) ? next : best),
          null,
        )?.side ?? "hidden");
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
    // The placement measures what is actually drawn, so a short name takes less room.
    name: location.shortName ?? location.name,
    side: location.label === null ? null : SIDE_FOR_PLACEMENT[location.label],
    ...position,
  }));
  // No narrow placement: under 600 px no name is shown until the map is zoomed far enough
  // for the zoomed placement to take over (02-§5.55), so one worked out for a 312 px map
  // would never be seen.
  const wideSides = placeLabels(points, frame.width, frame.height, LABEL_METRICS.wideWidth);
  const desktopSides = placeLabels(points, frame.width, frame.height, LABEL_METRICS.desktopWidth);
  // A third placement for the zoomed map (02-§5.57). Zooming shows every name (02-§5.44),
  // and a name the overview had to hide has no side of its own — so they all fell back to
  // the same spot under their pin and stacked. The reference is the narrowest map at the
  // scale where the names appear: what fits there fits at every wider viewport, and
  // zooming further only adds room.
  const zoomSides = placeLabels(
    points,
    frame.width,
    frame.height,
    LABEL_METRICS.referenceWidth * NAMES_AT_SCALE,
  );

  const markers: string[] = [];
  for (const { location, position } of drawn) {
    const wide = wideSides.get(location.id) ?? "below";
    const desktop = desktopSides.get(location.id) ?? "below";
    const zoom = zoomSides.get(location.id) ?? "below";
    const className =
      `map__marker map__marker--wide-${wide}` +
      ` map__marker--desktop-${desktop}` +
      // Nothing to say when the zoomed placement has no room either: the marker then keeps
      // the default position, and the line to its pin still says which one it belongs to.
      (zoom === "hidden" ? "" : ` map__marker--zoom-${zoom}`);
    const style = `left: ${percent(position.x, frame.width)}; top: ${percent(position.y, frame.height)}`;
    // What the popup shows, carried on the marker so the client needs no second source
    // (03-§9.7). Only a djurplats reports animals (02-§5.47), and a place without a note
    // carries no empty attribute — an absent fact and an empty one are not the same.
    const facts =
      ` data-kind="${escapeAttribute(location.kind)}"` +
      ` data-access="${escapeAttribute(location.accessibility)}"` +
      (location.note === null ? "" : ` data-note="${escapeAttribute(location.note)}"`) +
      (location.kind === "djurplats" ? ` data-species="${escapeAttribute(location.species)}"` : "");
    // A short name shortens the label, never the place (02-§5.62). The link keeps the full
    // name as its accessible name, so a screen reader does not hear "Grillplats" three
    // times, and `data-name` hands the same full name to the popup.
    const short = location.shortName;
    const full =
      short === null
        ? ""
        : ` aria-label="${escapeAttribute(location.name)}" data-name="${escapeAttribute(location.name)}"`;
    markers.push(
      `<a class="${className}" href="${escapeAttribute(`${options.base}plats/${location.id}/`)}" style="${style}" data-place="${escapeAttribute(location.id)}"${full}${facts}>` +
        `<span class="map__pin map__pin--${location.kind}" aria-hidden="true">${symbolSvg(location.kind, "map__symbol")}</span>` +
        `<span class="map__label">${escapeText(short ?? location.name)}</span>` +
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
