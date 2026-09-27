/**
 * The GPS position in a photo's EXIF, read from the original file's bytes (02-§11.31,
 * ADR 0026).
 *
 * The image tool redraws every picture in a canvas, and a canvas carries nothing but
 * pixels, so the position has to be read before that happens. This module does it
 * without a browser API, so it is tested in Node against files sharp wrote (CL-§2.14).
 *
 * The EXIF block is found by what it looks like rather than by walking each container:
 * a TIFF header, `II*\0` or `MM\0*`. JPEG keeps it in an APP1 segment, HEIC deep in its
 * `mdat`, PNG and WebP in a chunk of their own — but the block itself is the same TIFF
 * structure everywhere. Every candidate is parsed strictly, so a stray `II*` among the
 * compressed pixels simply yields nothing.
 *
 * Anything that is not a clean position gives `null`: no GPS directory, half a position,
 * a zero denominator, a value off the globe, or the 0/0 that some Android pickers write
 * instead of removing the field. A photo without a position is ordinary (02-§11.32), so
 * nothing here ever throws.
 */
import type { GeoPoint } from "./types.ts";

/** The tag in IFD0 that points at the GPS directory. */
const GPS_IFD_POINTER = 0x8825;
const GPS_LATITUDE_REF = 1;
const GPS_LATITUDE = 2;
const GPS_LONGITUDE_REF = 3;
const GPS_LONGITUDE = 4;
/** TIFF field types that are used here. */
const TYPE_ASCII = 2;
const TYPE_LONG = 4;
const TYPE_RATIONAL = 5;

/** How many TIFF headers to try before giving up; a real file has one or two. */
const MAX_CANDIDATES = 64;

interface Entry {
  type: number;
  count: number;
  /** Where the value is: inline in the entry when it fits in four bytes, else the offset. */
  valueAt: number;
}

/** A TIFF structure starting at `start`, read in its own byte order. */
class Tiff {
  private readonly view: DataView;
  private readonly start: number;
  private readonly little: boolean;

  constructor(bytes: Uint8Array, start: number, little: boolean) {
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    this.start = start;
    this.little = little;
  }

  u16(offset: number): number {
    return this.view.getUint16(this.start + offset, this.little);
  }

  u32(offset: number): number {
    return this.view.getUint32(this.start + offset, this.little);
  }

  byte(offset: number): number {
    return this.view.getUint8(this.start + offset);
  }

  /** The entries of the directory at `offset`, by tag. */
  directory(offset: number): Map<number, Entry> {
    const entries = new Map<number, Entry>();
    const count = this.u16(offset);
    for (let index = 0; index < count; index += 1) {
      const at = offset + 2 + index * 12;
      const type = this.u16(at + 2);
      const valueCount = this.u32(at + 4);
      const size = (type === TYPE_RATIONAL ? 8 : type === TYPE_LONG ? 4 : 1) * valueCount;
      entries.set(this.u16(at), { type, count: valueCount, valueAt: size <= 4 ? at + 8 : this.u32(at + 8) });
    }
    return entries;
  }

  /** Degrees, minutes and seconds as decimal degrees, or null if any part is not a number. */
  degrees(entry: Entry | undefined): number | null {
    if (entry === undefined || entry.type !== TYPE_RATIONAL || entry.count !== 3) return null;
    let total = 0;
    for (const [index, scale] of [1, 60, 3600].entries()) {
      const numerator = this.u32(entry.valueAt + index * 8);
      const denominator = this.u32(entry.valueAt + index * 8 + 4);
      if (denominator === 0) return null;
      total += numerator / denominator / scale;
    }
    return total;
  }

  /** The first letter of an ASCII field: N, S, E or W for the references. */
  letter(entry: Entry | undefined): string | null {
    if (entry === undefined || entry.type !== TYPE_ASCII || entry.count < 1) return null;
    return String.fromCharCode(this.byte(entry.valueAt));
  }
}

/** The position in the TIFF structure at `start`, or null when there is none to read. */
function positionAt(bytes: Uint8Array, start: number, little: boolean): GeoPoint | null {
  const tiff = new Tiff(bytes, start, little);
  const pointer = tiff.directory(tiff.u32(4)).get(GPS_IFD_POINTER);
  if (pointer === undefined || pointer.type !== TYPE_LONG) return null;
  const gps = tiff.directory(tiff.u32(pointer.valueAt));

  const lat = tiff.degrees(gps.get(GPS_LATITUDE));
  const lon = tiff.degrees(gps.get(GPS_LONGITUDE));
  const latRef = tiff.letter(gps.get(GPS_LATITUDE_REF));
  const lonRef = tiff.letter(gps.get(GPS_LONGITUDE_REF));
  if (lat === null || lon === null || lat > 90 || lon > 180) return null;
  if ((latRef !== "N" && latRef !== "S") || (lonRef !== "E" && lonRef !== "W")) return null;
  // A picker that blanks the position rather than removing it leaves exactly this.
  if (lat === 0 && lon === 0) return null;
  return { lat: latRef === "S" ? -lat : lat, lon: lonRef === "W" ? -lon : lon };
}

/** The photo's GPS position in decimal degrees (WGS84), or null when it carries none. */
export function readExifPosition(bytes: Uint8Array): GeoPoint | null {
  let candidates = 0;
  for (let index = 0; index + 8 <= bytes.length && candidates < MAX_CANDIDATES; index += 1) {
    const little = bytes[index] === 0x49 && bytes[index + 1] === 0x49 && bytes[index + 2] === 0x2a && bytes[index + 3] === 0x00;
    const big = bytes[index] === 0x4d && bytes[index + 1] === 0x4d && bytes[index + 2] === 0x00 && bytes[index + 3] === 0x2a;
    if (!little && !big) continue;
    candidates += 1;
    try {
      const position = positionAt(bytes, index, little);
      if (position !== null) return position;
    } catch {
      // An offset that points outside the file: not an EXIF block after all, or a cut-off one.
    }
  }
  return null;
}
