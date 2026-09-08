/**
 * Writing a YAML scalar by hand (02-§11.21, 04-§11).
 *
 * The image tool and the clue it can deliver both write small YAML files in the browser,
 * where the `yaml` package must not go: no dependency reaches the visitor, and the tool
 * ships in the same repository (02-§9.5). Two files that spell the same value differently
 * would be two files for one fact, so the quoting rules live here and nowhere else.
 */

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

/** A value written the way YAML will read it back unchanged. */
export function yamlScalar(value: string): string {
  return isPlainSafe(value) ? value : quoteScalar(value);
}
