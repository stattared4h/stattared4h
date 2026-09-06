/** Minimal static server for local development. No dependencies, no configuration. */

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.join(path.resolve(import.meta.dirname, ".."), "public");
const PORT = Number(process.env.PORT ?? 8080);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

createServer(async (request, response) => {
  const url = new URL(request.url, `http://localhost:${PORT}`);
  const relative = url.pathname.endsWith("/") ? `${url.pathname}index.html` : url.pathname;

  // Resolve inside ROOT and refuse anything that escapes it.
  const file = path.join(ROOT, path.normalize(relative));
  if (!file.startsWith(ROOT)) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  try {
    const body = await readFile(file);
    response.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("404");
  }
}).listen(PORT, () => console.log(`http://localhost:${PORT}/`));
