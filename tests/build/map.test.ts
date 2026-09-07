/**
 * 02-§5.23–5.27, 02-§5.30, 03-§9: the map — projection, markers, and the optional
 * drawn background. Pure functions on small inputs; the background files are written
 * to a temporary directory only for `loadMapBackground`.
 */
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, test } from "node:test";
import {
  LABEL_METRICS,
  loadMapBackground,
  MAP_DESCRIPTION,
  mapFrame,
  parseMapBackground,
  placeLabels,
  projectPoint,
  renderMap,
  renderMapSvg,
  type MapLocation,
} from "../../source/ts/build/map.ts";

const ROOT = path.resolve(import.meta.dirname, "..", "..");

const PLACES: MapLocation[] = [
  { id: "gethagen", name: "Gethagen", lat: 57.4123, lon: 12.2134 },
  { id: "stora-hagen", name: "Stora hagen", lat: 57.411, lon: 12.212 },
  { id: "ovre-hagen", name: "Övre hagen", lat: 57.414, lon: 12.2168 },
];

/** A small drawing, the way an SVG editor saves one. */
const DRAWING =
  '<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
  '<rect id="map-barn" x="10" y="10" width="50" height="30" fill="#dfe3dd"/></svg>';
const EDGES = "north: 57.4150\nsouth: 57.4100\nwest: 12.2100\neast: 12.2180\n";

describe("mapFrame and projectPoint (03-§9.1)", () => {
  test("the frame encloses every place with the margin, and keeps the drawing's aspect", () => {
    const frame = mapFrame(PLACES, { width: 800, height: 600, margin: 0.1 });
    assert.ok(frame);
    assert.equal(frame.width, 800);
    assert.equal(frame.height, 600);
    for (const place of PLACES) {
      const { x, y } = projectPoint(place, frame);
      assert.ok(x >= 80 - 1e-6 && x <= 720 + 1e-6, `${place.id} x=${x} inside the margin`);
      assert.ok(y >= 60 - 1e-6 && y <= 540 + 1e-6, `${place.id} y=${y} inside the margin`);
    }
    // The southernmost place sits on the lower margin line and the northernmost on the upper.
    assert.ok(Math.abs(projectPoint(PLACES[1], frame).y - 540) < 1e-6);
    assert.ok(Math.abs(projectPoint(PLACES[2], frame).y - 60) < 1e-6);
  });

  test("north is up and east is right", () => {
    const frame = mapFrame(PLACES);
    assert.ok(frame);
    const north = projectPoint(PLACES[2], frame);
    const south = projectPoint(PLACES[1], frame);
    assert.ok(north.y < south.y);
    assert.ok(north.x > south.x);
  });

  test("a single place, or places on one line, still get a frame", () => {
    const one = mapFrame([PLACES[0]]);
    assert.ok(one);
    const { x, y } = projectPoint(PLACES[0], one);
    assert.ok(Math.abs(x - one.width / 2) < 1e-6 && Math.abs(y - one.height / 2) < 1e-6, "centred");
    const line = mapFrame([PLACES[0], { ...PLACES[0], lon: PLACES[0].lon + 0.001 }]);
    assert.ok(line && line.north > line.south && line.east > line.west);
  });

  test("the frame follows the shape of the ground, within limits", () => {
    // The three places span 0.003° of latitude and 0.0048° of longitude at 57.4° N:
    // taller than wide on the ground, so the frame is taller than 4:3.
    const tall = mapFrame(PLACES);
    assert.ok(tall && tall.height > tall.width * 0.9 && tall.height <= tall.width * 1.25, `${tall?.width}×${tall?.height}`);
    const wide = mapFrame([PLACES[0], { ...PLACES[0], lon: PLACES[0].lon + 0.05 }]);
    assert.ok(wide && wide.height === Math.round(wide.width * 0.6), "never flatter than 0.6");
    const explicit = mapFrame(PLACES, { width: 400, height: 100 });
    assert.deepEqual([explicit?.width, explicit?.height], [400, 100]);
  });

  test("no places, no frame", () => {
    assert.equal(mapFrame([]), null);
  });
});

describe("renderMap (02-§5.23, 02-§5.27)", () => {
  test("one link per place with the base path, the name as text and a percent position", () => {
    const { html, warnings } = renderMap(PLACES, { base: "/prov/" });
    assert.deepEqual(warnings, []);
    assert.match(html, /^<div class="map"><svg class="map__drawing" viewBox="0 0 800 \d+" role="img" aria-label="Karta över Stättared med gårdens hagar"><title>Karta över Stättared med gårdens hagar<\/title>/);
    const markers = [...html.matchAll(/<a class="map__marker" href="([^"]+)" style="left: ([\d.]+)%; top: ([\d.]+)%" data-place="([^"]+)">.*?<span class="map__label">([^<]+)<\/span><\/a>/g)];
    assert.equal(markers.length, PLACES.length);
    assert.deepEqual(markers.map((m) => m[1]), ["/prov/plats/gethagen/", "/prov/plats/stora-hagen/", "/prov/plats/ovre-hagen/"]);
    assert.deepEqual(markers.map((m) => m[5]), ["Gethagen", "Stora hagen", "Övre hagen"]);
    for (const marker of markers) {
      assert.ok(Number(marker[2]) >= 0 && Number(marker[2]) <= 100);
      assert.ok(Number(marker[3]) >= 0 && Number(marker[3]) <= 100);
    }
    assert.doesNotMatch(html, /https?:|<script|<image/, "no external resources (02-§5.26)");
  });

  test("names are escaped and the base path is checked", () => {
    const { html } = renderMap([{ id: "x", name: "Hagen <vid> ån & bäcken", lat: 57, lon: 12 }], { base: "/" });
    assert.match(html, /Hagen &lt;vid&gt; ån &amp; bäcken/);
    assert.throws(() => renderMap(PLACES, { base: "prov" }), /Base path/);
  });

  test("without places the map is empty", () => {
    assert.deepEqual(renderMap([], { base: "/" }), { html: "", warnings: [] });
  });
});

describe("drawn background (02-§5.30, 03-§9.2)", () => {
  test("the drawing's viewBox is the frame and its content is embedded under the markers", () => {
    const background = parseMapBackground(DRAWING, EDGES);
    assert.equal(background.width, 400);
    assert.equal(background.height, 300);
    assert.deepEqual([background.north, background.south, background.west, background.east], [57.415, 57.41, 12.21, 12.218]);
    assert.equal(background.content, '<rect id="map-barn" x="10" y="10" width="50" height="30" fill="#dfe3dd"/>');

    const { html, warnings } = renderMap(PLACES, { base: "/", background });
    assert.deepEqual(warnings, []);
    assert.match(html, /viewBox="0 0 400 300"/);
    const backgroundAt = html.indexOf('<g class="map__background">');
    assert.ok(backgroundAt > -1 && backgroundAt < html.indexOf('<a class="map__marker"'), "background before markers");
    assert.match(html, /map-barn/);

    // Gethagen: lon 12.2134 of 12.2100–12.2180 → 42.5 %; lat 57.4123 of 57.4150–57.4100 → 54 %.
    assert.match(html, /href="\/plats\/gethagen\/" style="left: 42\.5%; top: 54%"/);
  });

  test("a place outside the drawing is left out with a warning", () => {
    const background = parseMapBackground(DRAWING, "north: 57.4130\nsouth: 57.4100\nwest: 12.2100\neast: 12.2180\n");
    const { html, warnings } = renderMap(PLACES, { base: "/", background });
    assert.doesNotMatch(html, /ovre-hagen/);
    assert.match(html, /gethagen/);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /background\.yaml: platsen ovre-hagen .* utanför ritningen/);
  });

  test("a viewBox with an offset is translated away; width/height in px are accepted", () => {
    const offset = parseMapBackground('<svg viewBox="100 50 400 300"><circle r="1"/></svg>', EDGES);
    assert.equal(offset.content, '<g transform="translate(-100 -50)"><circle r="1"/></g>');
    const px = parseMapBackground('<svg width="640px" height="480"><circle r="1"/></svg>', EDGES);
    assert.deepEqual([px.width, px.height], [640, 480]);
  });

  test("the SVG is renderered by renderMapSvg with the description", () => {
    const frame = { width: 10, height: 5, north: 1, south: 0, west: 0, east: 1 };
    const svg = renderMapSvg(frame);
    assert.match(svg, new RegExp(`<title>${MAP_DESCRIPTION}</title>`));
    assert.match(svg, /<rect class="map__ground" width="10" height="5"\/>/);
    assert.doesNotMatch(svg, /map__background/);
  });

  test("scripts, styles, images and external links are refused with a Swedish message", () => {
    for (const bad of [
      '<svg viewBox="0 0 1 1"><script>alert(1)</script></svg>',
      '<svg viewBox="0 0 1 1"><style>body{display:none}</style></svg>',
      '<svg viewBox="0 0 1 1"><image href="x.png"/></svg>',
      '<svg viewBox="0 0 1 1"><a href="https://example.com/">x</a></svg>',
      '<svg viewBox="0 0 1 1"><a xlink:href="//example.com/">x</a></svg>',
      '<svg viewBox="0 0 1 1"><foreignObject/></svg>',
    ]) {
      assert.throws(() => parseMapBackground(bad, EDGES), /background\.svg: innehåller .* inte tillåts/, bad);
    }
    assert.throws(() => parseMapBackground("<p>not svg</p>", EDGES), /hittar inget <svg>/);
    assert.throws(() => parseMapBackground("<svg><circle/></svg>", EDGES), /saknar viewBox/);
  });

  test("the edges must be four numbers with north above south and east right of west", () => {
    assert.throws(() => parseMapBackground(DRAWING, "north: 1\n"), /fältet south saknas/);
    assert.throws(() => parseMapBackground(DRAWING, "north: 1\nsouth: 2\nwest: 0\neast: 1\n"), /north .* större än south/);
    assert.throws(() => parseMapBackground(DRAWING, "north: 2\nsouth: 1\nwest: 1\neast: 0\n"), /east .* större än west/);
    assert.throws(() => parseMapBackground(DRAWING, "north: 2\nsouth: 1\nwest: 0\neast: 1\nlat: 3\n"), /okänt fält lat/);
    assert.throws(() => parseMapBackground(DRAWING, "- 1\n"), /fälten north, south, west och east/);
  });

  test("loadMapBackground: null without files, an error with only one, the background with both", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "s4h-map-"));
    try {
      assert.equal(await loadMapBackground(dir), null);
      await writeFile(path.join(dir, "background.svg"), DRAWING);
      await assert.rejects(loadMapBackground(dir), /background\.yaml saknas/);
      await writeFile(path.join(dir, "background.yaml"), EDGES);
      const background = await loadMapBackground(dir);
      assert.equal(background?.width, 400);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe("label placement (02-§5.33, 03-§9.3)", () => {
  /** Drawing units per pixel at the reference width the build calculates for. */
  const UNITS_PER_PX = 800 / 360;

  test("places far apart keep their label under the marker", () => {
    const sides = placeLabels(
      [
        { id: "a", name: "Ettan", x: 100, y: 100 },
        { id: "b", name: "Tvåan", x: 600, y: 500 },
      ],
      800,
    );
    assert.deepEqual([...sides.values()], ["below", "below"]);
  });

  test("two markers a finger apart get their labels on different sides", () => {
    // 30 px apart at 360 px width: well inside the 44 px tap target, so the two
    // labels under the markers would cover each other.
    const sides = placeLabels(
      [
        { id: "a", name: "Ettan", x: 400, y: 300 },
        { id: "b", name: "Tvåan", x: 400 + 30 * UNITS_PER_PX, y: 300 },
      ],
      800,
    );
    assert.equal(sides.get("a"), "below");
    assert.notEqual(sides.get("b"), "below", "the second label moves out of the way");
  });

  test("the placement does not depend on the order the places arrive in", () => {
    const markers = [
      { id: "a", name: "Ettan", x: 400, y: 300 },
      { id: "b", name: "Tvåan", x: 420, y: 310 },
      { id: "c", name: "Trean", x: 440, y: 295 },
      { id: "d", name: "Fyran", x: 405, y: 340 },
    ];
    const forwards = placeLabels(markers, 800);
    const backwards = placeLabels([...markers].reverse(), 800);
    assert.deepEqual([...forwards].sort(), [...backwards].sort());
  });

  test("when every side is taken the label stays under its own marker", () => {
    // Six places on the same spot: there are four sides, so two must give up. A label
    // that stays put is honest; one flung across the map would point at nothing.
    const markers = Array.from({ length: 6 }, (_, i) => ({
      id: `p${i}`,
      name: "Hagen",
      x: 400,
      y: 300,
    }));
    const sides = placeLabels(markers, 800);
    assert.equal(sides.size, 6);
    assert.equal(sides.get("p0"), "below");
    for (const side of sides.values()) {
      assert.ok(["below", "above", "right", "left"].includes(side), side);
    }
  });

  test("renderMap marks the side on the marker, and only when it is not the default", () => {
    const background = parseMapBackground(DRAWING, EDGES);
    const crowded: MapLocation[] = [
      { id: "ettan", name: "1:an", lat: 57.4125, lon: 12.214 },
      { id: "tvaan", name: "2:an", lat: 57.4125, lon: 12.2142 },
    ];
    const { html } = renderMap(crowded, { base: "/", background });
    assert.match(html, /<a class="map__marker" href="\/plats\/ettan\//, "the first keeps the plain class");
    assert.match(html, /<a class="map__marker map__marker--label-\w+" href="\/plats\/tvaan\//);
  });

  test("the estimate uses the measurements in tokens.css", async () => {
    const css = await readFile(path.join(ROOT, "source/assets/css/tokens.css"), "utf8");
    const token = (name: string): number => {
      const match = css.match(new RegExp(`${name}\\s*:\\s*(\\d+)px`));
      assert.ok(match, `${name} saknas i tokens.css`);
      return Number(match[1]);
    };
    assert.equal(LABEL_METRICS.tapTarget, token("--tap-target-min"));
    assert.equal(LABEL_METRICS.fontSize, token("--font-size-small"));
    assert.equal(LABEL_METRICS.padding, token("--space-xs"));
  });
});

describe("the map never shows which animals are where (02-§5.32)", () => {
  test("a marker carries the place name and nothing else", () => {
    const { html } = renderMap(PLACES, { base: "/" });
    for (const marker of html.matchAll(/<a class="map__marker[^"]*"[^>]*>(.*?)<\/a>/g)) {
      assert.match(marker[1], /^<span class="map__pin" aria-hidden="true"><\/span><span class="map__label">[^<]+<\/span>$/);
    }
  });
});
