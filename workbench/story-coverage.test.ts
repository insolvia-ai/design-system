// Machine check for a gap this repo already named and accepted: `.storybook/main.ts`
// says outright that "a story is one directory away from its component, so a
// new component can be added without one." Twenty of this package's twenty-two
// components shipped with no story at all, and nothing red ever said so —
// review was the only thing standing between "component exists" and "component
// is visible in the one place that renders it", and review missed it twenty
// times running.
//
// What this checks: that `workbench/<component>.stories.tsx` exists for every
// component directory under `packages/design-system/src/`, that the file
// exports at least one story beyond `meta`, that it declares meta-level `args`
// (what the Controls panel edits), and — for the hand-listed INTERACTIVE
// components below — that it carries a `play` function. What this does NOT
// check: whether the story is any good, whether it exercises the interesting
// props, whether both leaves are actually wired up via `<LeafPair>`, or
// whether it passes the a11y gate — that is `test:a11y`'s job, over in the
// `storybook` project, and it only ever looks at stories that exist. These are
// source-text regexes, nothing more. They exist to make the gaps impossible to
// merge quietly, not to replace looking at the workbench.
//
// The component list is derived from the filesystem, not hard-coded: a
// directory counts as a component if it contains a `*.web.tsx` file, which is
// exactly what distinguishes `button/`, `select/`, etc. from `lib/` and
// `styles/`. A hard-coded list would need maintaining by exactly the person who
// just forgot to write the story — the same failure this file exists to catch,
// one level up.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(here);
const componentsDir = join(repoRoot, 'packages/design-system/src');

function isComponentDir(name: string): boolean {
  const full = join(componentsDir, name);
  if (!statSync(full).isDirectory()) return false;
  return readdirSync(full).some((entry) => entry.endsWith('.web.tsx'));
}

const components = readdirSync(componentsDir).filter(isComponentDir).sort();

// The components whose story file must carry a `play` function — the ones with
// events, state, or keyboard grammar, where "renders" proves almost nothing.
//
// HAND-MAINTAINED, unlike the component list above, because interactivity is a
// judgment, not a filesystem fact: nothing about `meter/`'s files says it only
// displays, and nothing about `switch/`'s says it toggles. Adding an
// interactive component means adding it here in the same PR — and the check
// below throws on a listed name with no component directory, so a rename or
// removal cannot leave a ghost entry silently satisfied.
const INTERACTIVE = [
  'accordion',
  'alert',
  'alert-dialog',
  'breadcrumbs',
  'button',
  'checkbox',
  'checkbox-group',
  'collapsible',
  'combobox',
  'date-input',
  'date-picker',
  'dialog',
  'drawer',
  'dropdown',
  'field',
  'input',
  'input-group',
  'popover',
  'radio-group',
  'select',
  'sidebar',
  'switch',
  'tabs',
  'textarea',
  'toast',
  'toggle',
  'toggle-group',
  'tooltip',
  'wheel',
] as const;

for (const name of INTERACTIVE) {
  if (!components.includes(name)) {
    throw new Error(
      `story-coverage.test.ts lists "${name}" as interactive, but no such component ` +
        `directory exists under ${componentsDir}. The INTERACTIVE list is stale — ` +
        `fix the list before trusting this test's result.`,
    );
  }
}

// Sanity check on the check itself: if this trips, the derivation above is
// broken (wrong directory, renamed leaf suffix, …), not that the package
// suddenly lost every component.
if (components.length === 0) {
  throw new Error(
    `story-coverage.test.ts found no component directories under ${componentsDir} ` +
      '(a directory containing a *.web.tsx file). Either the package moved or the ' +
      'detection in this file is broken — fix the test before trusting its result.',
  );
}

describe('every component has a workbench story', () => {
  for (const component of components) {
    it(`${component} has workbench/${component}.stories.tsx with at least one story`, () => {
      const storyPath = join(repoRoot, 'workbench', `${component}.stories.tsx`);

      let source: string;
      try {
        source = readFileSync(storyPath, 'utf8');
      } catch {
        throw new Error(
          `Missing story: packages/design-system/src/${component}/ has no matching ` +
            `workbench/${component}.stories.tsx.\n\n` +
            `The workbench is the only place in this repo a component is looked at ` +
            `rather than asserted about (see .storybook/main.ts). Create ` +
            `workbench/${component}.stories.tsx — use workbench/button.stories.tsx as ` +
            `the template, and see "What a component owes" in the design-system-component ` +
            `skill for what the story should cover.`,
        );
      }

      // A source-text check, not an import: story modules are browser modules
      // (they pull in react-native-web via the workbench's Vite aliasing) and
      // have no business loading under plain Node. This only proves the file
      // exports something beyond `meta` — it says nothing about whether that
      // export renders, or renders correctly. Deliberately simple.
      const namedExports = source.match(/^export const \w+/gm) ?? [];

      if (namedExports.length === 0) {
        throw new Error(
          `workbench/${component}.stories.tsx exists but exports no story beyond ` +
            `the default \`meta\` export — it satisfies this check's bare existence ` +
            `test while showing nothing in the workbench. Add at least one ` +
            `\`export const <Name>: Story = { ... }\`, pairing both leaves via ` +
            `<LeafPair> (see workbench/button.stories.tsx).`,
        );
      }

      // Meta-level args are what make a story explorable: they are what the
      // Controls panel edits and what the meta `render` threads into both
      // leaves. A regex for `args: {`, like the export check above — heuristic
      // on purpose, and gameable by anyone determined to game it; it exists to
      // catch the honest omission, not the adversary.
      if (!/^\s*args:\s*\{/m.test(source)) {
        throw new Error(
          `workbench/${component}.stories.tsx declares no \`args\`. Every story ` +
            `file carries meta-level args threaded into both leaves through a meta ` +
            `\`render\` — that is what makes the Controls panel work and what lets ` +
            `typecheck:workbench check every prop name against both leaves. See ` +
            `workbench/button.stories.tsx for the pattern.`,
        );
      }

      // Interactive components owe a play function: axe runs AFTER the play,
      // so a play that ends open/expanded is the only way CI ever audits those
      // states, and a handler nobody calls is indistinguishable from a wired
      // one until something counts its calls.
      if ((INTERACTIVE as readonly string[]).includes(component) && !/^\s*play:/m.test(source)) {
        throw new Error(
          `workbench/${component}.stories.tsx has no \`play\` function, but ` +
            `"${component}" is in this test's INTERACTIVE list. Drive both panes with ` +
            `pair() from workbench/leaf-pair.tsx (see workbench/select.stories.tsx for ` +
            `keyboard work, workbench/dialog.stories.tsx for portaled overlays) — or, ` +
            `if this component genuinely stopped being interactive, remove it from the ` +
            `list with a line saying why.`,
        );
      }
    });
  }
});
