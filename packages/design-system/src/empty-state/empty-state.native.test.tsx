// NATIVE-leaf tests — see accordion.native.test.tsx for what the `native`
// vitest project resolves and why these exist alongside the `.web` tests.
//
// EmptyState carries no interaction, so what is worth pinning is the same
// shape Card's native test pins: the title announces as a HEADING (a `Text`
// with `accessibilityRole="header"`, not a real DOM heading here), and colours
// resolve from the ACTIVE scheme rather than being baked in at module load —
// the 0.2.1 regression class of bug.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { EmptyState } from './empty-state';

describe('EmptyState (native leaf)', () => {
  it('announces its title as a heading', () => {
    render(
      <EmptyState.Root>
        <EmptyState.Title>No results</EmptyState.Title>
        <EmptyState.Description>Try a different search term.</EmptyState.Description>
      </EmptyState.Root>,
    );

    expect(screen.getByRole('heading', { name: 'No results' })).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(
      <EmptyState.Root>
        <EmptyState.Title>No results</EmptyState.Title>
        <EmptyState.Description>Try a different search term.</EmptyState.Description>
      </EmptyState.Root>,
    );

    expect(screen.getByText('Try a different search term.')).toBeInTheDocument();
  });

  it('resolves title colour from the ACTIVE scheme, not module load', () => {
    setPrefersColorScheme('dark');

    render(
      <EmptyState.Root>
        <EmptyState.Title>Dark title</EmptyState.Title>
      </EmptyState.Root>,
    );

    const title = screen.getByRole('heading', { name: 'Dark title' });
    expect(rgb(getComputedStyle(title).color)).toEqual(rgb(colors.dark.ink));
  });

  it('resolves light colours for title and description when the OS scheme is light', () => {
    render(
      <EmptyState.Root>
        <EmptyState.Title>Light title</EmptyState.Title>
        <EmptyState.Description>Light description</EmptyState.Description>
      </EmptyState.Root>,
    );

    const title = screen.getByRole('heading', { name: 'Light title' });
    const description = screen.getByText('Light description');
    expect(rgb(getComputedStyle(title).color)).toEqual(rgb(colors.light.ink));
    expect(rgb(getComputedStyle(description).color)).toEqual(rgb(colors.light.muted));
  });

  it('throws when a part is used outside its Root', () => {
    expect(() => render(<EmptyState.Title>No results</EmptyState.Title>)).toThrow(
      /EmptyState.Title must be rendered inside/,
    );
  });
});
