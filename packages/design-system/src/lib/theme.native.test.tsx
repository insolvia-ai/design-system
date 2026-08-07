/**
 * The theming seam, tested where it actually lives.
 *
 * `.native.test.tsx` because `useNativeColors` is a platform leaf — only the
 * vitest `native` project resolves `native-theme.native.ts`. The web side needs
 * no equivalent: there, overriding is a CSS custom property and there is no
 * package code in the path to test.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { nativeColorsWith, useNativeColors } from './native-theme.native';
import { ThemeProvider, type ThemeOverrides } from './theme';

function ShowPrimary() {
  const c = useNativeColors();
  return <span data-testid="primary">{c.primary}</span>;
}

describe('nativeColorsWith', () => {
  it('returns the token defaults when nothing is overridden', () => {
    expect(nativeColorsWith('light', {})).toEqual(colors.light);
    expect(nativeColorsWith('dark', {})).toEqual(colors.dark);
  });

  it('returns the SAME object when nothing is overridden', () => {
    // Identity, not just equality. A fresh object every render would defeat
    // every React.memo and dependency-array comparison downstream, which is a
    // performance bug that no equality assertion would ever catch.
    expect(nativeColorsWith('light', {})).toBe(colors.light);
  });

  it('merges a partial override over the defaults, leaving other roles alone', () => {
    const merged = nativeColorsWith('light', { light: { primary: '#155E63' } });

    expect(merged.primary).toBe('#155E63');
    expect(merged.bg).toBe(colors.light.bg);
    expect(merged.ink).toBe(colors.light.ink);
  });

  it('applies only the scheme in play', () => {
    const theme: ThemeOverrides = { light: { primary: '#111111' }, dark: { primary: '#EEEEEE' } };

    expect(nativeColorsWith('light', theme).primary).toBe('#111111');
    expect(nativeColorsWith('dark', theme).primary).toBe('#EEEEEE');
  });

  it('treats an unknown scheme as light', () => {
    // react-native's useColorScheme can return 'unspecified' or null; an
    // unrecognised value must take the safe arm rather than go dark.
    expect(nativeColorsWith('unspecified', {}).primary).toBe(colors.light.primary);
    expect(nativeColorsWith(null, {}).primary).toBe(colors.light.primary);
    expect(nativeColorsWith(undefined, {}).primary).toBe(colors.light.primary);
  });
});

describe('useNativeColors', () => {
  it('uses the package defaults with no provider', () => {
    render(<ShowPrimary />);
    expect(screen.getByTestId('primary')).toHaveTextContent(colors.light.primary);
  });

  it('picks up a ThemeProvider above it', () => {
    render(
      <ThemeProvider theme={{ light: { primary: '#155E63' } }}>
        <ShowPrimary />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('primary')).toHaveTextContent('#155E63');
  });

  it('lets the NEAREST provider win outright, without merging', () => {
    // Documented behaviour, and the reason it is asserted: shallow-merging down
    // the tree would make the palette at any point a function of the whole
    // ancestor chain. Here the inner provider sets no `bg`, so `bg` must fall
    // through to the TOKENS — not to the outer provider's value.
    render(
      <ThemeProvider theme={{ light: { primary: '#111111', bg: '#222222' } }}>
        <ThemeProvider theme={{ light: { primary: '#333333' } }}>
          <ShowBoth />
        </ThemeProvider>
      </ThemeProvider>,
    );

    expect(screen.getByTestId('primary')).toHaveTextContent('#333333');
    expect(screen.getByTestId('bg')).toHaveTextContent(colors.light.bg);
  });
});

function ShowBoth() {
  const c = useNativeColors();
  return (
    <>
      <span data-testid="primary">{c.primary}</span>
      <span data-testid="bg">{c.bg}</span>
    </>
  );
}
