# design-system — agent rules

The owned, platform-split design system, published as
`@insolvia-ai/design-system` (0.6.x). Human docs: [`README.md`](README.md).
Repo-level rules and the publishing flow: [`../../CLAUDE.md`](../../CLAUDE.md).

- **Three files per component**: `<name>.props.ts` (shared), `<name>.web.tsx`
  (React DOM + Tailwind), `<name>.native.tsx` (RN primitives over
  `@insolvia-ai/tokens`). The per-component `index.ts` re-exports the
  extensionless `"./<name>"` and the consumer's bundler picks the leaf — Vite
  takes `.web`, Metro takes `.native` (react-native-web can render the `.native`
  leaf in a browser too, for a consumer that ships no Tailwind).
- **Props modules never import a renderer.** No `react-native`,
  `react-native-web`, `react-dom`, or `@base-ui/*` in `*.props.ts` or
  `src/lib/` — this is the load-bearing rule that keeps react-native-web out
  of a web consumer's bundle, and `eslint.config.js` enforces it. Don't weaken
  that override.
- **Litmus test for new code**: pure data (variant maps, class strings) may
  collapse into one shared file later; events, state, or a11y wiring means a
  leaf pair — the platforms' models do not unify.
- **A native leaf must match its web leaf's intrinsic SIZE.** If the web leaf is
  `inline-*` — it hugs its content — the native leaf has to say so, with
  `alignSelf: 'flex-start'` or a definite `width`. If the web leaf is
  block/flex-level, the native leaf stretches and declares nothing, because
  stretching is already React Native's answer.
  That asymmetry is the whole trap: a React Native parent defaults to
  `alignItems: 'stretch'`, so a leaf that declares NOTHING does not get "the
  natural size", it gets the parent's. An `inline-flex` web button hugging its
  label beside a native button running the full width of the screen is two
  implementations of one design disagreeing about the most basic property it
  has, and it is invisible to every test here — jsdom asserts roles and labels,
  and axe does not measure boxes. Chip shipped that way and was caught by
  looking at a screenshot.
  `workbench/leaf-pair.tsx` sets the native stage to `alignItems: 'stretch'`
  ON PURPOSE so this is visible: the stage matches what a consumer's root
  `View` gives its children. Do not "fix" a stretched leaf by changing the
  story.
  The second route is as good as the first — `IconButton` and `Switch` reach the
  same place with a definite width, and adding `alignSelf` on top of one would
  be noise. So would adding it to an absolutely-positioned leaf like `Ribbon`,
  whose cross size its parent never decides.
- **Native leaves resolve the color scheme at RENDER time — never
  `colors.light` statically.** 0.2.1 shipped all six native leaves reading
  `colors.light` at module load; a React Native consumer follows the OS scheme
  (`useColorScheme()`, which react-native-web maps to `prefers-color-scheme`
  in a browser), so every surface stayed light inside a dark app.
  The shared resolver is `src/lib/native-theme.native.ts` —
  `useNativeColors()` in each leaf, anything-but-`'dark'` resolves to light —
  and `StyleSheet.create` keeps only
  scheme-independent layout, because it runs once at module load. The
  `.native.` infix is what exempts that file from the ESLint renderer ban:
  it is a platform leaf, unreachable by any web resolver.
- **No build step, ever.** The package publishes `src/` as-is; a tsup/tsc
  emit would collapse the leaf pairs and break resolution in the consumer's
  bundler. `package.json`'s comment block owns the full reasoning.
- **Any change here is its OWN PR with a `version` bump and a `CHANGELOG.md`
  entry for that version** (both CI-enforced; `design-system-release` has the
  format).
  Consumers install the PUBLISHED version, so nothing you merge reaches any of
  them until it publishes and they bump. This package was once a workspace
  sibling of a consumer, read through a symlink, so a merge was live for that
  one consumer and invisible to every other — one package with two truths at
  once. Don't restore the shortcut; a path dependency is exactly it.
- **`src/styles/theme.css` is generated** from `packages/tokens` — never
  hand-edit; edit `tokens.json` and `npm run tokens` from the repo root. It
  sits in `.prettierignore` because the generator owns its bytes and Prettier
  would strip a blank line the generator deliberately emits.
- **All three typecheck programs must pass** (`npm run typecheck` chains
  them): the web program (`moduleSuffixes: [".web", ""]`), the RN program
  (`[".native", ""]`, real `react-native` types, no DOM lib), and the
  native-test program (`tsconfig.native.test.json`: native suffixes + DOM
  lib, for tests that assert on react-native-web's DOM). If tsc can't see an
  extensionless leaf import, fix the suffix lists — never add file
  extensions to the index re-exports.
- **Every component keeps ≥1 behavioural test** (Vitest + Testing Library,
  against the `.web` leaf). Props modules with real logic (accordion state
  machine, field id composition) get direct unit tests. No snapshot tests.
- **Native leaves are tested too** — vitest runs two projects
  (`vitest.config.ts`): `web` resolves `.web` leaves as Vite does; `native`
  resolves `.native` leaves as Metro does and aliases `react-native` to
  `react-native-web` — the pair a React Native consumer uses on the web. Native
  tests are
  `*.native.test.tsx` beside the leaf, rendered into jsdom with the same
  Testing Library; `vitest.native.setup.ts` supplies the `matchMedia` mock
  that drives the color scheme. A native leaf carrying a11y wiring (Button,
  Field) keeps ≥1 native test — the Field label wiring shipped broken in
  0.2.1 precisely because only the `.web` leaf was tested.
- **Never declare `react-native` or `@insolvia-ai/tokens` here** — not as
  dependencies, not as peerDependencies, optional or not. GitHub Packages
  strips `peerDependenciesMeta` from registry metadata, so npm treats an
  "optional" peer as required; declaring `react-native` would force every web
  consumer to install a native renderer it never loads, which broke a web
  consumer's container build once. `@insolvia-ai/tokens` is published now, so it would no
  longer 404 the way it did when tokens was private — the *failure* changed,
  the *rule* did not. The native leaves are the only code importing either, no
  web resolver can reach them, and their imports resolve from the consumer's
  own dependencies. The package.json `//` comment records the full reasoning.
  If a task seems to need a dependency added here, that is the signal to
  re-read this bullet, not to add it.
