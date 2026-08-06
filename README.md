# Insolvia design system

Two published packages in one npm workspace:

| Package | Directory | What it is |
|---|---|---|
| `@insolvia-ai/design-system` | [`packages/design-system`](packages/design-system) | Platform-split components — one props module, a React DOM + Tailwind web leaf, a React Native leaf |
| `@insolvia-ai/tokens` | [`packages/tokens`](packages/tokens) | One `tokens.json` rendered into typed TypeScript, Tailwind custom properties, and plain JSON |

Both publish to **GitHub Packages** and are consumed by
[`insolvia-ai/insolvia`](https://github.com/insolvia-ai/insolvia) — the Expo app
and the marketing site.

Agent rules: [`CLAUDE.md`](CLAUDE.md).

## Why this is its own repo

The design system used to be a package inside the `insolvia-ai/insolvia`
monorepo. That gave it two consumers on two *different* channels: the marketing
site installed the published version from the registry, while the app — a
sibling workspace member — read the package's **source** through a symlink.

One package, two truths. A change was simultaneously live (for the app) and
invisible (for marketing), which made it genuinely difficult to answer "what
does this package do right now?" without knowing which consumer was asking. The
usual failure was subtler than a broken build: a change tested fine against the
app's live source and only surfaced against marketing after a publish.

Extracting it removes the second channel. There is now one way for anything
here to reach a consumer — publish a version — and the consuming repo bumps a
dependency to take it.

## Getting started

```bash
./scripts/dev-setup.sh
```

Then, to look at components:

```bash
./scripts/dev-up.sh
```

That opens the workbench on `http://localhost:6006` — every component with its
**web leaf and native leaf side by side**, and a toolbar that flips both to
dark. It is the only place in either repo where you can see whether the two
implementations of a component actually agree, and the only instrument that
catches wrong colour, wrong position, or one element painted under another. The
tests cannot: they assert roles and labels in jsdom.

To run the full gate:

```bash
npm run ci
```

`ci` is the full local gate: token drift check, Prettier, ESLint, all three
TypeScript programs (web, React Native, native-test), and the Vitest suites.
It mirrors what `.github/workflows/pr.yml` runs.

To regenerate the token outputs after editing `packages/tokens/tokens.json`:

```bash
npm run tokens
```

## Making a change

1. Branch off `main`.
2. Make the change, and **bump the `version` of every package you touched** —
   CI fails the PR otherwise, and an unbumped change would merge green and
   publish nothing.
3. Open a PR. CI is the only gate.
4. On merge, each package whose version is not yet in the registry publishes
   automatically.
5. To get the change into the app or marketing site, bump the dependency in
   `insolvia-ai/insolvia`.

## Consuming these packages

Both live on GitHub Packages, which requires a token for **every** read — even
for public packages. Consumers commit an `.npmrc` that reads the token from the
environment:

```
@insolvia-ai:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

and supply `NODE_AUTH_TOKEN` at install time (`secrets.GITHUB_TOKEN` in CI, or
`gh auth token` with the `read:packages` scope locally). Never commit a real
token — this repo and its consumer are public.
