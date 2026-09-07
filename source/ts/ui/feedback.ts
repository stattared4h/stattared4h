/**
 * The feedback dialog (02-§10.15–10.20, 03-§10.3).
 *
 * A native <dialog> opened with showModal(): the browser keeps focus inside it and
 * closes it on Escape. A click on the backdrop lands on the dialog element itself,
 * because the dialog has no padding of its own (05-§6.35), and closes it too. When it
 * closes, focus goes back to the feedback button. The fields are never cleared, so
 * what the visitor wrote is still there if the dialog is opened again (02-§10.17).
 *
 * "Skicka" is enabled only when both fields are filled and the browser is online; the
 * hint under the fields says which of those is missing (05-§6.12, 02-§10.18). A press
 * opens GitHub's new-issue page in a new tab with everything pre-filled; the site
 * itself sends nothing (02-§10.20). The address is built by the domain layer.
 */
import { buildFeedbackUrl, CATEGORIES, isFeedbackComplete, type Category } from "../domain/feedback.ts";

const HINT_EMPTY = "Fyll i rubrik och beskrivning så går det att skicka.";
const HINT_READY = "Skicka öppnar GitHub i en ny flik. Där ser du allt innan du skapar ärendet.";
const HINT_OFFLINE = "Du är offline. Feedback kräver uppkoppling.";

export function init(): void {
  const button = document.querySelector<HTMLButtonElement>("[data-feedback-button]");
  const dialog = document.querySelector<HTMLDialogElement>("[data-feedback-dialog]");
  if (!button || !dialog || typeof dialog.showModal !== "function") return;

  const form = dialog.querySelector<HTMLFormElement>("[data-feedback-form]");
  const title = dialog.querySelector<HTMLInputElement>('input[name="title"]');
  const body = dialog.querySelector<HTMLTextAreaElement>('textarea[name="body"]');
  const submit = dialog.querySelector<HTMLButtonElement>("[data-feedback-submit]");
  const hint = dialog.querySelector<HTMLElement>("[data-feedback-hint]");
  const close = dialog.querySelector<HTMLButtonElement>("[data-feedback-close]");
  const repo = dialog.dataset.repo;
  if (!form || !title || !body || !submit || !hint || !close || !repo) return;

  const update = (): void => {
    const complete = isFeedbackComplete(title.value, body.value);
    const online = navigator.onLine !== false;
    submit.disabled = !complete || !online;
    hint.textContent = !online ? HINT_OFFLINE : complete ? HINT_READY : HINT_EMPTY;
  };

  title.addEventListener("input", update);
  body.addEventListener("input", update);
  window.addEventListener("online", update);
  window.addEventListener("offline", update);

  button.addEventListener("click", () => {
    update();
    dialog.showModal();
  });

  close.addEventListener("click", () => dialog.close());

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener("close", () => button.focus());

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    const url = buildFeedbackUrl({
      repo,
      category: selectedCategory(form),
      title: title.value,
      body: body.value,
      meta: {
        version: document.documentElement.dataset.version || null,
        page: location.href,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        time: new Date(),
        userAgent: navigator.userAgent,
      },
    });
    window.open(url, "_blank", "noopener");
    dialog.close();
  });

  update();
}

function selectedCategory(form: HTMLFormElement): Category {
  const value = new FormData(form).get("category");
  const found = CATEGORIES.find((category) => category === value);
  return found ?? CATEGORIES[0];
}
