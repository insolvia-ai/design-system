---
name: design-system-pr
description: >-
  Contributor. How to write a pull request in this repo — what its body must carry, and the
  verification a UI change owes. Use this BEFORE `gh pr create` or
  `gh pr edit --body`, and whenever a task says "open a PR" or "describe these
  changes". Reach for it when you finish the code, not after pasting a commit
  log: nobody reviews these, so the body is the only durable record of why the
  change is shaped as it is. Covers the version-bump statement every
  packages/ change needs, and why a screenshot of both leaves is the evidence
  that counts here. Read it too whenever a task involves getting an IMAGE into
  GitHub from the command line — "attach the screenshot", "add a screenshot of
  both leaves", "upload this image" — because there is a working token-based
  upload for that, a 404 that makes a successful upload look broken, and a
  branch-based approach that has already destroyed one merged PR's evidence.
metadata:
  internal: true
---

# Writing a PR in this repo

**CI is the merge gate; there is no human reviewer.** So the body is not a
request for attention — it is the record that survives the branch, read later
by whoever is bisecting a visual regression back to this merge.

## Title

`<area>: <specific, lowercase phrase>` — areas are `design-system`, `tokens`,
`workbench`, `ci`, `docs`, `scripts`.

A release appends the version: `design-system: Select's open list rendered
behind the form below it (0.7.1)`. Put the distinguishing words in the title;
they are what search finds.

## The body

1. **Why** — the root cause or the motivation, not the symptom. If a decision
   could reasonably have gone the other way, say what you rejected.
2. **What** — synthesised, never a pasted commit log.
3. **How to review** — where to look, and what is subtle.

Scale it to the change: a sentence for a one-line fix, 200 words for a
component.

## What every body here must carry

- **The version bump, stated.** Which package, from what to what, and whether
  it is a patch or a minor. **Say explicitly when it is a minor**, because these
  are `0.x` packages: `^0.7.1` means `<0.8.0`, so a minor does not reach a
  consumer until someone widens the range there. A consumer once sat five minors
  behind without anything surfacing it.
- **The changelog entry, written** — `packages/<name>/CHANGELOG.md`, top of the
  file, format gated by CI (`design-system-release` has it). Do not paste the
  body into it, and do not paste it into the body: the entry says what a
  consumer gets and ships inside the tarball; this body says why, what was
  rejected and how it was verified, and stays here. The entry links back to this
  PR, and `publish.yml` puts it in the GitHub Release.
- **Verification with evidence**, never "tested locally". Test counts before
  and after, which typecheck programs ran, what the workbench showed.
- **A screenshot of BOTH leaves for any visual change**, from
  `./scripts/dev-up.sh`. This is the evidence that matters here and the tests
  structurally cannot provide it: they assert roles and labels in jsdom, and
  cannot see wrong colour, wrong position, or one thing painted under another.
  If the change touches colour, screenshot light **and** dark — the 0.2.1
  regression was invisible in light mode. Interaction tests (plays) and the
  workbench's open-state axe coverage are real evidence too, but they do not
  replace this screenshot — there is still no visual-regression tooling, so
  the screenshot remains the only record of what the change looked like.
  Getting one into the body is a solved problem — see **Attaching the
  screenshot** below.
- **What you did not verify, and why.**

## Attaching the screenshot

The requirement above is only worth as much as the image that survives it, and
GitHub publishes no API for the drag-and-drop attachment flow — which is why
this looks impossible from a terminal. It isn't. The endpoint behind
drag-and-drop takes an ordinary `gh` OAuth token, so no browser, no extension,
and no session cookie are involved:

```bash
gh-upload-image() {                 # gh-upload-image FILE [owner/repo]
  local f="$1" repo="${2:-}" ct id url cfg name
  [ -r "$f" ] || { echo "no such file: $f" >&2; return 1; }
  name=$(basename "$f"); ct=$(file --mime-type -b "$f")
  id=$(gh api "repos/${repo:-:owner/:repo}" --jq .id) || return 1
  cfg=$(mktemp); chmod 600 "$cfg"
  printf 'header = "Authorization: Bearer %s"\n' "$(gh auth token)" > "$cfg"
  url=$(curl -sS -f -K "$cfg" -X POST \
    -H 'Accept: application/json' -H "Content-Type: $ct" --data-binary @"$f" \
    "https://uploads.github.com/user-attachments/assets?name=$(jq -rn --arg v "$name" '$v|@uri')&content_type=$(jq -rn --arg v "$ct" '$v|@uri')&repository_id=$id" \
    | jq -r .url)
  rm -f "$cfg"
  [ -n "$url" ] && [ "$url" != null ] || { echo "upload failed" >&2; return 1; }
  printf '![%s](%s)\n' "$name" "$url"
}
```

It prints a markdown line. Capture the workbench pane, run it, drop the line
into the body file, `gh pr create --body-file`. Both leaves in one frame, and
both schemes when colour moved.

Three things that cost time to rediscover:

- **A fresh upload 404s for everyone but you, and that is not a failure.** The
  asset is readable only by the uploading token until some PR or issue
  references it; referencing it is what publishes it. So the obvious check —
  upload, then `curl` the URL — reports failure for an upload that worked.
  Check with the token, or just look at the rendered PR.
- **`repository_id` is the REST numeric id** (`gh api repos/:owner/:repo --jq
  .id`), not the GraphQL node id `R_kgDO…` that `gh repo view --json id`
  returns. And `:owner/:repo` only expands inside a git checkout — from a
  scratch directory, pass `owner/repo`.
- **Images and video only**, on repos your token can push to. The fallback for
  other types scrapes the browser's session cookie and prompts the keychain;
  don't. A log belongs in the body as a fenced block.

**Do not push screenshots to a branch and link `raw.githubusercontent.com`.**
It works, briefly. PR #2 did exactly that — an orphan `assets/pr-2` branch
holding seven PNGs — and its own commit message noted that deleting the branch
would break the images and nothing else. The branch was deleted; all seven
images in that merged PR are now `404`, and the evidence this skill calls "the
only record of what the change looked like" is gone. The method also leaks one
undeletable branch per visual PR. Uploads are attached to the repository rather
than to a ref, so nothing to clean up can take them out.

## Before you open it

- `git diff main...HEAD` — self-review. It is the only review there is.
- `npm run ci` green locally.
- `./scripts/dev-up.sh` and actually look at the component, in both panes and
  both schemes.
- **One PR, one responsibility.** A component fix and a CI change are two PRs;
  bundling them couples a publish to unrelated work.

## Consuming the change

A merge here publishes but changes nothing downstream. If the change is meant
to be visible in a consuming application, say so in the body — taking the new
version is that repo's own change, and a PR that claims to fix something
user-visible and stops here is only half done.

## The footer

End the body with:

`🤖 Generated with [Claude Code](https://claude.com/claude-code)`
