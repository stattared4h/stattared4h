/**
 * Hand-built WebP byte blocks for the parser and the image checks. Only the container
 * and the headers are real; the pixel data is filler, which is all the inspector reads.
 */

function ascii(text: string): number[] {
  return [...text].map((c) => c.charCodeAt(0));
}

function u16le(n: number): number[] {
  return [n & 0xff, (n >>> 8) & 0xff];
}

function u24le(n: number): number[] {
  return [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff];
}

function u32le(n: number): number[] {
  return [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];
}

/** A RIFF chunk with even-length padding. */
export function chunk(id: string, payload: number[]): number[] {
  const padded = payload.length % 2 === 0 ? payload : [...payload, 0];
  return [...ascii(id), ...u32le(payload.length), ...padded];
}

/** Wraps chunks in a RIFF/WEBP container. */
export function riff(chunks: number[][]): Uint8Array {
  const body = [...ascii("WEBP"), ...chunks.flat()];
  return new Uint8Array([...ascii("RIFF"), ...u32le(body.length), ...body]);
}

/** Lossy bitstream header: frame tag, start code, 14-bit width and height. */
export function vp8Chunk(width: number, height: number): number[] {
  return chunk("VP8 ", [0x10, 0x02, 0x00, 0x9d, 0x01, 0x2a, ...u16le(width), ...u16le(height), 0, 0, 0, 0]);
}

/** Lossless bitstream header: signature, then width-1 and height-1 in 14 bits each. */
export function vp8lChunk(width: number, height: number): number[] {
  const bits = (width - 1) | ((height - 1) << 14);
  return chunk("VP8L", [0x2f, ...u32le(bits), 0, 0, 0, 0]);
}

export const VP8X_ICC = 0x20;
export const VP8X_EXIF = 0x08;
export const VP8X_XMP = 0x04;

/** Extended header: flags, reserved, then canvas width-1 and height-1 in 24 bits each. */
export function vp8xChunk(width: number, height: number, flags = 0): number[] {
  return chunk("VP8X", [flags, 0, 0, 0, ...u24le(width - 1), ...u24le(height - 1)]);
}

export function lossyWebp(width: number, height: number): Uint8Array {
  return riff([vp8Chunk(width, height)]);
}

export function losslessWebp(width: number, height: number): Uint8Array {
  return riff([vp8lChunk(width, height)]);
}

export function extendedWebp(width: number, height: number, flags = 0, extra: number[][] = []): Uint8Array {
  return riff([vp8xChunk(width, height, flags), ...extra, vp8Chunk(width, height)]);
}

/** A valid lossy WebP padded with an unknown chunk so the file reaches `bytes` in size. */
export function paddedWebp(width: number, height: number, bytes: number): Uint8Array {
  const base = lossyWebp(width, height).length + 8;
  return riff([vp8Chunk(width, height), chunk("PADD", new Array(Math.max(0, bytes - base)).fill(0))]);
}
