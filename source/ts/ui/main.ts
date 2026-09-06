/**
 * Entry point for the client code, bundled by esbuild into public/assets/main.js.
 *
 * Every module under source/ts/ui/ exports an `init()` that looks up its own element
 * and does nothing when the page has none (03-§10.2). New behaviour is added by
 * importing the module here and listing its init below — nothing else.
 */

import { init as initMenu } from "./menu.ts";

for (const init of [initMenu]) {
  init();
}
