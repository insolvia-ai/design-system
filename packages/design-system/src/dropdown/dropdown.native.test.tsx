// NATIVE-leaf tests — see card.native.test.tsx for what the `native` vitest
// project resolves.
//
// The keyboard walk has no counterpart here and is not tested for that reason
// (dropdown.props.ts says why the grammar is not shared). What IS pinned is
// the press path and the roles, which are the whole of what a touch user and a
// screen reader get.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Dropdown } from './dropdown';

function Example({ onRename = () => {} }: { onRename?: () => void }) {
  return (
    <Dropdown.Root>
      <Dropdown.Trigger>Actions</Dropdown.Trigger>
      <Dropdown.Content>
        <Dropdown.Label>Ship</Dropdown.Label>
        <Dropdown.Item onSelect={onRename}>Rename</Dropdown.Item>
        <Dropdown.Divider />
        <Dropdown.Item disabled>Scuttle</Dropdown.Item>
      </Dropdown.Content>
    </Dropdown.Root>
  );
}

describe('Dropdown (native leaf)', () => {
  it('opens from the trigger as a labelled menu', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole('button', { name: 'Actions' }));

    expect(screen.getByRole('menu')).toHaveAccessibleName('Actions');
  });

  it('runs onSelect and closes when an item is pressed', async () => {
    const onRename = vi.fn();
    const user = userEvent.setup();
    render(<Example onRename={onRename} />);

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'Rename' }));

    expect(onRename).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('keeps a disabled item inert', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    const scuttle = screen.getByRole('menuitem', { name: 'Scuttle' });

    // ASSERTED, not clicked. react-native-web can only speak ARIA, never the
    // real disabled attribute — and it renders a disabled Pressable with
    // `pointer-events: none`, so user-event refuses to click it at all. The
    // state is the contract here; the click would only be testing
    // react-native-web.
    expect(scuttle).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('closes by pressing the trigger again — the native dismissal', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(screen.getByRole('button', { name: 'Actions' }));

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
