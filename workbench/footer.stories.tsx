import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { Footer as FooterWeb } from '@design-system/footer/footer.web.tsx';
import { Footer as FooterNative } from '@design-system/footer/footer.native.tsx';

import { LeafPair } from './leaf-pair.tsx';

const meta = {
  title: 'Components/Footer',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

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
export const Default: Story = {
  render: () => (
    <LeafPair
      note='Group titles double as landmark names. The web Group is a named `navigation` landmark; the native Group is `accessibilityRole="summary"` — a `region` landmark. Same title, different role. The web Link needs a real `href`; the native Link takes `onPress` instead.'
      web={
        <FooterWeb.Root>
          <FooterWeb.Group title="Product">
            <FooterWeb.Link href="/features">Features</FooterWeb.Link>
            <FooterWeb.Link href="/pricing">Pricing</FooterWeb.Link>
            <FooterWeb.Link href="/security">Security</FooterWeb.Link>
          </FooterWeb.Group>
          <FooterWeb.Group title="Company">
            <FooterWeb.Link href="/about">About</FooterWeb.Link>
            <FooterWeb.Link href="/careers">Careers</FooterWeb.Link>
          </FooterWeb.Group>
          <FooterWeb.Note>
            © 2026 Meridian Debt Relief. Not a law firm; not legal advice.
          </FooterWeb.Note>
        </FooterWeb.Root>
      }
      native={
        <FooterNative.Root>
          <FooterNative.Group title="Product">
            <FooterNative.Link onPress={() => {}}>Features</FooterNative.Link>
            <FooterNative.Link onPress={() => {}}>Pricing</FooterNative.Link>
            <FooterNative.Link onPress={() => {}}>Security</FooterNative.Link>
          </FooterNative.Group>
          <FooterNative.Group title="Company">
            <FooterNative.Link onPress={() => {}}>About</FooterNative.Link>
            <FooterNative.Link onPress={() => {}}>Careers</FooterNative.Link>
          </FooterNative.Group>
          <FooterNative.Note>
            © 2026 Meridian Debt Relief. Not a law firm; not legal advice.
          </FooterNative.Note>
        </FooterNative.Root>
      }
    />
  ),
};
