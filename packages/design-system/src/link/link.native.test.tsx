// NATIVE-leaf tests — see button.native.test.tsx for what the `native` vitest
// project resolves. `Linking` here is react-native-web's implementation (the
// native project aliases `react-native` to it), so spying on its `openURL` is
// spying on exactly what a React Native consumer's OS would otherwise be
// asked to open.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Linking } from 'react-native';
import { describe, expect, it, vi } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { Link } from './link';

describe('Link (native leaf)', () => {
  it('renders with accessibilityRole="link"', () => {
    render(<Link href="https://example.com/">Docs</Link>);

    expect(screen.getByRole('link', { name: 'Docs' })).toBeInTheDocument();
  });

  it('calls Linking.openURL with href on press', async () => {
    const openURL = vi.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const user = userEvent.setup();

    render(<Link href="https://example.com/docs">Docs</Link>);
    await user.click(screen.getByRole('link', { name: 'Docs' }));

    expect(openURL).toHaveBeenCalledWith('https://example.com/docs');
    openURL.mockRestore();
  });

  it('runs onPress before opening href', async () => {
    const openURL = vi.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const onPress = vi.fn();
    const user = userEvent.setup();

    render(
      <Link href="https://example.com/" onPress={onPress}>
        Docs
      </Link>,
    );
    await user.click(screen.getByRole('link', { name: 'Docs' }));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(openURL).toHaveBeenCalledTimes(1);
    openURL.mockRestore();
  });

  it('does not call Linking.openURL when disabled', async () => {
    const openURL = vi.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const user = userEvent.setup();

    render(
      <Link href="https://example.com/" disabled>
        Docs
      </Link>,
    );
    await user.click(screen.getByRole('link', { name: 'Docs' }));

    expect(openURL).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('aria-disabled', 'true');
    openURL.mockRestore();
  });

  it('does not call Linking.openURL when openOnPress is false', async () => {
    const openURL = vi.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const onPress = vi.fn();
    const user = userEvent.setup();

    render(
      <Link href="https://example.com/" openOnPress={false} onPress={onPress}>
        Docs
      </Link>,
    );
    await user.click(screen.getByRole('link', { name: 'Docs' }));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(openURL).not.toHaveBeenCalled();
    openURL.mockRestore();
  });

  it('resolves the tone colour from the active scheme', () => {
    setPrefersColorScheme('dark');

    render(
      <Link href="https://example.com/" tone="muted">
        Docs
      </Link>,
    );

    const link = screen.getByRole('link', { name: 'Docs' });
    expect(rgb(link.style.color)).toEqual(rgb(colors.dark.muted));
  });
});
