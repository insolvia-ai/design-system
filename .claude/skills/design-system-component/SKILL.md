---
name: design-system-component
description: >-
  How to add or change a component in this package — the three-file split
  (props / .web / .native), which file a given piece of code belongs in, the
  render-time colour rule the native leaves must follow, and the story and tests
  a component owes. Use this BEFORE creating or editing anything under
  packages/design-system/src/, and when deciding whether something can be one
  shared file or must be a leaf pair. Also read it when a leaf will not resolve,
  when a component renders unstyled, or when a change looks right on web and
  wrong on native (or the reverse) — those symptoms all trace back to rules
  here.
---

# Working on a component

## Three files, split by what varies

```
<name>.props.ts    shared: types, variant data, state machines, a11y ids
<name>.web.tsx     React DOM + Tailwind class strings
<name>.native.tsx  React Native primitives + StyleSheet over @insolvia-ai/tokens
<name>/index.ts    re-exports the extensionless "./<name>"
```

The per-component `index.ts` re-exports `'./<name>'` **without an extension**,
and the consumer's bundler resolves it: Vite takes `.web.tsx`, Metro takes
`.native.tsx`. Never add an extension there — that is what hard-codes one
platform for everybody.

**Props modules must not import a renderer.** No `react-native`,
`react-native-web`, `react-dom` or `@base-ui/*` in `*.props.ts` or `src/lib/`.
ESLint enforces it, and it is the rule that keeps react-native-web out of
a web consumer's bundle. The `.native.` infix is what exempts a platform leaf under
`src/lib/`; do not weaken the override to make an import work — move the code.

### One file or a pair?

- **Pure data** — variant maps, class strings, anything with no events, state
  or a11y wiring → it can live in the shared props module.
- **Events, state, or accessibility wiring** → a leaf pair, from day one. A web
  `<label for>` and an RN `accessibilityLabelledBy` are different contracts, not
  different spellings of one contract.

### Keep leaf-to-leaf imports out

A leaf may import another component's **shared** module (`../field/field.props`)
but never another component's leaf or barrel (`../field`). One extensionless
component import from a leaf and the same specifier would have to resolve
`.web` in one context and `.native` in another — which the workbench cannot do
at all, so the native pane would silently show a web component. This invariant
is what makes side-by-side rendering possible; `.storybook/main.ts` depends on
it explicitly.

## Native leaves resolve colours at RENDER time

Never read `colors.light` (or `colors.dark`) at module load. Use
`useNativeColors()` from `src/lib/native-theme.native.ts` inside the component,
and keep `StyleSheet.create` for scheme-independent layout only — it runs once,
at module load, and can never follow the scheme.

0.2.1 shipped all six native leaves reading `colors.light` at load, so every
design-system surface stayed light inside a dark app. The whole class of bug is
invisible to the tests and obvious in the workbench, one toolbar click apart.

## No hard-coded colours, radii or spacing

Everything comes from `@insolvia-ai/tokens`, semantic layer only (`primary`,
`bg`, `ink`, `muted`, `line`, `card`, `danger`, …) — never palette names. That
is what makes a re-brand a one-file change. To change a value, edit
`packages/tokens/tokens.json` and run `npm run tokens`; never hand-edit a
generated file.

## What a component owes

- **≥1 behavioural test** against the `.web` leaf (Vitest + Testing Library).
  Props modules with real logic get direct unit tests. No snapshot tests.
- **A native test** if the native leaf carries a11y or state wiring. The Field
  label wiring shipped broken in 0.2.1 precisely because only `.web` was
  tested. Native tests are `*.native.test.tsx` beside the leaf.
- **A story** in `workbench/`, pairing both leaves via `<LeafPair>`. A story is
  the only thing that can show the two leaves agreeing.
- **All three typecheck programs passing** — `npm run typecheck` chains the web
  program, the RN program (real `react-native` types, no DOM lib) and the
  native-test program. If tsc cannot see an extensionless leaf import, fix the
  `moduleSuffixes` list; never add extensions to the index re-exports.

## Before you finish

```bash
npm run ci
```

```bash
./scripts/dev-up.sh
```

Look at the component in both schemes and in both panes. The tests assert roles
and labels in jsdom; they cannot see wrong colour, wrong place, or painted
underneath — which is exactly what 0.7.1 was.

**Any change here needs a version bump** — see `design-system-release`.
