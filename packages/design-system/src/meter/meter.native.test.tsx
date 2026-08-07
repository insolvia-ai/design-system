// NATIVE-leaf tests — see accordion.native.test.tsx for what the `native`
// vitest project resolves.
//
// THE POINT OF THIS FILE is a deliberate divergence between the leaves, and it
// is the kind that only a native test can hold down.
//
// The web leaf renders `role="meter"`. React Native has no meter role — its
// `accessibilityRole` is a closed set — so this leaf renders
// `accessibilityRole="progressbar"` instead, which is the nearest thing that
// announces a value at all. That is a knowing compromise, recorded at the top
// of meter.native.tsx, and without a test asserting it the next reader has two
// equally plausible readings: an intentional fallback, or a copy-paste from
// Progress. This file says which.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Meter } from './meter';

describe('Meter (native leaf)', () => {
  it('falls back to the progressbar role, because RN has no meter role', () => {
    render(
      <Meter.Root value={30} min={0} max={60}>
        <Meter.Track>
          <Meter.Indicator />
        </Meter.Track>
      </Meter.Root>,
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    // And explicitly NOT the web leaf's role, so a future "unify the leaves"
    // change has to come here and read the reasoning first.
    expect(screen.queryByRole('meter')).not.toBeInTheDocument();
  });

  it('carries the value and its full range', () => {
    render(<Meter.Root value={30} min={0} max={60} />);

    const meter = screen.getByRole('progressbar');
    expect(meter).toHaveAttribute('aria-valuenow', '30');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '60');
  });

  it('defaults min to 0 and max to 100', () => {
    render(<Meter.Root value={10} />);

    const meter = screen.getByRole('progressbar');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '100');
  });
});
