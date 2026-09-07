/** Pure prompt planning for the generated QA images (02-§8.22, 03-§6.8). */
import type { Animal, Dataset, Image, Location } from "../../source/ts/domain/types.ts";

export interface QaPromptRow {
  id: string;
  file: string;
  prompt: string;
}

const SEX_LABELS = { female: "hona", male: "hane", unknown: "okänt kön" } as const;

function plain(text: string | null): string | null {
  if (text === null) return null;
  const value = text.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
  return value || null;
}

function animalContext(animal: Animal, dataset: Dataset): string {
  const species = dataset.species.find((entry) => entry.id === animal.species)?.name ?? animal.species;
  const breed = dataset.breeds.find((entry) => entry.id === animal.breed)?.name ?? animal.breed;
  const facts = [animal.name, species, breed, SEX_LABELS[animal.sex]].filter(Boolean).join(", ");
  const description = plain(animal.description);
  return description === null ? facts : `${facts}. ${description}`;
}

function locationContext(location: Location): string {
  const details = [plain(location.note), plain(location.description)].filter(Boolean).join(" ");
  return details === "" ? `Platsen ${location.name}.` : `Platsen ${location.name}. ${details}`;
}

function referencesFor(image: Image, dataset: Dataset): string[] {
  const references: string[] = [];
  for (const animal of dataset.animals) {
    if (animal.photos.some((photo) => photo.id === image.id)) references.push(animalContext(animal, dataset));
  }
  for (const location of dataset.locations) {
    if (location.photos.some((photo) => photo.id === image.id)) references.push(locationContext(location));
  }
  for (const species of dataset.species) {
    if (species.photo?.id === image.id) references.push(`Arten ${species.name}, ${species.plural.toLowerCase()}.`);
  }
  return references;
}

export function buildQaPromptRows(dataset: Dataset): QaPromptRow[] {
  return [...dataset.images]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((image) => {
      const context = referencesFor(image, dataset);
      const prompt = [
        "Fotorealistiskt naturligt fotografi för en svensk 4H-gårds QA-sajt.",
        `Motiv och alternativtext: ${image.alt}`,
        context.length === 0 ? null : `Datakontext: ${context.join(" ")}`,
        "Djuret i ögonhöjd, ansiktet tydligt, vardagsljus och trovärdig svensk gårdsmiljö.",
        "Liggande 4:3-komposition. Inga personer, ingen text, ingen logotyp och ingen vattenstämpel.",
      ]
        .filter(Boolean)
        .join(" ");
      return { id: image.id, file: `${image.id}.png`, prompt };
    });
}

function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

export function qaPromptCsv(rows: readonly QaPromptRow[]): string {
  const body = rows.map((row) => [row.id, row.file, row.prompt].map(csvField).join(","));
  return `bild-id,fil,prompt\n${body.join("\n")}${body.length > 0 ? "\n" : ""}`;
}
