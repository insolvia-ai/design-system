import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Text, View } from 'react-native';

import { Checkbox as CheckboxWeb } from '@design-system/checkbox/checkbox.web.tsx';
import { Checkbox as CheckboxNative } from '@design-system/checkbox/checkbox.native.tsx';

import { LeafPair } from './leaf-pair.tsx';

const meta = {
  title: 'Components/Checkbox',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * `Checkbox.Root` renders only a glyph — no text of its own — so it fails
 * `aria-toggle-field-name` (serious, WCAG 1.1.1) without a name, and
 * `Checkbox` does not read `FieldContext`, so wrapping it in a `Field` would
 * not fix that here. The honest label, matching `checkbox.test.tsx`:
 * `aria-label` (web) / `accessibilityLabel` (native) on the Root, with the
 * SAME string rendered as visible text beside it, so the accessible name and
 * the visible label agree (WCAG 2.5.3). Every checkbox story below follows
 * this idiom.
 */
export const States: Story = {
  render: () => (
    <LeafPair
      web={
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <LabelledWeb label="Filed for bankruptcy before" />
          <LabelledWeb label="Has a co-debtor" defaultChecked />
          <LabelledWeb label="Select all listed debts" indeterminate />
        </div>
      }
      native={
        <View style={{ flexDirection: 'row', gap: 24, flexWrap: 'wrap' }}>
          <LabelledNative label="Filed for bankruptcy before" />
          <LabelledNative label="Has a co-debtor" defaultChecked />
          <LabelledNative label="Select all listed debts" indeterminate />
        </View>
      }
    />
  ),
};

export const Disabled: Story = {
  render: () => (
    <LeafPair
      web={<LabelledWeb label="Filing fee waived" disabled defaultChecked />}
      native={<LabelledNative label="Filing fee waived" disabled defaultChecked />}
    />
  ),
};

function LabelledWeb({
  label,
  ...props
}: { label: string } & Partial<React.ComponentProps<typeof CheckboxWeb.Root>>) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <CheckboxWeb.Root aria-label={label} {...props}>
        <CheckboxWeb.Indicator>{props.indeterminate ? '—' : '✓'}</CheckboxWeb.Indicator>
      </CheckboxWeb.Root>
      <span>{label}</span>
    </div>
  );
}

function LabelledNative({
  label,
  ...props
}: { label: string } & Partial<React.ComponentProps<typeof CheckboxNative.Root>>) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <CheckboxNative.Root accessibilityLabel={label} {...props}>
        <CheckboxNative.Indicator>
          <Text>{props.indeterminate ? '—' : '✓'}</Text>
        </CheckboxNative.Indicator>
      </CheckboxNative.Root>
      <Text>{label}</Text>
    </View>
  );
}
