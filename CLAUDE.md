# design-system — agent guide

A design system and its design tokens, as **two published npm packages** in one
workspace. Everything here reaches consumers through the GitHub Packages
registry, and through nothing else.

```
packages/tokens          @insolvia-ai/tokens          one JSON source → TS, CSS, JSON
packages/design-system   @insolvia-ai/design-system   platform-split components
```

Each package has its own `CLAUDE.md` (that package's rules — read it before
editing there) and a `README.md` for humans. One owner per fact — link, never
restate.

## This repo knows nothing about its consumers

**Do not name a consumer anywhere in this repo** — not in a comment, not in a
doc, not in a config. No app names, no repository names, no product names, no
"what a particular consumer does". The published packages are the whole interface,
and a consumer's bundler, directory layout and release cadence are none of this
repo's business.

This is not tidiness. Two concrete failures come from breaking it:

- A generated file once landed in a consumer's tree, which meant the generator
  encoded one reader's directory layout and silently produced nothing for
  anyone else.
- Reasoning written as "what our app does" stops being checkable the moment
  that app changes, and nobody here can tell.

Write the platform instead of the product: "a React Native consumer", "a web
consumer", "the consumer's bundler". Ecosystem facts are fine and useful —
Metro resolves `.native`, Vite resolves `.web`, react-native-web renders RN
primitives in a browser — because those are true of anyone.

The one permitted exception is the npm scope and repository owner,
`@insolvia-ai` / `insolvia-ai/design-system`, which are addresses rather than
claims about who consumes what.

## Catalog — need this? read that

| When you're… | Open |
|---|---|
| adding or changing a component | `design-system-component` skill |
| changing the skills consumers install | [`plugins/design-system/README.md`](plugins/design-system/README.md) — bump the plugin, all three manifests |
| adding a skill for working HERE | `.claude/skills/<name>/SKILL.md`, description opening `Contributor.`, and `metadata.internal: true` — without the flag it is offered to third parties installing the consumer skills |
| releasing — version bumps, publishing | `design-system-release` skill |
| opening a PR | `design-system-pr` skill |
| running or setting anything up | [`scripts/README.md`](scripts/README.md) |
| **needing to SEE a component** | `./scripts/dev-up.sh` — both leaves, side by side |
| changing token values | [`packages/tokens/CLAUDE.md`](packages/tokens/CLAUDE.md) — edit `tokens.json`, never a generated file |
| changing how the workbench resolves anything | [`.storybook/main.ts`](.storybook/main.ts) and [`workbench/react-native.ts`](workbench/react-native.ts) |

## Seeing a component

```bash
./scripts/dev-up.sh
```

Merges to `main` also publish the built workbench to GitHub Pages
(`.github/workflows/pages.yml`) — same stories, same gates, no checkout
needed. The local script is for work in progress; the URL is for looking at
what shipped.

Everything else here is blind. Vitest renders into jsdom and asserts on roles
and labels; tsc checks types. Neither can see that something is the wrong
colour, in the wrong place, or painted underneath the thing below it — and that
last one shipped as the 0.7.1 Select bug, whose report opens *"reported from a
real browser, and invisible to every test in this package"*.

`npm run test:a11y` is the one exception, and only for what axe can score: it
runs every story in a real browser, **once per colour scheme**. That second
half is new in 0.11.0 — the gate seeded `light` and nothing else, so every
dark-scheme colour was checked by a human clicking the Scheme toolbar and
`--color-danger` sat at 2.9:1 on the dark canvas, under the 4.5:1 floor, in the
colour `Field.Error` paints its message, green in CI throughout. A story
renders in ONE scheme per run; that is why there are two runs and not one.

The workbench renders **both leaves side by side**, which is the only place the
claim this package rests on — that two implementations of one design agree —
can be checked at all. The Scheme toolbar drives both at once; see
[`workbench/scheme.ts`](workbench/scheme.ts) for why that took more than a CSS
class.

## Always

- This repo is **public** — never commit secrets or credentials. The `.npmrc`
  pattern consumers use reads `${NODE_AUTH_TOKEN}` from the environment; a real
  token must never be written into a tracked file.
- Never commit to `main` — work on a branch and open a PR. CI is the only gate.
- **Any change to a package needs that package's `version` bumped in the same
  PR.** CI fails it otherwise. Both packages publish on merge to `main`, and
  the publish is idempotent by version: an unbumped change merges green,
  publishes nothing, and silently rots the registry.
- **Any change under `plugins/` needs the plugin's `version` bumped** in all
  three manifests (Claude, Codex, Cursor). Same failure, different channel: an
  installed plugin updates only when that string moves, so an unbumped skill
  edit reaches nobody. CI enforces both the bump and that the three agree.
- **Both packages publish SOURCE, and neither has a build step.** That is
  load-bearing for the components: leaf resolution happens in the *consumer's*
  bundler, so the `.web.tsx`/`.native.tsx` pairs must survive into the tarball
  verbatim. A tsup/tsc emit collapses each pair and breaks resolution. Do not
  "fix" this by adding a bundler.
- **Nothing ships one brand.** `tokens.json` is the default theme; both
  platforms have an override seam (CSS custom properties on web,
  `ThemeProvider` on native — see `src/lib/theme.ts`). Components speak the
  semantic layer only, never raw palette names, which is what keeps a re-brand
  a one-place change.
- `npm run ci` runs the whole gate locally — token drift, format, lint, all
  three typecheck programs, tests, and axe over every story.

## Pre-extraction history

Both packages were grafted in with `git subtree`, so every commit that shaped
them is here. Because the paths moved, a path-limited `git log -- packages/…`
stops at the graft commit; plain `git log` shows the whole story.

## What is deliberately NOT here

| Thing | Why |
|---|---|
| Any knowledge of who consumes this | See above. The registry is the interface. |
| A build step | The consumer's bundler picks the leaf; a build would decide for it. |
| A separately-authored component gallery | The workbench IS the gallery: autodocs assembles each component's docs page from the same stories the a11y gate runs, and Pages serves that same build. One source of truth — a hand-written gallery or MDX-per-component site would be a second one, free to drift. (`workbench/workbench.mdx` is the single exception: the front page explaining how to read the rest.) |
