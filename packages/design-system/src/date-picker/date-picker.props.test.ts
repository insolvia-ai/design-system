// Direct unit tests for the picker's shared value handling — the composition,
// the day clamp, and the sentence the live region reads out. The range marking
// is not here because it is only observable as a disabled ROW; it is asserted
// against the rendered leaves instead.
import { describe, expect, it } from 'vitest';

import { clampDay, compose, decompose, defaultValueFor, summarise } from './date-picker.props';

describe('decompose / compose', () => {
  it('round-trips each mode in its own shape', () => {
    for (const [mode, value] of [
      ['date', '2026-03-11'],
      ['time', '09:30'],
      ['datetime', '2026-03-11T09:30'],
    ] as const) {
      const fields = decompose(mode, value);
      expect(fields).not.toBeNull();
      expect(compose(mode, fields!)).toBe(value);
    }
  });

  it('rejects a value in another mode’s shape', () => {
    // A caller switching `mode` holds one of these for exactly one render, so
    // this has to be a `null` the picker can fall back from, never a throw.
    expect(decompose('date', '09:30')).toBeNull();
    expect(decompose('time', '2026-03-11')).toBeNull();
    expect(decompose('datetime', '2026-03-11')).toBeNull();
  });

  it('rejects a date that does not exist', () => {
    expect(decompose('date', '2026-02-30')).toBeNull();
    expect(decompose('datetime', '2026-03-11T25:00')).toBeNull();
  });
});

describe('clampDay', () => {
  it('pulls a day back into the month it landed in', () => {
    // 31 January plus a switch to February is the 28th. JS's own Date rolls
    // forward to 3 March, which is how a month change skips February entirely.
    expect(clampDay({ year: 2026, month: 2, day: 31, hour: 0, minute: 0 }).day).toBe(28);
    expect(clampDay({ year: 2024, month: 2, day: 31, hour: 0, minute: 0 }).day).toBe(29);
    expect(clampDay({ year: 2026, month: 4, day: 31, hour: 0, minute: 0 }).day).toBe(30);
  });

  it('leaves a day the month actually has', () => {
    expect(clampDay({ year: 2026, month: 3, day: 31, hour: 0, minute: 0 }).day).toBe(31);
  });
});

describe('defaultValueFor', () => {
  it('starts on `today` when there is one', () => {
    expect(defaultValueFor('date', '2026-03-11')).toBe('2026-03-11');
    expect(defaultValueFor('datetime', '2026-03-11')).toBe('2026-03-11T09:00');
  });

  it('never opens a time picker on midnight, which reads as broken', () => {
    expect(defaultValueFor('time', '2026-03-11')).toBe('09:00');
  });

  it('still has somewhere to start with no `today` at all', () => {
    // The component must not read the clock — see the `today` prop.
    expect(defaultValueFor('date', undefined)).toBe('2024-01-01');
  });
});

describe('summarise', () => {
  it('says the whole selection, which no single column does', () => {
    expect(summarise('date', '2026-03-11', 24)).toBe('11 Mar 2026');
    expect(summarise('time', '09:30', 24)).toBe('09:30');
    expect(summarise('datetime', '2026-03-11T09:30', 24)).toBe('11 Mar 2026, 09:30');
  });

  it('follows the displayed hour cycle rather than the stored one', () => {
    expect(summarise('time', '13:05', 12)).toBe('1:05 PM');
    expect(summarise('time', '00:05', 12)).toBe('12:05 AM');
    expect(summarise('time', '12:00', 12)).toBe('12:00 PM');
  });

  it('falls back to the raw value rather than inventing one', () => {
    expect(summarise('date', 'nonsense', 24)).toBe('nonsense');
  });
});
