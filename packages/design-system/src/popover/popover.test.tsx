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

  // Popover takes NO `container` prop, because it takes no portal: the surface
  // is absolutely positioned inside the Root's relative box, which is what
  // anchors it to its trigger. These two pin that, and with it the reason
  // Popover is immune to the fullscreen problem Dialog.Root's `container`
  // solves — it is already wherever its trigger is.
  it('renders its surface inline under the Root, never portaled to the body', async () => {
    const user = userEvent.setup();
    render(<Example />);

    const trigger = screen.getByRole('button', { name: 'Filters' });
    await user.click(trigger);

    const surface = screen.getByRole('dialog');
    expect(surface.parentElement).toBe(trigger.parentElement);
    expect(surface.parentElement).not.toBe(document.body);
  });

  it('follows its trigger into an arbitrary container, with nothing to configure', async () => {
    const user = userEvent.setup();
    const stage = document.createElement('div');
    document.body.appendChild(stage);

    render(<Example />, { container: stage });
    await user.click(screen.getByRole('button', { name: 'Filters' }));

    expect(stage.contains(screen.getByRole('dialog'))).toBe(true);

    stage.remove();
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
