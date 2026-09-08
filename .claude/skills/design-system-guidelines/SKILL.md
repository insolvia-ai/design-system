---
name: design-system-guidelines
description: >-
  Contributor. A trimmed, two-platform review checklist for this package's
  `.web.tsx`/`.native.tsx` leaves, adapted from Vercel's Web Interface
  Guidelines — accessibility, focus, forms, animation, typography, content
  handling, touch, hover and dark-mode rules that a component LIBRARY leaf can
  actually violate, each mapped to the web Tailwind class or helper this repo
  uses and its React Native equivalent. Use this before opening a PR that
  touches a `.web.tsx` or `.native.tsx` leaf, when asked to review UI code,
  audit accessibility, check a component's interaction craft, or when a story
  fails the a11y gate and the rule is not obvious. The rules are vendored, not
  fetched, on purpose — see "Where this comes from" below.
metadata:
  internal: true
---

# Reviewing a leaf's interaction and a11y craft

## Where this comes from

Trimmed from Vercel's [`web-interface-guidelines`](https://github.com/vercel-labs/web-interface-guidelines)
`command.md` (MIT). The upstream skill fetches its rules at review time from a
raw GitHub URL and tells the agent to obey whatever comes back — which means
the rules a reviewer is holding could change under them mid-review, from a
source this repo does not control. This copy is **pinned on purpose**: vendored
into this repo, reviewable in the same diff as everything else, and versioned
with it. If Vercel's list changes, update this file deliberately, in its own
PR — never re-point at a live fetch.

## How to run it

1. Find the changed leaves:
   ```bash
   git diff --name-only main -- 'packages/design-system/src/**/*.tsx'
   ```
   Filter to files ending `.web.tsx` or `.native.tsx` — shared `.props.ts`
   modules have no rendering to check against this list.
2. Read each changed leaf and check it against every row in **Rules** below
   for its column (web leaf against the web column, native leaf against the
   native column).
3. Output findings grouped by file, terse, `path:line — finding`:
   ```text
   ## packages/design-system/src/toast/toast.web.tsx

   packages/design-system/src/toast/toast.web.tsx:42 — icon button missing aria-label
   packages/design-system/src/toast/toast.web.tsx:58 — animate-pulse lacks motion-reduce:

   ## packages/design-system/src/toast/toast.native.tsx

   ✓ pass
   ```
   Skip explanation unless the fix is non-obvious. No preamble, no summary
   paragraph — this is the same output contract the upstream command uses.

## What was dropped, and why

Root `CLAUDE.md`: *"This repo knows nothing about its consumers."* A leaf has
no URL, no `<head>`, no document, and no product copy — so the upstream
categories that live there are gone entirely: **Navigation & State** (URL
reflects state, deep-linking), **Hydration Safety** (SSR is a consumer
concern), **Images** (`loading`, `fetchpriority` — a leaf takes an already-
resolved image), **Performance**'s page-level items (`preconnect`, font
preload), **Locale & i18n**'s `Accept-Language` detection, **Content & Copy**'s
voice/Title Case rules, and the **Forms** `beforeunload` guard and skip-link
line under **Accessibility** — those are a consumer's page shell, never a
control this package renders. What is kept below is only what a `.web.tsx` or
`.native.tsx` leaf itself can get wrong.

## Rules

### Accessibility

| Rule | Web leaf (`.web.tsx`) | Native leaf (`.native.tsx`) |
|---|---|---|
| Icon-only controls need an accessible name | `aria-label` | `accessibilityLabel` |
| Form controls need a label | `<label htmlFor>` (Field wiring) or `aria-label` | `accessibilityLabel` / `accessibilityLabelledBy` |
| Interactive elements are keyboard-operable | `onKeyDown`/`onKeyUp` — see `accordion.web.tsx`'s arrow-key roving focus, `wheel.web.tsx`'s `wheelKeyIntent` | n/a on-device — RN has no keyboard event model off a hardware keyboard; if the leaf must stay operable through react-native-web, verify it forwards `onKeyDown` (verify against RN 0.86 docs) |
| Custom controls use the right element, not a clickable `<div>` | `<button>` for actions, `<a>`/`<Link>` for navigation | `Pressable` with `accessibilityRole="button"` / `"link"` |
| Decorative icons/images are hidden from assistive tech | `aria-hidden="true"` | `accessibilityElementsHidden` + `importantForAccessibility="no-hide-descendants"` |
| Async updates (validation, toasts) announce themselves | `aria-live="polite"` (`Field.Error`) | `accessibilityLiveRegion="polite"` |
| State is exposed, not only implied by colour | `aria-expanded`, `aria-selected`, `aria-disabled` — `accordion.web.tsx`, `wheel.web.tsx` | `accessibilityState={{ expanded, selected, disabled }}` |

### Focus

| Rule | Web leaf (`.web.tsx`) | Native leaf (`.native.tsx`) |
|---|---|---|
| Interactive elements show a visible focus ring | `focusRing` from `src/lib/styles.ts` | `useNativeFocusRing()` from `src/lib/native-focus.native.ts` |
| Never strip the outline without a replacement | `focusRing` already bundles `outline-none` with `focus-visible:ring-*` — never `outline-none` alone | n/a — RN paints no default outline to strip; a new control must call `useNativeFocusRing` itself rather than assume one |
| Ring responds to keyboard focus, not mouse focus | `focus-visible:` (bundled in `focusRing`) | RN's `onFocus`/`onBlur` already skip synthetic touch focus; `useNativeFocusRing`'s `focus`/`blur` wire directly to them |
| Compound controls group their focus | `:focus-within` | n/a — RN has no container-level focus event; each focusable child owns its own ring |
| Overlays/sticky chrome never cover the focused element | Dialog/Drawer stacking | same layout rule — no RN-specific mechanism, verify by eye in the workbench |

### Forms

Only the control-level rules — a leaf owns its own input, not the surrounding
page's submission flow.

| Rule | Web leaf (`.web.tsx`) | Native leaf (`.native.tsx`) |
|---|---|---|
| Correct input type / keyboard | `type="email"`/`"tel"`/`"number"`, `inputMode` | `keyboardType` from `keyboardTypeFor` (`input.props.ts`) |
| Never block paste | no `onPaste` + `preventDefault` | no native paste-blocking equivalent exists — verify `editable`/context menu is untouched |
| Label and control share one hit target | `htmlFor` or a wrapping `<label>` | wrap label `Text` and control in one `Pressable`, or `accessibilityLabelledBy` |
| Spellcheck/autocorrect off for emails, codes, usernames | `spellCheck={false}` | `autoCorrect={false}` `autoCapitalize="none"` |
| Submit stays enabled until the request starts; spinner during | Button `loading` state + `Spinner` | same prop contract; `Spinner.native` renders `ActivityIndicator` |
| Errors sit inline next to the field; first error gets focus | `Field.Error` + `aria-live` | `Field.Error` native leaf + `accessibilityLiveRegion`, focus moved via ref |

### Animation

| Rule | Web leaf (`.web.tsx`) | Native leaf (`.native.tsx`) |
|---|---|---|
| Honour reduced motion | `motion-reduce:` — see `accordion.web.tsx`'s panel transition | `AccessibilityInfo.isReduceMotionEnabled()` at mount, plus the `reduceMotionChanged` event listener for a live toggle |
| Animate `transform`/`opacity` only | compositor-friendly transitions | `Animated` driven with `useNativeDriver: true` accepts only `transform`/`opacity` too — the same constraint, enforced by the API instead of by convention |
| Never `transition: all` | list properties explicitly | n/a as a violation class — `Animated`/`LayoutAnimation` configs name properties by construction |
| Animations are interruptible | respond to input mid-transition | same |
| A platform indicator already respects reduce motion | the web ring is hand-drawn and needs an explicit `motion-reduce:` rule | `ActivityIndicator` (`spinner.native.tsx`) honours OS reduce-motion on its own; a hand-rolled `Animated.loop` would not, and must check `AccessibilityInfo` itself |

### Typography

Only the rules a control's own markup can violate — not copywriting.

| Rule | Web leaf (`.web.tsx`) | Native leaf (`.native.tsx`) |
|---|---|---|
| Truncation reads `…`, never `...` | literal `…` in rendered labels | same, in `Text` content |
| Number columns/comparisons use tabular figures | `tabular-nums` — see `wheel.web.tsx`'s row labels | `style={{ fontVariant: ['tabular-nums'] }}` on `<Text>` |
| Headings avoid orphans/widows | `text-wrap: balance` / `text-pretty` | n/a — RN `Text` has no CSS `text-wrap` equivalent; `numberOfLines` is the nearest lever (verify against RN 0.86 docs) |

### Content handling

| Rule | Web leaf (`.web.tsx`) | Native leaf (`.native.tsx`) |
|---|---|---|
| Long text degrades instead of breaking layout | `truncate`, `line-clamp-*`, `break-words` | `numberOfLines` + `ellipsizeMode` |
| Flex children allow truncation | `min-w-0` | n/a by a different default — RN's Yoga sets `flexShrink: 0`, the opposite of web's `1`; a text child needs `flexShrink: 1` set explicitly to shrink at all |
| Empty state is handled, not a broken render of `''`/`[]` | conditional render / placeholder copy | same |
| User-generated content is checked at short, average, and very long lengths | covered in the component's story | same |

### Touch

| Rule | Web leaf (`.web.tsx`) | Native leaf (`.native.tsx`) |
|---|---|---|
| `touch-action: manipulation` avoids the double-tap zoom delay | `touch-manipulation` on every pressable surface | n/a — RN has no double-tap-to-zoom to begin with; nothing to add |
| Tap highlight is set intentionally, not left to the browser default | `-webkit-tap-highlight-color` | `android_ripple` on `Pressable` (Android); iOS has no highlight halo by default |
| Overscroll is contained inside modals/drawers/sheets | `overscroll-contain` — see `wheel.web.tsx`'s listbox scroller | `overScrollMode="never"` (Android) / `bounces={false}` (iOS `ScrollView`) |
| Drag/swipe/pinch gestures ship a tap/keyboard alternative | `wheel.web.tsx` accepts arrow keys and `type()` alongside scroll/flick — a gesture is never the ONLY way in | the equivalent alternative must exist on native too; RN gesture handlers carry no keyboard fallback of their own |
| 44px touch target without inflating the visible control | `coarseTouchTarget` (`pointer-coarse:` pseudo-element, `src/lib/styles.ts`) | `hitSlop` |

### Hover states

| Rule | Web leaf (`.web.tsx`) | Native leaf (`.native.tsx`) |
|---|---|---|
| Buttons/links show a hover state | `hover:` classes | n/a on touch; `Pressable`'s `onHoverIn`/`onHoverOut` fire only for a mouse/trackpad (RNW, iPadOS pointer) — verify against RN 0.86 docs before treating it as load-bearing |
| Interactive states escalate in contrast | hover < active < focus | same ordering, expressed through `Pressable`'s style-callback `pressed`/`focused` args |

### Dark mode

| Rule | Web leaf (`.web.tsx`) | Native leaf (`.native.tsx`) |
|---|---|---|
| Scheme is declared so platform chrome matches | `color-scheme: dark` on the root the leaf renders under | n/a — RN has no OS form chrome to match; `ThemeProvider` (`src/lib/theme.ts`) is the equivalent override seam |
| Native `<select>` has explicit colours in dark mode | explicit `background-color`/`color` on `<select>` (Windows dark mode) | n/a — this package's Select is custom-drawn on native, and its colours already resolve via `useNativeColors()` at render time, not at module load |

### Anti-patterns

Flag on sight:

- `outline-none` without a `focus-visible` replacement
- `<div>`/`<span>` with a click handler standing in for `<button>`
- `transition: all`
- Icon-only control without an accessible name
- Form control without a label
- Gesture-only interaction without a tap/click and keyboard alternative
- `autoFocus` on a leaf with no clear single-primary-input justification — a
  leaf rarely knows if it is the page's one obvious first field
- A native leaf reading `colors.light`/`colors.dark` (or any token) at module
  load instead of through `useNativeColors()` at render time — the 0.2.1 bug,
  `design-system-component` skill has the full story

## Known open findings in this package

Flagged here so a reviewer does not re-report them as new — they are being
fixed in 0.21.0, in the same PR cycle as this skill. If a diff you are
reviewing still shows one of these, it regressed; keep it fixed, don't wave it
through:

- Progress's indeterminate `animate-pulse` and Spinner's web-leaf
  `animate-spin` ring lacked `motion-reduce:`.
- Dialog/Drawer panels lacked `overscroll-contain`.
- No pressable web leaf carried `touch-manipulation`.
- No native leaf checked `AccessibilityInfo.isReduceMotionEnabled()` — reduce
  motion was a web-only concern in this package until now.
