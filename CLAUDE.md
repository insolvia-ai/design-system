# design-system — agent guide

Insolvia's design system and its design tokens, as **two published npm
packages** in one workspace. Everything here ships to consumers in
[`insolvia-ai/insolvia`](https://github.com/insolvia-ai/insolvia) through the
GitHub Packages registry, and through nothing else.

```
packages/tokens          @insolvia-ai/tokens          one JSON source → TS, CSS, JSON
packages/design-system   @insolvia-ai/design-system   platform-split components
```

Each package has its own `CLAUDE.md` (that package's rules — read it before
editing there) and a `README.md` for humans. One owner per fact — link, never
restate.

## The one rule this repo exists to enforce

**There is exactly one way out of here: publish a version.**

Until 0.5.x the design system was a member of the `insolvia-ai/insolvia` npm
workspace. The Expo app consumed its **source** through a workspace symlink
plus a Metro `resolveRequest`, while the marketing site consumed the
**published** version. The same package therefore had two different truths at
once — a local edit was already live for one consumer and invisible to the
other — and no amount of care inside the package could reconcile them.

So: **never add a path-based or symlink channel to a consumer.** If a task
seems to need one, it is the task that is wrong.

The corollary, which is where changes here usually go astray:

- **Do not add dependencies to `@insolvia-ai/design-system`.** Not
  dependencies, not peerDependencies, optional or otherwise. GitHub Packages
  strips `peerDependenciesMeta` from registry metadata, so npm promotes an
  "optional" peer to a required one and every web consumer is forced to install
  a native renderer it never loads. `react-native` and `@insolvia-ai/tokens`
  are imported only by `.native` leaves, which no web resolver can reach, and
  they resolve from the consumer's own dependencies.
  [`packages/design-system/package.json`](packages/design-system/package.json)'s
  comment block owns the full reasoning — read it before touching that
  manifest.

## Always

- This repo is **public** — never commit secrets, credentials, or customer
  data. The committed `.npmrc` in consumers reads `${NODE_AUTH_TOKEN}` from the
  environment; a real token must never be written into a tracked file.
- Never commit to `main` — work on a branch and open a PR. CI is the only gate.
- **Any change to a package needs that package's `version` bumped in the same
  PR.** CI fails the PR otherwise. Both packages publish on merge to `main`,
  and the publish job is idempotent by version: an unbumped change merges
  green, publishes nothing, and silently rots the registry.
- **Both packages publish SOURCE, and neither has a build step.** That is
  load-bearing for the design system — leaf resolution happens in the
  *consumer's* bundler, so the `.web.tsx`/`.native.tsx` pairs must survive into
  the tarball verbatim. A tsup/tsc emit would collapse each pair into one entry
  and break the pattern. Do not "fix" this by adding a bundler.
- `npm run ci` at the root runs the whole gate locally — token drift, format,
  lint, all three typecheck programs, tests. Green locally is a fair predictor
  of a green PR.

## Pre-extraction history

Both packages were grafted in with `git subtree`, so every commit that shaped
them is here. Because the paths moved, a path-limited `git log -- packages/…`
stops at the graft commit; plain `git log` shows the whole story, and the graft
commit names the source SHA in `insolvia-ai/insolvia`.

## What is deliberately NOT here

| Thing | Where it lives | Why |
|---|---|---|
| Cognito managed-login branding | `insolvia-ai/insolvia`, `infra/modules/auth/` | It is that repo's infrastructure. It reconciles against the **published** `@insolvia-ai/tokens/colors.json`; the generator here must never write outside this repo. |
| The app, the marketing site | `insolvia-ai/insolvia` | They are consumers. Their bundler config, not this repo's, decides which leaf resolves. |
| A component gallery / Storybook | nowhere yet | Not built. Don't add one as a side effect of another task. |
