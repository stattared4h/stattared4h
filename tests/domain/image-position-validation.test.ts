/**
 * 04-§9.13, 04-§10.18: the image post's optional position, as the validator holds it.
 *
 * Every case is a QA picture given a position in memory; the files on disk stay as they
 * are (02-§6.10). The farm is the QA data's own places, so "on the farm" is measured
 * against the same coordinates the map draws.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { editImage, errorsFor, photoId, rawQa, validate } from "./helpers.ts";

/** Beside place A in the QA data. */
const ON_THE_FARM = { lat: 57.3382, lon: 12.3388 };
/** Gothenburg: a kitchen, not a paddock. */
const AT_HOME = { lat: 57.7089, lon: 11.9746 };

async function withPosition(data: Record<string, unknown>): Promise<{ file: string; result: Awaited<ReturnType<typeof validate>> }> {
  const id = await photoId("rosa");
  const raw = await rawQa();
  editImage(raw, id, (post) => Object.assign(post, data));
  return { file: `images/${id}.yaml`, result: await validate(raw) };
}

describe("a position on the farm (04-§9.13)", () => {
  test("is accepted and carried into the dataset", async () => {
    const { result } = await withPosition(ON_THE_FARM);
    assert.deepEqual(result.errors, []);
    const id = await photoId("rosa");
    assert.deepEqual(result.dataset?.images.find((image) => image.id === id)?.position, ON_THE_FARM);
  });

  test("a post without one has none, as every post had before", async () => {
    const { result } = await withPosition({});
    const id = await photoId("rosa");
    assert.equal(result.dataset?.images.find((image) => image.id === id)?.position, null);
  });
});

describe("what the validator refuses (04-§10.18)", () => {
  test("lat without lon, and lon without lat", async () => {
    for (const half of [{ lat: ON_THE_FARM.lat }, { lon: ON_THE_FARM.lon }]) {
      const { file, result } = await withPosition(half);
      assert.equal(result.dataset, null);
      assert.ok(errorsFor(result, file).some((error) => error.message.includes("tillsammans")), JSON.stringify(half));
    }
  });

  test("a value that is not a number, or outside WGS84", async () => {
    for (const bad of [{ ...ON_THE_FARM, lat: "57.3" }, { ...ON_THE_FARM, lat: 91 }, { ...ON_THE_FARM, lon: -181 }]) {
      const { file, result } = await withPosition(bad);
      assert.equal(result.dataset, null, JSON.stringify(bad));
      assert.ok(errorsFor(result, file).length > 0, JSON.stringify(bad));
    }
  });

  test("a position off the farm, so that a photo taken at home cannot publish the home (02-§11.33)", async () => {
    const { file, result } = await withPosition(AT_HOME);
    assert.equal(result.dataset, null);
    const errors = errorsFor(result, file);
    assert.ok(errors.some((error) => error.message.includes("500 m")), errors.map((error) => error.message).join("; "));
  });
});
