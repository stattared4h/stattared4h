/**
 * What the install button should do (02-§10.11–10.12).
 *
 * The browser decides most of it: Chromium fires `beforeinstallprompt` when it is
 * willing to install, and a standalone display mode means the site already runs as an
 * app. iOS has no install API at all, so there the button always shows and explains
 * the manual steps instead. These decisions are pure functions of what the browser
 * reports, so that they are tested in Node; source/ts/ui/install.ts feeds them the
 * real values.
 */

export type InstallButtonState =
  /** Nothing to do: installed, running as an app, or a browser without an install path. */
  | "hidden"
  /** The browser has offered installation; a press shows its dialog. */
  | "prompt"
  /** iOS: a press toggles the text about "Dela" and "Lägg till på hemskärmen". */
  | "hint";

export interface InstallSignals {
  /** iOS Safari or a browser on iOS, from `isIosBrowser`. */
  isIos: boolean;
  /** `display-mode: standalone` matches: the site runs as an installed app. */
  isStandalone: boolean;
  /** A `beforeinstallprompt` event has been captured. */
  canPrompt: boolean;
  /** `appinstalled` has fired during this page view. */
  installed: boolean;
}

const IOS_DEVICE = /iPhone|iPad|iPod/;

/**
 * True for browsers on iOS. Windows Phone once spoofed an iPhone user agent and set
 * `MSStream`, which is the reason for the second check; it costs nothing to keep.
 */
export function isIosBrowser(userAgent: string, hasMsStream: boolean): boolean {
  return IOS_DEVICE.test(userAgent) && !hasMsStream;
}

export function installButtonState(signals: InstallSignals): InstallButtonState {
  if (signals.installed || signals.isStandalone) return "hidden";
  if (signals.canPrompt) return "prompt";
  if (signals.isIos) return "hint";
  return "hidden";
}

/** The text the iOS hint shows in the status bar (02-§10.12). */
export const IOS_INSTALL_HINT = "Tryck på Dela och välj Lägg till på hemskärmen";
