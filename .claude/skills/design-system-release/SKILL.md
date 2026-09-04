---
name: design-system-release
description: >-
  Contributor. How a change here reaches a consumer — version bump and
  changelog entry, publish on merge, then a dependency bump in the consuming
  repo. Use this BEFORE editing anything under packages/, including a README or
  CLAUDE.md, because CI fails any PR that changes a package without bumping its
  version and adding that version's CHANGELOG.md entry. Read it when writing
  that entry: the heading format is parsed, and the patch/minor label is checked
  against the version numbers.
  Also read it when asked "why hasn't my change shown up downstream", when a
  publish is skipped or the registry looks stale, and before choosing a version
  number for a component change. Read it BEFORE removing or renaming anything
  the package exports — a prop, a type, a component — because that is a
  two-release deprecation here, not a single edit. Covers which of the two
  packages you are releasing, why both publish source with no build step, and
  the one-time GitHub Packages access this repo needs.
metadata:
  internal: true
---

# Releasing from this repo

Two packages publish from here, independently:

| Package | Directory | Consumed by |
|---|---|---|
| `@insolvia-ai/design-system` | `packages/design-system` | web and React Native consumers |
| `@insolvia-ai/tokens` | `packages/tokens` | React Native consumers, and any tool that needs raw token values |

## The rule

**Any change under `packages/<name>/` bumps that package's `version` in the
same PR, and adds that version's entry to that package's `CHANGELOG.md`.** CI
enforces both (`.github/workflows/pr.yml`, *Require a version bump for every
changed package* and *Changelog checks*), and the rule covers README and
CLAUDE.md edits too — the gate diffs the directory, not the file types. A
docs-only release earns a one-line entry saying so; that is cheaper than an
exception the next person has to reason about.

That is not bureaucracy. `publish.yml` is **idempotent by version**: it asks
the registry whether `name@version` exists and skips cleanly if it does. So an
unbumped change merges green, publishes nothing, and leaves the registry
quietly stale while `main` moves on. Nothing downstream errors; the consumers
just keep installing the old artifact.

Changes **outside** `packages/` — CI, scripts, the workbench, skills — need no
bump and publish nothing.

## Picking the number

These are `0.x` packages, and npm's caret rules for `0.x` are narrower than
people expect: `^0.7.1` means `>=0.7.1 <0.8.0`. A **minor** bump therefore does
not reach a consumer until someone widens the range there.

- **patch** (`0.7.1`) — a fix inside existing behaviour. Consumers on `^0.7.0`
  pick it up on their next install.
- **minor** (`0.8.0`) — a new component, a new prop, changed visuals.
  Consumers must edit their range, so it is a deliberate handoff.

A consumer once sat on `^0.2.1` while this package reached 0.6.0 — five minors
it could never install, and nothing surfaced the gap. If you ship a minor, say
so in the PR body **and in the changelog entry**.

## Writing the entry

`packages/<name>/CHANGELOG.md`, a new section at the top:

```markdown
## 0.13.1 — patch

- What a consumer gets, in their terms.

[#14](https://github.com/insolvia-ai/design-system/pull/14)
```

The heading format is exact — `## <version> — <major|minor|patch>` — because
`scripts/check-changelog.ts` parses it, prints it into the GitHub Release, and
**derives the type from the version numbers to check your label**. A minor
mislabelled as a patch is the five-minors-behind failure written down as a fact;
the gate refuses it. There is no Unreleased section and cannot be one: merging
to `main` publishes, so the top entry is always the version in the manifest, and
the gate enforces that too.

Write it for someone holding the installed package, not for a reviewer. **What
changed and what they must do** — the PR link carries the why, the rejected
alternatives and the verification, so do not restate any of it here. A minor
opens with the line that tells them it will not arrive on its own:

```markdown
**Widen your range to take this:** `^0.12.x` will not resolve it.
```

## Removing or renaming public API

`src/index.ts` is the export surface. Deleting a line from it — or dropping a
prop, or renaming one — breaks a consumer at the moment it widens its range,
and this repo cannot go and tell anybody: it is not allowed to name a consumer,
and nobody here can see who installed what.

There are exactly two channels, and both are pushed rather than pulled — they
reach a consumer without anyone thinking to look.

**The changelog ships inside the tarball.** `CHANGELOG.md` is in each package's
`files`, so the entry lands in the consumer's `node_modules` on install and is
readable with no registry access and no network. State the deprecation in the
entry for the minor that introduces it, and the removal in the entry for the
minor that performs it.

**Both packages publish source** — `exports` pointing at `.ts`, no build step —
so the consumer's TypeScript reads the real `.props.ts`. A JSDoc tag written
here shows up struck through in that consumer's editor on their next install,
without anyone being told anything.

So removal is two releases, never one:

1. **Deprecate in one minor.** Keep the old name working. Mark it
   `@deprecated`, naming both the replacement and the version that removes it
   — a tag saying only "deprecated" tells a consumer nothing it can act on:
   ```ts
   /** @deprecated Use `intent`. Removed in 0.14.0. */
   emphasis?: ButtonIntent | undefined;   // illustrative — no such prop exists
   ```
   A renamed prop keeps both, with the old one optional and forwarding to the
   new one, so the deprecation release breaks nobody.
2. **Remove in a later minor** — never in a patch. A patch reaches consumers on
   their next install without anyone choosing it; that is precisely the release
   that must not take an API away.

State both steps in the PR body under the version-bump statement, since that
body is the only durable record of the change (`design-system-pr`). A minor
that removes something is a handoff twice over: the consumer must widen its
range *and* edit its call sites, and the range edit is where the breakage
lands — under `0.x` caret rules a consumer sits on `^0.12.0` until it decides
to move, then takes every removal since in one step.

## The whole path to a consumer

1. Branch, change, **bump the version and write the changelog entry**, open a
   PR. CI is the only gate.
2. Merge. `publish.yml` publishes on push to `main` — tokens first, then the
   design system, so the registry never shows the second half of a paired
   change without the first. It then tags each published version
   (`design-system-v0.13.1`, `tokens-v0.3.1` — per package, since the two
   version independently) and cuts a GitHub Release whose body is that
   changelog entry plus a link to the PR. Nothing to do by hand.
3. In the consuming repo, bump the dependency. That is that repo's change,
   with its own manifests and lockfiles to keep in step.

There is no shortcut at step 3, and none should be added. A consumer once read
this package's source through a workspace symlink, so one package had two live
states at once — what that reader saw, and what the registry held.

## Never add a build step

Both packages publish `src/` as-is. For the design system this is load-bearing:
each component's `.web.tsx` and `.native.tsx` leaves must survive into the
tarball so the **consumer's** bundler picks the leaf — Vite takes `.web`, Metro
takes `.native`. A tsup/tsc emit collapses the pair and breaks resolution for
everyone. The PR gate packs the tarball and asserts both leaves are still in
it, so this fails loudly rather than in someone else's bundler.

## Merge a stack ONE PR AT A TIME

The publish job runs once per **push** to `main` and publishes whatever version
the manifest holds at the end of it. Land three version-bumping PRs in one push
— which `gh stack merge` does by default — and it sees only the last one. The
intermediate versions are never published, and nothing fails: the merge is
green, the job is green, and the registry silently skips a version that has a
changelog entry saying it exists.

That is how 0.17.0 and `tokens` 0.4.0 were lost, and it was found by reading the
registry afterwards rather than by any gate.

So when a stack bumps a version in more than one PR: merge the bottom one, wait
for its publish run to finish, confirm the version is in the registry, then
merge the next. `gh stack merge <pr-number> --yes` merges up to and including
that PR, which is how you take them one at a time.

A gap in the numbers afterwards is not worth repairing — npm never required them
to be contiguous, and republishing to fill one moves the `latest` tag backwards.
Mark the entry as never-published, point it at the version that carries its
content, and move on.

## If a publish does not happen

- **Skipped, "already in the registry"** — the version was not bumped, or was
  bumped to one already published. Bump again and merge.
- **Nothing ran for a version you merged** — check whether it shared a push with
  a later bump; see above.
- **403 / permission denied** — a package first published from a different
  repository stays linked to it, and it may be private. This repo then needs
  Write on it, and each consuming repo needs Read: package → *Package
  settings* → *Manage Actions access*. One-time, and only an admin can do it.
- **"The job was not acquired by Runner of type hosted"** — GitHub capacity,
  not this workflow. Re-run it; `workflow_dispatch` exists for exactly that.
