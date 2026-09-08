/**
 * 02-§11.14, 02-§11.15, 02-§11.21: the image post the tool hands over, and the check
 * that stops it from being handed over half-filled.
 *
 * The YAML is compared by parsing it back with the same library the validator reads the
 * repository with: the requirement is that the file means the right thing, not that it
 * is spelled a particular way.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { parse } from "yaml";
import { formatImagePost, imagePostProblems } from "../../source/ts/domain/image-post.ts";

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
