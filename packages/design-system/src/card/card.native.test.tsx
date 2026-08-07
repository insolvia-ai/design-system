// NATIVE-leaf tests — see accordion.native.test.tsx for what the `native`
// vitest project resolves and why these exist alongside the `.web` tests.
//
// Card carries no interaction, so the thing worth pinning is the one piece of
// semantics it does assert: the title is a HEADING. On the web leaf that is a
// real heading element; here it is a `Text` with `accessibilityRole="header"`,
// and only react-native-web's mapping turns that into something a screen reader
// announces as a heading. If that mapping is ever lost, every card title
// silently becomes body text.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { Card } from './card';

describe('Card (native leaf)', () => {
  it('announces its title as a heading', () => {
    render(
      <Card.Root>
        <Card.Title>Hyperspace in minutes</Card.Title>
        <Card.Body>Nav computer, star charts, and jump solutions.</Card.Body>
      </Card.Root>,
    );

    expect(screen.getByRole('heading', { name: 'Hyperspace in minutes' })).toBeInTheDocument();
  });

  it('renders body and footer content', () => {
    render(
      <Card.Root>
        <Card.Title>Title</Card.Title>
        <Card.Body>Body copy</Card.Body>
        <Card.Footer>Included in every plan</Card.Footer>
      </Card.Root>,
    );

    expect(screen.getByText('Body copy')).toBeInTheDocument();
    expect(screen.getByText('Included in every plan')).toBeInTheDocument();
  });

  it('resolves title colour from the ACTIVE scheme, not module load', () => {
    // The 0.2.1 regression in one assertion: a leaf that read `colors.light`
    // at module load would pass the light case and fail this one.
    setPrefersColorScheme('dark');

    render(
      <Card.Root>
        <Card.Title>Dark title</Card.Title>
      </Card.Root>,
    );

    const title = screen.getByRole('heading', { name: 'Dark title' });
    expect(rgb(getComputedStyle(title).color)).toEqual(rgb(colors.dark.ink));
  });
});
