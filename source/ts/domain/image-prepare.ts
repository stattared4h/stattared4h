/**
 * The two decisions in preparing a photo that do not need a browser (02-§11.8,
 * 02-§11.10, ADR 0021).
 *
 * How far to scale down is arithmetic, and which quality step to keep is a loop around
 * an encoder. Neither has any business knowing what a `canvas` is, so both live here and
 * are unit tested in Node with an encoder made of numbers (CL-§2.14). The tool in
 * `source/ts/ui/image-tool/` supplies the real encoder; `optimiseImage` on the build side
 * walks the same ladder with sharp.
 */
import { IMAGE_QUALITY_STEPS, MAX_IMAGE_BYTES } from "./image-limits.ts";

export interface Size {
  width: number;
  height: number;
}

/**
 * The size to draw at: the picture scaled so its longest side is at most `maxEdge`, with
 * the proportions kept. An image that already fits is left exactly as it is — nothing is
 * ever enlarged, which would only invent detail that is not in the photo.
 *
 * The short side is rounded to the nearest pixel and never allowed to reach zero: a
 * panorama of 20000 × 3 is absurd, but it should come out as a picture rather than as
 * nothing.
 */
export function fitWithin(size: Size, maxEdge: number): Size {
  const longest = Math.max(size.width, size.height);
  if (longest <= maxEdge) return { width: size.width, height: size.height };
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(size.width * scale)),
    height: Math.max(1, Math.round(size.height * scale)),
  };
}

export interface EncodedImage {
  data: Uint8Array;
  /** The quality step that got the file under the limit. */
  quality: number;
}

export interface EncodeUnderLimitOptions {
  maxBytes?: number;
  steps?: readonly number[];
}

/**
 * Encodes at the highest quality that fits under `maxBytes`, trying the steps in order
 * and stopping at the first that holds — the same principle as `optimiseImage`, which is
 * why a picture lands on a comparable rung whichever side prepared it.
 *
 * Throws when even the lowest step is too large. The message is Swedish and names the
 * limit, because it is shown to the editor next to the picture that caused it.
 */
export async function encodeUnderLimit(
  encode: (quality: number) => Promise<Uint8Array>,
  options: EncodeUnderLimitOptions = {},
): Promise<EncodedImage> {
  const { maxBytes = MAX_IMAGE_BYTES, steps = IMAGE_QUALITY_STEPS } = options;
  for (const quality of steps) {
    const data = await encode(quality);
    if (data.byteLength <= maxBytes) return { data, quality };
  }
  throw new Error(
    `Bilden är för stor även på lägsta kvalitet: den håller sig inte under ${Math.round(maxBytes / 1024)} KB. ` +
      "Beskär bilden eller välj en annan.",
  );
}
