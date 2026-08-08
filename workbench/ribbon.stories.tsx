import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { Ribbon as RibbonWeb } from '@design-system/ribbon/ribbon.web.tsx';
import { Ribbon as RibbonNative } from '@design-system/ribbon/ribbon.native.tsx';
import type { RibbonPosition, RibbonTone } from '@design-system/ribbon/ribbon.props.ts';
import { Card as CardWeb } from '@design-system/card/card.web.tsx';
import { Card as CardNative } from '@design-system/card/card.native.tsx';

import { LeafPair } from './leaf-pair.tsx';

const TONES = ['primary', 'neutral'] as const satisfies readonly RibbonTone[];
const POSITIONS = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
] as const satisfies readonly RibbonPosition[];

type RibbonArgs = {
  tone: RibbonTone;
  position: RibbonPosition;
  label: string;
};

/**
 * A corner flag for the card it sits on.
 *
 * A ribbon positions against its CONTAINER, and neither leaf can establish
 * that context for the caller without taking over a box it does not own — so
 * both stories below wrap it in a positioned card, which is how it is meant to
 * be composed. Web: `className="relative"`. Native: a `position: 'relative'`
 * style on the card.
 *
 * There are two tones rather than five for a contrast reason
 * `ribbon.props.ts` spells out: a filled block needs a foreground/background
 * PAIR, and `primary`/`primary-text` is the only one these tokens guarantee in
 * both schemes. Flipping the Scheme toolbar is the check — a `danger` fill
 * would look fine in light and score 3.5:1 in dark.
 */
const meta = {
  title: 'Data display/Ribbon',
  component: RibbonWeb,
  parameters: { layout: 'fullscreen' },
  args: {
    tone: 'primary',
    position: 'top-right',
    label: 'Popular',
  },
  argTypes: {
    tone: { control: 'inline-radio', options: [...TONES] },
    position: { control: 'select', options: [...POSITIONS] },
    label: { control: 'text' },
  },
  render: (args) => (
    <LeafPair
      web={
        <CardWeb.Root className="relative" style={{ width: 260, minHeight: 140 }}>
          <RibbonWeb tone={args.tone} position={args.position}>
            {args.label}
          </RibbonWeb>
          <CardWeb.Title>Hyperspace</CardWeb.Title>
          <CardWeb.Body>Jump solutions from one console.</CardWeb.Body>
        </CardWeb.Root>
      }
      native={
        <CardNative.Root style={{ position: 'relative', width: 260, minHeight: 140 }}>
          <RibbonNative tone={args.tone} position={args.position}>
            {args.label}
          </RibbonNative>
          <CardNative.Title>Hyperspace</CardNative.Title>
          <CardNative.Body>Jump solutions from one console.</CardNative.Body>
        </CardNative.Root>
      }
    />
  ),
} satisfies Meta<RibbonArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

/**
 * All four corners at once.
 *
 * The corner radii are hand-matched between the leaves — `rounded-tr-lg` and
 * `borderTopRightRadius: radii.lg` are two spellings of one decision — so the
 * thing to look for is a ribbon whose outer corner does not follow the card's.
 */
export const Positions: Story = {
  render: (args) => (
    <LeafPair
      minPaneWidth={300}
      web={
        <CardWeb.Root className="relative" style={{ width: 260, minHeight: 180 }}>
          {POSITIONS.map((position) => (
            <RibbonWeb key={position} tone={args.tone} position={position}>
              {position}
            </RibbonWeb>
          ))}
          <CardWeb.Title>Four corners</CardWeb.Title>
        </CardWeb.Root>
      }
      native={
        <CardNative.Root style={{ position: 'relative', width: 260, minHeight: 180 }}>
          {POSITIONS.map((position) => (
            <RibbonNative key={position} tone={args.tone} position={position}>
              {position}
            </RibbonNative>
          ))}
          <CardNative.Title>Four corners</CardNative.Title>
        </CardNative.Root>
      }
    />
  ),
};
