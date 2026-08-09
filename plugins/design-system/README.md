# design-system plugin

Consumer-facing agent skills for `@insolvia-ai/design-system`. Installed by
someone whose project *uses* these packages, never by someone working in this
repo — the contributor skills in [`../../.claude/skills`](../../.claude/skills)
are the other half, and they are not shipped here.

Install instructions live in the [repo README](../../README.md#agent-skills).

## One plugin, three manifests

`.claude-plugin/`, `.codex-plugin/` and `.cursor-plugin/` each hold a
`plugin.json` over the **same** `skills/` directory, and the repo root carries a
matching marketplace file for each. Three front doors, one set of skills. The
`version` in all three manifests must agree — CI checks it, and checks that a
change under `plugins/` bumps it.

That version is the plugin's, not a package's. Skills are outside `packages/`
precisely so a wording fix does not publish a component release, and so the two
cadences stay independent.

## Skills carry judgement, not facts

The facts a consumer needs already have owners that cannot drift:

- `node_modules/@insolvia-ai/design-system/README.md` — ships in the tarball, so
  it matches the installed version exactly.
- The workbench at <https://insolvia-ai.github.io/design-system/> — the only
  place both leaves of a component can be seen side by side.

A skill that re-listed the catalogue would be a second source of truth, free to
drift, which is the same reason this repo has no hand-written component gallery.
So these skills say *which* source to read, *what* to reach for, and *why* a
thing is shaped the way it is — the parts a README cannot infer and an agent
usually gets wrong.

## Two audiences, kept apart by a flag

This repo holds two sets of skills. These four are for a third party consuming
the packages. The four in [`../../.claude/skills`](../../.claude/skills) are for
working in this repo, and they never need installing — a contributor has already
cloned.

They leaked. Every skills installer walks a fixed list of container directories,
`.claude/skills` among them, so `npx skills add insolvia-ai/design-system`
offered a third party all eight in one picker — "how to open a PR here" and "how
to publish these packages" beside the four they came for, each one telling their
agent to act on a repository it does not have.

The Agent Skills spec has a field for it: `metadata.internal: true` hides a
skill from discovery unless `INSTALL_INTERNAL_SKILLS=1` is set, and Claude Code
ignores the key, so contributor skills still load from a checkout. Every
contributor skill carries it.

`npm run skills:check` derives the expectation from the skill's **location**
rather than trusting anyone to remember: anything under `.claude/skills/` must
be `Contributor.` and internal, anything here must be `Consumer.` and not. A
new contributor skill cannot leak by omission, and a consumer skill cannot be
accidentally hidden from the people it was written for.
