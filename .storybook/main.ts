import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import type { StorybookConfig } from '@storybook/react-native-web-vite';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

const SCHEMES = ['light', 'dark'] as const;

/**
 * The scheme every story STARTS in, from `WORKBENCH_SCHEME` in the environment.
 *
 * The Scheme toolbar can move a story either way once it is on screen, but the
 * a11y gate has no toolbar and no human: it renders each story once, at
 * whatever `initialGlobals` says, and audits that. So until this existed the
 * gate only ever saw light, and every dark-scheme contrast failure was
 * invisible to CI — `--color-danger` sat at 2.9:1 on the dark canvas, under the
 * 4.5:1 floor, in the colour `Field.Error` paints its message.
 *
 * Declared HERE rather than in `vitest.config.ts` so one definition serves
 * `storybook dev`, `storybook build` and the Vitest run alike — the story tests
 * build their Vite config from this file's `viteFinal`, so a define added here
 * reaches all three. It also keeps the a11y project singular: two Vitest
 * projects both running `storybookTest` against this `configDir` would be given
 * the SAME name by the addon's own workspace-name-override plugin, and
 * Storybook's in-app "Run tests" widget filters by exactly that name. Two
 * sequential runs of one project cost a second browser start and break nothing.
 *
 * Validated rather than defaulted: `WORKBENCH_SCHEME=drak` silently auditing
 * light twice is precisely the failure this whole change exists to remove.
 */
function initialScheme(): (typeof SCHEMES)[number] {
  const requested = process.env['WORKBENCH_SCHEME'];
  if (requested === undefined) return 'light';
  const match = SCHEMES.find((scheme) => scheme === requested);
  if (!match) {
    throw new Error(
      `WORKBENCH_SCHEME="${requested}" is not a scheme. Expected one of: ${SCHEMES.join(', ')}.`,
    );
  }
  return match;
}

/**
 * The workbench: the only place in this repo where a component is LOOKED AT
 * rather than asserted about.
 *
 * ── Why this exists ──────────────────────────────────────────────────────────
 *
 * Every other check here is blind. Vitest renders into jsdom and asserts on
 * roles and labels; tsc checks types; neither can see that something is the
 * wrong colour, or in the wrong place, or painted underneath the thing below
 * it. That last one is not hypothetical — 0.7.1 fixed a Select whose open list
 * rendered *behind* the rest of the form, and the bug report opens with
 * "reported from a real browser, and invisible to every test in this package".
 *
 * ── Why the React Native Web framework, for a package that is half web ──────
 *
 * `@storybook/react-native-web-vite` aliases `react-native` to
 * `react-native-web`. That is not a compromise for the `.native` leaves — it is
 * exactly what a React Native consumer ships on web, so what you see here is what that
 * consumer renders. And the alias is harmless to the `.web` leaves, which
 * import no renderer at all beyond React DOM.
 *
 * One Storybook can therefore render BOTH leaves of a component, side by side,
 * on one page. That is the whole point: this package's central claim is that
 * two implementations of one design agree, and until now nothing in the repo
 * could show whether they do. See `workbench/leaf-pair.tsx`.
 *
 * ── Stories live in workbench/, NOT beside the components ────────────────────
 *
 * Tests are colocated here; stories deliberately are not. `packages/design-system`
 * publishes `src/` as-is, so a `*.stories.tsx` under `src/` would ship to every
 * consumer unless a `files` negation caught it — and adding one would make this
 * repo-infrastructure change a published-artifact change, needing a version
 * bump and a release for a file nobody installs. Keeping stories out of the
 * packages keeps the two concerns separable.
 *
 * The cost is honest: a story is one directory away from its component, so a
 * new component can be added without one. Colocating later is a small move if
 * that trade stops paying — add `!src/**‍/*.stories.tsx` to the package's
 * `files` and extend the tarball guard in `.github/workflows/pr.yml` that
 * already proves no test file escapes.
 */
const config: StorybookConfig = {
  framework: {
    name: '@storybook/react-native-web-vite',
    options: {},
  },

  stories: ['../workbench/**/*.mdx', '../workbench/**/*.stories.@(ts|tsx)'],

  addons: [
    // Runs axe against every story, in the browser, on the rendered DOM.
    //
    // This is the addon that earns Storybook's weight here. Accessibility is
    // this package's main job — the components exist to make an unlabelled
    // input or an untargetable button hard to write — and contrast, target
    // size and accessible names are properties of rendered pixels and a real
    // accessibility tree. That is where axe looks, and where a jsdom unit test
    // cannot.
    '@storybook/addon-a11y',

    // Runs every story as a Vitest test in a real browser, which is what turns
    // the a11y checks above from a panel into a gate. See `a11y.test` in
    // preview.tsx.
    '@storybook/addon-vitest',

    // Assembles a docs page per component from the SAME stories the gate above
    // already runs — JSDoc above a story becomes its description, meta-level
    // JSDoc the component summary. This is the workbench growing captions, not
    // a second gallery: nothing here is authored twice, so nothing can drift.
    //
    // Two honest limits. The props table comes from react-docgen, which under
    // this framework resolves imported prop types unreliably — controls are
    // therefore always declared by hand in `argTypes`, never inferred (if the
    // tables ever matter more, `typescript: { reactDocgen:
    // 'react-docgen-typescript' }` here resolves them properly at the cost of
    // slower startup). And the assembled docs page itself is only
    // compile-checked by `storybook:build`; addon-vitest tests stories, so axe
    // never audits the docs page as a whole — each story on it is gated
    // individually, the page chrome is not.
    '@storybook/addon-docs',
  ],

  viteFinal: async (viteConfig) => {
    // The starting scheme, compiled into the preview as a literal. See
    // `initialScheme()` above for why it lives here and not in vitest.config.ts.
    viteConfig.define = {
      ...viteConfig.define,
      __WORKBENCH_SCHEME__: JSON.stringify(initialScheme()),
    };

    // The `react-native` → workbench shim substitution — done by REWRITING THE
    // RESOLVED ALIAS TABLE, because every politer mechanism loses:
    //
    // 1. A `resolve.alias` entry here loses. The framework's vite-plugin-rnw
    //    sets `resolve.alias: { 'react-native': 'react-native-web' }` from a
    //    plugin `config()` hook, and Vite merges plugin config OVER user
    //    config — so the same-named entry this file used to declare was
    //    silently clobbered.
    // 2. A `resolveId` plugin loses too, even with `enforce: 'pre'`. Vite's
    //    internal alias plugins run before every user plugin, and by the time
    //    any resolveId hook sees the import, `react-native` has already been
    //    rewritten to the pre-bundled react-native-web dep.
    //
    // Both failures were invisible in a light-preferring browser: the leaves
    // got react-native-web's REAL `useColorScheme` — which follows the
    // browser's `prefers-color-scheme` — and "broken, following the OS"
    // renders identically to "working, store says light". In a dark-preferring
    // browser every native pane wore the dark palette under a toolbar that
    // said Light, which is how it was finally caught.
    //
    // So the substitution is itself a plugin `config()` hook, on a plugin that
    // SORTS AFTER vite-plugin-rnw: plugin config hooks run pre → normal →
    // post, vite-plugin-rnw is `enforce: 'pre'`, this plugin is unenforced,
    // and the last merge of a key wins. The same clobbering mechanism that
    // broke the user-config alias, pointed the other way.
    //
    // The shim re-exports react-native-web untouched except for
    // `useColorScheme`, which the Scheme toolbar needs to drive.
    // react-native-web's Appearance latches a MediaQueryList at module load,
    // so no `matchMedia` patch can be guaranteed to land first — measured, not
    // assumed: Storybook injects preview-head.html after its own module
    // scripts. workbench/react-native.ts has the full reasoning and the limits
    // of the substitution.
    const shimPath = join(repoRoot, 'workbench/react-native.ts');
    viteConfig.plugins = [
      ...(viteConfig.plugins ?? []),
      {
        name: 'workbench:react-native-shim',
        config() {
          return { resolve: { alias: { 'react-native': shimPath } } };
        },
      },
    ];

    // `react-native` must NOT be pre-bundled: an optimized copy of the shim
    // would carry a PRIVATE copy of workbench/scheme.ts, and the toolbar would
    // notify one store while the leaves read another. Served as source, the
    // shim's `./scheme` import resolves to the same module preview.tsx uses.
    viteConfig.optimizeDeps = {
      ...viteConfig.optimizeDeps,
      exclude: [...(viteConfig.optimizeDeps?.exclude ?? []), 'react-native'],
    };

    // Tailwind v4, for the `.web` leaves only — they carry utility class
    // strings and nothing else generates them.
    //
    // `workbench/tailwind.css` mirrors a web consumer's entrypoint,
    // `@source` line included. Without that line Tailwind never scans the
    // package's source, generates none of the utilities the leaves reference,
    // and every web leaf renders unstyled while appearing to work — the
    // classic failure this repo's docs already warn about. If the workbench
    // ever shows naked HTML, look there first.
    viteConfig.plugins = [...(viteConfig.plugins ?? []), tailwindcss()];

    // CommonJS dependencies of the story-as-test setup, forced through Vite's
    // pre-bundler so they gain named/default ESM exports.
    //
    // These are reached only from `@storybook/addon-vitest`'s setup file, which
    // Vite's dependency scan does not walk, so it serves them raw and the
    // browser rejects them one at a time:
    //
    //   SyntaxError: The requested module '/node_modules/aria-query/lib/index.js'
    //   does not provide an export named 'elementRoles'
    //   SyntaxError: The requested module '/node_modules/lz-string/libs/lz-string.js'
    //   does not provide an export named 'default'
    //
    // Each reads as a Storybook bug and is really an unconverted CJS module.
    // Listed together rather than added one failure at a time, because they all
    // arrive from the same place for the same reason. If a new one appears
    // after a dependency bump, add it here — the message names the package.
    viteConfig.optimizeDeps = {
      ...viteConfig.optimizeDeps,
      include: [
        ...(viteConfig.optimizeDeps?.include ?? []),
        'aria-query',
        'lz-string',
        'dom-accessibility-api',
        'pretty-format',
        'axe-core',

        // Pre-declared because the react-native shim below HIDES it from
        // Vite's dependency scanner: with `react-native` excluded from
        // optimization and aliased to workbench source, nothing bare-imports
        // react-native-web until the shim module is actually SERVED — so on
        // a COLD optimizer cache (every CI run) Vite discovers it mid-test,
        // re-optimizes, and reloads the run. That surfaced as "Vite
        // unexpectedly reloaded a test" plus ten stories failing in under
        // 20ms on "Failed to fetch dynamically imported module" — the failed
        // fetches naming unrelated chunks (addon-docs) whose hashes the
        // re-optimization had just invalidated. A warm local cache never
        // reproduces it, which is exactly why it shipped; `rm -rf
        // node_modules/.cache/storybook && npm run test:a11y` is the honest
        // local rehearsal of CI.
        'react-native-web',
      ],
    };

    // Resolve the packages from source rather than through their `exports`
    // maps. The workbench imports individual LEAVES by path
    // (`.../select.web`), which `exports` deliberately does not expose —
    // consumers must never reach past the barrel, but the workbench is not a
    // consumer, it is this repo looking at its own internals.
    viteConfig.resolve = {
      ...viteConfig.resolve,
      alias: {
        ...(viteConfig.resolve?.alias ?? {}),
        '@design-system': join(repoRoot, 'packages/design-system/src'),
        '@tokens': join(repoRoot, 'packages/tokens/src'),

        // NO `react-native` entry here — that substitution is the resolver
        // plugin at the top of this function. An alias with that key used to
        // live here, with a comment claiming spread order made it win over the
        // framework's own `react-native` → `react-native-web` alias. It did
        // not: vite-plugin-rnw injects its alias from a plugin `config()`
        // hook, which Vite merges OVER user config, and the clobber was
        // invisible in any light-preferring browser. If the shim ever stops
        // taking effect, suspect the plugin ordering — never reintroduce the
        // alias entry and call it fixed, because it will look fixed.
      },

      // `.native.*` LAST, and this is the subtle part of the whole setup.
      //
      // The leaves import their shared modules extensionlessly — `./x.props`,
      // `../lib/cn`, `../lib/native-theme` — and each consumer's bundler
      // resolves those its own way. Metro appends `.native`; Vite does not, so
      // a `.native` leaf's `../lib/native-theme` is simply unresolvable here
      // until these are added (it exists only as `native-theme.native.ts`).
      //
      // Appended rather than prepended so the unsuffixed file always wins:
      // `./button.props` must reach `button.props.ts`, never a hypothetical
      // `button.props.native.ts`.
      //
      // WHY ONE CONFIG CAN SERVE BOTH LEAVES AT ONCE — and the invariant that
      // keeps it true. If a leaf ever imported another COMPONENT
      // extensionlessly (`../field` rather than `../field/field.props`), the
      // same specifier would have to resolve to `.web` in one pane and
      // `.native` in the other, which no single Vite config can do, and the
      // native pane would silently embed a web component. Today every
      // leaf-to-leaf import goes through a shared `.props` module instead, so
      // every specifier here has exactly one answer. If a story ever renders
      // visibly wrong internals, check that invariant first.
      extensions: [
        ...(viteConfig.resolve?.extensions ?? [
          '.mjs',
          '.js',
          '.mts',
          '.ts',
          '.jsx',
          '.tsx',
          '.json',
        ]),
        '.native.ts',
        '.native.tsx',
      ],
    };

    return viteConfig;
  },
};

export default config;
