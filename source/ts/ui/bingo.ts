/**
 * Djurbingo on the page (02-§12, 03-§10.2). Everything about rules is in
 * source/ts/domain/bingo.ts; this module reads the candidates the build put in the page,
 * builds the DOM for the board, opens the dialog and keeps the board in localStorage.
 *
 * The candidates are <template> elements in the page's pool, one per species or animal,
 * each holding the picture the build rendered. A square gets a clone of its template's
 * picture, so the image pipeline (srcset, alt, placeholder) is the site's own and nothing
 * here writes markup (CL-§2.13).
 *
 * The board is saved after every change and restored on the next visit, in this
 * browser only (ADR 0010). It never leaves the phone.
 */
import {
  buildBoard,
  foundCount,
  isFull,
  newlyCompletedLines,
  restoreBoard,
  serialiseBoard,
  toggleSquare,
  STORAGE_KEY,
  BOARD_SIZES,
  LEVELS,
  type Board,
  type BoardSize,
  type Candidate,
  type Level,
} from "../domain/bingo.ts";
import { burst } from "./confetti.ts";
import { playFanfare } from "./fanfare.ts";

interface Pool {
  candidates: Record<Level, Candidate[]>;
  templates: Map<string, HTMLTemplateElement>;
}

const MARK = "Hittat!";
const UNMARK = "Inte hittat ändå";

export function init(): void {
  const root = document.querySelector<HTMLElement>("[data-bingo]");
  if (root === null) return;
  const start = root.querySelector<HTMLFormElement>("[data-bingo-start]");
  const game = root.querySelector<HTMLElement>("[data-bingo-game]");
  const boardElement = root.querySelector<HTMLElement>("[data-bingo-board]");
  const progress = root.querySelector<HTMLElement>("[data-bingo-progress]");
  const win = root.querySelector<HTMLElement>("[data-bingo-win]");
  const again = root.querySelector<HTMLButtonElement>("[data-bingo-again]");
  const fresh = root.querySelector<HTMLButtonElement>("[data-bingo-new]");
  const poolElement = root.querySelector<HTMLElement>("[data-bingo-pool]");
  const dialog = root.querySelector<HTMLDialogElement>("[data-bingo-dialog]");
  if (!start || !game || !boardElement || !progress || !win || !again || !fresh || !poolElement || !dialog) return;
  if (typeof dialog.showModal !== "function") return;

  const dialogTitle = dialog.querySelector<HTMLElement>("[data-bingo-dialog-title]");
  const dialogImage = dialog.querySelector<HTMLElement>("[data-bingo-dialog-image]");
  const dialogText = dialog.querySelector<HTMLElement>("[data-bingo-dialog-text]");
  const dialogToggle = dialog.querySelector<HTMLButtonElement>("[data-bingo-dialog-toggle]");
  const dialogClose = dialog.querySelector<HTMLButtonElement>("[data-bingo-dialog-close]");
  if (!dialogTitle || !dialogImage || !dialogText || !dialogToggle || !dialogClose) return;

  const pool = readPool(poolElement);
  let board: Board | null = restoreBoard(readStored(), pool.candidates);
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
    if (board === null) return;
    const current = board;
    clear(boardElement);
    boardElement.style.setProperty("--bingo-size", String(current.size));
    current.squares.forEach((square, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = square.found ? "bingo-square bingo-square--found" : "bingo-square";
      button.setAttribute("aria-pressed", String(square.found));
      button.setAttribute("aria-label", square.found ? `${square.name}, hittad` : square.name);
      button.append(picture(pool, current.level, square.key));
      const name = document.createElement("span");
      name.className = "bingo-square__name";
      name.textContent = square.name;
      button.append(name);
      button.addEventListener("click", () => openSquare(index));
      boardElement.append(button);
    });
    const found = foundCount(current);
    const total = current.squares.length;
    progress.textContent = found === total ? "Alla hittade!" : `${found} av ${total} hittade`;
    win.hidden = !isFull(current);
  };

  const openSquare = (index: number): void => {
    if (board === null) return;
    const square = board.squares[index];
    openIndex = index;
    dialogTitle.textContent = square.name;
    clear(dialogImage);
    dialogImage.append(templateContent(pool, board.level, square.key));
    dialogText.textContent = square.found
      ? "Den här är avbockad. Tryck om du vill ta bort bocken."
      : board.level === "species"
        ? `Leta upp ${withArticle(square.name)} någonstans på gården och tryck på Hittat!`
        : `Leta upp just ${square.name} och tryck på Hittat!`;
    dialogToggle.textContent = square.found ? UNMARK : MARK;
    dialog.showModal();
  };

  dialogToggle.addEventListener("click", () => {
    if (board === null || openIndex < 0) return;
    const before = board;
    board = toggleSquare(board, openIndex);
    save(board);
    dialog.close();
    render();
    if (isFull(board)) {
      burst("big");
      playFanfare();
      navigator.vibrate?.([120, 60, 120, 60, 240]);
      win.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else if (newlyCompletedLines(before, board).length > 0) {
      burst("small");
      navigator.vibrate?.(80);
    }
  });

  dialogClose.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    // The board may have been re-rendered, so the pressed button is gone; focus the
    // square in its place.
    const buttons = boardElement.querySelectorAll<HTMLElement>(".bingo-square");
    if (openIndex >= 0 && openIndex < buttons.length) buttons[openIndex].focus();
    openIndex = -1;
  });

  start.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(start);
    const size = Number(data.get("size")) as BoardSize;
    const level = String(data.get("level")) as Level;
    if (!BOARD_SIZES.includes(size) || !LEVELS.includes(level)) return;
    const candidates = pool.candidates[level];
    if (candidates.length === 0) return;
    board = buildBoard(candidates, size, level, Math.random);
    save(board);
    showGame();
    render();
    window.scrollTo({ top: 0 });
  });

  const reset = (): void => {
    board = null;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage may be unavailable; the board in memory is gone either way.
    }
    showStart();
    window.scrollTo({ top: 0 });
  };
  again.addEventListener("click", reset);
  fresh.addEventListener("click", reset);

  if (board === null) showStart();
  else {
    showGame();
    render();
  }
}

/** The candidates per level and the template each one's picture lives in, keyed `level:key`. */
function readPool(poolElement: HTMLElement): Pool {
  const candidates: Record<Level, Candidate[]> = { species: [], animal: [] };
  const templates = new Map<string, HTMLTemplateElement>();
  for (const template of poolElement.querySelectorAll<HTMLTemplateElement>("template[data-level][data-key]")) {
    const level = template.dataset.level as Level;
    const key = template.dataset.key ?? "";
    const name = template.dataset.name ?? "";
    if (!LEVELS.includes(level) || key === "") continue;
    candidates[level].push({ key, name });
    templates.set(`${level}:${key}`, template);
  }
  return { candidates, templates };
}

/** A fresh copy of the candidate's picture, wrapped for the square it fills. */
function picture(pool: Pool, level: Level, key: string): Node {
  const wrapper = document.createElement("span");
  wrapper.className = "bingo-square__image";
  wrapper.append(templateContent(pool, level, key));
  return wrapper;
}

/**
 * A fresh, unwrapped copy of the candidate's picture. The dialog's own element already
 * carries the class that sizes the picture there (`bingo-dialog__image`), so this is
 * appended directly instead of inside another `.bingo-square__image` — two contexts
 * fighting over one class name is exactly the kind of thing that quietly breaks the next
 * time either one's CSS changes.
 */
function templateContent(pool: Pool, level: Level, key: string): Node {
  const template = pool.templates.get(`${level}:${key}`);
  return template === undefined ? document.createElement("span") : template.content.cloneNode(true);
}

/** "en get", "ett får": the indefinite article the species' own name takes. */
function withArticle(name: string): string {
  const lower = name.toLocaleLowerCase("sv");
  const neuter = ["får", "lamm", "svin", "djur"];
  return `${neuter.includes(lower) ? "ett" : "en"} ${lower}`;
}

function readStored(): unknown {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

function save(board: Board): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialiseBoard(board)));
  } catch {
    // Private mode or a full store: the game still works for this visit.
  }
}

function clear(element: Element): void {
  while (element.firstChild) element.firstChild.remove();
}
