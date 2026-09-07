/**
 * Zoom and panning on the farm map (02-§5.40–5.45, ADR 0020).
 *
 * All the arithmetic lives in `source/ts/domain/map-view.ts` and is tested in Node. This
 * module only turns events into calls and the resulting view into one `transform`: pointer
 * events for pinch and drag, three buttons, arrow keys, and `Ctrl`/`Cmd` with the wheel.
 * Plain wheel is left alone, so scrolling past the home page works as it does everywhere
 * else (02-§5.40).
 *
 * Like every module under ui/, it looks up its own element and does nothing when the page
 * has none (03-§10.2). Without it the map is the still picture the build wrote.
 */

import { clampView, HOME, isHome, MAX_SCALE, MIN_SCALE, panBy, zoomBy, type MapView, type Point } from "../domain/map-view.ts";

/** One press of + or −. Chosen so four presses cross the whole range. */
const BUTTON_STEP = 1.6;
/** One arrow key press, as a fraction of the frame. */
const KEY_PAN = 0.15;
/** How much a wheel notch zooms. Small, because a wheel sends many. */
const WHEEL_STEP = 0.0015;
/**
 * The scale at which every name is shown, hidden ones included (02-§5.44). Measured on the
 * yard cluster in Chromium: at 2x its labels still stack, at 4x they stand apart.
 */
const NAMES_AT_SCALE = 4;
/** A press that moves further than this is a drag, and must not follow the marker's link. */
const DRAG_SLOP_PX = 6;

export function init(): void {
  const map = document.querySelector<HTMLElement>("[data-map]");
  const canvas = map?.querySelector<HTMLElement>("[data-map-canvas]");
  const controls = map?.querySelector<HTMLElement>("[data-map-controls]");
  if (!map || !canvas || !controls) return;

  let view: MapView = HOME;
  /** Pointers currently down on the map, by pointerId. */
  const pointers = new Map<number, Point>();
  /** Distance between two fingers on the previous move, to measure the pinch against. */
  let pinchDistance = 0;
  let dragged = false;

  const buttons = new Map<string, HTMLButtonElement>();
  for (const button of controls.querySelectorAll<HTMLButtonElement>("[data-map-zoom]")) {
    buttons.set(button.dataset.mapZoom ?? "", button);
  }

  /** Where a client point falls in the frame, as fractions of its width and height. */
  const inFrame = (clientX: number, clientY: number): Point => {
    const box = map.getBoundingClientRect();
    return { x: (clientX - box.left) / box.width, y: (clientY - box.top) / box.height };
  };

  const show = (next: MapView): void => {
    view = clampView(next);
    canvas.style.transform = `translate(${view.x * 100}%, ${view.y * 100}%) scale(${view.scale})`;
    map.style.setProperty("--map-scale", String(view.scale));
    map.classList.toggle("map--zoomed", !isHome(view));
    map.classList.toggle("map--names", view.scale >= NAMES_AT_SCALE);
    const home = buttons.get("home");
    if (home) home.hidden = isHome(view);
    const zoomIn = buttons.get("in");
    if (zoomIn) zoomIn.disabled = view.scale >= MAX_SCALE;
    const zoomOut = buttons.get("out");
    if (zoomOut) zoomOut.disabled = view.scale <= MIN_SCALE;
  };

  const centre: Point = { x: 0.5, y: 0.5 };

  for (const [action, button] of buttons) {
    button.addEventListener("click", () => {
      if (action === "home") show(HOME);
      else show(zoomBy(view, action === "in" ? BUTTON_STEP : 1 / BUTTON_STEP, centre));
      // A press that reaches a limit disables the button under the finger. Focus would
      // then fall to the body and the keyboard visitor would lose their place, so it is
      // handed to the button that still does something.
      if (button.disabled || button.hidden) {
        const other = action === "in" ? buttons.get("out") : buttons.get("in");
        other?.focus();
      } else {
        button.focus();
      }
    });
  }

  canvas.addEventListener("pointerdown", (event) => {
    // Every pointer is followed, pinch included. What keeps a single finger at 1x for the
    // page rather than the map is `touch-action: pan-y` (02-§5.42): the browser takes the
    // gesture for scrolling and sends us a pointercancel instead of moves. Refusing the
    // first pointer here would refuse the first finger of a pinch as well.
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    dragged = false;
    // Only capture when there is something to drag; at 1x the gesture belongs to the page.
    if (pointers.size === 1 && !isHome(view)) {
      canvas.setPointerCapture(event.pointerId);
      map.classList.add("map--dragging");
    }
    if (pointers.size === 2) pinchDistance = spread(pointers);
  });

  canvas.addEventListener("pointermove", (event) => {
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    const box = map.getBoundingClientRect();
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size >= 2) {
      const distance = spread(pointers);
      if (pinchDistance > 0 && distance > 0) {
        const middle = midpoint(pointers);
        show(zoomBy(view, distance / pinchDistance, inFrame(middle.x, middle.y)));
      }
      pinchDistance = distance;
      dragged = true;
      return;
    }

    const dx = event.clientX - previous.x;
    const dy = event.clientY - previous.y;
    if (Math.abs(dx) > DRAG_SLOP_PX || Math.abs(dy) > DRAG_SLOP_PX) dragged = true;
    if (!isHome(view)) show(panBy(view, dx / box.width, dy / box.height));
  });

  const release = (event: PointerEvent): void => {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinchDistance = 0;
    if (pointers.size === 0) map.classList.remove("map--dragging");
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);

  // A drag that started on a marker must not follow its link when the finger lifts.
  canvas.addEventListener("click", (event) => {
    if (dragged) event.preventDefault();
    dragged = false;
  });

  canvas.addEventListener(
    "wheel",
    (event) => {
      // Plain wheel scrolls the page, as on every other page (02-§5.40).
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      show(zoomBy(view, Math.exp(-event.deltaY * WHEEL_STEP), inFrame(event.clientX, event.clientY)));
    },
    { passive: false },
  );

  map.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || isHome(view)) return;
    const step: Record<string, [number, number]> = {
      ArrowLeft: [-KEY_PAN, 0],
      ArrowRight: [KEY_PAN, 0],
      ArrowUp: [0, -KEY_PAN],
      ArrowDown: [0, KEY_PAN],
    };
    const move = step[event.key];
    if (!move) return;
    event.preventDefault();
    // The arrow moves the view, so the drawing goes the other way.
    show(panBy(view, -move[0], -move[1]));
  });

  // Tabbing through the markers while zoomed in would otherwise put focus on a marker
  // outside the frame, with nothing to see. The view follows the focus instead.
  canvas.addEventListener("focusin", (event) => {
    if (isHome(view) || !(event.target instanceof Element)) return;
    const marker = event.target.closest(".map__marker");
    if (!marker) return;
    const frame = map.getBoundingClientRect();
    const pin = marker.getBoundingClientRect();
    const dx = (frame.left + frame.width / 2 - (pin.left + pin.width / 2)) / frame.width;
    const dy = (frame.top + frame.height / 2 - (pin.top + pin.height / 2)) / frame.height;
    // Only when it is actually out of sight; otherwise every tab would recentre the map.
    const outside = pin.right < frame.left || pin.left > frame.right || pin.bottom < frame.top || pin.top > frame.bottom;
    if (outside) show(panBy(view, dx, dy));
  });

  controls.hidden = false;
  show(HOME);
}

/** The distance between the first two pointers. */
function spread(pointers: Map<number, Point>): number {
  const [a, b] = [...pointers.values()];
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** The point halfway between the first two pointers. */
function midpoint(pointers: Map<number, Point>): Point {
  const [a, b] = [...pointers.values()];
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
