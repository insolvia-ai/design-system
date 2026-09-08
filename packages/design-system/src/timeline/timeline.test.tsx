import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Timeline } from './timeline';
import type { TimelinePosition } from './timeline.props';

function ThreeEvents({ position }: { position?: TimelinePosition | undefined }) {
  return (
    <Timeline.Root position={position}>
      <Timeline.Item>
        <Timeline.Marker />
        <Timeline.Connector />
        <Timeline.Content>First</Timeline.Content>
      </Timeline.Item>
      <Timeline.Item>
        <Timeline.Marker />
        <Timeline.Connector />
        <Timeline.Content>Second</Timeline.Content>
      </Timeline.Item>
      <Timeline.Item>
        <Timeline.Marker />
        <Timeline.Connector />
        <Timeline.Content>Third</Timeline.Content>
      </Timeline.Item>
    </Timeline.Root>
  );
}

describe('Timeline', () => {
  it('renders a list with one row per event', () => {
    render(<ThreeEvents />);

    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('omits the connector on the last item so the line ends cleanly', () => {
    const { container } = render(<ThreeEvents />);
    const items = container.querySelectorAll('li');

    // Every item before the last renders its connector...
    expect(items[0]?.querySelector('.w-px')).not.toBeNull();
    expect(items[1]?.querySelector('.w-px')).not.toBeNull();
    // ...even though every item, the last included, was asked to render one.
    expect(items[2]?.querySelector('.w-px')).toBeNull();
  });

  it('flips the 2nd/4th/6th item to the left under alternate position, leaving the rest on the right', () => {
    const { container } = render(<ThreeEvents position="alternate" />);
    const items = container.querySelectorAll('li[data-side]');

    expect(items[0]).toHaveAttribute('data-side', 'right');
    expect(items[1]).toHaveAttribute('data-side', 'left');
    expect(items[2]).toHaveAttribute('data-side', 'right');
  });

  it('keeps a fixed side for every item under a fixed position', () => {
    const { container } = render(<ThreeEvents position="left" />);
    const items = container.querySelectorAll('li[data-side]');

    for (const item of items) {
      expect(item).toHaveAttribute('data-side', 'left');
    }
  });
});
