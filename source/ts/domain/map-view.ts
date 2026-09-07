/**
 * The map's view: how far it is zoomed in, and where it has been dragged
 * (02-§5.40–5.43, 03-§9.6, ADR 0020).
 *
 * Everything here is unit-free. A position is a fraction of the map's frame, so `x: -0.5`
 * means the drawing has been dragged half a frame to the left, whatever the frame is in
 * pixels. That keeps the same numbers true at 360 px and at 1280 px — and keeps this file
 * free of browser APIs, so it can be tested in Node (`CL-§2.14`). The module that touches
 * the DOM is `source/ts/ui/map-zoom.ts`; it turns a view into one `transform`.
 *
 * The drawing is laid out as `translate(x, y) scale(scale)` from the frame's top left, so
 * the drawing covers `[x, x + scale]` across the frame. Keeping that interval outside
 * `[0, 1]` is the whole of `clampView`: the visitor can never drag an edge in and end up
 * looking at nothing.
 */

export interface MapView {
  /** The drawing's left edge, in frame widths. Zero or less. */
  x: number;
  /** The drawing's top edge, in frame heights. Zero or less. */
  y: number;
  /** 1 is the whole drawing; MAX_SCALE is as close as the visitor gets. */
  scale: number;
}

/** A point in the frame, as fractions of its width and height. */
export interface Point {
  x: number;
  y: number;
}

/** The whole drawing, unmoved. Zooming out always lands exactly here. */
export const HOME: MapView = Object.freeze({ x: 0, y: 0, scale: 1 });

/** There is nothing to zoom out to: at 1 the whole drawing is already in the frame. */
export const MIN_SCALE = 1;
/**
 * As close as the visitor gets. Six is what it takes to tell the eight places around the
 * yard apart (02-§5.44); further in and the drawing is bigger than its own detail.
 */
export const MAX_SCALE = 6;

/** Rounding slack: a pinch never lands exactly on 1, but it should still mean "home". */
const EPSILON = 1e-9;

function limit(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

/** Which point of the drawing lies under `point` in the frame, in drawing fractions. */
export function pointUnder(view: MapView, point: Point): Point {
  return { x: (point.x - view.x) / view.scale, y: (point.y - view.y) / view.scale };
}

/**
 * The view with the drawing pulled back so it still covers the frame. At scale 1 that
 * leaves exactly one possibility, which is why panning does nothing until zoomed in
 * (02-§5.42).
 */
export function clampView(view: MapView): MapView {
  const scale = limit(view.scale, MIN_SCALE, MAX_SCALE);
  // The drawing spans [x, x + scale]; it has to reach past both edges of [0, 1].
  return { x: limit(view.x, 1 - scale, 0), y: limit(view.y, 1 - scale, 0), scale };
}

/**
 * Zoomed by `factor` around `anchor` — the midpoint between two fingers, the pointer under
 * the wheel, or the middle of the frame for a button press. The point of the drawing under
 * the anchor stays under it, which is what makes a pinch feel like the paper is being
 * stretched rather than swapped.
 */
export function zoomBy(view: MapView, factor: number, anchor: Point): MapView {
  const scale = limit(view.scale * factor, MIN_SCALE, MAX_SCALE);
  if (scale <= MIN_SCALE + EPSILON) return HOME;
  const held = pointUnder(view, anchor);
  return clampView({ x: anchor.x - held.x * scale, y: anchor.y - held.y * scale, scale });
}

/** Dragged by `dx`, `dy` frame widths and heights, never past the drawing's edges. */
export function panBy(view: MapView, dx: number, dy: number): MapView {
  return clampView({ x: view.x + dx, y: view.y + dy, scale: view.scale });
}

/** True when the whole drawing is in the frame, so there is nothing to reset. */
export function isHome(view: MapView): boolean {
  return view.scale <= MIN_SCALE + EPSILON;
}
