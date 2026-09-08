import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Stack } from './stack';

describe('Stack', () => {
  it('defaults to a column with the md gap', () => {
    render(
      <Stack data-testid="stack">
        <span>one</span>
      </Stack>,
    );

    const stack = screen.getByTestId('stack');
    expect(stack).toHaveClass('flex-col', 'gap-md');
  });

  it('switches to a row and the requested gap step', () => {
    render(
      <Stack data-testid="stack" direction="row" gap="xl">
        <span>one</span>
      </Stack>,
    );

    const stack = screen.getByTestId('stack');
    expect(stack).toHaveClass('flex-row', 'gap-xl');
    expect(stack).not.toHaveClass('flex-col', 'gap-md');
  });

  it('maps gap="none" to gap-0, not a t-shirt step', () => {
    render(
      <Stack data-testid="stack" gap="none">
        <span>one</span>
      </Stack>,
    );

    expect(screen.getByTestId('stack')).toHaveClass('gap-0');
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

  it('skips null children when interleaving, instead of leaving an orphan divider', () => {
    render(
      <Stack divider={<hr data-testid="divider" />}>
        <span>one</span>
        {null}
        <span>two</span>
      </Stack>,
    );

    expect(screen.getAllByTestId('divider')).toHaveLength(1);
  });

  it('renders no divider at all when none is supplied', () => {
    render(
      <Stack>
        <span>one</span>
        <span>two</span>
      </Stack>,
    );

    expect(screen.queryAllByTestId('divider')).toHaveLength(0);
  });

  it('adds flex-wrap only when wrap is requested', () => {
    const { rerender } = render(
      <Stack data-testid="stack">
        <span>one</span>
      </Stack>,
    );
    expect(screen.getByTestId('stack')).not.toHaveClass('flex-wrap');

    rerender(
      <Stack data-testid="stack" wrap>
        <span>one</span>
      </Stack>,
    );
    expect(screen.getByTestId('stack')).toHaveClass('flex-wrap');
  });

  it('maps align and justify to the matching Tailwind utilities', () => {
    render(
      <Stack data-testid="stack" align="center" justify="between">
        <span>one</span>
      </Stack>,
    );

    const stack = screen.getByTestId('stack');
    expect(stack).toHaveClass('items-center', 'justify-between');
  });

  it('lets a caller-supplied className win over the base classes', () => {
    render(
      <Stack data-testid="stack" className="my-custom-stack">
        <span>one</span>
      </Stack>,
    );

    expect(screen.getByTestId('stack')).toHaveClass('my-custom-stack');
  });
});
