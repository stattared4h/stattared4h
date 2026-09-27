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
import { guessPlace, MAX_FARM_DISTANCE_METRES, onTheFarm, type PlacePoint } from "../../domain/photo-position.ts";
import { placeFileUrl, placePhotoLines } from "../../domain/place-link.ts";
import type { GeoPoint } from "../../domain/types.ts";
import { createZip, type ZipEntry } from "../../domain/zip.ts";
import { prepareImage, type PreparedImage } from "./prepare.ts";

/** Where the two files belong in the repository, spelled as the archive spells them. */
const IMAGES_DIR = "source/images";
const DATA_DIR = "source/data";

/**
 * What the build wrote into the page about the farm's places (03-§11.8): where they are,
 * for the farm's border and the guess, and whether each file already has a `photos` list.
 */
interface Places {
  template: HTMLTemplateElement;
  points: PlacePoint[];
  withPhotos: Set<string>;
  /** The repository on github.com, for the link to a place's file. */
  repo: string;
}

interface Card {
  prepared: PreparedImage;
  /** The photo's position when it is on the farm; this is what the post carries (02-§11.33). */
  position: GeoPoint | null;
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
  return { alt: card.alt.value, credit: card.credit.value, position: card.position };
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

/** A fresh copy of the place select the build wrote into the page. */
function placeSelect(places: Places | null): HTMLSelectElement | null {
  if (places === null) return null;
  return (places.template.content.cloneNode(true) as DocumentFragment).querySelector("select");
}

/** The position the post may carry, and the sentence that says so (02-§11.33, 02-§11.34). */
function keptPosition(position: GeoPoint | null, places: Places | null): { position: GeoPoint | null; note: string } {
  if (position === null) return { position: null, note: "Fotot har ingen position, så bildposten får ingen." };
  if (!onTheFarm(position, places?.points ?? [])) {
    return {
      position: null,
      note: `Fotots position ligger mer än ${MAX_FARM_DISTANCE_METRES} m från gården och följer inte med.`,
    };
  }
  return { position, note: "Fotots position följer med i bildposten." };
}

/**
 * Which place the picture belongs to, and what to add to that place's file for it to show
 * there (02-§11.35–11.38). The select is a copy of the clue's; the guess comes from the
 * photo's position when there is one close enough. Nothing here writes the place's file:
 * the editor adds the lines on GitHub, on the same branch as the pictures.
 */
function belongsTo(
  prepared: PreparedImage,
  position: GeoPoint | null,
  places: Places | null,
): { fields: HTMLElement[]; select: HTMLSelectElement | null } {
  const select = placeSelect(places);
  if (select === null || places === null) return { fields: [], select: null };
  const hintId = `plats-bild-tips-${prepared.id}`;

  const guess = position === null ? null : guessPlace(position, places.points);
  if (guess !== null) select.value = guess;
  const hint = element("p", "meta", "Förvald efter var fotot togs. Byt om den är fel.");
  hint.id = hintId;

  const block = element("div", "image-tool__place");
  const how = element("p", "");
  const lines = element("pre", "image-tool__lines");
  const code = element("code", "");
  lines.append(code);
  const copy = element("button", "button button--secondary", "Kopiera");
  copy.type = "button";
  const link = element("a", "", "Öppna platsens fil på GitHub");
  link.target = "_blank";
  link.rel = "noopener";
  const copied = element("p", "meta");
  copied.setAttribute("role", "status");
  const row = element("div", "image-tool__copy");
  row.append(copy, link);
  block.append(how, lines, row, copied);

  const update = (): void => {
    const id = select.value;
    hint.hidden = guess === null || id !== guess;
    block.hidden = id === "";
    copied.textContent = "";
    if (id === "") return;
    const hasPhotos = places.withPhotos.has(id);
    how.replaceChildren(
      ...(hasPhotos
        ? ["Lägg till raden sist i listan under ", element("code", "", "photos:"), " i platsens fil, på samma gren som bilderna."]
        : [
            "Lägg till raderna sist i platsens fil, på samma gren som bilderna. Står det ",
            element("code", "", "photos: []"),
            " i filen, ta bort den raden först.",
          ]),
    );
    code.textContent = placePhotoLines(prepared.id, hasPhotos);
    link.href = placeFileUrl(places.repo, id);
  };
  select.addEventListener("change", update);
  copy.addEventListener("click", () => {
    void navigator.clipboard.writeText(`${code.textContent ?? ""}\n`).then(
      () => {
        copied.textContent = "Kopierat.";
      },
      () => {
        copied.textContent = "Det gick inte att kopiera. Markera raderna och kopiera dem själv.";
      },
    );
  });
  update();

  const wrapper = field("Bilden hör till platsen (frivilligt)", select, `plats-bild-${prepared.id}`, hintId);
  wrapper.append(hint);
  return { fields: [wrapper, block], select };
}

/**
 * The card for one prepared picture: what it became, what to write about it, and the
 * files it turns into. `places` is what the build wrote into the page, or null when the
 * dataset has no places at all — then the picture cannot be a clue and the tick box says
 * why (02-§11.26), and there is no place for it to belong to.
 */
function buildCard(prepared: PreparedImage, places: Places | null): { node: HTMLLIElement; card: Card } {
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
  const kept = keptPosition(prepared.position, places);
  const positionNote = element("p", "meta", kept.note);

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
  const place = placeSelect(places);
  const clueText = element("input", "field__input");
  clueText.type = "text";
  const clueFields = element("div", "image-tool__clue");
  clueFields.hidden = true;

  const clueDownload = element("button", "button button--secondary", "Ladda ner ledtråden");
  clueDownload.type = "button";
  clueDownload.hidden = true;

  const card: Card = {
    prepared,
    position: kept.position,
    alt,
    credit,
    isClue: isClueBox,
    place,
    clueText,
    clueFields,
    clueDownload,
    error,
  };

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
    positionNote,
    field("Alt-text — vad är viktigt i bilden?", alt, `alt-${prepared.id}`, errorId),
    field("Fotograf", credit, `credit-${prepared.id}`, errorId),
    ...belongsTo(prepared, kept.position, places).fields,
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

/** The places as the build wrote them into the template's options (03-§11.8). */
function readPlaces(template: HTMLTemplateElement, repo: string): Places {
  const points: PlacePoint[] = [];
  const withPhotos = new Set<string>();
  for (const option of template.content.querySelectorAll("option")) {
    if (option.value === "") continue;
    if (option.dataset.photos === "true") withPhotos.add(option.value);
    const lat = Number(option.dataset.lat);
    const lon = Number(option.dataset.lon);
    if (option.dataset.lat !== undefined && Number.isFinite(lat) && Number.isFinite(lon)) {
      points.push({ id: option.value, lat, lon });
    }
  }
  return { template, points, withPhotos, repo };
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
  const template = root.querySelector<HTMLTemplateElement>("[data-image-tool-places]");
  if (input === null || list === null || status === null || actions === null || zipButton === null || blocked === null) return;
  const places = template === null ? null : readPlaces(template, root.dataset.repo ?? "");

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
