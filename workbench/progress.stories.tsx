import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect } from 'storybook/test';
import { Text, View } from 'react-native';

import { Progress as ProgressWeb } from '@design-system/progress/progress.web.tsx';
import { Progress as ProgressNative } from '@design-system/progress/progress.native.tsx';

import { LeafPair, pair } from './leaf-pair.tsx';
import { InkText } from './ink-text.tsx';

const UPLOADS = [
  { name: 'star-charts.holo', value: 30 },
  { name: 'nav-data.holo', value: 80 },
];

/**
 * `Progress` is a parts object (`Root`/`Track`/`Indicator`), the same shape
 * as `Meter` — there is no single component for a meta `component` to point
 * at. Args cover `Root`'s `value`/`max` plus the visible label text and the
 * accessible name threaded into the composition below. `value: null` is the
 * indeterminate state; it stays out of the default args (see `Indeterminate`)
 * because the two leaves render it with genuinely different markup, not just
 * a different number.
 */
type ProgressArgs = {
  value: number | null;
  max: number;
  label: string;
  ariaLabel: string;
};

/**
 * A determinate-or-indeterminate bar: `value` is a number when progress is
 * known, `null` when it isn't (`progress.props.ts`). `Basic` below threads a
 * single known value through the meta args; `Determinate` and `Indeterminate`
 * keep their own renders because their content doesn't reduce to that one
 * shape — a multi-file grid and a label-less bar, respectively.
 */
const meta = {
  title: 'Components/Progress',
  parameters: { layout: 'fullscreen' },
  args: {
    value: 30,
    max: 100,
    label: 'star-charts.holo',
    ariaLabel: 'star-charts.holo upload progress',
  },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100 } },
  },
  render: (args) => (
    <LeafPair
      web={
        <div style={{ display: 'grid', gap: 6, width: 260 }}>
          <span style={{ fontSize: 13 }}>{args.label}</span>
          <ProgressWeb.Root value={args.value} max={args.max} aria-label={args.ariaLabel}>
            <ProgressWeb.Track>
              <ProgressWeb.Indicator />
            </ProgressWeb.Track>
          </ProgressWeb.Root>
        </div>
      }
      native={
        <View style={{ gap: 6, width: 260 }}>
          <InkText style={{ fontSize: 13 }}>{args.label}</InkText>
          <ProgressNative.Root
            value={args.value}
            max={args.max}
            accessibilityLabel={args.ariaLabel}
          >
            <ProgressNative.Track>
              <ProgressNative.Indicator />
            </ProgressNative.Track>
          </ProgressNative.Root>
        </View>
      }
    />
  ),
} satisfies Meta<ProgressArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default pairing: a single known value. The play pins the one thing a
 * screenshot can't — both leaves report the same number through
 * `aria-valuenow` under the shared `progressbar` role, not just a matching
 * bar width.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args }) => {
    const { web, native } = pair(canvasElement);
    await expect(web.getByRole('progressbar', { name: args.ariaLabel })).toHaveAttribute(
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
 * Two uploads at once, each with its own value and label — a grid, not a
 * single bar, so this stays its own render rather than an `args` override of
 * `Basic`.
 */
export const Determinate: Story = {
  render: () => (
    <LeafPair
      web={
        <div style={{ display: 'grid', gap: 20, width: 260 }}>
          {UPLOADS.map((upload) => (
            <div key={upload.name} style={{ display: 'grid', gap: 6 }}>
              <span style={{ fontSize: 13 }}>{upload.name}</span>
              <ProgressWeb.Root value={upload.value} aria-label={`${upload.name} upload progress`}>
                <ProgressWeb.Track>
                  <ProgressWeb.Indicator />
                </ProgressWeb.Track>
              </ProgressWeb.Root>
            </div>
          ))}
        </div>
      }
      native={
        <View style={{ gap: 20, width: 260 }}>
          {UPLOADS.map((upload) => (
            <View key={upload.name} style={{ gap: 6 }}>
              <InkText style={{ fontSize: 13 }}>{upload.name}</InkText>
              <ProgressNative.Root
                value={upload.value}
                accessibilityLabel={`${upload.name} upload progress`}
              >
                <ProgressNative.Track>
                  <ProgressNative.Indicator />
                </ProgressNative.Track>
              </ProgressNative.Root>
            </View>
          ))}
        </View>
      }
    />
  ),
};

/**
 * `value={null}` — the default — is the indeterminate state: a document is
 * still being scanned and no percentage is known yet. Both leaves render a
 * fixed-width bar rather than an empty one, so there is still *something* to
 * look at, but they disagree on how: see the note below.
 */
export const Indeterminate: Story = {
  render: () => (
    <LeafPair
      note="The web indicator pulses at a fixed one-third width (`w-1/3 animate-pulse`); the native indicator is a static 33% bar with no animation — a real visual divergence, not a bug."
      web={
        <div style={{ width: 260 }}>
          <ProgressWeb.Root value={null} aria-label="Scan progress">
            <ProgressWeb.Track>
              <ProgressWeb.Indicator />
            </ProgressWeb.Track>
          </ProgressWeb.Root>
        </div>
      }
      native={
        <View style={{ width: 260 }}>
          <ProgressNative.Root value={null} accessibilityLabel="Scan progress">
            <ProgressNative.Track>
              <ProgressNative.Indicator />
            </ProgressNative.Track>
          </ProgressNative.Root>
        </View>
      }
    />
  ),
};
