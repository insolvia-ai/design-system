import { render, screen, waitFor } from '@testing-library/react';
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

function HoverExample() {
  return (
    <div>
      <Popover.Root openOnHover>
        <Popover.Trigger>Jump drive</Popover.Trigger>
        <Popover.Content label="About the jump drive">
          <p>Charges for 30 seconds before engaging.</p>
          <Popover.Close>Got it</Popover.Close>
        </Popover.Content>
      </Popover.Root>
      <button type="button">Outside</button>
    </div>
  );
}

describe('Popover with openOnHover', () => {
  it('opens on hover and closes once the pointer has left trigger and surface', async () => {
    const user = userEvent.setup();
    render(<HoverExample />);

    await user.hover(screen.getByRole('button', { name: 'Jump drive' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.unhover(screen.getByRole('button', { name: 'Jump drive' }));
    // Not at once: the pointer gets a moment to cross into the surface.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('is hoverable: moving into the surface keeps it open', async () => {
    const user = userEvent.setup();
    render(<HoverExample />);

    await user.hover(screen.getByRole('button', { name: 'Jump drive' }));
    await user.hover(screen.getByRole('dialog'));
    // Longer than the close delay, and it is still here.
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('opens on focus, so the keyboard reaches it, and closes when focus leaves', async () => {
    const user = userEvent.setup();
    render(<HoverExample />);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Jump drive' })).toHaveFocus();
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Into the surface is not "leaving".
    await user.tab();
    expect(screen.getByRole('button', { name: 'Got it' })).toHaveFocus();
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Outside' })).toHaveFocus();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('a press opens it and does not close it', async () => {
    const user = userEvent.setup();
    render(<HoverExample />);

    // A tap arrives as hover-then-click; the click must not undo the hover.
    await user.click(screen.getByRole('button', { name: 'Jump drive' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Jump drive' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('still closes on Escape', async () => {
    const user = userEvent.setup();
    render(<HoverExample />);

    await user.tab();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
