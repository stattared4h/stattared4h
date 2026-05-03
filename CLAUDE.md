# CLAUDE.md – Stättared 4H

This document defines how work is done on this project — the workflow,
the writing style for requirements, the quality bar, and the principles
that override any particular implementation choice.

The project is at the **starting state**. Architecture, technology,
and domain rules are not locked in yet. Sections 1–4 below are
deliberately short; they grow as the project decides what it is. The
workflow and style rules (Sections 5–9) are locked in from day one.

If a rule here ever conflicts with a more specific rule in `/docs/`,
the doc wins — `CLAUDE.md` summarises principles, `/docs/` defines
detail.

---

# 0. Reference Documentation

Before writing any code, content, or data, read the relevant docs in
`/docs/`. As the project grows, add new docs here so future contributors
(human and AI) know where to look first.

| Path | What lives there |
| ---- | ---------------- |
| `docs/01-CONTRIBUTORS.md` | Contribution guidelines, git workflow, setup, linting |
| `docs/02-requirements/` | One file per requirement (`<slug>.md`); `index.md` explains the convention |
| `docs/03-architecture/` | One file per architectural decision (ADR, `<slug>.md`); `index.md` explains the convention |

There is **no central requirements matrix** and **no central
architecture document**. Each requirement and each decision lives in
its own file so adding new ones never touches existing ones — the
opposite of the conflict-prone pattern where one big shared file
records everything. See [§5](#5-requirements-and-architecture-documentation)
for the why.

When new domains emerge (data contract, design tokens, environments,
release process, operations), give them their own numbered doc or
their own per-file directory and link it here. Do not let knowledge
accumulate only in commit messages or chat — if it matters tomorrow,
it belongs in `/docs/`.

---

# 1. Core Principles

- Clarity over cleverness.
- Content-first: the project exists to serve real people, not to
  showcase technology.
- Maintainable by non-developers wherever practical.
- Fast loading, small footprint.
- Prefer standard, well-established tooling over bespoke systems.

Language:

- The site is in Swedish. All user-facing text — labels, headings,
  descriptions, error messages, confirmations — must be in Swedish.
- Internal documentation (`CLAUDE.md`, `/docs/`) is in English so the
  same patterns travel between projects and AI tools without
  translation drift.

---

# 2. Architecture Constraints

Locked in from day one:

- Source of truth for content lives in version-controlled files (no
  out-of-band CMS that bypasses review).
- No client-side framework (no React, Vue, Svelte) unless a future
  requirement explicitly justifies one and the trade-off is documented
  in `docs/03-architecture/`.
- No backend database unless a requirement explicitly justifies one.
- Reuse layout components — never duplicate markup between pages.

Open for now (decide before first feature merges):

- Static site generator vs. server-rendered.
- Markdown vs. structured data for primary content.
- Hosting target.

When these decisions are made, record them in
`docs/03-architecture/` with the reasoning, not just the outcome.

---

# 3. Content Model

To be defined as the project takes shape. Until then:

- Treat every new piece of content as a candidate for being
  data-driven (YAML/JSON) rather than hardcoded into a template.
- Keep page layout and page content in separate files.

---

# 4. Quality Requirements (From Day One)

These apply before any feature is considered "done":

- Linting is configured for every file type the project introduces.
  Markdown is linted from day one via `markdownlint`
  (`.markdownlint.json`, `npm run lint:md`); add HTML, CSS, JS, YAML
  configs as those file types appear. Build fails if lint fails.
- Tests cover every testable requirement. Untestable requirements
  (visual, manual UX) are recorded as manual checkpoints in the
  requirement file's Verification section with a concrete, actionable
  step.
- Build runs locally **and** in GitHub Actions. CI fails if the build
  fails.
- Deployment happens only after CI is green.

---

# 5. Requirements and Architecture Documentation

Documentation is **modular**. One thing per file. Each requirement
gets its own file in `docs/02-requirements/`. Each architectural
decision gets its own file in `docs/03-architecture/` (ADR pattern).
There is no central matrix and no central architecture document.

## Why per-file

A central file that records every requirement (or every decision)
becomes a merge-conflict magnet the moment more than one branch is
in flight. Adding a new entry means editing a file that every other
branch is also editing. This is the same anti-pattern as a "god
class" in code — many concerns crammed into one place because
nobody decided to split them.

The per-file model fixes this:

- Adding a new requirement = creating a new file. Existing files are
  untouched.
- Status, tests, and implementation references live in the
  requirement file itself, so there is no second place that could
  disagree with the first.
- Each file is small enough to read in one screen. If a file outgrows
  one screen, it is doing too much — split it.
- The reasoning trail behind every decision is preserved because old
  ADRs are never edited; superseding decisions get a new file.

## Filename = ID

Filenames are slugs (`contact-form.md`, `static-site-generator.md`).
The slug **is** the stable ID. No numeric prefix, because numbers
force allocation, allocation forces collisions, and collisions force
renumbering.

Reference a requirement from code as `<!-- req: <slug> -->` (or
`// req: <slug>` in JS/CSS). Reference an ADR the same way with
`adr:`. From other markdown, link to the file path.

Slugs are never reused or renamed once the file's PR has merged. To
replace a requirement or a decision, write a new file and set the
old one's status to `superseded by <new-slug>`.

## Writing style: desired state, not transitions

Write each requirement as a standalone fact about how the system
works. A reader who has never seen the codebase should understand
the requirement without needing to know what existed before.

- **Bad:** "The cache version must be incremented to v4." / "The
  hero banner must be removed from the front page."
- **Good:** "The service worker cache name is `stattared-v4`." /
  "The front page does not contain a hero banner."

Avoid words like *changed, updated, replaced, removed, incremented,
added, new*. These describe transitions, not desired state.

The **Context** section at the top of each file is the only place
where background and motivation belong. Everything else is pure
desired-state declaration (for requirements) or imperative decision
text (for ADRs).

## Modules and overview matrices

A purely flat directory of requirement files would scale poorly —
forty unrelated requirements in one folder is no easier to navigate
than a forty-section file. So requirements are grouped into **module
folders** (`docs/02-requirements/<module>/`), each with its own
small overview matrix in `index.md`.

The matrix has three columns — slug, status, verification — and
nothing else. It is the equivalent of a class summary view in an
IDE: just enough to scan, never the source of truth. The
requirement file itself is the source of truth; the matrix only
mirrors the slug and the status.

This compromise keeps three properties at once:

- **Per-file primary storage** — adding a requirement creates one new
  file; existing requirement files are untouched.
- **Per-module overview** — anyone looking at a module sees the full
  list of its requirements and their statuses on one screen.
- **Tiny shared surface** — the only file two parallel branches in
  the same module both touch is the module's `index.md`, which has
  one short row per requirement. Conflicts are rare and trivial when
  they happen.

The architecture directory follows the same pattern with one
overview matrix at its top level (ADRs are not split into
sub-modules at this scale).

## Templates and conventions

Detailed file format, status values, and section structure live in
the convention guides — not duplicated here:

- [`docs/02-requirements/index.md`](../docs/02-requirements/index.md),
  [`docs/02-requirements/_template.md`](../docs/02-requirements/_template.md),
  and [`docs/02-requirements/_module-template.md`](../docs/02-requirements/_module-template.md)
- [`docs/03-architecture/index.md`](../docs/03-architecture/index.md)
  and [`docs/03-architecture/_template.md`](../docs/03-architecture/_template.md)

When the conventions need to change, change them there and link
from here — do not let the same rule grow two homes.

---

# 6. Git Workflow

- Never push directly to `main`.
- At the start of every session — before writing any code or making
  any changes — run:

  ```bash
  git checkout main
  git pull
  git checkout -b branch-name
  ```

- Choose a descriptive branch name (e.g. `fix/footer-link`,
  `feature/contact-form`, `docs/add-design-doc`). When the task comes
  from a GitHub Issue, include the issue number (e.g. `feat/42-contact-form`).
- After a branch has been merged and the merge has been pulled back via
  `main`, delete the local branch.

---

# 7. Feature Development Lifecycle

When implementing any new feature or significant change, follow these
phases in order. Do not skip phases. Each phase ends with a commit (or
explicitly notes that no commit is needed).

## Parallel-work rebase rule

The per-file documentation model in [§5](#5-requirements-and-architecture-documentation)
makes most parallel work conflict-free: two branches that each add a
new requirement file or a new ADR don't collide. The remaining
conflict surface is small but real — `CLAUDE.md`, the convention
guides under `docs/`, and any actual code file that two branches
both touch.

Before editing one of those genuinely shared files, rebase on the
latest `main`:

```bash
git fetch origin main
git rebase origin/main
```

This applies throughout all phases — not only at Phase 7. The cost
of rebasing when `main` has not moved is zero; the cost of
discovering conflicts late is high.

## Phase 0 — Alignment

Before writing requirements, discuss the request. Applies to all
prompts — bugs, new features, refactors, data changes, documentation.
The user is not always right and should be told so when relevant.

**GitHub Issue intake:**

When the task is a GitHub Issue reference (e.g. "hämta issue #42"):
fetch the issue with `gh issue view <number>`, read it, and treat its
content as the request to align on. The rest of Phase 0 applies as
usual.

**Understand and challenge the request:**

- Read the prompt carefully. Identify anything unclear, ambiguous, or
  potentially wrong.
- Check whether the request conflicts with existing requirements,
  architecture decisions, or the principles above.
- Propose improvements or alternatives if you see a better approach.
- Raise technical concerns.

**Assess the size of the work:**

- If the request is large enough that it risks running out of context,
  producing a rushed result, or spanning too many concerns at once —
  say so explicitly.
- In that case, do not start implementing. Decompose the request into
  a numbered list of self-contained work packages, write a
  ready-to-use prompt for each one, and stop.
- The user can then run each prompt as a separate session in the
  correct order.

**Agree before proceeding:**

- Agree on scope and approach before writing any requirements.
- This phase does not end with a commit. It ends with mutual
  understanding.
- **Even when the fix seems obvious** — a one-liner, a typo, a clear
  bug — always pause to confirm: restate the problem, the proposed
  fix, and any trade-offs in one or two sentences. A misread prompt
  is harder to undo than a skipped step.

**Issue comment (when task comes from a GitHub Issue):**

After alignment is reached, post a comment on the issue summarising
the agreed solution from the user's perspective — not the technical
approach. Use `gh issue comment <number> --body "..."`.

Do not rubber-stamp prompts. If something seems off, say so. If
something is too big, split it.

## Phase 1 — Requirements

- Pick the module folder under `docs/02-requirements/` that the
  requirement belongs in. If none fits, create a new module folder
  using
  [`_module-template.md`](../docs/02-requirements/_module-template.md)
  and add it to the module list in
  [`02-requirements/index.md`](../docs/02-requirements/index.md).
- Create one new requirement file per requirement under that module,
  using
  [`_template.md`](../docs/02-requirements/_template.md). Pick a
  short, globally-unique slug (`contact-form-validation.md`). Slug =
  stable ID.
- Status starts as `proposed`. Verification and Implementation may
  be `TBD` at this stage.
- Add a row to the module's `index.md` matrix in the same commit
  (slug link, status, verification — `—` while it's still TBD).
- Commit per requirement when practical: `docs: req: <slug>`. A
  bundle commit is fine when several requirements are tightly
  related.

## Phase 2 — Architecture Decisions

- If implementing a requirement requires a non-obvious or binding
  technical choice (framework, hosting, data shape, schema), write
  an ADR in `docs/03-architecture/` using
  [`_template.md`](../docs/03-architecture/_template.md). Reference
  the ADR from the requirement's Context section. Add a row to the
  ADR overview matrix in
  [`03-architecture/index.md`](../docs/03-architecture/index.md) in
  the same commit.
- If no new decision is needed (the existing ADRs already cover the
  ground), this phase has no commit.
- Once the design is settled, set the requirement file's status to
  `accepted` and update the same row in the module's overview
  matrix.
- Commit (when an ADR is added): `docs: adr: <slug>`

## Phase 3 — Tests

- Write tests for each testable requirement and link them in the
  requirement file's Verification section.
- If a requirement cannot be tested in code (visual, UX, or
  inherently manual), record a concrete, actionable manual checkpoint
  in the same Verification section instead — never both for the same
  behaviour.
- Browser-only behaviour (DOM, `fetch`, `localStorage`, CSS layout)
  cannot be unit-tested in Node. These are manual checkpoints by
  default.
- Commit: `test: req: <slug>`

## Phase 4 — Implementation

- Write code to make all tests pass.
- Add an inline marker in each touched implementation file:
  `<!-- req: <slug> -->` or `// req: <slug>`.
- Update the requirement file's Implementation section to list the
  files that fulfil it.
- Commit: `feat: req: <slug>`

**Wait for user review of the implementation result:**

After the implementation commit, stop and let the user see the result
**running locally** before moving on.

- The branch must be checked out locally and the dev server running so
  the user can interact with the change, not just read a summary.
- For UI changes: give the exact URLs to open and any steps to reach
  the state that was changed.
- For backend/API changes: give the exact `curl` command or test
  invocation the user can run.
- For doc-only changes: point to the file paths and line ranges, and
  the rendered preview if one exists.
- Do not start Phase 5 until the user has looked at the running result
  and signalled the direction is right.

If Phase 4 went in the wrong direction, every minute spent on
traceability, extra review passes, and PR creation is wasted. A short
pause here is cheap; rework after Phase 8 is not.

## Phase 5 — Status Update

- Verify each requirement file's Verification and Implementation
  sections are accurate and the inline `req:` markers in the code
  match.
- Set the requirement file's status to `done` and bump the `Date`
  field.
- Update the corresponding row in the module's `index.md` overview
  matrix — Status, and Verification (`test` or `manual`) if it was
  still `—`.
- For ADRs that just transitioned (e.g. `proposed` → `accepted`),
  update both the ADR file and its row in
  [`03-architecture/index.md`](../docs/03-architecture/index.md).
- Only create a commit if a status or section actually changed.
- Commit (if needed): `docs: req: <slug> → done`

## Phase 6 — Final Check

Perform a structured review from multiple perspectives. Repeat passes
until a full pass finds nothing to fix, or until 5 passes have been
completed — whichever comes first.

For each pass, check from every one of these perspectives in turn:

- **Developer**: clean, consistent, maintainable? Edge cases handled?
  Anything over-engineered or under-explained?
- **User**: can they complete the task? Are labels, errors, and
  confirmations clear? Is the Swedish correct and natural?
- **Beginner developer**: would someone new understand what was
  added?
- **Beginner user**: would a non-technical person understand the
  flow?
- **First-time visitor**: does the feature feel coherent with the
  rest of the site?
- **AI self-review**: did I miss anything? Did I take shortcuts? Did
  I follow all constraints?

**Browser / manual verification for UI changes:**

When the change touches anything a user would see or interact with,
the User pass is not complete until the feature has actually been
used in a browser.

- Start the dev server.
- Walk through the golden path and the relevant edge cases.
- Verify that other features on the same page still behave as before.
- If a browser check is genuinely impossible in the current
  environment, say so explicitly rather than silently skipping it.

Unit tests, lint, and CodeQL verify code correctness, not feature
correctness.

After each pass: fix any issues, then commit:
`fix: post-review improvements for [feature] (pass N)`

If a pass finds nothing to fix, stop — no commit needed.

## Phase 7 — Rebase and Pull Request

Before opening a PR, rebase on `main`:

```bash
git fetch origin main
git rebase origin/main
```

- Resolve any conflicts, then `git add` and `git rebase --continue`.
- After a successful rebase, run the test and lint commands to confirm
  the branch is still clean.

**Pull request:**

- Create the PR with `gh pr create`.
- Title: short imperative phrase, under 70 characters.
- Body: summary bullets, test plan checklist.
- When the task comes from a GitHub Issue, include
  `Closes #<number>` in the PR body.

## Phase 8 — CI, Merge, and Cleanup

After the PR is created, verify that CI passes and complete the merge.

**Check CI:**

- Run `gh pr checks <number>` and wait for **all** checks to pass.
  Do not merge while any check is pending or failing.
- If a check fails, investigate, fix on the branch, push, re-check.

**Wait for user review and approval:**

After CI is green, stop and wait for the user to review the PR and
**explicitly approve the merge**. Do not merge on the strength of
green CI alone.

- Summarise what is ready (PR URL, CI status, manual-verification
  notes).
- Do not interpret silence, earlier agreement on scope, or a
  thumbs-up on the plan as approval to merge — merge to `main` is a
  shared-system action that always needs an explicit go-ahead.
- If the user requests changes, return to the appropriate phase
  before merging.

**Merge:**

- Once explicitly approved: `gh pr merge <number> --merge`.

**Cleanup:**

```bash
git checkout main
git pull
git branch -d <branch-name>
```

---

# 8. Code and Documentation Style

The same principle that drives the per-file documentation model
applies to code: **one thing per unit, small enough to read in one
sitting**. The shorthand is Uncle Bob's, but the rule is older than
that — Unix tools have lived by it for fifty years.

## One thing per file

A file contains one cohesive concept. If you cannot name a file in
three to five words, it is doing too much — split it. A folder
groups files that are about the same concern; a file is the smallest
unit of understanding.

This applies to code, to requirement files, to ADRs, and to test
files.

## One thing per function

A function does one thing at one level of abstraction. If the body
mixes "decide what to do" with "actually do it", split.

The honest test: can you describe what the function does in one
sentence without using the word *and*? If not, split.

## Names carry the meaning

A well-named function or variable removes the need for a comment
that explains what it does. Spend the time on the name, not on the
comment.

- **Bad:** `function p(x)` with a comment `// processes input`.
- **Good:** `function normaliseEmailAddress(input)`.

## Comments explain why, not what

The code already says what. Comments explain why a non-obvious
choice was made — a workaround, an invariant, a constraint that
isn't visible from the surrounding lines.

Default to writing no comments. Add one only when removing it would
genuinely confuse a future reader. Never write comments that
restate the code, reference the current task ("added for issue
&#35;123"), or describe historical state ("used to use X").

## Don't repeat yourself — once

Two similar lines is fine. Three similar lines is a candidate for
extraction. Premature abstraction is more expensive than a little
duplication; only extract once the shape is actually clear.

## No dead code

Delete unused functions, variables, parameters, and imports. Git
remembers — the codebase doesn't need to. Backwards-compatibility
shims for unused things are noise.

## Errors at boundaries, trust inside

Validate input where it enters the system: HTTP requests, file
reads, user-submitted data. Inside the system, trust your own
function signatures and your framework's guarantees. Defensive
checks for things that cannot happen are noise that hides the
checks that matter.

---

# 9. How This Document Evolves

`CLAUDE.md` is itself subject to the workflow above. Changes to it
go through the same phases as code changes. When a session uncovers a
new principle worth keeping — a recurring mistake, a clarification, a
better default — add it here as part of the same PR rather than
leaving it as oral tradition.

Two pressures keep this document healthy:

- **Add when a real lesson emerges.** Not when something feels nice
  in theory. Every line should pay rent.
- **Prune when a rule is no longer load-bearing.** Sections grow with
  the project; remove what's been superseded so future readers see
  only what currently applies.

---

# Final Rule

If something adds complexity without clear value, it should not be
added.
