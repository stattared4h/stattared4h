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

| #  | Doc | What it covers |
| -- | --- | -------------- |
| 1  | [docs/01-CONTRIBUTORS.md](docs/01-CONTRIBUTORS.md) | Setup, git workflow, linting, testing, contribution rules |
| 2  | [docs/02-requirements/](docs/02-requirements/index.md) | Requirements index — audience overview and a map to topic files |
| 3  | [docs/03-architecture/](docs/03-architecture/index.md) | Architecture index — system overview and a map to topic files |
| 99 | [docs/99-traceability.md](docs/99-traceability.md) | Requirements traceability matrix — every requirement, its tests, and its implementation |

Add new docs (operations, data contract, design tokens, environments,
release process) as the project decides what it needs. Numbering keeps
them ordered without forcing a particular sequence to exist.

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
