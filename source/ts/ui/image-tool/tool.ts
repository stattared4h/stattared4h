/**
 * The image tool's page behaviour (02-§11, ADR 0021, ADR 0022).
 *
 * Loaded by `main.ts` in this folder, which is a bundle of its own written beside the
 * page rather than under `assets/`, so that the code an editor needs twice a year never
 * reaches the visitor standing at a paddock (02-§11.6).
 *
 * Nothing here talks to another host: the pictures are prepared in the browser and handed
 * back as files, and it is the editor who carries them to GitHub (02-§11.12, ADR 0014).
 *
 * The DOM is built with `createElement` and `textContent`, never `innerHTML` (CL-§2.13).
 * Everything worth testing lives in the domain layer; this file is the wiring.
 */
import {
  cluePostFile,
  cluePostProblems,
  formatCluePost,
  type CluePostFields,
} from "../../domain/clue-post.ts";
import { imageFileName, imagePostFile } from "../../domain/image-id.ts";
import { formatImagePost, imagePostProblems, type ImagePostFields } from "../../domain/image-post.ts";
import { createZip, type ZipEntry } from "../../domain/zip.ts";
import { prepareImage, type PreparedImage } from "./prepare.ts";

/** Where the two files belong in the repository, spelled as the archive spells them. */
const IMAGES_DIR = "source/images";
const DATA_DIR = "source/data";

interface Card {
  prepared: PreparedImage;
  alt: HTMLTextAreaElement;
  credit: HTMLInputElement;
  /** Ticked when the picture is a clue for Spana! (02-§11.25). */
  isClue: HTMLInputElement;
  /** The place that is the answer; empty until the editor picks one (02-§11.27). */
  place: HTMLSelectElement | null;
  clueText: HTMLInputElement;
  /** Shown only while the picture is a clue. */
  clueFields: HTMLElement;
  clueDownload: HTMLButtonElement;
  error: HTMLParagraphElement;
}

/** One thing to fix, and the control to send the editor to. */
interface Problem {
  message: string;
  control: HTMLElement;
}

const cards: Card[] = [];

function fieldsOf(card: Card): ImagePostFields {
  return { alt: card.alt.value, credit: card.credit.value };
}

function clueFieldsOf(card: Card): CluePostFields {
  return { location: card.place?.value ?? "", text: card.clueText.value };
}

/** True when this picture is being delivered as a clue as well (02-§11.25). */
function isClue(card: Card): boolean {
  return card.isClue.checked && card.place !== null;
}

/** Everything wrong with one card: the picture's own fields, and the clue's when it is one. */
function problemsOf(card: Card): Problem[] {
  const problems: Problem[] = imagePostProblems(fieldsOf(card)).map((problem) => ({
    message: problem.message,
    control: problem.field === "alt" ? card.alt : card.credit,
  }));
  if (isClue(card)) {
    for (const problem of cluePostProblems(clueFieldsOf(card))) {
      problems.push({
        message: problem.message,
        control: problem.field === "location" ? (card.place as HTMLSelectElement) : card.clueText,
      });
    }
  }
  return problems;
}

/** Shows what is missing on one card, and hands the problems back to the caller. */
function showProblems(card: Card): Problem[] {
  const problems = problemsOf(card);
  card.error.textContent = problems.map((problem) => problem.message).join(" ");
  card.error.hidden = problems.length === 0;
  const failing = new Set(problems.map((problem) => problem.control));
  for (const control of [card.alt, card.credit, card.clueText, ...(card.place === null ? [] : [card.place])]) {
    control.setAttribute("aria-invalid", String(failing.has(control)));
  }
  return problems;
}

/** Hands the browser a file to save. A user gesture is what got us here, so it is allowed. */
function download(name: string, data: Uint8Array, type: string): void {
  const url = URL.createObjectURL(new Blob([data as BlobPart], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  // In the document, because not every browser follows a click on a link that is not.
  document.body.append(link);
  link.click();
  link.remove();
  // Late enough for the download to have started, early enough not to hold the bytes.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function kilobytes(bytes: number): string {
  return `${Math.round(bytes / 1024)} KB`;
}

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className !== "") node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** A checkbox with its label beside it, the one place a label follows its control. */
function checkbox(label: string, input: HTMLInputElement, id: string): HTMLElement {
  const wrapper = element("div", "field");
  const labelNode = element("label", "choice");
  input.type = "checkbox";
  input.className = "choice__input";
  input.id = id;
  labelNode.htmlFor = id;
  labelNode.append(input, document.createTextNode(` ${label}`));
  wrapper.append(labelNode);
  return wrapper;
}

/** One labelled field, with the label above the control (05-§6.32). */
function field(label: string, control: HTMLElement, id: string, describedBy: string): HTMLElement {
  const wrapper = element("div", "field");
  const labelNode = element("label", "field__label", label);
  labelNode.htmlFor = id;
  control.id = id;
  control.setAttribute("aria-describedby", describedBy);
  wrapper.append(labelNode, control);
  return wrapper;
}

/**
 * The card for one prepared picture: what it became, what to write about it, and the
 * files it turns into. `places` is the select the build wrote into the page, or null when
 * the dataset has no places at all — then the picture cannot be a clue and the tick box
 * says why (02-§11.26).
 */
function buildCard(prepared: PreparedImage, places: HTMLTemplateElement | null): { node: HTMLLIElement; card: Card } {
  const node = element("li", "image-tool__item");
  const errorId = `fel-${prepared.id}`;

  const preview = element("img", "image-tool__preview");
  preview.src = URL.createObjectURL(new Blob([prepared.data as BlobPart], { type: "image/webp" }));
  // Decorative: the line below the picture says everything the editor needs in words.
  preview.alt = "";
  preview.width = prepared.width;
  preview.height = prepared.height;

  const facts = element(
    "p",
    "meta",
    `${prepared.sourceName} · ${prepared.id} · ${prepared.width} × ${prepared.height} px · ${kilobytes(prepared.data.byteLength)}`,
  );

  const alt = element("textarea", "field__input field__input--multiline");
  alt.rows = 3;
  const credit = element("input", "field__input");
  credit.type = "text";
  credit.autocomplete = "name";

  const error = element("p", "image-tool__error");
  error.id = errorId;
  error.hidden = true;
  error.setAttribute("role", "alert");

  const isClueBox = element("input", "");
  const place = places === null ? null : (places.content.cloneNode(true) as DocumentFragment).querySelector("select");
  const clueText = element("input", "field__input");
  clueText.type = "text";
  const clueFields = element("div", "image-tool__clue");
  clueFields.hidden = true;

  const clueDownload = element("button", "button button--secondary", "Ladda ner ledtråden");
  clueDownload.type = "button";
  clueDownload.hidden = true;

  const card: Card = { prepared, alt, credit, isClue: isClueBox, place, clueText, clueFields, clueDownload, error };

  if (place === null) {
    // Nothing to answer with: the dataset has no places, so a clue could not be finished
    // even if it were ticked. Saying so beats a tick box that silently does nothing.
    isClueBox.disabled = true;
    clueFields.append(element("p", "meta", "Gården har inga platser i datat ännu, så en bild kan inte bli en ledtråd."));
    clueFields.hidden = false;
  } else {
    clueFields.append(
      field("Var finns detaljen? Platsen är svaret spelaren får.", place, `plats-${prepared.id}`, errorId),
      field("Ledtråd (frivillig)", clueText, `ledtrad-${prepared.id}`, errorId),
    );
  }

  const showClueFields = (): void => {
    if (place === null) return;
    clueFields.hidden = !isClueBox.checked;
    clueDownload.hidden = !isClueBox.checked;
    if (!card.error.hidden || isClueBox.checked) showProblems(card);
  };
  isClueBox.addEventListener("change", showClueFields);

  const downloads = element("div", "image-tool__downloads");
  const imageButton = element("button", "button button--secondary", "Ladda ner bilden");
  imageButton.type = "button";
  imageButton.addEventListener("click", () => {
    if (showProblems(card).length === 0) download(imageFileName(prepared.id), prepared.data, "image/webp");
  });
  const postButton = element("button", "button button--secondary", "Ladda ner bildposten");
  postButton.type = "button";
  postButton.addEventListener("click", () => {
    if (showProblems(card).length > 0) return;
    download(`${prepared.id}.yaml`, new TextEncoder().encode(formatImagePost(fieldsOf(card))), "text/yaml");
  });
  clueDownload.addEventListener("click", () => {
    if (showProblems(card).length > 0) return;
    download(`${prepared.id}.yaml`, new TextEncoder().encode(formatCluePost(clueFieldsOf(card))), "text/yaml");
  });
  downloads.append(imageButton, postButton, clueDownload);

  for (const control of [alt, credit, clueText, ...(place === null ? [] : [place])]) {
    control.addEventListener("change", () => showProblems(card));
    // While a message is up, every keystroke may be the one that clears it.
    control.addEventListener("input", () => {
      if (!card.error.hidden) showProblems(card);
    });
  }

  node.append(
    preview,
    facts,
    field("Alt-text — vad är viktigt i bilden?", alt, `alt-${prepared.id}`, errorId),
    field("Fotograf", credit, `credit-${prepared.id}`, errorId),
    checkbox("Det här är en ledtråd till Spana!", isClueBox, `ledtrad-kryss-${prepared.id}`),
    clueFields,
    error,
    downloads,
  );
  return { node, card };
}

/**
 * The files one picture becomes, laid out as they lie in the repository: the picture, its
 * post, and — when it is a clue — the clue under the picture's own id, so the pair cannot
 * be separated on the way in (02-§11.28, 04-§11.2).
 */
function entriesFor(card: Card): ZipEntry[] {
  const encoder = new TextEncoder();
  const entries: ZipEntry[] = [
    { name: `${IMAGES_DIR}/${imageFileName(card.prepared.id)}`, data: card.prepared.data },
    { name: `${DATA_DIR}/${imagePostFile(card.prepared.id)}`, data: encoder.encode(formatImagePost(fieldsOf(card))) },
  ];
  if (isClue(card)) {
    entries.push({ name: `${DATA_DIR}/${cluePostFile(card.prepared.id)}`, data: encoder.encode(formatCluePost(clueFieldsOf(card))) });
  }
  return entries;
}

export function init(): void {
  const root = document.querySelector<HTMLElement>("[data-image-tool]");
  if (root === null) return;
  const input = root.querySelector<HTMLInputElement>("[data-image-tool-input]");
  const list = root.querySelector<HTMLOListElement>("[data-image-tool-list]");
  const status = root.querySelector<HTMLElement>("[data-image-tool-status]");
  const actions = root.querySelector<HTMLElement>("[data-image-tool-actions]");
  const zipButton = root.querySelector<HTMLButtonElement>("[data-image-tool-zip]");
  const blocked = root.querySelector<HTMLElement>("[data-image-tool-blocked]");
  const places = root.querySelector<HTMLTemplateElement>("[data-image-tool-places]");
  if (input === null || list === null || status === null || actions === null || zipButton === null || blocked === null) return;

  const say = (message: string): void => {
    status.textContent = message;
    status.hidden = message === "";
  };

  // What is missing is said again the next time the archive is asked for; leaving the
  // old sentence up while the editor types would only be one more thing to read past.
  list.addEventListener("input", () => {
    blocked.hidden = true;
  });

  input.addEventListener("change", () => {
    const files = [...(input.files ?? [])];
    if (files.length === 0) return;
    void (async () => {
      input.disabled = true;
      const skipped: string[] = [];
      const failed: string[] = [];
      for (const [index, file] of files.entries()) {
        say(`Bereder bild ${index + 1} av ${files.length}…`);
        try {
          const prepared = await prepareImage(file);
          // The id comes from the finished file, so the same photo twice is the same
          // picture — not a name clash, and not worth a second card (02-§11.11).
          if (cards.some((existing) => existing.prepared.id === prepared.id)) {
            skipped.push(file.name);
            continue;
          }
          const built = buildCard(prepared, places);
          list.append(built.node);
          cards.push(built.card);
        } catch (error) {
          failed.push(`${file.name}: ${error instanceof Error ? error.message : "okänt fel"}`);
        }
      }
      input.disabled = false;
      // The picker keeps its selection otherwise, and choosing the same file again would
      // then raise no change event at all.
      input.value = "";
      actions.hidden = cards.length === 0;

      const lines = [cards.length === 1 ? "1 bild är klar att fylla i." : `${cards.length} bilder är klara att fylla i.`];
      if (skipped.length > 0) lines.push(`Redan tillagd sedan tidigare: ${skipped.join(", ")}.`);
      if (failed.length > 0) lines.push(`Kunde inte beredas — ${failed.join("; ")}.`);
      say(lines.join(" "));
    })();
  });

  zipButton.addEventListener("click", () => {
    const checked = cards.map((card) => ({ card, problems: showProblems(card) }));
    const incomplete = checked.filter((row) => row.problems.length > 0);
    if (incomplete.length > 0) {
      const names = incomplete.map((row) => row.card.prepared.sourceName).join(", ");
      blocked.textContent = `Fyll i alt-text, fotograf och plats först. Det saknas för: ${names}.`;
      blocked.hidden = false;
      incomplete[0].problems[0].control.focus();
      return;
    }
    blocked.hidden = true;
    download("stattared4h-bilder.zip", createZip(cards.flatMap(entriesFor)), "application/zip");
  });
}
