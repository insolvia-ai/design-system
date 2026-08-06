import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { Button as ButtonWeb } from '@design-system/button/button.web.tsx';
import { Button as ButtonNative } from '@design-system/button/button.native.tsx';

import { LeafPair } from './leaf-pair.tsx';

const meta = {
  title: 'Components/Button',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const INTENTS = ['primary', 'secondary', 'danger'] as const;
const SIZES = ['sm', 'md', 'lg'] as const;

export const Intents: Story = {
  render: () => (
    <LeafPair
      web={
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {INTENTS.map((intent) => (
            <ButtonWeb key={intent} intent={intent}>
              {intent}
            </ButtonWeb>
          ))}
        </div>
      }
      native={
        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
          {INTENTS.map((intent) => (
            <ButtonNative key={intent} intent={intent}>
              {intent}
            </ButtonNative>
          ))}
        </View>
      }
    />
  ),
};

/**
 * Sizes matter here for a reason that is not aesthetic.
 *
 * WCAG 2.5.5 puts the minimum touch target at 44dp, and this package's `md` is
 * 40dp — under it. A consumer building for touch therefore wants `lg`, and
 * seeing the three sizes together at real scale is the cheapest way to keep
 * that in view. The a11y panel will not flag it: 40dp violates nothing axe
 * checks, because axe cannot know what the target is for.
 */
export const Sizes: Story = {
  render: () => (
    <LeafPair
      note="`md` is 40dp — below the 44dp WCAG 2.5.5 target-size floor, which is why a touch consumer wants `lg`."
      web={
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {SIZES.map((size) => (
            <ButtonWeb key={size} size={size}>
              {size}
            </ButtonWeb>
          ))}
        </div>
      }
      native={
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {SIZES.map((size) => (
            <ButtonNative key={size} size={size}>
              {size}
            </ButtonNative>
          ))}
        </View>
      }
    />
  ),
};

export const Disabled: Story = {
  render: () => (
    <LeafPair
      web={<ButtonWeb disabled>Can’t continue</ButtonWeb>}
      native={<ButtonNative disabled>Can’t continue</ButtonNative>}
    />
  ),
};
