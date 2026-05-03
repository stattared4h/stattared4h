# Traceability Matrix

This file is the single place where every requirement is listed
alongside the test that covers it and the implementation file that
fulfils it. It exists so a reader can answer three questions in one
place:

- **What does the system promise?** — the requirement.
- **How do we know it works?** — the test (or manual checkpoint).
- **Where is it built?** — the implementation file and inline marker.

When the matrix and the rest of the documentation disagree, the
matrix is wrong by definition — fix the matrix.

---

## Status Values

| Status | Meaning |
| ------ | ------- |
| `gap`  | Requirement is written but not yet implemented and/or not yet tested. |
| `test` | Requirement has a test or a documented manual checkpoint, but no implementation yet. |
| `done` | Requirement is implemented, tested (or has a documented manual checkpoint), and verified. |

A requirement only reaches `done` after Phase 5 of the feature
lifecycle in [CLAUDE.md §7](../CLAUDE.md).

---

## Summary

| Status | Count |
| ------ | ----- |
| `gap`  | 0 |
| `test` | 0 |
| `done` | 0 |
| **Total** | **0** |

Update these counts as part of Phase 5.

---

## Matrix

| ID | Topic file | Requirement (one-line summary) | Status | Test | Implementation | Notes |
| -- | ---------- | ------------------------------ | ------ | ---- | -------------- | ----- |

*The matrix is empty. Add one row per requirement as topic files in
`02-requirements/` are populated. Keep rows in numerical ID order
within each topic.*

---

## Manual Checkpoints

Requirements that cannot be tested in code (visual layout, browser-only
behaviour, UX feel) are marked with a `note` in the matrix above
explaining the concrete, actionable verification step — for example:
*"open the contact form in a browser and confirm the success banner
appears below the submit button"*.

A manual checkpoint is not an excuse to skip verification; it is a
contract that someone (or some pass of Phase 6) will perform that
exact step before the requirement is marked `done`.
