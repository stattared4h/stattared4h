# stattared4h

Public repository for the `stattared4h` organisation.

## Security

This repository is public. Everything committed here — including Git history,
commit metadata, branches and GitHub Actions logs — is visible to everyone, so
it must never contain credentials, keys, tokens or personal data.

- [Security policy](SECURITY.md) — how to report a problem, and what to do if a
  secret is ever committed.
- [Public repository safety](docs/public-repo-safety.md) — the review checklist
  and the reasoning behind each rule.

## Automated checks

Every push and pull request runs:

| Check | What it does |
| --- | --- |
| Secret scan | Runs Gitleaks against the full Git history. |
| CodeQL | Static security analysis of tracked source code, plus weekly. |
| Dependency review | Blocks pull requests adding vulnerable dependencies. |
| Project checks | Runs the project's own lint, typecheck, build and test scripts. |
| Markdown, YAML and workflow lint | Keeps configuration and documentation valid. |
| Documentation links | Verifies that local Markdown links resolve. |

GitHub Actions are pinned to commit SHAs, workflows are read-only by default,
and `main` is protected by the ruleset in
[`.github/rulesets/main-protection.json`](.github/rulesets/main-protection.json).

## Contributing

Open a pull request against `main` and fill in the
[pull request template](.github/pull_request_template.md). Review your own diff
for secrets and private information before pushing.

## Licence

[MIT](LICENSE)
