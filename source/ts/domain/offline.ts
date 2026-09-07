/**
 * How the service worker answers a request (02-§7.5, 02-§7.7, 02-§7.8, 03-§5.1).
 *
 * The worker itself (source/ts/sw.ts) only talks to the Cache and Fetch APIs; the
 * decision of *which* strategy a request gets is made here, on plain strings, so that
 * it is tested in Node. Every entry in the precache and every request pathname is a
 * site-absolute path that already carries the base path (ADR 0005).
 */

export type FetchStrategy =
  /** Not ours: another origin, or a method other than GET. The browser handles it. */
  | "ignore"
  /** In the precache: answer from the cache, fall back to the network. */
  | "cache-first"
  /** A photograph: try the network, store the answer, fall back to the cache (02-§7.5). */
  | "network-first"
  /** A page outside the precache: network, then cache, then the offline page (02-§7.7). */
  | "navigation"
  /** Anything else on this origin: network with the cache as a reserve. */
  | "network-with-cache";

export interface RequestFacts {
  method: string;
  /** True when the request's origin equals the worker's. */
  sameOrigin: boolean;
  /** The request's pathname, e.g. `/stattared4h/karta/`. */
  pathname: string;
  /** `request.mode`; "navigate" for a page load. */
  mode: string;
  /** The base path, with leading and trailing slash. */
  base: string;
  /** The pathnames the worker precached at install. */
  precache: ReadonlySet<string>;
}

/** Pages are written as index.html in a directory, so `/karta/index.html` and `/karta/` are the same entry. */
export function normalisePathname(pathname: string): string {
  return pathname.endsWith("/index.html") ? pathname.slice(0, -"index.html".length) : pathname;
}

export function chooseStrategy(facts: RequestFacts): FetchStrategy {
  if (facts.method !== "GET" || !facts.sameOrigin) return "ignore";
  const pathname = normalisePathname(facts.pathname);
  if (pathname.startsWith(`${facts.base}images/`)) return "network-first";
  if (facts.precache.has(pathname)) return "cache-first";
  if (facts.mode === "navigate") return "navigation";
  return "network-with-cache";
}

/** The offline page's pathname for a base path (02-§7.7). */
export function offlinePagePath(base: string): string {
  return `${base}offline/`;
}
