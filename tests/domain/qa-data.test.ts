/** Regression tests for the deliberately large, realistic QA dataset (02-§6.12–6.13). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { isImageId } from "../../source/ts/domain/image-id.ts";
import { qaDataset, rawQa, validate } from "./helpers.ts";

test("QA represents at least 100 animals and exercises every vocabulary entry", async () => {
  const dataset = await qaDataset();
  const counted = dataset.populations.reduce((sum, population) => sum + population.count, 0);
  assert.equal(dataset.animals.length, 100);
  assert.ok(
    dataset.animals.every((animal) => animal.photos.length > 0),
    "every QA animal should have at least one photo",
  );
  assert.equal(counted, 32);
  assert.ok(dataset.animals.length + counted >= 100);
  assert.equal(dataset.species.length, 8);
  assert.equal(dataset.breeds.length, 11);
  for (const species of dataset.species) {
    assert.ok(
      dataset.animals.some((animal) => animal.species === species.id) ||
        dataset.populations.some((population) => population.species === species.id),
      `arten ${species.id} saknar QA-djur`,
    );
  }
  for (const breed of dataset.breeds) {
    assert.ok(
      dataset.animals.some((animal) => animal.breed === breed.id) ||
        dataset.populations.some((population) => population.breed === breed.id),
      `rasen ${breed.id} saknar QA-djur`,
    );
  }
});

test("hens are counted by breed and never stored as individuals", async () => {
  const dataset = await qaDataset();
  assert.equal(dataset.animals.some((animal) => animal.species === "hons"), false);
  assert.deepEqual(dataset.populations, [
    { species: "hons", breed: "svart-dvarghons", count: 18 },
    { species: "hons", breed: "orusthons", count: 14 },
  ]);
});

test("a population count must be a positive integer", async () => {
  const raw = await rawQa();
  const list = (raw.populations?.data as { populations: Record<string, unknown>[] }).populations;
  list[0].count = 0;
  const result = await validate(raw);
  assert.equal(result.dataset, null);
  assert.ok(result.errors.some((error) => error.message.includes("positivt heltal")));
});

test("a species cannot mix individual and counted records", async () => {
  const raw = await rawQa();
  const list = (raw.populations?.data as { populations: Record<string, unknown>[] }).populations;
  list[0].species = "get";
  list[0].breed = "jamtget";
  const result = await validate(raw);
  assert.equal(result.dataset, null);
  assert.ok(result.errors.some((error) => error.message.includes("också som individer")));
});

test("a counted breed must belong to the population species", async () => {
  const raw = await rawQa();
  const list = (raw.populations?.data as { populations: Record<string, unknown>[] }).populations;
  list[0].breed = "jamtget";
  const result = await validate(raw);
  assert.equal(result.dataset, null);
  assert.ok(result.errors.some((error) => error.message.includes("hör till arten")));
});

test("the same species and breed cannot be counted twice", async () => {
  const raw = await rawQa();
  const list = (raw.populations?.data as { populations: Record<string, unknown>[] }).populations;
  list.push({ ...list[0] });
  const result = await validate(raw);
  assert.equal(result.dataset, null);
  assert.ok(result.errors.some((error) => error.message.includes("redan som ett räknat bestånd")));
});

test("QA exercises a shared image and a location with photos (02-§6.12)", async () => {
  const dataset = await qaDataset();
  const used = dataset.animals.flatMap((animal) => animal.photos.map((photo) => photo.id));
  const shared = used.filter((id, index) => used.indexOf(id) !== index);
  assert.ok(shared.length >= 1, "two animals should share a photo");

  const withPhotos = dataset.locations.filter((location) => location.photos.length > 0);
  assert.ok(withPhotos.length >= 1, "a location should have photos");

  // Every image post is used, so the dataset produces no unused-image warnings.
  const result = await validate(await rawQa());
  assert.deepEqual(result.warnings.filter((warning) => warning.file.startsWith("images/")), []);
});

test("every image post id has the form from 04-§9.7", async () => {
  const dataset = await qaDataset();
  assert.ok(dataset.images.length >= 20 && dataset.images.length <= 30, "QA should share about 25 images");
  for (const image of dataset.images) {
    assert.ok(isImageId(image.id), image.id);
    assert.ok(image.alt.length > 0, image.id);
    assert.equal(image.credit, "AI-genererad med OpenAI ImageGen", image.id);
  }
});
