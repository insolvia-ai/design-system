import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Text, View } from 'react-native';

import { Separator as SeparatorWeb } from '@design-system/separator/separator.web.tsx';
import { Separator as SeparatorNative } from '@design-system/separator/separator.native.tsx';
import type { SeparatorOrientation } from '@design-system/separator/separator.props.ts';

import { LeafPair } from './leaf-pair.tsx';
import { InkText } from './ink-text.tsx';

const ORIENTATIONS = ['horizontal', 'vertical'] as const satisfies readonly SeparatorOrientation[];

/**
 * Separator takes exactly one prop that matters — `orientation` — so args are
 * typed straight off the shared `SeparatorOwnProps` union (`separator.props.ts`)
 * rather than a story-local shape; both leaves take it under the identical
 * name, so no bridging arg is needed. Separator has no interactive state and
 * nothing to click or type into — unlike date-input/field/radio-group, this
 * file has no play functions, only args and docs.
 */
type SeparatorArgs = {
  orientation: SeparatorOrientation;
};

const meta = {
  title: 'Layout/Separator',
  // The web leaf, for the docs-page props table only (best-effort react-docgen
  // — see the addon-docs note in .storybook/main.ts). Controls never rely on
  // it: they are declared by hand in `argTypes` below.
  component: SeparatorWeb,
  parameters: { layout: 'fullscreen' },
  args: {
    orientation: 'horizontal',
  },
  argTypes: {
    orientation: { control: 'inline-radio', options: [...ORIENTATIONS] },
  },
  render: (args) => (
    <LeafPair
      web={
        args.orientation === 'vertical' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 24 }}>
            <span style={{ fontSize: 14 }}>Transponder 21-10432</span>
            <SeparatorWeb orientation={args.orientation} />
            <span style={{ fontSize: 14 }}>YT-1300</span>
          </div>
        ) : (
          <div style={{ width: 280 }}>
            <SeparatorWeb orientation={args.orientation} />
          </div>
        )
      }
      native={
        args.orientation === 'vertical' ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, height: 24 }}>
            <InkText style={{ fontSize: 14 }}>Transponder 21-10432</InkText>
            <SeparatorNative orientation={args.orientation} />
            <InkText style={{ fontSize: 14 }}>YT-1300</InkText>
          </View>
        ) : (
          <View style={{ width: 280 }}>
            <SeparatorNative orientation={args.orientation} />
          </View>
        )
      }
    />
  ),
} satisfies Meta<SeparatorArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * One Separator, its orientation driven by the `orientation` control.
 * Horizontal needs only a width to draw a visible line across; vertical needs
 * a height to stretch against (`align-self: stretch` / `alignSelf: 'stretch'`
 * has nothing to stretch to in an unbounded flex column), so this story gives
 * it a label either side purely to supply that height honestly, rather than a
 * bare fixed box with nothing in it.
 */
export const Basic: Story = {};

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
            <span style={{ fontSize: 14 }}>Transponder 21-10432</span>
            <SeparatorWeb orientation="vertical" />
            <span style={{ fontSize: 14 }}>YT-1300</span>
          </div>
        </div>
      }
      native={
        <View style={{ gap: 24, width: 280 }}>
          <View style={{ gap: 12 }}>
            <InkText style={{ fontSize: 14 }}>Filed documents</InkText>
            <SeparatorNative />
            <InkText style={{ fontSize: 14 }}>Pending review</InkText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, height: 24 }}>
            <InkText style={{ fontSize: 14 }}>Transponder 21-10432</InkText>
            <SeparatorNative orientation="vertical" />
            <InkText style={{ fontSize: 14 }}>YT-1300</InkText>
          </View>
        </View>
      }
    />
  ),
};
