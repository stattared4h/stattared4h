/**
 * 02-§9.10: the documentation check fails on duplicate `§` ids, on citations of ids that
 * do not exist, on a summary that does not match the matrix rows, and on code comments
 * that point at missing files.
 *
 * Each test builds a small repository in a temporary directory, so the checks are
 * exercised in isolation from the real documentation.
 */
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";

import {
  checkDocs,
  checkSummary,
  collectDefinitions,
  countStatusRows,
  expandRange,
  extractHashComments,
  extractSlashComments,
  extractTemplateComments,
  findDuplicateIds,
  findMissingPathReferences,
  findPathReferences,
  findUndefinedCitations,
  formatFindings,
  parseCitations,
  MATRIX_FILE,
} from "../../scripts/lib/check-docs.ts";

let scratch: string;

before(async () => {
  scratch = await mkdtemp(path.join(tmpdir(), "check-docs-"));
});

after(async () => {
  await rm(scratch, { recursive: true, force: true });
});

/** Writes `files` (relative path → content) into a fresh directory and returns its path. */
async function makeRepo(name: string, files: Record<string, string>): Promise<string> {
  const root = path.join(scratch, name);
  for (const [file, content] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await writeFile(path.join(root, file), content);
  }
  return root;
}

const MATRIX = `# Spårbarhet

## Läget nu

### Krav (\`02-§\`)

| ID | Ämne | Status | Anteckning |
| --- | --- | --- | --- |
| \`02-§1.1\`–\`1.2\` | Två krav | \`saknas\` | Se \`03-§1\` |
| \`02-§2\` | Ett avsnitt | \`dokumenterad\` | |

### Arkitektur (\`03-§\`)

| ID | Ämne | Status | Anteckning |
| --- | --- | --- | --- |
| \`03-§1\`–\`03-§2\` | Två avsnitt | \`saknas\` | |

## Summering

| Status | Antal rader |
| --- | --- |
| \`saknas\` | 2 |
| \`dokumenterad\` | 1 |
`;

const REQUIREMENTS = `# Krav

- Första kravet. <!-- 02-§1.1 -->
- Andra kravet. <!-- 02-§1.2 -->
- Ett avsnitt. <!-- 02-§2.1 -->
`;

const ARCHITECTURE = `# Arkitektur

Ett. <!-- 03-§1.1 -->

| ID | Vad |
| --- | --- |
| \`03-§2.1\` | Definierat i en tabellrad |
`;

test("ett konsekvent repo ger inga fel", async () => {
  const root = await makeRepo("consistent", {
    [MATRIX_FILE]: MATRIX,
    "docs/02-krav/index.md": REQUIREMENTS,
    "docs/03-arkitektur/index.md": ARCHITECTURE,
    "scripts/build.mjs": 'const inString = "docs/not-a-comment.md"; // See docs/02-krav/index.md.\nexport { inString };\n',
  });
  assert.deepEqual(checkDocs(root), []);
});

test("ett ID som definieras två gånger fälls med båda platserna", async () => {
  const root = await makeRepo("duplicate", {
    [MATRIX_FILE]: MATRIX,
    "docs/02-krav/index.md": REQUIREMENTS,
    "docs/02-krav/sidor.md": "Igen. <!-- 02-§1.1 -->\n",
    "docs/03-arkitektur/index.md": ARCHITECTURE,
  });
  const findings = findDuplicateIds(collectDefinitions(root));
  assert.equal(findings.length, 1);
  assert.equal(findings[0].file, "docs/02-krav/sidor.md");
  assert.equal(findings[0].line, 1);
  assert.match(findings[0].message, /02-§1\.1 definieras två gånger; första gången i docs\/02-krav\/index\.md:3/);
});

test("matrisens egna tabellrader räknas inte som definitioner", async () => {
  const root = await makeRepo("matrix-not-definition", {
    [MATRIX_FILE]: MATRIX,
    "docs/02-krav/index.md": REQUIREMENTS,
    "docs/03-arkitektur/index.md": ARCHITECTURE,
  });
  const ids = collectDefinitions(root).map((definition) => definition.id);
  assert.deepEqual(ids.sort(), ["02-§1.1", "02-§1.2", "02-§2.1", "03-§1.1", "03-§2.1"]);
});

test("en citering av ett ID som inte finns fälls", () => {
  const definitions = [{ id: "02-§1.1", file: "docs/a.md", line: 1 }];
  const matrix = "| `02-§1.1`–`1.3` | | `saknas` | |\n| `02-§4` | | `saknas` | |\n";
  const findings = findUndefinedCitations(MATRIX_FILE, matrix, definitions);
  assert.deepEqual(
    findings.map((finding) => [finding.line, finding.message]),
    [
      [1, "02-§1.2 citeras (`02-§1.1`–`1.3`) men definieras inte i docs/"],
      [1, "02-§1.3 citeras (`02-§1.1`–`1.3`) men definieras inte i docs/"],
      [2, "02-§4 citeras (`02-§4`) men definieras inte i docs/"],
    ],
  );
});

test("intervall tolkas: punkter i samma avsnitt, avsnitt, listor med komma", () => {
  const citations = parseCitations("| `02-§5.9`–`5.13`, `5.20` | `04-§1`–`04-§3` | `05-§6` övrigt | version `1.6` |");
  assert.deepEqual(
    citations.map((citation) => citation.ids.map((id) => `${id.prefix}-§${id.section}${id.item === null ? "" : `.${id.item}`}`)),
    [["02-§5.9", "02-§5.10", "02-§5.11", "02-§5.12", "02-§5.13"], ["02-§5.20"], ["04-§1", "04-§2", "04-§3"], ["05-§6"]],
  );
  assert.ok(citations.every((citation) => !citation.invalid));
});

test("ett intervall över avsnittsgränsen är ogiltigt", () => {
  assert.equal(expandRange({ prefix: "02", section: 5, item: 9 }, { prefix: "02", section: 6, item: 2 }), null);
  assert.equal(expandRange({ prefix: "02", section: 5, item: 9 }, { prefix: "02", section: 5, item: 8 }), null);
  const findings = findUndefinedCitations(MATRIX_FILE, "| `02-§5.9`–`6.2` |", [{ id: "02-§5.9", file: "x", line: 1 }]);
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /intervallet `02-§5\.9`–`6\.2` går inte att tolka/);
});

test("ett avsnitts-ID är definierat när någon punkt i avsnittet finns", () => {
  const definitions = [{ id: "03-§9.1", file: "docs/a.md", line: 1 }];
  assert.deepEqual(findUndefinedCitations(MATRIX_FILE, "| `03-§9` | | `saknas` | |", definitions), []);
});

test("summeringen jämförs med raderna under Läget nu", () => {
  const counts = countStatusRows(MATRIX);
  assert.deepEqual([...counts.entries()], [["saknas", 2], ["dokumenterad", 1]]);
  assert.deepEqual(checkSummary(MATRIX_FILE, MATRIX), []);

  const wrong = MATRIX.replace("| `saknas` | 2 |", "| `saknas` | 3 |").replace("| `dokumenterad` | 1 |\n", "");
  const findings = checkSummary(MATRIX_FILE, wrong);
  assert.deepEqual(
    findings.map((finding) => finding.message),
    [
      'summeringen säger 3 rader med status `saknas`, men tabellerna under "Läget nu" har 2',
      "status `dokumenterad` finns på 1 rader men saknas i summeringen",
    ],
  );
  assert.equal(findings[0].line, wrong.split("\n").findIndex((line) => line.startsWith("| `saknas` | 3 |")) + 1);
});

test("en saknad summering fälls", () => {
  const findings = checkSummary(MATRIX_FILE, MATRIX.split("## Summering")[0]);
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /hittar ingen tabell under rubriken "## Summering"/);
});

test("kommentarer plockas ut ur JavaScript, YAML och Nunjucks men inte ur strängar", () => {
  const js = 'const url = "https://example.com/docs/a.md"; // see docs/b.md\n/* docs/c.md\n   docs/d.md */\nconst t = `//docs/e.md`;\n';
  assert.deepEqual(
    extractSlashComments(js).map((comment) => [comment.line, comment.text.trim()]),
    [[1, "see docs/b.md"], [2, "docs/c.md\n   docs/d.md"]],
  );

  const yaml = 'run: echo "# not a comment" # docs/a.md\n  # docs/b.md\nkey: value#docs/c.md\n';
  assert.deepEqual(
    extractHashComments(yaml).map((comment) => [comment.line, comment.text.trim()]),
    [[1, "docs/a.md"], [2, "docs/b.md"]],
  );

  const njk = "<p>{{ x }}</p>\n{# docs/a.md #}\n<!-- docs/b.md -->\n";
  assert.deepEqual(
    extractTemplateComments(njk).map((comment) => [comment.line, comment.text.trim()]),
    [[2, "docs/a.md"], [3, "docs/b.md"]],
  );
});

test("sökvägar i kommentarer känns igen, utan avslutande skiljetecken, kataloger eller glob-mönster", () => {
  const comment = "see docs/03-arkitektur/index.md. Also source/ts/ and source/ts/**/*.ts, tests/a.test.ts; scripts/build.mjs)";
  assert.deepEqual(findPathReferences(comment), [
    "docs/03-arkitektur/index.md",
    "tests/a.test.ts",
    "scripts/build.mjs",
  ]);
  // A path inside a URL or a relative path is not a repository path.
  assert.deepEqual(findPathReferences("http://example.com/docs/x.md, ../docs/x.md and mydocs/x.md"), []);
});

test("en kommentar som pekar på en fil som saknas fälls med fil och rad", async () => {
  const root = await makeRepo("missing-path", {
    "docs/finns.md": "# Finns\n",
    "source/assets/css/a.css": "/* Regler i docs/finns.md och docs/saknas.md */\nbody { color: red; }\n",
    ".github/workflows/x.yml": "name: x\n# Lifecycle scripts stay disabled; see docs/07-SAKERHET.md.\non: push\n",
    "tsconfig.json": '{\n  // scripts/finns-inte.mjs\n  "include": ["source/ts/**/*.ts"]\n}\n',
    "source/layouts/base.njk": "{# tests/x.test.ts #}\n<html></html>\n",
    "node_modules/pkg/index.js": "// docs/ignoreras.md\n",
  });
  const findings = findMissingPathReferences(root);
  assert.deepEqual(
    findings.map((finding) => `${finding.file}:${finding.line}: ${finding.message}`),
    [
      ".github/workflows/x.yml:2: kommentaren pekar på docs/07-SAKERHET.md, som inte finns",
      "source/assets/css/a.css:1: kommentaren pekar på docs/saknas.md, som inte finns",
      "source/layouts/base.njk:1: kommentaren pekar på tests/x.test.ts, som inte finns",
      "tsconfig.json:2: kommentaren pekar på scripts/finns-inte.mjs, som inte finns",
    ],
  );
  assert.equal(formatFindings(findings).split("\n").length, 4);
});
