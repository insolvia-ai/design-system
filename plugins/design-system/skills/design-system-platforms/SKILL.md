---
name: design-system-platforms
description: >-
  Consumer. Understand and debug how one component name in
  @insolvia-ai/design-system resolves to two implementations — a .web.tsx leaf
  under Vite, a .native.tsx leaf under Metro, and the .native leaf again when a
  React Native app runs in a browser through react-native-web. Use when a leaf
  will not resolve, when a component renders unstyled or looks right on one
  platform and wrong on the other, when react-native-web turns up in a web
  bundle, when deciding what to install for a React Native app, or when tempted
  to import a component by its explicit .web or .native path.
---

# How one component becomes two implementations

## The three-file split

Every component is three files plus an index:

```
button.props.ts    shared contract — types, variant data, state, a11y rules
button.web.tsx     React DOM + Tailwind
button.native.tsx  React Native primitives over the design tokens
index.ts           re-exports the extensionless "./button"
```

That extensionless re-export is the whole mechanism. **Your bundler picks the
leaf**, which is also why the package publishes source with no build step: a
compile step would collapse each pair into one entry and decide the platform for
everybody.

| You are | Bundler | Leaf you get |
| --- | --- | --- |
| A web app | Vite | `.web.tsx` — Tailwind classes over `theme.css` |
| A React Native app | Metro | `.native.tsx` — RN primitives, token values |
| A React Native app running in a browser | Metro | `.native.tsx`, rendered by react-native-web |

That third row is not a mistake. A React Native codebase on the web keeps its
native leaf; react-native-web renders the RN tree in the browser. Such a
consumer has no Tailwind pipeline, so a `.web` leaf would arrive unstyled.

## Import from the package root, always

```tsx
import { Button } from '@insolvia-ai/design-system';
```

Never import a leaf by its explicit path. `…/button.web` hard-codes one platform
at the call site, which is exactly what the pattern exists to avoid — and it
compiles cleanly, so nothing tells you until the other platform renders wrong.

## What to install

`react` and `react-dom` are peer dependencies. `react-native` is **not declared
at all** — not as a dependency, not as an optional peer — so a web consumer is
never made to install a native renderer it will never load. The native leaves
resolve `react-native` from *your* dependencies, which a React Native app has
anyway.

`@insolvia-ai/tokens` is likewise not declared. Install it only if you read
token values yourself.

## Symptoms and causes

| Symptom | Cause |
| --- | --- |
| Component renders unstyled on web | Usually Tailwind never scanned the package — see the `design-system-setup` skill's `@source` note. If your app is React Native on web, check you are actually getting the `.native` leaf. |
| `react-native-web` appears in a web bundle | Something reached a `.native` leaf. Check for an explicit `.native` import, or a resolver whose extension order puts `.native` first. |
| Right on web, wrong on native (or the reverse) | The two leaves genuinely differ. Compare them in the workbench before assuming it is your call site. |
| Build error on a type annotation inside `node_modules` | Your bundler is not transforming the TypeScript this package publishes. |
| A colour follows the scheme on web but not on native | Native resolves colours at render time through the theme hook; a value read statically cannot follow. If it is your own code, read colours inside the component, not at module load. |
| Cannot import a compound part | Parts hang off the parent: `Dialog.Trigger`, not a `DialogTrigger` export. |

## Where the platforms genuinely disagree

Some gaps are documented and intentional rather than bugs. The clearest: a
native `Popover` and `Dropdown` have no press-outside dismissal, because React
Native has no document to listen to and the available workarounds defeat the
point of a non-modal surface. Provide an explicit way to close on native.

Before filing a difference as a bug, look at the component in the workbench at
<https://insolvia-ai.github.io/design-system/>, which renders both leaves side
by side. If they disagree there, it is the package's problem; if they agree
there and not in your app, it is resolution or theming.
