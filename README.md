# Stättared 4H

> This project is at the **starting state**. The sections below describe
> what the site is intended to be and how the project is structured to
> get there. Concrete content, design, and technology choices land in
> `/docs/` as they are decided.

---

## What This Site Is For

*To be written.* A short, plain-language paragraph that explains who
the site is for, what problem it solves, and how someone arrives at it.
Write it from a visitor's perspective, not an organisation's.

The tone target: warm but structured. Calm and trustworthy. Clear and
precise. In Swedish.

---

## What the Site Provides

*To be filled in as features are agreed.* Each bullet is a thing a
real visitor can do or learn — not a technical capability.

- ...
- ...

---

## For Developers

### Quick Start

*To be filled in once the toolchain is chosen.* Aim for three commands
or fewer to install, build, and run.

```bash
# install
# build
# start  →  http://localhost:3000
```

Start by reading [docs/01-CONTRIBUTORS.md](docs/01-CONTRIBUTORS.md). It
covers setup, git workflow, linting, and testing. The rest of the
documentation is listed below.

### Documentation

| #  | Path | What lives there |
| -- | ---- | ---------------- |
| 1  | [docs/01-CONTRIBUTORS.md](docs/01-CONTRIBUTORS.md) | Setup, git workflow, linting, testing, contribution rules |
| 2  | [docs/02-requirements/](docs/02-requirements/index.md) | One file per requirement — `index.md` explains the convention; `_template.md` is the starting point |
| 3  | [docs/03-architecture/](docs/03-architecture/index.md) | One file per architectural decision (ADR) — `index.md` explains the convention; `_template.md` is the starting point |

There is no central traceability matrix and no central architecture
document. Each requirement and each ADR is self-contained — see
[CLAUDE.md §5](CLAUDE.md) for the why.

Add new docs (operations, data contract, design tokens, environments,
release process) as the project decides what it needs. Numbering
keeps them ordered without forcing a particular sequence to exist.

### Core Constraints

See [CLAUDE.md](CLAUDE.md) for the full list. The short version:

- Static, fast, accessible.
- No client-side framework or backend database unless explicitly
  justified in `docs/03-architecture/`.
- Lint and tests pass before merge.
- Never push directly to `main`.

---

## License

See [LICENSE](LICENSE).
