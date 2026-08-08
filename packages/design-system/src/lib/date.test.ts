// Direct unit tests for the shared date/time arithmetic — the part BOTH leaves
// execute. This is where hand-rolled date pickers go wrong, and none of it is
// visible in a rendering test: a day wheel that silently offers 31 February
// still renders a perfectly good column of numbers.
//
// The leap-year, `isRealDate` and range cases came from
// `date-input.props.test.ts` and `calendar.props.test.ts` when DatePicker
// replaced both components in 0.12.0. They test the same functions; only the
// import path moved.
import { describe, expect, it } from 'vitest';

import {
  clampToRange,
  dayItems,
  daysInMonth,
  hourItems,
  isOutOfRange,
  isRealDate,
  isoFor,
  joinDateTime,
  minuteItems,
  monthItems,
  parseIso,
  parseTime,
  periodItems,
  snapMinute,
  splitDateTime,
  timeFor,
  to12Hour,
  to24Hour,
  yearItems,
} from './date';

describe('daysInMonth', () => {
  it('knows the short months', () => {
    expect(daysInMonth(2019, 4)).toBe(30);
    expect(daysInMonth(2019, 1)).toBe(31);
  });

  it('applies the full leap rule, including the century exceptions', () => {
    expect(daysInMonth(2019, 2)).toBe(28);
    expect(daysInMonth(2020, 2)).toBe(29);
    expect(daysInMonth(1900, 2)).toBe(28); // divisible by 100, not by 400
    expect(daysInMonth(2000, 2)).toBe(29); // divisible by 400
  });
});

describe('isRealDate', () => {
  it('rejects dates the calendar does not have', () => {
    expect(isRealDate(2019, 2, 30)).toBe(false);
    expect(isRealDate(2019, 13, 1)).toBe(false);
    expect(isRealDate(2019, 0, 1)).toBe(false);
    expect(isRealDate(2019, 4, 31)).toBe(false);
    expect(isRealDate(2019, 1, 0)).toBe(false);
  });

  it('accepts the awkward real ones', () => {
    expect(isRealDate(2020, 2, 29)).toBe(true);
    expect(isRealDate(2019, 12, 31)).toBe(true);
  });
});

describe('parseIso', () => {
  it('rejects a date that does not exist', () => {
    // `new Date('2026-02-30')` yields March 2nd without complaint. This is the
    // whole reason the check is arithmetic instead.
    expect(parseIso('2026-02-30')).toBeNull();
    expect(parseIso('2026-13-01')).toBeNull();
    expect(parseIso('not-a-date')).toBeNull();
  });

  it('accepts a real one', () => {
    expect(parseIso('2024-02-29')).toEqual({ year: 2024, month: 2, day: 29 });
  });
});

describe('isoFor', () => {
  it('zero-pads every field', () => {
    expect(isoFor(2026, 3, 1)).toBe('2026-03-01');
    expect(isoFor(999, 12, 31)).toBe('0999-12-31');
  });
});

describe('parseTime', () => {
  it('accepts a real time of day', () => {
    expect(parseTime('00:00')).toEqual({ hour: 0, minute: 0 });
    expect(parseTime('23:59')).toEqual({ hour: 23, minute: 59 });
  });

  it('rejects an hour or minute that does not exist', () => {
    expect(parseTime('24:00')).toBeNull();
    expect(parseTime('12:60')).toBeNull();
    expect(parseTime('9:30')).toBeNull(); // not zero-padded, so not our shape
    expect(parseTime('')).toBeNull();
  });
});

describe('timeFor', () => {
  it('zero-pads both fields', () => {
    expect(timeFor(9, 5)).toBe('09:05');
    expect(timeFor(0, 0)).toBe('00:00');
  });
});

describe('12-hour conversion', () => {
  it('calls midnight and noon both 12', () => {
    // `hour % 12` alone gives 0 for each, which is the bug this exists to avoid.
    expect(to12Hour(0)).toEqual({ hour: 12, period: 'AM' });
    expect(to12Hour(12)).toEqual({ hour: 12, period: 'PM' });
  });

  it('round-trips every hour of the day', () => {
    for (let hour = 0; hour < 24; hour++) {
      const { hour: hour12, period } = to12Hour(hour);
      expect(to24Hour(hour12, period)).toBe(hour);
    }
  });
});

describe('splitDateTime / joinDateTime', () => {
  it('round-trips the shape the picker stores', () => {
    expect(splitDateTime('2026-03-11T09:30')).toEqual({ date: '2026-03-11', time: '09:30' });
    expect(joinDateTime('2026-03-11', '09:30')).toBe('2026-03-11T09:30');
  });

  it('keeps the wall clock out of a value carrying seconds or a zone', () => {
    // What `Date.toISOString()` produces. Tolerated on input rather than
    // rejected, so a caller handing this an instant gets the time they wrote.
    expect(splitDateTime('2026-03-11T09:30:00Z')).toEqual({
      date: '2026-03-11',
      time: '09:30',
    });
  });

  it('rejects a value whose halves are not both real', () => {
    expect(splitDateTime('2026-02-30T09:30')).toBeNull();
    expect(splitDateTime('2026-03-11T25:00')).toBeNull();
    expect(splitDateTime('2026-03-11')).toBeNull();
  });
});

describe('isOutOfRange', () => {
  it('compares lexicographically', () => {
    expect(isOutOfRange('2026-03-01', '2026-03-02', undefined)).toBe(true);
    expect(isOutOfRange('2026-03-03', undefined, '2026-03-02')).toBe(true);
    expect(isOutOfRange('2026-03-02', '2026-03-01', '2026-03-03')).toBe(false);
  });

  it('treats the bounds as inclusive', () => {
    expect(isOutOfRange('2026-03-01', '2026-03-01', '2026-03-01')).toBe(false);
  });

  it('compares across century and month boundaries as dates, not numbers', () => {
    expect(isOutOfRange('2019-09-30', undefined, '2019-10-01')).toBe(false);
    expect(isOutOfRange('2100-01-01', undefined, '2099-12-31')).toBe(true);
  });

  it('works unchanged on times and datetimes', () => {
    expect(isOutOfRange('08:30', '09:00', undefined)).toBe(true);
    expect(isOutOfRange('2026-03-11T09:30', '2026-03-11T09:00', '2026-03-11T17:00')).toBe(false);
  });
});

describe('clampToRange', () => {
  it('pulls a value to the bound it passed', () => {
    expect(clampToRange('2026-03-01', '2026-03-05', undefined)).toBe('2026-03-05');
    expect(clampToRange('2026-03-09', undefined, '2026-03-05')).toBe('2026-03-05');
  });

  it('leaves an in-range value alone', () => {
    expect(clampToRange('2026-03-03', '2026-03-01', '2026-03-05')).toBe('2026-03-03');
  });
});

describe('dayItems', () => {
  it('offers exactly the days the month has', () => {
    expect(dayItems(2026, 2)).toHaveLength(28);
    expect(dayItems(2024, 2)).toHaveLength(29);
    expect(dayItems(2026, 4)).toHaveLength(30);
    expect(dayItems(2026, 1)).toHaveLength(31);
  });

  it('pads the value and not the label', () => {
    // The value has to sort; the label sits under a column already headed
    // "Day", where "05" reads as a code rather than a date.
    expect(dayItems(2026, 3)[4]).toEqual({ value: '05', label: '5' });
  });
});

describe('monthItems', () => {
  it('names all twelve, one-based and abbreviated', () => {
    const items = monthItems();
    expect(items).toHaveLength(12);
    expect(items[0]).toEqual({ value: '01', label: 'Jan' });
    expect(items[8]).toEqual({ value: '09', label: 'Sep' });
    expect(items[11]).toEqual({ value: '12', label: 'Dec' });
  });
});

describe('yearItems', () => {
  it('runs inclusive and ascending', () => {
    const items = yearItems(2024, 2026);
    expect(items.map((item) => item.value)).toEqual(['2024', '2025', '2026']);
  });
});

describe('hourItems', () => {
  it('gives 24 zero-padded hours on a 24-hour cycle', () => {
    const items = hourItems(24);
    expect(items).toHaveLength(24);
    expect(items[0]).toEqual({ value: '00', label: '00' });
    expect(items[23]).toEqual({ value: '23', label: '23' });
  });

  it('stores 24-hour values even while displaying a 12-hour clock', () => {
    // The label is the only thing the cycle changes. That is what lets the
    // AM/PM column stay a separate wheel neither side has to know about.
    const morning = hourItems(12, 'AM');
    expect(morning[0]).toEqual({ value: '00', label: '12' });
    expect(morning[1]).toEqual({ value: '01', label: '1' });

    const afternoon = hourItems(12, 'PM');
    expect(afternoon[0]).toEqual({ value: '12', label: '12' });
    expect(afternoon[1]).toEqual({ value: '13', label: '1' });
  });
});

describe('minuteItems', () => {
  it('steps by the interval and always divides the hour evenly', () => {
    expect(minuteItems(1)).toHaveLength(60);
    expect(minuteItems(15).map((item) => item.value)).toEqual(['00', '15', '30', '45']);
    expect(minuteItems(30).map((item) => item.value)).toEqual(['00', '30']);
  });
});

describe('snapMinute', () => {
  it('rounds DOWN to the nearest step', () => {
    // Never invents time that has not happened.
    expect(snapMinute(7, 15)).toBe(0);
    expect(snapMinute(44, 15)).toBe(30);
    expect(snapMinute(45, 15)).toBe(45);
    expect(snapMinute(7, 1)).toBe(7);
  });
});

describe('periodItems', () => {
  it('is AM then PM', () => {
    expect(periodItems().map((item) => item.value)).toEqual(['AM', 'PM']);
  });
});
