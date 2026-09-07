/**
 * The "till toppen" button (02-§10.14): hidden until the page has scrolled 300 px,
 * then a press scrolls to the top — smoothly, unless the visitor prefers reduced
 * motion. The button only exists under the desktop breakpoint; CSS hides it above.
 */

const SHOW_AFTER_PX = 300;

export function init(): void {
  const button = document.querySelector<HTMLButtonElement>("[data-to-top-button]");
  if (!button) return;

  const update = (): void => {
    button.hidden = window.scrollY < SHOW_AFTER_PX;
  };

  window.addEventListener("scroll", update, { passive: true });

  button.addEventListener("click", () => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  update();
}
