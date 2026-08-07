import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { Text, View } from 'react-native';

import { ToggleGroup as ToggleGroupWeb } from '@design-system/toggle-group/toggle-group.web.tsx';
import { ToggleGroup as ToggleGroupNative } from '@design-system/toggle-group/toggle-group.native.tsx';
import { Toggle as ToggleWeb } from '@design-system/toggle/toggle.web.tsx';
import { Toggle as ToggleNative } from '@design-system/toggle/toggle.native.tsx';

import { LeafPair, pair } from './leaf-pair.tsx';

/**
 * `ToggleGroup` is a parts object (`Root` only) composed with `Toggle`, not a
 * single component — so there is no meta `component` for the docs-page props
 * table. Args cover the group's own state
 * (`defaultValue`/`multiple`/`disabled`/`onValueChange`); the three member
 * toggles (Left/Center/Right) and the native-leaf labelling workaround (see
 * the `note` below) are fixed composition, the same way Dialog's content is
 * fixed and only the text args vary. `defaultValue` gets no control — it
 * seeds UNCONTROLLED state (the select.stories.tsx `defaultValue` note
 * explains the same gap).
 */
type ToggleGroupArgs = {
  defaultValue: string[];
  multiple: boolean;
  disabled: boolean;
  onValueChange: (value: string[]) => void;
};

const meta = {
  title: 'Components/ToggleGroup',
  parameters: { layout: 'fullscreen' },
  args: {
    defaultValue: ['left'],
    multiple: false,
    disabled: false,
    onValueChange: fn(),
  },
  argTypes: {
    defaultValue: { control: false },
  },
  render: (args) => (
    <LeafPair
      note='Native `ToggleGroup.Root` has no `role="group"` equivalent, so `aria-label` there is a prohibited ARIA attribute. The web group is labelled with `aria-label="Text alignment"`; the native pane gets a visible heading instead, and the group itself stays unnamed.'
      web={
        <ToggleGroupWeb.Root
          defaultValue={args.defaultValue}
          multiple={args.multiple}
          disabled={args.disabled}
          onValueChange={args.onValueChange}
          aria-label="Text alignment"
        >
          <ToggleWeb value="left">Left</ToggleWeb>
          <ToggleWeb value="center">Center</ToggleWeb>
          <ToggleWeb value="right">Right</ToggleWeb>
        </ToggleGroupWeb.Root>
      }
      native={
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '600' }}>Text alignment</Text>
          <ToggleGroupNative.Root
            defaultValue={args.defaultValue}
            multiple={args.multiple}
            disabled={args.disabled}
            onValueChange={args.onValueChange}
          >
            <ToggleNative value="left">Left</ToggleNative>
            <ToggleNative value="center">Center</ToggleNative>
            <ToggleNative value="right">Right</ToggleNative>
          </ToggleGroupNative.Root>
        </View>
      }
    />
  ),
} satisfies Meta<ToggleGroupArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default pairing, live in both panes. Single-select (the default,
 * `multiple: false`): the play checks the web group's accessible name — the
 * native group has none, see the meta `note` above — then presses an
 * unpressed member and asserts it swaps in for the previously-pressed one,
 * via the shared `onValueChange` arg, in both panes.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: group is named; pressing a member swaps the selection', async () => {
      await expect(web.getByRole('group', { name: 'Text alignment' })).toBeInTheDocument();
      await userEvent.click(web.getByRole('button', { name: 'Center' }));
      await expect(args.onValueChange).toHaveBeenCalledTimes(1);
      await expect(args.onValueChange).toHaveBeenLastCalledWith(['center']);
      await expect(web.getByRole('button', { name: 'Left' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
      await expect(web.getByRole('button', { name: 'Center' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });

    await step('native leaf: same single-select swap, same handler', async () => {
      await userEvent.click(native.getByRole('button', { name: 'Center' }));
      await expect(args.onValueChange).toHaveBeenCalledTimes(2);
      await expect(args.onValueChange).toHaveBeenLastCalledWith(['center']);
      await expect(native.getByRole('button', { name: 'Left' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
      await expect(native.getByRole('button', { name: 'Center' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
    });
  },
};

/**
 * `ToggleGroup.Root` cannot be labelled the same way on both leaves. The web
 * Root is `role="group"` and takes `aria-label` correctly; the native Root is
 * a bare `View` with no `role="group"` equivalent in RN (see
 * `toggle-group.native.tsx`'s header), so `accessibilityLabel`/`aria-label`
 * there is a prohibited ARIA attribute — axe's `aria-prohibited-attr`, live in
 * this gate. So: the web pane names the group with `aria-label`; the native
 * pane instead gets a plain visible `<Text>` heading above an unnamed group.
 * That is shown honestly here, not papered over.
 */
export const SingleSelect: Story = {
  render: () => (
    <LeafPair
      note='Native `ToggleGroup.Root` has no `role="group"` equivalent, so `aria-label` there is a prohibited ARIA attribute. The web group is labelled with `aria-label="Text alignment"`; the native pane gets a visible heading instead, and the group itself stays unnamed.'
      web={
        <ToggleGroupWeb.Root defaultValue={['left']} aria-label="Text alignment">
          <ToggleWeb value="left">Left</ToggleWeb>
          <ToggleWeb value="center">Center</ToggleWeb>
          <ToggleWeb value="right">Right</ToggleWeb>
        </ToggleGroupWeb.Root>
      }
      native={
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '600' }}>Text alignment</Text>
          <ToggleGroupNative.Root defaultValue={['left']}>
            <ToggleNative value="left">Left</ToggleNative>
            <ToggleNative value="center">Center</ToggleNative>
            <ToggleNative value="right">Right</ToggleNative>
          </ToggleGroupNative.Root>
        </View>
      }
    />
  ),
};

export const MultiSelect: Story = {
  render: () => (
    <LeafPair
      note="Same native labelling gap as SingleSelect: only the web group carries an accessible name, so the native pane repeats the visible-heading idiom."
      web={
        <ToggleGroupWeb.Root multiple defaultValue={['bold', 'italic']} aria-label="Text style">
          <ToggleWeb value="bold">Bold</ToggleWeb>
          <ToggleWeb value="italic">Italic</ToggleWeb>
          <ToggleWeb value="underline">Underline</ToggleWeb>
        </ToggleGroupWeb.Root>
      }
      native={
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '600' }}>Text style</Text>
          <ToggleGroupNative.Root multiple defaultValue={['bold', 'italic']}>
            <ToggleNative value="bold">Bold</ToggleNative>
            <ToggleNative value="italic">Italic</ToggleNative>
            <ToggleNative value="underline">Underline</ToggleNative>
          </ToggleGroupNative.Root>
        </View>
      }
    />
  ),
};
