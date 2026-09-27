/**
 * The image post as a file, and the check that it is filled in (02-§11.14, 02-§11.15,
 * 02-§11.21, 04-§9).
 *
 * `npm run image` and the image tool in the browser both write the post through
 * `formatImagePost`, so the same picture gives the same file whichever way it came in.
 * The quoting is in `yaml-scalar.ts`, shared with the clue the tool can deliver beside
 * the picture (04-§11).
 *
 * `imagePostProblems` is the validator's rules for an image post, phrased for the editor
 * standing in a paddock rather than for a pull request: the same fields must be there,
 * carry no markup, and not claim a generated picture is the farm's own (02-§8.21).
 */
import { roundPosition } from "./photo-position.ts";
import { containsHtml } from "./plain-text.ts";
import type { GeoPoint } from "./types.ts";
import { yamlScalar } from "./yaml-scalar.ts";

export interface ImagePostFields {
  alt: string;
  credit: string;
  /** The photo's position, when it carried one that is on the farm (02-§11.31, 02-§11.33). */
  position?: GeoPoint | null;
}

export type ImagePostField = "alt" | "credit";

export interface ImagePostProblem {
  field: ImagePostField;
  /** Swedish, addressed to the editor (CL-§1.10). */
  message: string;
}

/** The prefix that marks a generated picture; refused outside the QA dataset (02-§8.21). */
const AI_CREDIT_PREFIX = "AI-genererad";

/**
 * The file `source/data/images/<bild-id>.yaml`: `alt` and `credit`, one line each, and
 * `lat` and `lon` after them when there is a position (04-§9.13).
 */
export function formatImagePost(fields: ImagePostFields): string {
  const lines = [`alt: ${yamlScalar(fields.alt)}`, `credit: ${yamlScalar(fields.credit)}`];
  if (fields.position) {
    const { lat, lon } = roundPosition(fields.position);
    lines.push(`lat: ${lat}`, `lon: ${lon}`);
  }
  return `${lines.join("\n")}\n`;
}

/**
 * What is wrong with the post, in the order the fields are shown. An empty list means
 * the files can be handed over; anything else is shown next to the picture, before the
 * editor has spent a trip to GitHub finding out (02-§11.14).
 */
export function imagePostProblems(fields: ImagePostFields): ImagePostProblem[] {
  const problems: ImagePostProblem[] = [];

  if (fields.alt.trim() === "") {
    problems.push({ field: "alt", message: "Skriv en alt-text som beskriver vad som är viktigt i bilden." });
  } else if (containsHtml(fields.alt)) {
    problems.push({ field: "alt", message: "Alt-texten får inte innehålla HTML. Skriv ren text." });
  }

  if (fields.credit.trim() === "") {
    problems.push({ field: "credit", message: "Skriv vem som tagit bilden." });
  } else if (containsHtml(fields.credit)) {
    problems.push({ field: "credit", message: "Fotografens namn får inte innehålla HTML. Skriv ren text." });
  } else if (fields.credit.startsWith(AI_CREDIT_PREFIX)) {
    problems.push({
      field: "credit",
      message: `Fotografen får inte börja med "${AI_CREDIT_PREFIX}". Genererade bilder hör bara till QA-datasetet.`,
    });
  }

  return problems;
}
