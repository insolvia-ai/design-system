import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { View } from 'react-native';

import { Chip as ChipWeb } from '@design-system/chip/chip.web.tsx';
import { Chip as ChipNative } from '@design-system/chip/chip.native.tsx';
import { chipClass, type ChipSize } from '@design-system/chip/chip.props.ts';

import { LeafPair, pair } from './leaf-pair.tsx';

const SIZES = ['sm', 'md'] as const satisfies readonly ChipSize[];

/**
 * Args are typed against the SHARED props surface (`chip.props.ts`), not
 * against either leaf: the leaves disagree on the handler's name (`onClick` on
 * web, `onPress` on native), so the story owns one bridging arg — `onPress` —
 * and the meta `render` wires it to each leaf's own prop. Threading is
 * explicit, prop by prop, never `{...args}`.
 */
type ChipArgs = {
  pressed: boolean;
  size: ChipSize;
  children: string;
  onPress: () => void;
};

/**
 * A bordered, pressable label — a tag filter, a nav link on a phone, a "which
 * of these is involved" row.
 *
 * It is CONTROLLED and presentational: `pressed` comes from whatever the
 * caller already owns (a route match, a filter array), and there is no
 * `onPressedChange`. A control that owns its own pressed state is `Toggle`.
 */
const meta = {
  title: 'Forms/Chip',
  component: ChipWeb,
  parameters: { layout: 'fullscreen' },
  args: { pressed: false, size: 'md', children: 'Drafts', onPress: fn() },
  argTypes: {
    size: { control: 'inline-radio', options: [...SIZES] },
    pressed: { control: 'boolean' },
  },
  render: (args) => (
    <LeafPair
      web={
        <ChipWeb pressed={args.pressed} size={args.size} onClick={args.onPress}>
          {args.children}
        </ChipWeb>
      }
      native={
        <ChipNative pressed={args.pressed} size={args.size} onPress={args.onPress}>
          {args.children}
        </ChipNative>
      }
    />
  ),
} satisfies Meta<ChipArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default pairing. The play proves the wiring, not the styling: one press
 * per leaf, counted per pane — the two panes share one `fn()` arg, so a pane
 * that silently drops input would otherwise be vouched for by the other's
 * earlier call.
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

/**
 * Rest and pressed, side by side.
 *
 * Look for the border: BOTH states have one, and only its colour moves. A
 * shape that dropped its outline when selected would change size by two pixels
 * as you pressed it, and a row of them would reflow — which is exactly what a
 * chip row must not do.
 */
export const Pressed: Story = {
  render: () => (
    <LeafPair
      note="Both states carry a border; only its colour moves, so the box never changes size."
      web={
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <ChipWeb pressed={false}>Drafts</ChipWeb>
          <ChipWeb pressed>Published</ChipWeb>
          <ChipWeb pressed={false}>Archived</ChipWeb>
        </div>
      }
      native={
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <ChipNative pressed={false}>Drafts</ChipNative>
          <ChipNative pressed>Published</ChipNative>
          <ChipNative pressed={false}>Archived</ChipNative>
        </View>
      }
    />
  ),
};

/**
 * The two sizes, on the same height scale as Button and Toggle — 32dp and
 * 44dp, so a chip row and a button beside it agree.
 *
 * `sm` is under the WCAG 2.5.5 floor and carries the coarse-pointer overlay
 * that grows the TARGET without growing the box. You cannot see that here; it
 * only exists under `@media (pointer: coarse)`.
 */
export const Sizes: Story = {
  render: () => (
    <LeafPair
      note="`sm` is 32dp and gains a 44dp hit area on a coarse pointer — invisible on a mouse, which is the point."
      web={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {SIZES.map((size) => (
            <ChipWeb key={size} size={size}>
              {size}
            </ChipWeb>
          ))}
        </div>
      }
      native={
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {SIZES.map((size) => (
            <ChipNative key={size} size={size}>
              {size}
            </ChipNative>
          ))}
        </View>
      }
    />
  ),
};

/**
 * The case `chipClass` exists for, and the reason a chip is a helper before it
 * is a component.
 *
 * A router link takes a FUNCTION `className` that is handed the active state,
 * so it cannot be a `<button>` and cannot be handed a wrapping component
 * without changing what element the router and the a11y tree see. The helper
 * gives it the string instead — the same split Button documents for
 * `buttonClass`.
 *
 * The web pane is a real `<a>`. The native pane shows the component form
 * beside it, because React Native has no anchor to demonstrate.
 */
export const AsALink: Story = {
  render: () => (
    <LeafPair
      note="Web: a real <a> wearing chipClass(). A router NavLink's function className is the case this exists for."
      web={
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a href="#runs" className={chipClass({ pressed: true })}>
            Runs
          </a>
          <a href="#scenes" className={chipClass()}>
            Scenes
          </a>
        </div>
      }
      native={
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <ChipNative pressed>Runs</ChipNative>
          <ChipNative>Scenes</ChipNative>
        </View>
      }
    />
  ),
};
