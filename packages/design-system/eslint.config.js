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
    files: ['**/*.props.ts', 'src/lib/**/*.ts', 'src/lib/**/*.tsx'],
    // `.native.*` files under src/lib are platform LEAVES, not shared modules:
    // the same `.native.` infix that routes them to Metro (and to
    // tsconfig.native.json's moduleSuffixes) is what exempts them here,
    // because a leaf imports its own renderer by definition. The web typecheck
    // and a web consumer's Vite cannot resolve a `.native.` file at all, so the
    // exemption cannot leak react-native into a web bundle. Every props file
    // and every extensionless (shared) lib module stays fenced.
    ignores: ['src/lib/**/*.native.ts', 'src/lib/**/*.native.tsx'],
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
    // Named HEIGHT and SIZE utilities are banned, because in this theme they do
    // not mean what a Tailwind reader expects.
    //
    // theme.css names its spacing scale with t-shirt sizes (`--spacing-md:
    // 1rem`), and every utility that resolves through the spacing namespace
    // picks those up. For heights that namespace is the LAST one Tailwind
    // consults and there is no other — stock Tailwind has no `h-md` at all — so
    // `h-md`/`max-h-lg`/`size-xl` are additions rather than redefinitions, and
    // they are worth a few px each rather than the sizes they read as.
    // `max-h-md` is 16px. Write an explicit length instead: `max-h-[80vh]`.
    //
    // WIDTHS used to be here too, and were the more dangerous half: `w-*`,
    // `min-w-*`, `max-w-*` and `basis-*` resolve spacing AHEAD of Tailwind's own
    // `--container-*` scale, so `max-w-md` did not merely mean something new —
    // it overwrote a built-in, compiling to 16px where every reader saw 28rem.
    // Dialog and AlertDialog collapsed below their own padding on exactly that.
    // 0.14.0 fixed it at the source: theme.css re-points those four keys at the
    // container scale, `src/styles/theme.test.ts` holds them there, and the
    // width family is legal again. Do not put it back in this selector without
    // reading that test first.
    //
    // Spacing utilities (`p-lg`, `gap-md`, `py-xs`) were never banned —
    // resolving those against the spacing scale is the whole point.
    files: ['**/*.web.tsx', '**/*.props.ts', 'src/lib/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/\\b(?:max-h|min-h|h|size)-(?:xs|sm|md|lg|xl|xxl)\\b/]',
          message:
            "Named height/size utilities resolve against this theme's t-shirt SPACING scale — `max-h-md` is 16px, not a medium height. Use an explicit length: `max-h-[80vh]`. (Spacing utilities like `p-lg` and `gap-md` are fine, and so are widths: `max-w-md` is 28rem.)",
        },
        {
          selector:
            'TemplateElement[value.raw=/\\b(?:max-h|min-h|h|size)-(?:xs|sm|md|lg|xl|xxl)\\b/]',
          message:
            "Named height/size utilities resolve against this theme's t-shirt SPACING scale — `max-h-md` is 16px, not a medium height. Use an explicit length: `max-h-[80vh]`. (Spacing utilities like `p-lg` and `gap-md` are fine, and so are widths: `max-w-md` is 28rem.)",
        },
      ],
    },
  },
];
