/**
 * The mobile menu (02-§10.4–10.6, 02-§10.38).
 *
 * The button carries `aria-expanded` and points at the menu card with `aria-controls`.
 * Open and closed are a class on the card; the transition lives in CSS (05-§6.34),
 * where `visibility` keeps a closed card out of the tab order. The same
 * `aria-expanded` picks which icon and which label the button shows (05-§6.42), so the
 * state is written in one place.
 *
 * The press that falls outside the menu lands on the overlay, not on the document: the
 * overlay covers the page while the menu is open, so closing the menu can never
 * activate the link underneath the finger (02-§10.38). The menu also closes with
 * Escape, returning focus to the button, and when a link is chosen.
 */

const OPEN_CLASS = "site-menu--open";

export function init(): void {
  const button = document.querySelector<HTMLButtonElement>("[data-menu-button]");
  const menuId = button?.getAttribute("aria-controls");
  const menu = menuId ? document.getElementById(menuId) : null;
  const overlay = document.querySelector<HTMLElement>("[data-menu-overlay]");
  if (!button || !menu || !overlay) return;

  const isOpen = (): boolean => button.getAttribute("aria-expanded") === "true";

  const setOpen = (open: boolean): void => {
    button.setAttribute("aria-expanded", String(open));
    menu.classList.toggle(OPEN_CLASS, open);
    overlay.hidden = !open;
  };

  button.addEventListener("click", () => setOpen(!isOpen()));

  menu.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) setOpen(false);
  });

  overlay.addEventListener("click", () => setOpen(false));

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !isOpen()) return;
    setOpen(false);
    button.focus();
  });
}
