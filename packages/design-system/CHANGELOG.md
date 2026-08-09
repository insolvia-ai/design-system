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
