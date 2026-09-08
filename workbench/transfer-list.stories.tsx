import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';

import { TransferList as TransferListWeb } from '@design-system/transfer-list/transfer-list.web.tsx';
import { TransferList as TransferListNative } from '@design-system/transfer-list/transfer-list.native.tsx';
import type {
  TransferListOption,
  TransferListOrientation,
} from '@design-system/transfer-list/transfer-list.props.ts';

import { LeafPair, pair } from './leaf-pair.tsx';

const OPTIONS = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
  { value: 'c', label: 'Option C' },
  { value: 'd', label: 'Option D' },
  { value: 'e', label: 'Option E' },
  { value: 'f', label: 'Option F', disabled: true },
] as const satisfies readonly TransferListOption[];

const ORIENTATIONS = [
  'horizontal',
  'vertical',
] as const satisfies readonly TransferListOrientation[];

/**
 * Args live on the shared surface (`transfer-list.props.ts`); both leaves take
 * the same prop names, so — unlike Button — no bridging handler name is
 * needed. `defaultValue` gets no control: it seeds UNCONTROLLED state, and
 * twiddling it after mount would change nothing.
 */
type TransferListArgs = {
  options: readonly TransferListOption[];
  defaultValue: string[];
  showMoveAll: boolean;
  disabled: boolean;
  orientation: TransferListOrientation;
  onValueChange: (next: string[]) => void;
};

/**
 * Two lists and four buttons to move checked items between them — the pattern
 * Material UI's docs call a "Transfer List". `transfer-list.props.ts` owns the
 * whole model: `value` names what's in the RIGHT ("chosen") list, and every
 * move is one of two pure functions (`moveChecked`, `moveAll`) applied to it.
 *
 * Option F is disabled in every story below: watch it stay in Available
 * however the other five move, including through "move all".
 */
const meta = {
  title: 'Forms/TransferList',
  component: TransferListWeb,
  parameters: { layout: 'fullscreen' },
  args: {
    options: OPTIONS,
    defaultValue: ['b'],
    showMoveAll: true,
    disabled: false,
    orientation: 'horizontal',
    onValueChange: fn(),
  },
  argTypes: {
    defaultValue: { control: false },
    showMoveAll: { control: 'boolean' },
    disabled: { control: 'boolean' },
    orientation: { control: 'inline-radio', options: [...ORIENTATIONS] },
  },
  render: (args) => (
    <LeafPair
      web={
        <TransferListWeb
          options={args.options}
          defaultValue={args.defaultValue}
          showMoveAll={args.showMoveAll}
          disabled={args.disabled}
          orientation={args.orientation}
          onValueChange={args.onValueChange}
        />
      }
      native={
        <TransferListNative
          options={args.options}
          defaultValue={args.defaultValue}
          showMoveAll={args.showMoveAll}
          disabled={args.disabled}
          orientation={args.orientation}
          onValueChange={args.onValueChange}
        />
      }
    />
  ),
} satisfies Meta<TransferListArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Checking "Option A" and clicking `›` moves exactly that item, appended after
 * whatever was already chosen — `moveChecked` in transfer-list.props.test.ts
 * pins the ordering rule this asserts through each leaf's own wiring of it.
 */
export const Basic: Story = {
  play: async ({ canvasElement, args, step }) => {
    const { web, native } = pair(canvasElement);

    await step('web leaf: check Option A, move it right', async () => {
      await userEvent.click(web.getByRole('checkbox', { name: 'Option A' }));
      await userEvent.click(web.getByRole('button', { name: 'Move selected right' }));
      await expect(args.onValueChange).toHaveBeenCalledTimes(1);
      await expect(args.onValueChange).toHaveBeenLastCalledWith(['b', 'a']);
      await waitFor(() =>
        expect(
          within(web.getByRole('group', { name: /Chosen/ })).getByText('Option A'),
        ).toBeInTheDocument(),
      );
    });

    await step('native leaf: same interaction, same result', async () => {
      await userEvent.click(native.getByRole('checkbox', { name: 'Option A' }));
      await userEvent.click(native.getByRole('button', { name: 'Move selected right' }));
      // The two panes share one `onValueChange` — call COUNT, not just the
      // last call, so a pane that silently drops the click would otherwise be
      // vouched for by the other pane's earlier call.
      await expect(args.onValueChange).toHaveBeenCalledTimes(2);
      await expect(args.onValueChange).toHaveBeenLastCalledWith(['b', 'a']);
      await waitFor(() =>
        expect(
          within(native.getByRole('group', { name: /Chosen/ })).getByText('Option A'),
        ).toBeInTheDocument(),
      );
    });
  },
};

/** Vertical stacks the two lists with the buttons in a row between them — the
 * layout a phone-width column needs. */
export const Vertical: Story = {
  args: { orientation: 'vertical' },
};

/**
 * The whole control disabled: every checkbox and every button, asserted
 * rather than clicked — the web checkboxes are real `disabled` inputs, the
 * native ones can only speak ARIA through react-native-web.
 */
export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const { web, native } = pair(canvasElement);

    await expect(web.getByRole('checkbox', { name: 'Option A' })).toBeDisabled();
    await expect(web.getByRole('button', { name: 'Move selected right' })).toBeDisabled();
    await expect(native.getByRole('checkbox', { name: 'Option A' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await expect(native.getByRole('button', { name: 'Move selected right' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  },
};

/** No `»`/`«` pair — only "move selected" stays, for a caller that wants the
 * bulk actions off entirely. */
export const NoMoveAll: Story = {
  name: 'No move-all',
  args: { showMoveAll: false },
};

/** Everything already chosen: the Available column is empty and its `»`/`›`
 * buttons stay disabled — there is nothing left to move right. */
export const Empty: Story = {
  args: { defaultValue: OPTIONS.map((option) => option.value) },
};
