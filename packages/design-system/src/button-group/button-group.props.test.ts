import { describe, expect, it } from 'vitest';

import { buttonGroupItemClass, buttonGroupPosition } from './button-group.props';

describe('buttonGroupPosition', () => {
  it('a single sibling is "only"', () => {
    expect(buttonGroupPosition(0, 1)).toBe('only');
  });

  it('the first of several is "first", the last is "last", the rest are "middle"', () => {
    expect(buttonGroupPosition(0, 4)).toBe('first');
    expect(buttonGroupPosition(1, 4)).toBe('middle');
    expect(buttonGroupPosition(2, 4)).toBe('middle');
    expect(buttonGroupPosition(3, 4)).toBe('last');
  });

  it('two siblings are "first" and "last", with no "middle"', () => {
    expect(buttonGroupPosition(0, 2)).toBe('first');
    expect(buttonGroupPosition(1, 2)).toBe('last');
  });
});

describe('buttonGroupItemClass', () => {
  it('detached: exactly buttonClass, no border or rounding overrides', () => {
    const cls = buttonGroupItemClass({
      intent: 'secondary',
      size: 'md',
      orientation: 'horizontal',
      attached: false,
      position: 'first',
    });

    expect(cls).toContain('rounded-md');
    expect(cls).not.toContain('border-line');
    expect(cls).not.toContain('-ml-px');
  });

  it('attached middle: no corner rounded, overlapped, bordered', () => {
    const cls = buttonGroupItemClass({
      intent: 'secondary',
      size: 'md',
      orientation: 'horizontal',
      attached: true,
      position: 'middle',
    });

    expect(cls).toContain('rounded-none');
    expect(cls).toContain('border-line');
    expect(cls).toContain('-ml-px');
    expect(cls).not.toContain('rounded-l-md');
    expect(cls).not.toContain('rounded-r-md');
  });

  it('attached first (horizontal): only the left corners round, no overlap', () => {
    const cls = buttonGroupItemClass({
      intent: 'secondary',
      size: 'md',
      orientation: 'horizontal',
      attached: true,
      position: 'first',
    });

    expect(cls).toContain('rounded-none');
    expect(cls).toContain('rounded-l-md');
    expect(cls).not.toContain('-ml-px');
  });

  it('attached last (vertical): only the bottom corners round, and it overlaps upward', () => {
    const cls = buttonGroupItemClass({
      intent: 'secondary',
      size: 'md',
      orientation: 'vertical',
      attached: true,
      position: 'last',
    });

    expect(cls).toContain('rounded-b-md');
    expect(cls).toContain('-mt-px');
  });

  it('attached only: fully rounded, no overlap', () => {
    const cls = buttonGroupItemClass({
      intent: 'secondary',
      size: 'md',
      orientation: 'horizontal',
      attached: true,
      position: 'only',
    });

    expect(cls).toContain('rounded-md');
    expect(cls).not.toContain('rounded-none');
    expect(cls).not.toContain('-ml-px');
  });
});
