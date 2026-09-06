/**
 * The mobile menu (02-§10.4–10.6).
 *
 * The button carries `aria-expanded` and points at the menu card with `aria-controls`.
 * Open and closed are a class on the card; the transition lives in CSS (05-§6.34),
 * where `visibility` keeps a closed card out of the tab order. The menu closes with
 * Escape (returning focus to the button), with a click outside it, and when a link
 * is chosen.
 */

const OPEN_CLASS = "site-menu--open";

export function init(): void {
  const button = document.querySelector<HTMLButtonElement>("[data-menu-button]");
  const menuId = button?.getAttribute("aria-controls");
  const menu = menuId ? document.getElementById(menuId) : null;
  if (!button || !menu) return;

  const isOpen = (): boolean => button.getAttribute("aria-expanded") === "true";

  const setOpen = (open: boolean): void => {
    button.setAttribute("aria-expanded", String(open));
    menu.classList.toggle(OPEN_CLASS, open);
  };

  button.addEventListener("click", () => setOpen(!isOpen()));

  menu.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) setOpen(false);
  });

  document.addEventListener("click", (event) => {
    if (!isOpen() || !(event.target instanceof Node)) return;
    if (!menu.contains(event.target) && !button.contains(event.target)) setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !isOpen()) return;
    setOpen(false);
    button.focus();
  });
}
