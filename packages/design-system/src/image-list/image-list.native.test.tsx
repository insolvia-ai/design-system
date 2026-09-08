// NATIVE-leaf tests — see card.native.test.tsx for what the `native` vitest
// project resolves.
//
// Two things only the native leaf has to get right by itself: the WIDTH math
// (a flex-wrap row has no grid to divide columns for it) and resolving the
// ItemBar's overlay colours at RENDER time rather than at module load — the
// same 0.2.1 class of bug `table.native.test.tsx` and `card.native.test.tsx`
// each pin for their own leaf.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { ImageList } from './image-list';

describe('ImageList (native leaf)', () => {
  it('divides tile width evenly by `columns`', () => {
    render(
      <ImageList.Root columns={4}>
        <ImageList.Item src="/a.jpg" alt="A" testID="item" />
      </ImageList.Root>,
    );

    expect(getComputedStyle(screen.getByTestId('item')).width).toBe('25%');
  });

  it('defaults to 3 columns', () => {
    render(
      <ImageList.Root>
        <ImageList.Item src="/a.jpg" alt="A" testID="item" />
      </ImageList.Root>,
    );

    expect(getComputedStyle(screen.getByTestId('item')).width).toBe(`${100 / 3}%`);
  });

  it('widens a tile by `cols` under `quilted`, and ignores it otherwise', () => {
    const { rerender } = render(
      <ImageList.Root columns={4} variant="quilted">
        <ImageList.Item src="/a.jpg" alt="A" cols={2} testID="item" />
      </ImageList.Root>,
    );
    expect(getComputedStyle(screen.getByTestId('item')).width).toBe('50%');

    rerender(
      <ImageList.Root columns={4}>
        <ImageList.Item src="/a.jpg" alt="A" cols={2} testID="item" />
      </ImageList.Root>,
    );
    expect(getComputedStyle(screen.getByTestId('item')).width).toBe('25%');
  });

  it('names a non-decorative tile for BOTH renderers', () => {
    // Same finding as Card's 0.8.3 fix: `alt` alone names the image on a
    // device and leaves it decorative in a browser, so the accessible name
    // is asserted here too.
    render(
      <ImageList.Root>
        <ImageList.Item src="/a.jpg" alt="A ship at dock" />
      </ImageList.Root>,
    );

    expect(screen.getByRole('img', { name: 'A ship at dock' })).toBeInTheDocument();
  });

  it('resolves the ItemBar colours from the ACTIVE scheme, not module load', () => {
    setPrefersColorScheme('dark');

    render(
      <ImageList.Root>
        <ImageList.Item src="/a.jpg" alt="A">
          <ImageList.ItemBar title="Wayfarer" subtitle="Docked at Ganymede" />
        </ImageList.Item>
      </ImageList.Root>,
    );

    const title = screen.getByText('Wayfarer');
    const subtitle = screen.getByText('Docked at Ganymede');
    // Overlay tokens hold the SAME value in both schemes — see the
    // `$comment2` block in tokens.json — so asserting against `colors.dark`
    // here also proves the bar did not just fall back to a light default.
    expect(rgb(getComputedStyle(title).color)).toEqual(rgb(colors.dark.overlayInk));
    expect(rgb(getComputedStyle(subtitle).color)).toEqual(rgb(colors.dark.overlayMuted));
  });

  it('renders the ItemBar with no subtitle when none is given', () => {
    render(
      <ImageList.Root>
        <ImageList.Item src="/a.jpg" alt="A">
          <ImageList.ItemBar title="Wayfarer" />
        </ImageList.Item>
      </ImageList.Root>,
    );

    expect(screen.getByText('Wayfarer')).toBeInTheDocument();
  });

  it('throws when a part is used outside its Root', () => {
    expect(() => render(<ImageList.Item src="/a.jpg" alt="orphan" />)).toThrow(
      /ImageList.Item must be rendered inside/,
    );
  });
});
