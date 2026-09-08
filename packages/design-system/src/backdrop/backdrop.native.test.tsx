// NATIVE-leaf tests — the `native` vitest project resolves './backdrop' to
// backdrop.native.tsx and renders it through react-native-web, the pair a
// React Native consumer ships on web. RNW's Modal portals into the document,
// so `screen`/`container` queries reach the rendered content as usual.
//
// Children are a real RN `<Text>`, never a bare string — React Native throws
// on a text node parented directly to a `View` (which is what Backdrop wraps
// its content in), so a bare string here would test something no real
// consumer could actually render.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Text } from 'react-native';
import { describe, expect, it, vi } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { Backdrop } from './backdrop';

describe('Backdrop (native leaf)', () => {
  it('renders nothing while closed', () => {
    render(<Backdrop open={false} />);

    expect(screen.queryByTestId('backdrop-scrim')).not.toBeInTheDocument();
  });

  it('renders the scrim with its children while open', () => {
    render(
      <Backdrop open>
        <Text>Loading…</Text>
      </Backdrop>,
    );

    expect(screen.getByTestId('backdrop-scrim')).toBeInTheDocument();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('pressing the scrim calls onDismiss', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <Backdrop open onDismiss={onDismiss}>
        <Text>Loading…</Text>
      </Backdrop>,
    );

    await user.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders a plain, unnamed layer instead of a Pressable when onDismiss is omitted', () => {
    render(
      <Backdrop open>
        <Text>Loading…</Text>
      </Backdrop>,
    );

    expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument();
  });

  // The 0.8.3 alert-dialog regression class: react-native-web's Modal hard-codes
  // `role="dialog"` on its own container whenever it mounts, discarding any
  // `role` passed in but still honouring a label — so an unlabelled Backdrop
  // would render an UNNAMED role="dialog", axe's `aria-dialog-name`. Backdrop
  // has no Title part to point at (unlike Dialog/Drawer), so the label is a
  // fixed string rather than conditional.
  it('names react-native-web’s Modal container', () => {
    render(
      <Backdrop open>
        <Text>Loading…</Text>
      </Backdrop>,
    );

    expect(screen.getByRole('dialog', { name: 'Overlay' })).toBeInTheDocument();
  });

  // The 0.2.1 regression class: colors must resolve from the scheme at render
  // time, never from `colors.light` at module load.
  it('resolves the scrim colour from the active scheme', async () => {
    setPrefersColorScheme('dark');
    render(
      <Backdrop open>
        <Text>Loading…</Text>
      </Backdrop>,
    );

    const scrim = screen.getByTestId('backdrop-scrim');
    expect(rgb(scrim.style.backgroundColor)).toEqual(rgb(colors.dark.overlayScrim));
  });

  it('paints a transparent scrim when invisible', () => {
    render(
      <Backdrop open invisible>
        <Text>Loading…</Text>
      </Backdrop>,
    );

    const scrim = screen.getByTestId('backdrop-scrim');
    // jsdom serializes the `transparent` keyword as this rgba() form.
    expect(scrim.style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
  });
});
