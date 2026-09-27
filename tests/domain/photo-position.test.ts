/**
 * 02-§11.33, 02-§11.36, 02-§11.39, 04-§10.18: how far is far, which place is nearest,
 * and where the farm ends (ADR 0026).
 *
 * The places are real ones from the QA data, so the distances are the farm's own and not
 * a grid made up to make the arithmetic easy.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  distanceMetres,
  guessPlace,
  MAX_FARM_DISTANCE_METRES,
  nearestPlace,
  onTheFarm,
  PLACE_GUESS_DISTANCE_METRES,
  roundPosition,
} from "../../source/ts/domain/photo-position.ts";

const A = { id: "a", lat: 57.338131, lon: 12.338765 };
const B = { id: "b", lat: 57.338457, lon: 12.339422 };
const BRACKEBUR = { id: "brackebur", lat: 57.338126, lon: 12.336551 };
const PLACES = [A, B, BRACKEBUR];

/** A point `metres` north of `point`: one degree of latitude is about 111.2 km. */
function north(point: { lat: number; lon: number }, metres: number): { lat: number; lon: number } {
  return { lat: point.lat + metres / 111_195, lon: point.lon };
}

test("the limits are the ones the requirements state (02-§11.33, 02-§11.36)", () => {
  assert.equal(MAX_FARM_DISTANCE_METRES, 500);
  assert.equal(PLACE_GUESS_DISTANCE_METRES, 150);
});

test("distance is in metres, and good to a metre over the farm's scale", () => {
  assert.equal(distanceMetres(A, A), 0);
  const hundred = distanceMetres(A, north(A, 100));
  assert.ok(Math.abs(hundred - 100) < 1, `${hundred}`);
  // A to Bräckebur runs east–west, where a degree of longitude is shorter than one of latitude.
  const across = distanceMetres(A, BRACKEBUR);
  assert.ok(across > 125 && across < 140, `${across}`);
  assert.equal(distanceMetres(A, B), distanceMetres(B, A));
});

test("the nearest place is the nearest one, with its distance", () => {
  const point = north(B, 20);
  const nearest = nearestPlace(point, PLACES);
  assert.equal(nearest?.id, "b");
  assert.ok(nearest !== null && Math.abs(nearest.metres - 20) < 1);
  assert.equal(nearestPlace(point, []), null);
});

test("a place is guessed only when it is close enough, and never otherwise (02-§11.36)", () => {
  assert.equal(guessPlace(north(BRACKEBUR, 10), PLACES), "brackebur");
  assert.equal(guessPlace(north(BRACKEBUR, PLACE_GUESS_DISTANCE_METRES - 5), [BRACKEBUR]), "brackebur");
  assert.equal(guessPlace(north(BRACKEBUR, PLACE_GUESS_DISTANCE_METRES + 5), [BRACKEBUR]), null);
  assert.equal(guessPlace(north(A, 10), []), null);
});

test("the farm ends 500 m from the last place with coordinates (02-§11.33)", () => {
  assert.equal(onTheFarm(north(B, MAX_FARM_DISTANCE_METRES - 5), PLACES), true);
  assert.equal(onTheFarm(north(B, MAX_FARM_DISTANCE_METRES + 5), PLACES), false);
  // Someone's kitchen in Gothenburg.
  assert.equal(onTheFarm({ lat: 57.7089, lon: 11.9746 }, PLACES), false);
  // Without a single place to measure from, nothing is on the farm.
  assert.equal(onTheFarm(A, []), false);
});

test("a position is written with six decimals, which is a decimetre on the ground", () => {
  assert.deepEqual(roundPosition({ lat: 57.33740712345, lon: 12.3408714999 }), { lat: 57.337407, lon: 12.340871 });
  assert.deepEqual(roundPosition({ lat: -57.5, lon: 12 }), { lat: -57.5, lon: 12 });
});
