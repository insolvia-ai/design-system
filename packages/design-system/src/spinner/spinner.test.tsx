import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Spinner } from './spinner';
import { DEFAULT_SPINNER_LABEL } from './spinner.props';

describe('Spinner', () => {
  it('exposes an indeterminate progressbar with a default name', () => {
    render(<Spinner />);

    const spinner = screen.getByRole('progressbar', { name: DEFAULT_SPINNER_LABEL });
    // No `aria-valuenow` — that absence is how ARIA spells "indeterminate",
    // and a spinner that claimed a value would be lying about progress.
    expect(spinner).not.toHaveAttribute('aria-valuenow');
  });

  it('takes a caller-supplied name', () => {
    render(<Spinner label="Plotting jump" />);

    expect(screen.getByRole('progressbar', { name: 'Plotting jump' })).toBeInTheDocument();
  });

  it('keeps the animated ring out of the accessibility tree', () => {
    const { container } = render(<Spinner size="lg" />);

    const ring = container.querySelector('[aria-hidden="true"]');
    expect(ring).toHaveClass('animate-spin');
    expect(ring).toHaveClass('size-8');
  });
});
