// NATIVE-leaf tests — see card.native.test.tsx for what the `native` vitest
// project resolves.
//
// The grid semantics are asserted by hand on this leaf, so they are what the
// test pins. Each day's accessible name is its ISO date rather than its
// number: "17" alone tells a screen-reader user nothing about which month they
// are in, and the native leaf has no `<table>` context to supply it.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { Calendar } from './calendar';

const TODAY = '2026-03-11';

describe('Calendar (native leaf)', () => {
  it('renders a grid of six weeks with the month named', () => {
    render(<Calendar today={TODAY} />);

    expect(screen.getByText('March 2026')).toBeInTheDocument();
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getAllByRole('gridcell')).toHaveLength(42);
  });

  it('selects a date on press', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(<Calendar today={TODAY} onValueChange={onValueChange} />);

    await user.click(screen.getByRole('button', { name: '17 March 2026' }));

    expect(onValueChange).toHaveBeenCalledWith('2026-03-17');
  });

  it('pages to the next month', async () => {
    const user = userEvent.setup();
    render(<Calendar today={TODAY} />);

    await user.click(screen.getByRole('button', { name: 'Next month' }));

    expect(screen.getByText('April 2026')).toBeInTheDocument();
  });

  it('marks a date outside the range as disabled', () => {
    render(<Calendar today={TODAY} min="2026-03-10" max="2026-03-20" />);

    // Asserted, not pressed: react-native-web renders a disabled Pressable
    // with `pointer-events: none`, so user-event will not click it at all.
    expect(screen.getByRole('button', { name: '5 March 2026' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('resolves the selected day’s colour from the ACTIVE scheme', () => {
    setPrefersColorScheme('dark');
    render(<Calendar today={TODAY} defaultValue="2026-03-17" />);

    expect(rgb(getComputedStyle(screen.getByText('17')).color)).toEqual(
      rgb(colors.dark.primaryText),
    );
  });
});
