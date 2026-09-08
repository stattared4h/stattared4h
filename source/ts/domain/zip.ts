/**
 * A minimal zip writer (02-§11.18, 02-§11.20).
 *
 * The image tool hands the editor one archive rather than twenty downloads, and no
 * library may be fetched to build it (CL-§2.15). Everything here is stored — no deflate:
 * WebP is already compressed, and a compressor would be a few hundred lines of code that
 * saved nothing.
 *
 * The format is the one every unpacker reads: a local header and the bytes for each
 * file, then a central directory describing them all, then an end record. Reference: the
 * PKWARE APPNOTE, sections 4.3.7, 4.3.12 and 4.3.16.
 *
 * No browser API is touched, so the writer is unit tested in Node (CL-§2.14).
 */

export interface ZipEntry {
  /** The path inside the archive, with forward slashes, e.g. `source/images/img-….webp`. */
  name: string;
  data: Uint8Array;
}

const LOCAL_SIGNATURE = 0x04034b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const END_SIGNATURE = 0x06054b50;

/** Stored, i.e. copied as they are. */
const METHOD_STORED = 0;

/** Bit 11: the file name is UTF-8. Set always, so an å in a name is read the same everywhere. */
const FLAG_UTF8 = 0x0800;

/**
 * The version needed to extract: 2.0. Stored entries need no more, and asking for more
 * would turn away an old unpacker for nothing.
 */
const VERSION_NEEDED = 20;

/**
 * MS-DOS time and date, both zero: 1980-01-01 00:00. A real clock would make the same
 * photos give a different archive every time, and the archive is thrown away as soon as
 * it is unpacked — a timestamp in it tells nobody anything.
 */
const DOS_TIME = 0;
const DOS_DATE = 0;

const CRC_TABLE = buildCrcTable();

function buildCrcTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
}

/** CRC-32 as zip uses it: the reflected polynomial 0xedb88320, seeded and finished with ones. */
export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** One entry, with everything the two headers need worked out once. */
interface Prepared extends ZipEntry {
  nameBytes: Uint8Array;
  crc: number;
  offset: number;
}

/**
 * Builds the archive. The entries keep the order they are given, so the editor sees the
 * pictures in the order they were prepared.
 *
 * Throws when two entries share a name: an archive with a duplicate would silently lose
 * one of them when unpacked, and the id in the name is derived from the content, so a
 * duplicate always means a mistake upstream.
 */
export function createZip(entries: readonly ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const seen = new Set<string>();
  const prepared: Prepared[] = [];
  let offset = 0;

  for (const entry of entries) {
    if (seen.has(entry.name)) throw new Error(`Arkivet har redan en fil som heter ${entry.name}.`);
    seen.add(entry.name);
    const nameBytes = encoder.encode(entry.name);
    prepared.push({ ...entry, nameBytes, crc: crc32(entry.data), offset });
    offset += 30 + nameBytes.length + entry.data.length;
  }

  const centralStart = offset;
  const centralSize = prepared.reduce((total, entry) => total + 46 + entry.nameBytes.length, 0);
  const bytes = new Uint8Array(centralStart + centralSize + 22);
  const view = new DataView(bytes.buffer);

  for (const entry of prepared) {
    let at = entry.offset;
    view.setUint32(at, LOCAL_SIGNATURE, true);
    view.setUint16(at + 4, VERSION_NEEDED, true);
    view.setUint16(at + 6, FLAG_UTF8, true);
    view.setUint16(at + 8, METHOD_STORED, true);
    view.setUint16(at + 10, DOS_TIME, true);
    view.setUint16(at + 12, DOS_DATE, true);
    view.setUint32(at + 14, entry.crc, true);
    view.setUint32(at + 18, entry.data.length, true);
    view.setUint32(at + 22, entry.data.length, true);
    view.setUint16(at + 26, entry.nameBytes.length, true);
    view.setUint16(at + 28, 0, true);
    at += 30;
    bytes.set(entry.nameBytes, at);
    bytes.set(entry.data, at + entry.nameBytes.length);
  }

  let at = centralStart;
  for (const entry of prepared) {
    view.setUint32(at, CENTRAL_SIGNATURE, true);
    view.setUint16(at + 4, VERSION_NEEDED, true);
    view.setUint16(at + 6, VERSION_NEEDED, true);
    view.setUint16(at + 8, FLAG_UTF8, true);
    view.setUint16(at + 10, METHOD_STORED, true);
    view.setUint16(at + 12, DOS_TIME, true);
    view.setUint16(at + 14, DOS_DATE, true);
    view.setUint32(at + 16, entry.crc, true);
    view.setUint32(at + 20, entry.data.length, true);
    view.setUint32(at + 24, entry.data.length, true);
    view.setUint16(at + 28, entry.nameBytes.length, true);
    view.setUint16(at + 30, 0, true);
    view.setUint16(at + 32, 0, true);
    view.setUint16(at + 34, 0, true);
    view.setUint16(at + 36, 0, true);
    view.setUint32(at + 38, 0, true);
    view.setUint32(at + 42, entry.offset, true);
    bytes.set(entry.nameBytes, at + 46);
    at += 46 + entry.nameBytes.length;
  }

  view.setUint32(at, END_SIGNATURE, true);
  view.setUint16(at + 4, 0, true);
  view.setUint16(at + 6, 0, true);
  view.setUint16(at + 8, prepared.length, true);
  view.setUint16(at + 10, prepared.length, true);
  view.setUint32(at + 12, centralSize, true);
  view.setUint32(at + 16, centralStart, true);
  view.setUint16(at + 20, 0, true);

  return bytes;
}
