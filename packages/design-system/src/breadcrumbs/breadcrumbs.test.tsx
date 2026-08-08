import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Breadcrumbs } from './breadcrumbs';
import { DEFAULT_BREADCRUMBS_LABEL } from './breadcrumbs.props';

function Trail() {
  return (
    <Breadcrumbs.Root>
      <Breadcrumbs.Item href="/">Fleet</Breadcrumbs.Item>
      <Breadcrumbs.Item href="/ships">Ships</Breadcrumbs.Item>
      <Breadcrumbs.Item current>Wayfarer</Breadcrumbs.Item>
    </Breadcrumbs.Root>
  );
}

describe('Breadcrumbs', () => {
  it('is a named navigation landmark around a list', () => {
    render(<Trail />);

    const nav = screen.getByRole('navigation', { name: DEFAULT_BREADCRUMBS_LABEL });
    expect(within(nav).getByRole('list')).toBeInTheDocument();
  });

  it('links every crumb except the current page', () => {
    render(<Trail />);

    expect(screen.getByRole('link', { name: 'Fleet' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ships' })).toBeInTheDocument();
    // A link to where you already are is a documented WCAG annoyance.
    expect(screen.queryByRole('link', { name: 'Wayfarer' })).not.toBeInTheDocument();
  });

  it('marks the current page with aria-current', () => {
    render(<Trail />);

    expect(screen.getByText('Wayfarer')).toHaveAttribute('aria-current', 'page');
  });

  it('puts a separator BETWEEN crumbs and never after the last', () => {
    // The classic hand-rolled breadcrumb bug, made unreachable by injecting
    // separators from the Root — pinned so it stays that way.
    const { container } = render(<Trail />);

    const separators = container.querySelectorAll('li[aria-hidden="true"]');
    expect(separators).toHaveLength(2);
  });

  it('renders a crumb with no href as plain text', () => {
    render(
      <Breadcrumbs.Root>
        <Breadcrumbs.Item>Unlinked</Breadcrumbs.Item>
      </Breadcrumbs.Root>,
    );

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Unlinked')).toBeInTheDocument();
  });
});
