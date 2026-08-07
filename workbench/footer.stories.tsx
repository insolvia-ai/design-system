import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Footer as FooterWeb } from '@design-system/footer/footer.web.tsx';
import { Footer as FooterNative } from '@design-system/footer/footer.native.tsx';

import { LeafPair } from './leaf-pair.tsx';

/**
 * `Footer` is a parts object (`Root`/`Group`/`Link`/`Note`), the same shape
 * as `Dialog` — there is no single component for a meta `component` to point
 * at, so the args below cover the CONTENT threaded into the fixed
 * composition: the two group titles and the closing note. The link labels
 * and hrefs stay hardcoded, the same way Dialog hardcodes its "Save note"
 * button — they're structural, not something a docs-page reader tunes.
 */
type FooterArgs = {
  productTitle: string;
  companyTitle: string;
  note: string;
};

/**
 * The page's `contentinfo` landmark: a row of named link groups plus a
 * closing note. Pure presentation — no state, no behavior.
 */
const meta = {
  title: 'Components/Footer',
  parameters: { layout: 'fullscreen' },
  args: {
    productTitle: 'Product',
    companyTitle: 'Company',
    note: '© 2026 Outer Rim Freight. Not affiliated with the Galactic Senate.',
  },
  render: (args) => (
    <LeafPair
      note='Group titles double as landmark names. The web Group is a named `navigation` landmark; the native Group is `accessibilityRole="summary"` — a `region` landmark. Same title, different role. The web Link needs a real `href`; the native Link takes `onPress` instead.'
      web={
        <FooterWeb.Root>
          <FooterWeb.Group title={args.productTitle}>
            <FooterWeb.Link href="/features">Features</FooterWeb.Link>
            <FooterWeb.Link href="/pricing">Pricing</FooterWeb.Link>
            <FooterWeb.Link href="/security">Security</FooterWeb.Link>
          </FooterWeb.Group>
          <FooterWeb.Group title={args.companyTitle}>
            <FooterWeb.Link href="/about">About</FooterWeb.Link>
            <FooterWeb.Link href="/careers">Careers</FooterWeb.Link>
          </FooterWeb.Group>
          <FooterWeb.Note>{args.note}</FooterWeb.Note>
        </FooterWeb.Root>
      }
      native={
        <FooterNative.Root>
          <FooterNative.Group title={args.productTitle}>
            <FooterNative.Link onPress={() => {}}>Features</FooterNative.Link>
            <FooterNative.Link onPress={() => {}}>Pricing</FooterNative.Link>
            <FooterNative.Link onPress={() => {}}>Security</FooterNative.Link>
          </FooterNative.Group>
          <FooterNative.Group title={args.companyTitle}>
            <FooterNative.Link onPress={() => {}}>About</FooterNative.Link>
            <FooterNative.Link onPress={() => {}}>Careers</FooterNative.Link>
          </FooterNative.Group>
          <FooterNative.Note>{args.note}</FooterNative.Note>
        </FooterNative.Root>
      }
    />
  ),
} satisfies Meta<FooterArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Only one Footer.Root is rendered per pane here, and that is load-bearing,
 * not a content choice.
 *
 * The web Root is a `<footer>` — a `contentinfo` landmark — and a page may
 * have only one. Two Roots side by side, even to compare states, would fail
 * `landmark-no-duplicate-contentinfo` inside this story. The native Root is a
 * plain `View` with no landmark role, so the constraint is web-only, but
 * `LeafPair` always pairs one web render with one native render, so it governs
 * the whole story regardless. The two link groups below get their DISTINCT
 * titles for the same kind of reason: the web Group is a named `navigation`
 * landmark, and two groups sharing a title would fail `landmark-unique`.
 */
export const Basic: Story = {};
