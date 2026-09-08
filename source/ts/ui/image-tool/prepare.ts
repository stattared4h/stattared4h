/**
 * Turning a photo the editor picked into the file the repository takes (02-§11.8–11.11).
 *
 * This is the only part of the tool that needs a browser: decoding the picture, drawing
 * it smaller and asking the encoder for WebP. The decisions around it — how far to scale
 * and which quality to keep — are `source/ts/domain/image-prepare.ts`, tested in Node
 * (ADR 0021).
 *
 * The upright turn happens without a line of code asking for it: the browser reads the
 * EXIF orientation and turns the picture before it is drawn.
 *
 * Metadata takes one line. A canvas carries nothing but pixels, so EXIF and XMP — the GPS
 * position in a phone photo among them — cannot get through it (ADR 0008). The encoder on
 * the other side is another matter: Chromium writes an ICC profile into every WebP it
 * makes, and the repository takes none, so `stripWebpMetadata` takes it back out.
 */
import { imageIdFor } from "../../domain/image-id.ts";
import { MAX_IMAGE_EDGE } from "../../domain/image-limits.ts";
import { encodeUnderLimit, fitWithin } from "../../domain/image-prepare.ts";
import { stripWebpMetadata } from "../../domain/webp.ts";

export interface PreparedImage {
  /** `img-` and twelve hexadecimal characters, derived from the finished file (02-§8.9). */
  id: string;
  data: Uint8Array;
  width: number;
  height: number;
  quality: number;
  /** What the file was called on the way in, so the editor can tell two pictures apart. */
  sourceName: string;
}

/**
 * Decodes the file, upright, as an element whose intrinsic size is the corrected one.
 *
 * Which formats are allowed is the browser's answer, not a list of ours: everything that
 * comes out of here is WebP from a canvas, so the format going in never reaches the
 * repository. That matters on an iPhone, where the camera roll holds HEIC and Safari is
 * the one browser that can read it.
 */
async function decode(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  const image = new Image();
  try {
    image.src = url;
    await image.decode();
    return image;
  } catch {
    throw new Error(
      "Filen går inte att öppna som en bild. Webbläsaren känner kanske inte formatet — " +
        "spara den som JPEG och försök igen.",
    );
  } finally {
    // The decoded picture is kept by the element; the address is not needed any more.
    URL.revokeObjectURL(url);
  }
}

/** WebP at the given quality, or an error the editor can act on. */
async function toWebp(canvas: HTMLCanvasElement, quality: number): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", quality / 100);
  });
  if (blob === null) throw new Error("Webbläsaren kunde inte spara bilden.");
  if (blob.type !== "image/webp") {
    throw new Error("Webbläsaren kan inte spara WebP. Prova en nyare webbläsare, eller en annan telefon.");
  }
  // Chromium writes an sRGB profile into every WebP it encodes, and the repository takes
  // no metadata at all (02-§8.1). Stripping here rather than afterwards means the size
  // the quality ladder measures is the size of the file that is actually handed over.
  return stripWebpMetadata(new Uint8Array(await blob.arrayBuffer()));
}

/**
 * The web-ready file for one picked photo. Throws an Error whose message is Swedish and
 * meant for the editor: the caller shows it beside the picture that caused it.
 */
export async function prepareImage(file: File): Promise<PreparedImage> {
  const image = await decode(file);
  const size = fitWithin({ width: image.naturalWidth, height: image.naturalHeight }, MAX_IMAGE_EDGE);

  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (context === null) throw new Error("Webbläsaren kunde inte rita om bilden.");
  context.drawImage(image, 0, 0, size.width, size.height);

  const encoded = await encodeUnderLimit((quality) => toWebp(canvas, quality));
  return {
    id: await imageIdFor(encoded.data),
    data: encoded.data,
    width: size.width,
    height: size.height,
    quality: encoded.quality,
    sourceName: file.name,
  };
}
