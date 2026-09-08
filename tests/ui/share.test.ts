/**
 * 02-§10.30: share with the device when it can, otherwise copy the address.
 */
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { shareOrCopy } from "../../source/ts/ui/share.ts";

const PAGE = "https://example.test/stattared4h/plats/lygnslatt-1/";

function abort(): Error {
  const error = new Error("cancelled");
  error.name = "AbortError";
  return error;
}

describe("dela eller kopiera", () => {
  test("delningsfunktionen används när den finns, med titel och adress", async () => {
    const calls: Array<{ title: string; url: string }> = [];
    const outcome = await shareOrCopy("Lygnslätt 1", PAGE, {
      share: async (data) => {
        calls.push(data);
      },
      writeText: async () => assert.fail("ska inte kopiera när delning finns"),
    });
    assert.equal(outcome, "shared");
    assert.deepEqual(calls, [{ title: "Lygnslätt 1", url: PAGE }]);
  });

  test("utan delningsfunktion kopieras adressen", async () => {
    const copied: string[] = [];
    const outcome = await shareOrCopy("Lygnslätt 1", PAGE, { writeText: async (text) => void copied.push(text) });
    assert.equal(outcome, "copied");
    assert.deepEqual(copied, [PAGE]);
  });

  test("en avbruten delning kopierar inte", async () => {
    let copied = false;
    const outcome = await shareOrCopy("t", PAGE, {
      share: async () => {
        throw abort();
      },
      writeText: async () => void (copied = true),
    });
    assert.equal(outcome, "cancelled");
    assert.equal(copied, false);
  });

  test("en delning som misslyckas av annat skäl faller tillbaka på kopiering", async () => {
    const outcome = await shareOrCopy("t", PAGE, {
      share: async () => {
        throw new Error("NotAllowedError");
      },
      writeText: async () => undefined,
    });
    assert.equal(outcome, "copied");
  });

  test("varken delning eller urklipp", async () => {
    assert.equal(await shareOrCopy("t", PAGE, {}), "unavailable");
    assert.equal(
      await shareOrCopy("t", PAGE, {
        writeText: async () => {
          throw new Error("denied");
        },
      }),
      "unavailable",
    );
  });
});
