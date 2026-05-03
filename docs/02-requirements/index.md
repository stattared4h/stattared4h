# Requirements

Each requirement lives in its **own file**, grouped into module
folders, with a small overview matrix at the top of each module.

```text
docs/02-requirements/
├── index.md              ← this file (convention + module list)
├── _template.md          ← template for a single requirement
├── _module-template.md   ← template for a new module's index.md
└── <module>/
    ├── index.md          ← module description + overview matrix
    └── <slug>.md         ← one requirement per file
```

The **per-file** model means adding a new requirement creates a new
file — existing requirement files are never touched, so two parallel
branches almost never collide. The **per-module overview matrix**
gives a scan-friendly view of "what does this module promise and
where does each promise stand right now" without recreating a single
giant matrix that every branch fights over.

> **Writing style:** describe the **desired state**, not "changes" or
> "improvements". A reader who has never seen the codebase should
> understand the requirement without needing to know what existed
> before. See [CLAUDE.md §5](../../CLAUDE.md) for the full rule and
> good/bad examples.

---

## Modules

A module is a logical area of the system that owns a coherent set of
requirements. New modules get their own folder and an `index.md`
based on [`_module-template.md`](_module-template.md).

*The list below grows as the project decides what it is. Each entry
is one line — a slug-link and a short description. No status here;
that lives in the module's own index.*

| Module | What it owns |
| ------ | ------------ |

When you add a new module folder, add one row here. When you add a
new requirement to an existing module, you do **not** touch this
file — only the module's own index.

## Requirement filename and ID

- The filename is `<slug>.md` — short, lowercase, hyphenated. The slug
  is the stable ID and it is **globally unique across all modules**
  (a flat namespace makes inline markers, grep, and cross-module
  references simple).
- Reference a requirement from code as `<!-- req: <slug> -->` (HTML/MD)
  or `// req: <slug>` (JS/CSS). From other docs: link to the file.
- No numeric prefix. Numbers force allocation, allocation forces
  collisions, collisions force renumbering. Slugs avoid the problem.
- Slugs are **never reused or renamed** after the file's PR has
  merged. To replace a requirement, write a new file with a new slug
  and set the old one's status to `superseded by <new-slug>`.
- A slug can be renamed only while the requirement is still
  `proposed` (before the first PR mentioning it merges).

## Requirement file format

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

## Module overview matrix

Each module's `index.md` carries a small matrix with one row per
requirement in the module. The matrix has exactly three columns and
nothing else:

| Requirement | Status | Verification |
| ----------- | ------ | ------------ |
| [contact-form-submit](./contact-form-submit.md) | done | test |
| [contact-form-validation](./contact-form-validation.md) | accepted | test |
| [contact-form-rate-limit](./contact-form-rate-limit.md) | proposed | — |

Why this is small enough to stay healthy:

- It only lists requirements in **one** module — usually a handful,
  rarely more than a dozen.
- It carries only fields that change rarely (the slug never changes
  after merge; verification mode rarely changes).
- The single field that *does* change (Status) is updated in the
  same commit that updates the corresponding requirement file's
  Status — so the two are kept in sync by Phase 5 of the lifecycle
  (see [CLAUDE.md §7](../../CLAUDE.md)), not by polite hope.

If you add a new requirement to a module, you touch two files: the
new `<slug>.md` and the module's `index.md`. That is the only shared
file for that module's work — and it is small.

## Status values

| Status | Meaning |
| ------ | ------- |
| `proposed` | Written but not yet built. Design may still change. |
| `accepted` | Design is settled; implementation is in progress or planned next. |
| `done` | Implemented, verified (test or manual checkpoint), and live. |
| `rejected` | Decided not to build. File is kept so the reasoning survives. |
| `superseded by <slug>` | Replaced by a newer requirement. |

A requirement only reaches `done` after Phase 5 of the feature
lifecycle in [CLAUDE.md §7](../../CLAUDE.md).

## Verification values (matrix only)

The `Verification` column is a one-word summary of what the
requirement file's Verification section actually contains:

| Value | Meaning |
| ----- | ------- |
| `test` | Covered by an automated test. |
| `manual` | Covered by a documented manual checkpoint. |
| `—` | Not yet decided (only acceptable when status is `proposed`). |

The full path to the test or the exact manual checkpoint lives in
the requirement file, not in the matrix. The matrix only tells you
*which kind* of verification the requirement uses — for the full
detail, open the file.

## Finding requirements by status

For a system-wide view (across all modules), grep:

```bash
# all unfinished requirements
grep -lE "Status: proposed|Status: accepted" docs/02-requirements/**/*.md

# everything done
grep -l "Status: done" docs/02-requirements/**/*.md

# everything that touches the contact form
grep -l "kontakt\|contact" docs/02-requirements/**/*.md
```

The per-module matrix gives the local view; grep gives the global
view. Neither duplicates state into a place that could go stale on
its own — both read directly from the requirement files.

## Audience

*To be written.* One or two paragraphs naming the actual people the
site serves and what they need from it. Everything in this directory
is in service of that audience.
