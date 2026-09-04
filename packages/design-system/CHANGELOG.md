# Changelog — `@insolvia-ai/design-system`

Every version that reached the registry, newest first. This file ships **inside
the package**, so it can be read at `node_modules/@insolvia-ai/design-system/CHANGELOG.md`
without leaving the consuming project.

**Read the release type before the entry.** These are `0.x` packages, and npm's
caret rules for `0.x` are narrower than they look: `^0.12.0` resolves
`>=0.12.0 <0.13.0`. So a **patch** arrives on your next install, and a **minor**
does not arrive at all until the range is widened where the dependency is
declared. Every minor below says so.

Each entry links the pull request that shipped it. The entry is what changed;
the PR is why, what was rejected, and how it was verified.

> Versions absent here were never published. Both packages publish only from
> `main`, and a version bumped mid-branch is overwritten by the next bump before
> the merge — which is why there is no 0.8.0–0.8.2, no 0.9.x, and no
> 0.10.0–0.10.1.

## 0.17.0 — minor

**Widen your range to take this:** `^0.16.x` will not resolve it.

**Needs `@insolvia-ai/tokens` 0.4.0** for the neutral ramps, `--font-mono`, the
motion tokens, `danger-text` and the `overlay-*` roles. Bump both, or a `danger`
Button renders an unstyled foreground and `intent="overlay"` renders nothing at
all.

Two things at once: everything a consumer needs to build a themed video player
and a dense, metadata-heavy chrome, plus nine gaps a consumer had been papering
over in its own stylesheet, closed at the root. If you carry local workarounds
for any of the latter, this is the release that lets you delete them.

- **Focused text controls no longer zoom the page on iOS.** `theme.css` now
  carries an unlayered `@media (pointer: coarse)` rule holding `input`,
  `textarea` and `select` at `max(16px, 1em)`. iOS Safari zooms on focus
  whenever a field is under 16px, and this package's controls are `text-sm`
  (14px). The rule is keyed on pointer, not viewport width — the condition is
  touch, not narrow — and the fix is deliberately NOT `maximum-scale=1` in a
  viewport meta, which disables pinch-zoom and fails WCAG 1.4.4. Desktop is
  untouched.
- **New component: `Slider`.** An interactive range — controlled or
  uncontrolled, `min`/`max`/`step`, `onValueCommit` on release, an optional
  `buffered` secondary fill for a video seek bar, and a required accessible
  `label`. One component rather than a compound: the web leaf is a themed
  native `<input type="range">` whose track and thumb are pseudo-elements, not
  boxes (the props module holds the argument). The native leaf is a
  PanResponder drag over core RN primitives — no native-module dependency —
  with `accessibilityRole="adjustable"` and increment/decrement actions running
  the same step arithmetic as the web keyboard.
- **New component: `IconButton`.** A square icon-only button on Button's height
  scale (`sm` 32dp, `md` 44dp), named by a required `label` (aria-label + title
  on web, accessibilityLabel on native), with an optional presentational
  `pressed` for toggles. Intents are Button's three plus `danger` — the glyph
  rides on `primary-text`, the one foreground measured to clear WCAG 1.4.11 on
  the danger fill in both schemes — plus `overlay`, for controls drawn over
  media on the new `overlay-*` roles. **If you defined your own chrome roles
  over the neutral ramp, `overlay` replaces them.** Default intent is `ghost`,
  because an icon button is nearly always an affordance sitting on something
  else.
- **`IconButton` size `sm` meets a 44px hit area on coarse pointers.** A
  centred `::after` under `@media (pointer: coarse)` on web, `hitSlop` on
  native — the TARGET grows, the drawn box does not, which `min-width`/
  `min-height` could not have done. `md` is already 44 and gets nothing.
  **Delete any hand-applied touch-target class.** (Wrapping in `Tooltip` was
  rejected — a leaf may not import another component's leaf, and the extra
  wrapper would change your layout; the `title` from `label` covers the
  pointer case.)
- **New component: `Chip`, with a `chipClass` helper.** A bordered, pressable
  label — tag filters, a phone's nav row, a "which of these is involved"
  toggle. `pressed` is controlled and presentational (a control that owns its
  own pressed state is `Toggle`); both states carry a border and only its
  colour moves, so a chip row never reflows as you press. The helper is the
  primary interface for the case a component cannot serve: a router link takes
  a function `className` and cannot be a `<button>`.
- **`cn()` now knows this package's spacing scale, so your `className`
  overrides win.** `tailwind-merge`'s built-in theme is Tailwind's NUMERIC
  spacing scale, so `p-lg` and `gap-sm` were words it had never heard of and it
  kept both sides of a conflict — `twMerge('p-lg gap-sm', 'p-0 gap-0')`
  returned all four classes and the stylesheet decided which painted. Overriding
  a component's padding or gap from the outside was therefore impossible and
  needed an inline `style`. It now behaves exactly as a numeric override always
  did. **Delete those inline spacing styles.**
- **`truncate` now beats `text-balance`.** The same merge is taught that the two
  conflict, because `text-wrap: balance` also resets `text-wrap-mode: wrap` and
  so ran over `truncate`'s `white-space: nowrap`. This fixes a bare
  `className="truncate"` as well as the new prop below. **Delete any
  `style={{ textWrap: 'nowrap' }}` you added to make a heading elide.**
- **`Text` takes `truncate`.** One line, elided — `overflow-hidden
  text-ellipsis whitespace-nowrap` on web, `numberOfLines={1}` on native. The
  native half is why this is a prop and not a documented class: a
  `className="truncate"` did nothing at all on that leaf.
- **`Text` gains `family`** — `'body' | 'heading' | 'mono'`, overriding the
  family the variant implies. `mono` is the new tokens role, for ids, keys,
  durations, byte counts and timestamps. `tabular-nums` is deliberately not
  bundled in; a monospaced face already advances digits identically.
- **`Text variant="caption"` lays out as a BLOCK now. This is a visual
  change.** It was inline, so two captions — or a caption under a body line —
  ran onto one line with nothing between them, and `truncate` did nothing
  because an inline box has no width to elide against. The element is still a
  `<span>` (a caption often sits inside running text, and `<p>` cannot nest
  inside `<p>`); only the display moved. **If you were adding `className="block"`
  to your captions, delete it.** For the rare genuinely-inline caption, pass
  `inline` — web-only, since an RN `<Text>` already lays out either way
  depending on where you put it.
- **`Button` and `buttonClass` take `intent="danger"`**, on the `danger-text`
  foreground tokens 0.4.0 measures. It is the same fill row `IconButton` ships
  with here, so a text button and an icon button that destroy the same thing
  read as one control. **Delete any local `bg-danger` recipe.**
- **`Button` and `buttonClass` take `wrap`** for a sentence-length label —
  auto height and normal wrapping instead of a fixed height and
  `whitespace-nowrap`, which made an armed delete ("Confirm — delete 54 files")
  run off the side of a phone and give the page a horizontal scrollbar. The
  minimum height equals the old fixed height, so a one-line label is unchanged.
- **`Select`'s trigger label can truncate inside a constrained parent.** Its
  span is `min-w-0` now; without it a flex item will not shrink below its own
  text, so a `w-28` cap on the trigger was silently ignored and toolbars wrapped
  onto a second line at phone widths. `Combobox`'s wrapper and `Sidebar.Item`'s
  label got the same treatment for the same reason. **Delete any
  `[role="combobox"] > .truncate { min-width: 0 }` rule.**
- **`Toggle` and `ToggleGroup.Root` take `size`** (`sm` | `md`), set once on
  the group and overridable per member, plus `iconOnly` for a square,
  glyph-only member. `iconOnly` REQUIRES `label` in the type, so an unnamed
  icon toggle does not compile. A two-item icon group is narrow enough for a
  phone toolbar, which the default size was not.
- **`Toggle`'s `md` is 44dp now, up from 36. This is a visual change.** It set
  no height at all and landed at 36 from its padding, while every other `md`
  control in this package — Button, the Select trigger, every Wheel row — is
  44, the WCAG 2.5.5 floor each of them cites. Bottom-aligned in a form row
  that put two labels on two lines. **If you were normalising control heights
  in your own stylesheet, re-check that rule.**
- **`Dialog.Root`, `Drawer.Root` and `AlertDialog.Root` take
  `container?: HTMLElement | null`.** Every portal in that component then
  targets it instead of `document.body`. The reason is the Fullscreen API:
  the browser paints only descendants of the fullscreen element, so a dialog
  portalled to the body is invisible while anything is fullscreen — pass the
  fullscreen container and it paints. An element, deliberately not a ref (the
  portal target is read during render); hold it in state. Scroll lock stays on
  the body either way. `Popover` has no such prop because it never portals —
  its surface is anchored inline under its Root and follows the trigger into
  fullscreen already; two tests now pin that.
- **New theme tokens** (via `@insolvia-ai/tokens` 0.4.0): a 12-step neutral ramp
  (`--color-neutral-1…12`) with a matching alpha ramp
  (`--color-neutral-a1…a12`), light and dark; `--font-mono`;
  `--radius-none` / `--radius-xs`; motion tokens emitted on real Tailwind
  namespaces (`duration-fast`, `duration-base`, `ease-standard`);
  `--color-danger-text`; and the `--color-overlay-*` roles. All additive — no
  existing role moved.

[#20](https://github.com/insolvia-ai/design-system/pull/20)

## 0.16.0 — minor

**Widen your range to take this:** `^0.15.x` will not resolve it.

**Supersedes 0.15.0 — skip it.** 0.15.0 made these two panels accept elements
but kept wrapping a bare string in a `Text`, which left them the only
containers in the package with a conditional in them. This finishes the job.

- **On React Native, `Accordion.Panel` and `Collapsible.Panel` no longer wrap
  ANY child.** They are plain `View`s now, exactly like `Tabs.Panel`, and hold
  whatever you put in them.
- **You must wrap bare text in your own `<Text>`** — the ordinary React Native
  rule, which these two panels used to hide. A panel whose child is a plain
  string throws *"Text strings must be rendered within a `<Text>` component"* on
  a device. This is the migration, and it is mechanical:
  `<Accordion.Panel>Some prose</Accordion.Panel>` becomes
  `<Accordion.Panel><Text>Some prose</Text></Accordion.Panel>`.
- **Style that `Text` yourself if you want the old look.** The panel no longer
  contributes a text colour or size. The web leaves are unchanged and still mute
  panel prose by CSS cascade; React Native has no cascade, so the muted colour
  is now the caller's to apply. Nothing about this affects a web consumer.
- No prop, type or export moved, and both web leaves are untouched.

[#19](https://github.com/insolvia-ai/design-system/pull/19)

## 0.15.0 — minor

**Widen your range to take this:** `^0.14.x` will not resolve it.

- **`Accordion.Panel` and `Collapsible.Panel` hold arbitrary children on React
  Native now, not only prose.** Both wrapped every child in a `Text`, so a
  panel could not contain a `View` — no form, no table, no nested layout. A
  bare string (or number) is still wrapped and still renders in the panel's
  muted colour, so prose panels are unchanged and need no edit; anything else
  is passed straight through, as `Tabs.Panel` and both web leaves have always
  done.
- **If you worked around this, the workaround can go** — content flattened into
  one `Text`, or lifted out of the panel entirely, can move back in.
- On react-native-web the old wrapper failed quietly rather than loudly: it
  carries `display: inline` and sets the text-ancestor context, so a flex
  layout inside a panel collapsed into inline flow and a nested `Text` rendered
  as a `<span>` inheriting the panel's colour instead of its own. If a panel of
  yours looked subtly wrong, that was why.
- No prop, type or export moved, and the web leaves are untouched.

[#18](https://github.com/insolvia-ai/design-system/pull/18)

## 0.14.1 — patch

- **In a browser, an open `Select` list and an open `DateInput` picker now
  portal to `document.body`**, positioned from the measured control, instead of
  rendering inline where a wrapper `View` of your own could paint later
  siblings over them. Wrapping the `Field` in any number of your own wrappers
  no longer buries the open overlay, so a `zIndex: 'auto'` spread onto
  wrappers as a workaround can be removed. Focus stays on the trigger, and
  ids, `aria-controls` and `aria-activedescendant` are unchanged — but the
  open list is a child of `document.body` now, so tests that query it INSIDE
  the field's own subtree must query the document instead. On a real native
  device both overlays still render inline, unchanged.

[#17](https://github.com/insolvia-ai/design-system/pull/17)

## 0.14.0 — minor

**Widen your range to take this:** `^0.13.x` will not resolve it.

- **`w-*`, `min-w-*`, `max-w-*` and `basis-*` mean what Tailwind says again.**
  `theme.css` names its spacing steps `xs`/`sm`/`md`/`lg`/`xl`/`xxl`, and
  Tailwind v4 resolves those four utilities from `--spacing-*` *before* its own
  `--container-*` scale — so importing this stylesheet silently redefined them.
  `max-w-md` was `1rem`, not the `28rem` it reads as; `max-w-xl` was `2rem` and
  `max-w-sm` `0.5rem`. Anything capped that way collapsed to a few pixels wide
  and wrapped one word per line. The five keys Tailwind also has — `xs`, `sm`,
  `md`, `lg`, `xl` — now resolve to its container widths.
- **Check your markup for those four prefixes with a t-shirt key.** If you wrote
  one wanting the small value — a `w-md` you expected to be 16px — it changes
  size on this version. Write the length you meant (`w-[1rem]`).
- Everything else is untouched. `p-*`, `m-*`, `gap-*`, `size-*` and
  `h-*`/`min-h-*`/`max-h-*` still read the spacing steps; heights never
  consulted Tailwind's container scale, so there was nothing there to shadow.
  `max-w-xxl`, and any other key Tailwind has no container width for, keeps its
  spacing value too.
- No component changes size. Dialog and AlertDialog still cap at 28rem, Drawer
  at 20rem. They had been writing those lengths out longhand to dodge the bug
  and now say `max-w-md` and `max-w-xs`.

[#14](https://github.com/insolvia-ai/design-system/pull/14)

## 0.13.1 — patch

- **This file, and it now ships inside the package.** `CHANGELOG.md` is listed
  in `files`, so it can be read at
  `node_modules/@insolvia-ai/design-system/CHANGELOG.md` without leaving the
  consuming project. npm does not include a changelog automatically; before this,
  the tarball carried `src/`, `README.md` and `package.json` and nothing else,
  and every version above went unrecorded anywhere a consumer could reach.
- Entries are backfilled to 0.7.0, the first version published from this
  repository.
- Each published version now also gets a git tag and a GitHub Release, so two
  versions can be diffed for the first time.

[#13](https://github.com/insolvia-ai/design-system/pull/13)

## 0.13.0 — minor

**Widen your range to take this:** `^0.12.x` will not resolve it.

- `styles/theme.css` regenerated against `@insolvia-ai/tokens` 0.3.0, which
  gives the dark scheme its own `danger` and `success` values. On the dark
  canvas the old ones measured 2.9:1 and 3.5:1 against a 4.5:1 floor — below
  WCAG AA, in the colour `Field.Error` paints its message.
- No component source changed: every component already read the semantic token,
  so the fix landed entirely in the token layer.
- The accessibility gate now runs **once per colour scheme**. A story renders in
  one scheme per run, so the previous light-only gate could never have seen this.
- Contrast notes corrected in `text.props.ts`, `badge.props.ts`,
  `alert.props.ts` and `ribbon.props.ts`, which documented the superseded
  measurements.

[#10](https://github.com/insolvia-ai/design-system/pull/10)

## 0.12.2 — patch

- Native `Popover` and `Tooltip` rendered as narrow columns — 74pt and 73pt wide
  against web leaves at 320 and 251 — wrapping a word or two per line. Both
  carried a `maxWidth` and no `width`, so each shrank to fit a containing block
  that hugs its trigger by design, and the declared cap never applied.
- Native `Popover` also takes the web leaf's elevation, reusing the values
  `card.native.tsx` already uses for `raised`, so both floating surfaces lift the
  same way.
- Web leaves untouched.

[#7](https://github.com/insolvia-ai/design-system/pull/7)

## 0.12.1 — patch

- `Select`'s two leaves disagreed under the mouse. The web trigger now also
  shows its focus ring while the list is **open** — the trigger is the widget
  being driven while focus stays on it — matching what the native leaf already
  did on mouse-open.
- Native `Select` options now highlight on hover, driving the same `active`
  state the arrow keys drive, so `aria-activedescendant` follows the pointer on
  both leaves.

[#6](https://github.com/insolvia-ai/design-system/pull/6)

## 0.12.0 — minor

**Widen your range to take this:** `^0.11.x` will not resolve it.

- A date and time field with a picker: a scrolling wheel and a calendar, built
  over this package's own primitives and tokens, reached the way a browser's own
  date control reaches its calendar — a field with an icon on the right.
- Time entry exists for the first time.
- **Values are strings, not `Date`.** Constructing a `Date` from a date-only
  string introduces an off-by-a-day timezone bug; all three value shapes sort
  lexicographically in chronological order, so `min`/`max` stay one string
  compare in every mode.
- The picker is anchored rather than modal, and is not composed from `Popover`.

[#5](https://github.com/insolvia-ai/design-system/pull/5)

## 0.11.0 — minor

**Widen your range to take this:** `^0.10.x` will not resolve it.

- Nineteen new components, taking the catalogue from 22 to 41 — including a
  plain text `Input`, which `Field.Control` previously had nothing of its own to
  wrap.
- Each ships as the usual `props` / `.web` / `.native` trio, with tests on both
  leaves and a workbench story pairing them.
- Where a platform gap could not be closed it is documented at the seam rather
  than papered over: a native `Popover` and `Dropdown` have no press-outside
  dismissal, because React Native has no document to listen to and both
  workarounds defeat the non-modal point. `Popover.Close` is a part, not a
  flourish.

[#4](https://github.com/insolvia-ai/design-system/pull/4)

## 0.10.2 — minor

**Widen your range to take this:** `^0.8.x` will not resolve it.

Cross-leaf divergences, every one of them found by looking at the two leaves
side by side rather than by a test.

- `Dialog` and `AlertDialog` cards were **16px wide**. A named `max-w-md`
  resolved against this theme's spacing scale rather than Tailwind's container
  scale, so the card collapsed below its own padding.
- `Select`'s open list painted underneath the form beneath it once a `Field`
  wrapped it.
- Native `Checkbox`'s tick rendered black on the primary fill, ~1.6:1.
- Web press targets were 40px against native's 44 on `Select`, `DateInput` and
  `Button` — the WCAG 2.5.5 floor the native leaves already documented.
  `Field.Control` stays at 40, being a text input.
- Native text had no line height at all; 26 style keys across 11 leaves now
  carry the pairs the web leaves render.
- Headings rendered a serif on web and the system sans on native. Resolved per
  platform — **no font file ships**; registering one is the consuming app's job.
- `Accordion`'s web panel had no bottom padding.
- Native `ToggleGroup` could not be named, so the group takes `role="group"`.

[#2](https://github.com/insolvia-ai/design-system/pull/2)

## 0.8.3 — minor

**Widen your range to take this:** `^0.7.x` will not resolve it.

- Theming seams on both platforms, so nothing ships one brand: CSS custom
  properties on web, `ThemeProvider` on native.
- Every component gained a workbench story. Twenty of twenty-two had none, which
  meant the accessibility gate covered two of them.
- Accessibility became a **gate** rather than a report: every story now runs in a
  real browser and fails on any axe violation.

[#1](https://github.com/insolvia-ai/design-system/pull/1)

## 0.7.1 — patch

- `Select`'s open list painted behind the description text, the file button and
  the submit button following it in a form — legible enough to look like a
  rendering glitch, and impossible to click through. The elevation had been on
  the popup, where it could never work: a z-index on a child cannot lift its
  subtree past a sibling that comes after the whole control. It belongs on the
  root, and only while open.

## 0.7.0 — minor

First release published from this repository. `0.6.0` and earlier were published
from elsewhere, so the first version here had to be higher.

- No API or value changed. The only content difference is two generated banners
  naming paths that exist here; every token value is byte-identical, so the move
  perturbed no colour.
