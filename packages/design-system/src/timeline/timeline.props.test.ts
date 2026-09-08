import * as React from 'react';
import { describe, expect, it } from 'vitest';

import { groupTimelineItemChildren, resolveTimelineItemSide } from './timeline.props';

describe('resolveTimelineItemSide', () => {
  it('is constant for a fixed position, regardless of index', () => {
    expect(resolveTimelineItemSide('right', 0)).toBe('right');
    expect(resolveTimelineItemSide('right', 3)).toBe('right');
    expect(resolveTimelineItemSide('left', 0)).toBe('left');
    expect(resolveTimelineItemSide('left', 5)).toBe('left');
  });

  it('alternate starts at right and flips every other item to left', () => {
    expect(resolveTimelineItemSide('alternate', 0)).toBe('right');
    expect(resolveTimelineItemSide('alternate', 1)).toBe('left');
    expect(resolveTimelineItemSide('alternate', 2)).toBe('right');
    expect(resolveTimelineItemSide('alternate', 3)).toBe('left');
  });
});

describe('groupTimelineItemChildren', () => {
  function FakeMarker() {
    return null;
  }
  FakeMarker.displayName = 'Timeline.Marker';

  function FakeContent() {
    return null;
  }
  FakeContent.displayName = 'Timeline.Content';

  it('sorts children into their part by displayName', () => {
    const groups = groupTimelineItemChildren([
      React.createElement(FakeMarker, { key: 'm' }),
      React.createElement(FakeContent, { key: 'c' }),
    ]);

    expect(groups.marker).toHaveLength(1);
    expect(groups.content).toHaveLength(1);
    expect(groups.connector).toHaveLength(0);
    expect(groups.opposite).toHaveLength(0);
  });

  it('drops a child that matches none of the four known parts', () => {
    const groups = groupTimelineItemChildren([
      React.createElement(FakeMarker, { key: 'm' }),
      React.createElement('span', { key: 'stray' }),
    ]);

    expect(groups.marker).toHaveLength(1);
    const total =
      groups.marker.length +
      groups.connector.length +
      groups.content.length +
      groups.opposite.length;
    expect(total).toBe(1);
  });
});
