// WEB-leaf tests — Vitest + Testing Library, jsdom. Asserts the destinations
// pattern this leaf uses (`aria-current`, not `aria-selected` — see
// bottom-nav.web.tsx's header for why) and the roving-focus contract that
// moves focus WITHOUT also selecting, unlike Tabs' arrow keys.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { BottomNav } from './bottom-nav';
import type { BottomNavLabels } from './bottom-nav.props';

function Icon({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 24 24" data-testid={`icon-${label}`}>
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

function Nav({
  showLabels,
  onValueChange,
  profileDisabled = false,
}: {
  showLabels?: BottomNavLabels;
  onValueChange?: (next: string) => void;
  profileDisabled?: boolean;
} = {}) {
  return (
    <BottomNav.Root defaultValue="home" showLabels={showLabels} onValueChange={onValueChange}>
      <BottomNav.Item value="home" label="Home" icon={<Icon label="Home" />} />
      <BottomNav.Item value="search" label="Search" icon={<Icon label="Search" />} />
      <BottomNav.Item
        value="profile"
        label="Profile"
        icon={<Icon label="Profile" />}
        disabled={profileDisabled}
      />
    </BottomNav.Root>
  );
}

describe('BottomNav', () => {
  it('renders a navigation landmark named "Primary" by default', () => {
    render(<Nav />);

    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
  });

  it('marks only the selected item with aria-current', () => {
    render(<Nav />);

    expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Search' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('button', { name: 'Profile' })).not.toHaveAttribute('aria-current');
  });

  it('fires onValueChange with the clicked item’s value and moves aria-current', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Nav onValueChange={onValueChange} />);

    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('search');
    expect(screen.getByRole('button', { name: 'Search' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Home' })).not.toHaveAttribute('aria-current');
  });

  it('hides an unselected label visually under showLabels="selected" without dropping the accessible name', () => {
    render(<Nav showLabels="selected" />);

    expect(screen.getByText('Home')).not.toHaveClass('sr-only');
    expect(screen.getByText('Search')).toHaveClass('sr-only');
    expect(screen.getByText('Profile')).toHaveClass('sr-only');
    // The accessible name still resolves from the (visually hidden) label text.
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  });

  it('disables an item: no press, and it is unreachable by focus', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Nav onValueChange={onValueChange} profileDisabled />);

    const profile = screen.getByRole('button', { name: 'Profile' });
    expect(profile).toBeDisabled();

    await user.click(profile);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('ArrowRight moves focus to the next item without changing the selection', async () => {
    const user = userEvent.setup();
    render(<Nav />);

    const home = screen.getByRole('button', { name: 'Home' });
    const search = screen.getByRole('button', { name: 'Search' });

    home.focus();
    await user.keyboard('{ArrowRight}');

    expect(search).toHaveFocus();
    expect(search).not.toHaveAttribute('aria-current');
    expect(home).toHaveAttribute('aria-current', 'page');
  });
});
