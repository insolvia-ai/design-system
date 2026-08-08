// NATIVE-leaf tests — see card.native.test.tsx for what the `native` vitest
// project resolves.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { Ribbon } from './ribbon';

describe('Ribbon (native leaf)', () => {
  it('renders its label', () => {
    render(<Ribbon>Popular</Ribbon>);

    expect(screen.getByText('Popular')).toBeInTheDocument();
  });

  it('resolves the label colour from the ACTIVE scheme, not module load', () => {
    // `primaryText` inverts between schemes — white in light, near-black in
    // dark — so a leaf that read `colors.light` at load would paint white on
    // the dark scheme's amber fill and score ~2:1.
    setPrefersColorScheme('dark');

    render(<Ribbon>Popular</Ribbon>);

    expect(rgb(getComputedStyle(screen.getByText('Popular')).color)).toEqual(
      rgb(colors.dark.primaryText),
    );
  });
});
