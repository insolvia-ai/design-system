// NATIVE-leaf tests — see accordion.native.test.tsx for what the `native`
// vitest project resolves.
//
// The leaves diverge here in a way worth pinning. On web a footer link is a
// real `<a href>`; React Native has no navigation primitive, so this leaf
// renders a `Pressable` with `accessibilityRole="link"` and hands the host an
// `onPress`. Same announced role, completely different activation path — and
// the props tests cannot see either.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Footer } from './footer';

describe('Footer (native leaf)', () => {
  it('announces its link groups as links, not anchors', () => {
    render(
      <Footer.Root>
        <Footer.Group title="Product">
          <Footer.Link>Pricing</Footer.Link>
        </Footer.Group>
      </Footer.Root>,
    );

    const link = screen.getByRole('link', { name: 'Pricing' });
    expect(link).toBeInTheDocument();
    // No href: there is nothing to navigate to on native, and a link that
    // looks navigable but is not is worse than one that is plainly a control.
    expect(link).not.toHaveAttribute('href');
  });

  it('calls onPress when a link is activated', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();

    render(
      <Footer.Root>
        <Footer.Group title="Product">
          <Footer.Link onPress={onPress}>Pricing</Footer.Link>
        </Footer.Group>
      </Footer.Root>,
    );

    await user.click(screen.getByRole('link', { name: 'Pricing' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('names each group with its title', () => {
    render(
      <Footer.Root>
        <Footer.Group title="Company">
          <Footer.Link>About</Footer.Link>
        </Footer.Group>
      </Footer.Root>,
    );

    expect(screen.getByLabelText('Company')).toBeInTheDocument();
  });

  it('renders its note', () => {
    render(
      <Footer.Root>
        <Footer.Note>© 2026 Acme</Footer.Note>
      </Footer.Root>,
    );

    expect(screen.getByText('© 2026 Acme')).toBeInTheDocument();
  });
});
