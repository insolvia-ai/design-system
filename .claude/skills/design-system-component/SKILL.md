---
name: design-system-component
description: >-
  Contributor. How to add or change a component in this package — the
  three-file split (props / .web / .native), which file a given piece of code
  belongs in, what to NAME a prop, the render-time colour rule the native
  leaves must follow, and the story and tests a component owes. Use this BEFORE
  creating or editing anything under packages/design-system/src/, when deciding
  whether something can be one shared file or must be a leaf pair, and when
  picking a prop name or adding a value to a variant axis — `intent`, `tone`,
  `variant` and `size` each already mean a specific thing here. Also read it
  when a leaf will not resolve, when a component renders unstyled, or when a
  change looks right on web and wrong on native (or the reverse) — those
  symptoms all trace back to rules here.
metadata:
  internal: true
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

## Naming a component's public API

Four axis names recur, and each means something different. Reach for the one
that fits rather than a synonym: there is no human reviewer to catch a
component that ships `appearance` because nobody looked at what Button called
it, and a consumer holding both cannot tell why they differ.

| Axis | Means | Values in use |
|---|---|---|
| `intent` | what the element MEANS | `info \| success \| warning \| danger` (Alert, Toast), plus `neutral`/`primary` (Badge); Button reads it as emphasis — `primary \| secondary \| ghost` |
| `tone` | colour emphasis carrying NO semantics | Ribbon `primary \| neutral`, Text `ink \| muted \| primary` |
| `variant` | shape or role, never colour | Text `display \| heading \| title \| body \| caption` |
| `size` | `sm \| md \| lg`, or a subset | Avatar, Badge, Button, Spinner — never a number |

Booleans are bare and unprefixed — `disabled`, `open`/`defaultOpen`,
`invalid` — never `isDisabled`. **`kind` is spoken for** — it is the
discriminant on internal state-machine action unions (`calendar.props.ts`,
`combobox.props.ts`), so a public `kind` prop would collide with the one
vocabulary the props modules already use for something else.

A component may own an axis none of the four describe — Card's `elevation`
(`flat | raised`) is one, and it earned the name by describing something no
existing axis covers, not by renaming one that does. That is the bar.

Either way the axis gets an exported type named `<Component><Axis>`
(`ButtonIntent`, `CardElevation`), exported from `src/index.ts` alongside the
component — that barrel is the source of truth for what the package exports,
and an axis a consumer cannot name in its own types is one it cannot wrap.

**A new value on an axis is not free.** It costs a matching block in the
native leaf forever, and it has to survive contrast in BOTH schemes —
`text.props.ts` documents the three tones that exist and the three that were
rejected with measured ratios, because a `warning` tone is unreadable in light
and a `danger` tone in dark. Before adding a value, check whether `className`
(web) / `style` (native) already covers the caller.

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
- **A story** in `workbench/`, pairing both leaves via `<LeafPair>` — see "The
  story a component owes" below for what it must cover.
- **All three typecheck programs passing** — `npm run typecheck` chains the web
  program, the RN program (real `react-native` types, no DOM lib) and the
  native-test program. If tsc cannot see an extensionless leaf import, fix the
  `moduleSuffixes` list; never add extensions to the index re-exports.

### The story a component owes

`workbench/<name>.stories.tsx`, following `button.stories.tsx` (single
component), `select.stories.tsx` (controlled/uncontrolled plus a permanent
regression story), or `dialog.stories.tsx` (parts object, portaled overlay) —
pick whichever shape matches.

**Coverage.** `Basic` is the default `<LeafPair>` pairing, driven by
meta-level `args`. Add `Appearance`/`Sizes`/`Disabled`/state stories as the
component has variants worth seeing side by side. A story added to pin a
regression (Select's `OpenInsideAForm`, the 0.7.1 fix) is permanent — never
delete it, even once the bug feels ancient. It is the only place left where a
human eye can still see the symptom.

**Args are typed against `<name>.props.ts`**, never against either leaf —
declare a story-local `type XxxArgs` and thread it EXPLICITLY, prop by prop,
through a meta-level `render` into BOTH leaves. Never `{...args}`. That is
what lets `typecheck:workbench` catch a bad prop NAME against both leaves at
once — the 0.8.3 lesson: `intentStyles['danger']` silently went `undefined`
because stories then sat outside every tsconfig program, and explicit
threading turns that class of bug into a compile error instead. Where the
leaves disagree on a handler's name (web `onClick`, native `onPress`), the
story owns exactly ONE bridging arg (e.g. `onPress`) and `render` wires it to
each leaf's own prop. Every handler arg is `fn()` from `'storybook/test'`, so
the Actions panel logs it and a play can assert calls against it.

**`component:` in meta** is the web leaf (`component: ButtonWeb`) for a single
component — it only feeds the docs props table (react-docgen is best-effort
under this framework; see `.storybook/main.ts`), controls never rely on it.
Omit it for a parts object (Dialog): no single component owns that surface,
and react-docgen has nothing to say about a namespace. Controls are always
declared BY HAND in `argTypes`, never inferred. Option lists get a
module-level `const X = [...] as const satisfies readonly T[]` tied to the
props type — the same drift guard as the args typing above. An arg that only
seeds uncontrolled state (`defaultValue`) gets `control: false`; a control
that does nothing teaches the wrong lesson about the prop.

**Interactive components MUST have a `play`.** `story-coverage.test.ts`
enforces this through a hard-coded `INTERACTIVE` list — adding an interactive
component means adding it to that list, not just writing the play. Inside a
play, scope every query through `pair(canvasElement)` from `leaf-pair.tsx`,
never a bare `canvasElement` query: every `<LeafPair>` story renders the
component TWICE, so an unscoped query finds duplicates and throws. The one
exception is a portaled overlay (Dialog, AlertDialog), which escapes both
panes into `document.body` — reach it with `screen` from `'storybook/test'`
instead, open only one leaf at a time, and end with both closed (two open
modals fight over focus and `aria-hidden`; `dialog.stories.tsx`'s file header
has the full reasoning).

**Play craft**, one line each:
- Assert a shared `fn()` arg's call COUNT per pane, not just its last call —
  the two panes share one arg, so a pane that silently drops input is
  otherwise vouched for by the other pane's earlier call.
- Call `el.focus()` before `userEvent.keyboard` on an RNW `Pressable` — a
  click does not focus it, so unfocused keyboard input goes nowhere.
- Never commit or toggle a native `Pressable` with `{Enter}`/`{Space}` in a
  play — react-native-web synthesizes a second `onPress` from the keypress
  (see the native Select workaround comment in `select.stories.tsx`), so a
  commit is immediately toggled back open.
- Wrap an unmount assertion (`not.toBeInTheDocument()`) in `waitFor`.
- Assert `disabled`, don't click it — web `toBeDisabled()`, native
  `aria-disabled` (react-native-web can only speak ARIA, not the real
  attribute).
- END a play in the expanded/open state, except a modal — axe runs AFTER the
  play, so whatever state the play leaves the component in is the state that
  gets audited.

**Docs.** JSDoc above `meta` becomes the component's autodocs summary; JSDoc
above a story becomes what to look at on that story's docs entry (see the
addon-docs note in `.storybook/main.ts` — nothing here is authored twice, so
nothing can drift). A story that must render a deliberately-invalid state
scopes the a11y exception to itself — `parameters: { a11y: { test: 'todo' } }`
— with a comment saying why, rather than weakening the gate for everyone (see
`a11y.test` in `preview.tsx`).

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
