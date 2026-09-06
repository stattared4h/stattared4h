# Public repository safety

This page is for whoever maintains this repository. Read it before pushing
changes, and again before adding code that touches configuration, secrets or
third-party services.

Making a repository public shares more than the files visible in the current
checkout. **Git history, commit metadata, branches, tags, issues, pull
requests, Actions logs and artifacts are public too.** A password deleted last
week is still sitting in last month's commit, and public repositories are
cloned, forked and mirrored by automation within minutes.

> **The short version:** never commit `.env`, passwords, tokens or keys, and
> never hard-code anything that describes a real host, network or account. Use
> placeholders such as `example.com` and `192.0.2.10` in documentation.

## 1. Never commit credentials

Never commit:

- `.env` or any environment file with real values;
- passwords or passphrases;
- API keys, access tokens, session tokens or webhook secrets;
- SSH private keys;
- TLS private keys and keystores;
- cloud service-account JSON files;
- `.npmrc` or `.netrc` containing registry or host authentication;
- database connection strings containing credentials;
- authentication cookies, fixtures or recorded HTTP sessions with real tokens.

`.gitignore` is a safety net, not a security boundary. Inspect what you are
about to commit:

```bash
git status
git diff --cached
```

The repository ignores `.npmrc`, `.vscode/` and `.idea/` because they are
common leak paths. If the project ever needs a checked-in, secret-free version
of one of them, add it deliberately with `git add -f` and review the contents
first.

## 2. Keep environment-specific information out of the code

The public repository should contain reusable code and examples, not a map of a
real deployment.

Do not commit:

- public or private IP addresses tied to a real host;
- private or admin DNS names;
- internal URLs, bucket names, queue names or project identifiers;
- VPN, router or firewall configuration;
- SSH configuration naming real hosts;
- screenshots or logs containing addresses, account names or tokens;
- personal data of any kind.

Read configuration from the environment instead of hard-coding it:

```js
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error("API_KEY is not set");
}
```

When a project needs configuration, commit a `.env.example` with placeholder
values and keep the real `.env` local. The repository's `.gitignore` already
allows `.env.example` through while ignoring every other `.env` variant.

Also make sure the code does not leak secrets at runtime: do not log tokens,
do not include them in error messages, and do not send them to third-party
error-reporting services.

## 3. Remember that Git keeps history

Removing a sensitive file in a later commit does **not** remove it from earlier
commits. Inspect history, not only the current checkout:

```bash
git log --all --stat
git log -p --all
```

The **Secret scan** workflow runs Gitleaks against the full history on every
push and pull request. Verify that it is green.

If a real secret has ever been committed, rotate or revoke it first. History
rewriting is secondary — a committed secret is compromised, and rewriting does
not reach clones, forks or caches.

## 4. Check tracked and ignored files

Review exactly what Git tracks:

```bash
git ls-files
```

Review ignored files too, so an accidental `git add -f` does not go unnoticed:

```bash
git status --ignored
```

## 5. Check commit identity and metadata

Public commits expose the author name and email in every commit. If a personal
address should not be public, configure Git to use the GitHub-provided
`noreply` address before making new commits:

```bash
git config user.email "<id>+<username>@users.noreply.github.com"
```

Review what is already there:

```bash
git log --format='%h %an <%ae>' --all
```

Configuration changes only affect future commits; removing an address from
existing history requires rewriting it.

Repository names, branch names, commit messages, issue titles and code
comments are public metadata as well. Decide deliberately whether names of
people, customers, households or internal projects belong in them. This is a
privacy decision even when it is not a technical vulnerability.

## 6. Dependencies and supply chain

Every dependency runs with the same privileges as the project.

- Add a dependency only when it is genuinely needed; prefer the standard
  library and small, well-maintained packages.
- Check the package's repository, release history and maintenance status
  before adding it. Watch for names that resemble popular packages.
- Commit the lockfile so builds are reproducible and reviewable.
- Review the dependency diff in a pull request, not just the code diff.
- Let Dependabot's grouped weekly pull requests land promptly; the
  **Dependency review** check blocks pull requests introducing dependencies
  with known high or critical advisories.

CI installs dependencies with `--ignore-scripts`, so a compromised package
cannot execute install hooks in the CI environment. If a build genuinely
requires a lifecycle script, enable it for that one package rather than
removing the flag from the whole workflow.

## 7. GitHub Actions security

Workflows execute third-party code with access to the repository token.

- Actions are pinned to full commit SHAs with a version comment, never to a
  floating tag or branch. A tag can be moved; a SHA cannot.
- Every workflow declares `permissions: contents: read` at the top and
  elevates only in the job that needs it. Only the CodeQL job holds
  `security-events: write`.
- Checkouts use `persist-credentials: false`, so the Actions token is not left
  in `.git/config` where build or test code could read it.
- Do not add `pull_request_target`, `workflow_run` with untrusted input, or
  self-hosted runners without understanding that they can expose secrets to
  code from forks.
- Never interpolate untrusted values such as `github.event.pull_request.title`
  directly into a `run:` block. Pass them through `env:` instead.
- Do not print secrets, and remember that Actions logs on a public repository
  are public.

When updating an Action:

1. verify the upstream repository and release;
2. read the release notes;
3. update the pinned commit SHA;
4. keep the version comment next to the SHA;
5. review the resulting workflow run.

## 8. GitHub repository settings

Some protections live in repository settings rather than in files. Verify under
**Settings** that:

- **Secret scanning** and **push protection** are enabled, so a pushed
  credential is blocked before it becomes public;
- **Private vulnerability reporting** is enabled, giving reporters a private
  channel;
- **Dependabot alerts** and **Dependabot security updates** are enabled;
- **Code scanning** shows results from the CodeQL workflow;
- the **Protect main** ruleset is imported from
  [`.github/rulesets/main-protection.json`](../.github/rulesets/main-protection.json)
  and enforced, so `main` requires a pull request with the security checks
  green;
- workflow permissions default to read-only, and Actions cannot approve pull
  requests;
- collaborator access follows least privilege, and every account with write
  access uses two-factor authentication.

## Checklist before making changes public

Verify all of the following:

- the diff contains no credentials, tokens, keys or personal data;
- no real hostnames, addresses or account identifiers appear in code, tests,
  fixtures or documentation;
- `.env` and other local-only files are untracked;
- new dependencies were reviewed, and the lockfile is committed;
- workflow changes keep pinned SHAs and minimal permissions;
- the **Secret scan**, **CodeQL** and **Dependency review** checks pass;
- commit author identity and commit messages are acceptable as public metadata;
- no Actions log or artifact contains sensitive data.

See the [security policy](../SECURITY.md) for reporting a security problem and
for what to do when a secret has been committed.
