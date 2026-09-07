/**
 * Markdown rendering (02-§8.12, 03-§6.6, 04-§9.12).
 *
 * Content pages write images as `![](img-…)`; the alt text comes from the image post, so
 * it is never repeated in the Markdown. Everything else about markdown-it is unchanged:
 * raw HTML stays off (04-§10.9).
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderMarkdown } from "../../source/ts/build/markdown.ts";

const renderImage = (id: string): string | null =>
  id === "img-a3f2c1d8b901" ? `<img src="/images/${id}-800.webp" alt="En get i Gethagen.">` : null;

test("an image id becomes the markup the resolver returns", () => {
  const html = renderMarkdown("Text.\n\n![](img-a3f2c1d8b901)\n", { renderImage });
  assert.match(html, /<img src="\/images\/img-a3f2c1d8b901-800\.webp" alt="En get i Gethagen\.">/);
  assert.doesNotMatch(html, /src="img-/);
});

test("an image inside a paragraph is replaced in place", () => {
  const html = renderMarkdown("Se ![](img-a3f2c1d8b901) här.", { renderImage });
  assert.match(html, /Se <img [^>]*> här\./);
});

test("an unknown id renders a placeholder instead of a broken image (02-§8.6)", () => {
  const html = renderMarkdown("![](img-ffffffffffff)", { renderImage });
  assert.match(html, /class="image-placeholder"/);
  assert.doesNotMatch(html, /<img/);
});

test("an address that is not an image id renders a placeholder", () => {
  const html = renderMarkdown("![En get](foto.jpg)", { renderImage });
  assert.match(html, /class="image-placeholder"/);
  assert.doesNotMatch(html, /foto\.jpg/);
});

test("without a resolver an image renders a placeholder and nothing throws", () => {
  const html = renderMarkdown("![](img-a3f2c1d8b901)");
  assert.match(html, /class="image-placeholder"/);
});

test("text without images is unchanged by the image rule", () => {
  assert.equal(renderMarkdown("# Rubrik\n\nEn **text**.\n", { renderImage }), renderMarkdown("# Rubrik\n\nEn **text**.\n"));
});

test("raw HTML is still escaped", () => {
  assert.match(renderMarkdown("<script>alert(1)</script>", { renderImage }), /&lt;script&gt;/);
});
