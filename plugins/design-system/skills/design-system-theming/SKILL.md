---
name: design-system-theming
description: >-
  Consumer. Re-brand @insolvia-ai/design-system without forking it — the
  semantic role names to override, the CSS custom property seam on web, the
  ThemeProvider seam on React Native, why overrides are partial, and the one
  asymmetry between the platforms: derived states like primaryHover follow the
  base colour on web but are pre-computed on native. Use when changing brand
  colours or fonts, when an override moved a colour but left its hover state
  behind, when a colour is right on one platform and wrong on the other, or
  when tempted to reach for a raw palette name.
---

# Re-branding the design system

Nothing in this package ships one brand. `tokens.json` holds the **default**
theme, and each platform has an override seam. Speak the **semantic** layer
only.

## The semantic roles

These are the names an override may use:

| Role | Use |
| --- | --- |
| `bg` | Page background |
| `card` | Raised surface |
| `surfaceAlt` | Secondary surface |
| `ink` | Body text |
| `brand` | Brand mark |
| `primary` | Primary action |
| `primaryText` | Text on `primary` |
| `accent` | Accent |
| `muted` | Secondary text |
| `line` | Borders and dividers |
| `success` / `warning` / `danger` | Status |

Plus the derived states `primaryHover`, `primaryActive`, `accentHover`,
`dangerHover`.

**Raw palette names are exported nowhere, in either direction.** That is
deliberate and it is what makes a re-brand a one-place change. If you find
yourself wanting one, the role you need is missing — say so upstream rather than
hard-coding a hex.

## Web: override the custom properties

Override after importing the stylesheet. On web the derived states are
`color-mix()` over the base, so they follow automatically:

```css
@import 'tailwindcss';
@import '@insolvia-ai/design-system/theme.css';

:root {
  --color-primary: #155e63;
}
```

Role names become custom properties in kebab-case: `primaryText` is
`--color-primary-text`, `surfaceAlt` is `--color-surface-alt`.

Dark mode is the `[data-theme='dark']` selector, so override inside it to change
the dark palette:

```css
[data-theme='dark'] {
  --color-primary: #7fd1d9;
}
```

Typography is the same seam: `--font-heading` and `--font-body`.

## React Native: wrap the tree in ThemeProvider

```tsx
import { ThemeProvider } from '@insolvia-ai/design-system';

<ThemeProvider theme={{ light: { primary: '#155E63' }, dark: { primary: '#7FD1D9' } }}>
  <App />
</ThemeProvider>;
```

Every leaf below picks the overrides up at render time. `ThemeProvider` imports
no renderer, so it is safe to wrap a web tree in it too — it is simply inert
there, which lets a cross-platform app write one provider instead of branching
on platform.

Overrides are typed as a loose record rather than against the token package's
`ColorScheme`, so an unknown key is ignored rather than rejected. Check your
spelling: a typo is silent.

## The asymmetry to know about

**On native, derived states are pre-computed values, not live blends.**
Overriding `primary` alone does **not** move `primaryHover` or `primaryActive`.
Override them explicitly if they matter:

```tsx
theme={{ light: { primary: '#155E63', primaryHover: '#0F4A4E', primaryActive: '#0B3A3D' } }}
```

On web they follow the base automatically. This is the single most common cause
of "the button is our colour until you press it" on native.

## Overrides are partial

Supply only the roles you are changing; everything else falls through to the
defaults. There is no need to restate the full theme, and doing so means every
future token change has to be re-applied by hand.

## Verifying a re-brand

The tests in this package cannot see colour — they assert roles and labels in
jsdom. The workbench at <https://insolvia-ai.github.io/design-system/> renders
both leaves side by side with a scheme toggle, which is where a re-brand is
actually checked: same component, same colour, both platforms, both schemes.
