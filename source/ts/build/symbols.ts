/**
 * The symbol on a map marker, one per kind of place (02-§5.36, 03-§9.5, ADR 0019).
 *
 * The motifs are not ours. Where a Swedish road sign exists for the thing, the symbol
 * follows that sign's motif — the cup from H5, the outhouse with its heart from H14, the
 * house and spruce from H8, the P from E19 — so that the marker on the phone says the
 * same thing as the sign at the gate. The signs themselves are laid down in
 * vägmärkesförordningen (2007:90); `docs/09-kallor/index.md` records which märke each one
 * follows. Three kinds have no such sign, and the file says so where they are defined.
 *
 * They are redrawn rather than embedded: the road signs are solid black figures on a blue
 * plate, drawn for a sign a metre across, and at the 16 px a marker gets they turn into
 * blots that also carry a blue plate into a green design (05-§6.33). What is copied is
 * the motif; what is ours is the line.
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
/** The heart on the privy door is solid; at 16 px an outlined one closes up anyway. */
const SOLID = 'fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"';

export const PLACE_SYMBOLS: Record<LocationKind, string> = {
  // No road sign exists for a paddock, and none is wanted: this is the one kind the site
  // is about, and the only symbol that is a living thing. An animal seen head on.
  djurplats:
    `<path d="M5.5 8.5C3.5 7.5 2.5 6 3 5c.5-1 2-.5 3.5.5M18.5 8.5c2-1 3-2.5 2.5-3.5-.5-1-2-.5-3.5.5" ${STROKE}/>` +
    `<path d="M6 7h12v5a6 6 0 0 1-12 0z" ${STROKE}/>` +
    `<path d="M10 13h0M14 13h0" ${STROKE}/>`,
  // H5 servering: a cup on its saucer. The café and the waffle house both serve coffee,
  // which is what H5 means — H6 restaurang, the crossed spoon and fork, would say more.
  mat:
    `<path d="M4.5 8h11.5v4a5.75 5.75 0 0 1-11.5 0z" ${STROKE}/>` +
    `<path d="M16 9.5h1.3a2.75 2.75 0 0 1 0 5.5H16" ${STROKE}/>` +
    `<path d="M2.5 20h16" ${STROKE}/>`,
  // No road sign for a grillplats. The motif is the one on Swedish outdoor signage: a
  // fire over the place it burns in.
  grill:
    `<path d="M12 15.5a4 4 0 0 0 4-4c0-1.6-.9-2.7-1.7-3.8-.9-1.2-1.7-2.2-1.7-4.6-1.5 1.2-2.4 2.5-2.4 3.8 0 .8.2 1.4.5 1.8-.8 0-1.4-.7-1.7-1.6-.7 1.4-1 2.7-1 4.3a4 4 0 0 0 4 4.1z" ${STROKE}/>` +
    `<path d="M3.5 19h17" ${STROKE}/>`,
  // H14 toalett: the privy with a heart on the door. Narrow and tall, so it is not read
  // as the house under `boende` at the size a marker gets.
  toalett:
    `<path d="M6 8.5h12L12 3.5z" ${STROKE}/>` +
    `<path d="M8.5 8.5V20h7V8.5" ${STROKE}/>` +
    `<path d="M12 16.8c-2.2-1.6-3.3-2.5-3.3-3.8a1.65 1.65 0 0 1 3.3-.7 1.65 1.65 0 0 1 3.3.7c0 1.3-1.1 2.2-3.3 3.8z" ${SOLID}/>`,
  // E19 parkering: the letter already standing at the entrance.
  parkering: `<path d="M8.5 20.5V3.5h4.5a5 5 0 0 1 0 10H8.5" ${STROKE}/>`,
  // No road sign for a lekplats. The motif is the farm's own: the swings, drawn mid-swing
  // so the frame is not read as a table.
  lek:
    `<path d="M3.5 5.5h17" ${STROKE}/>` +
    `<path d="m5.5 5.5-2 15M18.5 5.5l2 15" ${STROKE}/>` +
    `<path d="M12.5 6 10 14.5M17 6l-2.5 8.5" ${STROKE}/>` +
    `<path d="M9 15.5 16 13.5" ${STROKE}/>`,
  // H8 vandrarhem: the house with a spruce beside it.
  boende:
    `<path d="m9.5 13 6-5 6 5" ${STROKE}/>` +
    `<path d="M11.5 13v7h8v-7" ${STROKE}/>` +
    `<path d="M5 20v-3M5 7l3.2 5.5H1.8zM5 12l2.8 5H2.2z" ${STROKE}/>`,
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
