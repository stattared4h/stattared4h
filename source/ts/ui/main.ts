/**
 * Entry point for the client code, bundled by esbuild into public/assets/main.js.
 *
 * Every module under source/ts/ui/ exports an `init()` that looks up its own element
 * and does nothing when the page has none (03-§10.2). New behaviour is added by
 * importing the module here and listing its init below — nothing else. The status
 * bar (status-bar.ts) has no init: the modules that show a status import it directly.
 */

import { init as initBack } from "./back.ts";
import { init as initMenu } from "./menu.ts";
import { init as initInstall } from "./install.ts";
import { init as initToTop } from "./to-top.ts";
import { init as initFeedback } from "./feedback.ts";
import { init as initShare } from "./share.ts";
import { init as initMapZoom } from "./map-zoom.ts";
import { init as initMapPopup } from "./map-popup.ts";
import { init as initOffline } from "./offline.ts";
import { init as initServiceWorker } from "./sw-register.ts";
import { init as initAnimalIdSearch } from "./animal-id-search.ts";
import { init as initBingo } from "./bingo.ts";
import { init as initSpana } from "./spana.ts";

for (const init of [initBack, initMenu, initInstall, initToTop, initFeedback, initShare, initMapZoom, initMapPopup, initOffline, initAnimalIdSearch, initBingo, initSpana, initServiceWorker]) {
  init();
}
