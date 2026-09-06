/**
 * `born` handling (04-§4.6, 02-§6.7).
 *
 * YAML hands us a string ("2021-04-12"), a number (2016) or, with a timestamp-aware
 * schema, a Date. The validator normalises all of them to "YYYY-MM-DD" or "YYYY"; the
 * pages format that string for the visitor.
 */

export type BornResult = { ok: true; value: string | null } | { ok: false; message: string };

const MONTHS_SV = [
  "januari",
  "februari",
  "mars",
  "april",
  "maj",
  "juni",
  "juli",
  "augusti",
  "september",
  "oktober",
  "november",
  "december",
];

const FORMAT_HINT = "Skriv YYYY-MM-DD eller YYYY.";

function pad(n: number, width: number): string {
  return String(n).padStart(width, "0");
}

/** True when year-month-day is a real calendar date (rejects 2021-02-30). */
function isRealDate(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function invalid(value: unknown): BornResult {
  return { ok: false, message: `${JSON.stringify(value)} är inte ett giltigt datum. ${FORMAT_HINT}` };
}

function future(value: string): BornResult {
  return { ok: false, message: `${JSON.stringify(value)} ligger i framtiden.` };
}

/**
 * Normalises a raw `born` value. `null` and `undefined` mean "unknown" and pass through
 * as null. Anything that is not a valid date or year, or lies after `today`, is refused.
 */
export function normaliseBorn(value: unknown, today: Date = new Date()): BornResult {
  if (value === null || value === undefined) return { ok: true, value: null };

  const todayYear = today.getUTCFullYear();
  const todayIso = `${pad(todayYear, 4)}-${pad(today.getUTCMonth() + 1, 2)}-${pad(today.getUTCDate(), 2)}`;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return invalid(value);
    const iso = `${pad(value.getUTCFullYear(), 4)}-${pad(value.getUTCMonth() + 1, 2)}-${pad(value.getUTCDate(), 2)}`;
    return iso > todayIso ? future(iso) : { ok: true, value: iso };
  }

  if (typeof value === "number") {
    if (!Number.isInteger(value) || value < 1000 || value > 9999) return invalid(value);
    const year = pad(value, 4);
    return value > todayYear ? future(year) : { ok: true, value: year };
  }

  if (typeof value === "string") {
    const text = value.trim();
    if (/^\d{4}$/.test(text)) {
      return Number(text) > todayYear ? future(text) : { ok: true, value: text };
    }
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
    if (match) {
      const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
      if (!isRealDate(year, month, day)) return invalid(value);
      return text > todayIso ? future(text) : { ok: true, value: text };
    }
    return invalid(value);
  }

  return invalid(value);
}

/**
 * "Född 12 april 2021" or "Född 2021" for the pages; null when the birth date is unknown.
 * Expects a value already normalised by `normaliseBorn`.
 */
export function formatBorn(born: string | null): string | null {
  if (born === null) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(born);
  if (!match) return `Född ${born}`;
  const day = Number(match[3]);
  const month = MONTHS_SV[Number(match[2]) - 1];
  return `Född ${day} ${month} ${match[1]}`;
}
