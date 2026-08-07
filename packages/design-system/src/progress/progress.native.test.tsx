// NATIVE-leaf tests — see accordion.native.test.tsx for what the `native`
// vitest project resolves.
//
// The assertion that earns this file is the indeterminate one. `accessibilityValue`
// is OMITTED rather than set to undefined when there is no value, because RN
// merges the object it is given: passing `{ now: undefined }` would still emit
// an `aria-valuenow`, and an indeterminate bar that reports a value is worse
// than one that reports nothing — a screen reader announces progress that is
// not happening. The distinction is one character wide in the source and
// invisible to every other check.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Progress } from './progress';

describe('Progress (native leaf)', () => {
  it('carries the value and its range', () => {
    render(
      <Progress.Root value={40} max={80}>
        <Progress.Track>
          <Progress.Indicator />
        </Progress.Track>
      </Progress.Root>,
    );

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '40');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '80');
  });

  it('OMITS aria-valuenow entirely when indeterminate', () => {
    render(
      <Progress.Root value={null}>
        <Progress.Track>
          <Progress.Indicator />
        </Progress.Track>
      </Progress.Root>,
    );

    const bar = screen.getByRole('progressbar');
    expect(bar).not.toHaveAttribute('aria-valuenow');
  });

  it('still announces itself as a progressbar when indeterminate', () => {
    // The bar must remain discoverable — omitting the value must not degrade
    // into omitting the role.
    render(<Progress.Root value={null} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
