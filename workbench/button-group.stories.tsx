import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { View } from 'react-native';

import { ButtonGroup as ButtonGroupWeb } from '@design-system/button-group/button-group.web.tsx';
import { ButtonGroup as ButtonGroupNative } from '@design-system/button-group/button-group.native.tsx';
import type {
  ButtonGroupIntent,
  ButtonGroupOrientation,
  ButtonGroupSize,
} from '@design-system/button-group/button-group.props.ts';

import { LeafPair, pair } from './leaf-pair.tsx';

const ORIENTATIONS = [
  'horizontal',
  'vertical',
] as const satisfies readonly ButtonGroupOrientation[];
const SIZES = ['sm', 'md', 'lg'] as const satisfies readonly ButtonGroupSize[];
const INTENTS = ['primary', 'secondary', 'ghost'] as const satisfies readonly ButtonGroupIntent[];

/**
 * `ButtonGroup` is a parts object (`Root`/`Item`), so there is no meta
 * `component` for the docs-page props table — the same reason RadioGroup and
 * Dialog have none. It joins a row (or column) of related ACTION buttons
 * behind one shared border, only the outer corners rounded — `ToggleGroup`
 * already covers a SELECTION (pressing one changes a value); this is for
 * pressing one to perform a thing, so there is no `value`/`onValueChange`
 * anywhere here, only each Item's own handler.
 *
 * Args are typed against the shared props surface (`button-group.props.ts`),
 * never against either leaf. The three Items (Day/Week/Month) are fixed
 * composition — the same way Dialog's content is fixed and only its text
 * args vary — and share ONE bridging `onPress` arg: the leaves disagree on
 * the handler's name (web `onClick`, native `onPress`), so the story owns
 * one arg and `render` wires it to each leaf's own prop, for all three
 * Items at once.
 */
type ButtonGroupArgs = {
  orientation: ButtonGroupOrientation;
  attached: boolean;
  disabled: boolean;
  size: ButtonGroupSize;
  intent: ButtonGroupIntent;
  label: string;
  onPress: () => void;
};

const meta = {
  title: 'Forms/ButtonGroup',
  parameters: { layout: 'fullscreen' },
  args: {
    orientation: 'horizontal',
    attached: true,
    disabled: false,
    size: 'md',
    intent: 'secondary',
    label: 'View range',
    onPress: fn(),
  },
  argTypes: {
    orientation: { control: 'inline-radio', options: [...ORIENTATIONS] },
    size: { control: 'inline-radio', options: [...SIZES] },
    intent: { control: 'inline-radio', options: [...INTENTS] },
  },
  render: (args) => (
    <LeafPair
      web={
        <ButtonGroupWeb.Root
          orientation={args.orientation}
          attached={args.attached}
          disabled={args.disabled}
          size={args.size}
          intent={args.intent}
          label={args.label}
        >
          <ButtonGroupWeb.Item onClick={args.onPress}>Day</ButtonGroupWeb.Item>
          <ButtonGroupWeb.Item onClick={args.onPress}>Week</ButtonGroupWeb.Item>
          <ButtonGroupWeb.Item onClick={args.onPress}>Month</ButtonGroupWeb.Item>
        </ButtonGroupWeb.Root>
      }
      native={
        <ButtonGroupNative.Root
          orientation={args.orientation}
          attached={args.attached}
          disabled={args.disabled}
          size={args.size}
          intent={args.intent}
          label={args.label}
        >
          <ButtonGroupNative.Item onPress={args.onPress}>Day</ButtonGroupNative.Item>
          <ButtonGroupNative.Item onPress={args.onPress}>Week</ButtonGroupNative.Item>
          <ButtonGroupNative.Item onPress={args.onPress}>Month</ButtonGroupNative.Item>
        </ButtonGroupNative.Root>
      }
    />
  ),
} satisfies Meta<ButtonGroupArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default pairing, live in both panes. Not on the INTERACTIVE list — a
 * ButtonGroup has no internal state or keyboard grammar of its own, only
 * Items that each fire their own handler — but the play still proves the
 * wiring is not silently dropped: one press on the MIDDLE Item per pane, and
 * the shared `onPress` arg's call count after each.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args }) => {
    const { web, native } = pair(canvasElement);

    await userEvent.click(web.getByRole('button', { name: 'Week' }));
    await expect(args.onPress).toHaveBeenCalledTimes(1);

    await userEvent.click(native.getByRole('button', { name: 'Week' }));
    await expect(args.onPress).toHaveBeenCalledTimes(2);
  },
};

/**
 * A column instead of a row: the join moves from left/right edges to
 * top/bottom ones — `Week`'s top and bottom corners are both square, and the
 * 1px overlap that collapses adjoining borders moves from `-ml-px` to
 * `-mt-px`.
 */
export const Vertical: Story = {
  args: { orientation: 'vertical' },
};

/**
 * The three emphases a group can wear — `danger` is deliberately absent, see
 * `button-group.props.ts`'s header for why a group is the wrong place for
 * Button's singular destructive fill.
 */
export const Intents: Story = {
  render: () => (
    <LeafPair
      web={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'start' }}>
          {INTENTS.map((intent) => (
            <ButtonGroupWeb.Root key={intent} intent={intent} label={`${intent} range`}>
              <ButtonGroupWeb.Item>Day</ButtonGroupWeb.Item>
              <ButtonGroupWeb.Item>Week</ButtonGroupWeb.Item>
              <ButtonGroupWeb.Item>Month</ButtonGroupWeb.Item>
            </ButtonGroupWeb.Root>
          ))}
        </div>
      }
      native={
        <View style={{ flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
          {INTENTS.map((intent) => (
            <ButtonGroupNative.Root key={intent} intent={intent} label={`${intent} range`}>
              <ButtonGroupNative.Item>Day</ButtonGroupNative.Item>
              <ButtonGroupNative.Item>Week</ButtonGroupNative.Item>
              <ButtonGroupNative.Item>Month</ButtonGroupNative.Item>
            </ButtonGroupNative.Root>
          ))}
        </View>
      }
    />
  ),
};

/**
 * The three heights, at real scale. `sm` is 32dp — under the WCAG 2.5.5 44dp
 * target-size floor, a deliberate opt-in for dense chrome — `md` and `lg`
 * clear it, exactly as they do on a lone Button.
 */
export const Sizes: Story = {
  render: () => (
    <LeafPair
      note="`sm` is 32dp — below the 44dp WCAG 2.5.5 target-size floor, and a deliberate opt-in for dense chrome. `md` and `lg` clear it."
      web={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'start' }}>
          {SIZES.map((size) => (
            <ButtonGroupWeb.Root key={size} size={size} label={`${size} range`}>
              <ButtonGroupWeb.Item>Day</ButtonGroupWeb.Item>
              <ButtonGroupWeb.Item>Week</ButtonGroupWeb.Item>
              <ButtonGroupWeb.Item>Month</ButtonGroupWeb.Item>
            </ButtonGroupWeb.Root>
          ))}
        </div>
      }
      native={
        <View style={{ flexDirection: 'column', gap: 16, alignItems: 'flex-start' }}>
          {SIZES.map((size) => (
            <ButtonGroupNative.Root key={size} size={size} label={`${size} range`}>
              <ButtonGroupNative.Item>Day</ButtonGroupNative.Item>
              <ButtonGroupNative.Item>Week</ButtonGroupNative.Item>
              <ButtonGroupNative.Item>Month</ButtonGroupNative.Item>
            </ButtonGroupNative.Root>
          ))}
        </View>
      }
    />
  ),
};

/**
 * `attached={false}` — "just space them evenly": each Item keeps its own full
 * `rounded-md` and there is no border collapsing, only a `gap-sm` row. Look
 * for the visible gap between Items and every corner rounded, where the
 * default story shows one continuous outline.
 */
export const Detached: Story = {
  args: { attached: false },
};

/**
 * Disabled is asserted, not clicked: the web leaf disables the real
 * `<button>` (`toBeDisabled`), the native leaf can only speak ARIA through
 * react-native-web (`aria-disabled`) — the same split Button's own Disabled
 * story documents.
 */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const { web, native } = pair(canvasElement);

    await expect(web.getByRole('button', { name: 'Day' })).toBeDisabled();
    await expect(web.getByRole('button', { name: 'Week' })).toBeDisabled();
    await expect(web.getByRole('button', { name: 'Month' })).toBeDisabled();

    await expect(native.getByRole('button', { name: 'Day' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  },
};
