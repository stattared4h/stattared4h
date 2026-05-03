# Contributing to Stättared 4H

There are two types of contributors: **content editors** and **developers**.
Most contributions are content edits and require no programming
knowledge.

The project is at the **starting state**. Some sections below are
deliberately unfilled — they get concrete content as the toolchain
and content model are decided. The workflow rules (git, branches,
review, merge) apply from day one regardless.

---

## Content Editors

Content editors update Markdown files and structured data files. No
build tools or technical setup needed.

### Editing Page Content

*To be filled in once the content layout is decided.* Each Markdown
file maps to one section or page; layout is handled separately and
content editors never need to touch templates.

Suggested home: `source/content/`.

### Adding or Editing Structured Data

*To be filled in once the data model is decided.* Structured data
(YAML/JSON) lives in one well-known directory. Schema and required
fields will be documented in a future `docs/0N-DATA_CONTRACT.md`.

### Rules for Content Edits

- Write in Swedish unless the content is explicitly multilingual.
- Do not edit layout or template files.
- Do not modify files in `docs/` unless you are updating process
  documentation.
- Follow the Markdown formatting rules — a linter will check
  automatically on commit once linting is configured.

---

## Developers

Developers make changes to templates, build tooling, infrastructure,
or the documentation set itself.

### Setup

*To be filled in once Node.js / runtime requirements are decided.*

```bash
# install dependencies
# install git hooks (lint-on-commit)
```

### Git Workflow

Always work on a branch. Never commit directly to `main`.

1. Pull the latest `main` before starting:

   ```bash
   git checkout main
   git pull
   ```

2. Create a new branch with a descriptive name:

   ```bash
   git checkout -b fix/footer-link
   git checkout -b feature/contact-form
   ```

3. Make your changes, then push the branch and open a pull request.

4. CI must pass before the PR can be merged.

5. After the PR is merged, pull `main` and delete the local branch:

   ```bash
   git checkout main
   git pull
   git branch -d fix/footer-link
   ```

For the full feature lifecycle (alignment → requirements → docs →
tests → implementation → review → rebase → PR → merge), see
[CLAUDE.md §7](../CLAUDE.md).

### Pre-commit Hook

*To be configured.* Once linting is in place, every commit should run
the linter automatically and block the commit if lint fails.

### Linting Rules

*To be filled in.* Configure once the file types are known (HTML,
CSS, JS, Markdown, YAML, …). Document any disabled rules and the
reason they are disabled.

### Testing

*To be filled in.* Tests should cover every testable requirement
listed in `docs/02-requirements/`. Browser-only behaviour is marked
as a manual checkpoint in `docs/99-traceability.md` rather than
faked with a brittle simulation.

### Architecture

Before making structural changes, read:

- [docs/02-requirements/](02-requirements/index.md)
- [docs/03-architecture/](03-architecture/index.md)
- [CLAUDE.md](../CLAUDE.md)

### Core Constraints

- No client-side framework (React, Vue, Svelte, …) unless explicitly
  justified in `docs/03-architecture/`.
- No backend database unless explicitly justified.
- Reuse layout components — never duplicate markup between pages.
- Build must pass before merge.
- Lint must pass before merge.

---

## Deployment

*To be filled in once the deploy target is decided.* The pattern to
aim for: code changes deploy to a QA environment automatically on
merge to `main`; production deploys require an explicit, separate
trigger.

---

## Questions and Issues

If something is unclear or you find a bug, open an issue on GitHub or
contact the maintainers directly.

When reporting a bug, include:

- Which page or view is affected.
- What you expected to see.
- What actually happened.
- Steps to reproduce, if you know them.
