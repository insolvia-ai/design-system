// Direct unit tests for `distribute` — the one piece of real logic both
// leaves share, and the part a rendering test can't pin on its own: a web
// test only sees the web leaf's DOM and a native test only sees the native
// leaf's, so neither alone can prove the two AGREE on where an item lands.
// Testing the shared function once is what proves that for both at once.
import * as React from 'react';
import { describe, expect, it } from 'vitest';

import { distribute } from './masonry.props';

// Plain strings stand in for children — `distribute` only cares about
// identity/order, not what a child renders as.
const seven = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

describe('distribute', () => {
  it('round-robins 7 items across 3 columns (row-major, the default)', () => {
    expect(distribute(seven, 3)).toEqual([
      ['a', 'd', 'g'],
      ['b', 'e'],
      ['c', 'f'],
    ]);
  });

  it('fills sequentially, column-major, when sequential=true', () => {
    // ceil(7 / 3) = 3 per column: the first two columns get 3 items each,
    // the last gets whatever remains.
    expect(distribute(seven, 3, true)).toEqual([['a', 'b', 'c'], ['d', 'e', 'f'], ['g']]);
  });

  it('returns one empty array per column for 0 items', () => {
    expect(distribute([], 3)).toEqual([[], [], []]);
    expect(distribute([], 3, true)).toEqual([[], [], []]);
  });

  it('puts everything in the one column when columns=1, either mode', () => {
    expect(distribute(seven, 1)).toEqual([seven]);
    expect(distribute(seven, 1, true)).toEqual([seven]);
  });

  it('clamps a non-positive columns count to 1', () => {
    expect(distribute(seven, 0)).toEqual([seven]);
    expect(distribute(seven, -2)).toEqual([seven]);
  });

  it('drops null/undefined/boolean children before distributing', () => {
    const withGaps: React.ReactNode[] = ['a', null, 'b', undefined, false, 'c', true];
    expect(distribute(withGaps, 3)).toEqual([['a'], ['b'], ['c']]);
  });
});
