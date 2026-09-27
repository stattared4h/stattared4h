/**
 * Where on the farm a photo was taken, and what that is allowed to mean (02-§11.33,
 * 02-§11.36, 02-§11.39, 04-§10.18, ADR 0026).
 *
 * The farm has no drawn border in the data, but it has places with coordinates. "On the
 * farm" is therefore "within `MAX_FARM_DISTANCE_METRES` of some place", which follows the
 * data wherever it grows. The image tool drops a position that fails this, and the
 * validator refuses one, through the same function, so the two cannot disagree about
 * where the farm ends.
 *
 * Distances are flat-earth: over half a kilometre the error is well under a metre, and
 * the arithmetic stays readable.
 */
import type { GeoPoint } from "./types.ts";

/** A position further than this from every place is not the farm's, and never published. */
export const MAX_FARM_DISTANCE_METRES = 500;
/** A place this close to where the photo was taken is suggested as the one it belongs to. */
export const PLACE_GUESS_DISTANCE_METRES = 150;

/** Mean radius of the earth, in metres. */
const EARTH_RADIUS_METRES = 6_371_008.8;

export interface PlacePoint extends GeoPoint {
  id: string;
}

export function distanceMetres(a: GeoPoint, b: GeoPoint): number {
  const radians = Math.PI / 180;
  const x = (b.lon - a.lon) * radians * Math.cos(((a.lat + b.lat) / 2) * radians);
  const y = (b.lat - a.lat) * radians;
  return Math.hypot(x, y) * EARTH_RADIUS_METRES;
}

/** The closest place and how far it is, or null when there are no places to measure from. */
export function nearestPlace(point: GeoPoint, places: readonly PlacePoint[]): { id: string; metres: number } | null {
  let nearest: { id: string; metres: number } | null = null;
  for (const place of places) {
    const metres = distanceMetres(point, place);
    if (nearest === null || metres < nearest.metres) nearest = { id: place.id, metres };
  }
  return nearest;
}

export function onTheFarm(point: GeoPoint, places: readonly PlacePoint[]): boolean {
  const nearest = nearestPlace(point, places);
  return nearest !== null && nearest.metres <= MAX_FARM_DISTANCE_METRES;
}

/** The place to suggest for a photo taken at `point`, or null when none is close enough. */
export function guessPlace(point: GeoPoint, places: readonly PlacePoint[]): string | null {
  const nearest = nearestPlace(point, places);
  return nearest !== null && nearest.metres <= PLACE_GUESS_DISTANCE_METRES ? nearest.id : null;
}

/** Six decimals: a decimetre on the ground, far finer than a phone's GPS. */
export function roundPosition(point: GeoPoint): GeoPoint {
  return { lat: Math.round(point.lat * 1e6) / 1e6, lon: Math.round(point.lon * 1e6) / 1e6 };
}
