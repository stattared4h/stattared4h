import { normalisePublicId } from "../domain/public-id.ts";

interface SearchEntry {
  publicId: string;
  url: string;
  name: string;
}

/** Finds an exact public ID after visitor-friendly normalisation. No suffix matching: an exact result cannot be ambiguous. */
export function findAnimalByPublicId(entries: readonly SearchEntry[], query: string): SearchEntry | null {
  const key = normalisePublicId(query);
  if (key === "") return null;
  return entries.find((entry) => normalisePublicId(entry.publicId) === key) ?? null;
}

export function init(): void {
  const form = document.querySelector<HTMLFormElement>("[data-animal-id-search]");
  if (form === null) return;
  const input = form.querySelector<HTMLInputElement>("[data-animal-id-input]");
  const result = form.querySelector<HTMLElement>("[data-animal-id-result]");
  if (input === null || result === null) return;
  const entries = [...form.querySelectorAll<HTMLElement>("[data-public-id]")].map((element) => ({
    publicId: element.dataset.publicId ?? "",
    url: element.dataset.url ?? "",
    name: element.dataset.name ?? "",
  }));

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const match = findAnimalByPublicId(entries, input.value);
    if (match === null) {
      result.textContent = "Inget djur hittades med det öronmärket.";
      result.hidden = false;
      return;
    }
    window.location.assign(match.url);
  });
}
