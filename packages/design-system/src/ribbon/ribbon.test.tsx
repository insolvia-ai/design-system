import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Ribbon } from './ribbon';

describe('Ribbon', () => {
  it('renders its label', () => {
    render(<Ribbon>Popular</Ribbon>);

    expect(screen.getByText('Popular')).toBeInTheDocument();
  });

  it('uses the one foreground/background pair the tokens guarantee', () => {
    // See ribbon.props.ts: `primary`/`primary-text` is the only pair that
    // clears contrast in BOTH schemes, which is why there is no danger tone.
    render(<Ribbon data-testid="ribbon">Popular</Ribbon>);

    const ribbon = screen.getByTestId('ribbon');
    expect(ribbon).toHaveClass('bg-primary');
    expect(ribbon).toHaveClass('text-primary-text');
  });

  it('pins to the requested corner', () => {
    render(
      <Ribbon position="bottom-left" tone="neutral" data-testid="ribbon">
        Beta
      </Ribbon>,
    );

    const ribbon = screen.getByTestId('ribbon');
    expect(ribbon).toHaveClass('absolute');
    expect(ribbon).toHaveClass('bottom-0');
    expect(ribbon).toHaveClass('left-0');
    expect(ribbon).toHaveClass('bg-surface-alt');
  });
});
