/**
 * Spana! on the page (02-§13, 03-§12.4). Everything about rules is in
 * source/ts/domain/spana.ts; this module reads the clues the build put in the page,
 * builds the DOM for the round, opens the dialog and keeps the round in localStorage.
 *
 * The clues are <template> elements in the page's pool, one per clue, each holding the
 * picture the build rendered and carrying the clue's text and its answer on data
 * attributes. A stop gets a clone of its template's picture, so the image pipeline
 * (srcset, alt, placeholder) is the site's own and nothing here writes markup (CL-§2.13).
 *
 * The dialog stays open when a stop is marked, because that is where the answer appears
 * (02-§13.13): closing it would hide the one thing the press was for. Djurbingo closes
 * its dialog instead — there the press has nothing left to say.
 *
 * The round is saved after every change and restored on the next visit, in this browser
 * only (ADR 0010). It never leaves the phone.
 */
import {
  buildHunt,
  foundCount,
  isComplete,
  restoreHunt,
  serialiseHunt,
  toggleStop,
  HUNT_SIZES,
  LEVELS,
  STORAGE_KEY,
  type Candidate,
  type Hunt,
  type HuntSize,
  type Level,
} from "../domain/spana.ts";
import { burst } from "./confetti.ts";
import { playFanfare } from "./fanfare.ts";

interface Pool {
  candidates: Candidate[];
  templates: Map<string, HTMLTemplateElement>;
}

const MARK = "Hittat!";
const UNMARK = "Inte hittat ändå";

/** The answer, once the player has said they found it (02-§13.13). A fact, not a verdict. */
export function answerSentence(place: string): string {
  return `Detaljen finns vid ${place}.`;
}

/** "3 av 8 hittade", and something to be pleased about when the round is done (02-§13.15). */
export function progressText(found: number, total: number): string {
  return found === total ? "Alla hittade!" : `${found} av ${total} hittade`;
}

/** What a screen reader says about a stop. The number is the one the eye sees, so it starts at one. */
export function stopLabel(index: number, found: boolean): string {
  const name = `Stopp ${index + 1}`;
  return found ? `${name}, hittad` : name;
}

export function init(): void {
  const root = document.querySelector<HTMLElement>("[data-spana]");
  if (root === null) return;
  const start = root.querySelector<HTMLFormElement>("[data-spana-start]");
  const game = root.querySelector<HTMLElement>("[data-spana-game]");
  const list = root.querySelector<HTMLElement>("[data-spana-list]");
  const progress = root.querySelector<HTMLElement>("[data-spana-progress]");
  const win = root.querySelector<HTMLElement>("[data-spana-win]");
  const again = root.querySelector<HTMLButtonElement>("[data-spana-again]");
  const fresh = root.querySelector<HTMLButtonElement>("[data-spana-new]");
  const poolElement = root.querySelector<HTMLElement>("[data-spana-pool]");
  const dialog = root.querySelector<HTMLDialogElement>("[data-spana-dialog]");
  if (!start || !game || !list || !progress || !win || !again || !fresh || !poolElement || !dialog) return;
  if (typeof dialog.showModal !== "function") return;

  const dialogTitle = dialog.querySelector<HTMLElement>("[data-spana-dialog-title]");
  const dialogImage = dialog.querySelector<HTMLElement>("[data-spana-dialog-image]");
  const dialogText = dialog.querySelector<HTMLElement>("[data-spana-dialog-text]");
  const dialogAnswer = dialog.querySelector<HTMLElement>("[data-spana-dialog-answer]");
  const dialogToggle = dialog.querySelector<HTMLButtonElement>("[data-spana-dialog-toggle]");
  const dialogClose = dialog.querySelector<HTMLButtonElement>("[data-spana-dialog-close]");
  if (!dialogTitle || !dialogImage || !dialogText || !dialogAnswer || !dialogToggle || !dialogClose) return;

  const pool = readPool(poolElement);
  let hunt: Hunt | null = restoreHunt(readStored(), pool.candidates);
  let openIndex = -1;

  const showStart = (): void => {
    start.hidden = false;
    game.hidden = true;
  };

  const showGame = (): void => {
    start.hidden = true;
    game.hidden = false;
  };

  const render = (): void => {
    if (hunt === null) return;
    const current = hunt;
    clear(list);
    current.stops.forEach((stop, index) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = stop.found ? "spana-stop spana-stop--found" : "spana-stop";
      button.setAttribute("aria-pressed", String(stop.found));
      button.setAttribute("aria-label", stopLabel(index, stop.found));
      const image = document.createElement("span");
      image.className = "spana-stop__image";
      image.append(templateContent(pool, stop.key));
      button.append(image);
      const number = document.createElement("span");
      number.className = "spana-stop__number";
      number.textContent = `Stopp ${index + 1}`;
      button.append(number);
      button.addEventListener("click", () => openStop(index));
      item.append(button);
      list.append(item);
    });
    progress.textContent = progressText(foundCount(current), current.stops.length);
    win.hidden = !isComplete(current);
  };

  /** The dialog's contents for the stop that is open: picture, clue, answer, button. */
  const showStop = (index: number): void => {
    if (hunt === null) return;
    const stop = hunt.stops[index];
    dialogTitle.textContent = `Stopp ${index + 1}`;
    clear(dialogImage);
    dialogImage.append(templateContent(pool, stop.key));
    // The clue's own words are the easy level's help; the hard level is the picture alone
    // (02-§13.7). A clue without a text has nothing to hide either way.
    const text = hunt.level === "easy" ? stop.text : null;
    dialogText.textContent = text ?? "";
    dialogText.hidden = text === null;
    dialogAnswer.textContent = stop.found ? answerSentence(stop.location) : "";
    dialogAnswer.hidden = !stop.found;
    dialogToggle.textContent = stop.found ? UNMARK : MARK;
  };

  const openStop = (index: number): void => {
    if (hunt === null) return;
    openIndex = index;
    showStop(index);
    dialog.showModal();
  };

  dialogToggle.addEventListener("click", () => {
    if (hunt === null || openIndex < 0) return;
    hunt = toggleStop(hunt, openIndex);
    save(hunt);
    // The dialog stays where it is: the answer belongs in it, next to the picture the
    // player has just been looking for (02-§13.13).
    showStop(openIndex);
    render();
    if (!hunt.stops[openIndex].found) return;
    if (isComplete(hunt)) {
      burst("big");
      playFanfare();
      navigator.vibrate?.([120, 60, 120, 60, 240]);
    } else {
      burst("small");
      navigator.vibrate?.(80);
    }
  });

  dialogClose.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    // The list has been re-rendered, so the button that opened the dialog is gone; focus
    // the one standing in its place.
    const buttons = list.querySelectorAll<HTMLElement>(".spana-stop");
    if (openIndex >= 0 && openIndex < buttons.length) buttons[openIndex].focus();
    openIndex = -1;
    if (hunt !== null && isComplete(hunt)) win.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  start.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(start);
    const size = Number(data.get("size")) as HuntSize;
    const level = String(data.get("level")) as Level;
    if (!HUNT_SIZES.includes(size) || !LEVELS.includes(level)) return;
    if (pool.candidates.length === 0) return;
    hunt = buildHunt(pool.candidates, size, level, Math.random);
    save(hunt);
    showGame();
    render();
    window.scrollTo({ top: 0 });
  });

  const reset = (): void => {
    hunt = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage may be unavailable; the round in memory is gone either way.
    }
    showStart();
    window.scrollTo({ top: 0 });
  };
  again.addEventListener("click", reset);
  fresh.addEventListener("click", reset);

  if (hunt === null) showStart();
  else {
    showGame();
    render();
  }
}

/** The clues and the template each one's picture lives in, keyed by the clue's id. */
function readPool(poolElement: HTMLElement): Pool {
  const candidates: Candidate[] = [];
  const templates = new Map<string, HTMLTemplateElement>();
  for (const template of poolElement.querySelectorAll<HTMLTemplateElement>("template[data-clue]")) {
    const key = template.dataset.clue ?? "";
    // `data-place`, not `data-location`: no page on this site writes that word (ADR 0012).
    const location = template.dataset.place ?? "";
    if (key === "" || location === "") continue;
    candidates.push({ key, location, text: template.dataset.text ?? null });
    templates.set(key, template);
  }
  return { candidates, templates };
}

/**
 * A fresh copy of the clue's picture. Both the stop and the dialog wrap it in their own
 * element, so nothing is wrapped here: two contexts fighting over one class name is
 * exactly the kind of thing that quietly breaks the next time either one's CSS changes.
 */
function templateContent(pool: Pool, key: string): Node {
  const template = pool.templates.get(key);
  return template === undefined ? document.createElement("span") : template.content.cloneNode(true);
}

function readStored(): unknown {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

function save(hunt: Hunt): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialiseHunt(hunt)));
  } catch {
    // Private mode or a full store: the game still works for this visit.
  }
}

function clear(element: Element): void {
  while (element.firstChild) element.firstChild.remove();
}
