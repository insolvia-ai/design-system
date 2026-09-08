import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Masonry } from './masonry';

describe('Masonry', () => {
  it('renders one column element per `columns`, defaulting to 3', () => {
    const { container } = render(
      <Masonry>
        <span>0</span>
        <span>1</span>
      </Masonry>,
    );

    // All three columns exist even though only two items were given —
    // `distribute` reserves an (empty) bucket per column regardless of item
    // count.
    expect(container.querySelectorAll('[data-column]')).toHaveLength(3);
    expect(screen.getByText('0').closest('[data-column]')).toHaveAttribute('data-column', '0');
  });

  it('honors an explicit `columns` count', () => {
    const { container } = render(<Masonry columns={5} />);

    expect(container.querySelectorAll('[data-column]')).toHaveLength(5);
  });

  it('lands children in the expected column, round-robin by default', () => {
    const { container } = render(
      <Masonry columns={2}>
        <span key="a">a</span>
        <span key="b">b</span>
        <span key="c">c</span>
        <span key="d">d</span>
      </Masonry>,
    );

    const col0 = container.querySelector('[data-column="0"]');
    const col1 = container.querySelector('[data-column="1"]');
    expect(col0).toHaveTextContent('ac');
    expect(col1).toHaveTextContent('bd');
  });

  it('lands children column-major when sequential', () => {
    const { container } = render(
      <Masonry columns={2} sequential>
        <span key="a">a</span>
        <span key="b">b</span>
        <span key="c">c</span>
        <span key="d">d</span>
      </Masonry>,
    );

    const col0 = container.querySelector('[data-column="0"]');
    const col1 = container.querySelector('[data-column="1"]');
    expect(col0).toHaveTextContent('ab');
    expect(col1).toHaveTextContent('cd');
  });

  it('forwards a ref to the root element', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<Masonry ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges a caller className onto the root', () => {
    const { container } = render(<Masonry className="my-masonry" />);

    expect(container.firstElementChild).toHaveClass('my-masonry');
  });
});
