import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { Text, View } from 'react-native';

import { RadioGroup as RadioGroupWeb } from '@design-system/radio-group/radio-group.web.tsx';
import { RadioGroup as RadioGroupNative } from '@design-system/radio-group/radio-group.native.tsx';

import { LeafPair, pair } from './leaf-pair.tsx';

const CHAPTERS = [
  { value: 'ch7', label: 'Chapter 7 — liquidation' },
  { value: 'ch13', label: 'Chapter 13 — repayment plan' },
  { value: 'ch11', label: 'Chapter 11 — reorganisation' },
];

/**
 * RadioGroup is a parts object (Root/Item/Indicator), so args cover the
 * GROUP's own state — `radio-group.props.ts`'s selection model — not each
 * part's props individually; there is no meta `component` for the same
 * reason dialog.stories.tsx and field.stories.tsx have none. Both leaves take
 * `defaultValue`/`disabled`/`onValueChange` under identical names (the
 * shared state machine in `radio-group.props.ts` is consumed verbatim by
 * both), so unlike Button no bridging arg is needed. `defaultValue` gets no
 * control — it seeds UNCONTROLLED selection, the same reasoning
 * select.stories.tsx gives its own `defaultValue`.
 */
type RadioGroupArgs = {
  defaultValue: string;
  disabled: boolean;
  onValueChange: (value: string) => void;
};

const meta = {
  title: 'Components/RadioGroup',
  parameters: { layout: 'fullscreen' },
  args: {
    defaultValue: 'ch13',
    disabled: false,
    onValueChange: fn(),
  },
  argTypes: {
    defaultValue: { control: false },
  },
  render: (args) => (
    <LeafPair
      note="Web: roving tabindex, arrow keys move the selection. Native: tap-to-select only — there is no keyboard to rove."
      web={
        <ChapterWeb
          defaultValue={args.defaultValue}
          disabled={args.disabled}
          onValueChange={args.onValueChange}
        />
      }
      native={
        <ChapterNative
          defaultValue={args.defaultValue}
          disabled={args.disabled}
          onValueChange={args.onValueChange}
        />
      }
    />
  ),
} satisfies Meta<RadioGroupArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The web leaf layers roving tabindex and arrow-key selection on top of the
 * shared state model; the native leaf is tap-to-select only, by design — RN
 * has no keyboard focus to rove. Tab into the web pane and press an arrow
 * key; there is nothing to press on the native side.
 *
 * The play pins both halves of that claim: a click selects an item and fires
 * the shared handler in each pane, and — web only — an arrow key then roves
 * the selection to the next item, proving `radioItemTabIndex`'s arithmetic
 * (radio-group.props.ts) actually reaches the DOM rather than just typechecking.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web: click selects, and an arrow key roves the selection', async () => {
      const ch7 = web.getByRole('radio', { name: 'Chapter 7 — liquidation' });
      await userEvent.click(ch7);
      await expect(ch7).toHaveAttribute('aria-checked', 'true');
      await expect(ch7).toHaveFocus();
      await expect(args.onValueChange).toHaveBeenCalledTimes(1);
      await expect(args.onValueChange).toHaveBeenLastCalledWith('ch7');

      await userEvent.keyboard('{ArrowDown}');
      const ch13 = web.getByRole('radio', { name: 'Chapter 13 — repayment plan' });
      await expect(ch13).toHaveAttribute('aria-checked', 'true');
      await expect(ch13).toHaveFocus();
      await expect(args.onValueChange).toHaveBeenCalledTimes(2);
      await expect(args.onValueChange).toHaveBeenLastCalledWith('ch13');
    });

    await step('native: tap-to-select only — no keyboard to rove', async () => {
      const ch11 = native.getByRole('radio', { name: 'Chapter 11 — reorganisation' });
      await userEvent.click(ch11);
      await expect(ch11).toHaveAttribute('aria-checked', 'true');
      // Continues the SAME shared handler from the web step above.
      await expect(args.onValueChange).toHaveBeenCalledTimes(3);
      await expect(args.onValueChange).toHaveBeenLastCalledWith('ch11');
    });
  },
};

/**
 * Disabled is asserted, not clicked: the web leaf disables the real
 * `<button role="radio">` (`toBeDisabled`); the native leaf reports the SAME
 * state through `aria-disabled` explicitly, not just via
 * `accessibilityState` — see radio-group.native.tsx's header comment for why
 * that split matters (react-native-web does not forward `accessibilityState`
 * to the DOM on its own, unlike an explicitly-passed `aria-*` prop).
 */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const { web, native } = pair(canvasElement);
    const webItem = web.getByRole('radio', { name: 'Chapter 7 — liquidation' });
    await expect(webItem).toBeDisabled();
    const nativeItem = native.getByRole('radio', { name: 'Chapter 7 — liquidation' });
    await expect(nativeItem).toHaveAttribute('aria-disabled', 'true');
  },
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
