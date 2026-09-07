/**
 * The service worker (02-§7.3–7.9, 03-§5).
 *
 * This file is bundled by esbuild into a string at build time (source/ts/build/pwa.ts)
 * and written by source/pages/sw.njk *after* three constants the build knows and this
 * code does not:
 *
 *   BASE        the base path, "/" or "/stattared4h/" (ADR 0005)
 *   CACHE_NAME  the base path followed by the version string (02-§7.6, 02-§10.26)
 *   PRECACHE    every page and asset to store at install (02-§7.4)
 *
 * Which strategy a request gets is decided in source/ts/domain/offline.ts, which is
 * tested in Node; this file only carries out the decision with the Cache and Fetch
 * APIs. Nothing here ever talks to another host (02-§7.8): requests to other origins
 * are left to the browser untouched.
 */
import { chooseStrategy, normalisePathname, offlinePagePath, type FetchStrategy } from "./domain/offline.ts";

declare const BASE: string;
declare const CACHE_NAME: string;
declare const PRECACHE: readonly string[];

const sw = self as unknown as ServiceWorkerGlobalScope;
const precache: ReadonlySet<string> = new Set(PRECACHE.map(normalisePathname));
const offlinePage = offlinePagePath(BASE);

/**
 * True for a cache this worker owns: same base path, and the remainder is a version
 * string without slashes. (A regular expression, not a quoted slash: the build test
 * reads every quoted string starting with "/" in sw.js as a site address, 02-§9.8.)
 */
function ownsCache(name: string): boolean {
  return name.startsWith(BASE) && !/\//.test(name.slice(BASE.length));
}

sw.addEventListener("install", (event) => {
  event.waitUntil(precacheAll());
});

/**
 * Stores every entry, one at a time, so a single missing file does not stop the rest
 * (a precache that fails as a whole leaves the visitor with nothing offline).
 * `cache: "reload"` bypasses the HTTP cache: a new version must fetch new files.
 */
async function precacheAll(): Promise<void> {
  const cache = await caches.open(CACHE_NAME);
  const results = await Promise.allSettled(PRECACHE.map((url) => cache.add(new Request(url, { cache: "reload" }))));
  results.forEach((result, index) => {
    if (result.status === "rejected") console.warn(`Service worker: could not precache ${PRECACHE[index]}`, result.reason);
  });
}

sw.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Every earlier version of this site's cache goes (02-§7.6). The QA site under
      // /qa/ shares the origin but has its own base path, so its caches are not ours.
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name !== CACHE_NAME && ownsCache(name)).map((name) => caches.delete(name)));
      await sw.clients.claim();
    })(),
  );
});

sw.addEventListener("message", (event) => {
  // Only this site's own pages may steer the worker. A message from anywhere else is
  // ignored, so a page on another origin cannot make the waiting worker take over.
  if (event.origin !== sw.location.origin) return;
  // The "Ladda om" button in the status bar asks the waiting worker to take over (02-§10.28).
  if (event.data && typeof event.data === "object" && (event.data as { type?: unknown }).type === "skipWaiting") {
    void sw.skipWaiting();
  }
});

sw.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  const strategy = chooseStrategy({
    method: request.method,
    sameOrigin: url.origin === sw.location.origin,
    pathname: url.pathname,
    mode: request.mode,
    base: BASE,
    precache,
  });
  if (strategy === "ignore") return;
  event.respondWith(respond(strategy, request, normalisePathname(url.pathname)));
});

async function respond(strategy: FetchStrategy, request: Request, key: string): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
  const isNavigation = request.mode === "navigate";
  if (strategy === "cache-first") {
    const cached = await cache.match(key);
    if (cached) return cached;
    return (await fromNetwork(request, cache, key)) ?? (isNavigation ? offlineResponse(cache) : Response.error());
  }
  // network-first (photos), navigation (pages outside the precache) and
  // network-with-cache (anything else) differ only in what they answer when both
  // the network and the cache come up empty.
  const fresh = await fromNetwork(request, cache, key);
  if (fresh) return fresh;
  const cached = await cache.match(key);
  if (cached) return cached;
  return strategy === "navigation" ? offlineResponse(cache) : Response.error();
}

/** The network answer, stored under `key` when it is a good one; null when the network is not there. */
async function fromNetwork(request: Request, cache: Cache, key: string): Promise<Response | null> {
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(key, response.clone());
    return response;
  } catch {
    return null;
  }
}

/** The offline page from the cache (02-§7.7); a bare 503 if even that is missing. */
async function offlineResponse(cache: Cache): Promise<Response> {
  return (await cache.match(offlinePage)) ?? new Response("Du är offline", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
