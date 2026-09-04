import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { View } from 'react-native';

import { Toggle as ToggleWeb } from '@design-system/toggle/toggle.web.tsx';
import { Toggle as ToggleNative } from '@design-system/toggle/toggle.native.tsx';
import type { ToggleSize } from '@design-system/toggle/toggle.props.ts';
// Rendered BESIDE the toggles in `Sizes`: the claim is that the two controls
// agree on height, which is invisible unless both are on screen.
import { Button as ButtonWeb } from '@design-system/button/button.web.tsx';
import { Button as ButtonNative } from '@design-system/button/button.native.tsx';

import { LeafPair, pair } from './leaf-pair.tsx';

const SIZES = ['sm', 'md'] as const satisfies readonly ToggleSize[];

/**
 * `Toggle` is a single component on both leaves, so — unlike Checkbox and
 * Switch — meta gets a `component` for the docs-page props table. A
 * standalone toggle takes its accessible name from its text children on both
 * leaves (see `States` below), so args carry that text as `children` rather
 * than a separate `label`. `defaultPressed` gets no control — it seeds
 * UNCONTROLLED state (the select.stories.tsx `defaultValue` note explains
 * the same gap).
 */
type ToggleArgs = {
  children: string;
  defaultPressed: boolean;
  disabled: boolean;
  size: ToggleSize;
  onPressedChange: (pressed: boolean) => void;
};

const meta = {
  title: 'Forms/Toggle',
  component: ToggleWeb,
  parameters: { layout: 'fullscreen' },
  args: {
    children: 'Bold',
    defaultPressed: false,
    disabled: false,
    size: 'md',
    onPressedChange: fn(),
  },
  argTypes: {
    defaultPressed: { control: false },
    size: { control: 'inline-radio', options: [...SIZES] },
  },
  render: (args) => (
    <LeafPair
      web={
        <ToggleWeb
          defaultPressed={args.defaultPressed}
          disabled={args.disabled}
          size={args.size}
          onPressedChange={args.onPressedChange}
        >
          {args.children}
        </ToggleWeb>
      }
      native={
        <ToggleNative
          defaultPressed={args.defaultPressed}
          disabled={args.disabled}
          size={args.size}
          onPressedChange={args.onPressedChange}
        >
          {args.children}
        </ToggleNative>
      }
    />
  ),
} satisfies Meta<ToggleArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default pairing, live in both panes. The play starts pressed (so the
 * sequence ends there too — a pressed toggle is the more interesting state
 * for the axe pass that follows), unpresses on the first click, and
 * re-presses on the second, asserting `aria-pressed` and the shared
 * `onPressedChange` arg at every step.
 */
export const Basic: Story = {
  args: { defaultPressed: true },
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: click unpresses, click again re-presses', async () => {
      const toggle = web.getByRole('button', { name: args.children });
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
      await userEvent.click(toggle);
      await waitFor(() => expect(toggle).toHaveAttribute('aria-pressed', 'false'));
      await expect(args.onPressedChange).toHaveBeenCalledTimes(1);
      await expect(args.onPressedChange).toHaveBeenLastCalledWith(false);
      await userEvent.click(toggle);
      await waitFor(() => expect(toggle).toHaveAttribute('aria-pressed', 'true'));
      await expect(args.onPressedChange).toHaveBeenCalledTimes(2);
      await expect(args.onPressedChange).toHaveBeenLastCalledWith(true);
    });

    await step('native leaf: same pressed contract, same handler', async () => {
      const toggle = native.getByRole('button', { name: args.children });
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
      await userEvent.click(toggle);
      await waitFor(() => expect(toggle).toHaveAttribute('aria-pressed', 'false'));
      await expect(args.onPressedChange).toHaveBeenCalledTimes(3);
      await expect(args.onPressedChange).toHaveBeenLastCalledWith(false);
      await userEvent.click(toggle);
      await waitFor(() => expect(toggle).toHaveAttribute('aria-pressed', 'true'));
      await expect(args.onPressedChange).toHaveBeenCalledTimes(4);
      await expect(args.onPressedChange).toHaveBeenLastCalledWith(true);
    });
  },
};

/**
 * A standalone `Toggle` — no enclosing `ToggleGroup` — takes its accessible
 * name from its text children on both leaves, so every toggle below is given
 * one directly (a document editor's formatting buttons: "Bold", "Italic").
 * The native leaf renders that text as a `Pressable` + `<Text>` under
 * `accessibilityRole="button"`, not the RN `'togglebutton'` role — see
 * `toggle.native.tsx`'s header for why that role would drop the computed
 * name on react-native-web.
 */
export const States: Story = {
  render: () => (
    <LeafPair
      web={
        <div style={{ display: 'flex', gap: 12 }}>
          <ToggleWeb>Bold</ToggleWeb>
          <ToggleWeb defaultPressed>Italic</ToggleWeb>
        </div>
      }
      native={
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <ToggleNative>Bold</ToggleNative>
          <ToggleNative defaultPressed>Italic</ToggleNative>
        </View>
      }
    />
  ),
};

/**
 * Disabled is asserted, not clicked: the web leaf disables the real
 * `<button>` (jest-dom's `toBeDisabled`), the native leaf can only speak
 * ARIA through react-native-web (`aria-disabled`).
 */
export const Disabled: Story = {
  render: () => (
    <LeafPair
      web={<ToggleWeb disabled>Strikethrough</ToggleWeb>}
      native={<ToggleNative disabled>Strikethrough</ToggleNative>}
    />
  ),
  play: async ({ canvasElement }) => {
    const { web, native } = pair(canvasElement);
    await expect(web.getByRole('button', { name: 'Strikethrough' })).toBeDisabled();
    await expect(native.getByRole('button', { name: 'Strikethrough' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  },
};

/**
 * The two sizes, and the height `md` moved to.
 *
 * `md` used to set no height at all and landed at 36px from its padding, while
 * every other `md` control in this package — a Button, a Select trigger, a
 * Wheel row — is 44, the WCAG 2.5.5 target-size floor each of them cites by
 * name. Bottom-aligned in a form row that is not a few pixels: each control's
 * label sits above its own box, so two heights put two labels on two lines,
 * and a consumer was normalising it in its own stylesheet.
 *
 * A Button is rendered beside each toggle here, because "they agree" is the
 * only claim worth looking at and it is invisible in isolation.
 */
export const Sizes: Story = {
  render: () => (
    <LeafPair
      note="A `md` Toggle is 44dp now, matching every other `md` control. `sm` is 32 and matches Button's `sm`."
      web={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {SIZES.map((size) => (
            <div key={size} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <ToggleWeb size={size} defaultPressed>
                {size}
              </ToggleWeb>
              <ButtonWeb size={size}>Button</ButtonWeb>
            </div>
          ))}
        </div>
      }
      native={
        <View style={{ flexDirection: 'column', gap: 12 }}>
          {SIZES.map((size) => (
            <View key={size} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <ToggleNative size={size} defaultPressed>
                {size}
              </ToggleNative>
              <ButtonNative size={size}>Button</ButtonNative>
            </View>
          ))}
        </View>
      }
    />
  ),
};

/**
 * `iconOnly`, the narrowest a toggle gets — and the shape a view switch wants.
 *
 * The accessible name is the thing to watch. A toggle whose only child is a
 * glyph has no text for the name-from-content rule to read, so `iconOnly`
 * REQUIRES a `label` in the type: `<Toggle iconOnly>▦</Toggle>` does not
 * compile. That is the same standard `IconButton`'s required `label` sets, and
 * the reason both exist rather than leaving a bare `<button>` to remember it.
 *
 * The box is `IconButton`'s exactly (32 and 44), so an icon-only toggle group
 * and the icon buttons beside it in a toolbar line up by construction.
 */
export const IconOnly: Story = {
  render: () => (
    <LeafPair
      note="Hover either glyph: the label is the tooltip on web, and the accessible name on both leaves."
      web={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ToggleWeb iconOnly label="Grid view" size="sm" defaultPressed>
            ▦
          </ToggleWeb>
          <ToggleWeb iconOnly label="List view" size="sm">
            ☰
          </ToggleWeb>
        </div>
      }
      native={
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <ToggleNative iconOnly label="Grid view" size="sm" defaultPressed>
            ▦
          </ToggleNative>
          <ToggleNative iconOnly label="List view" size="sm">
            ☰
          </ToggleNative>
        </View>
      }
    />
  ),
};
