import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Text, View } from 'react-native';

import { Meter as MeterWeb } from '@design-system/meter/meter.web.tsx';
import { Meter as MeterNative } from '@design-system/meter/meter.native.tsx';

import { LeafPair } from './leaf-pair.tsx';

const meta = {
  title: 'Components/Meter',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A meter always has a known value — there is no indeterminate state, unlike
 * Progress — so a name is the only thing standing between this and a silent
 * axe failure: `aria-meter-name` (web) / `aria-progressbar-name` (native,
 * see the note) both fire on a nameless gauge, which is why both leaves get
 * an explicit label below rather than relying on visible text nearby.
 */
export const Default: Story = {
  render: () => (
    <LeafPair
      note="The native leaf renders accessibilityRole='progressbar', not 'meter' — RN's AccessibilityRole union has no meter entry, so this is a documented, honest fallback (see meter.native.tsx), not a copy-paste from Progress."
      web={
        <div style={{ display: 'grid', gap: 6, width: 260 }}>
          <span style={{ fontSize: 13 }}>Case file storage — 62 of 100 GB</span>
          <MeterWeb.Root value={62} aria-label="Case file storage used">
            <MeterWeb.Track>
              <MeterWeb.Indicator />
            </MeterWeb.Track>
          </MeterWeb.Root>
        </div>
      }
      native={
        <View style={{ gap: 6, width: 260 }}>
          <Text style={{ fontSize: 13 }}>Case file storage — 62 of 100 GB</Text>
          <MeterNative.Root value={62} accessibilityLabel="Case file storage used">
            <MeterNative.Track>
              <MeterNative.Indicator />
            </MeterNative.Track>
          </MeterNative.Root>
        </View>
      }
    />
  ),
};

/**
 * Mirrors `meter.test.tsx` exactly (`value={30} min={0} max={60}`) — a range
 * that doesn't start at 0, to show the indicator is sized against `[min,
 * max]` rather than assumed to start at zero.
 */
export const CustomRange: Story = {
  render: () => (
    <LeafPair
      web={
        <div style={{ display: 'grid', gap: 6, width: 260 }}>
          <span style={{ fontSize: 13 }}>Redaction review — 30 of 60 pages</span>
          <MeterWeb.Root value={30} min={0} max={60} aria-label="Pages reviewed for redaction">
            <MeterWeb.Track>
              <MeterWeb.Indicator />
            </MeterWeb.Track>
          </MeterWeb.Root>
        </div>
      }
      native={
        <View style={{ gap: 6, width: 260 }}>
          <Text style={{ fontSize: 13 }}>Redaction review — 30 of 60 pages</Text>
          <MeterNative.Root
            value={30}
            min={0}
            max={60}
            accessibilityLabel="Pages reviewed for redaction"
          >
            <MeterNative.Track>
              <MeterNative.Indicator />
            </MeterNative.Track>
          </MeterNative.Root>
        </View>
      }
    />
  ),
};
