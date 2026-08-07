// NATIVE-leaf tests — see accordion.native.test.tsx for what the `native`
// vitest project resolves.
//
// Same divergence as Footer: anchors become Pressables the host wires up, so
// the announced role is a link while activation is an `onPress`. The extra
// thing this leaf carries is the ACTIVE state, which is the one piece of
// navigation semantics a screen-reader user depends on to know where they are.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { NavBar } from './nav-bar';

function Nav({ onPress }: { onPress?: () => void } = {}) {
  return (
    <NavBar.Root>
      <NavBar.Brand>Acme</NavBar.Brand>
      <NavBar.Links>
        <NavBar.Link active>Features</NavBar.Link>
        <NavBar.Link onPress={onPress ?? (() => {})}>Pricing</NavBar.Link>
      </NavBar.Links>
    </NavBar.Root>
  );
}

describe('NavBar (native leaf)', () => {
  it('announces its links', () => {
    render(<Nav />);

    expect(screen.getByRole('link', { name: 'Features' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pricing' })).toBeInTheDocument();
  });

  it('renders the brand', () => {
    render(<Nav />);

    expect(screen.getByText('Acme')).toBeInTheDocument();
  });

  it('calls onPress when a link is activated', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();

    render(<Nav onPress={onPress} />);
    await user.click(screen.getByRole('link', { name: 'Pricing' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
