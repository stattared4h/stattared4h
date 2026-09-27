/**
 * What the editor adds to a place's file so that a picture shows on it, and where that
 * file is (02-§11.37, 02-§11.38).
 *
 * The image tool never writes the place's file: it may have changed since the site was
 * built, and a whole file from an old build would overwrite that. It shows the lines to
 * add instead, and links to the file for the editor to change on the same branch as the
 * pictures.
 */

/** The data directory's place files, as they lie in the repository. */
const LOCATIONS_DIR = "source/data/locations";

/**
 * The lines to add at the end of the place's file: just the list item when the place
 * already has a `photos` list, the list with its key when it has none. The indentation
 * is the one the place files use.
 */
export function placePhotoLines(imageId: string, placeHasPhotos: boolean): string {
  const item = `  - ${imageId}`;
  return placeHasPhotos ? item : `photos:\n${item}`;
}

/** The place's file on github.com, where the editor switches branch and presses edit. */
export function placeFileUrl(repo: string, placeId: string): string {
  return `${repo}/blob/main/${LOCATIONS_DIR}/${placeId}.yaml`;
}
