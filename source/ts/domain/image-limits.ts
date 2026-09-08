/**
 * The limits every web-ready image in the repository holds (02-§8.1, ADR 0008).
 *
 * They live in their own module because four places need them and none of them may
 * disagree: the validator that refuses a file, the build command that writes one, the
 * import command, and the image tool in the browser (02-§11.24). A number written in
 * four files is a number that will be changed in three.
 */

/** Longest side in pixels. */
export const MAX_IMAGE_EDGE = 1600;

/** File size in bytes. */
export const MAX_IMAGE_BYTES = 250 * 1024;

/**
 * WebP quality tried in order until the file fits under the size limit. Both sharp in
 * the build and `canvas.toBlob` in the browser walk this ladder, so a photo lands on the
 * same rung whichever side prepared it — even though the encoders themselves differ
 * (ADR 0021).
 */
export const IMAGE_QUALITY_STEPS: readonly number[] = [82, 74, 66, 58, 50, 42, 34, 26];
