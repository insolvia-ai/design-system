import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent } from 'storybook/test';

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
      note="Both groups are named the same invisible way — `aria-label` on the Root. Until 0.9.1 only the web one could be, and the native pane carried a visible heading to compensate; that heading was the story's, never the package's."
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
        <ToggleGroupNative.Root
          defaultValue={args.defaultValue}
          multiple={args.multiple}
          disabled={args.disabled}
          onValueChange={args.onValueChange}
          aria-label="Text alignment"
        >
          <ToggleNative value="left">Left</ToggleNative>
          <ToggleNative value="center">Center</ToggleNative>
          <ToggleNative value="right">Right</ToggleNative>
        </ToggleGroupNative.Root>
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
      // Named the same as the web group since 0.9.1 — see SingleSelect's doc
      // comment for what this pane used to render instead.
      await expect(native.getByRole('group', { name: 'Text alignment' })).toBeInTheDocument();
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
 * Both leaves name the group the same way: `aria-label` on the Root, invisible
 * on both sides.
 *
 * THE REGRESSION STORY for 0.9.1 — keep it. Until then the native Root was a
 * roleless `View`, so `aria-label` on it was axe's `aria-prohibited-attr` and
 * the group simply could not be named. This story compensated with a visible
 * `<Text>` heading above the native pane, which made the workbench look MORE
 * accessible than the package was: no consumer rendering
 * `ToggleGroup.Root` ever got that heading, and the a11y gate passed a
 * component that would have failed in their app. A workbench that patches
 * around a component gap hides exactly what it exists to show.
 */
export const SingleSelect: Story = {
  render: () => (
    <LeafPair
      note={
        'Both groups carry `aria-label` on the Root and no visible heading. If a heading ever reappears in the native pane, the native Root has lost its `role="group"` again.'
      }
      web={
        <ToggleGroupWeb.Root defaultValue={['left']} aria-label="Text alignment">
          <ToggleWeb value="left">Left</ToggleWeb>
          <ToggleWeb value="center">Center</ToggleWeb>
          <ToggleWeb value="right">Right</ToggleWeb>
        </ToggleGroupWeb.Root>
      }
      native={
        <ToggleGroupNative.Root defaultValue={['left']} aria-label="Text alignment">
          <ToggleNative value="left">Left</ToggleNative>
          <ToggleNative value="center">Center</ToggleNative>
          <ToggleNative value="right">Right</ToggleNative>
        </ToggleGroupNative.Root>
      }
    />
  ),
  play: async ({ canvasElement }) => {
    const { web, native } = pair(canvasElement);
    // BOTH panes, which is the whole point of the fix — the native assertion
    // is the one that could not have been written before 0.9.1.
    await expect(web.getByRole('group', { name: 'Text alignment' })).toBeInTheDocument();
    await expect(native.getByRole('group', { name: 'Text alignment' })).toBeInTheDocument();
  },
};

export const MultiSelect: Story = {
  render: () => (
    <LeafPair
      note="Multi-select, and the same symmetric labelling as SingleSelect — `aria-label` on both Roots."
      web={
        <ToggleGroupWeb.Root multiple defaultValue={['bold', 'italic']} aria-label="Text style">
          <ToggleWeb value="bold">Bold</ToggleWeb>
          <ToggleWeb value="italic">Italic</ToggleWeb>
          <ToggleWeb value="underline">Underline</ToggleWeb>
        </ToggleGroupWeb.Root>
      }
      native={
        <ToggleGroupNative.Root multiple defaultValue={['bold', 'italic']} aria-label="Text style">
          <ToggleNative value="bold">Bold</ToggleNative>
          <ToggleNative value="italic">Italic</ToggleNative>
          <ToggleNative value="underline">Underline</ToggleNative>
        </ToggleGroupNative.Root>
      }
    />
  ),
};
