import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Popover } from './popover';

function Example() {
  return (
    <div>
      <Popover.Root>
        <Popover.Trigger>Filters</Popover.Trigger>
        <Popover.Content>
          <Popover.Title>Filter the fleet</Popover.Title>
          <Popover.Close>Done</Popover.Close>
        </Popover.Content>
      </Popover.Root>
      <button type="button">Outside</button>
    </div>
  );
}

describe('Popover', () => {
  it('toggles from the trigger and reports its state', async () => {
    const user = userEvent.setup();
    render(<Example />);

    const trigger = screen.getByRole('button', { name: 'Filters' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await user.click(trigger);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is a NON-modal dialog: no aria-modal, and the page stays reachable', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole('button', { name: 'Filters' }));

    // Claiming aria-modal would tell a screen reader the rest of the page is
    // inert while every control behind it is demonstrably still clickable.
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-modal');
    expect(screen.getByRole('button', { name: 'Outside' })).toBeInTheDocument();
  });

  it('takes its accessible name from a Title when one is rendered', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole('button', { name: 'Filters' }));

    expect(screen.getByRole('dialog')).toHaveAccessibleName('Filter the fleet');
  });

  it('falls back to `label` when there is no Title', async () => {
    const user = userEvent.setup();
    render(
      <Popover.Root>
        <Popover.Trigger>Filters</Popover.Trigger>
        <Popover.Content label="Filters">Body only</Popover.Content>
      </Popover.Root>,
    );

    await user.click(screen.getByRole('button', { name: 'Filters' }));

    expect(screen.getByRole('dialog')).toHaveAccessibleName('Filters');
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole('button', { name: 'Filters' }));
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on a pointer press outside it', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole('button', { name: 'Filters' }));
    await user.click(screen.getByRole('button', { name: 'Outside' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('stays open when the press lands inside it', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole('button', { name: 'Filters' }));
    await user.click(screen.getByRole('heading', { name: 'Filter the fleet' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes from the Close part', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole('button', { name: 'Filters' }));
    await user.click(screen.getByRole('button', { name: 'Done' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
