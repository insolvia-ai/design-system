import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect } from 'storybook/test';
import { Text, View } from 'react-native';

import { Meter as MeterWeb } from '@design-system/meter/meter.web.tsx';
import { Meter as MeterNative } from '@design-system/meter/meter.native.tsx';

import { LeafPair, pair } from './leaf-pair.tsx';

/**
 * `Meter` is a parts object (`Root`/`Track`/`Indicator`), the same shape as
 * `Progress` — there is no single component for a meta `component` to point
 * at. Args cover `Root`'s `value`/`min`/`max` plus the visible label text and
 * the accessible name threaded into the composition below.
 */
type MeterArgs = {
  value: number;
  min: number;
  max: number;
  label: string;
  ariaLabel: string;
};

/**
 * A static gauge over a known range: always determinate, always has a value
 * (`meter.props.ts`), unlike Progress. A meter always has a name — a nameless
 * gauge fails `aria-meter-name` on web and `aria-progressbar-name` on native
 * (see the LeafPair note for the role fallback) — so the args below carry both
 * a visible label and the accessible name explicitly, rather than leaving
 * either implicit.
 */
const meta = {
  title: 'Components/Meter',
  parameters: { layout: 'fullscreen' },
  args: {
    value: 62,
    min: 0,
    max: 100,
    label: 'Case file storage — 62 of 100 GB',
    ariaLabel: 'Case file storage used',
  },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100 } },
  },
  render: (args) => (
    <LeafPair
      note="The native leaf renders accessibilityRole='progressbar', not 'meter' — RN's AccessibilityRole union has no meter entry, so this is a documented, honest fallback (see meter.native.tsx), not a copy-paste from Progress."
      web={
        <div style={{ display: 'grid', gap: 6, width: 260 }}>
          <span style={{ fontSize: 13 }}>{args.label}</span>
          <MeterWeb.Root
            value={args.value}
            min={args.min}
            max={args.max}
            aria-label={args.ariaLabel}
          >
            <MeterWeb.Track>
              <MeterWeb.Indicator />
            </MeterWeb.Track>
          </MeterWeb.Root>
        </div>
      }
      native={
        <View style={{ gap: 6, width: 260 }}>
          <Text style={{ fontSize: 13 }}>{args.label}</Text>
          <MeterNative.Root
            value={args.value}
            min={args.min}
            max={args.max}
            accessibilityLabel={args.ariaLabel}
          >
            <MeterNative.Track>
              <MeterNative.Indicator />
            </MeterNative.Track>
          </MeterNative.Root>
        </View>
      }
    />
  ),
} satisfies Meta<MeterArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default pairing. The play pins the one thing a screenshot can't: both
 * leaves expose the SAME value through their own role — `meter` on web,
 * `progressbar` on native (see the note above) — so a value update actually
 * reaches assistive tech on both platforms, not just the pixel width.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args }) => {
    const { web, native } = pair(canvasElement);
    await expect(web.getByRole('meter', { name: args.ariaLabel })).toHaveAttribute(
      'aria-valuenow',
      String(args.value),
    );
    await expect(native.getByRole('progressbar', { name: args.ariaLabel })).toHaveAttribute(
      'aria-valuenow',
      String(args.value),
    );
  },
};

/**
 * Mirrors `meter.test.tsx` exactly (`value={30} min={0} max={60}`) — a range
 * that doesn't start at 0, to show the indicator is sized against `[min,
 * max]` rather than assumed to start at zero. An `args` override of `Basic`
 * rather than its own render: the composition is identical, only the numbers
 * and labels differ.
 */
export const CustomRange: Story = {
  args: {
    value: 30,
    min: 0,
    max: 60,
    label: 'Redaction review — 30 of 60 pages',
    ariaLabel: 'Pages reviewed for redaction',
  },
};
