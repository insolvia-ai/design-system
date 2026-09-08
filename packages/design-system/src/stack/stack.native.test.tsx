// NATIVE-leaf tests — see accordion.native.test.tsx for what the `native`
// vitest project resolves and why these exist alongside the `.web` tests.
//
// Stack's native leaf carries no a11y wiring, but it is the one place the
// gap-name → dp-number map lives (see stack.native.tsx's header), and that
// map is exactly the kind of thing this component exists to keep correct —
// so it gets pinned here rather than left to the story alone.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { spacing } from '@insolvia-ai/tokens';

import { Stack } from './stack';

describe('Stack (native leaf)', () => {
  it('uses spacing.md as the default gap', () => {
    render(<Stack testID="stack" />);

    const stack = screen.getByTestId('stack');
    expect(getComputedStyle(stack).gap).toBe(`${spacing.md}px`);
  });

  it('resolves the requested gap step to its dp value', () => {
    render(<Stack testID="stack" gap="xl" />);

    expect(getComputedStyle(screen.getByTestId('stack')).gap).toBe(`${spacing.xl}px`);
  });

  it('maps gap="none" to 0, not a missing style', () => {
    render(<Stack testID="stack" gap="none" />);

    expect(getComputedStyle(screen.getByTestId('stack')).gap).toBe('0px');
  });

  it('interleaves a divider between every pair of children, never at an edge', () => {
    render(
      <Stack divider={<hr data-testid="divider" />}>
        <span>one</span>
        <span>two</span>
        <span>three</span>
      </Stack>,
    );

    // 3 children → 2 dividers.
    expect(screen.getAllByTestId('divider')).toHaveLength(2);
  });

  it('renders row direction as flexDirection: row', () => {
    render(<Stack testID="stack" direction="row" />);

    expect(getComputedStyle(screen.getByTestId('stack')).flexDirection).toBe('row');
  });
});
