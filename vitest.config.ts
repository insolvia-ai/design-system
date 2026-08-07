import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

import { playwright } from '@vitest/browser-playwright';

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    // Coverage is measured over the published source only — the workbench and
    // config files are infrastructure, and counting them would let scaffolding
    // pad the number. Reached via `npm run test:coverage` (or the Coverage
    // toggle in Storybook's testing widget); deliberately NOT part of `npm run
    // ci` — a threshold nobody has argued for would only teach people to game
    // it.
    coverage: {
      provider: 'v8',
      include: ['packages/*/src/**'],
      reporter: ['text', 'html'],
    },

    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },

      // Plain Node, no browser — kept as its own project rather than folded
      // into `storybook` because it needs no Playwright/Chromium instance and
      // must not pay for one. `test:a11y` pins `--project=storybook`, so this
      // project runs independently under `test:workbench` and the two never
      // block each other.
      {
        extends: true,
        test: {
          name: 'workbench',
          environment: 'node',
          include: ['workbench/**/*.test.ts'],
        },
      },
    ],
  },
});
