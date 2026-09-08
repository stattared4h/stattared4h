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
  type LabelSide,
  type MapLocation,
} from "../../source/ts/build/map.ts";
import { PLACE_SYMBOLS } from "../../source/ts/build/symbols.ts";
import { NAMES_AT_SCALE } from "../../source/ts/domain/map-view.ts";

const ROOT = path.resolve(import.meta.dirname, "..", "..");

/** What every place needs beyond its position, so the popup has something to show. */
const FACTS = { note: null, accessibility: "Hit når man med rullstol och barnvagn", species: "Getter" };

const PLACES: MapLocation[] = [
  { id: "brackebur", name: "Bräckebur", kind: "djurplats", lat: 57.4123, lon: 12.2134, ...FACTS },
  { id: "lygnslatt-1", name: "Lygnslätt 1", kind: "djurplats", lat: 57.411, lon: 12.212, ...FACTS },
  { id: "stora-grishagen", name: "Stora grishagen", kind: "djurplats", lat: 57.414, lon: 12.2168, ...FACTS },
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
    assert.match(html, /^<div class="map" data-map><div class="map__canvas" data-map-canvas><svg class="map__drawing" viewBox="0 0 800 \d+" role="img" aria-label="Karta över Stättared med gårdens hagar"><title>Karta över Stättared med gårdens hagar<\/title>/);
    const markers = [...html.matchAll(/<a class="map__marker(?: map__marker--label-[\w-]+)? map__marker--wide-[\w-]+(?: map__marker--zoom-[\w-]+)?" href="([^"]+)" style="left: ([\d.]+)%; top: ([\d.]+)%" data-place="([^"]+)"[^>]*>.*?<span class="map__label">([^<]+)<\/span><\/a>/g)];
    assert.equal(markers.length, PLACES.length);
    assert.deepEqual(markers.map((m) => m[1]), ["/prov/plats/brackebur/", "/prov/plats/lygnslatt-1/", "/prov/plats/stora-grishagen/"]);
    assert.deepEqual(markers.map((m) => m[5]), ["Bräckebur", "Lygnslätt 1", "Stora grishagen"]);
    for (const marker of markers) {
      assert.ok(Number(marker[2]) >= 0 && Number(marker[2]) <= 100);
      assert.ok(Number(marker[3]) >= 0 && Number(marker[3]) <= 100);
    }
    assert.doesNotMatch(html, /https?:|<script|<image/, "no external resources (02-§5.26)");
  });

  test("names are escaped and the base path is checked", () => {
    const { html } = renderMap([{ id: "x", name: "Hagen <vid> ån & bäcken", kind: "djurplats", lat: 57, lon: 12, ...FACTS }], { base: "/" });
    assert.match(html, /Hagen &lt;vid&gt; ån &amp; bäcken/);
    assert.throws(() => renderMap(PLACES, { base: "prov" }), /Base path/);
  });

  test("without places the map is empty", () => {
    assert.deepEqual(renderMap([], { base: "/" }), { html: "", warnings: [] });
  });

  test("the zoom controls are written, hidden until the client code shows them (02-§5.41, 02-§5.45)", () => {
    const { html } = renderMap(PLACES, { base: "/" });
    // Outside the canvas, so they keep their place when the drawing is zoomed.
    const canvasEnd = html.indexOf("</div>");
    assert.ok(html.indexOf('data-map-controls') > canvasEnd, "the controls follow the canvas");
    assert.match(html, /<div class="map__controls" hidden data-map-controls>/);
    for (const [action, label] of [["in", "Zooma in"], ["out", "Zooma ut"], ["home", "Visa hela kartan"]]) {
      assert.match(
        html,
        new RegExp(`<button class="icon-button map__control" type="button" aria-label="${label}"(?: hidden)? data-map-zoom="${action}">`),
        `a button for ${action}`,
      );
    }
    // "Visa hela kartan" is meaningless until the map is zoomed, so it starts hidden too.
    assert.match(html, /aria-label="Visa hela kartan" hidden data-map-zoom="home"/);
    assert.doesNotMatch(html, /https?:|<script|<image/, "no external resources (02-§5.26)");
  });

  test("every marker carries the symbol for its kind (02-§5.38)", () => {
    const mixed: MapLocation[] = [
      { id: "cafeet", name: "Caféet", kind: "mat", lat: 57.4123, lon: 12.2134, ...FACTS, species: "" },
      { id: "brackebur", name: "Bräckebur", kind: "djurplats", lat: 57.411, lon: 12.212, ...FACTS },
    ];
    const { html } = renderMap(mixed, { base: "/" });
    assert.match(html, /<span class="map__pin map__pin--mat" aria-hidden="true"><svg class="map__symbol"/);
    assert.match(html, /<span class="map__pin map__pin--djurplats" aria-hidden="true"><svg class="map__symbol"/);
    assert.ok(html.includes(PLACE_SYMBOLS.mat), "the café is drawn with the food symbol");
    assert.ok(html.includes(PLACE_SYMBOLS.djurplats), "the paddock is drawn with the animal symbol");
    // The name is still what the marker is called; the symbol says nothing out loud.
    assert.match(html, /<span class="map__label">Caféet<\/span>/);
    assert.doesNotMatch(html, /https?:|<script|<image/, "no external resources (02-§5.26)");
  });
});

describe("the popup on a marker (02-§5.46–5.49, 03-§9.7)", () => {
  test("each marker carries what the popup shows, and the empty popup rides in the canvas", () => {
    const places: MapLocation[] = [
      { id: "brackebur", name: "Bräckebur", kind: "djurplats", lat: 57.4123, lon: 12.2134,
        note: "Här går bockarna.", accessibility: "Hit når man med rullstol och barnvagn", species: "Getter" },
      { id: "cafeet", name: "Caféet", kind: "mat", lat: 57.411, lon: 12.212,
        note: null, accessibility: "Hit når man inte med rullstol eller barnvagn", species: "" },
    ];
    const { html } = renderMap(places, { base: "/" });

    const paddock = /<a class="map__marker[^"]*"[^>]*data-place="brackebur"[^>]*>/.exec(html)?.[0] ?? "";
    assert.match(paddock, /data-kind="djurplats"/);
    assert.match(paddock, /data-species="Getter"/);
    assert.match(paddock, /data-note="Här går bockarna\."/);
    assert.match(paddock, /data-access="Hit når man med rullstol och barnvagn"/);

    const cafe = /<a class="map__marker[^"]*"[^>]*data-place="cafeet"[^>]*>/.exec(html)?.[0] ?? "";
    assert.match(cafe, /data-kind="mat"/);
    assert.doesNotMatch(cafe, /data-species=/, "only a djurplats reports animals (02-§5.47)");
    assert.doesNotMatch(cafe, /data-note=/, "a place without a note carries no empty attribute");
    assert.match(cafe, /data-access="Hit når man inte med rullstol eller barnvagn"/);

    // The popup is written once and empty; the client fills it and opens it in the middle
    // of the screen (03-§9.7). A <dialog> without an `open` attribute shows nothing, which
    // is what keeps the map a still picture without JavaScript (02-§5.49).
    assert.match(html, /<dialog class="dialog map-popup" data-map-popup aria-labelledby="map-popup-name">/);
    // The heading is not written empty here; the client builds it (03-§9.7).
    assert.doesNotMatch(html, /<h2[^>]*><\/h2>/, "no empty heading in the built page");
    assert.match(html, /<button class="icon-button dialog__close" type="button" aria-label="Stäng" data-map-popup-close>/);
    assert.match(html, /<div class="map-popup__facts" data-map-popup-facts><\/div><\/div><\/dialog>$/);
    assert.doesNotMatch(html, /<dialog[^>]* open/, "closed until the client opens it");
    assert.ok(html.indexOf("data-map-popup") > html.indexOf("data-map-controls"), "after the map, not inside it");
    assert.doesNotMatch(html, /https?:|<script|<image/, "no external resources (02-§5.26)");
  });

  test("a name with markup in it is escaped in the attributes too", () => {
    const { html } = renderMap(
      [{ id: "x", name: "Hagen", kind: "djurplats", lat: 57, lon: 12,
         note: 'Sa "hej" & <log> ut', accessibility: "Hit når man med rullstol och barnvagn", species: "Får" }],
      { base: "/" },
    );
    assert.match(html, /data-note="Sa &quot;hej&quot; &amp; &lt;log&gt; ut"/);
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
    assert.ok(backgroundAt > -1 && backgroundAt < html.indexOf('<a class="map__marker'), "background before markers");
    assert.match(html, /map-barn/);

    // Bräckebur: lon 12.2134 of 12.2100–12.2180 → 42.5 %; lat 57.4123 of 57.4150–57.4100 → 54 %.
    assert.match(html, /href="\/plats\/brackebur\/" style="left: 42\.5%; top: 54%"/);
  });

  test("a place outside the drawing is left out with a warning", () => {
    const background = parseMapBackground(DRAWING, "north: 57.4130\nsouth: 57.4100\nwest: 12.2100\neast: 12.2180\n");
    const { html, warnings } = renderMap(PLACES, { base: "/", background });
    assert.doesNotMatch(html, /stora-grishagen/);
    assert.match(html, /brackebur/);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /background\.yaml: platsen stora-grishagen .* utanför ritningen/);
  });

  test("a viewBox with an offset is translated away; width/height in px are accepted", () => {
    const offset = parseMapBackground('<svg viewBox="100 50 400 300"><circle r="1"/></svg>', EDGES);
    assert.equal(offset.content, '<g transform="translate(-100 -50)"><circle r="1"/></g>');
    const px = parseMapBackground('<svg width="640px" height="480"><circle r="1"/></svg>', EDGES);
    assert.deepEqual([px.width, px.height], [640, 480]);
  });

  test("the SVG is rendered by renderMapSvg with the description", () => {
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

describe("label placement (02-§5.33, 02-§5.53, 03-§9.3)", () => {
  /** Drawing units per pixel at the reference width the build calculates for. */
  const UNITS_PER_PX = 800 / 360;
  /** The four slanted positions, tried before the four straight ones (02-§5.53). */
  const SLANTED = ["above-left", "above-right", "below-left", "below-right"];

  test("places far apart both get the preferred slanted position", () => {
    // A slanted label leaves the lane straight below and straight beside the marker
    // free for the neighbour, so it is tried before any straight one (02-§5.53).
    const sides = placeLabels(
      [
        { id: "a", name: "Ettan", x: 300, y: 150 },
        { id: "b", name: "Tvåan", x: 500, y: 350 },
      ],
      800,
      600,
    );
    assert.deepEqual([...sides.values()], ["above-left", "above-left"]);
  });

  test("the order tries the pasture's own diagonal before the one across it", () => {
    // The bands run north-west to south-east, so up-left and down-right follow a paddock
    // and the other diagonal crosses the fence (02-§5.53). A marker hemmed in on the
    // pasture's axis falls to the crossing diagonal, never the other way round.
    const alone = placeLabels([{ id: "a", name: "1:an", x: 400, y: 300 }], 800, 600);
    assert.equal(alone.get("a"), "above-left", "the pasture's axis comes first");

    // Blocked up-left by the drawing's left edge and down-right by a neighbour's pin.
    const hemmed = placeLabels(
      [
        { id: "granne", name: "2:an", x: 173, y: 389 },
        { id: "a", name: "1:an", x: 60, y: 300 },
      ],
      800,
      600,
    );
    assert.ok(
      ["above-right", "below-left"].includes(hemmed.get("a") as string),
      `faller till den korsande diagonalen, fick ${hemmed.get("a")}`,
    );
  });

  test("a slanted position wins over a straight one that is equally free", () => {
    const sides = placeLabels([{ id: "ensam", name: "Hagen", x: 400, y: 300 }], 800, 600);
    assert.ok(
      SLANTED.includes(sides.get("ensam") as string),
      `en ensam markör ska få ett snett läge, fick ${sides.get("ensam")}`,
    );
  });

  test("the four numbered paddocks label along their band, not across the fence", () => {
    // The pasture is divided into bands running north-west to south-east, so 1:an to
    // 4:an step down and to the left. A label straight below the marker drifts across
    // the band into the neighbouring paddock; up and to the left follows it (issue #50).
    // The positions are the ones the build projects from the farm's own coordinates
    // onto the 1000 × 782 drawing.
    const paddocks = [
      { id: "ettan", name: "1:an", x: 820.8, y: 272.7 },
      { id: "tvaan", name: "2:an", x: 663.2, y: 421.7 },
      { id: "trean", name: "3:an", x: 486.3, y: 529.1 },
      { id: "fyran", name: "4:an", x: 321.8, y: 654.2 },
    ];
    for (const width of [LABEL_METRICS.referenceWidth, LABEL_METRICS.wideWidth]) {
      const sides = placeLabels(paddocks, 1000, 782, width);
      assert.deepEqual(
        [...sides.values()],
        ["above-left", "above-left", "above-left", "above-left"],
        `vid ${width} px ska alla fyra hagetiketter ligga snett upp till vänster`,
      );
    }
  });

  test("no label crosses the edge of the drawing, wherever the marker stands", () => {
    // Every position along the border, so a marker in each corner and along each side
    // has to turn its label inwards (02-§5.53).
    const markers = [];
    for (let x = 20; x <= 780; x += 60) {
      for (let y = 20; y <= 580; y += 60) {
        markers.push({ id: `p-${x}-${y}`, name: "Lygnslätt 2", x, y });
      }
    }
    const sides = placeLabels(markers, 800, 600);
    assert.equal(sides.size, markers.length);
    // Nothing is placed off the drawing: a marker with no room left hides its label
    // rather than hanging it over the edge.
    assert.ok([...sides.values()].every((side) => side !== undefined));
  });

  test("a place at the edge turns its label inwards", () => {
    // The drawing is 360 × 270 px at the reference width. A marker in the top-left
    // corner has room neither above nor to the left, so the label turns in and down.
    const sides = placeLabels(
      [
        { id: "topp", name: "Lygnslätt 2", x: 40, y: 20 },
        { id: "botten", name: "Lygnslätt 2", x: 40, y: 580 },
      ],
      800,
      600,
    );
    assert.ok(
      ["below-right", "below", "right"].includes(sides.get("topp") as string),
      `hörnet uppe till vänster vänder etiketten in och ned, fick ${sides.get("topp")}`,
    );
    assert.ok(
      ["above-right", "above", "right"].includes(sides.get("botten") as string),
      `hörnet nere till vänster vänder etiketten in och upp, fick ${sides.get("botten")}`,
    );
  });

  test("no label is placed behind the zoom controls", () => {
    // The controls sit over the bottom-right corner (02-§5.41). A label there would be
    // readable only to whoever moves the button out of the way.
    const sides = placeLabels([{ id: "hornet", name: "Lygnslätt 2", x: 780, y: 570 }], 800, 600);
    assert.equal(sides.get("hornet"), "hidden", "hellre dold än bakom en knapp");
  });

  test("two markers a finger apart get their labels in different positions", () => {
    // 30 px apart at 360 px width: well inside the 44 px tap target, so the two
    // labels under the markers would cover each other.
    const sides = placeLabels(
      [
        { id: "a", name: "Ettan", x: 400, y: 300 },
        { id: "b", name: "Tvåan", x: 400 + 30 * UNITS_PER_PX, y: 300 },
      ],
      800,
      600,
    );
    assert.equal(sides.get("a"), "above-left");
    assert.notEqual(sides.get("b"), "above-left", "the second label moves out of the way");
  });

  test("the placement does not depend on the order the places arrive in", () => {
    const markers = [
      { id: "a", name: "Ettan", x: 400, y: 300 },
      { id: "b", name: "Tvåan", x: 420, y: 310 },
      { id: "c", name: "Trean", x: 440, y: 295 },
      { id: "d", name: "Fyran", x: 405, y: 340 },
    ];
    const forwards = placeLabels(markers, 800, 600);
    const backwards = placeLabels([...markers].reverse(), 800, 600);
    assert.deepEqual([...forwards].sort(), [...backwards].sort());
  });

  test("when every position is taken the extra labels are hidden, not stacked", () => {
    // Ten places on the exact same spot, in the middle of the drawing. Six labels fit,
    // not eight: `above` overlaps both slanted positions above the marker and `below`
    // overlaps both below, so on a single spot the straight pair up and down is never
    // free. The four left over are hidden rather than stacked (02-§5.54): here, away from
    // the edge, a label over a label makes both unreadable and wins nothing, and the
    // place is still in the list under the map (02-§5.24).
    const markers = Array.from({ length: 10 }, (_, i) => ({
      id: `p${i}`,
      name: "Hagen",
      x: 400,
      y: 300,
    }));
    const sides = placeLabels(markers, 800, 600);
    assert.equal(sides.size, 10);
    assert.equal(sides.get("p0"), "above-left");
    assert.equal(
      [...sides.values()].filter((side) => side !== "hidden").length,
      6,
      "six labels fit on one spot",
    );
    assert.equal([...sides.values()].filter((side) => side === "hidden").length, 4);
  });

  test("a label that fits nowhere is hidden, and leaves room for the next one", () => {
    // The edge is the rule that never bends (02-§5.54): a name wider than the drawing
    // crosses it in all eight positions, so it is hidden after all. It must then take no
    // room, or a label nobody can see would push aside one that fits.
    const long = "Parkeringen vid toaletterna och vandrarhemmet";
    const granne = { id: "granne", name: "Hagen", x: 150, y: 260 };
    const sides = placeLabels([{ id: "omojlig", name: long, x: 150, y: 150 }, granne], 300, 400);
    assert.equal(sides.get("omojlig"), "hidden");
    assert.equal(
      sides.get("granne"),
      placeLabels([granne], 300, 400).get("granne"),
      "the neighbour lands where it would have without the label nobody can see",
    );
  });

  test("renderMap marks the side on the marker, and only when it is not the default", () => {
    const background = parseMapBackground(DRAWING, EDGES);
    const crowded: MapLocation[] = [
      { id: "ettan", name: "1:an", kind: "djurplats", lat: 57.4125, lon: 12.214, ...FACTS },
      { id: "tvaan", name: "2:an", kind: "djurplats", lat: 57.4125, lon: 12.2142, ...FACTS },
    ];
    const { html } = renderMap(crowded, { base: "/", background });
    assert.match(html, /<a class="map__marker map__marker--label-above-left map__marker--wide-above-left map__marker--zoom-[\w-]+" href="\/plats\/ettan\//, "the first gets the preferred slanted position");
    assert.match(html, /<a class="map__marker map__marker--label-[\w-]+ map__marker--wide-[\w-]+ map__marker--zoom-[\w-]+" href="\/plats\/tvaan\//);
  });

  test("every position the build can choose has a rule in the stylesheet", async () => {
    // The build writes the position as a modifier and the stylesheet places the label.
    // A position with no rule would silently fall back to below — the very bug 02-§5.53
    // fixes — so the two are checked against each other here.
    const css = await readFile(path.join(ROOT, "source/assets/css/layout.css"), "utf8");
    for (const side of [...SLANTED, "above", "right", "left", "hidden"]) {
      assert.ok(
        css.includes(`.map__marker--label-${side} `),
        `.map__marker--label-${side} saknas i layout.css`,
      );
      assert.ok(
        css.includes(`.map__marker--wide-${side} `),
        `.map__marker--wide-${side} saknas i layout.css`,
      );
    }
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
    assert.equal(LABEL_METRICS.containerPadding, token("--space-md"));
    assert.equal(LABEL_METRICS.controlInset, token("--space-sm"));
    assert.equal(LABEL_METRICS.controlGap, token("--space-xs"));
  });

  test("the reference widths are the map's own width, not the window's", async () => {
    // The map sits in `.container`, which keeps `--space-md` at each side. Estimating
    // against the window would let a label hang over the map's edge (02-§5.33).
    const css = await readFile(path.join(ROOT, "source/assets/css/layout.css"), "utf8");
    assert.match(css, /\.container\s*\{[^}]*padding-inline:\s*var\(--space-md\)/, ".container håller --space-md i sidled");
    const gutters = 2 * LABEL_METRICS.containerPadding;
    assert.equal(LABEL_METRICS.referenceWidth, 360 - gutters, "360 px telefon");
    assert.equal(LABEL_METRICS.wideWidth, 600 - gutters, "600 px, där den breda placeringen tar över");
    assert.match(css, /@media \(min-width: 600px\)/, "den breda placeringen tar över vid 600 px");
  });
});

describe("the map never shows which animals are where (02-§5.32)", () => {
  test("a marker carries the place name and its symbol, and nothing else", () => {
    const { html } = renderMap(PLACES, { base: "/" });
    for (const marker of html.matchAll(/<a class="map__marker[^"]*"[^>]*>(.*?)<\/a>/g)) {
      assert.match(
        marker[1],
        /^<span class="map__pin map__pin--\w+" aria-hidden="true"><svg class="map__symbol".*?<\/svg><\/span><span class="map__label">[^<]+<\/span>$/,
        "the pin, the symbol and the name — no species (02-§5.32)",
      );
    }
  });
});

describe("only an edge marker grazes; the middle still hides (02-§5.54)", () => {
  /** Nine markers on one spot in the middle of the drawing. */
  const middle = Array.from({ length: 9 }, (_, i) => ({
    id: `p${i}`,
    name: `Plats ${i}`,
    x: 500,
    y: 390,
  }));

  test("in the middle the labels that do not fit are hidden, never stacked", () => {
    const sides = placeLabels(middle, 1000, 782);
    assert.ok(
      [...sides.values()].some((side) => side === "hidden"),
      "gårdsplanens klunga döljer de etiketter som blir över",
    );
    // Every placed label keeps clear of every other placed label.
    const placed = middle.filter((m) => sides.get(m.id) !== "hidden");
    assert.ok(placed.length > 0 && placed.length < middle.length);
  });

  test("at the drawing's edge the overflow grazes instead of disappearing", () => {
    // Markers stacked in the outer margin, where the off-map places are parked.
    const edge = Array.from({ length: 4 }, (_, i) => ({
      id: `k${i}`,
      name: `Kant ${i}`,
      x: 6,
      y: 200 + i * 4,
    }));
    const sides = placeLabels(edge, 1000, 782);
    assert.ok(
      [...sides.values()].every((side) => side !== "hidden"),
      `en kantmarkörs namn ska aldrig försvinna, fick ${[...sides.values()].join(", ")}`,
    );
  });

  test("the top edge counts too, not only the sides", () => {
    const top = Array.from({ length: 4 }, (_, i) => ({ id: `t${i}`, name: `Topp ${i}`, x: 500 + i * 4, y: 6 }));
    const sides = placeLabels(top, 1000, 782);
    assert.ok([...sides.values()].every((side) => side !== "hidden"));
  });

  test("a label that fits nowhere inside the drawing is hidden even at the edge", () => {
    const long = "Parkeringen vid toaletterna och vandrarhemmet";
    const sides = placeLabels([{ id: "x", name: long, x: 20, y: 20 }], 40, 40);
    assert.equal(sides.get("x"), "hidden");
  });

  test("the placement stays deterministic when positions run out (02-§5.33)", () => {
    const once = placeLabels(middle, 1000, 782);
    const again = placeLabels([...middle].reverse(), 1000, 782);
    assert.deepEqual([...once.entries()].sort(), [...again.entries()].sort());
  });
});

describe("the zoomed map gets its own placement (02-§5.57)", () => {
  test("the build's zoom reference is the narrow map at the scale where names appear", () => {
    // The threshold lives in the domain so the build and map-zoom.ts cannot drift apart.
    assert.equal(NAMES_AT_SCALE, 4);
    assert.equal(LABEL_METRICS.referenceWidth * NAMES_AT_SCALE, 1248);
  });

  test("grazing anywhere places every name, unlike the overview's rule", () => {
    const crowd = Array.from({ length: 9 }, (_, i) => ({
      id: `p${i}`,
      name: `Plats ${i}`,
      x: 500,
      y: 390,
    }));
    const overview = placeLabels(crowd, 1000, 782);
    const zoomed = placeLabels(crowd, 1000, 782, LABEL_METRICS.referenceWidth * NAMES_AT_SCALE, true);
    assert.ok(
      [...overview.values()].some((side) => side === "hidden"),
      "överblicken döljer, som 02-§5.54 kräver",
    );
    assert.ok(
      [...zoomed.values()].every((side) => side !== "hidden"),
      `den inzoomade omgången placerar alla, fick ${[...zoomed.values()].join(", ")}`,
    );
  });

  test("every marker carries a zoom position, so none falls back to the same spot", () => {
    const background = parseMapBackground(DRAWING, EDGES);
    const { html } = renderMap(PLACES, { base: "/", background });
    const markers = [...html.matchAll(/<a class="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(markers.length, PLACES.length);
    for (const className of markers) {
      assert.match(className, /map__marker--zoom-[a-z-]+/, `saknar zoomläge: ${className}`);
    }
  });
});

describe("a label keeps clear of the drawn dot, not the tap target (02-§5.58)", () => {
  test("the dot's size is the one in tokens.css", async () => {
    const css = await readFile(path.join(ROOT, "source/assets/css/tokens.css"), "utf8");
    const match = css.match(/--space-md\s*:\s*(\d+)px/);
    assert.ok(match);
    assert.equal(LABEL_METRICS.dot, Number(match[1]), "pricken är --space-md bred");
    assert.ok(LABEL_METRICS.dot < LABEL_METRICS.tapTarget, "pricken är mindre än tryckytan");
  });

  test("a neighbour's invisible padding no longer vetoes a straight position", () => {
    // Two places side by side: the label of the left one reaches into the right one's tap
    // target but never onto its drawn dot. Before 02-§5.58 that counted as a collision.
    const gap = LABEL_METRICS.tapTarget + LABEL_METRICS.padding;
    const sides = placeLabels(
      [
        { id: "kant", name: "Hagen", x: 10, y: 300 },
        { id: "granne", name: "Grannen", x: 10 + gap * 4, y: 300 },
      ],
      1000,
      782,
    );
    assert.notEqual(sides.get("kant"), "hidden");
    assert.notEqual(sides.get("granne"), "hidden");
  });
});

describe("a marker in the outer margin labels straight to the side (02-§5.59)", () => {
  function sideOf(x: number, y: number, name = "Tåmossen"): LabelSide | undefined {
    return placeLabels([{ id: "x", name, x, y }], 1000, 780).get("x");
  }

  test("the left margin sends the name straight right, the right margin straight left", () => {
    assert.equal(sideOf(20, 300), "right", "vid vänsterkanten hamnar namnet rakt till höger");
    assert.equal(sideOf(980, 300), "left", "vid högerkanten hamnar namnet rakt till vänster");
  });

  test("inside the margin the slanted order of 02-§5.53 still decides", () => {
    assert.equal(sideOf(500, 300), "above-left", "mitt på ritningen prövas de sneda lägena först");
  });

  test("the margin is half a marker, so it holds at any drawing size", () => {
    assert.equal(placeLabels([{ id: "x", name: "A", x: 8, y: 120 }], 400, 300).get("x"), "right");
  });

  test("a neighbour's dot still blocks the straight side, unlike its invisible padding", () => {
    // The point of 02-§5.58 is that only the drawn dot counts — but it does count.
    const sides = placeLabels(
      [
        { id: "kant", name: "Hagen", x: 10, y: 300 },
        { id: "granne", name: "Grannen", x: 60, y: 300 },
      ],
      1000,
      780,
    );
    assert.notEqual(sides.get("kant"), "right", "grannens ritade prick ligger i vägen");
  });
});
