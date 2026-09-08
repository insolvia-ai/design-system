// NATIVE-leaf tests — see accordion.native.test.tsx for what the `native`
// vitest project resolves. Selection/press wiring mirrors the web leaf's
// contract; the colour-from-scheme check is the 0.2.1 regression guard every
// native leaf owes (see tabs.native.test.tsx's identical pair of tests).
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { BottomNav } from './bottom-nav';

function Nav({ onValueChange }: { onValueChange?: (next: string) => void } = {}) {
  return (
    <BottomNav.Root defaultValue="home" onValueChange={onValueChange}>
      <BottomNav.Item value="home" label="Home" icon={<React.Fragment />} />
      <BottomNav.Item value="search" label="Search" icon={<React.Fragment />} />
    </BottomNav.Root>
  );
}

describe('BottomNav (native leaf)', () => {
  it('calls onValueChange with the pressed item’s value', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Nav onValueChange={onValueChange} />);

    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('search');
  });

  // `accessibilityState.selected` is the signal real iOS/Android
  // accessibility reads; react-native-web does not unpack it into an
  // `aria-*` attribute (the same gap tabs.native.tsx documents for its own
  // `aria-selected`), so this leaf sets `aria-current` explicitly for the
  // DOM as well — the destinations pattern, not `aria-selected`, which is
  // not a valid ARIA state for `role="button"` (see bottom-nav.web.tsx's
  // header for why destinations use `aria-current` and not the tabs pattern).
  it('exposes the selected item via aria-current, alongside accessibilityState.selected', async () => {
    const user = userEvent.setup();
    render(<Nav />);

    const home = screen.getByRole('button', { name: 'Home' });
    const search = screen.getByRole('button', { name: 'Search' });

    expect(home).toHaveAttribute('aria-current', 'page');
    expect(search).not.toHaveAttribute('aria-current');

    await user.click(search);

    expect(home).not.toHaveAttribute('aria-current');
    expect(search).toHaveAttribute('aria-current', 'page');
  });

  // The 0.2.1 regression: every native leaf baked in `colors.light` at module
  // load, so a dark-mode app rendered light design-system surfaces. Colors
  // must resolve from the scheme at render time.
  it('resolves dark colors for the selected item’s label when the OS scheme is dark', () => {
    setPrefersColorScheme('dark');

    render(<Nav />);

    const home = screen.getByText('Home');
    expect(rgb(home.style.color)).toEqual(rgb(colors.dark.primary));
  });

  it('resolves light colors for the selected item’s label when the OS scheme is light', () => {
    render(<Nav />);

    const home = screen.getByText('Home');
    expect(rgb(home.style.color)).toEqual(rgb(colors.light.primary));
  });
});
