/**
 * The clue post as a file, and the check that it is filled in (02-§11.25–11.29, 04-§11).
 *
 * The image tool writes it beside the picture it belongs to, under the picture's own id
 * (04-§11.2), so the two files cannot be separated or mismatched on the way into the
 * repository. What comes out passes `npm run validate` without any tidying afterwards
 * (02-§11.23) — `tests/domain/clue-post.test.ts` runs the written file back through the
 * real validator rather than trusting that the shapes still match.
 *
 * `cluePostProblems` is the validator's rules for a clue, phrased for the editor standing
 * in a paddock rather than for a pull request.
 */
import { containsHtml } from "./plain-text.ts";
import { yamlScalar } from "./yaml-scalar.ts";

/** 04-§11.4: the same limit the validator enforces, written once. */
export const MAX_CLUE_TEXT_LENGTH = 120;

export interface CluePostFields {
  /** The id of the place that is the answer, or "" while the editor has not picked one. */
  location: string;
  /** The clue's own line; empty means the picture is the whole clue. */
  text: string;
}

export type CluePostField = "location" | "text";

export interface CluePostProblem {
  field: CluePostField;
  /** Swedish, addressed to the editor (CL-§1.10). */
  message: string;
}

/** `img-a3f2c1d8b901` → `clues/img-a3f2c1d8b901.yaml`, relative to the dataset directory. */
export function cluePostFile(id: string): string {
  return `clues/${id}.yaml`;
}

/**
 * The file `source/data/clues/<bild-id>.yaml`: `location`, and `text` when there is one.
 * An empty text is left out rather than written as an empty line — the contract says the
 * field is optional, and a blank one fails validation (04-§11.4).
 */
export function formatCluePost(fields: CluePostFields): string {
  const text = fields.text.trim();
  const lines = [`location: ${yamlScalar(fields.location)}`];
  if (text !== "") lines.push(`text: ${yamlScalar(text)}`);
  return `${lines.join("\n")}\n`;
}

/**
 * What is wrong with the clue, in the order the fields are shown. An empty list means the
 * file can be handed over; anything else is shown next to the picture, before the editor
 * has spent a trip to GitHub finding out (02-§11.27).
 */
export function cluePostProblems(fields: CluePostFields): CluePostProblem[] {
  const problems: CluePostProblem[] = [];

  if (fields.location.trim() === "") {
    problems.push({ field: "location", message: "Välj platsen där detaljen finns. Den är svaret spelaren får." });
  }

  const text = fields.text.trim();
  if (containsHtml(fields.text)) {
    problems.push({ field: "text", message: "Ledtråden får inte innehålla HTML. Skriv ren text." });
  } else if (text.length > MAX_CLUE_TEXT_LENGTH) {
    problems.push({
      field: "text",
      message: `Ledtråden är ${text.length} tecken; skriv högst ${MAX_CLUE_TEXT_LENGTH}.`,
    });
  }

  return problems;
}
