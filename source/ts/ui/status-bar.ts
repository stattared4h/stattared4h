/**
 * The status bar under the header (05-§6.36): one line of text and at most one button.
 *
 * Used for "Ny version finns." (02-§10.28), "Du är offline." (02-§10.29), the iOS hint
 * about installation (02-§10.12) and "Länken är kopierad" (02-§10.30). There is never
 * more than one status at a time: a new one replaces the old. Each caller names its
 * status with a `key`, so that `hideStatus("offline")` when the network returns does
 * not hide a message someone else put there in the meantime.
 *
 * The markup is in source/layouts/base.njk; this module only fills it in. It looks
 * the elements up on every call, so it needs no init and works from any module.
 */

export interface StatusAction {
  label: string;
  onClick: () => void;
}

export interface Status {
  /** Who owns the message: "offline", "update", "install", "share". */
  key: string;
  text: string;
  action?: StatusAction;
}

interface Elements {
  bar: HTMLElement;
  text: HTMLElement;
  button: HTMLButtonElement;
}

let current: { key: string; detach: () => void } | null = null;

function elements(): Elements | null {
  const bar = document.querySelector<HTMLElement>("[data-status-bar]");
  const text = bar?.querySelector<HTMLElement>("[data-status-text]");
  const button = bar?.querySelector<HTMLButtonElement>("[data-status-action]");
  return bar && text && button ? { bar, text, button } : null;
}

export function showStatus(status: Status): void {
  const found = elements();
  if (!found) return;
  current?.detach();
  found.text.textContent = status.text;
  if (status.action) {
    const { onClick } = status.action;
    const handler = (): void => onClick();
    found.button.textContent = status.action.label;
    found.button.hidden = false;
    found.button.addEventListener("click", handler);
    current = { key: status.key, detach: () => found.button.removeEventListener("click", handler) };
  } else {
    found.button.hidden = true;
    found.button.textContent = "";
    current = { key: status.key, detach: () => undefined };
  }
  found.bar.hidden = false;
}

/** Hides the bar. With a key, only when that key's message is the one showing. */
export function hideStatus(key?: string): void {
  if (!current || (key !== undefined && current.key !== key)) return;
  const found = elements();
  current.detach();
  current = null;
  if (!found) return;
  found.bar.hidden = true;
  found.text.textContent = "";
  found.button.hidden = true;
}

export function isStatusShown(key: string): boolean {
  return current?.key === key;
}
