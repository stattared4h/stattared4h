/**
 * 02-§7.5, 02-§7.7, 02-§7.8 and 03-§5.1: which strategy the service worker gives a request.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { chooseStrategy, normalisePathname, offlinePagePath } from "../../source/ts/domain/offline.ts";

const BASE = "/stattared4h/";
const PRECACHE = new Set([
  `${BASE}`,
  `${BASE}karta/`,
  `${BASE}plats/lygnslatt-1/`,
  `${BASE}offline/`,
  `${BASE}404.html`,
  `${BASE}assets/main.js`,
  `${BASE}assets/css/tokens.css`,
  `${BASE}manifest.webmanifest`,
]);

function facts(overrides: Partial<Parameters<typeof chooseStrategy>[0]>) {
  return chooseStrategy({ method: "GET", sameOrigin: true, pathname: `${BASE}karta/`, mode: "navigate", base: BASE, precache: PRECACHE, ...overrides });
}

describe("strategi per begäran", () => {
  test("förcachade sidor och tillgångar svaras cache först (02-§7.5)", () => {
    assert.equal(facts({ pathname: `${BASE}karta/` }), "cache-first");
    assert.equal(facts({ pathname: `${BASE}assets/main.js`, mode: "cors" }), "cache-first");
    assert.equal(facts({ pathname: `${BASE}assets/css/tokens.css`, mode: "no-cors" }), "cache-first");
    assert.equal(facts({ pathname: `${BASE}404.html`, mode: "no-cors" }), "cache-first");
  });

  test("/karta/index.html är samma post som /karta/", () => {
    assert.equal(normalisePathname(`${BASE}karta/index.html`), `${BASE}karta/`);
    assert.equal(normalisePathname(`${BASE}karta/`), `${BASE}karta/`);
    assert.equal(facts({ pathname: `${BASE}karta/index.html` }), "cache-first");
  });

  test("fotografier svaras nätverk först (02-§7.5)", () => {
    assert.equal(facts({ pathname: `${BASE}images/img-a3f2c1d8b901-640.webp`, mode: "no-cors" }), "network-first");
  });

  test("en sida utanför förcachen är en navigering som kan sluta på offline-sidan (02-§7.7)", () => {
    assert.equal(facts({ pathname: `${BASE}finns-inte/` }), "navigation");
    assert.equal(offlinePagePath(BASE), `${BASE}offline/`);
  });

  test("övrigt på samma värd tas från nätet med cachen som reserv", () => {
    assert.equal(facts({ pathname: `${BASE}robots.txt`, mode: "no-cors" }), "network-with-cache");
  });

  test("andra värdar och annat än GET rörs aldrig (02-§7.8)", () => {
    assert.equal(facts({ sameOrigin: false, pathname: "/karta/" }), "ignore");
    assert.equal(facts({ method: "POST" }), "ignore");
  });

  test("bilder utanför bas-sökvägen är inte sajtens bilder", () => {
    assert.equal(facts({ pathname: "/images/x.webp", mode: "no-cors" }), "network-with-cache");
  });
});
