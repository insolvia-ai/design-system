// Direct unit tests for the pure logic BOTH leaves execute — the default
// label formatters, the clear-on-reclick rule, roving tabindex, and the
// keyboard grammar table. Pinned here once instead of once per platform, the
// same split switch.props.test.ts documents for its own state machine.
import { describe, expect, it } from 'vitest';

import {
  defaultFormatItemLabel,
  formatValueLabel,
  nextValueOnPress,
  ratingItemTabIndex,
  ratingKeyIntent,
} from './rating.props';

describe('defaultFormatItemLabel', () => {
  it('singularizes exactly 1', () => {
    expect(defaultFormatItemLabel(1)).toBe('1 star');
  });

  it('pluralizes everything else', () => {
    expect(defaultFormatItemLabel(2)).toBe('2 stars');
    expect(defaultFormatItemLabel(5)).toBe('5 stars');
  });
});

describe('formatValueLabel', () => {
  it('reads "n of max stars"', () => {
    expect(formatValueLabel(3, 5)).toBe('3 of 5 stars');
  });

  it('reads 0 for an unrated value', () => {
    expect(formatValueLabel(null, 5)).toBe('0 of 5 stars');
  });
});

describe('nextValueOnPress', () => {
  it('sets an unrated value', () => {
    expect(nextValueOnPress(null, 3)).toBe(3);
  });

  it('replaces a different value', () => {
    expect(nextValueOnPress(2, 4)).toBe(4);
  });

  it('clears when the pressed star already IS the value', () => {
    expect(nextValueOnPress(3, 3)).toBeNull();
  });
});

describe('ratingItemTabIndex', () => {
  it('makes the star matching the value the only tabbable one', () => {
    expect(ratingItemTabIndex(3, 3)).toBe(0);
    expect(ratingItemTabIndex(2, 3)).toBe(-1);
  });

  it('falls back to the first star when nothing is rated', () => {
    expect(ratingItemTabIndex(1, null)).toBe(0);
    expect(ratingItemTabIndex(2, null)).toBe(-1);
  });
});

describe('ratingKeyIntent', () => {
  it('ArrowRight/ArrowUp increase, clamped at max', () => {
    expect(ratingKeyIntent('ArrowRight', 2, 5)).toEqual({ kind: 'set', value: 3 });
    expect(ratingKeyIntent('ArrowUp', 5, 5)).toEqual({ kind: 'none' });
  });

  it('ArrowLeft/ArrowDown decrease, clamped at 1', () => {
    expect(ratingKeyIntent('ArrowLeft', 2, 5)).toEqual({ kind: 'set', value: 1 });
    expect(ratingKeyIntent('ArrowDown', 1, 5)).toEqual({ kind: 'none' });
  });

  it('any arrow from an unrated value starts at 1', () => {
    expect(ratingKeyIntent('ArrowRight', null, 5)).toEqual({ kind: 'set', value: 1 });
    expect(ratingKeyIntent('ArrowLeft', null, 5)).toEqual({ kind: 'set', value: 1 });
  });

  it('Home jumps to 1, End jumps to max', () => {
    expect(ratingKeyIntent('Home', 4, 5)).toEqual({ kind: 'set', value: 1 });
    expect(ratingKeyIntent('End', 1, 10)).toEqual({ kind: 'set', value: 10 });
  });

  it('Backspace/Delete clear a rated value', () => {
    expect(ratingKeyIntent('Backspace', 3, 5)).toEqual({ kind: 'clear' });
    expect(ratingKeyIntent('Delete', 1, 5)).toEqual({ kind: 'clear' });
  });

  it('Backspace/Delete are no-ops when already unrated', () => {
    expect(ratingKeyIntent('Backspace', null, 5)).toEqual({ kind: 'none' });
  });

  it('any other key is a no-op', () => {
    expect(ratingKeyIntent('a', 2, 5)).toEqual({ kind: 'none' });
  });
});
