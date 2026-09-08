// Direct unit tests for the state machine — the part both leaves execute, and
// the part that decides what "no gaps" actually means at each edge.
import { describe, expect, it } from 'vitest';

import {
  acceptChar,
  deleteAt,
  distributePaste,
  nextIndex,
  normalizeChar,
  prevIndex,
  setCharAt,
} from './pin-input.props';

describe('acceptChar', () => {
  it('numeric accepts digits only', () => {
    expect(acceptChar('numeric', '5')).toBe(true);
    expect(acceptChar('numeric', 'a')).toBe(false);
    expect(acceptChar('numeric', ' ')).toBe(false);
  });

  it('alphanumeric accepts letters and digits, either case', () => {
    expect(acceptChar('alphanumeric', '5')).toBe(true);
    expect(acceptChar('alphanumeric', 'a')).toBe(true);
    expect(acceptChar('alphanumeric', 'A')).toBe(true);
    expect(acceptChar('alphanumeric', '-')).toBe(false);
  });

  it('rejects anything but exactly one character', () => {
    expect(acceptChar('alphanumeric', '')).toBe(false);
    expect(acceptChar('alphanumeric', 'ab')).toBe(false);
  });
});

describe('normalizeChar', () => {
  it('uppercases for alphanumeric, leaves numeric untouched', () => {
    expect(normalizeChar('alphanumeric', 'a')).toBe('A');
    expect(normalizeChar('numeric', '5')).toBe('5');
  });
});

describe('setCharAt', () => {
  it('appends at the end of the filled prefix', () => {
    expect(setCharAt('', 0, '1')).toBe('1');
    expect(setCharAt('12', 2, '3')).toBe('123');
  });

  it('replaces a character inside the prefix without touching the rest', () => {
    expect(setCharAt('123', 1, '9')).toBe('193');
  });

  it('clamps an index past the prefix to the append position — no gap is ever produced', () => {
    expect(setCharAt('12', 5, '3')).toBe('123');
  });
});

describe('deleteAt', () => {
  it('removes a character and shifts the rest left', () => {
    expect(deleteAt('123', 1)).toBe('13');
    expect(deleteAt('123', 0)).toBe('23');
  });

  it('is a no-op past the filled prefix', () => {
    expect(deleteAt('12', 4)).toBe('12');
    expect(deleteAt('', 0)).toBe('');
  });
});

describe('distributePaste', () => {
  it('fills from the given index with the pasted digits', () => {
    expect(distributePaste('', 0, '123456', 6, 'numeric')).toBe('123456');
  });

  it('drops characters the type rejects rather than stopping short', () => {
    expect(distributePaste('', 0, '123-456', 6, 'numeric')).toBe('123456');
  });

  it('clips to length', () => {
    expect(distributePaste('', 0, '12345678', 6, 'numeric')).toBe('123456');
  });

  it('uppercases for alphanumeric', () => {
    expect(distributePaste('', 0, 'ab12', 6, 'alphanumeric')).toBe('AB12');
  });

  it('overwrites from the clamped index rather than merging past it', () => {
    expect(distributePaste('12', 5, '9', 6, 'numeric')).toBe('129');
  });

  it('leaves the value untouched when nothing pasted survives the filter', () => {
    expect(distributePaste('12', 0, '--', 6, 'numeric')).toBe('12');
  });
});

describe('nextIndex / prevIndex', () => {
  it('advance and retreat, clamped to the row', () => {
    expect(nextIndex(0, 6)).toBe(1);
    expect(nextIndex(5, 6)).toBe(5);
    expect(prevIndex(1)).toBe(0);
    expect(prevIndex(0)).toBe(0);
  });
});
