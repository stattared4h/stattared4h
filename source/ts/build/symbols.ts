/**
 * The symbol on a map marker, one per kind of place (02-§5.36, 03-§9.5, ADR 0019).
 *
 * The drawings live in code rather than in files under `source/assets/`: an `<img>`
 * would be a request per marker and a sprite file would be a third place to keep in
 * step with `kind`, and the map may not fetch anything at all (02-§5.26). `Record`
 * over `LocationKind` is what makes a new kind without a symbol a type error at
 * `npm run typecheck` instead of an empty marker in production.
 *
 * Each drawing is the inside of a 24 × 24 viewBox, stroked in `currentColor` with the
 * same weight as the header icons (05-§6.33), so the colour is decided by the CSS around
 * it. They are read at 16 px on the map: whole shapes, few lines, no small detail.
 */
import type { LocationKind } from "../domain/types.ts";

/** Shared on every stroked path, so the seven look like one set. */
const STROKE = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

export const PLACE_SYMBOLS: Record<LocationKind, string> = {
  // An animal seen head on: two ears, a muzzle, two nostrils. The paddock is the one
  // kind the site is about, so it is the one symbol that is a living thing.
  djurplats:
    `<path d="M5.5 8.5C3.5 7.5 2.5 6 3 5c.5-1 2-.5 3.5.5M18.5 8.5c2-1 3-2.5 2.5-3.5-.5-1-2-.5-3.5.5" ${STROKE}/>` +
    `<path d="M6 7h12v5a6 6 0 0 1-12 0z" ${STROKE}/>` +
    `<path d="M10 13h0M14 13h0" ${STROKE}/>`,
  // Knife and fork: the sign for anywhere that serves something.
  mat:
    `<path d="M7 3v6M11 3v6M9 3v6M7 9h4M9 9v12" ${STROKE}/>` +
    `<path d="M17 3c1.6 1.7 2 4 2 6 0 1.7-.9 3-2 3zM17 12v9" ${STROKE}/>`,
  // A kettle grill on its three legs: the shape that says grilling and nothing else.
  grill:
    `<path d="M3.5 8.5h17a8.5 8.5 0 0 1-17 0z" ${STROKE}/>` +
    `<path d="M7.5 14.5 5 19.5M16.5 14.5 19 19.5M12 17V19.5" ${STROKE}/>`,
  // The two figures from the sign on the door.
  toalett:
    `<circle cx="7.5" cy="4.5" r="1.7" ${STROKE}/>` +
    `<path d="M7.5 8v6M5.5 9.5 7.5 8l2 1.5M6 21l1.5-7M9 21 7.5 14" ${STROKE}/>` +
    `<circle cx="16.5" cy="4.5" r="1.7" ${STROKE}/>` +
    `<path d="m13.5 15 3-7 3 7zM15 15l-.5 6M18 15l.5 6" ${STROKE}/>`,
  // The letter P, the sign already standing at the entrance.
  parkering: `<path d="M8.5 20.5V3.5h4.5a5 5 0 0 1 0 10H8.5" ${STROKE}/>`,
  // A ball: what a child looks for, and readable at the size a marker gets.
  lek:
    `<circle cx="12" cy="12" r="8.5" ${STROKE}/>` +
    `<path d="m12 6.5 4.5 3.3-1.7 5.3h-5.6L7.5 9.8z" ${STROKE}/>` +
    `<path d="M12 3.5v3M19.5 9.8l-2.8 2M17 15.1l1.8 2.6M7 15.1l-1.8 2.6M4.5 9.8l3 2" ${STROKE}/>`,
  // A bed seen from the side: headboard, mattress, pillow.
  boende:
    `<path d="M3 20v-7h18v7M3 16h18M3 13V8" ${STROKE}/>` +
    `<path d="M6.5 13v-1.5A1.5 1.5 0 0 1 8 10h3.5a1.5 1.5 0 0 1 1.5 1.5V13" ${STROKE}/>`,
};

/**
 * The symbol as a whole `<svg>`, ready to be written into a marker or a list item.
 * `aria-hidden` because the place's name already says what the place is; the symbol
 * repeats it for the eye, and a screen reader that read both would say everything twice.
 */
export function symbolSvg(kind: LocationKind, className: string): string {
  return (
    `<svg class="${className}" aria-hidden="true" focusable="false" viewBox="0 0 24 24">` +
    PLACE_SYMBOLS[kind] +
    `</svg>`
  );
}
