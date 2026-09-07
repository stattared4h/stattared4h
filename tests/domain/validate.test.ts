/**
 * 04-§10 and 02-§6.3–6.5: every rule that fails the build, and every warning.
 *
 * The QA dataset is always valid (02-§6.10); each failing rule is exercised with an
 * invalid record built in memory here, never in the dataset.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { formatIssue, MAX_IMAGE_BYTES } from "../../source/ts/domain/validate.ts";
import {
  addAnimal,
  addLocation,
  breedList,
  editAnimal,
  editLocation,
  errorsFor,
  qaDataset,
  rawQa,
  speciesList,
  tempDir,
  validate,
  writeInto,
} from "./helpers.ts";
import { extendedWebp, lossyWebp, paddedWebp, VP8X_EXIF } from "./webp-fixtures.ts";

// --- The QA dataset and the message format ---------------------------------------

test("the QA dataset is valid and normalised", async () => {
  const result = await validate(await rawQa());
  assert.deepEqual(result.errors, []);
  assert.notEqual(result.dataset, null);
  const rosa = result.dataset?.animals.find((a) => a.id === "rosa");
  assert.equal(rosa?.born, "2021-04-12");
  assert.equal(rosa?.photos.length, 2);
  const stjarna = result.dataset?.animals.find((a) => a.id === "stjarna");
  assert.equal(stjarna?.born, "2016", "an integer year becomes text");
  const tuva = result.dataset?.animals.find((a) => a.id === "tuva");
  assert.deepEqual(
    { breed: tuva?.breed, born: tuva?.born, mother: tuva?.mother, description: tuva?.description, photos: tuva?.photos },
    { breed: null, born: null, mother: null, description: null, photos: [] },
    "omitted optional fields become null or []",
  );
});

test("an error message names file, field and what to fix, in Swedish", async () => {
  const raw = await rawQa();
  editAnimal(raw, "rosa", (a) => (a.born = "2021-13-40"));
  const result = await validate(raw);
  assert.equal(result.dataset, null, "dataset is null when there are errors");
  assert.deepEqual(result.errors.map(formatIssue), [
    'animals/rosa.yaml: fältet born: "2021-13-40" är inte ett giltigt datum. Skriv YYYY-MM-DD eller YYYY.',
  ]);
});

// --- Required fields and value shapes (04-§10.2) ----------------------------------

test("a missing required field on an animal fails", async () => {
  for (const field of ["name", "species", "sex", "status"]) {
    const raw = await rawQa();
    editAnimal(raw, "tuva", (a) => delete a[field]);
    const result = await validate(raw);
    assert.equal(errorsFor(result, "animals/tuva.yaml", field).length, 1, field);
    assert.match(errorsFor(result, "animals/tuva.yaml", field)[0].message, /saknas/);
  }
});

test("a missing required field on a location fails, including accessible and active", async () => {
  for (const field of ["name", "species", "accessible", "active"]) {
    const raw = await rawQa();
    editLocation(raw, "gethagen", (l) => delete l[field]);
    const result = await validate(raw);
    assert.equal(errorsFor(result, "locations/gethagen.yaml", field).length, 1, field);
  }
});

test("accessible and active must be booleans, not text", async () => {
  const raw = await rawQa();
  editLocation(raw, "gethagen", (l) => {
    l.accessible = "yes";
    l.active = 1;
  });
  const result = await validate(raw);
  assert.match(errorsFor(result, "locations/gethagen.yaml", "accessible")[0].message, /true eller false/);
  assert.match(errorsFor(result, "locations/gethagen.yaml", "active")[0].message, /true eller false/);
});

test("sex and status only accept the contract's values", async () => {
  const raw = await rawQa();
  editAnimal(raw, "tuva", (a) => {
    a.sex = "hona";
    a.status = "sold";
  });
  const result = await validate(raw);
  assert.match(errorsFor(result, "animals/tuva.yaml", "sex")[0].message, /female, male eller unknown/);
  assert.match(errorsFor(result, "animals/tuva.yaml", "status")[0].message, /here eller gone/);
});

test("an empty string is not a value", async () => {
  const raw = await rawQa();
  editAnimal(raw, "tuva", (a) => (a.name = "   "));
  const result = await validate(raw);
  assert.match(errorsFor(result, "animals/tuva.yaml", "name")[0].message, /får inte vara tomt/);
});

test("a file that is not a mapping or cannot be parsed fails with the file name", async () => {
  const raw = await rawQa();
  raw.animals.push({ file: "animals/lista.yaml", id: "lista", data: ["a"], parseError: null });
  raw.locations.push({ file: "locations/trasig.yaml", id: "trasig", data: null, parseError: "unexpected end" });
  const result = await validate(raw);
  assert.equal(errorsFor(result, "animals/lista.yaml").length, 1);
  assert.match(errorsFor(result, "locations/trasig.yaml")[0].message, /kunde inte läsas som YAML/);
});

// --- Ids (04-§10.3, 04-§3.2, 04-§3.4) ---------------------------------------------

test("a file name that is not a valid id fails", async () => {
  for (const id of ["Rosa", "snöbollen", "lilla gumman", "rosa_2", "-rosa", "rosa--2"]) {
    const raw = await rawQa();
    addAnimal(raw, id, { name: "X", species: "get", sex: "female", status: "here" });
    const result = await validate(raw);
    assert.equal(errorsFor(result, `animals/${id}.yaml`, "filnamn").length, 1, id);
  }
  const raw = await rawQa();
  addLocation(raw, "Övre", { name: "X", species: [], accessible: true, active: true });
  assert.equal(errorsFor(await validate(raw), "locations/Övre.yaml", "filnamn").length, 1);
});

test("two species or two breeds with the same id fail", async () => {
  const raw = await rawQa();
  speciesList(raw).push({ id: "get", name: "Get", plural: "Getter" });
  breedList(raw).push({ id: "jamtget", name: "Jämtget", species: "get", heritage: true });
  const result = await validate(raw);
  assert.match(errorsFor(result, "species.yaml", "species[get].id")[0].message, /finns redan/);
  assert.match(errorsFor(result, "breeds.yaml", "breeds[jamtget].id")[0].message, /finns redan/);
});

test("a species or breed id must follow the id format", async () => {
  const raw = await rawQa();
  speciesList(raw).push({ id: "Häst", name: "Häst", plural: "Hästar" });
  const result = await validate(raw);
  assert.equal(errorsFor(result, "species.yaml", "species[Häst].id").length, 1);
});

// --- born (04-§10.4, 02-§6.7) ----------------------------------------------------

test("born in the future or in another shape fails", async () => {
  const raw = await rawQa();
  editAnimal(raw, "rosa", (a) => (a.born = "2030-01-01"));
  editAnimal(raw, "tuva", (a) => (a.born = "april 2021"));
  editAnimal(raw, "vinter", (a) => (a.born = 2027));
  const result = await validate(raw);
  assert.match(errorsFor(result, "animals/rosa.yaml", "born")[0].message, /framtiden/);
  assert.match(errorsFor(result, "animals/tuva.yaml", "born")[0].message, /inte ett giltigt datum/);
  assert.match(errorsFor(result, "animals/vinter.yaml", "born")[0].message, /framtiden/);
});

test("born as a Date instance is accepted and normalised", async () => {
  const raw = await rawQa();
  editAnimal(raw, "tuva", (a) => (a.born = new Date("2020-02-29T00:00:00Z")));
  const result = await validate(raw);
  assert.deepEqual(result.errors, []);
  assert.equal(result.dataset?.animals.find((a) => a.id === "tuva")?.born, "2020-02-29");
});

// --- References (04-§10.5) --------------------------------------------------------

test("an unknown species, breed, mother or father fails", async () => {
  const raw = await rawQa();
  editAnimal(raw, "rosa", (a) => {
    a.species = "gett";
    a.breed = "jamtgett";
    a.mother = "stjarnan";
    a.father = "Bocken";
  });
  const result = await validate(raw);
  const file = "animals/rosa.yaml";
  assert.match(errorsFor(result, file, "species")[0].message, /arten "gett" finns inte i species\.yaml/);
  assert.match(errorsFor(result, file, "breed")[0].message, /rasen "jamtgett" finns inte i breeds\.yaml/);
  assert.match(errorsFor(result, file, "mother")[0].message, /djuret "stjarnan" finns inte/);
  assert.match(errorsFor(result, file, "father")[0].message, /djuret "Bocken" finns inte/);
});

test("a breed of another species fails", async () => {
  const raw = await rawQa();
  editAnimal(raw, "rosa", (a) => (a.breed = "varmlandsfar"));
  const result = await validate(raw);
  assert.match(errorsFor(result, "animals/rosa.yaml", "breed")[0].message, /hör till arten "far", inte "get"/);
});

test("a breed whose species does not exist fails", async () => {
  const raw = await rawQa();
  breedList(raw).push({ id: "lama", name: "Lama", species: "lama", heritage: false });
  const result = await validate(raw);
  assert.match(errorsFor(result, "breeds.yaml", "breeds[lama].species")[0].message, /finns inte i species\.yaml/);
});

test("a location species that does not exist, or is listed twice, fails", async () => {
  const raw = await rawQa();
  editLocation(raw, "gethagen", (l) => (l.species = ["get", "lama"]));
  editLocation(raw, "bjorkhagen", (l) => (l.species = ["get", "get"]));
  editLocation(raw, "stora-hagen", (l) => (l.species = "far"));
  const result = await validate(raw);
  assert.match(errorsFor(result, "locations/gethagen.yaml", "species")[0].message, /arten "lama" finns inte/);
  assert.match(errorsFor(result, "locations/bjorkhagen.yaml", "species")[0].message, /två gånger/);
  assert.match(errorsFor(result, "locations/stora-hagen.yaml", "species")[0].message, /måste vara en lista/);
});

test("an invalid field does not hide the reference errors in the same file", async () => {
  const raw = await rawQa();
  editAnimal(raw, "rosa", (a) => {
    a.born = "igår";
    a.mother = "stjarnan";
  });
  const result = await validate(raw);
  assert.equal(errorsFor(result, "animals/rosa.yaml", "born").length, 1);
  assert.equal(errorsFor(result, "animals/rosa.yaml", "mother").length, 1);
});

// --- Pedigree (04-§10.6) ----------------------------------------------------------

test("an animal cannot be its own parent", async () => {
  const raw = await rawQa();
  editAnimal(raw, "rosa", (a) => (a.mother = "rosa"));
  const result = await validate(raw);
  assert.match(errorsFor(result, "animals/rosa.yaml", "mother")[0].message, /sin egen förälder/);
});

test("a pedigree that loops fails, reported once", async () => {
  const raw = await rawQa();
  // rosa → stjarna → rosa: Rosa's mother is Stjärna, and now Stjärna's father is Rosa.
  editAnimal(raw, "stjarna", (a) => (a.father = "rosa"));
  const result = await validate(raw);
  const cycles = result.errors.filter((e) => /cirkel/.test(e.message));
  assert.equal(cycles.length, 1, "one loop, one message");
  assert.equal(cycles[0].file, "animals/rosa.yaml");
  assert.match(cycles[0].message, /rosa → stjarna → rosa/);
});

// --- location on an animal (04-§10.8) ---------------------------------------------

test("a location field on an animal fails with a pointer to ADR 0012", async () => {
  const raw = await rawQa();
  editAnimal(raw, "rosa", (a) => (a.location = "gethagen"));
  const result = await validate(raw);
  const errors = errorsFor(result, "animals/rosa.yaml", "location");
  assert.equal(errors.length, 1, "one message, not also an unknown-field message");
  assert.match(errors[0].message, /ADR 0012/);
});

// --- HTML (04-§10.9) ---------------------------------------------------------------

test("HTML in any field fails, markdown and comparisons pass", async () => {
  const raw = await rawQa();
  editAnimal(raw, "rosa", (a) => (a.description = "Rosa är <b>framfusig</b>."));
  editAnimal(raw, "stjarna", (a) => ((a.photos as { alt: string }[])[0].alt = "<img src=x>"));
  editLocation(raw, "gethagen", (l) => (l.note = "<!-- dold -->"));
  speciesList(raw)[0].name = "</Get>";
  editAnimal(raw, "tuva", (a) => (a.description = "Tuva är **liten** och väger < 5 kg, se [gården](https://4h.se)."));
  const result = await validate(raw);
  assert.match(errorsFor(result, "animals/rosa.yaml", "description")[0].message, /innehåller HTML/);
  assert.equal(errorsFor(result, "animals/stjarna.yaml", "photos[0].alt").length, 1);
  assert.equal(errorsFor(result, "locations/gethagen.yaml", "note").length, 1);
  assert.equal(errorsFor(result, "species.yaml", "species[get].name").length, 1);
  assert.deepEqual(errorsFor(result, "animals/tuva.yaml"), []);
});

// --- Unknown fields (04-§10.11, 02-§6.3) ------------------------------------------

test("an unknown field anywhere fails, so a typo is never silently ignored", async () => {
  const raw = await rawQa();
  editAnimal(raw, "rosa", (a) => {
    a.nmae = "Rosa";
    (a.photos as Record<string, unknown>[])[0].caption = "x";
  });
  editLocation(raw, "gethagen", (l) => (l.notes = "x"));
  speciesList(raw)[0].photos = [];
  breedList(raw)[0].origin = "x";
  (raw.species?.data as Record<string, unknown>).extra = 1;
  const result = await validate(raw);
  assert.match(errorsFor(result, "animals/rosa.yaml", "nmae")[0].message, /okänt fält/);
  assert.equal(errorsFor(result, "animals/rosa.yaml", "photos[0].caption").length, 1);
  assert.equal(errorsFor(result, "locations/gethagen.yaml", "notes").length, 1);
  assert.equal(errorsFor(result, "species.yaml", "species[get].photos").length, 1);
  assert.equal(errorsFor(result, "species.yaml", "extra").length, 1);
  assert.equal(errorsFor(result, "breeds.yaml", "breeds[jamtget].origin").length, 1);
});

// --- Photos (04-§10.7, 04-§9) -----------------------------------------------------

test("a photo needs file, alt, credit and portrait", async () => {
  for (const field of ["file", "alt", "credit", "portrait"]) {
    const raw = await rawQa();
    editAnimal(raw, "rosa", (a) => delete (a.photos as Record<string, unknown>[])[0][field]);
    const result = await validate(raw);
    assert.equal(errorsFor(result, "animals/rosa.yaml", field).length, 1, field);
  }
});

test("at most one photo per animal is the portrait", async () => {
  const raw = await rawQa();
  editAnimal(raw, "rosa", (a) => ((a.photos as { portrait: boolean }[])[1].portrait = true));
  const result = await validate(raw);
  assert.match(errorsFor(result, "animals/rosa.yaml", "photos")[0].message, /Bara en bild kan vara porträttet/);
});

test("a photo file is a bare .webp name that starts with the record's id", async () => {
  const raw = await rawQa();
  editAnimal(raw, "rosa", (a) => {
    const photos = a.photos as { file: string }[];
    photos[0].file = "images/rosa-1.webp";
    photos[1].file = "stjarna-1.jpg";
  });
  speciesList(raw)[0].photo = { file: "get.webp", alt: "En get", credit: "Anna Andersson" };
  const result = await validate(raw);
  assert.match(errorsFor(result, "animals/rosa.yaml", "photos[0].file")[0].message, /inte en sökväg/);
  const second = errorsFor(result, "animals/rosa.yaml", "photos[1].file").map((e) => e.message);
  assert.ok(second.some((m) => /\.webp/.test(m)), "extension");
  assert.ok(second.some((m) => /inledas med postens id "rosa"/.test(m)), "prefix");
  assert.deepEqual(errorsFor(result, "species.yaml"), [], "get.webp starts with the species id");
});

test("a species photo needs file, alt and credit", async () => {
  const raw = await rawQa();
  speciesList(raw)[0].photo = { file: "get-1.webp" };
  const result = await validate(raw);
  assert.equal(errorsFor(result, "species.yaml", "alt").length, 1);
  assert.equal(errorsFor(result, "species.yaml", "credit").length, 1);
});

// --- Coordinates ------------------------------------------------------------------

test("lat and lon come together and stay within WGS84 ranges", async () => {
  const raw = await rawQa();
  editLocation(raw, "gethagen", (l) => (l.lon = null));
  editLocation(raw, "bjorkhagen", (l) => (l.lat = 95));
  editLocation(raw, "stora-hagen", (l) => (l.lon = "12,2"));
  const result = await validate(raw);
  assert.match(errorsFor(result, "locations/gethagen.yaml", "lon")[0].message, /anges tillsammans/);
  assert.match(errorsFor(result, "locations/bjorkhagen.yaml", "lat")[0].message, /utanför -90 till 90/);
  assert.match(errorsFor(result, "locations/stora-hagen.yaml", "lon")[0].message, /måste vara ett tal/);
});

// --- Warnings (02-§6.4, 04-§10.10) ------------------------------------------------

test("the QA dataset yields exactly the known warnings", async () => {
  const result = await validate(await rawQa());
  assert.deepEqual(
    result.warnings.map((w) => `${w.file}:${w.field}`).sort(),
    [
      "animals/bocken.yaml:photos",
      "animals/bomull.yaml:photos",
      "animals/dagg.yaml:photos",
      "animals/tuva.yaml:photos",
      "locations/ovre-hagen.yaml:species",
      "species.yaml:species[far].photo",
      "species.yaml:species[get].photo",
      "species.yaml:species[gris].photo",
      "species.yaml:species[hast]",
      "species.yaml:species[hast].photo",
      "species.yaml:species[hons].photo",
      "species.yaml:species[kanin].photo",
      "species.yaml:species[katt].photo",
      "species.yaml:species[ko].photo",
    ],
  );
  const hast = result.warnings.find((w) => w.field === "species[hast]");
  assert.match(hast?.message ?? "", /finns på ingen aktiv plats/);
  assert.ok(
    !result.warnings.some((w) => w.file === "locations/gamla-stallet.yaml"),
    "an inactive location without coordinates is not a warning",
  );
});

test("an active location without coordinates warns", async () => {
  const raw = await rawQa();
  editLocation(raw, "gamla-stallet", (l) => (l.active = true));
  const result = await validate(raw);
  assert.deepEqual(result.errors, []);
  const warning = result.warnings.find((w) => w.file === "locations/gamla-stallet.yaml" && w.field === "lat");
  assert.match(warning?.message ?? "", /saknar koordinater/);
  assert.ok(result.warnings.some((w) => w.file === "locations/gamla-stallet.yaml" && w.field === "species"));
});

test("a species with a photo and a place stops warning", async () => {
  const raw = await rawQa();
  speciesList(raw)[3].photo = { file: "hast-1.webp", alt: "En häst", credit: "Erik Eriksson" };
  editLocation(raw, "ovre-hagen", (l) => (l.species = ["hast"]));
  const result = await validate(raw);
  assert.deepEqual(result.errors, []);
  assert.ok(!result.warnings.some((w) => w.file === "species.yaml" && w.field?.startsWith("species[hast]")));
  assert.ok(!result.warnings.some((w) => w.file === "locations/ovre-hagen.yaml"));
});

// --- Image files (04-§10.7, 02-§8.2) ----------------------------------------------

/** Writes every image the QA data references as a small valid WebP, then applies overrides. */
async function imagesDirWith(overrides: Record<string, Uint8Array | null>): Promise<string> {
  const dir = await tempDir("s4h-images");
  const dataset = await qaDataset();
  for (const animal of dataset.animals) {
    for (const photo of animal.photos) await writeInto(dir, `animals/${photo.file}`, lossyWebp(800, 600));
  }
  for (const [relative, bytes] of Object.entries(overrides)) {
    if (bytes !== null) await writeInto(dir, relative, bytes);
  }
  return dir;
}

test("image checks are skipped when imagesDir is null", async () => {
  const result = await validate(await rawQa(), { imagesDir: null });
  assert.deepEqual(result.errors, []);
});

test("all referenced images present and within limits pass", async () => {
  const raw = await rawQa();
  speciesList(raw)[0].photo = { file: "get-1.webp", alt: "En get", credit: "Anna Andersson" };
  const imagesDir = await imagesDirWith({ "species/get-1.webp": extendedWebp(1600, 1600) });
  const result = await validate(raw, { imagesDir });
  assert.deepEqual(result.errors, []);
});

test("a missing image fails", async () => {
  const raw = await rawQa();
  speciesList(raw)[0].photo = { file: "get-1.webp", alt: "En get", credit: "Anna Andersson" };
  const imagesDir = await imagesDirWith({});
  const result = await validate(raw, { imagesDir });
  assert.match(errorsFor(result, "species.yaml", "species[get].photo.file")[0].message, /species\/get-1\.webp finns inte/);
});

test("an image that is not WebP, is too large, or carries metadata fails", async () => {
  const imagesDir = await imagesDirWith({
    "animals/rosa-1.webp": new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]),
    "animals/rosa-2.webp": lossyWebp(1601, 900),
    "animals/majros-1.webp": extendedWebp(1200, 800, VP8X_EXIF),
    "animals/majros-2.webp": paddedWebp(800, 600, MAX_IMAGE_BYTES + 1),
  });
  const result = await validate(await rawQa(), { imagesDir });
  assert.match(errorsFor(result, "animals/rosa.yaml", "photos[0].file")[0].message, /inte en WebP-fil/);
  assert.match(errorsFor(result, "animals/rosa.yaml", "photos[1].file")[0].message, /1601×900 px; högst 1600 px/);
  assert.match(errorsFor(result, "animals/majros.yaml", "photos[0].file")[0].message, /EXIF-, XMP- eller ICC-metadata/);
  assert.match(errorsFor(result, "animals/majros.yaml", "photos[1].file")[0].message, /högst 250 KB/);
  assert.equal(result.errors.length, 4);
});
