import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { View } from 'react-native';

import { Button as ButtonWeb } from '@design-system/button/button.web.tsx';
import { Button as ButtonNative } from '@design-system/button/button.native.tsx';
import type { ButtonIntent, ButtonSize } from '@design-system/button/button.props.ts';

import { LeafPair, pair } from './leaf-pair.tsx';

// The four intents that EXIST — `danger` joined them once tokens 0.4.0 shipped
// a measured `danger-text`; button.props.ts has the rows.
//
// This list said `danger` ONCE BEFORE, in 0.8.3, when the intent did not exist:
// `intentStyles['danger']` was `undefined`, `cn()` dropped it, and the button
// rendered with no intent classes at all while the workbench labelled it
// "danger". Nothing was going to catch that — stories sat outside every
// tsconfig program back then. `satisfies` ties the list to `ButtonIntent` now,
// so this line being right is a compile-time fact rather than a hopeful one.
const INTENTS = [
  'primary',
  'secondary',
  'ghost',
  'danger',
] as const satisfies readonly ButtonIntent[];
const SIZES = ['sm', 'md', 'lg'] as const satisfies readonly ButtonSize[];

/**
 * Args are typed against the SHARED props surface (`button.props.ts`), not
 * against either leaf: the leaves disagree on handler names (`onClick` on web,
 * `onPress` on native), so the story owns one bridging arg — `onPress` — and
 * the meta `render` wires it to each leaf's own prop. Threading is explicit,
 * prop by prop, never `{...args}`: that is what lets `typecheck:workbench`
 * check every prop NAME against both leaves, which is the exact class of bug
 * the 0.8.3 note above records.
 */
type ButtonArgs = {
  intent: ButtonIntent;
  size: ButtonSize;
  disabled: boolean;
  wrap: boolean;
  children: string;
  onPress: () => void;
};

const meta = {
  title: 'Forms/Button',
  // The web leaf, for the docs-page props table only (best-effort react-docgen
  // — see the addon-docs note in .storybook/main.ts). Controls never rely on
  // it: they are declared by hand in `argTypes` below.
  component: ButtonWeb,
  parameters: { layout: 'fullscreen' },
  args: {
    intent: 'primary',
    size: 'md',
    disabled: false,
    wrap: false,
    children: 'Continue',
    onPress: fn(),
  },
  argTypes: {
    intent: { control: 'inline-radio', options: [...INTENTS] },
    size: { control: 'inline-radio', options: [...SIZES] },
  },
  render: (args) => (
    <LeafPair
      web={
        <ButtonWeb
          intent={args.intent}
          size={args.size}
          disabled={args.disabled}
          wrap={args.wrap}
          onClick={args.onPress}
        >
          {args.children}
        </ButtonWeb>
      }
      native={
        <ButtonNative
          intent={args.intent}
          size={args.size}
          disabled={args.disabled}
          wrap={args.wrap}
          onPress={args.onPress}
        >
          {args.children}
        </ButtonNative>
      }
    />
  ),
} satisfies Meta<ButtonArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default pairing, live in both panes. The play proves the wiring, not the
 * styling: one click per leaf, and the shared `onPress` arg must fire for both
 * — a leaf that renders but swallows its handler looks identical until
 * something counts.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);
    await step('web leaf fires the handler', async () => {
      await userEvent.click(web.getByRole('button', { name: args.children }));
      await expect(args.onPress).toHaveBeenCalledTimes(1);
    });
    await step('native leaf fires the same handler', async () => {
      await userEvent.click(native.getByRole('button', { name: args.children }));
      await expect(args.onPress).toHaveBeenCalledTimes(2);
    });
  },
};

export const Intents: Story = {
  render: () => (
    <LeafPair
      web={
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {INTENTS.map((intent) => (
            <ButtonWeb key={intent} intent={intent}>
              {intent}
            </ButtonWeb>
          ))}
        </div>
      }
      native={
        <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
          {INTENTS.map((intent) => (
            <ButtonNative key={intent} intent={intent}>
              {intent}
            </ButtonNative>
          ))}
        </View>
      }
    />
  ),
};

/**
 * Sizes matter here for a reason that is not aesthetic.
 *
 * WCAG 2.5.5 puts the minimum touch target at 44dp. `md` and `lg` are over it
 * (44 and 48); `sm` is 32, which is a DELIBERATE opt-in to a smaller target
 * for dense chrome and is under the floor. Seeing the three together at real
 * scale is the cheapest way to keep that in view — the a11y panel will not
 * flag it, because axe cannot know what a target is for.
 *
 * This note read "`md` is 40dp — below the floor" until `md` moved to 44.
 */
export const Sizes: Story = {
  render: () => (
    <LeafPair
      note="`sm` is 32dp — below the 44dp WCAG 2.5.5 target-size floor, and a deliberate opt-in for dense chrome. `md` and `lg` clear it."
      web={
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {SIZES.map((size) => (
            <ButtonWeb key={size} size={size}>
              {size}
            </ButtonWeb>
          ))}
        </div>
      }
      native={
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {SIZES.map((size) => (
            <ButtonNative key={size} size={size}>
              {size}
            </ButtonNative>
          ))}
        </View>
      }
    />
  ),
};

/**
 * Disabled is asserted, not clicked: the web leaf disables the real `<button>`
 * (jest-dom's `toBeDisabled`), the native leaf can only speak ARIA through
 * react-native-web (`aria-disabled`). Clicking a disabled control in a play
 * proves nothing — the interesting claim is what the accessibility tree says.
 */
export const Disabled: Story = {
  args: { disabled: true, children: 'Can’t continue' },
  play: async ({ canvasElement, args }) => {
    const { web, native } = pair(canvasElement);
    await expect(web.getByRole('button', { name: args.children })).toBeDisabled();
    await expect(native.getByRole('button', { name: args.children })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  },
};

/**
 * The case `wrap` exists for, at the width where it went wrong.
 *
 * An armed destructive button spells out what it will destroy. At the default
 * `whitespace-nowrap` the box simply GROWS to fit the sentence, so on a phone
 * the label ran off the side and took the page's horizontal scrollbar with it.
 * Both panes are constrained to 150px here, which is the only way to see the
 * difference at all — at full width both buttons look the same.
 *
 * Look for: the top button overflowing its container, the bottom one growing
 * downwards. The bottom one's height at one line is identical to the top's;
 * `wrapSizeStyles` trades `h-11` for `min-h-11` precisely so it is.
 *
 * THE TWO PANES DISAGREE ON THE TOP ROW, and that is pre-existing rather than
 * something `wrap` introduced. Without it the web leaf is `whitespace-nowrap`
 * and overflows sideways; RN has no such property, so its Text wraps anyway
 * and overflows a fixed height downwards instead. Both are broken, in the two
 * ways their platforms are able to be — which is the argument for the option
 * rather than against it. With `wrap` on, the two agree exactly.
 */
export const Wrapping: Story = {
  render: () => (
    <LeafPair
      note="Both panes are capped at 150px. `wrap` trades the fixed height for the same number as a minimum, so a one-line label is unchanged."
      web={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 150 }}>
          <ButtonWeb intent="danger">Confirm — delete 54 files</ButtonWeb>
          <ButtonWeb intent="danger" wrap>
            Confirm — delete 54 files
          </ButtonWeb>
          <ButtonWeb intent="danger" wrap>
            Delete
          </ButtonWeb>
        </div>
      }
      native={
        <View style={{ flexDirection: 'column', gap: 12, width: 150 }}>
          <ButtonNative intent="danger">Confirm — delete 54 files</ButtonNative>
          <ButtonNative intent="danger" wrap>
            Confirm — delete 54 files
          </ButtonNative>
          <ButtonNative intent="danger" wrap>
            Delete
          </ButtonNative>
        </View>
      }
    />
  ),
};
