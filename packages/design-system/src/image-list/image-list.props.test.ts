import { describe, expect, it } from 'vitest';

import { spanStyle } from './image-list.props';

describe('spanStyle', () => {
  it('emits nothing under the standard variant, whatever rows/cols are asked for', () => {
    expect(spanStyle('standard', 2, 3)).toEqual({});
  });

  it('emits nothing for a 1x1 tile under quilted — the common case writes nothing', () => {
    expect(spanStyle('quilted', 1, 1)).toEqual({});
  });

  it('emits only the row span when cols is left at 1', () => {
    expect(spanStyle('quilted', 3, 1)).toEqual({ gridRow: 'span 3' });
  });

  it('emits only the column span when rows is left at 1', () => {
    expect(spanStyle('quilted', 1, 2)).toEqual({ gridColumn: 'span 2' });
  });

  it('emits both spans when both are requested', () => {
    expect(spanStyle('quilted', 2, 2)).toEqual({ gridRow: 'span 2', gridColumn: 'span 2' });
  });
});
