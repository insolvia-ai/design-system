// WEB-leaf behavioural tests (Vitest + Testing Library).
import type { MouseEvent } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { EXTERNAL_HINT_TEXT } from './link.props';
import { Link } from './link';

describe('Link (web leaf)', () => {
  it('renders a real anchor with the given href', () => {
    render(<Link href="https://example.com/">Docs</Link>);

    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', 'https://example.com/');
  });

  it('fires onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn((event: MouseEvent) => event.preventDefault());

    render(
      <Link href="https://example.com/" onClick={onClick}>
        Docs
      </Link>,
    );

    await user.click(screen.getByRole('link', { name: 'Docs' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('adds target/rel and a screen-reader note when external', () => {
    render(
      <Link href="https://example.com/" external>
        Docs
      </Link>,
    );

    // The accessible name picks up the sr-only note appended after the
    // decorative glyph — the glyph itself is aria-hidden and contributes
    // nothing to it.
    const link = screen.getByRole('link', { name: `Docs ${EXTERNAL_HINT_TEXT}` });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText(EXTERNAL_HINT_TEXT)).toHaveClass('sr-only');
  });

  it('drops href and sets aria-disabled when disabled', () => {
    render(
      <Link href="https://example.com/" disabled>
        Docs
      </Link>,
    );

    // Not `getByRole('link', …)`: an `<a>` with no `href` has no implicit
    // link role at all (HTML-AAM maps `a[href]` to `link` and a bare `a` to
    // `generic`) — which is exactly the point, so the query has to follow it.
    const link = screen.getByText('Docs');
    expect(link.tagName).toBe('A');
    expect(link).not.toHaveAttribute('href');
    expect(link).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders no target/rel and no sr-only note when not external', () => {
    render(<Link href="https://example.com/">Docs</Link>);

    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link).not.toHaveAttribute('target');
    expect(link).not.toHaveAttribute('rel');
    expect(screen.queryByText(EXTERNAL_HINT_TEXT)).not.toBeInTheDocument();
  });
});
