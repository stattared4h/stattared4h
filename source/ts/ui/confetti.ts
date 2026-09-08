/**
 * Confetti for the games (02-§12.10–12.11, ADR 0024). A canvas over the whole viewport
 * that ignores pointer events, filled with falling pieces in the site's own colours and
 * removed when the last piece has left the screen. Nothing is imported: the site ships
 * no dependency to the visitor (02-§9.5), and thirty lines of physics is all it takes.
 *
 * The colours are read from the CSS tokens at run time, so a change in tokens.css is a
 * change here too and no colour is written in code (05-§7.4). With
 * `prefers-reduced-motion: reduce` nothing is drawn: the message on the page carries the
 * celebration on its own.
 */

export type BurstSize = "small" | "big";

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  colour: string;
  angle: number;
  spin: number;
}

const GRAVITY = 0.12;
const DRAG = 0.985;
const COUNTS: Record<BurstSize, number> = { small: 60, big: 220 };
const TOKENS = ["--color-sun", "--color-green", "--color-green-pale", "--color-green-deep"];

export function burst(size: BurstSize): void {
  if (typeof document === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.className = "confetti";
  canvas.setAttribute("aria-hidden", "true");
  const context = canvas.getContext("2d");
  if (context === null) return;
  document.body.append(canvas);

  const scale = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = Math.floor(width * scale);
  canvas.height = Math.floor(height * scale);
  context.scale(scale, scale);

  const styles = getComputedStyle(document.documentElement);
  const colours = TOKENS.map((token) => styles.getPropertyValue(token).trim()).filter((value) => value !== "");
  const pieces = makePieces(COUNTS[size], width, height, colours);

  let last = performance.now();
  const frame = (now: number): void => {
    // Time-based so a slow phone drops frames rather than slowing the fall.
    const step = Math.min(2, (now - last) / 16.7);
    last = now;
    context.clearRect(0, 0, width, height);
    let alive = 0;
    for (const piece of pieces) {
      piece.vy += GRAVITY * step;
      piece.vx *= DRAG;
      piece.x += piece.vx * step;
      piece.y += piece.vy * step;
      piece.angle += piece.spin * step;
      if (piece.y > height + piece.size) continue;
      alive++;
      context.save();
      context.translate(piece.x, piece.y);
      context.rotate(piece.angle);
      context.fillStyle = piece.colour;
      context.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2);
      context.restore();
    }
    if (alive > 0) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}

/** Pieces shot upwards from just below the middle of the screen, spreading sideways. */
function makePieces(count: number, width: number, height: number, colours: readonly string[]): Piece[] {
  const pieces: Piece[] = [];
  for (let i = 0; i < count; i++) {
    const direction = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
    const speed = 6 + Math.random() * 9;
    pieces.push({
      x: width / 2 + (Math.random() - 0.5) * width * 0.3,
      y: height * 0.6,
      vx: Math.cos(direction) * speed,
      vy: Math.sin(direction) * speed,
      size: 6 + Math.random() * 8,
      colour: colours[i % colours.length] ?? "currentColor",
      angle: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.3,
    });
  }
  return pieces;
}
