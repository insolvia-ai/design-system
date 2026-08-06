import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import type { StorybookConfig } from '@storybook/react-native-web-vite';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

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

  stories: ['../workbench/**/*.stories.@(ts|tsx)'],

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
  ],

  viteFinal: async (viteConfig) => {
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

        // Overrides the framework's own `react-native` → `react-native-web`
        // alias, and must stay AFTER the spread above for that to hold.
        //
        // The shim re-exports react-native-web untouched except for
        // `useColorScheme`, which the Scheme toolbar needs to drive.
        // react-native-web's Appearance latches a MediaQueryList at module
        // load, so no `matchMedia` patch can be guaranteed to land first —
        // measured, not assumed: Storybook injects preview-head.html after its
        // own module scripts. workbench/react-native.ts has the full reasoning
        // and the limits of the substitution.
        'react-native': join(repoRoot, 'workbench/react-native.ts'),
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
