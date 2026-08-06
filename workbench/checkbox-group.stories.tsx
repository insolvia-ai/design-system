import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { Text, View } from 'react-native';

import { CheckboxGroup as CheckboxGroupWeb } from '@design-system/checkbox-group/checkbox-group.web.tsx';
import { CheckboxGroup as CheckboxGroupNative } from '@design-system/checkbox-group/checkbox-group.native.tsx';
import { Checkbox as CheckboxWeb } from '@design-system/checkbox/checkbox.web.tsx';
import { Checkbox as CheckboxNative } from '@design-system/checkbox/checkbox.native.tsx';

import { LeafPair } from './leaf-pair.tsx';

const DEBT_TYPES = [
  { value: 'credit-card', label: 'Credit card debt' },
  { value: 'medical', label: 'Medical debt' },
  { value: 'student-loan', label: 'Student loan' },
  { value: 'auto-loan', label: 'Auto loan' },
];

const meta = {
  title: 'Components/CheckboxGroup',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <LeafPair
      web={<DebtTypesWeb defaultValue={['credit-card', 'medical']} />}
      native={<DebtTypesNative defaultValue={['credit-card', 'medical']} />}
    />
  ),
};

export const Disabled: Story = {
  render: () => (
    <LeafPair
      web={<DebtTypesWeb defaultValue={['credit-card']} disabled />}
      native={<DebtTypesNative defaultValue={['credit-card']} disabled />}
    />
  ),
};

/**
 * `CheckboxGroup.Root` sets `role="group"` on both leaves, so labelling the
 * Root itself with `aria-label`/`accessibilityLabel` is legal and correct —
 * unlike the bare `Checkbox.Root` glyph, a group isn't a toggle field. Each
 * member checkbox still renders only a glyph and needs its own name; see
 * checkbox.stories.tsx for why.
 */
function DebtTypesWeb(props: Partial<React.ComponentProps<typeof CheckboxGroupWeb.Root>>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ margin: 0, fontWeight: 600 }}>Debt types</p>
      <CheckboxGroupWeb.Root aria-label="Debt types" {...props}>
        {DEBT_TYPES.map(({ value, label }) => (
          <div key={value} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckboxWeb.Root aria-label={label} value={value}>
              <CheckboxWeb.Indicator>✓</CheckboxWeb.Indicator>
            </CheckboxWeb.Root>
            <span>{label}</span>
          </div>
        ))}
      </CheckboxGroupWeb.Root>
    </div>
  );
}

function DebtTypesNative(props: Partial<React.ComponentProps<typeof CheckboxGroupNative.Root>>) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontWeight: '600' }}>Debt types</Text>
      <CheckboxGroupNative.Root accessibilityLabel="Debt types" {...props}>
        {DEBT_TYPES.map(({ value, label }) => (
          <View key={value} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <CheckboxNative.Root accessibilityLabel={label} value={value}>
              <CheckboxNative.Indicator>
                <Text>✓</Text>
              </CheckboxNative.Indicator>
            </CheckboxNative.Root>
            <Text>{label}</Text>
          </View>
        ))}
      </CheckboxGroupNative.Root>
    </View>
  );
}
