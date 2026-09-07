/**
 * The install button (02-§10.11–10.13).
 *
 * Chromium fires `beforeinstallprompt` when it is willing to install the site; the
 * event is kept and its `prompt()` called on the next press. `appinstalled` and a
 * standalone display mode hide the button for good. iOS has no such API: there the
 * button always shows and a press toggles the hint in the status bar. The decision is
 * `installButtonState` in the domain layer, tested in Node.
 */
import { installButtonState, IOS_INSTALL_HINT, isIosBrowser } from "../domain/install.ts";
import { hideStatus, isStatusShown, showStatus } from "./status-bar.ts";

/** The non-standard event Chromium fires; TypeScript's DOM library does not declare it. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<unknown>;
}

const STATUS_KEY = "install";

export function init(): void {
  const button = document.querySelector<HTMLButtonElement>("[data-install-button]");
  if (!button) return;

  const isIos = isIosBrowser(navigator.userAgent, "MSStream" in window);
  const standaloneQuery = window.matchMedia("(display-mode: standalone)");
  let promptEvent: BeforeInstallPromptEvent | null = null;
  let installed = false;

  const render = (): void => {
    const state = installButtonState({
      isIos,
      // Safari on iOS reports a home-screen launch on navigator.standalone rather than in the media query.
      isStandalone: standaloneQuery.matches || (navigator as { standalone?: boolean }).standalone === true,
      canPrompt: promptEvent !== null,
      installed,
    });
    button.hidden = state === "hidden";
    button.dataset.installState = state;
  };

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    promptEvent = event as BeforeInstallPromptEvent;
    render();
  });

  window.addEventListener("appinstalled", () => {
    installed = true;
    promptEvent = null;
    hideStatus(STATUS_KEY);
    render();
  });

  standaloneQuery.addEventListener("change", render);

  button.addEventListener("click", () => {
    if (promptEvent) {
      // The event can be used once. If the visitor declines, the browser may offer again later.
      const pending = promptEvent;
      promptEvent = null;
      render();
      void pending.prompt();
    } else if (isIos) {
      if (isStatusShown(STATUS_KEY)) hideStatus(STATUS_KEY);
      else showStatus({ key: STATUS_KEY, text: IOS_INSTALL_HINT });
    }
  });

  render();
}
