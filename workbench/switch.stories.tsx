import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Text, View } from 'react-native';

import { Switch as SwitchWeb } from '@design-system/switch/switch.web.tsx';
import { Switch as SwitchNative } from '@design-system/switch/switch.native.tsx';

import { LeafPair } from './leaf-pair.tsx';

const meta = {
  title: 'Components/Switch',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * `Switch.Root` renders only the track and thumb — no text — so it fails
 * `aria-toggle-field-name` without a name, the same gap `Checkbox.Root` and
 * `RadioGroup.Item` have. Same fix: `aria-label`/`accessibilityLabel` on
 * Root, matched by visible text beside it.
 */
export const States: Story = {
  render: () => (
    <LeafPair
      web={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <LabelledWeb label="Email me case updates" />
          <LabelledWeb label="Text me court reminders" defaultChecked />
        </div>
      }
      native={
        <View style={{ gap: 16 }}>
          <LabelledNative label="Email me case updates" />
          <LabelledNative label="Text me court reminders" defaultChecked />
        </View>
      }
    />
  ),
};

export const Disabled: Story = {
  render: () => (
    <LeafPair
      web={
        <LabelledWeb label="Paperless statements (required by the court)" disabled defaultChecked />
      }
      native={
        <LabelledNative
          label="Paperless statements (required by the court)"
          disabled
          defaultChecked
        />
      }
    />
  ),
};

function LabelledWeb({
  label,
  ...props
}: { label: string } & Partial<React.ComponentProps<typeof SwitchWeb.Root>>) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <SwitchWeb.Root aria-label={label} {...props}>
        <SwitchWeb.Thumb />
      </SwitchWeb.Root>
      <span>{label}</span>
    </div>
  );
}

function LabelledNative({
  label,
  ...props
}: { label: string } & Partial<React.ComponentProps<typeof SwitchNative.Root>>) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <SwitchNative.Root accessibilityLabel={label} {...props}>
        <SwitchNative.Thumb />
      </SwitchNative.Root>
      <Text>{label}</Text>
    </View>
  );
}
