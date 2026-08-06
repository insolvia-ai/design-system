import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { Text, View } from 'react-native';

import { CheckboxGroup as CheckboxGroupWeb } from '@design-system/checkbox-group/checkbox-group.web.tsx';
import { CheckboxGroup as CheckboxGroupNative } from '@design-system/checkbox-group/checkbox-group.native.tsx';
import { Checkbox as CheckboxWeb } from '@design-system/checkbox/checkbox.web.tsx';
import { Checkbox as CheckboxNative } from '@design-system/checkbox/checkbox.native.tsx';

import { LeafPair, pair } from './leaf-pair.tsx';

const DEBT_TYPES = [
  { value: 'credit-card', label: 'Credit card debt' },
  { value: 'medical', label: 'Medical debt' },
  { value: 'student-loan', label: 'Student loan' },
  { value: 'auto-loan', label: 'Auto loan' },
];

/**
 * `CheckboxGroup` is a parts object (`Root` only) composed with `Checkbox`,
 * not a single component — so there is no meta `component` for the docs-page
 * props table, the same omission Dialog and CheckboxGroup's own `Checkbox`
 * make for the same reason. Args cover the group's own state
 * (`defaultValue`/`disabled`/`onValueChange`); the member checkboxes
 * (`DEBT_TYPES`) are fixed composition, the same way Dialog's content is
 * fixed and only the text args vary. `defaultValue` gets no control — it
 * seeds UNCONTROLLED state (the select.stories.tsx `defaultValue` note
 * explains the same gap).
 */
type CheckboxGroupArgs = {
  defaultValue: string[];
  disabled: boolean;
  onValueChange: (value: string[]) => void;
};

const meta = {
  title: 'Components/CheckboxGroup',
  parameters: { layout: 'fullscreen' },
  args: {
    defaultValue: ['credit-card', 'medical'],
    disabled: false,
    onValueChange: fn(),
  },
  argTypes: {
    defaultValue: { control: false },
  },
  render: (args) => (
    <LeafPair
      web={
        <DebtTypesWeb
          defaultValue={args.defaultValue}
          disabled={args.disabled}
          onValueChange={args.onValueChange}
        />
      }
      native={
        <DebtTypesNative
          defaultValue={args.defaultValue}
          disabled={args.disabled}
          onValueChange={args.onValueChange}
        />
      }
    />
  ),
} satisfies Meta<CheckboxGroupArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default pairing, live in both panes. The play checks the group's
 * accessible name (`role="group"`, `aria-label="Debt types"` — see
 * `DebtTypesWeb`/`DebtTypesNative` below) and that selecting an unlisted
 * member appends it to the shared `onValueChange` array, in both panes.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: group is named, selecting a member updates the value', async () => {
      await expect(web.getByRole('group', { name: 'Debt types' })).toBeInTheDocument();
      await userEvent.click(web.getByRole('checkbox', { name: 'Student loan' }));
      await expect(args.onValueChange).toHaveBeenCalledTimes(1);
      await expect(args.onValueChange).toHaveBeenLastCalledWith([
        'credit-card',
        'medical',
        'student-loan',
      ]);
    });

    await step('native leaf: same group semantics, same handler', async () => {
      await expect(native.getByRole('group', { name: 'Debt types' })).toBeInTheDocument();
      await userEvent.click(native.getByRole('checkbox', { name: 'Student loan' }));
      await expect(args.onValueChange).toHaveBeenCalledTimes(2);
      await expect(args.onValueChange).toHaveBeenLastCalledWith([
        'credit-card',
        'medical',
        'student-loan',
      ]);
    });
  },
};

/**
 * Disabled is asserted, not clicked: the web member checkboxes are real
 * disabled `<button>`s (jest-dom's `toBeDisabled`), the native ones can only
 * speak ARIA through react-native-web (`aria-disabled`).
 */
export const Disabled: Story = {
  render: () => (
    <LeafPair
      web={<DebtTypesWeb defaultValue={['credit-card']} disabled />}
      native={<DebtTypesNative defaultValue={['credit-card']} disabled />}
    />
  ),
  play: async ({ canvasElement }) => {
    const { web, native } = pair(canvasElement);
    await expect(web.getByRole('checkbox', { name: 'Credit card debt' })).toBeDisabled();
    await expect(native.getByRole('checkbox', { name: 'Credit card debt' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  },
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
