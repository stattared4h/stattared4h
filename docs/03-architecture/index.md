# Architecture

Architectural decisions are recorded here as **ADRs** (Architecture
Decision Records). Each ADR is one decision in one file. Decisions
already taken are not edited — if a decision changes, write a new
ADR that supersedes the old one. The old file stays so the reasoning
trail is preserved.

This matters because:

- The history of why we landed where we did is the most valuable
  piece of architectural documentation. Editing old ADRs erases it.
- Adding an ADR = creating a new file. No central architecture
  document grows unchecked, no shared file becomes a merge-conflict
  magnet.
- Each ADR is small enough to read in one screen. If a decision needs
  more, it is probably actually two decisions — split it.

> **Companion to requirements:** an ADR records *how* and *why*. A
> requirement records *what*. When a requirement needs a decision
> made before it can be implemented (framework choice, data shape,
> hosting target), write the ADR first and reference it from the
> requirement's Context section.

---

## Filename and ID

- The filename is `<slug>.md` — short, lowercase, hyphenated. The slug
  is the stable ID. Reference it from code as `<!-- adr: <slug> -->`
  and from other docs as `[adr:&nbsp;<slug>](path/to/<slug>.md)`.
- No numeric prefix. ADRs are not chronological; they are referential.
  Use git log or the `Date` field if you need ordering.
- Slugs are **never reused or renamed** after an ADR reaches
  `accepted`. To change a decision, write a new ADR with a different
  slug and set the old one's status to `superseded by <new-slug>`.

## File Format

Use [`_template.md`](_template.md) as the starting point. Every ADR
has these sections, in this order:

1. **Title** — `# adr: <slug> — Short decision title`
2. **Front matter block** — Status, Date, Deciders (optional)
3. **Context** — what forces are at play, what problem we're solving,
   what constraints apply
4. **Decision** — what we decided, in the imperative
5. **Consequences** — what follows from the decision, both positive
   and negative
6. **Alternatives considered** — what else we looked at and why we
   set those aside

If an ADR ever needs a seventh section, the decision is doing too
much — split it.

## Status Values

| Status | Meaning |
| ------ | ------- |
| `proposed` | Written and under discussion. Not yet binding. |
| `accepted` | The team has decided to follow this. Binding until superseded. |
| `superseded by <slug>` | Replaced by a newer ADR. File kept for the trail. |
| `rejected` | Considered and decided against. File kept so the reasoning survives. |

## When to Write an ADR

Write an ADR when:

- A choice constrains future code (framework, hosting, data shape).
- A choice is non-obvious enough that someone may revisit it in six
  months without remembering why.
- A choice was made between several real alternatives.

Do **not** write an ADR for routine implementation details — those
belong in code or, when they cross multiple files, in the relevant
requirement.

## Overview matrix

The matrix below is the equivalent of the per-module matrices in
`02-requirements/` — a small, scan-friendly view of every ADR and
its current status. ADRs are flat (no sub-modules) at this stage, so
one matrix covers them all. Split into module folders only if the
flat list ever grows past one screen.

| ADR | Status | Date |
| --- | ------ | ---- |

When an ADR file lands, add a row here in the same commit. When an
ADR's Status changes (typically `proposed` → `accepted` or
`accepted` → `superseded by <new-slug>`), update both the file and
this row. This is the only shared file in `03-architecture/`, and
it is small on purpose.

## Finding ADRs by status

The matrix above is the local view. For programmatic access, grep:

```bash
# everything still on the table
grep -l "Status: proposed" docs/03-architecture/*.md

# everything currently binding
grep -l "Status: accepted" docs/03-architecture/*.md
```
