# Changelog — `@insolvia-ai/tokens`

Every version that reached the registry, newest first. This file ships **inside
the package**, so it can be read at `node_modules/@insolvia-ai/tokens/CHANGELOG.md`
without leaving the consuming project.

**Read the release type before the entry.** These are `0.x` packages, and npm's
caret rules for `0.x` are narrower than they look: `^0.2.0` resolves
`>=0.2.0 <0.3.0`. So a **patch** arrives on your next install, and a **minor**
does not arrive at all until the range is widened where the dependency is
declared. Every minor below says so.

Each entry links the pull request that shipped it. The entry is what changed;
the PR is why, what was rejected, and how it was verified.

> `0.1.x` is absent because it was never published — the package was
> `private: true` while every consumer resolved it from the same workspace.

## 0.5.0 — minor

**Widen your range to take this:** `^0.4.x` will not resolve it.

**Every colour in the default theme changed.** No token was added or removed and
no name moved, so nothing you have written stops compiling — but if you took the
default theme as-is, your app now looks different. If you already override the
semantic layer, only the roles you did not override move.

The base theme is now **monochrome**. Navy and brass are gone from the chrome
entirely; every surface, border, text colour and the primary fill are steps on
the 12-step neutral ramp 0.4.0 introduced.

- **The chrome roles now alias ramp steps, per scheme.** `bg`→1, `card`→2,
  `surfaceAlt`→3, `line`→7, `muted`→11, `ink`→12, and `primary`, `accent` and
  `brand` all →12 with `primaryText`→1. The ramp is Radix's gray scale and its
  steps carry Radix's meanings, so `line` at 7 is "UI element border" and
  `muted` at 11 is "low-contrast text" — measured here at 5.77:1 light and
  9.11:1 dark against `bg`, against a 4.5:1 floor.
- **The accent is now a VALUE, not a hue.** `primary`, `accent` and `brand` are
  all neutral-12 — near-black on light, near-white on dark. This is the change
  to argue with if you are going to argue with one: it means the default theme
  states no brand at all, which is the point. A re-brand pointing `accent` at a
  hue is a one-line override and the seam is deliberately left empty.
- **`dangerText` no longer inherits the retired navy.** It was `#071B31`, the
  last trace of the old brand, sitting on a red fill nothing had measured it
  against. It is now white on light and neutral-1 on dark: 6.06:1 and 6.78:1.
- **Status colours are unchanged** — `success`, `warning` and `danger` keep
  their values in both schemes. They are signals, not chrome, and a monochrome
  system needs them to stay the one thing that is not grey. `warning` remains
  unusable as body text on the light canvas (3.14:1) exactly as before.
- **Every radius is 0** except `pill`. `xs`, `sm`, `md` and `lg` all render
  square; `pill` is untouched because a pill is a shape, not a corner. A corner
  radius is a brand decision, so the base makes none — set `--radius-md` and it
  comes back everywhere at once.
- **`fonts.heading` is now the same sans stack as `fonts.body`.** The base ships
  no display face; a distinct heading family is a brand decision too. The
  React Native mapping in the design system moved with it, so the two leaves
  still agree.

The ramp itself did not change value. What changed is that the semantic layer
now points at it instead of at a separate brand palette, which is what makes a
re-theme one override rather than fourteen.

[#23](https://github.com/insolvia-ai/design-system/pull/23)

## 0.4.0 — minor

**Widen your range to take this:** `^0.3.x` will not resolve it.

All additive — no existing token changed value.

- **New `ramps` group: a 12-step neutral ramp and a 12-step alpha ramp**
  (`neutral1`–`neutral12`, `neutralA1`–`neutralA12`), light and dark, taken
  from Radix Colors' gray scales. Emitted as `--color-neutral-*` /
  `--color-neutral-a*` custom properties in both schemes, and as per-scheme
  members of `ColorScheme` for React Native, so `ThemeProvider` can override
  them through the seam it already has. They are steps, not roles — the
  generated doc comments say to prefer a semantic role where one says what you
  mean.
- **New `semantic.dangerText`** — the foreground that sits on top of `danger`,
  emitted as `--color-danger-text` and as a `ColorScheme` member. Measured
  against this file's own values at 6.1:1 light (white on `#B3352E`) and 6.2:1
  dark (`#071B31` on `#E27F79`), both clear of the 4.5:1 WCAG AA floor for body
  text — which is what lets a destructive button carry a LABEL and not only a
  glyph. It holds `primaryText`'s values, so nothing you have rendered moves;
  what changes is that overriding your primary foreground no longer silently
  moves the foreground on your danger fill too.
- **New overlay role set: `overlayInk`, `overlayMuted`, `overlayScrim`,
  `overlayHover`, `overlayActive`** — for controls drawn on top of MEDIA (a
  player's transport, a delete affordance on a frame, a filmstrip's arrows),
  where the surface roles cannot work: `surfaceAlt` over a dark frame is
  invisible and over a bright one is a grey box. Emitted as
  `--color-overlay-*` and as `ColorScheme` members, and overridable through the
  same seams as every other role.

  **These declare the same value in both schemes, deliberately.** They describe
  a photograph rather than your canvas, and a photograph does not follow the OS
  colour scheme — chrome over media is light-on-dark in a light app exactly as
  in a dark one. If you were mapping your own chrome onto the neutral ramp per
  scheme, these replace it; `overlayScrim` is opaque so you apply the alpha you
  want at the call site (`bg-overlay-scrim/80`, a gradient stop).
- **New palette entries `whiteAlpha30` and `whiteAlpha70`**, beside the
  existing `whiteAlpha20`, feeding the alpha overlay roles. As ever, palette
  names are emitted nowhere — go through the semantic layer.
- **New `fonts.mono`** — the system monospace stack, emitted as `--font-mono`
  (which intentionally re-declares Tailwind's own default of the same value)
  and as a typed member for React Native; the design-system's
  `native-typography` maps it to Menlo on iOS and `monospace` on Android.
- **New `radii.none` (0) and `radii.xs` (2 / 0.125rem)**, ahead of `sm`.
- **New `motion` group** — `durationFast` (120ms), `durationBase` (200ms),
  `easingStandard` (`cubic-bezier(0.2, 0, 0, 1)`). Durations emit as
  `--transition-duration-*`, the namespace this Tailwind actually resolves
  `duration-*` utilities from; the easing emits as `--ease-standard`.
- **The generator now emits a mobile zoom guard** into the design-system's
  `theme.css`: `@media (pointer: coarse) { input, textarea, select {
  font-size: max(16px, 1em); } }`, unlayered so it beats the utility layer.
  It lives in the generator, not `tokens.json`, which stays pure data. It also
  now refuses two colour tokens sharing one flat name, and `radii` gained
  calc-safe `0px` rendering.

[#20](https://github.com/insolvia-ai/design-system/pull/20)

## 0.3.2 — patch

- **No token value changed, and nothing this package exports changed.** The
  generator learned to emit one more block into the Tailwind stylesheet it
  renders for `@insolvia-ai/design-system`, so that the named spacing steps stop
  redefining Tailwind's `w-*`, `min-w-*`, `max-w-*` and `basis-*` utilities.
  `tokens.json`, `src/tokens.ts` and `src/colors.json` are byte-identical — take
  `@insolvia-ai/design-system` 0.14.0 for the fix itself.

[#14](https://github.com/insolvia-ai/design-system/pull/14)

## 0.3.1 — patch

- **This file, and it now ships inside the package.** `CHANGELOG.md` is listed
  in `files`, so it can be read at
  `node_modules/@insolvia-ai/tokens/CHANGELOG.md` without leaving the consuming
  project. npm does not include a changelog automatically; before this, the
  tarball carried `src/`, `tokens.json`, `README.md` and `package.json` and
  nothing else.
- Entries are backfilled to 0.2.0, the first published version.
- Each published version now also gets a git tag and a GitHub Release.
- No token value changed.

[#13](https://github.com/insolvia-ai/design-system/pull/13)

## 0.3.0 — minor

**Widen your range to take this:** `^0.2.x` will not resolve it.

- New palette entries `dangerBright` (`#E27F79`) and `successBright` (`#39B17E`),
  aliased from the **dark scheme only**. The light scheme is byte-identical to
  0.2.2.
- Fixes a real accessibility defect rather than a preference: `danger` and
  `success` had aliased the same palette value in both schemes, and a
  mid-lightness hue that clears WCAG AA on a paper surface cannot clear it on a
  deep one. Measured at 14px, `danger` was **2.9:1** and `success` **3.5:1**
  against a 4.5:1 floor.
- Both new values clear 4.5:1 against **all three** dark surfaces — background,
  card and the worst case, `surfaceAlt` (`#0B2A4A`), where they land at 5.2 and
  5.4. A semantic colour does not know which surface it lands on, so measuring
  against the background alone would have been the same mistake in a new place.

[#10](https://github.com/insolvia-ai/design-system/pull/10)

## 0.2.2 — patch

- Documentation only; **no token value changed**. The `fonts` comment now states
  that the family stack is authored for the web surfaces, that React Native
  resolves a single registered family rather than a stack — so the native leaves
  map the heading role onto each platform's own serif — and that no font file
  ships from here. Registering one is the consuming app's job.

[#2](https://github.com/insolvia-ai/design-system/pull/2)

## 0.2.1 — patch

- Documentation only; **no token value changed**. Token descriptions and the
  generator's output banners no longer describe the repository this package was
  extracted from.

[#1](https://github.com/insolvia-ai/design-system/pull/1)

## 0.2.0 — minor

First published version. Through `0.1.x` this package was `private: true`,
because every consumer resolved it from the same workspace by symlink and there
was nothing to publish. Consumers are across a repository boundary now, so the
registry is the only way to reach them.

- Adds `src/colors.json`. Node refuses to strip types for any file under
  `node_modules`, so a plain-`node` script in a consuming project cannot import
  `tokens.ts` at all; the JSON is the escape hatch for tools with no compiler.
- The generator loses its third output, which used to write into a directory
  belonging to a consumer. A published package cannot depend on a consumer's
  layout, so that half stays behind and is reconciled against the published
  tokens instead.
