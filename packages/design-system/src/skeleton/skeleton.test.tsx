import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  it('is decorative — aria-hidden, nothing for assistive tech to stop on', () => {
    const { container } = render(<Skeleton />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders a single box by default (lines defaults to 1)', () => {
    const { container } = render(<Skeleton variant="text" />);

    expect(container.firstElementChild?.children).toHaveLength(0);
  });

  it('renders `lines` stacked line boxes for the text variant', () => {
    const { container } = render(<Skeleton variant="text" lines={3} />);

    const root = container.firstElementChild;
    expect(root?.children).toHaveLength(3);
    // Every line stays hidden from assistive tech through the parent's own
    // aria-hidden — no need for each line to repeat it.
    expect(root).toHaveAttribute('aria-hidden', 'true');
  });

  it('narrows only the LAST line once there is more than one', () => {
    const { container } = render(<Skeleton variant="text" lines={3} />);

    const [first, second, last] = Array.from(container.firstElementChild?.children ?? []);
    expect(first).toHaveStyle({ width: '100%' });
    expect(second).toHaveStyle({ width: '100%' });
    expect(last).toHaveStyle({ width: '60%' });
  });

  it.each([
    ['text', 'rounded-sm'],
    ['circle', 'rounded-pill'],
    ['rect', 'rounded-md'],
  ] as const)('rounds the %s variant with %s', (variant, radiusClass) => {
    const { container } = render(<Skeleton variant={variant} />);

    expect(container.firstElementChild).toHaveClass(radiusClass);
  });

  it('hugs its own box for circle, but stretches block-level for text/rect', () => {
    const { container: circleContainer } = render(<Skeleton variant="circle" />);
    expect(circleContainer.firstElementChild).toHaveClass('inline-flex');

    const { container: rectContainer } = render(<Skeleton variant="rect" />);
    expect(rectContainer.firstElementChild).not.toHaveClass('inline-flex');
  });

  it('pulses by default, with a reduced-motion escape hatch built in', () => {
    const { container } = render(<Skeleton />);

    expect(container.firstElementChild).toHaveClass('animate-pulse', 'motion-reduce:animate-none');
  });

  it('renders no pulse classes when animation is "none"', () => {
    const { container } = render(<Skeleton animation="none" />);

    expect(container.firstElementChild).not.toHaveClass('animate-pulse');
  });
});
