// NATIVE-leaf tests — see badge.native.test.tsx for what the `native` vitest
// project resolves and why these exist alongside the `.web` tests.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { colors } from '@insolvia-ai/tokens';

import { rgb, setPrefersColorScheme } from '../../vitest.native.setup';
import { Timeline } from './timeline';

describe('Timeline (native leaf)', () => {
  it("resolves the marker's colour from the ACTIVE scheme, not module load", () => {
    setPrefersColorScheme('dark');

    render(<Timeline.Marker testID="marker" intent="primary" />);

    expect(rgb(getComputedStyle(screen.getByTestId('marker')).backgroundColor)).toEqual(
      rgb(colors.dark.primary),
    );
  });

  it('renders no connector on the last item', () => {
    render(
      <Timeline.Root>
        <Timeline.Item>
          <Timeline.Marker />
          <Timeline.Connector testID="connector-0" />
          <Timeline.Content />
        </Timeline.Item>
        <Timeline.Item>
          <Timeline.Marker />
          <Timeline.Connector testID="connector-1" />
          <Timeline.Content />
        </Timeline.Item>
      </Timeline.Root>,
    );

    expect(screen.queryByTestId('connector-0')).not.toBeNull();
    expect(screen.queryByTestId('connector-1')).toBeNull();
  });
});
