import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { VisuallyHidden } from './visually-hidden';

describe('VisuallyHidden', () => {
  it('renders its content in the document, clipped with sr-only', () => {
    render(<VisuallyHidden>Close menu</VisuallyHidden>);

    const node = screen.getByText('Close menu');
    expect(node).toBeInTheDocument();
    expect(node).toHaveClass('sr-only');
  });

  it('stays clipped by default, even while focused', () => {
    render(<VisuallyHidden>Close menu</VisuallyHidden>);

    expect(screen.getByText('Close menu')).not.toHaveClass('focus:not-sr-only');
  });

  it('adds the visible-on-focus classes when focusable', () => {
    // The "skip link" case — see the JSDoc on VisuallyHiddenOwnProps.focusable.
    render(<VisuallyHidden focusable>Skip to content</VisuallyHidden>);

    const node = screen.getByText('Skip to content');
    expect(node).toHaveClass('sr-only');
    expect(node).toHaveClass('focus:not-sr-only');
  });

  it('lets a caller-supplied className win over the base classes', () => {
    render(<VisuallyHidden className="my-custom-class">Label</VisuallyHidden>);

    expect(screen.getByText('Label')).toHaveClass('my-custom-class');
  });
});
