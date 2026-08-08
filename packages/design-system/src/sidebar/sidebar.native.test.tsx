// NATIVE-leaf tests — see card.native.test.tsx for what the `native` vitest
// project resolves.
//
// The collapse behaviour is shared, but every piece of its a11y surface is
// asserted by hand here: the landmark, the toggle's action-named label, and
// the item labels that have to survive the collapse.
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
          <Sidebar.Item label="Ships" icon="S" active onPress={() => {}} />
          <Sidebar.Item label="Routes" icon="R" onPress={() => {}} />
        </Sidebar.Section>
      </Sidebar.Nav>
    </Sidebar.Root>
  );
}

describe('Sidebar (native leaf)', () => {
  it('exposes exactly one navigation landmark', () => {
    render(<Nav />);

    expect(screen.getAllByRole('navigation')).toHaveLength(1);
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
  });

  it('marks the active item as the current page', () => {
    render(<Nav />);

    expect(screen.getByRole('link', { name: 'Ships' })).toHaveAttribute('aria-current', 'page');
  });

  it('collapses from the Toggle with an action-named label', async () => {
    const onCollapsedChange = vi.fn();
    const user = userEvent.setup();
    render(<Nav onCollapsedChange={onCollapsedChange} />);

    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));

    expect(onCollapsedChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument();
  });

  it('keeps every item named while collapsed', () => {
    render(<Nav defaultCollapsed />);

    expect(screen.getByRole('link', { name: 'Ships' })).toBeInTheDocument();
    expect(screen.queryByText('Wayfarer')).not.toBeInTheDocument();
  });

  it('navigates through onPress, the RN counterpart of href', async () => {
    const onPress = vi.fn();
    const user = userEvent.setup();
    render(
      <Sidebar.Root>
        <Sidebar.Nav>
          <Sidebar.Item label="Ships" onPress={onPress} />
        </Sidebar.Nav>
      </Sidebar.Root>,
    );

    await user.click(screen.getByRole('link', { name: 'Ships' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
