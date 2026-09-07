/**
 * Registers the service worker and offers new versions (02-§7.3, 02-§10.28, 03-§5.2).
 *
 * The worker lives at `<base>sw.js` with the base path as scope; both come from the
 * `data-base` attribute on <html>, never from a hard-coded path (ADR 0005). The QA
 * site under /qa/ therefore registers its own worker with its own scope (02-§7.9).
 *
 * When a new worker has installed while a page is open, it waits until every open tab
 * lets go of the old one. The status bar then says "Ny version finns." with the button
 * "Ladda om", which asks the waiting worker to take over (`skipWaiting`) and reloads
 * the page once it has (`controllerchange`). The reload only happens after that press:
 * the first installation also changes the controller, and reloading then would be a
 * surprise.
 */
import { showStatus } from "./status-bar.ts";

const STATUS_KEY = "update";

export function init(): void {
  if (!("serviceWorker" in navigator)) return;
  const base = document.documentElement.dataset.base || "/";
  if (document.readyState === "complete") void register(base);
  else window.addEventListener("load", () => void register(base));
}

async function register(base: string): Promise<void> {
  let reloadRequested = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloadRequested) location.reload();
  });

  const offerUpdate = (worker: ServiceWorker): void => {
    showStatus({
      key: STATUS_KEY,
      text: "Ny version finns.",
      action: {
        label: "Ladda om",
        onClick: () => {
          reloadRequested = true;
          worker.postMessage({ type: "skipWaiting" });
        },
      },
    });
  };

  try {
    const registration = await navigator.serviceWorker.register(`${base}sw.js`, { scope: base });
    // A worker that already waits (the page was opened after the new version installed).
    if (registration.waiting && navigator.serviceWorker.controller) offerUpdate(registration.waiting);
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        // "installed" with an existing controller means: a new version, waiting.
        if (worker.state === "installed" && navigator.serviceWorker.controller) offerUpdate(worker);
      });
    });
  } catch (error) {
    console.warn("Service worker: registration failed", error);
  }
}
