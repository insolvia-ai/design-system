import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';

import { Toggle as ToggleWeb } from '@design-system/toggle/toggle.web.tsx';
import { Toggle as ToggleNative } from '@design-system/toggle/toggle.native.tsx';

import { LeafPair } from './leaf-pair.tsx';

const meta = {
  title: 'Components/Toggle',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A standalone `Toggle` — no enclosing `ToggleGroup` — takes its accessible
 * name from its text children on both leaves, so every toggle below is given
 * one directly (a document editor's formatting buttons: "Bold", "Italic").
 * The native leaf renders that text as a `Pressable` + `<Text>` under
 * `accessibilityRole="button"`, not the RN `'togglebutton'` role — see
 * `toggle.native.tsx`'s header for why that role would drop the computed
 * name on react-native-web.
 */
export const States: Story = {
  render: () => (
    <LeafPair
      web={
        <div style={{ display: 'flex', gap: 12 }}>
          <ToggleWeb>Bold</ToggleWeb>
          <ToggleWeb defaultPressed>Italic</ToggleWeb>
        </div>
      }
      native={
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <ToggleNative>Bold</ToggleNative>
          <ToggleNative defaultPressed>Italic</ToggleNative>
        </View>
      }
    />
  ),
};

export const Disabled: Story = {
  render: () => (
    <LeafPair
      web={<ToggleWeb disabled>Strikethrough</ToggleWeb>}
      native={<ToggleNative disabled>Strikethrough</ToggleNative>}
    />
  ),
};
