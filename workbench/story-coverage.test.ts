// Machine check for a gap this repo already named and accepted: `.storybook/main.ts`
// says outright that "a story is one directory away from its component, so a
// new component can be added without one." Twenty of this package's twenty-two
// components shipped with no story at all, and nothing red ever said so —
// review was the only thing standing between "component exists" and "component
// is visible in the one place that renders it", and review missed it twenty
// times running.
//
// What this checks: that `workbench/<component>.stories.tsx` exists for every
// component directory under `packages/design-system/src/`, and that the file
// exports at least one story beyond `meta`. What this does NOT check: whether
// the story is any good, whether it exercises the interesting props, whether
// both leaves are actually wired up via `<LeafPair>`, or whether it passes the
// a11y gate — that is `test:a11y`'s job, over in the `storybook` project, and it
// only ever looks at stories that exist. This test is a filename check with an
// export count attached, nothing more. It exists to make the gap impossible to
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
    });
  }
});
