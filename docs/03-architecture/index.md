# Architecture

This is the architecture index. As the system takes shape, give each
concern its own file in this directory and add it to the map below.

The job of these files is to explain **how** the system fulfils the
requirements in `../02-requirements/`. Every architectural section
should reference one or more requirement IDs (`02-§N.M`) so the link
between *what* and *how* stays explicit.

When a major decision is made — a framework chosen, a hosting target
locked in, a data shape finalised — record both the **outcome** and
the **reasoning** here. Future contributors (human and AI) will need
the reasoning to know whether a later request conflicts with the
decision or simply revisits a question that was already settled.

Decisions that were considered and **rejected** belong in
`appendix.md`. Knowing what was tried and why it was set aside is
often more valuable than knowing what was chosen.

---

## Topic Map

*Add files as decisions are made.* Suggested starting set:

| File | What it would govern |
| ---- | -------------------- |
| `data-layer.md` | Source-of-truth files, schema, data resolution |
| `rendering.md` | How pages are produced, project structure, output |
| `pages-and-content.md` | Navigation, page templates, content composition |
| `forms-and-api.md` | Form handling, validation, server interactions (if any) |
| `ci-and-deploy.md` | Build pipeline, validators, asset handling, deploy |
| `platform-and-security.md` | Hosting, headers, secrets, rate limiting |
| `appendix.md` | Decisions deliberately rejected; design philosophy |

Do not create empty files in advance — add a topic file when there is
at least one decision recorded in it.
