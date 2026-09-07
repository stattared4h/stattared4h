/**
 * Documentation checks (02-§9.10), written so each one can be run against any directory
 * and unit-tested in Node against a temporary tree. The CLI in scripts/check-docs.mjs
 * runs them against the repository root and prints the findings in Swedish.
 *
 * Four things are checked:
 *
 * 1. A `§` id (`<!-- 02-§5.1 -->`) is defined at most once across docs/.
 * 2. Every id or id range the traceability matrix cites is defined somewhere in docs/.
 * 3. The matrix's *Summering* table matches the number of rows per status in the tables
 *    under *Läget nu*.
 * 4. A comment in code or configuration that names a file under docs/, source/,
 *    scripts/ or tests/ points at a file that exists.
 *
 * Messages are the human-facing part, so they are in Swedish; the code is English
 * (ADR 0006).
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/** One thing the check found. `file` is relative to the checked root. */
export type Finding = {
  file: string;
  line: number;
  message: string;
};

/** Where an id is defined: file and line. */
export type IdDefinition = {
  id: string;
  file: string;
  line: number;
};

// An id is defined either as an HTML comment after the text, `<!-- 02-§5.1 -->`, or as
// the first cell of a table row, as in the design document's palette and spacing tables.
const COMMENT_DEFINITION = /<!--\s*(\d{2})-§(\d+(?:\.\d+)?)\s*-->/g;
const TABLE_DEFINITION = /^\|\s*`(\d{2})-§(\d+(?:\.\d+)?)`\s*\|/;

const IGNORED_DIRECTORIES = new Set([".git", ".claude", "node_modules", "public", "source/images-qa"]);

export const MATRIX_FILE = "docs/99-sparbarhet/index.md";

// ---------------------------------------------------------------------------
// File system helpers
// ---------------------------------------------------------------------------

/** Lists files under `dir` recursively, relative to `root`, skipping build and VCS trees. */
export function listFiles(root: string, dir = root): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (IGNORED_DIRECTORIES.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(root, full));
    } else if (entry.isFile()) {
      files.push(path.relative(root, full).split(path.sep).join("/"));
    }
  }
  return files;
}

function readText(root: string, file: string): string {
  return readFileSync(path.join(root, file), "utf8");
}

// ---------------------------------------------------------------------------
// 1. Definitions and duplicates
// ---------------------------------------------------------------------------

/**
 * Every id definition in the Markdown files under `docsDir`. The traceability matrix is
 * skipped: its table rows cite ids, they do not define them.
 */
export function collectDefinitions(root: string, docsDir = "docs", skip: string[] = [MATRIX_FILE]): IdDefinition[] {
  const definitions: IdDefinition[] = [];
  for (const file of listFiles(root, path.join(root, docsDir))) {
    if (!file.endsWith(".md") || skip.includes(file)) continue;
    const lines = readText(root, file).split("\n");
    lines.forEach((text, index) => {
      for (const match of text.matchAll(COMMENT_DEFINITION)) {
        definitions.push({ id: `${match[1]}-§${match[2]}`, file, line: index + 1 });
      }
      const row = TABLE_DEFINITION.exec(text);
      if (row) definitions.push({ id: `${row[1]}-§${row[2]}`, file, line: index + 1 });
    });
  }
  return definitions;
}

/** Finding for every id defined more than once; the first definition is the reference. */
export function findDuplicateIds(definitions: IdDefinition[]): Finding[] {
  const seen = new Map<string, IdDefinition>();
  const findings: Finding[] = [];
  for (const definition of definitions) {
    const first = seen.get(definition.id);
    if (first) {
      findings.push({
        file: definition.file,
        line: definition.line,
        message: `ID:t ${definition.id} definieras två gånger; första gången i ${first.file}:${first.line}`,
      });
    } else {
      seen.set(definition.id, definition);
    }
  }
  return findings;
}

// ---------------------------------------------------------------------------
// 2. Citations in the traceability matrix
// ---------------------------------------------------------------------------

/** A parsed id: prefix `02`, section `5`, and item `1` for `02-§5.1` (item null for `02-§5`). */
type ParsedId = {
  prefix: string;
  section: number;
  item: number | null;
};

function parseId(prefix: string, number: string): ParsedId {
  const [section, item] = number.split(".");
  return { prefix, section: Number(section), item: item === undefined ? null : Number(item) };
}

function formatId(id: ParsedId): string {
  return `${id.prefix}-§${id.section}${id.item === null ? "" : `.${id.item}`}`;
}

/**
 * Expands a range like `02-§5.9`–`5.13` to every id in it. Both ends must be of the same
 * kind: two items in the same section, or two sections. Returns null when they are not.
 */
export function expandRange(from: ParsedId, to: ParsedId): ParsedId[] | null {
  if (from.prefix !== to.prefix) return null;
  if (from.item === null && to.item === null) {
    if (to.section < from.section) return null;
    const ids: ParsedId[] = [];
    for (let section = from.section; section <= to.section; section += 1) {
      ids.push({ prefix: from.prefix, section, item: null });
    }
    return ids;
  }
  if (from.item !== null && to.item !== null && from.section === to.section) {
    if (to.item < from.item) return null;
    const ids: ParsedId[] = [];
    for (let item = from.item; item <= to.item; item += 1) {
      ids.push({ prefix: from.prefix, section: from.section, item });
    }
    return ids;
  }
  return null;
}

/** A cited id or range, with the line it was found on. */
export type Citation = {
  line: number;
  text: string;
  ids: ParsedId[];
  /** Set when the range could not be expanded, for example `02-§5.9`–`6.2`. */
  invalid: boolean;
};

// Backticked codes: a full id `02-§5.1`, or a bare `5.13` / `9` that inherits the prefix
// from the previous code on the line when joined by an en dash or a comma.
const CODE_PATTERN = /`(?:(\d{2})-§)?(\d+(?:\.\d+)?)`/g;

/**
 * Parses every id citation in a text. A bare number only counts when it directly follows
 * another citation with `–` (range) or `, ` (list), so `1.6` in running text is ignored.
 */
export function parseCitations(text: string): Citation[] {
  const citations: Citation[] = [];
  text.split("\n").forEach((lineText, index) => {
    const line = index + 1;
    let previous: { id: ParsedId; end: number } | null = null;
    for (const match of lineText.matchAll(CODE_PATTERN)) {
      const [whole, prefix, number] = match;
      const start = match.index;
      const between = previous ? lineText.slice(previous.end, start) : "";
      const joinsPrevious = previous !== null && (between === "–" || between === ", ");
      let current: ParsedId;
      if (prefix) {
        current = parseId(prefix, number);
      } else if (previous && joinsPrevious) {
        current = parseId(previous.id.prefix, number);
      } else {
        previous = null;
        continue;
      }

      if (between === "–" && previous) {
        // Replace the citation of the range start with the expanded range.
        const last = citations.pop();
        const expanded = expandRange(previous.id, current);
        citations.push({
          line,
          text: `${last?.text ?? formatId(previous.id)}–${whole}`,
          ids: expanded ?? [previous.id, current],
          invalid: expanded === null,
        });
      } else {
        citations.push({ line, text: whole, ids: [current], invalid: false });
      }
      previous = { id: current, end: start + whole.length };
    }
  });
  return citations;
}

/**
 * Findings for every cited id that is not defined. A section citation such as `04-§1` is
 * satisfied by any `04-§1.N`, and by an explicit `<!-- 04-§1 -->`.
 */
export function findUndefinedCitations(matrixFile: string, matrixText: string, definitions: IdDefinition[]): Finding[] {
  const defined = new Set<string>();
  for (const { id } of definitions) {
    defined.add(id);
    const dot = id.indexOf(".");
    if (dot !== -1) defined.add(id.slice(0, dot));
  }

  const findings: Finding[] = [];
  for (const citation of parseCitations(matrixText)) {
    if (citation.invalid) {
      findings.push({
        file: matrixFile,
        line: citation.line,
        message: `intervallet ${citation.text} går inte att tolka; båda ändarna måste vara punkter i samma avsnitt, eller två avsnitt`,
      });
      continue;
    }
    for (const id of citation.ids) {
      const key = formatId(id);
      if (!defined.has(key)) {
        findings.push({
          file: matrixFile,
          line: citation.line,
          message: `${key} citeras (${citation.text}) men definieras inte i docs/`,
        });
      }
    }
  }
  return findings;
}

// ---------------------------------------------------------------------------
// 3. The summary table
// ---------------------------------------------------------------------------

const STATUS_CELL = /^\|[^|]*\|[^|]*\|\s*`([^`]+)`\s*\|/;
const SUMMARY_ROW = /^\|\s*`([^`]+)`\s*\|\s*(\d+)\s*\|/;

/** Rows per status in the tables between the `## Läget nu` and `## Summering` headings. */
export function countStatusRows(matrixText: string): Map<string, number> {
  const counts = new Map<string, number>();
  let inside = false;
  for (const line of matrixText.split("\n")) {
    if (/^## /.test(line)) inside = line.trim() === "## Läget nu";
    if (!inside) continue;
    const match = STATUS_CELL.exec(line);
    if (!match) continue;
    const status = match[1];
    if (status === "Status") continue;
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }
  return counts;
}

/** The counts the `## Summering` table claims, keyed by status, with the line of each row. */
export function readSummary(matrixText: string): Map<string, { count: number; line: number }> {
  const summary = new Map<string, { count: number; line: number }>();
  let inside = false;
  matrixText.split("\n").forEach((line, index) => {
    if (/^## /.test(line)) inside = line.trim() === "## Summering";
    if (!inside) return;
    const match = SUMMARY_ROW.exec(line);
    if (match) summary.set(match[1], { count: Number(match[2]), line: index + 1 });
  });
  return summary;
}

/** Findings for every status whose summary count differs from the rows in the tables. */
export function checkSummary(matrixFile: string, matrixText: string): Finding[] {
  const actual = countStatusRows(matrixText);
  const summary = readSummary(matrixText);
  const findings: Finding[] = [];

  if (summary.size === 0) {
    findings.push({ file: matrixFile, line: 1, message: "hittar ingen tabell under rubriken \"## Summering\"" });
    return findings;
  }

  for (const [status, { count, line }] of summary) {
    const rows = actual.get(status) ?? 0;
    if (rows !== count) {
      findings.push({
        file: matrixFile,
        line,
        message: `summeringen säger ${count} rader med status \`${status}\`, men tabellerna under "Läget nu" har ${rows}`,
      });
    }
  }
  for (const [status, rows] of actual) {
    if (!summary.has(status)) {
      findings.push({
        file: matrixFile,
        line: 1,
        message: `status \`${status}\` finns på ${rows} rader men saknas i summeringen`,
      });
    }
  }
  return findings;
}

// ---------------------------------------------------------------------------
// 4. Paths named in code comments
// ---------------------------------------------------------------------------

/** A comment's text with the line it starts on. */
export type Comment = {
  line: number;
  text: string;
};

/**
 * Extracts comments from a JavaScript-like source (JS, TS, JSON with comments), skipping
 * string literals so that `"https://..."` is never mistaken for a comment.
 */
export function extractSlashComments(text: string): Comment[] {
  const comments: Comment[] = [];
  let i = 0;
  let line = 1;
  while (i < text.length) {
    const char = text[i];
    const next = text[i + 1];
    if (char === "\n") {
      line += 1;
      i += 1;
    } else if (char === '"' || char === "'" || char === "`") {
      // Skip the string literal, honouring backslash escapes and newlines inside templates.
      i += 1;
      while (i < text.length && text[i] !== char) {
        if (text[i] === "\\") i += 1;
        if (text[i] === "\n") line += 1;
        i += 1;
      }
      i += 1;
    } else if (char === "/" && next === "/") {
      const end = text.indexOf("\n", i);
      const stop = end === -1 ? text.length : end;
      comments.push({ line, text: text.slice(i + 2, stop) });
      i = stop;
    } else if (char === "/" && next === "*") {
      const end = text.indexOf("*/", i + 2);
      const stop = end === -1 ? text.length : end;
      const body = text.slice(i + 2, stop);
      comments.push({ line, text: body });
      line += (body.match(/\n/g) ?? []).length;
      i = stop + 2;
    } else {
      i += 1;
    }
  }
  return comments;
}

/** `/* ... *\/` comments only, as in CSS. */
export function extractBlockComments(text: string): Comment[] {
  const comments: Comment[] = [];
  for (const match of text.matchAll(/\/\*([\s\S]*?)\*\//g)) {
    comments.push({ line: lineOf(text, match.index), text: match[1] });
  }
  return comments;
}

/** `#` comments as in YAML: at the start of a line or after whitespace, outside quotes. */
export function extractHashComments(text: string): Comment[] {
  const comments: Comment[] = [];
  text.split("\n").forEach((lineText, index) => {
    let quote: string | null = null;
    for (let i = 0; i < lineText.length; i += 1) {
      const char = lineText[i];
      if (quote) {
        if (char === quote) quote = null;
      } else if (char === '"' || char === "'") {
        quote = char;
      } else if (char === "#" && (i === 0 || /\s/.test(lineText[i - 1]))) {
        comments.push({ line: index + 1, text: lineText.slice(i + 1) });
        break;
      }
    }
  });
  return comments;
}

/** `{# ... #}` and `<!-- ... -->` comments, as in Nunjucks templates. */
export function extractTemplateComments(text: string): Comment[] {
  const comments: Comment[] = [];
  for (const match of text.matchAll(/\{#([\s\S]*?)#\}|<!--([\s\S]*?)-->/g)) {
    comments.push({ line: lineOf(text, match.index), text: match[1] ?? match[2] });
  }
  return comments.sort((a, b) => a.line - b.line);
}

function lineOf(text: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset; i += 1) if (text[i] === "\n") line += 1;
  return line;
}

const COMMENT_EXTRACTORS: Record<string, (text: string) => Comment[]> = {
  ".ts": extractSlashComments,
  ".mts": extractSlashComments,
  ".js": extractSlashComments,
  ".mjs": extractSlashComments,
  ".cjs": extractSlashComments,
  ".json": extractSlashComments,
  ".jsonc": extractSlashComments,
  ".css": extractBlockComments,
  ".yml": extractHashComments,
  ".yaml": extractHashComments,
  ".njk": extractTemplateComments,
};

// A path under one of the source trees, ending in a file extension. Directory references
// and globs (`source/ts/**/*.ts`) are not checked: a directory is a structural claim, and
// tsconfig and eslint already own those.
const PATH_PATTERN = /(?<![\w./-])(docs|source|scripts|tests)\/[\w./-]*\.[a-z0-9]+(?![\w/])/g;

/** The paths a comment names, in order, with trailing sentence punctuation removed. */
export function findPathReferences(comment: string): string[] {
  const paths: string[] = [];
  for (const match of comment.matchAll(PATH_PATTERN)) {
    const candidate = match[0].replace(/[.,;:]+$/, "");
    if (candidate.includes("*") || candidate.includes("..")) continue;
    if (!/\.[a-z0-9]+$/.test(candidate)) continue;
    paths.push(candidate);
  }
  return paths;
}

/** Findings for every path in a code or configuration comment that names a missing file. */
export function findMissingPathReferences(root: string): Finding[] {
  const findings: Finding[] = [];
  for (const file of listFiles(root)) {
    const extract = COMMENT_EXTRACTORS[path.extname(file)];
    if (!extract) continue;
    const text = readText(root, file);
    for (const comment of extract(text)) {
      for (const reference of findPathReferences(comment.text)) {
        if (!exists(path.join(root, reference))) {
          findings.push({
            file,
            line: comment.line,
            message: `kommentaren pekar på ${reference}, som inte finns`,
          });
        }
      }
    }
  }
  return findings;
}

function exists(file: string): boolean {
  try {
    return statSync(file).isFile();
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// All checks
// ---------------------------------------------------------------------------

/** Runs every check against `root`. An empty result means the documentation is consistent. */
export function checkDocs(root: string): Finding[] {
  const definitions = collectDefinitions(root);
  const matrixText = readText(root, MATRIX_FILE);
  return [
    ...findDuplicateIds(definitions),
    ...findUndefinedCitations(MATRIX_FILE, matrixText, definitions),
    ...checkSummary(MATRIX_FILE, matrixText),
    ...findMissingPathReferences(root),
  ];
}

/** `fil:rad: meddelande`, one per line, the way linters print. */
export function formatFindings(findings: Finding[]): string {
  return findings.map((finding) => `${finding.file}:${finding.line}: ${finding.message}`).join("\n");
}
