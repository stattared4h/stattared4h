# adr: example-slug — Short decision title

> **Status:** proposed
> **Date:** YYYY-MM-DD
> **Deciders:** (optional — names or GitHub handles)

## Context

What forces are at play. What problem this decision is solving. What
constraints apply. What we already know from existing requirements
and earlier ADRs.

Keep this short — one or two paragraphs. The goal is to give a future
reader (human or AI) enough to understand why this decision was even
on the table, without re-deriving the whole project's history.

## Decision

What we decided. Imperative tense. One or a few sentences.

- **Good:** "We use Eleventy as the static site generator."
- **Bad:** "We will probably want to use Eleventy at some point."

If the decision needs a paragraph, write a paragraph. If it needs
more than that, the decision is probably actually two decisions —
split this ADR into two.

## Consequences

What follows from this decision. Both positive and negative. What
becomes easier; what becomes harder; what trade-offs we accept.

- We can write templates in Nunjucks, which most contributors already
  know.
- The site is restricted to Node-based tooling; switching to a Ruby
  or Python ecosystem later means a new ADR.
- Per-page front matter syntax is a hard dependency — content editors
  must learn it.

A reader six months from now should be able to use this section to
judge whether the decision is still serving us.

## Alternatives considered

- **Astro** — heavier runtime than we need; component model is
  overkill for a content-driven site of this size.
- **Plain Node + custom templating** — saves a dependency but adds
  weeks of build-tool maintenance for no real gain.
- **Hugo** — fast and proven, but the Go-template language is harder
  to onboard non-developers into than Nunjucks.

Each alternative gets one or two sentences. The point is not to argue
the alternatives down in detail — it is to record that they were
genuinely considered, so the team does not re-litigate them every six
months.
