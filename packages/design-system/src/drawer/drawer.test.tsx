import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Drawer } from './drawer';

function Example({
  side,
  container,
}: {
  side?: 'left' | 'right' | 'top' | 'bottom';
  container?: HTMLElement;
}) {
  return (
    <Drawer.Root {...(side ? { side } : {})} {...(container ? { container } : {})}>
      <Drawer.Trigger>Open filters</Drawer.Trigger>
      <Drawer.Backdrop />
      <Drawer.Panel data-testid="panel">
        <Drawer.Title>Filters</Drawer.Title>
        <Drawer.Description>Narrow the fleet list.</Drawer.Description>
        <Drawer.Close>Done</Drawer.Close>
      </Drawer.Panel>
    </Drawer.Root>
  );
}

describe('Drawer', () => {
  it('opens a modal dialog named by its title and described by its description', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole('button', { name: 'Open filters' }));

    const panel = screen.getByRole('dialog');
    expect(panel).toHaveAttribute('aria-modal', 'true');
    expect(panel).toHaveAccessibleName('Filters');
    expect(panel).toHaveAccessibleDescription('Narrow the fleet list.');
  });

  it('enters from the requested edge', async () => {
    const user = userEvent.setup();
    render(<Example side="left" />);

    await user.click(screen.getByRole('button', { name: 'Open filters' }));

    const panel = screen.getByTestId('panel');
    expect(panel).toHaveClass('left-0');
    expect(panel).toHaveClass('inset-y-0');
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole('button', { name: 'Open filters' }));
    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closes on a backdrop click', async () => {
    const user = userEvent.setup();
    const { container } = render(<Example />);

    await user.click(screen.getByRole('button', { name: 'Open filters' }));
    const backdrop = document.querySelector('[data-drawer-backdrop]');
    expect(backdrop).not.toBeNull();
    await user.click(backdrop as Element);

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(container).toBeTruthy();
  });

  it('returns focus to the opener when it closes', async () => {
    const user = userEvent.setup();
    render(<Example />);

    const trigger = screen.getByRole('button', { name: 'Open filters' });
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Done' }));

    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('portals the backdrop and panel into document.body by default', async () => {
    const user = userEvent.setup();
    render(<Example />);
    await user.click(screen.getByRole('button', { name: 'Open filters' }));

    expect(screen.getByRole('dialog').parentElement).toBe(document.body);
    expect(document.querySelector('[data-drawer-backdrop]')?.parentElement).toBe(document.body);
  });

  // Only a fullscreen element's descendants are painted, so a panel portaled
  // to the body during fullscreen is invisible; `container` re-aims it.
  it('portals both parts into a custom container, with focus and lock intact', async () => {
    const user = userEvent.setup();
    const stage = document.createElement('div');
    document.body.appendChild(stage);

    render(<Example container={stage} />);
    const trigger = screen.getByRole('button', { name: 'Open filters' });
    await user.click(trigger);

    const panel = screen.getByRole('dialog');
    expect(panel.parentElement).toBe(stage);
    expect(stage.querySelector('[data-drawer-backdrop]')).not.toBeNull();

    // The focus trap works on the PANEL, not the portal target.
    expect(screen.getByRole('button', { name: 'Done' })).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());

    stage.remove();
  });

  it('locks body scroll while open and restores it after', async () => {
    const user = userEvent.setup();
    render(<Example />);

    await user.click(screen.getByRole('button', { name: 'Open filters' }));
    expect(document.body.style.overflow).toBe('hidden');

    await user.keyboard('{Escape}');
    await waitFor(() => expect(document.body.style.overflow).not.toBe('hidden'));
  });
});
