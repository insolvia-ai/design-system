# tokens — agent rules

The single source of truth for every design token, published as
`@insolvia-ai/tokens`. Human docs: [`README.md`](README.md).

- **`tokens.json` is the only place token values live** — pure data, no CSS, no
  TypeScript. Every color, spacing step, radius, shadow, and font.
- **Never hand-edit a generated file.** `tool/generate-tokens.ts` produces three
  outputs: `packages/design-system/src/styles/theme.css`, this package's own
  `src/tokens.ts`, and its `src/colors.json`. To change a value: edit
  `tokens.json`, then `npm run tokens` from the repo root. CI gate:
  `npm run tokens:check` (fails the PR on drift, naming the file you edited).
  If `git diff` is non-empty after `npm run tokens`, the *generator* is wrong —
  never reconcile by editing a generated file.
- **Never add an output that writes outside this repo.** One did once, into a
  consumer's tree, which meant the generator encoded that reader's directory
  layout — so it silently no-opped for everyone else, and a published package
  depended on where one consumer kept its files. Consumers render their own
  outputs from the published tokens.
- **`colors.json` exists because Node will not strip types under
  `node_modules`.** A plain `node` script in a consumer with no
  bundler — cannot import `tokens.ts` at all
  (`ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`); Metro and Vite can, which is
  why only that consumer is affected. It is the same values `tokens.ts` emits,
  rendered through the same helpers. The alternative was a second copy of the
  blend maths in another repo, drifting silently — do not "simplify" back to
  it, and if you change `renderTypeScript`'s colour output, change
  `renderColorsJson` in the same commit.
- **`theme.css` bytes are expensive; `tokens.ts` bytes are cheap.** `theme.css`
  lands inside `packages/design-system` and ships to consumers, so changing one
  byte of it forces a design-system version bump. Its banner names the README
  rather than a command precisely so it stays toolchain-agnostic — and so it
  stays true for a reader who has the file but not this workspace. The two
  banners differ on purpose; don't unify them.
- **Add no dependencies to the generator** (`node:fs` + `node:path` only). It
  runs as plain `node …/generate-tokens.ts` — no loader, no build step — on
  Node's native type-stripping, so it **cannot use `enum`, `namespace`, or
  constructor parameter properties**. `erasableSyntaxOnly` in
  `tsconfig.base.json` makes `npm run typecheck` catch all three.
- **Generated output is linted and formatted like any other source.**
  `src/tokens.ts` is inside the `prettier --check` and `eslint` targets, so the
  generator has to emit Prettier-clean bytes — including Prettier's quote choice
  and line-breaking. Verify with `npm run format && npm run lint`, never by
  reformatting the output file.
- **Consumers speak the semantic layer only** (`primary`, `accent`, `bg`, `ink`,
  `muted`, `line`, `card`, `danger`, …), never raw palette names
  (`ink`/`brass`/`paper`) — a re-brand is then a one-file change. No output
  emits the palette at all; keep it that way.
- **Measure a new dark alias against the dark canvas; never assume it.** A
  mid-lightness hue that clears WCAG AA on `paper` will not clear it on
  `inkDeep` — `danger` was the same `#B3352E` in both schemes and scored 5.8:1
  on light, 2.9:1 on dark, in the colour `Field.Error` paints its message.
  That is what the `*Bright` palette siblings are for. The floor for text is
  4.5:1 against `bg`, `card` and `surfaceAlt` alike, since a semantic colour
  does not know which surface it lands on. `npm run test:a11y` now runs axe
  over every story in BOTH schemes, so a regression here is red rather than
  invisible — but the gate only sees colours a story actually renders, and the
  measurement is what tells you the value is right before you commit it.
- **A missing dark-mode color must stay a compile error.** `src/tokens.ts`
  declares every semantic role as required on `ColorScheme` and asserts scheme
  exhaustiveness with a `never` type. Don't relax either into an optional
  property or a runtime fallback.
- **This package is published and version-gated** (it was neither until 0.2.0,
  when it left the monorepo). Any change here is its own PR with a `version`
  bump — consumers install it from the registry,
  and an unbumped change publishes nothing and silently rots.
