import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Card } from './card';

describe('Card', () => {
  it('renders its title as a heading alongside body and footer content', () => {
    render(
      <Card.Root>
        <Card.Title>Hyperspace in minutes</Card.Title>
        <Card.Body>Nav computer, star charts, and jump solutions, from one console.</Card.Body>
        <Card.Footer>
          <span>Included in every plan</span>
        </Card.Footer>
      </Card.Root>,
    );

    expect(screen.getByRole('heading', { name: 'Hyperspace in minutes' })).toBeInTheDocument();
    expect(screen.getByText(/star charts/)).toBeInTheDocument();
    expect(screen.getByText('Included in every plan')).toBeInTheDocument();
  });

  it('applies the raised elevation variant', () => {
    render(
      <Card.Root elevation="raised" data-testid="card">
        <Card.Title>Raised</Card.Title>
      </Card.Root>,
    );

    expect(screen.getByTestId('card')).toHaveClass('shadow-md');
  });

  it('renders a named image without a figure when there is no caption', () => {
    const { container } = render(
      <Card.Root>
        <Card.Image src="/ship.jpg" alt="The Wayfarer at dock" />
        <Card.Title>Wayfarer</Card.Title>
      </Card.Root>,
    );

    expect(screen.getByRole('img', { name: 'The Wayfarer at dock' })).toBeInTheDocument();
    // An empty <figure> adds a grouping role and says nothing.
    expect(container.querySelector('figure')).toBeNull();
  });

  it('wraps the image in a figure when a caption is given', () => {
    const { container } = render(
      <Card.Root>
        <Card.Image src="/ship.jpg" alt="The Wayfarer at dock" caption="Docked at Ganymede" />
      </Card.Root>,
    );

    expect(container.querySelector('figure')).not.toBeNull();
    expect(screen.getByText('Docked at Ganymede')).toBeInTheDocument();
  });

  it('accepts an empty alt for a decorative image', () => {
    // The explicit way to say "nothing to announce" — a missing alt is a
    // defect, an empty one is a decision.
    render(
      <Card.Root>
        <Card.Image src="/texture.jpg" alt="" />
      </Card.Root>,
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('bleeds to the card edge by cancelling the Root padding', () => {
    const { container } = render(
      <Card.Root>
        <Card.Image src="/ship.jpg" alt="Ship" />
      </Card.Root>,
    );

    expect(container.querySelector('.-mx-lg')).not.toBeNull();
  });
});
