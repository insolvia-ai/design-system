import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { Badge as BadgeWeb } from '@design-system/badge/badge.web.tsx';
import { Badge as BadgeNative } from '@design-system/badge/badge.native.tsx';
import type { BadgeIntent, BadgeSize } from '@design-system/badge/badge.props.ts';

import { LeafPair } from './leaf-pair.tsx';

const INTENTS = [
  'neutral',
  'primary',
  'success',
  'warning',
  'danger',
] as const satisfies readonly BadgeIntent[];
const SIZES = ['sm', 'md'] as const satisfies readonly BadgeSize[];

type BadgeArgs = {
  intent: BadgeIntent;
  size: BadgeSize;
  label: string;
};

/**
 * A pill for status, with the intent carried by a dot rather than by the fill.
 *
 * That is a contrast decision, not a stylistic one, and `badge.props.ts` has
 * the measurements: `warning` as a label colour is 3.2:1 on `card` in light and
 * `success` is 3.5:1 in dark, and the only foreground/background pair these
 * tokens guarantee in both schemes is `primary`/`primary-text`. So the label
 * stays `ink` on `surface-alt` at every intent, and the dot does the signalling
 * — decoratively, because the badge's own words carry the meaning.
 *
 * Flip the Scheme toolbar with the Intents story open: both panes should keep
 * the same legibility, and only the dots should change hue.
 */
const meta = {
  title: 'Components/Badge',
  component: BadgeWeb,
  parameters: { layout: 'fullscreen' },
  args: {
    intent: 'success',
    size: 'md',
    label: 'Deployed',
  },
  argTypes: {
    intent: { control: 'inline-radio', options: [...INTENTS] },
    size: { control: 'inline-radio', options: [...SIZES] },
    label: { control: 'text' },
  },
  render: (args) => (
    <LeafPair
      web={
        <BadgeWeb intent={args.intent} size={args.size}>
          {args.label}
        </BadgeWeb>
      }
      native={
        <BadgeNative intent={args.intent} size={args.size}>
          {args.label}
        </BadgeNative>
      }
    />
  ),
} satisfies Meta<BadgeArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

/** Every intent at once — `neutral` is the one with no dot. */
export const Intents: Story = {
  render: (args) => (
    <LeafPair
      web={
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {INTENTS.map((intent) => (
            <BadgeWeb key={intent} intent={intent} size={args.size}>
              {intent}
            </BadgeWeb>
          ))}
        </div>
      }
      native={
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {INTENTS.map((intent) => (
            <BadgeNative key={intent} intent={intent} size={args.size}>
              {intent}
            </BadgeNative>
          ))}
        </View>
      }
    />
  ),
};

/**
 * The two sizes. Both leaves render the label at `text-xs`; only the height,
 * padding and dot diameter change — which is what keeps a `sm` badge legible
 * rather than merely smaller.
 */
export const Sizes: Story = {
  render: (args) => (
    <LeafPair
      web={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {SIZES.map((size) => (
            <BadgeWeb key={size} intent={args.intent} size={size}>
              {size}
            </BadgeWeb>
          ))}
        </div>
      }
      native={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {SIZES.map((size) => (
            <BadgeNative key={size} intent={args.intent} size={size}>
              {size}
            </BadgeNative>
          ))}
        </View>
      }
    />
  ),
};
