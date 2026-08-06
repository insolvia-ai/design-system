import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Text, View } from 'react-native';

import { RadioGroup as RadioGroupWeb } from '@design-system/radio-group/radio-group.web.tsx';
import { RadioGroup as RadioGroupNative } from '@design-system/radio-group/radio-group.native.tsx';

import { LeafPair } from './leaf-pair.tsx';

const CHAPTERS = [
  { value: 'ch7', label: 'Chapter 7 — liquidation' },
  { value: 'ch13', label: 'Chapter 13 — repayment plan' },
  { value: 'ch11', label: 'Chapter 11 — reorganisation' },
];

const meta = {
  title: 'Components/RadioGroup',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The web leaf layers roving tabindex and arrow-key selection on top of the
 * shared state model; the native leaf is tap-to-select only, by design — RN
 * has no keyboard focus to rove. Tab into the web pane and press an arrow
 * key; there is nothing to press on the native side.
 */
export const Default: Story = {
  render: () => (
    <LeafPair
      note="Web: roving tabindex, arrow keys move the selection. Native: tap-to-select only — there is no keyboard to rove."
      web={<ChapterWeb defaultValue="ch13" />}
      native={<ChapterNative defaultValue="ch13" />}
    />
  ),
};

export const Disabled: Story = {
  render: () => (
    <LeafPair
      web={<ChapterWeb defaultValue="ch13" disabled />}
      native={<ChapterNative defaultValue="ch13" disabled />}
    />
  ),
};

/**
 * `RadioGroup.Item`, like `Checkbox.Root`, renders only a dot — no text — so
 * it fails `aria-toggle-field-name` without its own name, on top of the
 * `aria-label` that names the group as a whole (legal here: web is
 * `role="radiogroup"`, native is `accessibilityRole="radiogroup"`, neither a
 * toggle field itself).
 */
function ChapterWeb(props: Partial<React.ComponentProps<typeof RadioGroupWeb.Root>>) {
  return (
    <RadioGroupWeb.Root aria-label="Bankruptcy chapter" {...props}>
      {CHAPTERS.map(({ value, label }) => (
        <div key={value} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RadioGroupWeb.Item aria-label={label} value={value}>
            <RadioGroupWeb.Indicator />
          </RadioGroupWeb.Item>
          <span>{label}</span>
        </div>
      ))}
    </RadioGroupWeb.Root>
  );
}

function ChapterNative(props: Partial<React.ComponentProps<typeof RadioGroupNative.Root>>) {
  return (
    <RadioGroupNative.Root accessibilityLabel="Bankruptcy chapter" {...props}>
      {CHAPTERS.map(({ value, label }) => (
        <View key={value} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <RadioGroupNative.Item accessibilityLabel={label} value={value}>
            <RadioGroupNative.Indicator />
          </RadioGroupNative.Item>
          <Text>{label}</Text>
        </View>
      ))}
    </RadioGroupNative.Root>
  );
}
