// NATIVE-leaf tests — see card.native.test.tsx for what the `native` vitest
// project resolves and why these exist alongside the `.web` tests.
//
// Masonry carries no color or scheme wiring at all (see masonry.native.tsx's
// header — gap is a static token lookup, not a `useNativeColors()` render-time
// read), so there is nothing here to pin against `setPrefersColorScheme`. What
// IS worth pinning is the one thing `.native.test.tsx` exists for generally:
// that the leaf's structure (column count, gap) matches what the props module
// promised, which a web-only test can never see.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { spacing } from '@insolvia-ai/tokens';

import { Masonry } from './masonry';

describe('Masonry (native leaf)', () => {
  it('renders one column View per `columns`, defaulting to 3', () => {
    render(<Masonry testID="masonry" />);

    expect(screen.getByTestId('masonry').children).toHaveLength(3);
  });

  it('honors an explicit `columns` count', () => {
    render(<Masonry testID="masonry" columns={5} />);

    expect(screen.getByTestId('masonry').children).toHaveLength(5);
  });

  it('applies the `sm` gap token as the row gap, by default', () => {
    render(<Masonry testID="masonry" />);

    expect(screen.getByTestId('masonry')).toHaveStyle({ gap: `${spacing.sm}px` });
  });

  it('applies a non-default gap token to both the row and each column', () => {
    render(<Masonry testID="masonry" gap="lg" />);

    const root = screen.getByTestId('masonry');
    expect(root).toHaveStyle({ gap: `${spacing.lg}px` });
    for (const column of Array.from(root.children)) {
      expect(column).toHaveStyle({ gap: `${spacing.lg}px` });
    }
  });
});
