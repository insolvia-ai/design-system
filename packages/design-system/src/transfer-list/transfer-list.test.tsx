import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TransferList } from './transfer-list';
import type { TransferListOption } from './transfer-list.props';

const SHIPS: TransferListOption[] = [
  { value: 'xwing', label: 'X-wing' },
  { value: 'freighter', label: 'YT-1300' },
  { value: 'destroyer', label: 'Star Destroyer' },
  { value: 'sailbarge', label: 'Sail barge', disabled: true },
];

describe('TransferList', () => {
  it('renders options split by value: left has what is not chosen, right has what is', () => {
    render(<TransferList options={SHIPS} defaultValue={['freighter']} />);

    const available = screen.getByRole('group', { name: /Available/ });
    const chosen = screen.getByRole('group', { name: /Chosen/ });

    expect(within(available).getByText('X-wing')).toBeInTheDocument();
    expect(within(available).getByText('Star Destroyer')).toBeInTheDocument();
    expect(within(available).getByText('Sail barge')).toBeInTheDocument();
    expect(within(available).queryByText('YT-1300')).not.toBeInTheDocument();

    expect(within(chosen).getByText('YT-1300')).toBeInTheDocument();
  });

  it('checking two on the left and clicking › moves exactly those, in options order, and fires onValueChange', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <TransferList options={SHIPS} defaultValue={['freighter']} onValueChange={onValueChange} />,
    );

    await user.click(screen.getByRole('checkbox', { name: 'X-wing' }));
    await user.click(screen.getByRole('checkbox', { name: 'Star Destroyer' }));
    await user.click(screen.getByRole('button', { name: 'Move selected right' }));

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(['freighter', 'xwing', 'destroyer']);
  });

  it('» moves every enabled option, leaving a disabled one behind', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TransferList options={SHIPS} onValueChange={onValueChange} />);

    await user.click(screen.getByRole('button', { name: 'Move all right' }));

    expect(onValueChange).toHaveBeenCalledWith(['xwing', 'freighter', 'destroyer']);
    // The disabled option never left the Available column.
    const available = screen.getByRole('group', { name: /Available/ });
    expect(within(available).getByText('Sail barge')).toBeInTheDocument();
  });

  it('‹ moves a checked chosen item back to available', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <TransferList
        options={SHIPS}
        defaultValue={['xwing', 'freighter']}
        onValueChange={onValueChange}
      />,
    );

    await user.click(screen.getByRole('checkbox', { name: 'YT-1300' }));
    await user.click(screen.getByRole('button', { name: 'Move selected left' }));

    expect(onValueChange).toHaveBeenCalledWith(['xwing']);
  });

  it('a disabled option is never checkable and never moves', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TransferList options={SHIPS} onValueChange={onValueChange} />);

    const barge = screen.getByRole('checkbox', { name: 'Sail barge' });
    expect(barge).toBeDisabled();

    await user.click(barge);
    expect(barge).not.toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Move all right' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['xwing', 'freighter', 'destroyer']);
  });

  it('the move-selected buttons are disabled until something is checked', async () => {
    const user = userEvent.setup();
    render(<TransferList options={SHIPS} defaultValue={['freighter']} />);

    expect(screen.getByRole('button', { name: 'Move selected right' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move selected left' })).toBeDisabled();

    await user.click(screen.getByRole('checkbox', { name: 'X-wing' }));
    expect(screen.getByRole('button', { name: 'Move selected right' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Move selected left' })).toBeDisabled();
  });

  it('the move-all buttons are disabled when their source has nothing movable', () => {
    render(<TransferList options={SHIPS} defaultValue={['xwing', 'freighter', 'destroyer']} />);

    // Available now holds only the disabled option.
    expect(screen.getByRole('button', { name: 'Move all right' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move all left' })).toBeEnabled();
  });

  it('hides the move-all pair when showMoveAll is false', () => {
    render(<TransferList options={SHIPS} showMoveAll={false} />);

    expect(screen.queryByRole('button', { name: 'Move all right' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Move all left' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move selected right' })).toBeInTheDocument();
  });

  it('fieldset legends carry the label and a "checked / total" count', async () => {
    const user = userEvent.setup();
    render(
      <TransferList
        options={SHIPS}
        defaultValue={['freighter']}
        labels={{ available: 'Candidates', chosen: 'Picked' }}
      />,
    );

    expect(screen.getByText('Candidates (0 selected / 3)')).toBeInTheDocument();
    expect(screen.getByText('Picked (0 selected / 1)')).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'X-wing' }));
    expect(screen.getByText('Candidates (1 selected / 3)')).toBeInTheDocument();
  });
});
