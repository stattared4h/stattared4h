/**
 * The "Tillbaka" control in the header (02-§10.40).
 *
 * The control is a plain link to the start page in the markup, so it works without
 * script and on a page opened straight from a QR code. When the visitor did come from
 * another page on this site, the script upgrades it to the history entry instead, so
 * the way back is the way they came — a paddock page, not the map.
 *
 * The choice between the two is `returnsToSitePage`, which is a pure function so it is
 * tested in Node without a browser (CL-§2.14).
 */

/**
 * Did the visitor arrive from another page of this same site?
 *
 * `base` is the site's base path, so the QA site under `/qa/` and the production site
 * under `/stattared4h/` are two different apps and neither treats the other as its own
 * history (ADR 0005). An address that cannot be parsed is treated as "came from
 * elsewhere": the link to the start page is the safe answer.
 */
export function returnsToSitePage(referrer: string, origin: string, base: string): boolean {
  if (referrer === "") return false;
  let previous: URL;
  try {
    previous = new URL(referrer);
  } catch {
    return false;
  }
  return previous.origin === origin && previous.pathname.startsWith(base);
}

export function init(): void {
  const link = document.querySelector<HTMLAnchorElement>("[data-back-button]");
  if (!link) return;

  const base = document.documentElement.dataset.base ?? "/";
  if (!returnsToSitePage(document.referrer, location.origin, base)) return;

  link.addEventListener("click", (event) => {
    event.preventDefault();
    history.back();
  });
}
