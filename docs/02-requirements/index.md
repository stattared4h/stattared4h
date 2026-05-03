# Requirements

Each requirement lives in its **own file** in this directory. The
filename is the slug, the slug is the stable ID, and the file is
self-contained: requirement, status, verification, and implementation
references all live together.

This matters because:

- Adding a new requirement = creating a new file. No central index to
  update, no shared matrix to merge.
- Two parallel branches almost never touch the same file, so merge
  conflicts in the docs become rare.
- Each file is small enough to read in one screen. If a file outgrows
  one screen, split it before merging.
- Status, tests, and implementation are next to the requirement they
  belong to — there is no second place where they could disagree.

> **Writing style:** describe the **desired state**, not "changes" or
> "improvements". A reader who has never seen the codebase should
> understand the requirement without needing to know what existed
> before. See [CLAUDE.md §5](../../CLAUDE.md) for the full rule and
> good/bad examples.

---

## Filename and ID

- The filename is `<slug>.md` — short, lowercase, hyphenated. The slug
  is the stable ID. Reference it from code as `<!-- req: <slug> -->`
  and from other docs as `[req:&nbsp;<slug>](path/to/<slug>.md)`.
- No numeric prefix. Numbers force allocation, allocation forces
  collisions, collisions force renumbering. Slugs avoid the whole
  problem.
- Slugs are **never reused or renamed** after a requirement reaches
  `done`. If a requirement is replaced, leave the old file with status
  `superseded by <new-slug>` and create a new file.
- A slug is allowed to be renamed only while the requirement is still
  `proposed` — i.e. before the first PR mentioning the slug merges.

## File Format

Use [`_template.md`](_template.md) as the starting point. Every
requirement file has these sections, in this order:

1. **Title** — `# req: <slug> — Short human-readable title`
2. **Front matter block** — Status, Date, Owner (optional)
3. **Context** — the only place where "why", "previously", or
   "the problem is" language belongs
4. **Requirement** — pure desired-state declarations
5. **Verification** — the test(s) or manual checkpoint(s)
6. **Implementation** — list of files that fulfil the requirement

If a requirement file ever needs a seventh section, that's a signal
the requirement is doing too much — split it.

## Status Values

| Status | Meaning |
| ------ | ------- |
| `proposed` | Written but not yet built. Design may still change. |
| `accepted` | Design is settled; implementation is in progress or planned next. |
| `done` | Implemented, verified (test or manual checkpoint), and live. |
| `rejected` | Decided not to build. File is kept so the reasoning survives. |
| `superseded by <slug>` | Replaced by a newer requirement. |

A requirement only reaches `done` after Phase 5 of the feature
lifecycle in [CLAUDE.md §7](../../CLAUDE.md).

## Finding Requirements by Status

There is no central matrix. Grep instead:

```bash
# all unfinished requirements
grep -l "Status: proposed\|Status: accepted" docs/02-requirements/*.md

# everything done
grep -l "Status: done" docs/02-requirements/*.md

# everything that touches the contact form
grep -l "kontakt\|contact" docs/02-requirements/*.md
```

If a real reporting need emerges later, generate the report from the
files — never duplicate state into a second place.

## Audience

*To be written.* One or two paragraphs naming the actual people the
site serves and what they need from it. Everything in this directory
is in service of that audience.
