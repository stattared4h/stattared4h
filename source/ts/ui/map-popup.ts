/**
 * The popup on a map marker (02-§5.46–5.49, 03-§9.7).
 *
 * The build writes one empty `<dialog>` and puts what it should show on each marker as
 * `data-` attributes. This module fills it with `textContent` — never `innerHTML`
 * (`CL-§2.13`) — and opens it with `showModal()`, so it lands in the middle of the screen
 * whatever the marker's position and however far the map is zoomed. The browser keeps
 * focus inside it, closes it on Escape and returns focus to the marker (02-§5.48); a click
 * that lands on the dialog element itself is a click on the backdrop, because the dialog
 * has no padding of its own (05-§6.35).
 *
 * The marker stays a link to the place page. The click is caught here, which is exactly
 * what makes the map behave as it always did when this module never runs (02-§5.49).
 */

const LINK_TEXT = "Se djuren här";

export function init(): void {
  const map = document.querySelector<HTMLElement>("[data-map]");
  const dialog = document.querySelector<HTMLDialogElement>("[data-map-popup]");
  const header = dialog?.querySelector<HTMLElement>("[data-map-popup-header]");
  const facts = dialog?.querySelector<HTMLElement>("[data-map-popup-facts]");
  const close = dialog?.querySelector<HTMLButtonElement>("[data-map-popup-close]");
  if (!map || !dialog || !header || !facts || !close || typeof dialog.showModal !== "function") return;

  // The heading is built here rather than left empty in the page: a built page with an
  // empty <h2> is markup that says nothing, and html-validate is right to refuse it.
  const name = document.createElement("h2");
  name.className = "dialog__title";
  name.id = "map-popup-name";
  header.prepend(name);

  close.addEventListener("click", () => dialog.close());

  /**
   * The marker the open popup belongs to. A <dialog> hands focus back to whatever had it
   * before, which is the marker only when the visitor got there by keyboard — a tap does
   * not always focus a link. Remembering it makes 02-§5.48 true however the popup opened.
   */
  let opener: HTMLAnchorElement | null = null;
  dialog.addEventListener("close", () => {
    const marker = opener;
    opener = null;
    marker?.focus();
  });

  const line = (text: string, className: string): HTMLParagraphElement => {
    const element = document.createElement("p");
    element.className = className;
    element.textContent = text;
    return element;
  };

  const open = (marker: HTMLAnchorElement): void => {
    name.textContent = marker.querySelector(".map__label")?.textContent ?? "";
    facts.replaceChildren();

    if (marker.dataset.species) facts.append(line(marker.dataset.species, "map-popup__species"));
    if (marker.dataset.note) facts.append(line(marker.dataset.note, "map-popup__note"));
    if (marker.dataset.access) facts.append(line(marker.dataset.access, "map-popup__access"));

    // Only a paddock leads on to its page (02-§5.47). For the rest the popup already says
    // what that page says, and a link there would be a detour.
    if (marker.dataset.kind === "djurplats") {
      const link = document.createElement("a");
      link.className = "button map-popup__link";
      link.href = marker.href;
      link.textContent = LINK_TEXT;
      facts.append(link);
    }

    opener = marker;
    dialog.showModal();
  };

  map.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const marker = event.target.closest<HTMLAnchorElement>(".map__marker");
    if (!marker) return;
    // A drag that panned the map already suppressed its own click (03-§9.6); anything
    // still arriving here is a press on the marker and belongs to the popup.
    if (event.defaultPrevented) return;
    event.preventDefault();
    open(marker);
  });

  // The dialog has no padding of its own, so a click on the element itself is the backdrop.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}
