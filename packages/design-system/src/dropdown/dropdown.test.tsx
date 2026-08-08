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
        <Dropdown.Item>Duplicate</Dropdown.Item>
        <Dropdown.Divider />
        <Dropdown.Item disabled>Scuttle</Dropdown.Item>
      </Dropdown.Content>
    </Dropdown.Root>
  );
}

describe('Dropdown', () => {
  it('opens from the trigger and focuses the first item', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole('button', { name: 'Actions' }));

    expect(screen.getByRole('menu')).toBeInTheDocument();
    // APG: opening a menu puts focus IN it — opening without entering leaves a
    // keyboard user having to find the menu a second time.
    expect(screen.getByRole('menuitem', { name: 'Rename' })).toHaveFocus();
  });

  it('opens on ArrowDown from the trigger', async () => {
    const user = userEvent.setup();
    render(<Example />);

    screen.getByRole('button', { name: 'Actions' }).focus();
    await user.keyboard('{ArrowDown}');

    expect(screen.getByRole('menuitem', { name: 'Rename' })).toHaveFocus();
  });

  it('walks the items with the arrows and clamps at the ends', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole('button', { name: 'Actions' }));

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toHaveFocus();

    // Clamped, not wrapped — the same choice Select's `stepEnabled` makes.
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(screen.getByRole('menuitem', { name: 'Rename' })).toHaveFocus();
  });

  it('jumps with Home and End, skipping the disabled item', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.keyboard('{End}');

    // 'Scuttle' is aria-disabled, so the walk stops at 'Duplicate'.
    expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toHaveFocus();
  });

  it('runs onSelect and closes when an item is chosen', async () => {
    const onRename = vi.fn();
    const user = userEvent.setup();
    render(<Example onRename={onRename} />);

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'Rename' }));

    expect(onRename).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('keeps a disabled item discoverable but inert', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    const scuttle = screen.getByRole('menuitem', { name: 'Scuttle', hidden: true });

    expect(scuttle).toHaveAttribute('aria-disabled', 'true');

    await user.click(scuttle);
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('closes on Escape and hands focus back to the trigger', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    // Without the return leg, a keyboard user is dropped at the top of the
    // document every time a menu closes.
    expect(screen.getByRole('button', { name: 'Actions' })).toHaveFocus();
  });

  it('labels the menu with its trigger', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole('button', { name: 'Actions' }));

    expect(screen.getByRole('menu')).toHaveAccessibleName('Actions');
  });
});
