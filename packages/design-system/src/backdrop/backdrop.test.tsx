import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Backdrop } from './backdrop';

describe('Backdrop', () => {
  it('renders nothing while closed', () => {
    render(<Backdrop open={false}>Loading…</Backdrop>);

    expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
    expect(document.querySelector('[data-state="open"]')).toBeNull();
  });

  it('renders the scrim with its children while open', () => {
    render(<Backdrop open>Loading…</Backdrop>);

    const scrim = document.querySelector('[data-state="open"]');
    expect(scrim).not.toBeNull();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('portals into document.body', () => {
    render(<Backdrop open>Loading…</Backdrop>);

    expect(document.querySelector('[data-state="open"]')?.parentElement).toBe(document.body);
  });

  it('calls onDismiss when the scrim is clicked, but not when its content is', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <Backdrop open onDismiss={onDismiss}>
        Loading…
      </Backdrop>,
    );

    await user.click(screen.getByText('Loading…'));
    expect(onDismiss).not.toHaveBeenCalled();

    const scrim = document.querySelector('[data-state="open"]') as HTMLElement;
    await user.click(scrim);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the scrim is clicked and onDismiss is omitted', async () => {
    const user = userEvent.setup();
    render(<Backdrop open>Loading…</Backdrop>);

    const scrim = document.querySelector('[data-state="open"]') as HTMLElement;
    await user.click(scrim);

    // Nothing to assert on directly — the point is that clicking does not
    // throw and the scrim stays exactly as it was (Backdrop is controlled by
    // `open` alone; there is nothing here to close itself).
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('exposes a visually-hidden Dismiss button for keyboard users when dismissible', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<Backdrop open onDismiss={onDismiss} />);

    const dismiss = screen.getByRole('button', { name: 'Dismiss' });
    expect(dismiss).toHaveClass('sr-only');

    await user.click(dismiss);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders no Dismiss button when onDismiss is omitted', () => {
    render(<Backdrop open />);

    expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument();
  });

  it('calls onDismiss on Escape while open', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <Backdrop open onDismiss={onDismiss}>
        Loading…
      </Backdrop>,
    );

    await user.keyboard('{Escape}');

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not call onDismiss on Escape once closed', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    const { rerender } = render(
      <Backdrop open onDismiss={onDismiss}>
        Loading…
      </Backdrop>,
    );
    rerender(
      <Backdrop open={false} onDismiss={onDismiss}>
        Loading…
      </Backdrop>,
    );

    await user.keyboard('{Escape}');

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('paints a transparent scrim when invisible, and the scrim colour otherwise', () => {
    const { rerender } = render(<Backdrop open>Loading…</Backdrop>);
    let scrim = document.querySelector('[data-state="open"]') as HTMLElement;
    expect(scrim).toHaveClass('bg-overlay-scrim');
    expect(scrim).not.toHaveClass('bg-transparent');

    rerender(
      <Backdrop open invisible>
        Loading…
      </Backdrop>,
    );
    scrim = document.querySelector('[data-state="open"]') as HTMLElement;
    expect(scrim).toHaveClass('bg-transparent');
    expect(scrim).not.toHaveClass('bg-overlay-scrim');
  });

  it('locks body scroll while open and restores it on close', () => {
    const { rerender } = render(<Backdrop open={false}>Loading…</Backdrop>);
    expect(document.body.style.overflow).toBe('');

    rerender(<Backdrop open>Loading…</Backdrop>);
    expect(document.body.style.overflow).toBe('hidden');

    rerender(<Backdrop open={false}>Loading…</Backdrop>);
    expect(document.body.style.overflow).toBe('');
  });
});
