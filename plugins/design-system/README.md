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

## Every description declares its audience

Every `SKILL.md` in this repository opens its `description` with `Consumer.` or
`Contributor.`, and `npm run skills:check` fails the build otherwise.

The reason is concrete. The skills CLI discovers `SKILL.md` files across the
whole repository — including `.claude/skills/`, which holds contributor-only
skills about opening PRs here and publishing these packages. Someone installing
with a wildcard would sweep those into their own project, where every one of
them is wrong. Publishing the explicit named install command is the first
defence; the prefix is the second, visible in the always-loaded metadata even
when the first fails.
