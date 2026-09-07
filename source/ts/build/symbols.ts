/**
 * The symbol on a map marker, one per kind of place (02-§5.36, 03-§9.5, ADR 0019).
 *
 * Three of the eight are the Swedish road sign's own figure, lifted out of the file and
 * recoloured: H5 servering, H8 vandrarhem and H28 husbilsplats. Their outlines are laid
 * down in vägmärkesförordningen (2007:90) and are therefore an official work; the files,
 * their checksums and the checksum of each lifted path are in `docs/09-kallor/index.md`,
 * and `tests/build/symbols.test.ts` fails if a path drifts from what was registered.
 *
 * The other five have no sign to take. `parkering` is the P from E19, which is cut out of
 * the blue plate rather than drawn as a figure, so there is nothing to lift; `djurplats`,
 * `grill`, `lek` and `toalett` have no vägmärke at all. They are drawn here, in the same
 * line as the header icons (05-§6.33), and each says below what it follows.
 *
 * The drawings live in code rather than in files under `source/assets/`: an `<img>`
 * would be a request per marker and a sprite file would be a third place to keep in
 * step with `kind`, and the map may not fetch anything at all (02-§5.26). `Record`
 * over `LocationKind` is what makes a new kind without a symbol a type error at
 * `npm run typecheck` instead of an empty marker in production.
 *
 * Each drawing is the inside of a 24 × 24 viewBox and is read at 20 px on the map. A
 * lifted figure keeps the sign's own coordinates and is placed in the box by a
 * `transform`; it is solid and fills 21 of the 24 units. The drawn ones are stroked. Both
 * paint in `currentColor`, so the colour is decided by the CSS around them.
 */
import type { LocationKind } from "../domain/types.ts";

/** Shared on every stroked path, so the seven look like one set. */
const STROKE = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

export const PLACE_SYMBOLS: Record<LocationKind, string> = {
  // No road sign exists for a paddock, and none is wanted: this is the one kind the site
  // is about, and the only symbol that is a living thing. An animal seen head on.
  djurplats:
    `<path d="M5.5 8.5C3.5 7.5 2.5 6 3 5c.5-1 2-.5 3.5.5M18.5 8.5c2-1 3-2.5 2.5-3.5-.5-1-2-.5-3.5.5" ${STROKE}/>` +
    `<path d="M6 7h12v5a6 6 0 0 1-12 0z" ${STROKE}/>` +
    `<path d="M10 13h0M14 13h0" ${STROKE}/>`,
  // H5 servering, the cup on its saucer: what the café and the waffle house serve.
  // Lifted from `docs/09-kallor/vagmarke-h5.svg`.
  mat:
    `<g transform="translate(179.4596 265.0385) scale(0.072660)">` +
    `<path d="m -2249.4849,-3420.5092 c 6.6432,-10.7145 11.807,-22.278 15.3546,-34.3739 28.9367,-2.1971 51.6556,-25.6932 52.8739,-54.6883 l 0,-48.4365 -44.3024,0 1.3416,-30.7304 -80.4764,0 -81.5188,0 4.4351,101.5639 c 1.2006,23.624 8.3686,46.5602 20.8327,66.6652 l -83.3329,0 c -2.3115,0.8588 -4.0577,2.7913 -4.6789,5.1759 -0.6234,2.3868 -0.042,4.9246 1.5535,6.8031 19.3047,19.0468 44.8161,30.5087 71.8742,32.2914 l 70.8351,0 70.8323,0 c 27.0593,-1.7827 52.5728,-13.2446 71.8764,-32.2914 1.5975,-1.8785 2.1762,-4.4163 1.5545,-6.8031 -0.6229,-2.3846 -2.3691,-4.3171 -4.6788,-5.1759 l -84.3757,0 z" fill="currentColor"/></g>`,
  // No road sign for a grillplats. The motif is the one on Swedish outdoor signage: a
  // fire over the place it burns in.
  grill:
    `<path d="M12 15.5a4 4 0 0 0 4-4c0-1.6-.9-2.7-1.7-3.8-.9-1.2-1.7-2.2-1.7-4.6-1.5 1.2-2.4 2.5-2.4 3.8 0 .8.2 1.4.5 1.8-.8 0-1.4-.7-1.7-1.6-.7 1.4-1 2.7-1 4.3a4 4 0 0 0 4 4.1z" ${STROKE}/>` +
    `<path d="M3.5 19h17" ${STROKE}/>`,
  // Two figures, the sign on the door everywhere. Sweden's road sign H14 draws a privy
  // with a heart instead, and that motif is not used here: the toilets on the farm are
  // not an outhouse, and a marker may not say what the building is.
  toalett:
    `<circle cx="7.5" cy="4.5" r="1.7" ${STROKE}/>` +
    `<path d="M7.5 8v6M5.5 9.5 7.5 8l2 1.5M6 21l1.5-7M9 21 7.5 14" ${STROKE}/>` +
    `<circle cx="16.5" cy="4.5" r="1.7" ${STROKE}/>` +
    `<path d="m13.5 15 3-7 3 7zM15 15l-.5 6M18 15l.5 6" ${STROKE}/>`,
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
  // Lifted from `docs/09-kallor/vagmarke-h8.svg`.
  boende:
    `<g transform="translate(179.2249 264.9983) scale(0.072649)">` +
    `<path d="m -2406.7772,-3482.4383 c -2.2225,26.5917 -16.4009,50.7328 -38.5411,65.6256 14.54,3.9301 30.038,2.0638 43.2286,-5.2079 l 0,38.0207 -44.2705,0 0,23.9581 280.2087,0 0.5203,0 0,-23.9581 -0.5203,0 -11.979,0 0,-119.2711 20.8326,0 -98.1771,-101.6652 -98.176,101.6652 20.8326,0 0,119.2711 -53.6465,0 0,-38.0207 c 14.1618,7.1669 30.4261,9.0146 45.8337,5.2079 -23.375,-13.7672 -38.1045,-38.5146 -39.0626,-65.6256 9.0423,7.8471 20.3576,12.592 32.2925,13.5423 -25.9182,-24.3936 -42.1879,-57.3034 -45.8348,-92.708 -4.4736,34.9449 -20.1965,67.4854 -44.7918,92.708 11.5535,-1.2281 22.4555,-5.9532 31.2507,-13.5423 z" fill="currentColor"/></g>`,
  // H28 husbilsplats: the alcove motorhome. `boende` beside it is a house, and a
  // pitch of gravel for motorhomes is not one.
  // Lifted from `docs/09-kallor/vagmarke-h28.svg`.
  husbil:
    `<g transform="translate(184.1141 271.8165) scale(0.074680)">` +
    `<path d="m -2421.2836,-3556.08 c -2.5081,0 -4.83,1.4517 -5.9913,3.7269 l -3.9523,7.889 c -0.4676,0.9293 -0.6971,1.9561 -0.6971,2.978 v 10.6236 c 0,1.021 0.2295,2.0487 0.6971,2.978 l 4.1443,8.3073 c 1.1605,2.2291 3.4824,3.6743 5.9912,3.6743 h 23.4402 l -22.4306,42.0233 -21.3166,9.7525 c -2.3687,1.113 -3.9007,3.4939 -3.9007,6.0954 v 21.2118 c 0,1.067 0.2377,2.1357 0.7462,3.065 l 4.0926,7.9415 c 1.1613,2.2293 3.4308,3.6744 5.9389,3.6744 h 16.0216 c 0,-9.5664 5.0621,-18.4316 13.3753,-23.2147 8.2664,-4.7839 18.4896,-4.7839 26.8027,0 8.2657,4.7831 13.3744,13.6483 13.3744,23.2147 h 107.1389 c 0,-14.8154 11.9809,-26.8029 26.7495,-26.8029 14.8145,0 26.7846,11.9875 26.7846,26.8029 h 33.4887 c 3.6694,0 6.6877,-3.0191 6.6877,-6.6877 v -107.3301 c 0,-3.7152 -3.0183,-6.6875 -6.6877,-6.6875 h -99.8936 c -0.7381,0 -1.4451,-0.1304 -2.1413,-0.369 l -37.565,-12.487 c -0.6479,-0.2296 -1.3935,-0.3855 -2.0897,-0.3855 z m 15.9348,12.1727 h 45.5582 c 2.1833,0 3.9876,1.8119 3.9876,4.041 v 12.0343 c 0,2.2291 -1.8043,4.0401 -3.9876,4.0401 h -45.5582 c -2.2291,0 -4.0057,-1.811 -4.0057,-4.0401 v -12.0343 c 0,-2.2291 1.7766,-4.041 4.0057,-4.041 z m 73.6495,28.4743 h 58.9324 c 2.2291,0 4.041,1.7594 4.041,3.9885 v 32.1313 c 0,2.2293 -1.8119,4.0401 -4.041,4.0401 h -58.9324 c -2.2292,0 -3.9885,-1.8108 -3.9885,-4.0401 v -32.1313 c 0,-2.2291 1.7593,-3.9885 3.9885,-3.9885 z m 109.5937,0 h 32.1492 c 2.2293,0 3.9876,1.7594 3.9876,3.9885 v 32.1313 c 0,2.2293 -1.7583,4.0401 -3.9876,4.0401 h -32.1492 c -2.2293,0 -4.0401,-1.8108 -4.0401,-4.0401 v -32.1313 c 0,-2.2291 1.8108,-3.9885 4.0401,-3.9885 z m -170.1469,6.6876 h 28.1775 c 1.0686,0 2.0954,0.4101 2.8393,1.1491 0.7873,0.7381 1.2008,1.7773 1.2008,2.8918 v 26.7848 l -53.3597,4.0401 17.5548,-32.7408 c 0.6971,-1.3466 2.1012,-2.125 3.5873,-2.125 z m 0.5086,66.4911 c -11.0993,0 -20.0627,9.0161 -20.0627,20.1153 0,11.099 8.9634,20.0626 20.0627,20.0626 11.0992,0 20.1151,-8.9636 20.1151,-20.0626 0,-11.0992 -9.0159,-20.1153 -20.1151,-20.1153 z m 160.691,0 c -11.0532,0 -20.0626,9.0161 -20.0626,20.1153 0,11.099 9.0094,20.0626 20.0626,20.0626 11.0992,0 20.0973,-8.9636 20.0973,-20.0626 0,-11.0992 -8.9981,-20.1153 -20.0973,-20.1153 z" fill="currentColor"/></g>`,
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
