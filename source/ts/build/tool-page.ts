/**
 * Where the editors' tools live (02-§11.1, ADR 0022).
 *
 * The address is written here and nowhere else: eleventy.config.js hands it to the
 * template as global data and gives esbuild the same directory to write the page's own
 * bundle into, and the build tests read it from here too. An address that is spelled in
 * three places is an address that will disagree with itself.
 *
 * It is deliberately hard to guess, and it is not a secret: the repository is public and
 * README.md names it. The page holds nothing worth hiding — see ADR 0022.
 */

/** The image tool's address, with leading and trailing slash, before the base path (ADR 0005). */
export const IMAGE_TOOL_PATH = "/verktyg/bild-3ed93205946a/";

/** The page's own client bundle, next to the page so it stays out of `assets/` (02-§11.6). */
export const IMAGE_TOOL_SCRIPT = "verktyg.js";
