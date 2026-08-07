import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Text, View } from 'react-native';

import { Card as CardWeb } from '@design-system/card/card.web.tsx';
import { Card as CardNative } from '@design-system/card/card.native.tsx';
import type { CardElevation } from '@design-system/card/card.props.ts';

import { LeafPair } from './leaf-pair.tsx';

// The two elevations that EXIST — tied to `CardElevation` with `satisfies` so
// a typo here is a `typecheck:workbench` failure, not a card that quietly
// renders with no shadow class (the same reasoning as `button.stories.tsx`'s
// `INTENTS`).
const ELEVATIONS = ['flat', 'raised'] as const satisfies readonly CardElevation[];

/**
 * `Card` is a parts object (`Root`/`Title`/`Body`/`Footer`), the same shape
 * as `Dialog` — there is no single component for a meta `component` to point
 * at, so the args below cover the CONTENT threaded into that composition
 * (title, body copy, footer note) plus `Root`'s own `elevation`.
 */
type CardArgs = {
  elevation: CardElevation;
  title: string;
  body: string;
  footerNote: string;
};

/**
 * A bordered surface for a title/body/footer trio, with an optional shadow.
 * Pure presentation — no state, no behavior — so both leaves are a direct
 * style port off `card.props.ts`'s `elevationStyles`.
 */
const meta = {
  title: 'Components/Card',
  parameters: { layout: 'fullscreen' },
  args: {
    elevation: 'raised',
    title: 'Chapter 7 in minutes',
    body: 'Schedules, means test, and the petition, all from one intake.',
    footerNote: 'Included in every plan',
  },
  argTypes: {
    elevation: { control: 'inline-radio', options: [...ELEVATIONS] },
  },
  render: (args) => (
    <LeafPair
      note='The web Title is an `<h3>`; the native Title is an `<h1>` (`accessibilityRole="header"`). Same card, different heading level — see the doc comment above this story.'
      web={
        <CardWeb.Root elevation={args.elevation} style={{ maxWidth: 360 }}>
          <CardWeb.Title>{args.title}</CardWeb.Title>
          <CardWeb.Body>{args.body}</CardWeb.Body>
          <CardWeb.Footer>
            <span style={{ fontSize: 13 }}>{args.footerNote}</span>
          </CardWeb.Footer>
        </CardWeb.Root>
      }
      native={
        <CardNative.Root elevation={args.elevation} style={{ maxWidth: 360 }}>
          <CardNative.Title>{args.title}</CardNative.Title>
          <CardNative.Body>{args.body}</CardNative.Body>
          <CardNative.Footer>
            <Text style={{ fontSize: 13 }}>{args.footerNote}</Text>
          </CardNative.Footer>
        </CardNative.Root>
      }
    />
  ),
} satisfies Meta<CardArgs>;

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
export const Basic: Story = {};

/**
 * The two elevations side by side — `flat` sits flush with the page, `raised`
 * lifts off it with a shadow. A grid, not a single card, so this stays its
 * own render rather than an `args` override of `Basic`.
 */
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
