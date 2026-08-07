---
name: design-system-pr
description: >-
  How to write a pull request in this repo — what its body must carry, and the
  verification a UI change owes. Use this BEFORE `gh pr create` or
  `gh pr edit --body`, and whenever a task says "open a PR" or "describe these
  changes". Reach for it when you finish the code, not after pasting a commit
  log: nobody reviews these, so the body is the only durable record of why the
  change is shaped as it is. Covers the version-bump statement every
  packages/ change needs, and why a screenshot of both leaves is the evidence
  that counts here.
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
- **What you did not verify, and why.**

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
