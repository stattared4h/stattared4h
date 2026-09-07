/**
 * 02-§10.11–10.12: when the install button shows, and what a press does.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { installButtonState, IOS_INSTALL_HINT, isIosBrowser } from "../../source/ts/domain/install.ts";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Version/26.0 Mobile/15E148 Safari/604.1";
const IPAD = "Mozilla/5.0 (iPad; CPU OS 26_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1";
const ANDROID = "Mozilla/5.0 (Linux; Android 16; Pixel 9) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36";
const DESKTOP = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36";

describe("iOS-detektion (02-§10.12)", () => {
  test("iPhone, iPad och iPod räknas som iOS", () => {
    assert.equal(isIosBrowser(IPHONE, false), true);
    assert.equal(isIosBrowser(IPAD, false), true);
    assert.equal(isIosBrowser("Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X)", false), true);
  });

  test("Android och skrivbord räknas inte", () => {
    assert.equal(isIosBrowser(ANDROID, false), false);
    assert.equal(isIosBrowser(DESKTOP, false), false);
  });

  test("en webbläsare med MSStream som låtsas vara iPhone räknas inte", () => {
    assert.equal(isIosBrowser(IPHONE, true), false);
  });
});

describe("knappens läge (02-§10.11)", () => {
  const none = { isIos: false, isStandalone: false, canPrompt: false, installed: false };

  test("dold tills webbläsaren erbjuder installation", () => {
    assert.equal(installButtonState(none), "hidden");
    assert.equal(installButtonState({ ...none, canPrompt: true }), "prompt");
  });

  test("aldrig synlig när sajten är installerad eller körs som app", () => {
    assert.equal(installButtonState({ ...none, canPrompt: true, installed: true }), "hidden");
    assert.equal(installButtonState({ ...none, canPrompt: true, isStandalone: true }), "hidden");
    assert.equal(installButtonState({ ...none, isIos: true, isStandalone: true }), "hidden", "iOS från hemskärmen");
  });

  test("på iOS i webbläsaren syns knappen alltid och visar texten om Dela", () => {
    assert.equal(installButtonState({ ...none, isIos: true }), "hint");
    assert.equal(IOS_INSTALL_HINT, "Tryck på Dela och välj Lägg till på hemskärmen");
  });
});
