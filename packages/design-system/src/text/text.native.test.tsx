// NATIVE-leaf tests — the `native` vitest project resolves `.native` leaves and
// aliases react-native to react-native-web, which is the pair a React Native
// consumer renders on the web.
//
// Two things are worth pinning here. First, that a heading variant still
// ANNOUNCES as a heading when there is no heading element to lean on — the web
// leaf gets that from `<h3>`, this leaf only from `accessibilityRole="header"`
// surviving react-native-web's mapping. Second, the 0.2.1 trap: colours must
// come from the active scheme at render, not from `colors.light` at module
// load.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { ThemeProvider } from '../lib/theme';
import { headingFamily, monoFamily } from '../lib/native-typography';
import { Text } from './text';

describe('Text (native leaf)', () => {
  it('announces heading variants as headings', () => {
    render(<Text variant="title">Jump solutions</Text>);

    expect(screen.getByRole('heading', { name: 'Jump solutions' })).toBeInTheDocument();
  });

  it('does not announce body copy as a heading', () => {
    render(<Text>Nav computer and star charts.</Text>);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('resolves tone colour from the ACTIVE scheme, not module load', () => {
    setPrefersColorScheme('dark');

    render(<Text tone="muted">Metadata</Text>);

    expect(rgb(getComputedStyle(screen.getByText('Metadata')).color)).toEqual(
      rgb(colors.dark.muted),
    );
  });

  // `family` is the DS-1 half of this leaf: the same three role names the web
  // leaf spells `font-heading`/`font-body`/`font-mono`, resolved through
  // native-typography's per-platform seam. These assert the OVERRIDE in both
  // directions, because the failure that matters is a family that layers
  // instead of replacing — the variant's face surviving underneath an explicit
  // one.
  it("uses the variant's own family when none is given", () => {
    render(<Text variant="title">Jump solutions</Text>);

    expect(getComputedStyle(screen.getByText('Jump solutions')).fontFamily).toBe(headingFamily);
  });

  it('replaces the variant family with family="mono"', () => {
    render(
      <Text variant="title" family="mono">
        R-114-8829
      </Text>,
    );

    const style = getComputedStyle(screen.getByText('R-114-8829'));
    // `monoFamily` is the token stack on this platform (react-native-web),
    // which is exactly what the `.web` leaf's `font-mono` resolves to — that
    // equality is what makes the workbench's two panes comparable.
    expect(style.fontFamily).toBe(monoFamily);
    expect(style.fontFamily).not.toBe(headingFamily);
  });

  it('drops the heading face for family="body", the platform sans', () => {
    render(
      <Text variant="display" family="body">
        Big, but not serif
      </Text>,
    );

    // `body` is the ABSENCE of a family on this platform — see familyFont in
    // text.native.tsx — so react-native-web's own base stack renders, which is
    // the platform sans. Asserted as "neither of the two families this
    // component can name" rather than against that stack verbatim: the stack
    // belongs to react-native-web and is not this package's to pin.
    const style = getComputedStyle(screen.getByText('Big, but not serif'));
    expect(style.fontFamily).not.toBe(headingFamily);
    expect(style.fontFamily).not.toBe(monoFamily);
    expect(style.fontFamily).toContain('sans-serif');
  });

  // `truncate` is the one of the two new props that CROSSES: RN elides with
  // `numberOfLines`, not with CSS, so a caller who had reached for
  // `className="truncate"` had written something that did nothing here. The
  // web leaf's counterpart is asserted in text.test.tsx.
  it('elides with numberOfLines when asked to truncate', () => {
    render(
      <Text truncate testID="text">
        A very long run of text that has to elide
      </Text>,
    );

    // react-native-web compiles `numberOfLines={1}` into its own atomic
    // classes rather than an inline style. The hash half of each name is an
    // implementation detail; the PROPERTY half is what the library guarantees,
    // so that is what this reads — `r-textOverflow-*` is the ellipsis.
    expect(screen.getByTestId('text').className).toContain('r-textOverflow');
  });

  it('does not elide by default', () => {
    render(<Text testID="text">Wraps as many lines as it needs</Text>);

    expect(screen.getByTestId('text').className).not.toContain('r-textOverflow');
  });
});

describe('Text (native leaf) — the fonts seam', () => {
  // Companion to the Button radius pair: `familyFont` was a module-level map
  // built from `Platform.select` at load, so a provider could not reach it and
  // a React Native consumer could not set a display face at all — while a web
  // consumer set `--font-heading` and moved every heading at once.
  it('uses the platform family with no provider', () => {
    render(<Text variant="heading">Ship it</Text>);

    expect(screen.getByText('Ship it').style.fontFamily).toBe(headingFamily);
  });

  it('takes a heading family from a ThemeProvider above it', () => {
    render(
      <ThemeProvider theme={{ fonts: { heading: 'Spectral_600SemiBold' } }}>
        <Text variant="heading">Ship it</Text>
      </ThemeProvider>,
    );

    expect(screen.getByText('Ship it').style.fontFamily).toBe('Spectral_600SemiBold');
  });

  it('leaves body copy on the platform sans, which is what --font-body asks for', () => {
    render(
      <ThemeProvider theme={{ fonts: { heading: 'Spectral_600SemiBold' } }}>
        <Text>Ship it</Text>
      </ThemeProvider>,
    );

    expect(screen.getByText('Ship it').style.fontFamily).toBe('');
  });

  it('overrides mono independently of heading', () => {
    render(
      <ThemeProvider theme={{ fonts: { mono: 'IBMPlexMono' } }}>
        <Text family="mono">npm ci</Text>
      </ThemeProvider>,
    );

    expect(screen.getByText('npm ci').style.fontFamily).toBe('IBMPlexMono');
    expect(monoFamily).not.toBe('IBMPlexMono');
  });
});
