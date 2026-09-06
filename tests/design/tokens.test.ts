/**
 * 02-§9.9: tokens.css matches the palette decided in docs/05-design/index.md §2 and the
 * type scale in §3, and the contrast pairs in 05-§2.13 pass WCAG AA.
 *
 * The test reads the design document itself, so the decision and the delivery cannot
 * drift apart without a test going red (05-§7.4).
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";

const ROOT = path.resolve(import.meta.dirname, "..", "..");

async function readTokens(): Promise<Map<string, string>> {
  const css = await readFile(path.join(ROOT, "source/assets/css/tokens.css"), "utf8");
  const tokens = new Map<string, string>();
  for (const match of css.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    // The desktop media query redefines heading sizes; keep the first (mobile) value.
    if (!tokens.has(match[1])) tokens.set(match[1], match[2].trim());
  }
  return tokens;
}

/** Reads the hex value for a `05-§2.N` row in the palette table. */
async function readPalette(): Promise<Map<string, string>> {
  const doc = await readFile(path.join(ROOT, "docs/05-design/index.md"), "utf8");
  const palette = new Map<string, string>();
  for (const match of doc.matchAll(/^\| `(05-§2\.\d+)` \| [^|]+ \| `(#[0-9a-f]{6})` \|/gm)) {
    palette.set(match[1], match[2]);
  }
  return palette;
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16)) as [number, number, number];
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.1 contrast ratio between two hex colours. */
export function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const PALETTE_TOKENS: Record<string, string> = {
  "05-§2.1": "--color-green",
  "05-§2.2": "--color-green-deep",
  "05-§2.3": "--color-green-pale",
  "05-§2.4": "--color-page",
  "05-§2.5": "--color-surface",
  "05-§2.6": "--color-ink",
  "05-§2.7": "--color-ink-soft",
  "05-§2.8": "--color-border",
  "05-§2.9": "--color-sun",
  "05-§2.10": "--color-sun-ink",
  "05-§2.11": "--color-danger",
};

test("tokens.css levererar paletten i 05-§2", async () => {
  const tokens = await readTokens();
  const palette = await readPalette();
  // Every palette row is a token, except the logo green (05-§2.19), which must not be.
  assert.equal(palette.size, Object.keys(PALETTE_TOKENS).length + 1, "paletttabellen i 05-§2 har oväntat antal rader");
  for (const [id, token] of Object.entries(PALETTE_TOKENS)) {
    assert.equal(tokens.get(token), palette.get(id), `${token} ska vara ${palette.get(id)} enligt ${id}`);
  }
  assert.equal(tokens.get("--color-backdrop"), "rgb(64 64 64 / 60%)", "05-§2.20");
  const logoGreen = palette.get("05-§2.19");
  assert.ok(logoGreen, "05-§2.19 saknas i paletttabellen");
  assert.ok([...tokens.values()].every((value) => value !== logoGreen), "05-§2.19: logotypgrön får inte vara en token");
});

test("tokens.css levererar typografiskalan i 05-§3 och spacingrytmen i 05-§4", async () => {
  const tokens = await readTokens();
  assert.equal(tokens.get("--font-size-h1"), "30px", "05-§3.3");
  assert.equal(tokens.get("--font-size-h2"), "24px", "05-§3.4");
  assert.equal(tokens.get("--font-size-h3"), "20px", "05-§3.5");
  assert.equal(tokens.get("--font-size-body"), "17px", "05-§3.6");
  assert.equal(tokens.get("--font-size-small"), "15px", "05-§3.7");
  assert.equal(tokens.get("--line-height-body"), "1.6", "05-§3.11");

  const spacing: Record<string, string> = {
    "--space-xs": "8px",
    "--space-sm": "16px",
    "--space-md": "24px",
    "--space-lg": "40px",
    "--space-xl": "64px",
    "--space-xxl": "96px",
  };
  for (const [token, value] of Object.entries(spacing)) {
    assert.equal(tokens.get(token), value, `${token} (05-§4)`);
    assert.equal(parseInt(value, 10) % 8, 0, "05-§4.4: multiplar av 8px");
  }
  assert.equal(tokens.get("--container-wide"), "1200px", "05-§4.1");
  assert.equal(tokens.get("--container-narrow"), "680px", "05-§4.2");
  assert.equal(tokens.get("--tap-target-min"), "44px", "05-§4.15");
});

test("kontrastparen i 05-§2.13 klarar WCAG AA", async () => {
  const t = await readTokens();
  const get = (name: string) => t.get(name)!;
  const AA = 4.5;

  // 05-§2.15: white text on green surfaces.
  assert.ok(contrast(get("--color-surface"), get("--color-green")) >= AA, "vit på grön");
  assert.ok(contrast(get("--color-surface"), get("--color-green-deep")) >= AA, "vit på djupgrön");
  // 05-§2.14: green text is always deep green.
  assert.ok(contrast(get("--color-green-deep"), get("--color-surface")) >= AA, "djupgrön på vit");
  assert.ok(contrast(get("--color-green-deep"), get("--color-page")) >= AA, "djupgrön på sidbotten");
  assert.ok(contrast(get("--color-green-deep"), get("--color-green-pale")) >= AA, "djupgrön på ljusgrön");
  assert.ok(contrast(get("--color-green"), get("--color-page")) < AA, "05-§2.14: grön är en ytfärg, inte textfärg");
  // 05-§2.16: body and meta text.
  assert.ok(contrast(get("--color-ink"), get("--color-surface")) >= AA, "bläck på vit");
  assert.ok(contrast(get("--color-ink"), get("--color-page")) >= AA, "bläck på sidbotten");
  assert.ok(contrast(get("--color-ink-soft"), get("--color-surface")) >= AA, "dämpat bläck på vit");
  assert.ok(contrast(get("--color-ink-soft"), get("--color-page")) >= AA, "dämpat bläck på sidbotten");
  // 05-§2.17: the sun tone never carries white text; ink and sun-ink do.
  assert.ok(contrast(get("--color-surface"), get("--color-sun")) < AA, "vit på sol underkänns");
  assert.ok(contrast(get("--color-ink"), get("--color-sun")) >= AA, "bläck på sol");
  assert.ok(contrast(get("--color-sun-ink"), get("--color-surface")) >= AA, "solbläck på vit");
  // Errors.
  assert.ok(contrast(get("--color-danger"), get("--color-surface")) >= AA, "varning på vit");
  assert.ok(contrast(get("--color-surface"), get("--color-danger")) >= AA, "vit på varning");
});
