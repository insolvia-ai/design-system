---
name: design-system-github-auth
description: >-
  Contributor. Which GitHub account `gh` and `git` act as in this repo, and how
  to keep it right on a developer machine that holds more than one GitHub
  account. Use this BEFORE any GitHub write — `gh pr create/edit/merge`,
  `gh pr merge --auto`, `gh api` with a method, `gh run rerun`, `git push` —
  and the moment one fails with "Resource not accessible by integration",
  "Permission to insolvia-ai/… denied to <user>", HTTP 403/404 on an
  `insolvia-ai` repo, GraphQL `FORBIDDEN`, or the desktop app's auto-merge
  switch failing. Also read it before EVER running `gh auth switch`,
  `gh auth login`, `gh auth logout` or `gh auth setup-git` — the answer is
  almost always "don't".
metadata:
  internal: true
---

# GitHub identity in this repo

## The rule: check who you are; never switch

This repo lives in the **`insolvia-ai`** org. A developer machine may have
**several GitHub accounts logged into `gh` at once** — a personal one and the
Insolvia one — and only the Insolvia one can push, merge or administer. The
SessionStart hook (`.claude/hooks/session-accounts.sh`) puts a `GitHub:` line
in your context saying which login `gh` resolves to and its permission here.
**Read it first.** To re-check:

```bash
gh api user --jq .login
gh api repos/insolvia-ai/design-system --jq .permissions.push    # must print true
```

**Never run `gh auth switch`, `gh auth login`, `gh auth logout` or
`gh auth setup-git`.** Each one changes machine-wide state — `gh`'s *active*
account, or the global git credential config — for every repo and every other
agent session on the machine, silently breaking the developer's other repos.
If no logged-in account can push, **stop and ask the human**; `gh auth login`
is a browser sign-in they do themselves.

## How each tool picks its account

| Tool | Where its account comes from |
|---|---|
| `gh` in your Bash commands | `GH_TOKEN` if set, else `gh`'s **active** account (machine-wide) |
| `git push` / `git fetch` | git's credential helper — may be set **per folder** in `~/.gitconfig` (`includeIf "gitdir:…"`), independent of `gh`'s active account |
| The desktop app's PR controls (auto-merge switch, PR status, CI monitor) | the **app's own process** — `gh`'s active account. It does not see `GH_TOKEN` or direnv |

The usual multi-account setup is a direnv `.envrc` above the checkout exporting
`GH_TOKEN` for the Insolvia account. Your Bash commands run in non-interactive
shells that never fire direnv's prompt hook; the SessionStart hook loads that
environment into each of them, without writing the token to disk.

## When `gh` is the wrong account

1. `gh auth status` — every logged-in account, and which is active.
2. Find the one that can push: for each login `L`,
   `GH_TOKEN="$(gh auth token --user L)" gh api repos/insolvia-ai/design-system --jq .permissions.push`.
3. Use it **per command**, without switching (env vars don't persist between
   your Bash calls; never echo the token):

   ```bash
   GH_TOKEN="$(gh auth token --user <insolvia-login>)" gh pr create …
   ```

4. Tell the human the `GitHub:` line was wrong so they can fix their `.envrc`.

## When `git push` is denied

`Permission to insolvia-ai/design-system.git denied to <user>`: git's credential
helper handed over the wrong account. See which, without printing the secret:

```bash
printf 'protocol=https\nhost=github.com\n\n' | git credential fill | grep '^username='
```

One-off push through `gh`'s token for the right account (no config change):

```bash
GH_TOKEN="$(gh auth token --user <insolvia-login>)" \
  git -c credential.helper= -c 'credential.helper=!gh auth git-credential' push
```

Then tell the human; the durable fix is their `~/.gitconfig`, not yours to edit.

## Auto-merge

Auto-merge is **enabled** on this repo. If the desktop app's auto-merge switch
fails (`forbidden`), it ran as the machine-wide active account, which may not
be the Insolvia one — don't retry it. Use `gh` instead, which honours
`GH_TOKEN`:

```bash
gh pr merge <n> --auto --squash --delete-branch
```

## Commit author

`git config user.email` in this checkout is whatever the developer set (often
per folder). Don't change it; if it looks like the wrong identity, say so.
