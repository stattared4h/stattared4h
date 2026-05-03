# req: example-slug — Short human-readable title

> **Status:** proposed
> **Date:** YYYY-MM-DD
> **Owner:** (optional — name or GitHub handle)

## Context

Why this requirement exists. Background, motivation, what failure
mode it prevents. **This is the only section where "we used to…",
"the problem is…", or "previously…" language belongs.** Keep it
short — one or two paragraphs. If the context needs more than that,
the underlying decision probably belongs in an ADR
(`docs/03-architecture/`), not here.

## Requirement

The desired state. One or a few sentences. Phrased as a fact about
how the system works.

- **Good:** "The contact form sends a confirmation email to the
  address the user entered within 60 seconds of submission."
- **Bad:** "We add an email confirmation step to the contact form."

If you need bullet points, each bullet is its own desired-state
declaration:

- The form rejects submissions where the email field is empty.
- The form rejects submissions where the email field does not contain
  an `@` character.
- The form preserves the user's input if validation fails.

If you find yourself writing more than ~5 bullets, you almost
certainly have more than one requirement — split the file.

## Verification

How we know it works. Either an automated test or a concrete manual
checkpoint. Never both for the same behaviour — pick the one that
actually catches regressions.

- **Test:** `tests/contact-form.test.js::sends-confirmation-email`
- **Manual checkpoint:** open `/kontakt`, submit the form with a real
  email address, confirm a copy lands in the inbox within 60 seconds.

A manual checkpoint is a contract that someone (or some pass of
Phase 6) will perform that exact step before the requirement is
marked `done`.

## Implementation

Files that fulfil this requirement. Filled in as the work lands.
Until then, leave a single `TBD` line.

- `source/forms/contact.js`
- `source/email/transport.js`

Each implementation file should carry an inline comment marker
referencing this requirement: `<!-- req: example-slug -->` (HTML/MD)
or `// req: example-slug` (JS/CSS). Markers make it possible to find,
from any line of code, which desired-state declaration it serves.
