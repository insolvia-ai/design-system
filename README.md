# Design system

Two published packages in one npm workspace:

| Package | Directory | What it is |
|---|---|---|
| `@insolvia-ai/design-system` | [`packages/design-system`](packages/design-system) | Platform-split components — one props module, a React DOM + Tailwind web leaf, a React Native leaf |
| `@insolvia-ai/tokens` | [`packages/tokens`](packages/tokens) | One `tokens.json` rendered into typed TypeScript, Tailwind custom properties, and plain JSON |

Both publish to **GitHub Packages**. Agent rules: [`CLAUDE.md`](CLAUDE.md).

## One design, two implementations

Each component is three files:

```
<name>.props.ts    shared contract — types, variant data, state machines
<name>.web.tsx     React DOM + Tailwind
<name>.native.tsx  React Native primitives over the tokens
```

The per-component index re-exports the extensionless `./<name>`, and **the
consumer's bundler picks the leaf** — Vite resolves `.web.tsx`, Metro resolves
`.native.tsx`. That is why both packages publish `src/` as-is with no build
step: leaf selection belongs to the consumer, so the pairs must survive into
the tarball verbatim.

The claim this rests on is that the two leaves agree. `./scripts/dev-up.sh`
renders them side by side so you can check it.

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
dark. It is the only place you can see whether the two implementations agree,
and the only check that catches wrong colour, wrong position, or one element
painted under another. The unit tests cannot: they assert roles and labels in
jsdom.

To run the full gate:

```bash
npm run ci
```

That is token drift, Prettier, ESLint, all three TypeScript programs (web,
React Native, native-test), the Vitest suites, and axe over every story in a
real browser. It mirrors `.github/workflows/pr.yml`.

## Theming

Nothing here is meant to ship one brand. `tokens.json` holds the **default**
theme, and both platforms have an override seam:

**Web** — override the semantic custom properties after importing the
stylesheet. Derived states follow automatically, because they are `color-mix()`
over the base:

```css
@import 'tailwindcss';
@import '@insolvia-ai/design-system/theme.css';

:root {
  --color-primary: #155e63;
}
```

**React Native** — wrap the tree in `ThemeProvider`:

```tsx
import { ThemeProvider } from '@insolvia-ai/design-system';

<ThemeProvider theme={{ light: { primary: '#155E63' }, dark: { primary: '#7FD1D9' } }}>
  <App />
</ThemeProvider>;
```

Overrides are partial — supply only the roles you are changing. Speak the
**semantic** layer only (`primary`, `bg`, `ink`, `muted`, `line`, `card`,
`danger`, …); raw palette names are not exported in either direction, which is
what keeps a re-brand a one-place change.

One asymmetry worth knowing: on native the derived states (`primaryHover`,
`primaryActive`, …) are pre-computed values, so overriding `primary` alone does
**not** move them — override them explicitly if they matter. On web they
follow, because there they really are live blends.

## Making a change

1. Branch off `main`.
2. Make the change, and **bump the `version` of every package you touched** —
   CI fails the PR otherwise, and an unbumped change would merge green and
   publish nothing.
3. Open a PR. CI is the only gate.
4. On merge, each package whose version is not yet in the registry publishes
   automatically.

## Consuming these packages

They live on GitHub Packages, which requires a token for **every** read — even
for public packages. Consumers commit an `.npmrc` that reads it from the
environment:

```
@insolvia-ai:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

and supply `NODE_AUTH_TOKEN` at install time. Never commit a real token.

**Install by version, never by path.** A `file:` or `link:` dependency on a
local checkout gives one package two simultaneous truths — what the consumer
reads and what the registry holds — and the two drift the moment either moves.
To try an unreleased change, publish a prerelease.

## Agent skills

Consumers can hand their coding agent the same knowledge: setting the packages
up, choosing a component, re-branding, and reading what happens when one
component name resolves to two implementations.
[`plugins/design-system`](plugins/design-system) holds them.

**Claude Code** — add this repository as a plugin marketplace, then install:

```
/plugin marketplace add insolvia-ai/design-system
```

```
/plugin install design-system@insolvia-ai
```

No registry token is needed for this: the marketplace is the public
repository, not the private package registry. Updates follow `main`.

**Every other agent** — Cursor, Codex, Copilot, Windsurf, Gemini, Cline and the
rest — via the skills CLI:

```bash
npx skills@latest add insolvia-ai/design-system --skill design-system-setup --skill design-system-catalogue --skill design-system-theming --skill design-system-platforms
```

**Name the skills explicitly, as above; never `--skill '*'`.** That CLI walks
the whole repository, `.claude/skills` included, and those skills are for
working *in* here — they would tell a consumer's agent to bump versions and open
PRs in a repo it does not have. Every description declares its audience
(`Consumer.` / `Contributor.`) as a second line of defence, and
`npm run skills:check` enforces it.
