// NATIVE-leaf test — see badge.native.test.tsx for how the `native` vitest
// project resolves './visually-hidden' to visually-hidden.native.tsx and
// renders it through react-native-web. The one thing worth pinning here is
// negative: this leaf must NOT be pulled out of the accessibility tree, which
// is the one way a "hidden" component could get this exactly backwards.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { VisuallyHidden } from './visually-hidden';

describe('VisuallyHidden (native leaf)', () => {
  it('renders its content', () => {
    render(<VisuallyHidden>Close menu</VisuallyHidden>);

    expect(screen.getByText('Close menu')).toBeInTheDocument();
  });

  it('is never pulled out of the accessibility tree', () => {
    // accessibilityElementsHidden (iOS) / importantForAccessibility (Android)
    // both surface as aria-hidden under react-native-web; either one here
    // would hide this content from the very screen readers it exists for.
    render(<VisuallyHidden>Close menu</VisuallyHidden>);

    expect(screen.getByText('Close menu')).not.toHaveAttribute('aria-hidden');
  });

  it('ignores the web-only focusable prop rather than erroring', () => {
    render(<VisuallyHidden focusable>Skip to content</VisuallyHidden>);

    const node = screen.getByText('Skip to content');
    expect(node).toBeInTheDocument();
    expect(node).not.toHaveAttribute('aria-hidden');
  });
});
