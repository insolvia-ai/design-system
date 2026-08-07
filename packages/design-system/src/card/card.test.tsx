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
});
