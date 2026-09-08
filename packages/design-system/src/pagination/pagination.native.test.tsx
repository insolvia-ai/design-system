// NATIVE-leaf tests — see tabs.native.test.tsx for what the `native` vitest
// project resolves and why these exist alongside the `.web` tests.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { Pagination } from './pagination';

describe('Pagination (native leaf)', () => {
  it('pressing a page fires onPageChange with that page', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination count={10} defaultPage={5} onPageChange={onPageChange} />);

    await user.click(screen.getByRole('button', { name: 'Go to page 6' }));

    expect(onPageChange).toHaveBeenCalledTimes(1);
    expect(onPageChange).toHaveBeenCalledWith(6);
  });

  it('exposes the current page via aria-current, and no other page', () => {
    render(<Pagination count={5} defaultPage={3} />);

    expect(screen.getByRole('button', { name: 'Page 3' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Go to page 2' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('exposes disabled state via aria-disabled on every item', () => {
    render(<Pagination count={5} defaultPage={1} disabled showFirstLast />);

    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Previous page' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  // The 0.2.1 regression: every native leaf baked in `colors.light` at module
  // load, so a dark-mode app rendered light design-system surfaces. Colors
  // must resolve from the scheme at render time.
  it('resolves dark colors for the current page label when the OS scheme is dark', () => {
    setPrefersColorScheme('dark');

    render(<Pagination count={5} defaultPage={3} />);

    const current = screen.getByText('3');
    expect(rgb(current.style.color)).toEqual(rgb(colors.dark.primaryText));
  });

  it('resolves light colors for the current page label when the OS scheme is light', () => {
    render(<Pagination count={5} defaultPage={3} />);

    const current = screen.getByText('3');
    expect(rgb(current.style.color)).toEqual(rgb(colors.light.primaryText));
  });
});
