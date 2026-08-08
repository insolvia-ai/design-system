import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { Spinner as SpinnerWeb } from '@design-system/spinner/spinner.web.tsx';
import { Spinner as SpinnerNative } from '@design-system/spinner/spinner.native.tsx';
import type { SpinnerSize } from '@design-system/spinner/spinner.props.ts';

import { LeafPair } from './leaf-pair.tsx';

const SIZES = ['sm', 'md', 'lg'] as const satisfies readonly SpinnerSize[];

type SpinnerArgs = {
  size: SpinnerSize;
  label: string;
};

/**
 * An indeterminate busy indicator.
 *
 * This is the one component in the package where the two leaves are
 * deliberately NOT the same drawing: the web leaf spins a CSS ring, the native
 * leaf hands off to RN's `ActivityIndicator` so each platform shows its own
 * busy affordance (and gets reduce-motion handling for free). What they do
 * share is the a11y contract — `progressbar` with a name and no value — so the
 * two panes announce identically even though they look different.
 *
 * The sizes are matched in pixels, so the two panes should occupy the same
 * space at every size even where the glyph differs.
 */
const meta = {
  title: 'Components/Spinner',
  component: SpinnerWeb,
  parameters: { layout: 'fullscreen' },
  args: {
    size: 'md',
    label: 'Loading',
  },
  argTypes: {
    size: { control: 'inline-radio', options: [...SIZES] },
    label: { control: 'text' },
  },
  render: (args) => (
    <LeafPair
      note="The glyphs differ on purpose — each platform shows its own busy indicator. Compare the diameters and the announced name, not the shape."
      web={<SpinnerWeb size={args.size} label={args.label} />}
      native={<SpinnerNative size={args.size} label={args.label} />}
    />
  ),
} satisfies Meta<SpinnerArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {};

/** The three sizes, matched pixel-for-pixel across the two leaves. */
export const Sizes: Story = {
  render: (args) => (
    <LeafPair
      web={
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {SIZES.map((size) => (
            <SpinnerWeb key={size} size={size} label={`${args.label} (${size})`} />
          ))}
        </div>
      }
      native={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          {SIZES.map((size) => (
            <SpinnerNative key={size} size={size} label={`${args.label} (${size})`} />
          ))}
        </View>
      }
    />
  ),
};
