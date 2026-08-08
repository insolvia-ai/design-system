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
});
