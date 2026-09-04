import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Chip } from './chip';
import { chipClass } from './chip.props';

describe('Chip', () => {
  it('renders its label and fires onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<Chip onClick={onClick}>Drafts</Chip>);

    await user.click(screen.getByRole('button', { name: 'Drafts' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  // Same rule as IconButton's `pressed`: `aria-pressed="false"` on a control
  // that never toggles announces a toggle that does not exist.
  it('renders no aria-pressed at all when `pressed` is omitted', () => {
    render(<Chip>Drafts</Chip>);

    expect(screen.getByRole('button', { name: 'Drafts' })).not.toHaveAttribute('aria-pressed');
  });

  it('reports the pressed state when it is given', () => {
    render(
      <>
        <Chip pressed={false}>Drafts</Chip>
        <Chip pressed>Published</Chip>
      </>,
    );

    expect(screen.getByRole('button', { name: 'Drafts' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Published' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  // The reason both states carry a border and only its colour moves: a shape
  // that loses its outline when selected changes size by two pixels as you
  // press it, and a row of them reflows.
  it('keeps a border in both states, moving only its colour', () => {
    expect(chipClass()).toContain('border');
    expect(chipClass()).toContain('border-line');
    expect(chipClass({ pressed: true })).toContain('border');
    expect(chipClass({ pressed: true })).toContain('border-primary');
  });

  it('fills from the theme when pressed, never a literal', () => {
    const pressed = chipClass({ pressed: true });
    expect(pressed).toContain('bg-primary');
    expect(pressed).toContain('text-primary-text');
    expect(pressed).toContain('rounded-md');
  });

  it('sits on the shared height scale, and gives sm a coarse-pointer target', () => {
    expect(chipClass({ size: 'sm' })).toContain('h-8');
    expect(chipClass({ size: 'md' })).toContain('h-11');
    expect(chipClass({ size: 'sm' })).toContain('pointer-coarse:after:size-11');
    expect(chipClass({ size: 'md' })).not.toContain('pointer-coarse:after:size-11');
  });

  // The case the helper exists for: a router link takes a FUNCTION className
  // and cannot be a <button>, so it needs the string rather than a component.
  it('is usable as a class string on a non-button element', () => {
    render(
      <a href="/runs" className={chipClass({ pressed: true })}>
        Runs
      </a>,
    );

    const link = screen.getByRole('link', { name: 'Runs' });
    expect(link).toHaveClass('border-primary');
    expect(link).toHaveClass('no-underline');
  });

  it('lets a caller override a class through the merge', () => {
    render(
      <Chip className="rounded-none" data-testid="chip">
        Drafts
      </Chip>,
    );

    const chip = screen.getByTestId('chip');
    expect(chip).toHaveClass('rounded-none');
    expect(chip.className).not.toContain('rounded-md');
  });
});
