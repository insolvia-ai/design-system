import * as React from 'react';
import type { Preview } from '@storybook/react-native-web-vite';
import { MINIMAL_VIEWPORTS } from 'storybook/viewport';

import '../workbench/tailwind.css';
// After tailwind.css on purpose: this only overrides addon-docs' own canvas
// chrome, and later is the side of a specificity tie to be on. See the file.
import './docs-canvas.css';
import { applyScheme, type Scheme } from '../workbench/scheme.ts';
import { workbenchTheme } from './theme.ts';

/**
 * Colour scheme is a first-class control here, not a nicety.
 *
 * The `.native` leaves resolve colours at RENDER time via `useNativeColors()`.
 * 0.2.1 shipped every native leaf reading `colors.light` at module *load*
 * instead, so every design-system surface stayed light inside a dark app —
 * invisible to the test suite, and obvious the moment you can flip the scheme
 * and watch. `workbench/scheme.ts` explains how one toolbar item drives two
 * completely different scheme mechanisms.
 */
const preview: Preview = {
  // Every component gets an autodocs page assembled from its stories — see the
  // addon-docs entry in main.ts for what that buys and what it doesn't.
  tags: ['autodocs'],

  parameters: {
    controls: { expanded: true },

    // Docs pages render inside the PREVIEW, not the manager, so manager.ts's
    // theme does not reach them — without this they'd be the one white surface
    // left in the shell. Same theme object; theme.ts owns the palette and the
    // reasoning.
    docs: { theme: workbenchTheme },

    // The stock small/large presets plus one phone-sized entry. The native
    // pane renders what a React Native consumer ships, and that consumer's
    // surface is a phone — a LeafPair story at 390px is the closest this
    // workbench gets to the device without a simulator.
    viewport: {
      options: {
        phone: { name: 'Phone (390×844)', styles: { width: '390px', height: '844px' } },
        ...MINIMAL_VIEWPORTS,
      },
    },

    // The leaf-pair frames draw their own spacing; Storybook's default padding
    // fights it.
    layout: 'fullscreen',

    a11y: {
      // 'error' — axe violations FAIL the run, in CI and locally.
      //
      // The other values are 'todo' (report only) and 'off'. Report-only is the
      // trap: the panel fills with violations that nobody is accountable for,
      // and a design system whose entire justification is that it makes
      // accessible markup the default cannot afford an advisory a11y check.
      //
      // This only bites because `@storybook/addon-vitest` runs every story as a
      // test in a real browser. That matters: axe needs computed styles and a
      // real accessibility tree, so contrast and target-size findings simply do
      // not exist under jsdom, which is where the rest of the suite lives.
      //
      // A story that must render an invalid state on purpose should scope the
      // exception to itself — `parameters: { a11y: { test: 'todo' } }` on that
      // story, with a comment saying why — rather than weakening this default.
      test: 'error',
    },
  },

  globalTypes: {
    scheme: {
      description: 'Colour scheme — drives BOTH leaves (see workbench/scheme.ts)',
      defaultValue: 'light',
      toolbar: {
        title: 'Scheme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },

  decorators: [
    (Story, context) => {
      const scheme = (context.globals['scheme'] as Scheme | undefined) ?? 'light';

      // In a layout effect so the attribute and the media-query listeners are
      // updated before the browser paints — otherwise every scheme change
      // flashes the old colours for a frame.
      React.useLayoutEffect(() => {
        applyScheme(scheme);
      }, [scheme]);

      return (
        <div
          // The web leaves read `data-theme` from an ancestor, so setting it on
          // the story root as well as the document keeps a story correct even
          // when it is rendered in isolation (docs page, embedded iframe).
          data-theme={scheme}
          style={{
            // Full-height in the canvas, but NOT on a docs page — there every
            // story renders inside an inline block, and 100vh would make each
            // one viewport-tall.
            minHeight: context.viewMode === 'docs' ? undefined : '100vh',
            background: 'var(--color-bg)',
            color: 'var(--color-ink)',
          }}
        >
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
