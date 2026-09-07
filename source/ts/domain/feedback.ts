/**
 * The address of a pre-filled GitHub issue for feedback (02-§10.16, 03-§10.3).
 *
 * The site never sends anything itself. It builds an address to GitHub's "new issue"
 * page with the template, title and body as query parameters, and the visitor opens it
 * in their own browser under their own account (02-§10.20, ADR 0010). This module is
 * pure — no DOM, no fetch — so every rule about the address is tested in Node; the
 * dialog in source/ts/ui/feedback.ts only collects the input.
 */

export const CATEGORIES = ["Fel", "Förslag", "Övrigt"] as const;
export type Category = (typeof CATEGORIES)[number];

/** The limits the dialog's fields enforce with `maxlength`; the builder enforces them again. */
export const TITLE_MAX_LENGTH = 200;
export const BODY_MAX_LENGTH = 2000;

export const ISSUE_TEMPLATE = "feedback.md";
export const ISSUE_LABEL = "feedback";

/** What the visitor's browser knows about the moment the feedback was written. */
export interface FeedbackMeta {
  /** The version from the build, or null when the build had none (02-§10.25). */
  version: string | null;
  /** The address of the page the dialog was opened on. */
  page: string;
  viewport: { width: number; height: number };
  /** The moment; printed as ISO 8601. */
  time: Date;
  userAgent: string;
}

export interface FeedbackInput {
  /** The repository's address on GitHub, `https://github.com/<owner>/<name>`, with or without trailing slash. */
  repo: string;
  category: Category;
  title: string;
  body: string;
  meta: FeedbackMeta;
}

/** "[Feedback] Fel: Kartan laddar inte" — the title the template's prefix expects. */
export function buildFeedbackTitle(category: Category, title: string): string {
  return `[Feedback] ${category}: ${clip(title.trim(), TITLE_MAX_LENGTH)}`;
}

/** One line with everything that helps reproduce a problem, in the order 02-§10.16 lists it. */
export function formatMeta(meta: FeedbackMeta): string {
  return [
    `Version ${meta.version ?? "okänd"}`,
    `sida ${meta.page}`,
    `fönster ${meta.viewport.width}×${meta.viewport.height}`,
    `tidpunkt ${meta.time.toISOString()}`,
    `webbläsare ${meta.userAgent}`,
  ].join(", ");
}

/** The description first, then a rule and the metadata line, so the visitor's words come before the machine's. */
export function buildFeedbackBody(body: string, meta: FeedbackMeta): string {
  return `${clip(body.trim(), BODY_MAX_LENGTH)}\n\n---\n${formatMeta(meta)}\n`;
}

/** The full address to open in a new tab. Every parameter is URL-encoded by URLSearchParams. */
export function buildFeedbackUrl(input: FeedbackInput): string {
  const repo = input.repo.trim().replace(/\/+$/, "");
  const params = new URLSearchParams({
    template: ISSUE_TEMPLATE,
    labels: ISSUE_LABEL,
    title: buildFeedbackTitle(input.category, input.title),
    body: buildFeedbackBody(input.body, input.meta),
  });
  return `${repo}/issues/new?${params.toString()}`;
}

/** True when both fields have something other than whitespace — the condition for "Skicka" (02-§10.16). */
export function isFeedbackComplete(title: string, body: string): boolean {
  return title.trim().length > 0 && body.trim().length > 0;
}

function clip(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) : text;
}
