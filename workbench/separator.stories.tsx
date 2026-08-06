import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Text, View } from 'react-native';

import { Separator as SeparatorWeb } from '@design-system/separator/separator.web.tsx';
import { Separator as SeparatorNative } from '@design-system/separator/separator.native.tsx';

import { LeafPair } from './leaf-pair.tsx';

const meta = {
  title: 'Components/Separator',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Never label a Separator. The native leaf is `accessibilityRole="none"` →
 * `role="presentation"` on an otherwise-empty View — an `aria-label` there,
 * with no subtree text to fall back to, is a hard `aria-prohibited-attr`
 * violation. The web leaf gets a real ARIA `separator` role for free and
 * needs no name either; a divider communicates nothing a screen reader user
 * would want announced by name.
 */
export const Orientations: Story = {
  render: () => (
    <LeafPair
      note="Web horizontal is 1px (`h-px`); native horizontal is `StyleSheet.hairlineWidth` — 0.5px at a 2x device pixel ratio. A real, visible difference, not a rendering artifact."
      web={
        <div style={{ display: 'grid', gap: 24, width: 280 }}>
          <div style={{ display: 'grid', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 14 }}>Filed documents</p>
            <SeparatorWeb />
            <p style={{ margin: 0, fontSize: 14 }}>Pending review</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 24 }}>
            <span style={{ fontSize: 14 }}>Case No. 21-10432</span>
            <SeparatorWeb orientation="vertical" />
            <span style={{ fontSize: 14 }}>Chapter 13</span>
          </div>
        </div>
      }
      native={
        <View style={{ gap: 24, width: 280 }}>
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 14 }}>Filed documents</Text>
            <SeparatorNative />
            <Text style={{ fontSize: 14 }}>Pending review</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, height: 24 }}>
            <Text style={{ fontSize: 14 }}>Case No. 21-10432</Text>
            <SeparatorNative orientation="vertical" />
            <Text style={{ fontSize: 14 }}>Chapter 13</Text>
          </View>
        </View>
      }
    />
  ),
};
