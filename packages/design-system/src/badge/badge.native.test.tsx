// NATIVE-leaf tests — see card.native.test.tsx for what the `native` vitest
// project resolves and why these exist alongside the `.web` tests.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { Badge } from './badge';

describe('Badge (native leaf)', () => {
  it('renders its label', () => {
    render(<Badge intent="danger">Failed</Badge>);

    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('resolves label colour from the ACTIVE scheme, not module load', () => {
    setPrefersColorScheme('dark');

    render(<Badge>Draft</Badge>);

    expect(rgb(getComputedStyle(screen.getByText('Draft')).color)).toEqual(rgb(colors.dark.ink));
  });
});
