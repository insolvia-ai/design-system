import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ImageList } from './image-list';

function Gallery({ columns = 3 }: { columns?: number }) {
  return (
    <ImageList.Root columns={columns} data-testid="root">
      <ImageList.Item src="/a.jpg" alt="A" />
      <ImageList.Item src="/b.jpg" alt="B" />
      <ImageList.Item src="/c.jpg" alt="C" />
    </ImageList.Root>
  );
}

describe('ImageList', () => {
  it('is a list of listitems', () => {
    render(<Gallery />);

    const list = screen.getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
  });

  it('sets grid-template-columns from `columns`', () => {
    render(<Gallery columns={4} />);

    expect(screen.getByTestId('root').style.gridTemplateColumns).toBe('repeat(4, minmax(0, 1fr))');
  });

  it('defaults to 3 columns and a small gap', () => {
    render(
      <ImageList.Root data-testid="root">
        <ImageList.Item src="/a.jpg" alt="A" />
      </ImageList.Root>,
    );

    const root = screen.getByTestId('root');
    expect(root.style.gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))');
    expect(root).toHaveClass('gap-sm');
  });

  it('ignores `rows`/`cols` under the default `standard` variant', () => {
    render(
      <ImageList.Root>
        <ImageList.Item src="/a.jpg" alt="A" rows={2} cols={2} data-testid="item" />
      </ImageList.Root>,
    );

    const item = screen.getByTestId('item');
    expect(item.style.gridRow).toBe('');
    expect(item.style.gridColumn).toBe('');
  });

  it('spans grid rows and columns under `quilted`', () => {
    render(
      <ImageList.Root variant="quilted">
        <ImageList.Item src="/a.jpg" alt="A" rows={2} cols={2} data-testid="item" />
        <ImageList.Item src="/b.jpg" alt="B" data-testid="default-item" />
      </ImageList.Root>,
    );

    expect(screen.getByTestId('item').style.gridRow).toBe('span 2');
    expect(screen.getByTestId('item').style.gridColumn).toBe('span 2');
    // A 1x1 tile emits no span at all — indistinguishable from `span 1`, but
    // the point is nothing is written for the common case.
    expect(screen.getByTestId('default-item').style.gridRow).toBe('');
    expect(screen.getByTestId('default-item').style.gridColumn).toBe('');
  });

  it('fixes grid-auto-rows only under `quilted`', () => {
    const { rerender } = render(
      <ImageList.Root data-testid="root">
        <ImageList.Item src="/a.jpg" alt="A" />
      </ImageList.Root>,
    );
    expect(screen.getByTestId('root').style.gridAutoRows).toBe('');

    rerender(
      <ImageList.Root variant="quilted" data-testid="root">
        <ImageList.Item src="/a.jpg" alt="A" />
      </ImageList.Root>,
    );
    expect(screen.getByTestId('root').style.gridAutoRows).not.toBe('');
  });

  it('renders the ItemBar title and subtitle over the tile', () => {
    render(
      <ImageList.Root>
        <ImageList.Item src="/a.jpg" alt="A">
          <ImageList.ItemBar title="Wayfarer" subtitle="Docked at Ganymede" />
        </ImageList.Item>
      </ImageList.Root>,
    );

    expect(screen.getByText('Wayfarer')).toBeInTheDocument();
    expect(screen.getByText('Docked at Ganymede')).toBeInTheDocument();
  });

  it('renders the ItemBar with no subtitle when none is given', () => {
    render(
      <ImageList.Root>
        <ImageList.Item src="/a.jpg" alt="A">
          <ImageList.ItemBar title="Wayfarer" />
        </ImageList.Item>
      </ImageList.Root>,
    );

    expect(screen.getByText('Wayfarer')).toBeInTheDocument();
  });

  it('renders an ItemBar actions slot', () => {
    render(
      <ImageList.Root>
        <ImageList.Item src="/a.jpg" alt="A">
          <ImageList.ItemBar title="Wayfarer" actions={<button type="button">Save</button>} />
        </ImageList.Item>
      </ImageList.Root>,
    );

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('accepts an empty alt for a decorative tile', () => {
    // The explicit way to say "nothing to announce" — a missing alt is a
    // defect, an empty one is a decision. `card.test.tsx` asserts the same
    // rule for `Card.Image`.
    const { container } = render(
      <ImageList.Root>
        <ImageList.Item src="/a.jpg" alt="" />
      </ImageList.Root>,
    );

    expect(container.querySelector('img')).toHaveAttribute('alt', '');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('names a non-decorative tile for assistive tech', () => {
    render(
      <ImageList.Root>
        <ImageList.Item src="/a.jpg" alt="A ship at dock" />
      </ImageList.Root>,
    );

    expect(screen.getByRole('img', { name: 'A ship at dock' })).toBeInTheDocument();
  });

  it('throws when a part is used outside its Root', () => {
    expect(() => render(<ImageList.Item src="/a.jpg" alt="orphan" />)).toThrow(
      /ImageList.Item must be rendered inside/,
    );
  });
});
