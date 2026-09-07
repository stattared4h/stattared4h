/**
 * 02-§5.23–5.27, 02-§5.30, 03-§9: the map — projection, markers, and the optional
 * drawn background. Pure functions on small inputs; the background files are written
 * to a temporary directory only for `loadMapBackground`.
 */
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, test } from "node:test";
import {
  loadMapBackground,
  MAP_DESCRIPTION,
  mapFrame,
  parseMapBackground,
  projectPoint,
  renderMap,
  renderMapSvg,
  type MapLocation,
} from "../../source/ts/build/map.ts";

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

  test("no places, no frame", () => {
    assert.equal(mapFrame([]), null);
  });
});

describe("renderMap (02-§5.23, 02-§5.27)", () => {
  test("one link per place with the base path, the name as text and a percent position", () => {
    const { html, warnings } = renderMap(PLACES, { base: "/prov/" });
    assert.deepEqual(warnings, []);
    assert.match(html, /^<div class="map"><svg class="map__drawing" viewBox="0 0 800 600" role="img" aria-label="Karta över Stättared med gårdens hagar"><title>Karta över Stättared med gårdens hagar<\/title>/);
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
