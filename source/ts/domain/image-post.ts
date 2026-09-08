/**
 * The image post as a file, and the check that it is filled in (02-§11.14, 02-§11.15,
 * 02-§11.21, 04-§9).
 *
 * `npm run image` and the image tool in the browser both write the post through
 * `formatImagePost`, so the same picture gives the same file whichever way it came in.
 * The tool cannot use the `yaml` package for it — no dependency reaches the visitor
 * (02-§9.5) — so the two fields are written here by hand, quoted whenever a plain scalar
 * would be read as something other than the text that was typed.
 *
 * `imagePostProblems` is the validator's rules for an image post, phrased for the editor
 * standing in a paddock rather than for a pull request: the same fields must be there,
 * carry no markup, and not claim a generated picture is the farm's own (02-§8.21).
 */
import { containsHtml } from "./plain-text.ts";

export interface ImagePostFields {
  alt: string;
  credit: string;
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
 * A plain scalar is safe when it starts with a letter and carries no colon, no number
 * sign and no control character. That rules out every indicator YAML reads specially at
 * the start of a value, and both `key: value` and `value # comment` inside one.
 */
const PLAIN_SAFE = /^\p{L}[^\p{C}:#]*$/u;

/** Plain words YAML reads as a boolean or as nothing at all. */
const RESERVED_WORDS = /^(?:y|n|yes|no|true|false|on|off|null)$/i;

/** The last character before the printable range, and the one just after it. */
const FIRST_PRINTABLE = 0x20;
const DELETE_CHARACTER = 0x7f;

function isPlainSafe(value: string): boolean {
  return value === value.trim() && PLAIN_SAFE.test(value) && !RESERVED_WORDS.test(value);
}

/** A double-quoted YAML scalar, with the escapes the format defines. */
function quoteScalar(value: string): string {
  let out = '"';
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;
    if (character === '"' || character === "\\") out += `\\${character}`;
    else if (character === "\n") out += "\\n";
    else if (character === "\r") out += "\\r";
    else if (character === "\t") out += "\\t";
    else if (code < FIRST_PRINTABLE || code === DELETE_CHARACTER) out += `\\x${code.toString(16).padStart(2, "0")}`;
    else out += character;
  }
  return `${out}"`;
}

function scalar(value: string): string {
  return isPlainSafe(value) ? value : quoteScalar(value);
}

/** The file `source/data/images/<bild-id>.yaml`: `alt` and `credit`, one line each. */
export function formatImagePost(fields: ImagePostFields): string {
  return `alt: ${scalar(fields.alt)}\ncredit: ${scalar(fields.credit)}\n`;
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
