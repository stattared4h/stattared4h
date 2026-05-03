# Requirements

This is the requirements index. As topics emerge, give each one its
own file in this directory and add it to the map below. Keep
individual files focused — when a file gets too long to scan, split
it.

> **Writing style:** describe the **desired state**, not "changes" or
> "improvements". A reader who has never seen the codebase should
> understand the requirement without needing to know what existed
> before. See [CLAUDE.md §5](../../CLAUDE.md) for the full rule and
> good/bad examples.

---

## Audience

*To be written.* One or two paragraphs naming the actual people the
site serves and what they need from it. Everything below is in
service of that audience.

---

## Requirement IDs

Each requirement carries a stable ID of the form `02-§N.M` where `N`
is the section number within its topic file and `M` is the
sub-number. IDs never change after a requirement is published —
superseded requirements move to `archive.md` with their original ID
preserved, so links in old PRs and commit messages keep working.

Inline comment markers in the implementation reference the ID, e.g.:

```html
<!-- 02-§3.4 -->
```

The traceability matrix in [`../99-traceability.md`](../99-traceability.md)
lists every requirement, the test that covers it, and the
implementation file that fulfils it.

---

## Topic Map

*Add files as topics emerge.* Suggested starting set when the
project gains shape:

| File | What it would govern |
| ---- | -------------------- |
| `pages-navigation.md` | Site structure: page inventory, navigation, footer |
| `content-and-design.md` | Content sections, hero, locale, design system |
| `forms-and-data.md` | Forms, validation, structured data shape |
| `build-deploy.md` | CI pipelines, environments, deploy steps |
| `platform-security.md` | Reliability, accessibility, language, security, analytics |
| `archive.md` | Archived requirements (superseded by later sections; IDs preserved) |

Do not create empty files in advance — add a topic file when there is
at least one requirement to put in it.
