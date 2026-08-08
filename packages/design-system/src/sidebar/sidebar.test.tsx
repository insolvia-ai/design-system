import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Sidebar } from './sidebar';

function Nav(props: { defaultCollapsed?: boolean; onCollapsedChange?: (next: boolean) => void }) {
  return (
    <Sidebar.Root {...props}>
      <Sidebar.Head>
        <Sidebar.Logo>W</Sidebar.Logo>
        <Sidebar.Title>Wayfarer</Sidebar.Title>
        <Sidebar.Toggle />
      </Sidebar.Head>
      <Sidebar.Nav>
        <Sidebar.Section title="Fleet">
          <Sidebar.Item href="/ships" label="Ships" icon="S" active />
          <Sidebar.Item href="/routes" label="Routes" icon="R" />
        </Sidebar.Section>
      </Sidebar.Nav>
      <Sidebar.Footer>
        <Sidebar.Item href="/settings" label="Settings" icon="C" />
      </Sidebar.Footer>
    </Sidebar.Root>
  );
}

describe('Sidebar', () => {
  it('exposes exactly ONE navigation landmark', () => {
    // A `<nav>` inside an `<aside>` would give a page two overlapping
    // landmarks over the same links.
    render(<Nav />);

    expect(screen.getAllByRole('navigation')).toHaveLength(1);
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
  });

  it('marks the active item as the current page', () => {
    render(<Nav />);

    expect(screen.getByRole('link', { name: 'Ships' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Routes' })).not.toHaveAttribute('aria-current');
  });

  it('collapses from the Toggle, and the toggle names the ACTION', async () => {
    const onCollapsedChange = vi.fn();
    const user = userEvent.setup();
    render(<Nav onCollapsedChange={onCollapsedChange} />);

    const toggle = screen.getByRole('button', { name: 'Collapse sidebar' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(toggle);

    expect(onCollapsedChange).toHaveBeenCalledWith(true);
    // A button named for its current state would read as a claim about the
    // world rather than an offer.
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('keeps every item NAMED while collapsed', () => {
    // Otherwise a collapsed rail is a column of unnamed links.
    render(<Nav defaultCollapsed />);

    expect(screen.getByRole('link', { name: 'Ships' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
  });

  it('drops the title and the section heading while collapsed', () => {
    render(<Nav defaultCollapsed />);

    expect(screen.queryByText('Wayfarer')).not.toBeInTheDocument();
    // The group keeps its name even with no visible heading.
    expect(screen.getByRole('group', { name: 'Fleet' })).toBeInTheDocument();
  });

  it('throws when a part is used outside its Root', () => {
    expect(() => render(<Sidebar.Toggle />)).toThrow(/Sidebar.Toggle must be rendered inside/);
  });
});
