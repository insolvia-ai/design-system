import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { IconButton } from './icon-button';

// A stand-in for the caller's icon. `aria-hidden` is what a real icon would
// carry too: the button's name comes from `label`, and a glyph that also
// announced itself would double it.
const Glyph = () => <span aria-hidden="true">×</span>;

describe('IconButton', () => {
  it('takes its accessible name from label and fires onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <IconButton label="Dismiss" onClick={onClick}>
        <Glyph />
      </IconButton>,
    );

    // The whole point of the component: the name is in the tree even though
    // nothing renders the word.
    const button = screen.getByRole('button', { name: 'Dismiss' });
    expect(button).toHaveAttribute('title', 'Dismiss');
    expect(button).not.toHaveTextContent('Dismiss');

    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders no aria-pressed at all when pressed is not given', () => {
    render(
      <IconButton label="Dismiss">
        <Glyph />
      </IconButton>,
    );

    // Not `aria-pressed="false"` — that announces a toggle on a button that
    // never toggles. See IconButtonOwnProps.pressed.
    expect(screen.getByRole('button', { name: 'Dismiss' })).not.toHaveAttribute('aria-pressed');
  });

  it('wires aria-pressed and the pressed fill when pressed is given', () => {
    const { rerender } = render(
      <IconButton label="Mute" pressed={false}>
        <Glyph />
      </IconButton>,
    );

    const button = screen.getByRole('button', { name: 'Mute' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).not.toHaveClass('bg-line');

    rerender(
      <IconButton label="Mute" pressed>
        <Glyph />
      </IconButton>,
    );
    expect(button).toHaveAttribute('aria-pressed', 'true');
    // The ghost default fills with `line` when held — twMerge must have
    // dropped the base `bg-transparent` rather than keeping both.
    expect(button).toHaveClass('bg-line');
    expect(button).not.toHaveClass('bg-transparent');
  });

  it('does not fire onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <IconButton label="Dismiss" disabled onClick={onClick}>
        <Glyph />
      </IconButton>,
    );

    const button = screen.getByRole('button', { name: 'Dismiss' });
    expect(button).toBeDisabled();

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies the danger intent and the square size classes', () => {
    render(
      <IconButton label="Delete" intent="danger" size="sm">
        <Glyph />
      </IconButton>,
    );

    const button = screen.getByRole('button', { name: 'Delete' });
    expect(button).toHaveClass('bg-danger');
    // `danger-text`, not `primary-text`: the two hold identical values, so no
    // pixel moves, but a brand overriding its primary foreground no longer
    // silently moves the glyph on its danger fill. tokens 0.4.0 measured it.
    expect(button).toHaveClass('text-danger-text');
    // Square: the same box on both axes, on Button's own height scale.
    expect(button).toHaveClass('h-8');
    expect(button).toHaveClass('w-8');
  });

  it('defaults to a ghost square that only fills on hover', () => {
    render(
      <IconButton label="Expand">
        <Glyph />
      </IconButton>,
    );

    const button = screen.getByRole('button', { name: 'Expand' });
    expect(button).toHaveClass('bg-transparent');
    expect(button).toHaveClass('hover:bg-surface-alt');
    expect(button).toHaveClass('h-11');
    expect(button).toHaveClass('w-11');
  });
});
