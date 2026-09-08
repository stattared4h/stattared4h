/**
 * Minimal WebP container reader and metadata remover (04-§10.7, 02-§8.2, 02-§11.9).
 *
 * `inspectWebp` reads only the RIFF container and the first bitstream chunk — enough to
 * learn the dimensions and whether the file carries ICC, EXIF or XMP metadata. No
 * dependencies, no decoding. Reference: the WebP container specification.
 *
 * `stripWebpMetadata` takes those blocks back out. The image tool needs it because a
 * browser's WebP encoder writes an ICC profile of its own accord — sharp on the build
 * side strips metadata unless asked to keep it, but `canvas.toBlob` has no such switch
 * (ADR 0021). Neither function decodes a pixel: the bitstream chunks are copied through
 * untouched.
 */

export interface WebpInfo {
  /** False when the bytes are not a WebP file this parser understands. */
  ok: boolean;
  width: number;
  height: number;
  /** True when an ICC profile, EXIF or XMP block is present. */
  hasMetadata: boolean;
}

const NOT_WEBP: WebpInfo = { ok: false, width: 0, height: 0, hasMetadata: false };

const VP8X_ICC = 0x20;
const VP8X_EXIF = 0x08;
const VP8X_XMP = 0x04;

function fourCC(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
}

function u16le(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function u24le(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function u32le(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
}

/** Lossy bitstream: 3-byte frame tag, 3-byte start code, then 14-bit width and height. */
function readVp8(bytes: Uint8Array, offset: number, size: number): { width: number; height: number } | null {
  if (size < 10 || offset + 10 > bytes.length) return null;
  if (bytes[offset + 3] !== 0x9d || bytes[offset + 4] !== 0x01 || bytes[offset + 5] !== 0x2a) return null;
  return { width: u16le(bytes, offset + 6) & 0x3fff, height: u16le(bytes, offset + 8) & 0x3fff };
}

/** Lossless bitstream: signature 0x2f, then 14-bit width-1 and 14-bit height-1. */
function readVp8l(bytes: Uint8Array, offset: number, size: number): { width: number; height: number } | null {
  if (size < 5 || offset + 5 > bytes.length) return null;
  if (bytes[offset] !== 0x2f) return null;
  const bits = u32le(bytes, offset + 1);
  return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
}

/** Extended format: flags byte, 3 reserved bytes, 24-bit canvas width-1 and height-1. */
function readVp8x(
  bytes: Uint8Array,
  offset: number,
  size: number,
): { width: number; height: number; hasMetadata: boolean } | null {
  if (size < 10 || offset + 10 > bytes.length) return null;
  const flags = bytes[offset];
  return {
    width: u24le(bytes, offset + 4) + 1,
    height: u24le(bytes, offset + 7) + 1,
    hasMetadata: (flags & (VP8X_ICC | VP8X_EXIF | VP8X_XMP)) !== 0,
  };
}

/**
 * Inspects a WebP file. Dimensions come from the first VP8, VP8L or VP8X chunk;
 * metadata is reported from the VP8X flags and from any ICCP, EXIF or XMP chunk found.
 */
export function inspectWebp(bytes: Uint8Array): WebpInfo {
  if (bytes.length < 12 || fourCC(bytes, 0) !== "RIFF" || fourCC(bytes, 8) !== "WEBP") return NOT_WEBP;

  const riffEnd = Math.min(bytes.length, 8 + u32le(bytes, 4));
  let dimensions: { width: number; height: number } | null = null;
  let hasMetadata = false;
  let offset = 12;

  while (offset + 8 <= riffEnd) {
    const id = fourCC(bytes, offset);
    const size = u32le(bytes, offset + 4);
    const payload = offset + 8;

    if (id === "VP8X") {
      const info = readVp8x(bytes, payload, size);
      if (!info) return NOT_WEBP;
      dimensions ??= { width: info.width, height: info.height };
      hasMetadata ||= info.hasMetadata;
    } else if (id === "VP8 ") {
      dimensions ??= readVp8(bytes, payload, size);
      if (!dimensions) return NOT_WEBP;
    } else if (id === "VP8L") {
      dimensions ??= readVp8l(bytes, payload, size);
      if (!dimensions) return NOT_WEBP;
    } else if (id === "ICCP" || id === "EXIF" || id === "XMP ") {
      hasMetadata = true;
    }

    // Chunks are padded to an even length.
    offset = payload + size + (size % 2);
  }

  if (!dimensions) return NOT_WEBP;
  return { ok: true, width: dimensions.width, height: dimensions.height, hasMetadata };
}

/** The three chunks that carry metadata, and the VP8X flags that announce them. */
const METADATA_CHUNKS = new Set(["ICCP", "EXIF", "XMP "]);
const VP8X_METADATA_FLAGS = VP8X_ICC | VP8X_EXIF | VP8X_XMP;

function writeU32le(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
  bytes[offset + 3] = (value >>> 24) & 0xff;
}

/**
 * The same picture without its ICC profile, EXIF or XMP block. The VP8X flags that
 * announced them are cleared with the chunks, so the file does not promise something it
 * no longer has.
 *
 * Bytes that are not a WebP this parser understands are returned untouched: rewriting a
 * file we cannot read would be worse than leaving it to the validator to refuse.
 */
export function stripWebpMetadata(bytes: Uint8Array): Uint8Array {
  if (!inspectWebp(bytes).ok) return bytes;

  const riffEnd = Math.min(bytes.length, 8 + u32le(bytes, 4));
  const kept: Uint8Array[] = [];
  let offset = 12;

  while (offset + 8 <= riffEnd) {
    const id = fourCC(bytes, offset);
    const size = u32le(bytes, offset + 4);
    const whole = 8 + size + (size % 2);
    if (!METADATA_CHUNKS.has(id)) {
      const chunk = bytes.slice(offset, offset + whole);
      // The extended header keeps its size and its canvas, and loses only its claim to
      // metadata that is no longer in the file.
      if (id === "VP8X" && chunk.length > 8) chunk[8] &= ~VP8X_METADATA_FLAGS;
      kept.push(chunk);
    }
    offset += whole;
  }

  const body = kept.reduce((total, chunk) => total + chunk.length, 0) + 4;
  const out = new Uint8Array(8 + body);
  out.set(bytes.subarray(0, 4));
  writeU32le(out, 4, body);
  out.set(bytes.subarray(8, 12), 8);
  let at = 12;
  for (const chunk of kept) {
    out.set(chunk, at);
    at += chunk.length;
  }
  return out;
}
