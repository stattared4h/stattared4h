/**
 * The "Dela" button on place, species and animal pages (02-§10.30).
 *
 * The button is in the page's markup with `hidden`, since it is useless without
 * script; this module shows it when the browser can share or copy. A press hands the
 * page's title and address to the device's share sheet, or, without one, copies the
 * address and says so on the button for a few seconds. `shareOrCopy` takes the two
 * capabilities as functions so that the choice between them is tested in Node.
 */

export interface ShareCapabilities {
  share?: (data: { title: string; url: string }) => Promise<void>;
  writeText?: (text: string) => Promise<void>;
}

export type ShareOutcome = "shared" | "copied" | "cancelled" | "unavailable";

const COPIED_TEXT = "Länken är kopierad";
const COPIED_FOR_MS = 3000;

/** Share when the device can; otherwise copy. A share the visitor cancels is not an error and not a reason to copy. */
export async function shareOrCopy(title: string, url: string, capabilities: ShareCapabilities): Promise<ShareOutcome> {
  if (capabilities.share) {
    try {
      await capabilities.share({ title, url });
      return "shared";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return "cancelled";
    }
  }
  if (capabilities.writeText) {
    try {
      await capabilities.writeText(url);
      return "copied";
    } catch {
      return "unavailable";
    }
  }
  return "unavailable";
}

export function init(): void {
  const button = document.querySelector<HTMLButtonElement>("[data-share-button]");
  if (!button) return;

  const capabilities: ShareCapabilities = {};
  if (typeof navigator.share === "function") capabilities.share = (data) => navigator.share(data);
  if (typeof navigator.clipboard?.writeText === "function") capabilities.writeText = (text) => navigator.clipboard.writeText(text);
  if (!capabilities.share && !capabilities.writeText) return;

  const label = button.textContent;
  let restore: ReturnType<typeof setTimeout> | undefined;
  button.hidden = false;

  button.addEventListener("click", async () => {
    const outcome = await shareOrCopy(document.title, location.href, capabilities);
    if (outcome !== "copied") return;
    button.textContent = COPIED_TEXT;
    clearTimeout(restore);
    restore = setTimeout(() => {
      button.textContent = label;
    }, COPIED_FOR_MS);
  });
}
