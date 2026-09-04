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

  it('overrides the family the variant implies, keeping its size and role', () => {
    render(
      <Text variant="heading" family="mono">
        R-114-8829
      </Text>,
    );

    const el = screen.getByRole('heading', { name: 'R-114-8829' });
    expect(el).toHaveClass('font-mono');
    // The family is the ONLY thing that moved: still heading-sized, still a
    // heading in the outline.
    expect(el).not.toHaveClass('font-heading');
    expect(el).toHaveClass('text-2xl');
  });

  it("uses the variant's own family when none is given", () => {
    render(
      <Text variant="title" data-testid="title">
        Jump solutions
      </Text>,
    );
    render(
      <Text variant="body" data-testid="body">
        Nav computer.
      </Text>,
    );

    expect(screen.getByTestId('title')).toHaveClass('font-heading');
    expect(screen.getByTestId('body')).toHaveClass('font-body');
  });

  it("can put body copy's family on a heading-sized run", () => {
    render(
      <Text as="span" variant="display" family="body" data-testid="text">
        Big, but not serif
      </Text>,
    );

    const el = screen.getByTestId('text');
    expect(el).toHaveClass('font-body');
    expect(el).not.toHaveClass('font-heading');
  });

  // `text-wrap: balance` resets `text-wrap-mode: wrap`, so it beat `truncate`'s
  // `white-space: nowrap` and the two sat in different tailwind-merge groups —
  // both survived and the stylesheet decided. A consumer's only escape was an
  // inline `style={{ textWrap: 'nowrap' }}`. See lib/cn.ts.
  it('drops text-balance from a heading asked to truncate', () => {
    render(
      <Text variant="display" truncate data-testid="text">
        A very long project name that has to elide
      </Text>,
    );

    const el = screen.getByTestId('text');
    expect(el).toHaveClass('truncate');
    expect(el.className).not.toContain('text-balance');
  });

  it('balances a heading that has not asked to truncate', () => {
    render(
      <Text variant="display" data-testid="text">
        A heading in running text
      </Text>,
    );

    expect(screen.getByTestId('text')).toHaveClass('text-balance');
  });

  // The prop emits the same utility a caller would write by hand, so the two
  // spellings cannot diverge — this is the half that proves it.
  it('resolves a bare className="truncate" the same way', () => {
    render(
      <Text variant="title" className="truncate" data-testid="text">
        Also has to elide
      </Text>,
    );

    const el = screen.getByTestId('text');
    expect(el).toHaveClass('truncate');
    expect(el.className).not.toContain('text-balance');
  });

  // The failure this exists for: two captions, or a caption under a body line,
  // ran onto ONE line with nothing between them — a card read
  // `Name0 references · 54 files` — and `truncate` did nothing, because an
  // inline box has no width to elide against.
  it('lays a caption out as a block by default', () => {
    render(
      <Text variant="caption" data-testid="text">
        54 files
      </Text>,
    );

    const el = screen.getByTestId('text');
    expect(el).toHaveClass('block');
    // Still a <span>: a caption often sits inside running text, and <p> cannot
    // nest inside <p>. The display is CSS; the element stays legal anywhere.
    expect(el.tagName).toBe('SPAN');
  });

  it('lets a caption opt back into being inline', () => {
    render(
      <Text variant="caption" inline data-testid="text">
        inline metadata
      </Text>,
    );

    expect(screen.getByTestId('text').className).not.toContain('block');
  });

  it('does not put `block` on the variants whose element is already one', () => {
    render(
      <Text variant="body" data-testid="text">
        Body copy
      </Text>,
    );

    expect(screen.getByTestId('text').className).not.toContain('block');
  });
});
