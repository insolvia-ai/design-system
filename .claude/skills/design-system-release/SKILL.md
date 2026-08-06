---
name: design-system-release
description: >-
  How a change here reaches the app and the marketing site — version bump,
  publish on merge, then a dependency bump in insolvia-ai/insolvia. Use this
  BEFORE editing anything under packages/, including a README or CLAUDE.md,
  because CI fails any PR that changes a package without bumping its version.
  Also read it when asked "why hasn't my change shown up in the app", when a
  publish is skipped or the registry looks stale, and before choosing a version
  number for a component change. Covers which of the two packages you are
  releasing, why both publish source with no build step, and the one-time
  GitHub Packages access this repo needs.
---

# Releasing from this repo

Two packages publish from here, independently:

| Package | Directory | Consumed by |
|---|---|---|
| `@insolvia-ai/design-system` | `packages/design-system` | the Expo app and the marketing site |
| `@insolvia-ai/tokens` | `packages/tokens` | the app, and insolvia's Cognito branding tool |

## The rule

**Any change under `packages/<name>/` bumps that package's `version` in the
same PR.** CI enforces it (`.github/workflows/pr.yml`, *Require a version bump
for every changed package*), and the rule covers README and CLAUDE.md edits
too — the gate diffs the directory, not the file types.

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

Marketing sat on `^0.2.1` while this package reached 0.6.0 — five minors it
could never install, and nothing surfaced the gap. If you ship a minor, say so
in the PR body.

## The whole path to a consumer

1. Branch, change, **bump the version**, open a PR. CI is the only gate.
2. Merge. `publish.yml` publishes on push to `main` — tokens first, then the
   design system, so the registry never shows the second half of a paired
   change without the first.
3. In `insolvia-ai/insolvia`, bump the dependency. That repo's
   `insolvia-design-system-bump` skill covers which manifests and **which two
   lockfiles** must move together.

There is no shortcut at step 3, and none should be added. The app used to read
this package's source through a workspace symlink, so one package had two live
states at once; removing that is why this repo exists.

## Never add a build step

Both packages publish `src/` as-is. For the design system this is load-bearing:
each component's `.web.tsx` and `.native.tsx` leaves must survive into the
tarball so the **consumer's** bundler picks the leaf — Vite takes `.web`, Metro
takes `.native`. A tsup/tsc emit collapses the pair and breaks resolution for
everyone. The PR gate packs the tarball and asserts both leaves are still in
it, so this fails loudly rather than in someone else's bundler.

## If a publish does not happen

- **Skipped, "already in the registry"** — the version was not bumped, or was
  bumped to one already published. Bump again and merge.
- **403 / permission denied** — these packages were originally published from
  `insolvia-ai/insolvia` and the package is private, so this repo needs Write
  on it and the consumer repo needs Read: package → *Package settings* →
  *Manage Actions access*. One-time, and only a repo admin can do it.
- **"The job was not acquired by Runner of type hosted"** — GitHub capacity,
  not this workflow. Re-run it; `workflow_dispatch` exists for exactly that.
