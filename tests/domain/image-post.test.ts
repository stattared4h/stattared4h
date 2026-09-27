/**
 * 02-§11.14, 02-§11.15, 02-§11.21: the image post the tool hands over, and the check
 * that stops it from being handed over half-filled.
 *
 * The YAML is compared by parsing it back with the same library the validator reads the
 * repository with: the requirement is that the file means the right thing, not that it
 * is spelled a particular way. The position is optional and comes last (ADR 0026).
 */
import assert from "node:assert/strict";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, test } from "node:test";
import { parse } from "yaml";
import { formatImagePost, imagePostProblems } from "../../source/ts/domain/image-post.ts";
import { loadDataset } from "../../source/ts/domain/index.ts";

const ID = "img-a3f2c1d8b901";

test("an ordinary post is two plain lines in the order the command writes them", () => {
  const yaml = formatImagePost({ alt: "Rosa och Stjärna står i Björkhagen.", credit: "Anna Karlsson" });
  assert.equal(yaml, "alt: Rosa och Stjärna står i Björkhagen.\ncredit: Anna Karlsson\n");
});

test("text that YAML would misread is quoted and still parses back unchanged", () => {
  const tricky = [
    "Rosa: en get",
    "#1 av flocken",
    "- inte en lista",
    'Hon "tittar" rakt in i kameran',
    "Slutar med mellanslag ",
    "true",
    "2021-04-12",
    "Två\nrader",
    "Backslash \\ och kolon: mitt i",
    "*ankare & referens",
  ];
  for (const alt of tricky) {
    const parsed = parse(formatImagePost({ alt, credit: "Anna Karlsson" }));
    assert.deepEqual(parsed, { alt, credit: "Anna Karlsson" }, `alt ${JSON.stringify(alt)}`);
  }
});

test("an empty field is a problem named after the field", () => {
  assert.deepEqual(imagePostProblems({ alt: "", credit: "Anna" }).map((problem) => problem.field), ["alt"]);
  assert.deepEqual(imagePostProblems({ alt: "   ", credit: "Anna" }).map((problem) => problem.field), ["alt"]);
  assert.deepEqual(imagePostProblems({ alt: "En get", credit: "" }).map((problem) => problem.field), ["credit"]);
  assert.deepEqual(imagePostProblems({ alt: "", credit: "" }).map((problem) => problem.field), ["alt", "credit"]);
});

test("a complete post has no problems", () => {
  assert.deepEqual(imagePostProblems({ alt: "En get tittar in i kameran.", credit: "Anna Karlsson" }), []);
});

test("a credit that starts with AI-genererad is refused, as in the dataset (02-§8.21)", () => {
  const problems = imagePostProblems({ alt: "En get", credit: "AI-genererad med OpenAI ImageGen" });
  assert.equal(problems.length, 1);
  assert.equal(problems[0].field, "credit");
  assert.match(problems[0].message, /AI-genererad/);
});

test("HTML is refused in both fields, as the validator refuses it (04-§10.9)", () => {
  assert.equal(imagePostProblems({ alt: "En get <b>här</b>", credit: "Anna" }).length, 1);
  assert.equal(imagePostProblems({ alt: "En get", credit: "<a href=#>Anna</a>" }).length, 1);
});

test("every message is Swedish and tells the editor what to do", () => {
  for (const problem of imagePostProblems({ alt: "", credit: "" })) {
    assert.match(problem.message, /^[A-ZÅÄÖ]/, "meddelandet börjar som en mening");
    assert.match(problem.message, /\.$/, "meddelandet slutar med punkt");
  }
});

describe("the photo's position (02-§11.21, 02-§11.31, 04-§9.13)", () => {
  test("a position comes after the credit, as lat and lon with six decimals", () => {
    const yaml = formatImagePost({
      alt: "Två getter vid grinden.",
      credit: "Anna Karlsson",
      position: { lat: 57.33740712345, lon: 12.3408714999 },
    });
    assert.equal(yaml, "alt: Två getter vid grinden.\ncredit: Anna Karlsson\nlat: 57.337407\nlon: 12.340871\n");
    assert.deepEqual(parse(yaml), { alt: "Två getter vid grinden.", credit: "Anna Karlsson", lat: 57.337407, lon: 12.340871 });
  });

  test("without a position the post is exactly what it was", () => {
    const fields = { alt: "Två getter vid grinden.", credit: "Anna Karlsson" };
    assert.equal(formatImagePost({ ...fields, position: null }), formatImagePost(fields));
  });

  test("what the tool writes with a position passes the validator without any tidying (02-§11.23)", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "s4h-image-post-"));
    const dataDir = path.join(dir, "data");
    const write = async (name: string, text: string): Promise<void> => {
      await mkdir(path.dirname(path.join(dataDir, name)), { recursive: true });
      await writeFile(path.join(dataDir, name), text);
    };
    await write("species.yaml", "species: []\n");
    await write("breeds.yaml", "breeds: []\n");
    await write(
      "locations/brackebur.yaml",
      `name: Bräckebur\nkind: djurplats\nspecies: []\nlat: 57.338126\nlon: 12.336551\naccessible: true\nactive: true\nphotos:\n  - ${ID}\n`,
    );
    await write(
      `images/${ID}.yaml`,
      formatImagePost({ alt: "Getter vid grinden.", credit: "Anna Karlsson", position: { lat: 57.3383, lon: 12.3367 } }),
    );

    const result = await loadDataset(dataDir, { today: new Date("2026-09-27T12:00:00Z") });
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.dataset?.images[0].position, { lat: 57.3383, lon: 12.3367 });
  });
});
