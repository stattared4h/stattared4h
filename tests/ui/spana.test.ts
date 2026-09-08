/**
 * 02-§13.10, 02-§13.11, 02-§13.13, 02-§13.15: the words Spana! puts on the screen.
 *
 * The wording is presentation, so it lives in the view layer — but it is pure text and
 * therefore testable in Node, like the other view helpers (`back.ts`, `share.ts`). What
 * the child reads is worth a test; what the DOM does around it is a manual check.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { answerSentence, progressText, stopLabel, visibleText } from "../../source/ts/ui/spana.ts";

describe("svaret i dialogen (02-§13.13)", () => {
  test("platsen sägs som ett besked, inte som ett omdöme", () => {
    assert.equal(answerSentence("Bräckebur"), "Detaljen finns vid Bräckebur.");
    assert.equal(answerSentence("Lottas våffelstuga"), "Detaljen finns vid Lottas våffelstuga.");
  });

  test("inget rätt eller fel nämns", () => {
    const sentence = answerSentence("Bräckebur").toLocaleLowerCase("sv");
    for (const word of ["rätt", "fel", "svar", "poäng"]) {
      assert.ok(!sentence.includes(word), `svaret ska inte innehålla ordet "${word}"`);
    }
  });
});

describe("ledtrådstexten och nivån (02-§13.7)", () => {
  test("Lätt visar texten, Svårt visar den inte", () => {
    assert.equal(visibleText("easy", "Titta bakom gungorna."), "Titta bakom gungorna.");
    assert.equal(visibleText("hard", "Titta bakom gungorna."), null);
  });

  test("en ledtråd utan text har inget att visa på någon nivå", () => {
    assert.equal(visibleText("easy", null), null);
    assert.equal(visibleText("hard", null), null);
  });
});

describe("lägesraden (02-§13.15)", () => {
  test("räknar avbockade stopp av alla", () => {
    assert.equal(progressText(0, 4), "0 av 4 hittade");
    assert.equal(progressText(3, 8), "3 av 8 hittade");
  });

  test("en klar runda säger det i stället för att räkna", () => {
    assert.equal(progressText(4, 4), "Alla hittade!");
  });
});

describe("stoppets etikett (02-§13.10, 05-§6.48)", () => {
  test("numret räknas från ett, som listan visar det", () => {
    assert.equal(stopLabel(0, false), "Stopp 1");
    assert.equal(stopLabel(7, false), "Stopp 8");
  });

  test("ett avbockat stopp säger att det är hittat", () => {
    assert.equal(stopLabel(0, true), "Stopp 1, hittad");
  });

  test("bildens beskrivning följer med, så spelet finns även utan syn (05-§9.6)", () => {
    assert.equal(stopLabel(0, false, "Närbild på en gunga."), "Stopp 1: Närbild på en gunga.");
    assert.equal(stopLabel(2, true, "Närbild på en gunga."), "Stopp 3: Närbild på en gunga., hittad");
  });

  test("en bild utan beskrivning ger bara numret, aldrig ett kolon som hänger", () => {
    assert.equal(stopLabel(0, false, "   "), "Stopp 1");
  });
});
