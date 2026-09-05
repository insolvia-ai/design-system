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

import { colors, radii } from '@insolvia-ai/tokens';

import {
  nativeColorsWith,
  nativeRadiiWith,
  useNativeColors,
  useNativeRadii,
} from './native-theme.native';
import { useNativeHeadingFamily, useNativeMonoFamily } from './native-typography.native';
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

function ShowRadii() {
  const r = useNativeRadii();
  return (
    <>
      <span data-testid="md">{String(r.md)}</span>
      <span data-testid="pill">{String(r.pill)}</span>
    </>
  );
}

function ShowFamilies() {
  return (
    <>
      <span data-testid="heading">{useNativeHeadingFamily()}</span>
      <span data-testid="mono">{useNativeMonoFamily()}</span>
    </>
  );
}

describe('nativeRadiiWith', () => {
  it('returns the SAME object when nothing is overridden', () => {
    // Identity for the same reason `nativeColorsWith` needs it: a fresh object
    // per render defeats every downstream memo, and equality would not catch it.
    expect(nativeRadiiWith({})).toBe(radii);
  });

  it('merges a partial override, leaving the other steps alone', () => {
    const merged = nativeRadiiWith({ radii: { md: 12 } });

    expect(merged.md).toBe(12);
    expect(merged.sm).toBe(radii.sm);
    expect(merged.lg).toBe(radii.lg);
  });

  it('refuses to move `pill`, whatever is passed', () => {
    // A pill is a shape, not a corner. The leaves that draw one read the token
    // directly, so honouring an override here would only make the type lie.
    expect(nativeRadiiWith({ radii: { pill: 4 } }).pill).toBe(radii.pill);
    expect(nativeRadiiWith({ radii: { md: 12, pill: 0 } })).toMatchObject({
      md: 12,
      pill: radii.pill,
    });
  });

  it('ignores a colour-only theme', () => {
    expect(nativeRadiiWith({ light: { primary: '#155E63' } })).toBe(radii);
  });
});

describe('useNativeRadii', () => {
  it('uses the token defaults with no provider', () => {
    render(<ShowRadii />);
    expect(screen.getByTestId('md')).toHaveTextContent(String(radii.md));
  });

  it('picks up a ThemeProvider above it', () => {
    render(
      <ThemeProvider theme={{ radii: { md: 12 } }}>
        <ShowRadii />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('md')).toHaveTextContent('12');
    expect(screen.getByTestId('pill')).toHaveTextContent(String(radii.pill));
  });
});

describe('font families', () => {
  it('fall back to the platform defaults with no provider', () => {
    render(<ShowFamilies />);
    // Under react-native-web the platform arm is the token stack, which is what
    // makes the two workbench panes comparable at all.
    expect(screen.getByTestId('heading')).not.toBeEmptyDOMElement();
  });

  it('take a ThemeProvider override verbatim, without per-platform mapping', () => {
    // Verbatim is the point: a consumer naming a family has registered exactly
    // that family, so mapping it onto `System` would discard the override.
    render(
      <ThemeProvider theme={{ fonts: { heading: 'Spectral_600SemiBold', mono: 'IBMPlexMono' } }}>
        <ShowFamilies />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('heading')).toHaveTextContent('Spectral_600SemiBold');
    expect(screen.getByTestId('mono')).toHaveTextContent('IBMPlexMono');
  });

  it('leaves the other family alone when only one is overridden', () => {
    render(
      <ThemeProvider theme={{ fonts: { heading: 'Spectral_600SemiBold' } }}>
        <ShowFamilies />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('mono')).not.toHaveTextContent('Spectral_600SemiBold');
  });
});
