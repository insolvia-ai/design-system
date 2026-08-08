import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Text, View } from 'react-native';

import { Card as CardWeb } from '@design-system/card/card.web.tsx';
import { Card as CardNative } from '@design-system/card/card.native.tsx';
import type { CardElevation } from '@design-system/card/card.props.ts';

import { LeafPair } from './leaf-pair.tsx';
import { InkText } from './ink-text.tsx';

// The two elevations that EXIST — tied to `CardElevation` with `satisfies` so
// a typo here is a `typecheck:workbench` failure, not a card that quietly
// renders with no shadow class (the same reasoning as `button.stories.tsx`'s
// `INTENTS`).
const ELEVATIONS = ['flat', 'raised'] as const satisfies readonly CardElevation[];

// An inline data URI, not a hosted placeholder: the workbench and its a11y
// gate must render with no network, and a story that silently shows a broken
// image is worse than one that shows none. Built with a template literal and
// `encodeURIComponent` so the SVG's own quotes need no escaping — a hand-
// escaped data URI is unreadable and, as this file briefly proved, easy to
// break.
const SHIP_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="320">` +
    `<rect width="640" height="320" fill="#0B2A4A"/>` +
    `<text x="320" y="176" font-family="Georgia" font-size="40" fill="#FFFFFF" text-anchor="middle">Wayfarer</text>` +
    `</svg>`,
)}`;

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
  title: 'Data display/Card',
  parameters: { layout: 'fullscreen' },
  args: {
    elevation: 'raised',
    title: 'Hyperspace in minutes',
    body: 'Nav computer, star charts, and jump solutions, from one console.',
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
            <InkText style={{ fontSize: 13 }}>{args.footerNote}</InkText>
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

/**
 * `Card.Image` — a full-bleed image at the top of the card.
 *
 * The negative margins are the point: `Card.Root` owns 24px of padding, and an
 * image inset by it reads as a picture dropped into a card rather than part of
 * one. Both leaves cancel that padding the same way, which is why this belongs
 * FIRST inside the Root on both platforms.
 *
 * The height is REQUIRED (defaulted, not optional-with-intrinsic-sizing)
 * because the platforms disagree about an unsized image: a web `<img>` reflows
 * the card when it finally loads, and RN's `Image` with no dimensions renders
 * at zero and shows nothing at all.
 *
 * `alt` is threaded to both `alt` and `accessibilityLabel` on the native leaf.
 * Passing only `alt` names the image on a device and leaves it decorative in a
 * browser — react-native-web builds its `<img>` as `alt={ariaLabel || ''}` —
 * and that exact divergence shipped once in Avatar, in 0.8.3.
 */
export const WithImage: Story = {
  render: (args) => (
    <LeafPair
      note="The image should meet the card's edges and round its top corners, in both panes."
      web={
        <CardWeb.Root elevation={args.elevation} style={{ maxWidth: 320 }}>
          <CardWeb.Image src={SHIP_IMAGE} alt="The Wayfarer at dock" caption="Docked at Ganymede" />
          <CardWeb.Title>{args.title}</CardWeb.Title>
          <CardWeb.Body>{args.body}</CardWeb.Body>
        </CardWeb.Root>
      }
      native={
        <CardNative.Root elevation={args.elevation} style={{ maxWidth: 320 }}>
          <CardNative.Image
            src={SHIP_IMAGE}
            alt="The Wayfarer at dock"
            caption="Docked at Ganymede"
          />
          <CardNative.Title>{args.title}</CardNative.Title>
          <CardNative.Body>{args.body}</CardNative.Body>
        </CardNative.Root>
      }
    />
  ),
};
