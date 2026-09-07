/**
 * Swedish wording the pages need (02-§5.11, 02-§5.17, 02-§5.21).
 *
 * The data stores one plural per species — "Getter" — and the pages need the definite
 * form for headings and questions: "Getterna på gården", "Var finns getterna?". The
 * definite plural follows a small rule that covers every farm animal we know of, so
 * the vocabulary does not need a second field that could drift from the first.
 */

/**
 * "Getter" → "Getterna", "Kor" → "Korna", "Får" → "Fåren", "Höns" → "Hönsen",
 * "Äpplen" → "Äpplena". Plurals in -ar, -er and -or take -na; plurals in -en take -a;
 * everything else — the zero plurals of neuter and long-vowel words — takes -en.
 */
export function definitePlural(plural: string): string {
  if (/[aeo]r$/i.test(plural)) return `${plural}na`;
  if (/en$/i.test(plural)) return `${plural}a`;
  return `${plural}en`;
}

/** First letter to lower case, for a word that stands mid-sentence: "Fåren" → "fåren". */
export function lowerFirst(text: string): string {
  return text.charAt(0).toLocaleLowerCase("sv") + text.slice(1);
}

/** "a", "a och b", "a, b och c". */
export function joinSwedish(items: readonly string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} och ${items[items.length - 1]}`;
}
