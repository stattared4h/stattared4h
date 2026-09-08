/**
 * 04-§11, 04-§10.17: the clue catalogue Spana! reads (ADR 0025).
 *
 * The valid cases are read from source/data-qa/clues/; every invalid one is built in
 * memory from a copy of the raw QA data, so the dataset on disk stays valid (02-§6.10).
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { addClue, addImage, editClue, editLocation, errorsFor, qaDataset, rawQa, validate } from "./helpers.ts";

/** An image id that is not in the QA data, for the cases about a missing picture. */
const UNKNOWN_IMAGE = "img-000000000000";

describe("the catalogue in the QA data (04-§11)", () => {
  test("QA has twelve clues, sorted by id, with and without a text", async () => {
    const dataset = await qaDataset();
    assert.equal(dataset.clues.length, 12);
    assert.deepEqual([...dataset.clues].sort((a, b) => (a.id < b.id ? -1 : 1)), dataset.clues, "sorted by id (04-§11.8)");
    assert.ok(dataset.clues.some((clue) => clue.text !== null), "a clue with a text");
    assert.ok(dataset.clues.some((clue) => clue.text === null), "a clue that is only a picture");
  });

  test("every clue resolves to a picture and to a place that exists", async () => {
    const dataset = await qaDataset();
    const locations = new Set(dataset.locations.map((location) => location.id));
    for (const clue of dataset.clues) {
      assert.equal(clue.image.id, clue.id, "the file name is the image id (04-§11.2)");
      assert.ok(clue.image.alt.length > 0, clue.id);
      assert.ok(locations.has(clue.location), `${clue.id} pekar på en plats som inte finns`);
    }
  });

  test("two clues may share a place, and a clue may sit somewhere that is not a paddock", async () => {
    const dataset = await qaDataset();
    const places = dataset.clues.map((clue) => clue.location);
    assert.ok(places.length > new Set(places).size, "two clues at the same place (04-§11.6)");
    const kinds = new Set(
      dataset.clues.map((clue) => dataset.locations.find((location) => location.id === clue.location)?.kind),
    );
    assert.ok(kinds.size > 1, "not every clue is at a djurplats (04-§11.3)");
  });

  test("the QA data raises no warnings about its clues", async () => {
    const result = await validate(await rawQa());
    assert.deepEqual(result.warnings.filter((warning) => warning.file.startsWith("clues/")), []);
  });
});

describe("what the validator refuses (04-§10.17)", () => {
  test("a file name that is not an image id", async () => {
    const raw = await rawQa();
    addClue(raw, "gungan", { location: "lekplatsen" });
    const result = await validate(raw);
    assert.equal(result.dataset, null);
    assert.ok(errorsFor(result, "clues/gungan.yaml").some((error) => error.message.includes("bild-id")));
  });

  test("a clue whose picture has no image post", async () => {
    const raw = await rawQa();
    addClue(raw, UNKNOWN_IMAGE, { location: "lekplatsen" });
    const result = await validate(raw);
    assert.equal(result.dataset, null);
    assert.ok(errorsFor(result, `clues/${UNKNOWN_IMAGE}.yaml`).some((error) => error.message.includes("bildpost")));
  });

  test("a missing place, and a place that does not exist", async () => {
    const raw = await rawQa();
    const id = raw.clues[0].id;
    editClue(raw, id, (data) => delete data.location);
    const missing = await validate(raw);
    assert.equal(missing.dataset, null);
    assert.ok(errorsFor(missing, `clues/${id}.yaml`, "location").length > 0);

    const other = await rawQa();
    editClue(other, other.clues[0].id, (data) => {
      data.location = "hagen-som-inte-finns";
    });
    const unknown = await validate(other);
    assert.equal(unknown.dataset, null);
    assert.ok(
      errorsFor(unknown, `clues/${other.clues[0].id}.yaml`, "location").some((error) => error.message.includes("finns inte")),
    );
  });

  test("a field the contract does not know", async () => {
    const raw = await rawQa();
    const id = raw.clues[0].id;
    editClue(raw, id, (data) => {
      data.image = id;
    });
    const result = await validate(raw);
    assert.equal(result.dataset, null);
    // The picture is the file name; an `image` line would be the same fact twice (04-§11.2).
    assert.ok(errorsFor(result, `clues/${id}.yaml`, "image").some((error) => error.message.includes("okänt fält")));
  });

  test("a text that is blank, too long, not text, or markup", async () => {
    const cases: [unknown, string][] = [
      ["   ", "tom"],
      ["x".repeat(121), "120"],
      [42, "text"],
      ["<b>Vid grinden</b>", "HTML"],
    ];
    for (const [value, expected] of cases) {
      const raw = await rawQa();
      const id = raw.clues[0].id;
      editClue(raw, id, (data) => {
        data.text = value;
      });
      const result = await validate(raw);
      assert.equal(result.dataset, null, `${String(value)} borde fällas`);
      assert.ok(
        errorsFor(result, `clues/${id}.yaml`, "text").some((error) => error.message.includes(expected)),
        `${String(value)}: meddelandet nämner inte ${expected}`,
      );
    }
  });

  test("a text of exactly 120 characters is allowed: the limit is the last one that fits", async () => {
    const raw = await rawQa();
    editClue(raw, raw.clues[0].id, (data) => {
      data.text = "x".repeat(120);
    });
    const result = await validate(raw);
    assert.deepEqual(result.errors, []);
  });
});

describe("what the validator warns about (04-§10.10)", () => {
  test("a clue at a place that is not in use", async () => {
    const raw = await rawQa();
    const id = raw.clues[0].id;
    editClue(raw, id, (data) => {
      data.location = "d";
    });
    const result = await validate(raw);
    assert.notEqual(result.dataset, null, "det är en varning, inte ett fel");
    assert.ok(result.warnings.some((warning) => warning.file === `clues/${id}.yaml`));
  });

  test("a picture used only by a clue is used, not unused", async () => {
    // Without this the farm's first clue photo would be reported as an orphan the day it
    // is added, and the unused-image warning would stop being worth reading (02-§8.13).
    const raw = await rawQa();
    addImage(raw, UNKNOWN_IMAGE, { alt: "Närbild på en gunga.", credit: "AI-genererad med OpenAI ImageGen" });
    addClue(raw, UNKNOWN_IMAGE, { location: "lekplatsen" });
    const result = await validate(raw);
    assert.deepEqual(result.errors, []);
    assert.deepEqual(
      result.warnings.filter((warning) => warning.file === `images/${UNKNOWN_IMAGE}.yaml`),
      [],
    );
  });

  test("an inactive place stops being a warning when the place is used again", async () => {
    const raw = await rawQa();
    const id = raw.clues[0].id;
    editClue(raw, id, (data) => {
      data.location = "d";
    });
    editLocation(raw, "d", (data) => {
      data.active = true;
    });
    const result = await validate(raw);
    assert.deepEqual(result.warnings.filter((warning) => warning.file === `clues/${id}.yaml`), []);
  });
});
