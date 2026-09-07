/**
 * The offline notice (02-§10.29): "Du är offline. Du ser den sparade versionen." in
 * the status bar while the browser reports no network, gone when it is back. The
 * pages themselves keep working through the service worker (02-§7.7); this only tells
 * the visitor why a photo may be missing or a link may show the offline page.
 */
import { hideStatus, showStatus } from "./status-bar.ts";

const STATUS_KEY = "offline";
const OFFLINE_TEXT = "Du är offline. Du ser den sparade versionen.";

export function init(): void {
  const update = (): void => {
    if (navigator.onLine === false) showStatus({ key: STATUS_KEY, text: OFFLINE_TEXT });
    else hideStatus(STATUS_KEY);
  };
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  update();
}
