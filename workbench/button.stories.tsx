import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { View } from 'react-native';

import { Button as ButtonWeb } from '@design-system/button/button.web.tsx';
import { Button as ButtonNative } from '@design-system/button/button.native.tsx';
import type { ButtonIntent, ButtonSize } from '@design-system/button/button.props.ts';

import { LeafPair, pair } from './leaf-pair.tsx';

// The three intents that EXIST. `danger` is not one of them — `button.props.ts`
// says so and explains why (the semantic token set has no `danger-text` pair).
// This list said `danger` until 0.8.3, which meant `intentStyles['danger']` was
// `undefined`, `cn()` dropped it, and the third button rendered with no intent
// classes at all while the workbench labelled it "danger". Nothing was going to
// catch that: stories sat outside every tsconfig program back then. Now
// `satisfies` ties the list to `ButtonIntent`, so drift is a compile error in
// `typecheck:workbench` instead of an unstyled button under a wrong label.
const INTENTS = ['primary', 'secondary', 'ghost'] as const satisfies readonly ButtonIntent[];
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
  children: string;
  onPress: () => void;
};

const meta = {
  title: 'Components/Button',
  // The web leaf, for the docs-page props table only (best-effort react-docgen
  // — see the addon-docs note in .storybook/main.ts). Controls never rely on
  // it: they are declared by hand in `argTypes` below.
  component: ButtonWeb,
  parameters: { layout: 'fullscreen' },
  args: {
    intent: 'primary',
    size: 'md',
    disabled: false,
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
 * WCAG 2.5.5 puts the minimum touch target at 44dp, and this package's `md` is
 * 40dp — under it. A consumer building for touch therefore wants `lg`, and
 * seeing the three sizes together at real scale is the cheapest way to keep
 * that in view. The a11y panel will not flag it: 40dp violates nothing axe
 * checks, because axe cannot know what the target is for.
 */
export const Sizes: Story = {
  render: () => (
    <LeafPair
      note="`md` is 40dp — below the 44dp WCAG 2.5.5 target-size floor, which is why a touch consumer wants `lg`."
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
