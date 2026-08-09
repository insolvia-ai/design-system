import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Calendar } from './calendar';

// A pinned "today", so this file renders the same month every run — the reason
// `today` is a prop rather than a `new Date()` call inside the component.
const TODAY = '2026-03-11';

describe('Calendar', () => {
  it('opens on the month of the pinned today and names it', () => {
    render(<Calendar today={TODAY} />);

    expect(screen.getByText('March 2026')).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: 'March 2026' })).toBeInTheDocument();
  });

  it('always renders six weeks of cells', () => {
    render(<Calendar today={TODAY} />);

    expect(screen.getAllByRole('gridcell')).toHaveLength(42);
  });

  it('selects a date on click and reports it', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Calendar today={TODAY} onValueChange={onValueChange} />);

    await user.click(screen.getByRole('button', { name: '17 March 2026' }));

    expect(onValueChange).toHaveBeenCalledWith('2026-03-17');
  });

  it('pages between months, clamping the day rather than rolling over', async () => {
    const user = userEvent.setup();
    render(<Calendar today="2026-01-31" />);

    await user.click(screen.getByRole('button', { name: 'Next month' }));

    expect(screen.getByText('February 2026')).toBeInTheDocument();
  });

  it('keeps exactly one cell in the tab order', () => {
    // The roving tabindex: tabbing through 42 buttons to reach the 15th is the
    // failure the APG grid pattern exists to prevent.
    render(<Calendar today={TODAY} />);

    const tabbable = screen
      .getAllByRole('button')
      .filter((button) => button.getAttribute('tabindex') === '0');
    expect(tabbable).toHaveLength(1);
  });

  it('walks the grid with the arrow keys and selects with Enter', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Calendar today={TODAY} defaultValue="2026-03-11" onValueChange={onValueChange} />);

    // Focus the roving cell, then move a week down and a day right.
    screen.getByRole('button', { name: '11 March 2026' }).focus();
    await user.keyboard('{ArrowDown}{ArrowRight}{Enter}');

    expect(onValueChange).toHaveBeenCalledWith('2026-03-19');
  });

  it('marks the selected cell', async () => {
    const user = userEvent.setup();
    render(<Calendar today={TODAY} />);

    await user.click(screen.getByRole('button', { name: '17 March 2026' }));

    const cell = screen.getByRole('button', { name: '17 March 2026' }).closest('[role="gridcell"]');
    expect(cell).toHaveAttribute('aria-selected', 'true');
  });

  it('refuses a date outside [min, max]', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Calendar today={TODAY} min="2026-03-10" max="2026-03-20" onValueChange={onValueChange} />,
    );

    const outside = screen.getByRole('button', { name: '5 March 2026' });
    expect(outside).toHaveAttribute('aria-disabled', 'true');

    await user.click(outside);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('marks today', () => {
    render(<Calendar today={TODAY} />);

    expect(screen.getByRole('button', { name: '11 March 2026' })).toHaveAttribute(
      'aria-current',
      'date',
    );
  });
});
