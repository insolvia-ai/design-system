// Direct unit tests for the wheel's stepping, geometry and fade — the part BOTH
// leaves execute, and the part no rendering test can reach. jsdom computes no
// layout, so a wheel's scroll behaviour is invisible there; what CAN be checked
// is the arithmetic that turns a scroll offset into a row and a keypress into a
// value, which is where the bugs live anyway.
import { describe, expect, it } from 'vitest';

import {
  indexAtOffset,
  ITEM_HEIGHT,
  offsetForIndex,
  PAD_ITEMS,
  rowOpacity,
  stepWheel,
  valueAtOffset,
  VISIBLE_ITEMS,
  WHEEL_HEIGHT,
  WHEEL_PADDING,
  wheelKeyIntent,
  type WheelItem,
} from './wheel.props';

const items: WheelItem[] = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
  { value: 'c', label: 'C' },
  { value: 'd', label: 'D' },
];

const withGaps: WheelItem[] = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B', disabled: true },
  { value: 'c', label: 'C', disabled: true },
  { value: 'd', label: 'D' },
];

describe('geometry', () => {
  it('shows an odd number of rows, so one of them is the middle', () => {
    expect(VISIBLE_ITEMS % 2).toBe(1);
    expect(PAD_ITEMS).toBe((VISIBLE_ITEMS - 1) / 2);
  });

  it('pads by exactly the rows above and below, so the ends can be reached', () => {
    // Without this the first and last values are unreachable by scrolling —
    // the single most common bug in a hand-rolled wheel.
    expect(WHEEL_PADDING).toBe(ITEM_HEIGHT * PAD_ITEMS);
    expect(WHEEL_HEIGHT).toBe(ITEM_HEIGHT * VISIBLE_ITEMS);
  });

  it('meets the WCAG target-size floor, because a row is tappable', () => {
    expect(ITEM_HEIGHT).toBeGreaterThanOrEqual(44);
  });
});

describe('offsetForIndex / indexAtOffset', () => {
  it('round-trips', () => {
    expect(indexAtOffset(items, offsetForIndex(2))).toBe(2);
  });

  it('rounds a fractional offset to the nearest row', () => {
    // A browser's scroll position is fractional and a momentum stop lands
    // within a pixel or so; flooring would report the row above.
    expect(indexAtOffset(items, ITEM_HEIGHT * 2 - 0.4)).toBe(2);
    expect(indexAtOffset(items, ITEM_HEIGHT * 1.6)).toBe(2);
  });

  it('clamps past either end rather than reporting a row that is not there', () => {
    expect(indexAtOffset(items, -200)).toBe(0);
    expect(indexAtOffset(items, 99_999)).toBe(3);
  });
});

describe('valueAtOffset', () => {
  it('names the row the scroll settled on', () => {
    expect(valueAtOffset(items, offsetForIndex(1))).toBe('b');
  });

  it('springs off a disabled row to the nearest allowed one', () => {
    // Settling here yields a value DIFFERENT from where the finger stopped,
    // which is what makes the leaves scroll back — see the note in the leaves.
    expect(valueAtOffset(withGaps, offsetForIndex(1))).toBe('d');
    expect(valueAtOffset(withGaps, offsetForIndex(2))).toBe('d');
  });

  it('has nothing to say about an empty list', () => {
    expect(valueAtOffset([], 0)).toBeNull();
  });
});

describe('stepWheel', () => {
  it('moves one row at a time', () => {
    expect(stepWheel(items, 'b', 1, false)).toBe('c');
    expect(stepWheel(items, 'b', -1, false)).toBe('a');
  });

  it('stops at the ends when it does not loop', () => {
    expect(stepWheel(items, 'd', 1, false)).toBe('d');
    expect(stepWheel(items, 'a', -1, false)).toBe('a');
  });

  it('wraps both ways when it does', () => {
    expect(stepWheel(items, 'd', 1, true)).toBe('a');
    expect(stepWheel(items, 'a', -1, true)).toBe('d');
  });

  it('steps OVER disabled rows rather than onto them', () => {
    expect(stepWheel(withGaps, 'a', 1, false)).toBe('d');
    expect(stepWheel(withGaps, 'd', -1, false)).toBe('a');
  });

  it('turns round rather than going dead at a disabled end', () => {
    const trailingGap: WheelItem[] = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
      { value: 'c', label: 'C', disabled: true },
    ];
    expect(stepWheel(trailingGap, 'b', 1, false)).toBe('b');
  });

  it('has nothing to say about an empty list', () => {
    expect(stepWheel([], 'a', 1, false)).toBeNull();
  });
});

describe('wheelKeyIntent', () => {
  it('moves by a row on the arrows', () => {
    expect(wheelKeyIntent('ArrowDown', items, 'b', false)).toEqual({ kind: 'value', value: 'c' });
    expect(wheelKeyIntent('ArrowUp', items, 'b', false)).toEqual({ kind: 'value', value: 'a' });
  });

  it('jumps to the ends on Home and End', () => {
    expect(wheelKeyIntent('Home', items, 'c', false)).toEqual({ kind: 'value', value: 'a' });
    expect(wheelKeyIntent('End', items, 'b', false)).toEqual({ kind: 'value', value: 'd' });
  });

  it('pages by a screenful, and does NOT wrap even on a looping wheel', () => {
    // A page jump that came out the other end would leave no sense of where
    // the list had got to.
    expect(wheelKeyIntent('PageDown', items, 'a', true)).toEqual({ kind: 'value', value: 'd' });
    expect(wheelKeyIntent('PageUp', items, 'd', true)).toEqual({ kind: 'value', value: 'a' });
  });

  it('wraps the arrows on a looping wheel', () => {
    expect(wheelKeyIntent('ArrowDown', items, 'd', true)).toEqual({ kind: 'value', value: 'a' });
  });

  it('reports a move that changes nothing as no move at all', () => {
    expect(wheelKeyIntent('ArrowDown', items, 'd', false)).toEqual({ kind: 'none' });
  });

  it('sends printable characters to typeahead and ignores the rest', () => {
    expect(wheelKeyIntent('2', items, 'a', false)).toEqual({ kind: 'typeahead', char: '2' });
    expect(wheelKeyIntent('Escape', items, 'a', false)).toEqual({ kind: 'none' });
    expect(wheelKeyIntent('Shift', items, 'a', false)).toEqual({ kind: 'none' });
    expect(wheelKeyIntent(' ', items, 'a', false)).toEqual({ kind: 'none' });
  });
});

describe('rowOpacity', () => {
  it('fades with distance from the middle', () => {
    expect(rowOpacity(0)).toBe(1);
    expect(rowOpacity(1)).toBeLessThan(rowOpacity(0));
    expect(rowOpacity(2)).toBeLessThan(rowOpacity(1));
  });

  it('never fades below the contrast floor', () => {
    // Rows are ink on card, about 17:1. Fading ink towards the card colour
    // walks that ratio down, and 0.62 is where it crosses the 4.5:1 that
    // `a11y.test: 'error'` holds every story to. A prettier fade to nothing
    // would fail the gate on every story that renders a wheel.
    for (const distance of [2, 3, 10, 100]) {
      expect(rowOpacity(distance)).toBeGreaterThanOrEqual(0.62);
    }
  });

  it('treats a negative distance as the middle', () => {
    expect(rowOpacity(-1)).toBe(1);
  });
});
