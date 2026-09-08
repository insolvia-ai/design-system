import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EmptyState } from './empty-state';

function NoResults() {
  return (
    <EmptyState.Root>
      <EmptyState.Icon aria-hidden>{'•'}</EmptyState.Icon>
      <EmptyState.Title>No results</EmptyState.Title>
      <EmptyState.Description>Try a different search term.</EmptyState.Description>
      <EmptyState.Actions>
        <button type="button">Clear search</button>
      </EmptyState.Actions>
    </EmptyState.Root>
  );
}

describe('EmptyState', () => {
  it('renders Title as a heading', () => {
    render(<NoResults />);

    expect(screen.getByRole('heading', { name: 'No results', level: 3 })).toBeInTheDocument();
  });

  it('labels the section with the Title', () => {
    render(<NoResults />);

    const region = screen.getByRole('region', { name: 'No results' });
    const title = screen.getByRole('heading', { name: 'No results' });
    expect(region.tagName).toBe('SECTION');
    expect(region).toHaveAttribute('aria-labelledby', title.id);
  });

  it('is not a live region', () => {
    render(<NoResults />);

    // Static content: `role="status"` would make it a live region announced
    // on every mount/update, which is wrong for an empty state's first paint.
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders the description and the action', () => {
    render(<NoResults />);

    expect(screen.getByText('Try a different search term.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
  });

  it('hides the icon from assistive tech', () => {
    render(<NoResults />);

    expect(screen.getByText('•')).toHaveAttribute('aria-hidden', 'true');
  });

  it('throws when a part is used outside its Root', () => {
    // Same contract as every other parts object here — a part that silently
    // rendered inert outside its Root would be a much harder bug to find.
    expect(() => render(<EmptyState.Title>No results</EmptyState.Title>)).toThrow(
      /EmptyState.Title must be rendered inside/,
    );
  });
});
