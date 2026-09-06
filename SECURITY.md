# Security policy

This repository is public. Everything committed to it — including Git history,
branches, tags, commit metadata, issues and GitHub Actions logs — is visible to
anyone. It must never contain live credentials, private keys, access tokens,
private runtime configuration or personal data.

## Reporting a security problem

Do not open a public issue containing credentials, tokens, private keys,
private host details or working exploit details.

Report privately instead:

1. Use GitHub private vulnerability reporting on this repository
   (**Security → Report a vulnerability**) when it is enabled.
2. Otherwise contact the repository owner privately through their GitHub
   profile before sharing any sensitive detail.

Please include what you observed, how to reproduce it, and the affected commit
or version. Expect an initial response within a few working days.

## If a secret is committed

Treat a committed secret as compromised, even if the commit is reverted within
seconds. Deleting a file in a later commit does not remove it from earlier
history, and public repositories are cloned, forked and mirrored automatically.

1. Revoke or rotate the credential at its issuing service first. This is the
   only step that actually removes the risk.
2. Remove the value from the current tree.
3. Rewrite Git history if the value must not remain reachable, and force-push
   with care.
4. Check forks, caches, Actions logs and build artifacts for copies.
5. Review the service's access logs for unexpected use.

## Repository hygiene

The repository is designed around these rules:

- `.env` files, local overrides and host-specific configuration stay local;
- private keys, certificates and common credential files are ignored by
  `.gitignore`;
- documentation uses placeholder values such as `example.com` and `192.0.2.10`
  rather than real infrastructure;
- GitHub Actions are pinned to commit SHAs, not floating tags;
- workflows are read-only by default and elevate permissions per job;
- CI checkouts do not persist the Actions token into the working tree;
- dependency installation in CI runs without lifecycle scripts;
- Gitleaks scans the full Git history on every push and pull request;
- CodeQL analyses source code once it is present, plus on a weekly schedule;
- dependency changes in pull requests are reviewed for known vulnerabilities.

See [Public repository safety](docs/public-repo-safety.md) for the full review
checklist and the reasoning behind each rule.

## Supported versions

This repository does not yet publish released versions. Security fixes are
applied to the `main` branch.
