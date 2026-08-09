// Direct unit tests for the mask, the display format and the status — the part
// BOTH leaves execute, and the part that decides whether a half-typed date can
// reach a caller.
import { describe, expect, it } from 'vitest';

import {
  dateStatus,
  DEFAULT_FORMAT,
  isErrorStatus,
  maskFor,
  parseFormat,
  resolveFormat,
  toText,
  toValue,
} from './date-input.props';

/** The default for each mode, so the common cases read without a format argument. */
const ISO = undefined;

describe('maskFor', () => {
  it('groups digits as they are typed, per mode', () => {
    expect(maskFor('date', ISO, '2')).toBe('2');
    expect(maskFor('date', ISO, '20190')).toBe('2019-0');
    expect(maskFor('date', ISO, '20190214')).toBe('2019-02-14');
    expect(maskFor('time', ISO, '093')).toBe('09:3');
    expect(maskFor('datetime', ISO, '201902140930')).toBe('2019-02-14 09:30');
  });

  it('never emits a trailing separator', () => {
    // This is what keeps Backspace working without any previous-text
    // bookkeeping: the field is never in a state where the last character is a
    // separator that a delete would remove instead of a digit.
    expect(maskFor('date', ISO, '2019')).toBe('2019');
    expect(maskFor('date', ISO, '201902')).toBe('2019-02');
    expect(maskFor('date', 'MM/DD/YYYY', '02')).toBe('02');
    expect(maskFor('date', 'MM/DD/YYYY', '0214')).toBe('02/14');
  });

  it('accepts a whole value pasted in any punctuation', () => {
    expect(maskFor('date', ISO, '2019/02/14')).toBe('2019-02-14');
    expect(maskFor('datetime', ISO, '2019-02-14T09:30')).toBe('2019-02-14 09:30');
  });

  it('ignores letters and stops at the digits the format has', () => {
    expect(maskFor('date', ISO, 'abc')).toBe('');
    expect(maskFor('date', ISO, '201902144444')).toBe('2019-02-14');
    expect(maskFor('time', ISO, '09305555')).toBe('09:30');
  });
});

describe('a caller-chosen format', () => {
  it('types in the order the format asks for', () => {
    // 14 February 2019, typed month-first.
    expect(maskFor('date', 'MM/DD/YYYY', '02142019')).toBe('02/14/2019');
    expect(maskFor('date', 'DD.MM.YYYY', '14022019')).toBe('14.02.2019');
  });

  it('still STORES the same ISO value, whatever it shows', () => {
    // The whole point: display is presentation, storage is canonical — which is
    // what keeps min/max a lexicographic compare on one shape.
    expect(toValue('date', 'MM/DD/YYYY', '02/14/2019')).toBe('2019-02-14');
    expect(toValue('date', 'DD.MM.YYYY', '14.02.2019')).toBe('2019-02-14');
    expect(toValue('date', ISO, '2019-02-14')).toBe('2019-02-14');
  });

  it('reads a stored value back out in the display order', () => {
    expect(toText('date', 'MM/DD/YYYY', '2019-02-14')).toBe('02/14/2019');
    expect(toText('date', 'DD.MM.YYYY', '2019-02-14')).toBe('14.02.2019');
    expect(toText('datetime', 'DD/MM/YYYY HH:mm', '2019-02-14T09:30')).toBe('14/02/2019 09:30');
  });

  it('tells a month from a minute by CASE, which is the one real trap', () => {
    // `MM` and `mm` are the same width, so a mix-up produces a mask that works
    // and a value wrong by months. The fields are matched by TOKEN, not by
    // position, so even a nonsensical order lands each digit pair correctly.
    expect(toValue('datetime', 'MM/DD/YYYY HH:mm', '02/14/2019 09:30')).toBe('2019-02-14T09:30');
    expect(toValue('datetime', 'mm HH DD MM YYYY', '30 09 14 02 2019')).toBe('2019-02-14T09:30');
  });

  it('round-trips any format through the value and back', () => {
    for (const format of ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD.MM.YYYY', 'DD MM YYYY']) {
      const stored = toValue('date', format, toText('date', format, '2019-02-14'));
      expect(stored).toBe('2019-02-14');
    }
  });

  it('REJECTS a format that does not fit the mode, rather than ignoring it', () => {
    // Silently falling back would be a field that does not do what it was told.
    expect(() => parseFormat('date', 'MM/DD')).toThrow(/does not fit mode "date"/);
    expect(() => parseFormat('date', 'YYYY-MM-DD HH:mm')).toThrow(/does not fit/);
    expect(() => parseFormat('time', 'MM:mm')).toThrow(/does not fit mode "time"/);
    expect(() => parseFormat('date', 'YYYY-MM-MM')).toThrow(/does not fit/);
  });

  it('accepts any punctuation between the fields', () => {
    expect(maskFor('datetime', 'DD/MM/YYYY, HH:mm', '140220190930')).toBe('14/02/2019, 09:30');
  });
});

describe('resolveFormat', () => {
  it('falls back to the mode’s ISO order', () => {
    expect(resolveFormat('date', undefined)).toBe(DEFAULT_FORMAT.date);
    expect(resolveFormat('date', 'MM/DD/YYYY')).toBe('MM/DD/YYYY');
  });
});

describe('toValue', () => {
  it('returns the stored value only when the entry is complete and real', () => {
    expect(toValue('date', ISO, '2019-02-14')).toBe('2019-02-14');
    expect(toValue('date', ISO, '2019-02-1')).toBeNull();
    expect(toValue('time', ISO, '09:30')).toBe('09:30');
    expect(toValue('date', ISO, '')).toBeNull();
  });

  it('stores datetime with a T where the field shows a space', () => {
    // `T` is what sorts, and what ../lib/date is built around; a `T` on screen
    // reads as a typo to whoever is typing.
    expect(toValue('datetime', ISO, '2019-02-14 09:30')).toBe('2019-02-14T09:30');
    expect(toText('datetime', ISO, '2019-02-14T09:30')).toBe('2019-02-14 09:30');
  });

  it('refuses a moment that rolls over rather than silently accepting it', () => {
    // `new Date('2019-02-30')` yields March 2nd without complaint. This is the
    // whole reason the check is arithmetic instead.
    expect(toValue('date', ISO, '2019-02-30')).toBeNull();
    expect(toValue('date', 'MM/DD/YYYY', '02/30/2019')).toBeNull();
    expect(toValue('time', ISO, '25:00')).toBeNull();
    expect(toValue('time', ISO, '09:60')).toBeNull();
    expect(toValue('datetime', ISO, '2019-02-14 25:00')).toBeNull();
  });
});

describe('dateStatus', () => {
  it('separates empty from half-typed', () => {
    expect(dateStatus('date', ISO, '')).toBe('empty');
    expect(dateStatus('date', ISO, '2019-0')).toBe('incomplete');
    expect(dateStatus('datetime', ISO, '2019-02-14')).toBe('incomplete');
    expect(dateStatus('date', 'MM/DD/YYYY', '02/14')).toBe('incomplete');
  });

  it('reports an impossible moment as invalid', () => {
    expect(dateStatus('date', ISO, '2019-02-30')).toBe('invalid');
    expect(dateStatus('time', ISO, '25:00')).toBe('invalid');
  });

  it('applies min and max inclusively, against the STORED value', () => {
    expect(dateStatus('date', ISO, '2019-02-14', '2019-02-14')).toBe('valid');
    expect(dateStatus('date', ISO, '2019-02-13', '2019-02-14')).toBe('out-of-range');
    expect(dateStatus('date', ISO, '2019-02-15', undefined, '2019-02-14')).toBe('out-of-range');
    expect(dateStatus('time', ISO, '08:30', '09:00')).toBe('out-of-range');
    // Same bounds, same answer, through a reordered display format.
    expect(dateStatus('date', 'MM/DD/YYYY', '02/13/2019', '2019-02-14')).toBe('out-of-range');
    expect(dateStatus('date', 'MM/DD/YYYY', '02/14/2019', '2019-02-14')).toBe('valid');
  });

  it('compares across century and month boundaries as moments, not numbers', () => {
    expect(dateStatus('date', ISO, '2019-09-30', undefined, '2019-10-01')).toBe('valid');
    expect(dateStatus('date', ISO, '2100-01-01', undefined, '2099-12-31')).toBe('out-of-range');
  });
});

describe('isErrorStatus', () => {
  it('does not call a half-typed entry an error', () => {
    // Marking a field red while someone is still typing the year is what
    // teaches people to ignore error styling.
    expect(isErrorStatus('incomplete')).toBe(false);
    expect(isErrorStatus('empty')).toBe(false);
  });

  it('does call an impossible or out-of-range one an error', () => {
    expect(isErrorStatus('invalid')).toBe(true);
    expect(isErrorStatus('out-of-range')).toBe(true);
  });
});
