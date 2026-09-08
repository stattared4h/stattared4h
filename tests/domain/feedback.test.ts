/**
 * 02-§10.16, 02-§10.19–10.20 and 03-§10.3: the address of the pre-filled feedback issue.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  BODY_MAX_LENGTH,
  buildFeedbackBody,
  buildFeedbackTitle,
  buildFeedbackUrl,
  formatMeta,
  isFeedbackComplete,
  TITLE_MAX_LENGTH,
  type FeedbackMeta,
} from "../../source/ts/domain/feedback.ts";

const META: FeedbackMeta = {
  version: "1.0.4 – QA PR212",
  page: "https://example.test/stattared4h/plats/lygnslatt-1/",
  viewport: { width: 390, height: 844 },
  time: new Date("2026-09-07T10:15:00Z"),
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) Safari/605.1.15",
};

const REPO = "https://github.com/stattared4h/stattared4h";

function params(url: string): URLSearchParams {
  return new URL(url).searchParams;
}

describe("rubriken (02-§10.16)", () => {
  test("[Feedback] <kategori>: <rubrik>", () => {
    assert.equal(buildFeedbackTitle("Fel", "Kartan laddar inte"), "[Feedback] Fel: Kartan laddar inte");
    assert.equal(buildFeedbackTitle("Förslag", "  Fler bilder  "), "[Feedback] Förslag: Fler bilder", "rubriken trimmas");
  });

  test("rubriken klipps vid 200 tecken", () => {
    const long = "a".repeat(TITLE_MAX_LENGTH + 50);
    assert.equal(buildFeedbackTitle("Övrigt", long), `[Feedback] Övrigt: ${"a".repeat(TITLE_MAX_LENGTH)}`);
  });
});

describe("metadataraden (02-§10.16)", () => {
  test("version, sida, fönster, tidpunkt i ISO och webbläsare, i den ordningen", () => {
    assert.equal(
      formatMeta(META),
      "Version 1.0.4 – QA PR212, sida https://example.test/stattared4h/plats/lygnslatt-1/, fönster 390×844, tidpunkt 2026-09-07T10:15:00.000Z, webbläsare Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) Safari/605.1.15",
    );
  });

  test("ett bygge utan version skriver 'okänd'", () => {
    assert.match(formatMeta({ ...META, version: null }), /^Version okänd, /);
  });

  test("beskrivningen kommer före raden, åtskild av en linje", () => {
    const body = buildFeedbackBody("Kartan är tom.\n\nJag öppnade den offline.", META);
    assert.equal(body, `Kartan är tom.\n\nJag öppnade den offline.\n\n---\n${formatMeta(META)}\n`);
  });

  test("beskrivningen klipps vid 2 000 tecken, metadataraden klipps aldrig", () => {
    const body = buildFeedbackBody("x".repeat(BODY_MAX_LENGTH + 1), META);
    assert.ok(body.startsWith("x".repeat(BODY_MAX_LENGTH) + "\n\n---\n"));
    assert.doesNotMatch(body, /x{2001}/);
    assert.ok(body.endsWith(`${formatMeta(META)}\n`));
  });
});

describe("adressen (02-§10.16, 02-§10.19, 03-§10.3)", () => {
  test("pekar på repots nya issue med mall, etikett, rubrik och beskrivning", () => {
    const url = buildFeedbackUrl({ repo: REPO, category: "Fel", title: "Kartan laddar inte", body: "Den är tom.", meta: META });
    assert.ok(url.startsWith(`${REPO}/issues/new?`), url);
    const query = params(url);
    assert.equal(query.get("template"), "feedback.md");
    assert.equal(query.get("labels"), "feedback");
    assert.equal(query.get("title"), "[Feedback] Fel: Kartan laddar inte");
    assert.equal(query.get("body"), buildFeedbackBody("Den är tom.", META));
  });

  test("ett avslutande snedstreck i repoadressen ger inte dubbla snedstreck", () => {
    const url = buildFeedbackUrl({ repo: `${REPO}/`, category: "Övrigt", title: "Hej", body: "Hej", meta: META });
    assert.ok(url.startsWith(`${REPO}/issues/new?`), url);
  });

  test("svenska tecken, radbrytningar och &-tecken överlever kodningen", () => {
    const body = "Rad ett & rad två\nÅäö";
    const url = buildFeedbackUrl({ repo: REPO, category: "Förslag", title: "Ärende & annat", body, meta: META });
    assert.equal(params(url).get("title"), "[Feedback] Förslag: Ärende & annat");
    assert.equal(params(url).get("body"), buildFeedbackBody(body, META));
  });

  test("bara en adress, inget annat, lämnar sidan (02-§10.20)", () => {
    const url = buildFeedbackUrl({ repo: REPO, category: "Fel", title: "t", body: "b", meta: META });
    assert.equal(new URL(url).host, "github.com");
  });
});

describe("Skicka (02-§10.16)", () => {
  test("aktiv först när både rubrik och beskrivning är ifyllda", () => {
    assert.equal(isFeedbackComplete("", ""), false);
    assert.equal(isFeedbackComplete("Rubrik", ""), false);
    assert.equal(isFeedbackComplete("", "Text"), false);
    assert.equal(isFeedbackComplete("   ", "Text"), false, "blanksteg räknas inte som ifyllt");
    assert.equal(isFeedbackComplete("Rubrik", "Text"), true);
  });
});
