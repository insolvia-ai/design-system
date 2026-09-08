import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Pagination } from './pagination';

describe('Pagination', () => {
  it('renders 1…10 with an ellipsis around page 5', () => {
    render(<Pagination count={10} defaultPage={5} />);

    expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to page 4' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Page 5' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to page 6' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to page 10' })).toBeInTheDocument();
    // Pages 2, 3, 7, 8, 9 are hidden behind the two ellipses.
    expect(screen.queryByRole('button', { name: 'Go to page 2' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Go to page 8' })).not.toBeInTheDocument();
    // The real ellipsis character, once on each side of the sibling window —
    // not three dots, and not merely "some text that isn't a button".
    expect(screen.getAllByText('…')).toHaveLength(2);
  });

  it('clicking a page fires onPageChange with that page', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination count={10} defaultPage={5} onPageChange={onPageChange} />);

    await user.click(screen.getByRole('button', { name: 'Go to page 6' }));

    expect(onPageChange).toHaveBeenCalledTimes(1);
    expect(onPageChange).toHaveBeenCalledWith(6);
  });

  it('disables Previous (and First) on the first page, not Next', () => {
    render(<Pagination count={5} defaultPage={1} showFirstLast />);

    expect(screen.getByRole('button', { name: 'First page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Last page' })).toBeEnabled();
  });

  it('disables Next (and Last) on the last page, not Previous', () => {
    render(<Pagination count={5} defaultPage={5} showFirstLast />);

    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Last page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'First page' })).toBeEnabled();
  });

  it('marks the current page with aria-current and data-state, and no other page', () => {
    render(<Pagination count={5} defaultPage={3} />);

    const current = screen.getByRole('button', { name: 'Page 3' });
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current).toHaveAttribute('data-state', 'active');

    const other = screen.getByRole('button', { name: 'Go to page 2' });
    expect(other).not.toHaveAttribute('aria-current');
    expect(other).not.toHaveAttribute('data-state');
  });

  it('disabled disables every page and nav button', () => {
    render(<Pagination count={5} defaultPage={3} disabled showFirstLast />);

    expect(screen.getByRole('button', { name: 'Page 3' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Go to page 2' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('names the landmark "Pagination" by default, and honours a custom label', () => {
    const { rerender } = render(<Pagination count={3} />);
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();

    rerender(<Pagination count={3} label="Search results" />);
    expect(screen.getByRole('navigation', { name: 'Search results' })).toBeInTheDocument();
  });
});
