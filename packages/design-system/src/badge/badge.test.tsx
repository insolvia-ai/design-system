import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Badge } from './badge';

describe('Badge', () => {
  it('renders its label', () => {
    render(<Badge>Active</Badge>);

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows a decorative intent dot that assistive tech never reaches', () => {
    // The dot carries colour only; the badge's own text carries the meaning.
    // See the contrast note in badge.props.ts for why intent is a dot at all.
    const { container } = render(<Badge intent="success">Deployed</Badge>);

    const dot = container.querySelector('[aria-hidden="true"]');
    expect(dot).not.toBeNull();
    expect(dot).toHaveClass('bg-success');
  });

  it('renders no dot for the neutral intent', () => {
    const { container } = render(<Badge>Draft</Badge>);

    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
  });
});
