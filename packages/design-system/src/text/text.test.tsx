import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Text } from './text';

describe('Text', () => {
  it('renders heading variants as real headings', () => {
    render(<Text variant="heading">Jump solutions</Text>);

    expect(screen.getByRole('heading', { name: 'Jump solutions' })).toBeInTheDocument();
  });

  it('renders body copy as a paragraph, not a heading', () => {
    render(<Text>Nav computer and star charts.</Text>);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText('Nav computer and star charts.').tagName).toBe('P');
  });

  it('lets `as` override the element while keeping the variant look', () => {
    // The case this exists for: a heading-sized run of text inside a page that
    // already owns its outline, which must NOT add a heading to it.
    render(
      <Text as="span" variant="heading" data-testid="text">
        Looks like a heading
      </Text>,
    );

    const el = screen.getByTestId('text');
    expect(el.tagName).toBe('SPAN');
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(el).toHaveClass('text-2xl');
  });

  it('applies the tone and an explicit weight override', () => {
    render(
      <Text tone="primary" weight="semibold" data-testid="text">
        Jump plotted
      </Text>,
    );

    const el = screen.getByTestId('text');
    expect(el).toHaveClass('text-primary');
    expect(el).toHaveClass('font-semibold');
  });
});
