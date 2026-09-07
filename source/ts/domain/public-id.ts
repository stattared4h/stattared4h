/**
 * Normalises a visitor-facing animal identifier for matching and uniqueness checks.
 * Formatting characters that a visitor may copy differently — whitespace and hyphens —
 * do not affect identity. The original value is still kept for display.
 */
export function normalisePublicId(value: string): string {
  return value.normalize("NFKC").toLocaleUpperCase("sv-SE").replace(/[\s-]+/gu, "");
}

/** Visitor-facing IDs contain letters/numbers, with whitespace or hyphens as separators. */
export function isPublicIdFormat(value: string): boolean {
  return /^[\p{L}\p{N}](?:[\p{L}\p{N}\s-]*[\p{L}\p{N}])?$/u.test(value);
}
