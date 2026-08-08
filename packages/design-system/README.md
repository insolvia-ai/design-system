# @insolvia-ai/design-system

An owned, cross-platform design system, published as
`@insolvia-ai/design-system`. One set of component names serves both front-end
stacks: React DOM + Tailwind on the web, and React Native. Agent rules:
[`CLAUDE.md`](CLAUDE.md).

It succeeded a web-only predecessor (0.1.x, Base UI), retired at 0.2.x.

## Components

Forty-one components, shelved the way a component library's documentation site
conventionally shelves them — by what you reach for them FOR. The workbench's
sidebar uses these same five groups in this same order (`.storybook/preview.tsx`
pins it), so the catalogue and the place you look at it agree.

**Data display** — what shows something.

`Accordion` · `Alert` · `Avatar` · `Badge` · `Breadcrumbs` · `Card` ·
`Collapsible` · `Meter` · `Progress` · `Ribbon` · `Spinner` · `Table` · `Tabs` ·
`Text`

**Overlays** — what floats above the page.

`AlertDialog` · `Dialog` · `Drawer` · `Dropdown` · `Popover` · `Sidebar` ·
`Toast` · `Tooltip`

**Forms** — what takes input.

`Button` · `Checkbox` · `CheckboxGroup` · `Combobox` · `Field` · `Input` ·
`InputGroup` · `RadioGroup` · `Select` · `Switch` · `Textarea` · `Toggle` ·
`ToggleGroup`

**Dates** — the typed and the pointed way to say the same thing. They share
`daysInMonth` and `isRealDate`, because they must agree about what a date is.

`Calendar` · `DateInput`

**Layout** — page furniture. This shelf is ours; the convention above has no
home for it.

`Footer` · `NavBar` · `Separator`

Two conventions run through all of them: compound components export their parts
under one name (`Dialog.Root`, `Dialog.Trigger`, …), and input-taking components
support both uncontrolled (`default*`) and controlled (`*` + change callback)
modes via `src/lib/controllable.ts`.

### How it got here

The original surfaces were `Accordion` · `Button` · `Card` · `Field` · `Footer` ·
`NavBar`. 0.3.0 added owned equivalents of the portable Base UI primitives
(equivalent behavior, zero Base UI dependency): `AlertDialog` · `Avatar` ·
`Checkbox` · `CheckboxGroup` · `Collapsible` · `Dialog` · `Meter` · `Progress` ·
`RadioGroup` · `Separator` · `Switch` · `Tabs` · `Toggle` · `ToggleGroup`. 0.4.0
added `Select`, the first anchored-popup component — see the note below on why
it stopped being deferred. 0.5.0 added `DateInput`, a masked `YYYY-MM-DD` text
field with no calendar (the reasoning is at the top of `date-input.props.ts`);
0.6.0 gave its `onValueChange` a second argument, because `''` alone cannot
distinguish "cleared" from "still typing" and an autosaving caller wiped saved
dates on that ambiguity.

**0.11.0 added nineteen components and two parts** — `Text` · `Badge` ·
`Spinner` · `Alert` · `Ribbon` · `Breadcrumbs` · `Table` · `Input` · `Textarea` ·
`InputGroup` · `Combobox` · `Tooltip` · `Popover` · `Dropdown` · `Drawer` ·
`Toast` · `Sidebar` · `Calendar`, plus `Avatar.Group` and `Card.Image` — closing
the gap against a mainstream React component library's catalogue.

That wave answers most of the deferral list this section used to carry, so the
list is reproduced here with what actually happened to each:

- **Hover-only surfaces (Tooltip)** — "inaccessible on touch" was the right
  objection and is answered rather than waived: the native leaf summons the
  bubble with a long press and the web leaf with hover *and focus*, while the
  `aria-describedby` association is shared. `tooltip.props.ts` argues it.
- **Anchored popups (Popover, Menu, Combobox)** — these anchor to their own
  trigger, which is the case `Select` already showed needs no positioning
  primitive: the popup is placed against the control it belongs to. The mobile
  idiom gap is real and documented at the seam — a native Popover and Dropdown
  have no press-outside dismissal, because RN has no document to listen to and
  both workarounds defeat the non-modal point.
- **Toast** — now has the app-level provider it needed: `Toast.Provider` owns
  the store, `useToast()` is the imperative handle, `Toast.Viewport` renders
  the stack.
- **`Input` overlapping with `Field`** — resolved by composition rather than by
  duplication. `Input` and `Textarea` read `Field`'s context for their id,
  name, description and invalid state, exactly as `Select` and `DateInput`
  already do, so a field's wiring still lives in one place.

Still not ported, and still for the original reasons: desktop-menu surfaces
(Menubar, Navigation Menu), Preview Card, Number Field, Scroll Area and Context
Menu — each needs a desktop-first interaction model with no touch counterpart
worth the surface area.

**`Select` came off that list in 0.4.0**, because the intake questionnaire
needs it and a form cannot route around a missing select. The two reasons it
was deferred were answered rather than waived: positioning is an absolute
anchor under a full-width trigger, which needs no positioning primitive because
the popup is exactly as wide as the control; and the mobile sheet idiom is not
needed while the only target is web — the native leaf's popup renders inline,
with a comment saying what a real device would want instead. Anything that has
to float free of its trigger (Popover, Menu) still needs the deferred design
pass; a select does not.

## The pattern: one props module, two leaves

Every component is three files:

```
src/button/
  button.props.ts    shared: types, variant maps, state hooks, a11y string rules
  button.web.tsx     React DOM + Tailwind — what a web consumer renders
  button.native.tsx  React Native primitives over @insolvia-ai/tokens
  index.ts           re-exports the extensionless "./button"
```

The per-component `index.ts` deliberately imports `"./button"` with no
extension — **the consumer's bundler picks the leaf**:

| Consumer | Bundler | Leaf | Why |
| --- | --- | --- | --- |
| Web app | Vite | `.web.tsx` | Tailwind classes over `theme.css` |
| React Native app | Metro | `.native.tsx` | RN primitives, token values |
| React Native app, on web | Metro | `.native.tsx` | react-native-web renders the RN tree; a consumer with no Tailwind pipeline would get an unstyled `.web` leaf |

The native leaves resolve their **colors at render time** through
`src/lib/native-theme.native.ts` (`useNativeColors()` — anything but `'dark'`
resolves to light). A color read statically —
`colors.light` at module load, or a color inside `StyleSheet.create` — can
never follow the OS scheme: 0.2.1 shipped exactly that, and every surface
stayed light inside a dark app. Only scheme-independent layout belongs in
`StyleSheet.create`.

Consumers override those colors with `ThemeProvider` (see *Theming* below);
`useNativeColors()` merges the overrides over the token defaults.

The props module is the platform-SHARED third and must never import a
renderer — no `react-native`, no `react-dom`, no `@base-ui/*`. That rule is
what keeps react-native-web out of a web consumer's bundle, so it is machine-
enforced: `eslint.config.js` bans those imports in `**/*.props.ts` (and
`src/lib/`), and it was measured — a web build from these leaves is
byte-equivalent to the predecessor package's, with zero react-native-web.

**Litmus test for a new component:** pure data (variant → class/value maps)
is a candidate to collapse into a single shared file later; anything with
events, state, or accessibility wiring is a leaf pair from day one — the two
platforms' event and a11y models do not unify.

## One channel: the registry

Every consumer installs this package **by published version**. That is why
**any change here is its own PR with a `version` bump** — nothing you merge
reaches any consumer until it publishes and that consumer bumps its dependency.

It was not always one channel. A consumer once lived in the same monorepo and
resolved this package's **source** through a workspace symlink, so a merge here
was live for that reader immediately — no publish, no version — while every
other consumer saw nothing until a release. One package, two truths, and no way
to tell from inside which one you were testing against. Don't reintroduce a
path-based consumer: no `file:`, no `link:`, no workspace member.

## Theming

Nothing here ships one brand. `tokens.json` holds the default theme and both
platforms have an override seam.

Web — override the semantic custom properties after importing `theme.css`.
Derived states follow automatically, being `color-mix()` over the base:

```css
@import '@insolvia-ai/design-system/theme.css';
:root {
  --color-primary: #155e63;
}
```

React Native — wrap the tree in `ThemeProvider`:

```tsx
import { ThemeProvider } from '@insolvia-ai/design-system';

<ThemeProvider theme={{ light: { primary: '#155E63' }, dark: { primary: '#7FD1D9' } }}>
  <App />
</ThemeProvider>;
```

Overrides are partial — supply only the roles you change — and speak the
**semantic** layer only; raw palette names are exported nowhere, which is what
keeps a re-brand a one-place change. One asymmetry: on native the derived states
(`primaryHover`, …) are pre-computed, so overriding `primary` alone does not
move them; override them explicitly. On web they follow.

## No build step — the package publishes source

`files: ["src"]`, exports point at `.ts`/`.tsx`, and there is no tsup/tsc
emit. Leaf resolution happens in the consumer's bundler, so the
`.web.tsx`/`.native.tsx` pairs must survive into the published artifact
verbatim; a package-side build would collapse each pair into one compiled
entry and break the pattern.

## theme.css is generated

`src/styles/theme.css` (public specifier
`@insolvia-ai/design-system/theme.css`) is rendered from
`packages/tokens/tokens.json` — never hand-edit it. Change a value
there, then `npm run tokens` from the repo root; `npm run tokens:check` gates
drift in CI.

## Checks

```bash
npm run lint            --workspace @insolvia-ai/design-system
npm run typecheck       --workspace @insolvia-ai/design-system   # all three programs
npm run typecheck:native --workspace @insolvia-ai/design-system  # RN program only
npm run test            --workspace @insolvia-ai/design-system   # web + native projects
```

Typechecking is split because the imports are: each tsconfig sets
`moduleSuffixes` (`[".web", ""]` / `[".native", ""]`) so tsc resolves the same
extensionless imports to the same leaves the bundlers do. A third program,
`tsconfig.native.test.json`, checks the native-leaf tests (native suffixes
plus the DOM lib, since those tests assert on react-native-web's DOM).

Tests run as two vitest projects (`vitest.config.ts`): `web` is Vitest +
Testing Library against the `.web` leaves, resolved web-first as Vite does;
`native` resolves the `.native` leaves native-first as Metro does and aliases
`react-native` to `react-native-web` — the exact pair a React Native consumer ships on web —
rendering them into the same jsdom. `vitest.native.setup.ts` supplies the
`matchMedia` mock that drives `prefers-color-scheme` in those tests. Props
modules with real logic keep direct unit tests. Native tests live in
`*.native.test.tsx` beside the leaf; Button and Field carry the a11y wiring
and must keep native coverage.
