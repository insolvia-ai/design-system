// Direct unit tests for the shared model — the parse/clamp/step arithmetic
// both leaves execute, pinned once here instead of once per platform.
import { describe, expect, it } from 'vitest';

import { clamp, parseNumber, stepValue } from './number-input.props';

describe('parseNumber', () => {
  it('parses a plain integer or decimal', () => {
    expect(parseNumber('12')).toBe(12);
    expect(parseNumber('1.5')).toBe(1.5);
    expect(parseNumber('-3')).toBe(-3);
    expect(parseNumber('-3.25')).toBe(-3.25);
  });

  it('is null for empty text — that is the empty STATE, not an error', () => {
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('   ')).toBeNull();
  });

  it('is null for a bare sign or a bare point — nothing typed yet', () => {
    expect(parseNumber('-')).toBeNull();
    expect(parseNumber('.')).toBeNull();
    expect(parseNumber('-.')).toBeNull();
  });

  it('accepts a leading point, matching what Number() itself accepts', () => {
    expect(parseNumber('.5')).toBe(0.5);
  });

  it('rejects a locale comma — this component has no locale to guess with', () => {
    expect(parseNumber('1,5')).toBeNull();
    expect(parseNumber('1,234')).toBeNull();
  });

  it('rejects non-numeric text and exponent notation', () => {
    expect(parseNumber('abc')).toBeNull();
    expect(parseNumber('1e5')).toBeNull();
  });
});

describe('clamp', () => {
  it('folds a value into [min, max]', () => {
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('does not clamp a bound left undefined', () => {
    expect(clamp(500, undefined, undefined)).toBe(500);
    expect(clamp(-500, undefined, 10)).toBe(-500);
    expect(clamp(500, 0, undefined)).toBe(500);
  });
});

describe('stepValue', () => {
  it('steps by `step` in either direction, clamped at the bounds', () => {
    expect(stepValue(5, 'increment', 1, 0, 10)).toBe(6);
    expect(stepValue(5, 'decrement', 1, 0, 10)).toBe(4);
    expect(stepValue(10, 'increment', 1, 0, 10)).toBe(10);
    expect(stepValue(0, 'decrement', 1, 0, 10)).toBe(0);
  });

  it('starts an empty field at `min ?? 0`, not at `0 ± step`', () => {
    expect(stepValue(null, 'increment', 1, 5, 10)).toBe(5);
    expect(stepValue(null, 'decrement', 1, 5, 10)).toBe(5);
    expect(stepValue(null, 'increment', 1, undefined, undefined)).toBe(0);
  });

  it('holds fractional steps steady — no binary-float noise', () => {
    expect(stepValue(0.1, 'increment', 0.2, 0, 1)).toBe(0.3);
    expect(stepValue(3, 'increment', 0.5, 0, 10)).toBe(3.5);
  });
});
