/**
 * 02-§5.40, 02-§5.42–5.43, 03-§9.6, ADR 0020: the map's view — zoom around an anchor,
 * panning, and the limits that keep the drawing covering its frame.
 *
 * The view is unit-free: positions are fractions of the map's frame, so the same numbers
 * hold at 360 px and at 1280 px, and the whole thing is testable without a browser
 * (`CL-§2.14`).
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  clampView,
  HOME,
  isHome,
  MAX_SCALE,
  MIN_SCALE,
  panBy,
  pointUnder,
  zoomBy,
  type MapView,
} from "../../source/ts/domain/map-view.ts";

/** Where the drawing's edges land in the frame: [left, right] in frame fractions. */
function edges(view: MapView): [number, number] {
  return [view.x, view.x + view.scale];
}

describe("the starting view (02-§5.45)", () => {
  test("home is the whole drawing, unmoved", () => {
    assert.deepEqual(HOME, { x: 0, y: 0, scale: 1 });
    assert.ok(isHome(HOME));
    assert.deepEqual(clampView(HOME), HOME);
  });

  test("a view is never changed in place", () => {
    const view: MapView = { x: -0.5, y: -0.5, scale: 2 };
    const before = { ...view };
    zoomBy(view, 1.5, { x: 0.5, y: 0.5 });
    panBy(view, 0.1, 0.1);
    clampView(view);
    assert.deepEqual(view, before, "the functions return new views");
  });
});

describe("zooming around an anchor (02-§5.40)", () => {
  test("the point under the fingers stays under the fingers", () => {
    const anchor = { x: 0.3, y: 0.7 };
    const before = pointUnder(HOME, anchor);
    const after = pointUnder(zoomBy(HOME, 2.5, anchor), anchor);
    assert.ok(Math.abs(after.x - before.x) < 1e-9, `x ${after.x} vs ${before.x}`);
    assert.ok(Math.abs(after.y - before.y) < 1e-9, `y ${after.y} vs ${before.y}`);
  });

  test("it holds when zooming again from an already zoomed view", () => {
    const first = zoomBy(HOME, 3, { x: 0.2, y: 0.2 });
    const anchor = { x: 0.8, y: 0.4 };
    const before = pointUnder(first, anchor);
    const after = pointUnder(zoomBy(first, 1.5, anchor), anchor);
    assert.ok(Math.abs(after.x - before.x) < 1e-9);
    assert.ok(Math.abs(after.y - before.y) < 1e-9);
  });

  test("the scale stays between the limits, however hard the visitor pinches", () => {
    assert.equal(zoomBy(HOME, 100, { x: 0.5, y: 0.5 }).scale, MAX_SCALE);
    assert.equal(zoomBy(HOME, 0.01, { x: 0.5, y: 0.5 }).scale, MIN_SCALE);
    assert.equal(MIN_SCALE, 1, "1 is the whole drawing; there is nothing to zoom out to");
  });

  test("zooming all the way out lands exactly on home, not near it", () => {
    const zoomed = panBy(zoomBy(HOME, 4, { x: 0.9, y: 0.1 }), -0.2, 0.3);
    const out = zoomBy(zoomed, 0.001, { x: 0.5, y: 0.5 });
    assert.deepEqual(out, HOME);
    assert.ok(isHome(out));
  });
});

describe("the drawing always covers its frame (02-§5.43)", () => {
  test("no edge is ever dragged inside the frame", () => {
    const views = [
      zoomBy(HOME, 2, { x: 0, y: 0 }),
      zoomBy(HOME, 2, { x: 1, y: 1 }),
      panBy(zoomBy(HOME, 3, { x: 0.5, y: 0.5 }), 5, -5),
      panBy(zoomBy(HOME, 1.2, { x: 0.5, y: 0.5 }), -9, 9),
    ];
    for (const view of views) {
      const [left, right] = edges(view);
      assert.ok(left <= 1e-9, `left edge ${left} must not come inside the frame`);
      assert.ok(right >= 1 - 1e-9, `right edge ${right} must not come inside the frame`);
      assert.ok(view.y <= 1e-9 && view.y + view.scale >= 1 - 1e-9, "and the same up and down");
    }
  });

  test("at 1× there is nowhere to pan: the view stays home", () => {
    assert.deepEqual(panBy(HOME, 0.5, -0.5), HOME);
  });

  test("zoomed in, panning moves the view and stops at the edge", () => {
    const view = zoomBy(HOME, 2, { x: 0.5, y: 0.5 });
    const moved = panBy(view, 0.1, 0);
    assert.ok(moved.x > view.x, "the drawing follows the finger");
    assert.equal(panBy(view, 9, 0).x, 0, "and stops when the left edge reaches the frame");
    assert.equal(panBy(view, -9, 0).x, 1 - 2, "and at the right edge");
  });
});
