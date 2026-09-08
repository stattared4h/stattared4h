/**
 * 02-§11.18, 02-§11.20: the zip archive the image tool hands the editor.
 *
 * The test reads the archive back with its own minimal reader rather than trusting the
 * writer's own idea of the format: a bug that writes a wrong offset would otherwise
 * only show up in the editor's file manager.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { createZip, crc32, type ZipEntry } from "../../source/ts/domain/zip.ts";

const text = (value: string): Uint8Array => new TextEncoder().encode(value);

interface ReadEntry {
  name: string;
  data: Uint8Array;
  method: number;
  crc: number;
}

/** Reads a stored zip: end record, central directory, then each local header. */
function readZip(bytes: Uint8Array): ReadEntry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = bytes.length - 22;
  while (end >= 0 && view.getUint32(end, true) !== 0x06054b50) end -= 1;
  assert.ok(end >= 0, "hittar ingen slutpost (EOCD)");
  const count = view.getUint16(end + 10, true);
  let offset = view.getUint32(end + 16, true);

  const entries: ReadEntry[] = [];
  for (let index = 0; index < count; index += 1) {
    assert.equal(view.getUint32(offset, true), 0x02014b50, "central katalogpost saknar signatur");
    const method = view.getUint16(offset + 10, true);
    const crc = view.getUint32(offset + 16, true);
    const compressed = view.getUint32(offset + 20, true);
    const uncompressed = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    assert.ok((view.getUint16(offset + 8, true) & 0x0800) !== 0, `${name}: flaggan för UTF-8 saknas`);

    assert.equal(view.getUint32(localOffset, true), 0x04034b50, `${name}: lokalt huvud saknar signatur`);
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const start = localOffset + 30 + localNameLength + localExtraLength;
    assert.equal(uncompressed, compressed, `${name}: lagrad post ska ha samma storlek före och efter`);
    entries.push({ name, method, crc, data: bytes.subarray(start, start + compressed) });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

test("CRC-32 matches the known value for a well-known input", () => {
  // "The quick brown fox jumps over the lazy dog" is 0x414fa339 in every CRC-32 table.
  assert.equal(crc32(text("The quick brown fox jumps over the lazy dog")) >>> 0, 0x414fa339);
  assert.equal(crc32(new Uint8Array(0)) >>> 0, 0);
});

test("every file comes back with its name and its bytes", () => {
  const entries: ZipEntry[] = [
    { name: "source/images/img-a3f2c1d8b901.webp", data: new Uint8Array([0, 1, 2, 250, 255]) },
    { name: "source/data/images/img-a3f2c1d8b901.yaml", data: text("alt: Rosa i hagen\ncredit: Anna\n") },
  ];
  const read = readZip(createZip(entries));
  assert.deepEqual(read.map((entry) => entry.name), entries.map((entry) => entry.name));
  for (const [index, entry] of read.entries()) {
    assert.equal(entry.method, 0, "posterna lagras utan komprimering (02-§11.20)");
    assert.deepEqual([...entry.data], [...entries[index].data]);
    assert.equal(entry.crc >>> 0, crc32(entries[index].data) >>> 0);
  }
});

test("the directories are part of the file names, so the unpacked folder can be dragged in whole", () => {
  const read = readZip(createZip([{ name: "source/images/img-000000000001.webp", data: text("x") }]));
  assert.equal(read[0].name, "source/images/img-000000000001.webp");
});

test("a name with Swedish letters survives", () => {
  const read = readZip(createZip([{ name: "källa/räv.txt", data: text("hej") }]));
  assert.equal(read[0].name, "källa/räv.txt");
  assert.equal(new TextDecoder().decode(read[0].data), "hej");
});

test("the same input always gives the same bytes", () => {
  const make = (): Uint8Array => createZip([{ name: "a.txt", data: text("a") }, { name: "b.txt", data: text("b") }]);
  assert.deepEqual([...make()], [...make()]);
});

test("an empty archive is still a readable zip", () => {
  assert.deepEqual(readZip(createZip([])), []);
});

test("two files with the same name are refused", () => {
  assert.throws(() => createZip([{ name: "a.txt", data: text("1") }, { name: "a.txt", data: text("2") }]), /a\.txt/);
});
