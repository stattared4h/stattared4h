/**
 * Entry point for the image tool's own bundle (02-§11.6).
 *
 * Three lines, like `source/ts/ui/main.ts`: the behaviour is `tool.ts`, which exports an
 * `init()` that looks up its own elements and does nothing when the page has none
 * (03-§10.2). Nothing else on the site loads this file.
 */
import { init } from "./tool.ts";

init();
