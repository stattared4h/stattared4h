/**
 * Planning for the bulk image import (02-§8.14–8.20, 03-§6.7).
 *
 * Everything here is pure: text in, plan or issues out. The CLI in
 * scripts/image-import.mjs does the reading and writing. The split exists because the
 * import is all or nothing (02-§8.16) — every row has to be approved before the first
 * file is written — and because a plan made of strings can be unit tested in Node, the
 * way scripts/lib/check-docs.ts is.
 *
 * Messages are Swedish: they are read by the editor filling in the table.
 */

/** The table's columns, in order. Swedish, because the editor sees them (ADR 0006). */
export const TABLE_COLUMNS = ["fil", "post", "alt", "fotograf"] as const;

/** 04-§3.2: lowercase a–z, digits and single hyphens between groups. */
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** One row to import. `line` is the line in the table, counting the header as 1. */
export interface ImportRow {
  line: number;
  file: string;
  post: string;
  alt: string;
  credit: string;
}

/** One thing wrong with the table. `line` and `column` are null when it is the table itself. */
export interface ImportIssue {
  line: number | null;
  column: string | null;
  message: string;
}

/** `rows` is empty whenever `issues` is not: nothing is planned when anything is wrong. */
export interface ImportPlan {
  rows: ImportRow[];
  issues: ImportIssue[];
}

/**
 * Reads a table into rows of fields (02-§8.19).
 *
 * Handles what a spreadsheet actually writes: quoted fields containing the delimiter,
 * doubled quotes as an escape, newlines inside a quoted field, CRLF, a byte order mark,
 * and semicolons — a spreadsheet with Swedish settings saves those, and the editor
 * should not have to know that.
 *
 * Blank lines are dropped, so a trailing newline is not a row.
 */
export function parseTable(text: string): string[][] {
  // \uFEFF is the byte order mark a spreadsheet on Windows writes ahead of the header.
  const body = text.replace(/^\uFEFF/, "");
  const delimiter = chooseDelimiter(body);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let started = false;

  const endField = (): void => {
    row.push(field);
    field = "";
    started = false;
  };
  const endRow = (): void => {
    endField();
    // A line that holds nothing at all is spacing, not a record.
    if (row.some((value) => value !== "")) rows.push(row);
    row = [];
  };

  for (let i = 0; i < body.length; i += 1) {
    const char = body[i];
    if (quoted) {
      if (char === '"') {
        if (body[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"' && !started) {
      quoted = true;
      started = true;
    } else if (char === delimiter) {
      endField();
    } else if (char === "\r") {
      // Part of CRLF; the \n that follows ends the row.
    } else if (char === "\n") {
      endRow();
    } else {
      field += char;
      started = true;
    }
  }
  if (field !== "" || row.length > 0) endRow();
  return rows;
}

/**
 * Comma unless the first line has semicolons and no commas outside quotes. Guessing is
 * safe here: a table written with one delimiter never parses as the other by accident,
 * because the header row is checked against the expected column names afterwards.
 */
function chooseDelimiter(text: string): string {
  const firstLine = text.split("\n", 1)[0];
  const outsideQuotes = firstLine.replace(/"[^"]*"/g, "");
  return outsideQuotes.includes(";") && !outsideQuotes.includes(",") ? ";" : ",";
}

/** Quotes a value only when plain text would be read back as something else. */
function quoteField(value: string): string {
  return /[",;\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

/** The table `--scan` writes: a header and one row per photo, with only `fil` filled in (02-§8.14). */
export function templateCsv(files: readonly string[]): string {
  const rows = [...files].sort().map((file) => `${quoteField(file)},,,`);
  return `${TABLE_COLUMNS.join(",")}\n${rows.join("\n")}${rows.length > 0 ? "\n" : ""}`;
}

/**
 * Turns a filled-in table into a plan. Every problem is reported at once, so the editor
 * fixes the table in one pass rather than discovering one error per run.
 */
export function planImport(text: string): ImportPlan {
  const issues: ImportIssue[] = [];
  const table = parseTable(text);

  if (table.length === 0) {
    issues.push({ line: null, column: null, message: `tabellen är tom. Den ska börja med raden ${TABLE_COLUMNS.join(",")}.` });
    return { rows: [], issues };
  }

  const header = table[0].map((value) => value.trim().toLowerCase());
  if (header.length !== TABLE_COLUMNS.length || TABLE_COLUMNS.some((column, index) => header[index] !== column)) {
    issues.push({
      line: 1,
      column: null,
      message: `första raden ska vara kolumnerna ${TABLE_COLUMNS.join(", ")}, i den ordningen. Kör npm run image:import -- --scan för en ny tabell.`,
    });
    return { rows: [], issues };
  }

  if (table.length === 1) {
    issues.push({ line: null, column: null, message: "tabellen har ingen rad att importera, bara rubriken." });
    return { rows: [], issues };
  }

  const rows: ImportRow[] = [];
  const seenFiles = new Map<string, number>();

  table.slice(1).forEach((fields, index) => {
    // The header is line 1, so the first record is line 2.
    const line = index + 2;
    if (fields.length !== TABLE_COLUMNS.length) {
      issues.push({
        line,
        column: null,
        message: `raden har ${fields.length} kolumner, men tabellen har 4 kolumner (${TABLE_COLUMNS.join(", ")}). Innehåller en text ett kommatecken ska den stå inom citattecken.`,
      });
      return;
    }

    const [file, post, alt, credit] = fields.map((value) => value.trim());
    let valid = true;
    const require = (value: string, column: string, what: string): boolean => {
      if (value !== "") return true;
      issues.push({ line, column, message: `${column} fylls i av dig: ${what}` });
      valid = false;
      return false;
    };

    require(file, "fil", "filnamnet på fotot.");
    if (require(post, "post", "id:t på djuret, platsen eller arten bilden hör till.") && !ID_PATTERN.test(post)) {
      issues.push({
        line,
        column: "post",
        message: `"${post}" är inte ett id. Använd små bokstäver a–z, siffror och bindestreck — filnamnet utan .yaml, till exempel lilla-gumman.`,
      });
      valid = false;
    }
    require(alt, "alt", "en mening om vad som är viktigt i bilden.");
    require(credit, "fotograf", "vem som tagit bilden.");

    const previous = seenFiles.get(file);
    if (previous !== undefined) {
      issues.push({
        line,
        column: "fil",
        message: `${file} står med två gånger, först på rad ${previous}. Samma foto blir samma bild; ta bort den ena raden.`,
      });
      valid = false;
    } else if (file !== "") {
      seenFiles.set(file, line);
    }

    if (valid) rows.push({ line, file, post, alt, credit });
  });

  // All or nothing (02-§8.16): a partly valid table plans nothing.
  return issues.length > 0 ? { rows: [], issues } : { rows, issues };
}

/**
 * The written ids grouped by post, in the form `photos` takes in YAML (02-§8.17), so the
 * editor can copy a block straight into a record. Posts come in first-seen order and
 * their images in table order, which is the order they will appear on the page.
 */
export function formatIdsByPost(entries: readonly { post: string; id: string }[]): string {
  const byPost = new Map<string, string[]>();
  for (const { post, id } of entries) {
    const ids = byPost.get(post);
    if (ids) ids.push(id);
    else byPost.set(post, [id]);
  }
  return [...byPost].map(([post, ids]) => `${post}:\n${ids.map((id) => `  - ${id}`).join("\n")}\n`).join("\n");
}

/** `fil:rad: meddelande`-style formatting for one issue, the way linters print. */
export function formatIssue(issue: ImportIssue): string {
  const where = issue.line === null ? "tabellen" : `rad ${issue.line}`;
  const column = issue.column === null ? "" : ` (${issue.column})`;
  return `${where}${column}: ${issue.message}`;
}
