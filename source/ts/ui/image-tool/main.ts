/**
 * The image tool's page behaviour (02-§11, ADR 0021, ADR 0022).
 *
 * Its own bundle, written beside the page rather than under `assets/`, so that the code
 * an editor needs twice a year never reaches the visitor standing at a paddock
 * (02-§11.6). Nothing here talks to another host: the pictures are prepared in the
 * browser and handed back as files, and it is the editor who carries them to GitHub
 * (02-§11.12, ADR 0014).
 *
 * The DOM is built with `createElement` and `textContent`, never `innerHTML` (CL-§2.13).
 * Everything worth testing lives in the domain layer; this file is the wiring.
 */
import { imageFileName, imagePostFile } from "../../domain/image-id.ts";
import { formatImagePost, imagePostProblems, type ImagePostFields } from "../../domain/image-post.ts";
import { createZip, type ZipEntry } from "../../domain/zip.ts";
import { prepareImage, type PreparedImage } from "./prepare.ts";

/** Where the two files belong in the repository, spelled as the archive spells them. */
const IMAGES_DIR = "source/images";
const POSTS_DIR = "source/data";

interface Card {
  prepared: PreparedImage;
  alt: HTMLTextAreaElement;
  credit: HTMLInputElement;
  error: HTMLParagraphElement;
}

const cards: Card[] = [];

function fieldsOf(card: Card): ImagePostFields {
  return { alt: card.alt.value, credit: card.credit.value };
}

/** Shows what is missing on one card, and says whether it is complete. */
function showProblems(card: Card): boolean {
  const problems = imagePostProblems(fieldsOf(card));
  card.error.textContent = problems.map((problem) => problem.message).join(" ");
  card.error.hidden = problems.length === 0;
  card.alt.setAttribute("aria-invalid", String(problems.some((problem) => problem.field === "alt")));
  card.credit.setAttribute("aria-invalid", String(problems.some((problem) => problem.field === "credit")));
  return problems.length === 0;
}

/** Hands the browser a file to save. A user gesture is what got us here, so it is allowed. */
function download(name: string, data: Uint8Array, type: string): void {
  const url = URL.createObjectURL(new Blob([data as BlobPart], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
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

function card(prepared: PreparedImage): { node: HTMLLIElement; card: Card } {
  const node = element("li", "image-tool__item");
  const errorId = `fel-${prepared.id}`;

  const preview = element("img", "image-tool__preview");
  preview.src = URL.createObjectURL(new Blob([prepared.data as BlobPart], { type: "image/webp" }));
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

  const built: Card = { prepared, alt, credit, error };

  const downloads = element("div", "image-tool__downloads");
  const imageButton = element("button", "button button--secondary", "Ladda ner bilden");
  imageButton.type = "button";
  imageButton.addEventListener("click", () => {
    if (showProblems(built)) download(imageFileName(prepared.id), prepared.data, "image/webp");
  });
  const postButton = element("button", "button button--secondary", "Ladda ner bildposten");
  postButton.type = "button";
  postButton.addEventListener("click", () => {
    if (!showProblems(built)) return;
    const yaml = new TextEncoder().encode(formatImagePost(fieldsOf(built)));
    download(`${prepared.id}.yaml`, yaml, "text/yaml");
  });
  downloads.append(imageButton, postButton);

  for (const control of [alt, credit]) {
    control.addEventListener("change", () => showProblems(built));
    control.addEventListener("input", () => {
      if (!built.error.hidden) showProblems(built);
    });
  }

  node.append(
    preview,
    facts,
    field("Alt-text — vad är viktigt i bilden?", alt, `alt-${prepared.id}`, errorId),
    field("Fotograf", credit, `credit-${prepared.id}`, errorId),
    error,
    downloads,
  );
  return { node, card: built };
}

/** The two files one picture becomes, laid out as they lie in the repository. */
function entriesFor(card: Card): ZipEntry[] {
  return [
    { name: `${IMAGES_DIR}/${imageFileName(card.prepared.id)}`, data: card.prepared.data },
    { name: `${POSTS_DIR}/${imagePostFile(card.prepared.id)}`, data: new TextEncoder().encode(formatImagePost(fieldsOf(card))) },
  ];
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
  if (input === null || list === null || status === null || actions === null || zipButton === null || blocked === null) return;

  const say = (message: string): void => {
    status.textContent = message;
    status.hidden = message === "";
  };

  input.addEventListener("change", () => {
    const files = [...(input.files ?? [])];
    if (files.length === 0) return;
    void (async () => {
      input.disabled = true;
      const added: string[] = [];
      const skipped: string[] = [];
      const failed: string[] = [];
      for (const [index, file] of files.entries()) {
        say(`Bereder bild ${index + 1} av ${files.length}…`);
        try {
          const prepared = await prepareImage(file);
          if (cards.some((existing) => existing.prepared.id === prepared.id)) {
            skipped.push(file.name);
            continue;
          }
          const built = card(prepared);
          list.append(built.node);
          cards.push(built.card);
          added.push(file.name);
        } catch (error) {
          failed.push(`${file.name}: ${error instanceof Error ? error.message : "okänt fel"}`);
        }
      }
      input.disabled = false;
      // The picker keeps its selection otherwise, and picking the same file again would
      // then raise no change event at all.
      input.value = "";
      actions.hidden = cards.length === 0;

      const lines = [`${cards.length} ${cards.length === 1 ? "bild är" : "bilder är"} klara att fylla i.`];
      if (added.length === 0 && skipped.length + failed.length === 0) lines.push("Ingen bild lades till.");
      if (skipped.length > 0) lines.push(`Redan tillagd sedan tidigare: ${skipped.join(", ")}.`);
      if (failed.length > 0) lines.push(`Kunde inte beredas — ${failed.join("; ")}.`);
      say(lines.join(" "));
    })();
  });

  zipButton.addEventListener("click", () => {
    const incomplete = cards.filter((entry) => !showProblems(entry));
    if (incomplete.length > 0) {
      blocked.textContent =
        `Fyll i alt-text och fotograf först. Det saknas för: ${incomplete.map((entry) => entry.prepared.sourceName).join(", ")}.`;
      blocked.hidden = false;
      incomplete[0].alt.focus();
      return;
    }
    blocked.hidden = true;
    const archive = createZip(cards.flatMap(entriesFor));
    download("stattared4h-bilder.zip", archive, "application/zip");
  });
}

init();
