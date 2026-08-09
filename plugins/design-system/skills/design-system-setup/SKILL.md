---
name: design-system-setup
description: >-
  Consumer. Install and wire up @insolvia-ai/design-system for the first time —
  the GitHub Packages token every read needs, the .npmrc that reads it from the
  environment, importing theme.css into a Tailwind v4 entrypoint, making
  Tailwind see class strings that live in node_modules, telling a bundler to
  transform the TypeScript these packages publish, and how dark mode is turned
  on for each platform. Use when adding these packages to a project, when
  install returns 401 or 404 for the @insolvia-ai scope, when components render
  completely unstyled on the web, or when dark mode does not follow.
---

# Setting up @insolvia-ai/design-system

## 1. Authentication — needed for every read

Both packages live on **GitHub Packages**, which requires a token for every
read, including public packages. There is no anonymous install.

Commit an `.npmrc` that reads the token from the environment, never the token
itself:

```
@insolvia-ai:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Supply `NODE_AUTH_TOKEN` at install time — locally from a shell profile or
secret manager, in CI from a secret. A classic PAT with `read:packages` is
enough.

## 2. Install

```bash
npm install @insolvia-ai/design-system
```

`react` and `react-dom` are peer dependencies. `@insolvia-ai/tokens` is a
separate package you only need if you read token values yourself; the
components already carry the defaults.

**Install by version, never by path.** A `file:` or `link:` dependency on a
checkout gives the package two simultaneous truths — what you read and what the
registry holds — and they drift the moment either side moves. To try an
unreleased change, publish a prerelease.

## 3. Web wiring

Tailwind **v4** is required. Import the stylesheet from your CSS entrypoint,
after Tailwind itself:

```css
@import 'tailwindcss';
@import '@insolvia-ai/design-system/theme.css';
```

Then two things that are easy to miss:

**Tailwind must be told to scan the package.** The web leaves' class strings
live in `node_modules`, which Tailwind v4's automatic source detection skips.
Without this, every component renders unstyled while your own markup looks fine:

```css
@source '../node_modules/@insolvia-ai/design-system';
```

Adjust the relative path so it points from your CSS file at the installed
package.

**Dark mode is an attribute, not a media query.** Set `data-theme="dark"` on a
root element:

```html
<html data-theme="dark"></html>
```

Every web leaf reads the semantic custom properties under that selector, so
nothing else changes.

## 4. React Native wiring

There is no stylesheet to import — the native leaves carry their own values.
Two differences from web:

- **Dark mode follows the OS**, through React Native's `useColorScheme()`.
  There is no attribute to set, and no way to force a scheme from this package.
- **`ThemeProvider` is the only re-branding seam.** It is optional; without it
  you get the default theme. See the `design-system-theming` skill.

`react-native` is deliberately not declared as a dependency of this package —
it resolves from your own. Same for `@insolvia-ai/tokens`.

## 5. These packages publish TypeScript source

There is no build step and no compiled `dist`. `exports` points straight at
`.ts` and `.tsx` files, because leaf selection has to happen in *your* bundler
(see the `design-system-platforms` skill for why).

The consequence: whatever compiles your app has to transform this package too.
Metro does by default. Bundlers that skip `node_modules` when transforming
TypeScript need to be told to include `@insolvia-ai/design-system` — the symptom
is a syntax error on a type annotation or on JSX coming from inside
`node_modules`, at build time rather than at runtime.

## Staying current

These are `0.x` packages, and npm's caret rules for `0.x` are narrower than most
people expect: `^0.12.0` means `>=0.12.0 <0.13.0`. **A minor release does not
reach you until you widen the range yourself.** Patches arrive on your next
install; new components, new props and visual changes do not. Check for a newer
minor deliberately — a consumer once sat five minors behind with nothing
surfacing the gap.

Deprecations reach you the same way nothing else here can. Because the package
publishes source, your TypeScript reads the real props module, so a `@deprecated`
tag shows up struck through in your editor, naming its replacement and the
version that removes it. Anything removed is deprecated in one minor first and
removed in a later one, never in a patch — so a struck-through prop is a
deadline, not a suggestion. Fix it before widening the range again, because
under `0.x` caret rules you take every removal since your last move in one step.

## Failure table

| Symptom | Cause |
| --- | --- |
| `401`/`404` installing `@insolvia-ai/*` | No `NODE_AUTH_TOKEN`, or a token without `read:packages`. A 404 here usually means unauthenticated, not missing. |
| Components render with no styling, your own Tailwind classes work | Missing `@source` for the package — Tailwind never saw the class strings. |
| Nothing is styled, including your own markup | `theme.css` imported before `tailwindcss`, or not imported at all. |
| Build fails on a type annotation inside `node_modules` | Your bundler excludes `node_modules` from TypeScript transformation. |
| Dark mode does nothing on web | `data-theme="dark"` is not on a root element. A `prefers-color-scheme` media query alone will not do it. |
| A colour moved but its hover state did not, on native | Expected — see the `design-system-theming` skill. |
