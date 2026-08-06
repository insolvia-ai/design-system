import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Text, View } from 'react-native';

import { Card as CardWeb } from '@design-system/card/card.web.tsx';
import { Card as CardNative } from '@design-system/card/card.native.tsx';

import { LeafPair } from './leaf-pair.tsx';

const meta = {
  title: 'Components/Card',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Card.Title renders at a different heading level on each platform.
 *
 * The web leaf is an `<h3>`, chosen so a card can sit inside a page that
 * already owns its `<h1>`/`<h2>`. The native leaf sets
 * `accessibilityRole="header"`, which react-native-web maps to role `heading`
 * with no level attached — and renders as an `<h1>`. Neither pane fails axe on
 * its own (each heading is simply the first one in its own subtree), but
 * `LeafPair` always renders the web pane before the native one, and that fixed
 * order is what keeps `heading-order` green here: h3 then h1 is a decrease,
 * which axe allows, while h1 then h3 would skip a level on the way back down.
 * Don't reorder the panes.
 */
export const Default: Story = {
  render: () => (
    <LeafPair
      note='The web Title is an `<h3>`; the native Title is an `<h1>` (`accessibilityRole="header"`). Same card, different heading level — see the doc comment above this story.'
      web={
        <CardWeb.Root elevation="raised" style={{ maxWidth: 360 }}>
          <CardWeb.Title>Chapter 7 in minutes</CardWeb.Title>
          <CardWeb.Body>Schedules, means test, and the petition, all from one intake.</CardWeb.Body>
          <CardWeb.Footer>
            <span style={{ fontSize: 13 }}>Included in every plan</span>
          </CardWeb.Footer>
        </CardWeb.Root>
      }
      native={
        <CardNative.Root elevation="raised" style={{ maxWidth: 360 }}>
          <CardNative.Title>Chapter 7 in minutes</CardNative.Title>
          <CardNative.Body>
            Schedules, means test, and the petition, all from one intake.
          </CardNative.Body>
          <CardNative.Footer>
            <Text style={{ fontSize: 13 }}>Included in every plan</Text>
          </CardNative.Footer>
        </CardNative.Root>
      }
    />
  ),
};

export const Elevations: Story = {
  render: () => (
    <LeafPair
      web={
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <CardWeb.Root elevation="flat" style={{ width: 220 }}>
            <CardWeb.Title>Flat</CardWeb.Title>
            <CardWeb.Body>No shadow — sits flush with the page.</CardWeb.Body>
          </CardWeb.Root>
          <CardWeb.Root elevation="raised" style={{ width: 220 }}>
            <CardWeb.Title>Raised</CardWeb.Title>
            <CardWeb.Body>A shadow lifts it above the page.</CardWeb.Body>
          </CardWeb.Root>
        </div>
      }
      native={
        <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
          <CardNative.Root elevation="flat" style={{ width: 220 }}>
            <CardNative.Title>Flat</CardNative.Title>
            <CardNative.Body>No shadow — sits flush with the page.</CardNative.Body>
          </CardNative.Root>
          <CardNative.Root elevation="raised" style={{ width: 220 }}>
            <CardNative.Title>Raised</CardNative.Title>
            <CardNative.Body>A shadow lifts it above the page.</CardNative.Body>
          </CardNative.Root>
        </View>
      }
    />
  ),
};
