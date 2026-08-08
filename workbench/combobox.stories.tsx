import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent, waitFor } from 'storybook/test';

import { Combobox as ComboboxWeb } from '@design-system/combobox/combobox.web.tsx';
import { Combobox as ComboboxNative } from '@design-system/combobox/combobox.native.tsx';
import type { ComboboxOption } from '@design-system/combobox/combobox.props.ts';

import { LeafPair, pair } from './leaf-pair.tsx';

const MOONS = [
  { value: 'io', label: 'Io' },
  { value: 'europa', label: 'Europa' },
  { value: 'ganymede', label: 'Ganymede' },
  { value: 'callisto', label: 'Callisto', disabled: true },
] as const satisfies readonly ComboboxOption[];

type ComboboxArgs = {
  label: string;
  placeholder: string;
  emptyMessage: string;
  disabled: boolean;
  invalid: boolean;
  onValueChange: (next: string) => void;
};

/**
 * A Select you can type into — the APG combobox-with-list-autocomplete
 * pattern.
 *
 * It shares Select's option model and id scheme (`combobox.props.ts` imports
 * them from `select.props.ts`), which is what lets a consumer hand the same
 * `SelectOption[]` to either component. What differs is what typing MEANS: a
 * Select typeaheads — the list never changes and keystrokes jump the highlight
 * — while this filters, so every key a Select spends on navigation (Home, End,
 * Space, printable characters) has to go to the text caret instead.
 *
 * The other deliberate difference is Tab. A Select commits the highlight on
 * the way out, matching a native `<select>`. This does not: a combobox also
 * holds typed text, and silently replacing what someone typed as they tab away
 * is how a form ends up submitting a value nobody chose.
 *
 * The native pane is the one to watch. Its list is a `role="listbox"` View
 * that RN's own `Role` union does not admit exists, positioned absolutely
 * under the input, and it cancels its own mousedown — without that, the
 * input's blur fires before the option's press and the list unmounts between
 * pointerdown and pointerup, so nothing is ever selectable.
 */
const meta = {
  title: 'Forms/Combobox',
  // No meta `component`. It only feeds the docs props table, and it has to be
  // assignable to `ComponentType<ComboboxArgs>` — which this is not, because
  // `options` is a required prop that the args deliberately do not carry (the
  // option list is fixed by the story, not edited in Controls). Select's story
  // omits it for the same reason.
  parameters: { layout: 'fullscreen' },
  args: {
    label: 'Moon',
    placeholder: 'Search moons',
    emptyMessage: 'No matches',
    disabled: false,
    invalid: false,
    onValueChange: fn(),
  },
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    emptyMessage: { control: 'text' },
    disabled: { control: 'boolean' },
    invalid: { control: 'boolean' },
    onValueChange: { control: false },
  },
  render: (args) => (
    <LeafPair
      minPaneWidth={360}
      web={
        <ComboboxWeb
          aria-label={args.label}
          options={MOONS}
          placeholder={args.placeholder}
          emptyMessage={args.emptyMessage}
          disabled={args.disabled}
          invalid={args.invalid}
          onValueChange={args.onValueChange}
        />
      }
      native={
        <ComboboxNative
          aria-label={args.label}
          options={MOONS}
          placeholder={args.placeholder}
          emptyMessage={args.emptyMessage}
          disabled={args.disabled}
          invalid={args.invalid}
          onValueChange={args.onValueChange}
        />
      }
    />
  ),
} satisfies Meta<ComboboxArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Typing filters, clicking commits, and the box ends OPEN in both panes —
 * axe runs after the play, so an open listbox is the only way the popup ever
 * gets audited.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: typing filters to the matching option', async () => {
      const control = web.getByRole('combobox', { name: args.label });
      await userEvent.type(control, 'rop');
      await waitFor(() => expect(web.getAllByRole('option')).toHaveLength(1));
      await userEvent.click(web.getByRole('option', { name: 'Europa' }));
      await expect(args.onValueChange).toHaveBeenCalledTimes(1);
      await expect(args.onValueChange).toHaveBeenLastCalledWith('europa');
      await expect(control).toHaveValue('Europa');
    });

    await step('native leaf: same filter, same commit', async () => {
      const control = native.getByRole('combobox', { name: args.label });
      await userEvent.type(control, 'gany');
      await waitFor(() => expect(native.getAllByRole('option')).toHaveLength(1));
      await userEvent.click(native.getByRole('option', { name: 'Ganymede' }));
      await expect(args.onValueChange).toHaveBeenCalledTimes(2);
      await expect(args.onValueChange).toHaveBeenLastCalledWith('ganymede');
      await expect(control).toHaveValue('Ganymede');
    });

    await step('re-opening a committed combobox shows the whole list again', async () => {
      // Otherwise the box would show only the option already chosen, and the
      // rest would be unreachable without deleting the text first.
      const control = web.getByRole('combobox', { name: args.label });
      control.focus();
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(web.getAllByRole('option')).toHaveLength(4));
    });
  },
};

/**
 * With a value already committed. Open it and the full list is there — the
 * `filterOptions` special case that makes a committed combobox re-browsable.
 */
export const Committed: Story = {
  render: (args) => (
    <LeafPair
      minPaneWidth={360}
      web={
        <ComboboxWeb
          aria-label={args.label}
          options={MOONS}
          defaultValue="ganymede"
          onValueChange={args.onValueChange}
        />
      }
      native={
        <ComboboxNative
          aria-label={args.label}
          options={MOONS}
          defaultValue="ganymede"
          onValueChange={args.onValueChange}
        />
      }
    />
  ),
};

/**
 * No match. Both leaves show a polite live region rather than an empty
 * listbox: an option-less listbox fails `aria-required-children`, and there
 * would be nothing to navigate anyway. `aria-expanded` stays false, because
 * there is genuinely nothing to expand into.
 */
export const NoMatches: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf', async () => {
      await userEvent.type(web.getByRole('combobox', { name: args.label }), 'titan');
      await waitFor(() => expect(web.getByRole('status')).toHaveTextContent(args.emptyMessage));
      await expect(web.queryByRole('listbox')).toBeNull();
    });

    await step('native leaf', async () => {
      await userEvent.type(native.getByRole('combobox', { name: args.label }), 'titan');
      await waitFor(() => expect(native.getByRole('status')).toHaveTextContent(args.emptyMessage));
      await expect(native.queryByRole('listbox')).toBeNull();
    });
  },
};
