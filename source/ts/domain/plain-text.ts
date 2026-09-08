/**
 * The rule that keeps markup out of the data (04-§10.9).
 *
 * The validator refuses a field that carries HTML, and the image tool has to refuse the
 * same thing before it hands the editor a file that CI would reject. One rule, one
 * place, so the two can never drift apart.
 */

/** Anything that looks like the start of an HTML tag, comment or doctype. */
export const HTML_PATTERN = /<[a-zA-Z/!]/;

export function containsHtml(value: string): boolean {
  return HTML_PATTERN.test(value);
}
