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

function Nested({ onSelect = () => {} }: { onSelect?: (item: string) => void }) {
  return (
    <Dropdown.Root>
      <Dropdown.Trigger>Actions</Dropdown.Trigger>
      <Dropdown.Content>
        <Dropdown.Item onSelect={() => onSelect('Rename')}>Rename</Dropdown.Item>
        <Dropdown.Sub>
          <Dropdown.SubTrigger>Move to</Dropdown.SubTrigger>
          <Dropdown.SubContent>
            <Dropdown.Item onSelect={() => onSelect('Drydock')}>Drydock</Dropdown.Item>
            <Dropdown.Item onSelect={() => onSelect('Orbit')}>Orbit</Dropdown.Item>
          </Dropdown.SubContent>
        </Dropdown.Sub>
        <Dropdown.Item onSelect={() => onSelect('Duplicate')}>Duplicate</Dropdown.Item>
      </Dropdown.Content>
    </Dropdown.Root>
  );
}

async function openToSubTrigger(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Actions' }));
  await user.keyboard('{ArrowDown}');
  const subTrigger = screen.getByRole('menuitem', { name: 'Move to' });
  expect(subTrigger).toHaveFocus();
  return subTrigger;
}

describe('Dropdown sub-menus', () => {
  it('marks the sub trigger as a menu item that opens a menu', async () => {
    const user = userEvent.setup();
    render(<Nested />);

    const subTrigger = await openToSubTrigger(user);

    expect(subTrigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(subTrigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getAllByRole('menu')).toHaveLength(1);
  });

  it('opens on ArrowRight, focuses the first row, and labels the flyout', async () => {
    const user = userEvent.setup();
    render(<Nested />);

    const subTrigger = await openToSubTrigger(user);
    await user.keyboard('{ArrowRight}');

    expect(subTrigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu', { name: 'Move to' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Drydock' })).toHaveFocus();
  });

  it('walks the flyout on its own, and the parent on its own', async () => {
    const user = userEvent.setup();
    render(<Nested />);

    await openToSubTrigger(user);
    await user.keyboard('{ArrowRight}{ArrowDown}{ArrowDown}');
    // Clamped inside the flyout: never falls through to 'Duplicate' below.
    expect(screen.getByRole('menuitem', { name: 'Orbit' })).toHaveFocus();

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('menuitem', { name: 'Move to' })).toHaveFocus();
    expect(screen.queryByRole('menu', { name: 'Move to' })).not.toBeInTheDocument();

    // And the parent's End is the parent's last row, not the flyout's.
    await user.keyboard('{End}');
    expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toHaveFocus();
  });

  it('closes only the flyout on Escape, and the whole menu on a second', async () => {
    const user = userEvent.setup();
    render(<Nested />);

    await openToSubTrigger(user);
    await user.keyboard('{ArrowRight}{Escape}');

    expect(screen.getByRole('menu', { name: 'Actions' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Move to' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actions' })).toHaveFocus();
  });

  it('opens on hover without moving focus', async () => {
    const user = userEvent.setup();
    render(<Nested />);

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.hover(screen.getByRole('menuitem', { name: 'Move to' }));

    expect(screen.getByRole('menu', { name: 'Move to' })).toBeInTheDocument();
    // The pointer opened it; the keyboard is still where it was.
    expect(screen.getByRole('menuitem', { name: 'Rename' })).toHaveFocus();
  });

  it('choosing a row in the flyout closes the whole tree', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<Nested onSelect={onSelect} />);

    await openToSubTrigger(user);
    await user.keyboard('{ArrowRight}');
    await user.click(screen.getByRole('menuitem', { name: 'Orbit' }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenLastCalledWith('Orbit');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actions' })).toHaveFocus();
  });
});
