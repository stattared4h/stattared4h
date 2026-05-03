# CLAUDE.md – Stättared 4H

This document defines how work is done on this project — the workflow,
the writing style for requirements, the quality bar, and the principles
that override any particular implementation choice.

The project is at the **starting state**. Architecture, technology, and
domain rules are not locked in yet. Sections 1–4 below are deliberately
short; they grow as the project decides what it is. The workflow
(Sections 5–8) is locked in from day one.

If a rule here ever conflicts with a more specific rule in `/docs/`,
the doc wins — `CLAUDE.md` summarises principles, `/docs/` defines
detail.

---

# 0. Reference Documentation

Before writing any code, content, or data, read the relevant docs in
`/docs/`. As the project grows, add new docs here so future contributors
(human and AI) know where to look first.

| File | What it governs |
| ---- | --------------- |
| `docs/01-CONTRIBUTORS.md` | Contribution guidelines, git workflow, setup, linting |
| `docs/02-requirements/index.md` | Requirements index — audience overview and a map to topic files |
| `docs/03-architecture/index.md` | Architecture index — system overview and a map to topic files |
| `docs/99-traceability.md` | Requirements traceability matrix — every requirement, its tests, and its implementation |

When new domains emerge (data contract, design tokens, environments,
release process, operations), give them their own numbered doc and link
it here. Do not let knowledge accumulate only in commit messages or
chat — if it matters tomorrow, it belongs in `/docs/`.

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
  (visual, manual UX) are marked as manual checkpoints in the
  traceability matrix with a concrete verification step.
- Build runs locally **and** in GitHub Actions. CI fails if the build
  fails.
- Deployment happens only after CI is green.

---

# 5. Requirements Writing Style

When writing requirements in `docs/02-requirements/`, **describe the
desired state — not "changes" or "improvements"**.

Write each requirement as a standalone fact about how the system
works. A reader who has never seen the codebase should understand the
requirement without needing to know what existed before.

- **Bad**: "The cache version must be incremented to v4." / "The hero
  banner must be removed from the front page."
- **Good**: "The service worker cache name is `stattared-v4`." /
  "The front page does not contain a hero banner."

Avoid words like: "changed", "updated", "replaced", "removed",
"incremented", "added", "new". These describe transitions, not
desired state.

The Context subsection at the top of each requirement section is the
only place where background and motivation belong. Requirements
themselves are pure desired-state declarations.

Each requirement has a stable ID (e.g. `02-§3.4`) and an inline
comment marker in the implementation that references it. The
traceability matrix in `docs/99-traceability.md` lists every
requirement, its tests, and its implementation files.

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

When multiple branches are in flight, shared documentation files
(`99-traceability.md`, `02-requirements/`, architecture docs) change
frequently on `main` and are prone to renumbering conflicts.

Before editing any shared documentation file, rebase on the latest
`main`:

```bash
git fetch origin main
git rebase origin/main
```

This applies throughout all phases — not only at Phase 7. The cost of
rebasing when `main` has not moved is zero; the cost of discovering
conflicts late is high.

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

- Convert the agreed prompt into structured requirements.
- Add them to the appropriate topic file under `docs/02-requirements/`
  with correct `02-§` IDs and inline comment markers.
- Commit: `docs: add requirements for [feature]`

## Phase 2 — Documentation and Traceability

- Document how each requirement is or will be implemented in the
  relevant architecture/design docs (`docs/03-architecture/`, etc.).
- Add new sections to docs where needed; existing docs may already
  cover some requirements.
- Add all new requirements to `docs/99-traceability.md` with status
  `gap`.
- Commit: `docs: document design and traceability for [feature]`

## Phase 3 — Tests

- Write tests for each testable requirement.
- If a requirement cannot be tested in code (visual, UX, or inherently
  manual), document the reason in the traceability matrix note field
  and mark it as a manual/AI validation checkpoint.
- Browser-only behaviour (DOM, `fetch`, `localStorage`, CSS layout)
  cannot be unit-tested in Node. Mark these as manual checkpoints
  with a concrete, actionable verification step.
- Commit: `test: add tests for [feature]`

## Phase 4 — Implementation

- Write code to make all tests pass.
- Commit: `feat: implement [feature]`

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

## Phase 5 — Review and Traceability Update

- Verify that requirements, documentation, tests, and implementation
  are consistent and complete.
- Update the traceability matrix: set final statuses, fill in
  implementation references, link tests.
- Update summary counts in the matrix.
- Only create a commit if the matrix actually required updating.
- Commit (if needed): `docs: traceability update for [feature]`

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

# 8. How This Document Evolves

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
