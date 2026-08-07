// Rules live in the repo root's `eslint.base.js`. That file is not named
// `eslint.config.js` on purpose — see its header for what breaks when a
// discoverable flat config sits at the repo root.
//
// The one addition is this package's load-bearing rule, machine-enforced: a
// `*.props.ts` module is the platform-SHARED third of a component and must
// never import a renderer. One react-native import in a props file would drag
// react-native-web into a web consumer's bundle; one react-dom import would break
// the native leaves. The leaves themselves import their own platform freely —
// the ban is scoped to the shared modules only.
import base from '../../eslint.base.js';

export default [
  ...base,
  {
    files: ['**/*.props.ts', 'src/lib/**/*.ts'],
    // `.native.*` files under src/lib are platform LEAVES, not shared modules:
    // the same `.native.` infix that routes them to Metro (and to
    // tsconfig.native.json's moduleSuffixes) is what exempts them here,
    // because a leaf imports its own renderer by definition. The web typecheck
    // and a web consumer's Vite cannot resolve a `.native.` file at all, so the
    // exemption cannot leak react-native into a web bundle. Every props file
    // and every extensionless (shared) lib module stays fenced.
    ignores: ['src/lib/**/*.native.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react-native', 'react-native/*', 'react-native-web', 'react-native-web/*'],
              message:
                'Shared props modules must stay renderer-free: react-native belongs in the .native leaf only.',
            },
            {
              group: ['react-dom', 'react-dom/*'],
              message:
                'Shared props modules must stay renderer-free: react-dom belongs in the .web leaf only.',
            },
            {
              group: ['@base-ui/*'],
              message:
                'Base UI was retired with the predecessor package; nothing here may depend on it.',
            },
          ],
        },
      ],
    },
  },
  {
    // Named WIDTH/HEIGHT utilities are banned, because in this theme they do
    // not mean what they say.
    //
    // theme.css names its spacing scale with t-shirt sizes (`--spacing-md:
    // 1rem`), and Tailwind v4 resolves a named `max-w-*`/`w-*`/`h-*` from the
    // spacing namespace AHEAD of its own `--container-*` scale. So `max-w-md`
    // compiles to `max-width: var(--spacing-md)` — 16px, not the 28rem every
    // reader assumes. 0.8.4 fixed exactly that in the Dialog and AlertDialog
    // cards, where the popup collapsed below its own padding.
    //
    // Nothing else can catch this: the class is valid Tailwind, tsc never reads
    // CSS, jsdom computes no layout, and axe passes an overflowing dialog whose
    // contrast and accessible name are both fine. The failure is only visible
    // to a human looking at the workbench, which is how it shipped.
    //
    // Spacing utilities (`p-lg`, `gap-md`, `py-xs`) are NOT banned — resolving
    // those against the spacing scale is the whole point. Only the sizing
    // family lies. Write an explicit length instead: `max-w-[28rem]`.
    files: ['**/*.web.tsx', '**/*.props.ts', 'src/lib/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'Literal[value=/\\b(?:max-w|min-w|w|max-h|min-h|h|size|basis)-(?:xs|sm|md|lg|xl|xxl)\\b/]',
          message:
            "Named width/height utilities resolve against this theme's t-shirt SPACING scale, not Tailwind's container scale — `max-w-md` is 16px, not 28rem. Use an explicit length: `max-w-[28rem]`. (Spacing utilities like `p-lg` and `gap-md` are fine.)",
        },
        {
          selector:
            'TemplateElement[value.raw=/\\b(?:max-w|min-w|w|max-h|min-h|h|size|basis)-(?:xs|sm|md|lg|xl|xxl)\\b/]',
          message:
            "Named width/height utilities resolve against this theme's t-shirt SPACING scale, not Tailwind's container scale — `max-w-md` is 16px, not 28rem. Use an explicit length: `max-w-[28rem]`. (Spacing utilities like `p-lg` and `gap-md` are fine.)",
        },
      ],
    },
  },
];
