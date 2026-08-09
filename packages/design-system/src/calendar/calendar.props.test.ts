// Direct unit tests for the shared month maths and keyboard grammar — the part
// BOTH leaves execute. The range check, the ISO parse and the zero-padding
// moved to `src/lib/date.ts` in 0.12.0 and are tested there; what is left here
// is what only a GRID needs. Calendar arithmetic is where hand-rolled date pickers go
// wrong, and none of it is visible in a rendering test: a grid that silently
// skips February still renders 42 cells.
import { describe, expect, it } from 'vitest';

import { calendarKeyIntent, monthGrid, monthLabel, shiftDays, shiftMonths } from './calendar.props';

describe('monthGrid', () => {
  it('always returns six full weeks', () => {
    // A grid that changed height as you page would move the controls under it,
    // and the button you were about to press ends up somewhere else.
    for (const [year, month] of [
      [2026, 2],
      [2026, 3],
      [2024, 2],
      [2026, 8],
    ] as const) {
      const weeks = monthGrid(year, month);
      expect(weeks).toHaveLength(6);
      for (const week of weeks) expect(week).toHaveLength(7);
    }
  });

  it('starts each week on Monday', () => {
    // 1 March 2026 is a Sunday, so the first row runs 23 Feb – 1 Mar.
    const weeks = monthGrid(2026, 3);
    expect(weeks[0]?.[0]?.iso).toBe('2026-02-23');
    expect(weeks[0]?.[6]?.iso).toBe('2026-03-01');
  });

  it('marks borrowed days as out of month', () => {
    const weeks = monthGrid(2026, 3);
    expect(weeks[0]?.[0]?.inMonth).toBe(false);
    expect(weeks[0]?.[6]?.inMonth).toBe(true);
  });

  it('crosses a year boundary in both directions', () => {
    expect(monthGrid(2026, 1)[0]?.[0]?.iso.startsWith('2025-12')).toBe(true);
    const december = monthGrid(2025, 12);
    expect(december[5]?.[6]?.iso.startsWith('2026-01')).toBe(true);
  });

  it('handles a leap February', () => {
    const days = monthGrid(2024, 2)
      .flat()
      .filter((day) => day.inMonth);
    expect(days).toHaveLength(29);
    expect(days[28]?.iso).toBe('2024-02-29');
  });
});

describe('shiftDays', () => {
  it('crosses months and years', () => {
    expect(shiftDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftDays('2025-12-31', 1)).toBe('2026-01-01');
  });

  it('crosses a leap day', () => {
    expect(shiftDays('2024-02-28', 1)).toBe('2024-02-29');
  });
});

describe('shiftMonths', () => {
  it('CLAMPS the day rather than rolling over', () => {
    // JS's own Date rolls 31 January + 1 month to 3 March, which is how a
    // "next month" button skips February entirely.
    expect(shiftMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(shiftMonths('2024-01-31', 1)).toBe('2024-02-29');
    expect(shiftMonths('2026-03-31', -1)).toBe('2026-02-28');
  });

  it('crosses years in both directions', () => {
    expect(shiftMonths('2026-01-15', -1)).toBe('2025-12-15');
    expect(shiftMonths('2025-12-15', 1)).toBe('2026-01-15');
  });
});

describe('calendarKeyIntent', () => {
  it('moves by a day, a week and a month', () => {
    expect(calendarKeyIntent('ArrowRight', '2026-03-10')).toEqual({
      kind: 'focus',
      iso: '2026-03-11',
    });
    expect(calendarKeyIntent('ArrowDown', '2026-03-10')).toEqual({
      kind: 'focus',
      iso: '2026-03-17',
    });
    expect(calendarKeyIntent('PageDown', '2026-03-10')).toEqual({
      kind: 'focus',
      iso: '2026-04-10',
    });
  });

  it('jumps to the ends of the WEEK, not the month', () => {
    // 11 March 2026 is a Wednesday; its week runs Mon 9th to Sun 15th.
    expect(calendarKeyIntent('Home', '2026-03-11')).toEqual({ kind: 'focus', iso: '2026-03-09' });
    expect(calendarKeyIntent('End', '2026-03-11')).toEqual({ kind: 'focus', iso: '2026-03-15' });
  });

  it('selects on Enter and Space', () => {
    expect(calendarKeyIntent('Enter', '2026-03-10')).toEqual({
      kind: 'select',
      iso: '2026-03-10',
    });
    expect(calendarKeyIntent(' ', '2026-03-10')).toEqual({ kind: 'select', iso: '2026-03-10' });
  });

  it('ignores anything else', () => {
    expect(calendarKeyIntent('a', '2026-03-10')).toEqual({ kind: 'none' });
    expect(calendarKeyIntent('Escape', '2026-03-10')).toEqual({ kind: 'none' });
  });
});

describe('formatting helpers', () => {
  it('names the month on screen', () => {
    expect(monthLabel('2026-03-01')).toBe('March 2026');
  });
});
