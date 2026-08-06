import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Text, View } from 'react-native';

import { Progress as ProgressWeb } from '@design-system/progress/progress.web.tsx';
import { Progress as ProgressNative } from '@design-system/progress/progress.native.tsx';

import { LeafPair } from './leaf-pair.tsx';

const meta = {
  title: 'Components/Progress',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const UPLOADS = [
  { name: 'Petition.pdf', value: 30 },
  { name: 'Schedules.pdf', value: 80 },
];

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
              <Text style={{ fontSize: 13 }}>{upload.name}</Text>
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
