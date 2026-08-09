// SHARED — `react`, `../lib/date`, `../lib/controllable` and Wheel's own shared
// module. No react-dom, no react-native.
//
// The whole picker apart from the elements: which columns a mode has, what rows
// each one offers, which of those rows `min`/`max` forbid, and how a change to
// one column re-composes the value. The leaves lay out a row of `<Wheel>`s and
// nothing else — the same division `select.props.ts` makes, and for the same
// reason: a picker whose columns disagreed across platforms would be two
// pickers claiming to be one.
//
// WHY WHEELS AND NOT A TEXT FIELD OR A MONTH GRID. Both of those shipped here
// first — `DateInput` and `Calendar`, removed in 0.12.0 — and this replaces
// them. The cost is worth writing down rather than rediscovering: a wheel is
// slower than typing for a date far from today, which is why every column here
// accepts DIGIT TYPEAHEAD (see `wheel.props.ts`) — typing `2011` at the year
// column jumps straight to it. And a wheel has no empty state: it always shows
// some value, so a form that means "no date chosen yet" has to say so by not
// showing the picker, rather than by showing an empty one.
//
// WHY THE VALUE IS A STRING, and why `min`/`max` are one lexicographic compare
// for all three modes, is `../lib/date`'s header.
import * as React from 'react';

import { useControllableState } from '../lib/controllable';
import {
  clampToRange,
  dayItems,
  daysInMonth,
  hourItems,
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
  type DateWheelItem,
  type MinuteInterval,
  type Period,
} from '../lib/date';
import type { WheelItem } from '../wheel/wheel.props';

export type DatePickerMode = 'date' | 'time' | 'datetime';

export type DatePickerColumnKey = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'period';

/**
 * Column widths, in px on web and dp on native.
 *
 * FIXED, and shared, for two reasons. Both leaves must size the columns
 * identically or the side-by-side comparison in the workbench is meaningless.
 * And a column that sized itself to its content would resize as its rows
 * changed — the day column alone swings between one and two digits — which
 * moves every column to its right while someone is aiming at one.
 */
export const COLUMN_WIDTH: Record<DatePickerColumnKey, number> = {
  year: 76,
  month: 64,
  day: 56,
  hour: 56,
  minute: 56,
  period: 60,
};

/** Names the column for a screen reader. A bare listbox has no accessible name. */
const COLUMN_LABEL: Record<DatePickerColumnKey, string> = {
  year: 'Year',
  month: 'Month',
  day: 'Day',
  hour: 'Hour',
  minute: 'Minute',
  period: 'AM or PM',
};

/**
 * The fields a mode is composed of, most significant first.
 *
 * The ORDER is the whole basis of the range check below: with the fields in
 * this sequence, "can any value with this row selected be in range?" is
 * answered by filling the fields after it with their smallest and largest
 * possibilities and comparing the two ends as strings. `period` is absent
 * because it is not a field — it is a second way of writing `hour`.
 */
const FIELDS: Record<DatePickerMode, readonly DatePickerColumnKey[]> = {
  date: ['year', 'month', 'day'],
  time: ['hour', 'minute'],
  datetime: ['year', 'month', 'day', 'hour', 'minute'],
};

/**
 * The columns each mode SHOWS, which is the field order with the day-month-year
 * columns reversed.
 *
 * Day first, then month, then year — the order the package's English prose
 * already uses ("5 March 2026") and the one a British reader writes. The stored
 * value stays most-significant-first regardless; this is presentation only.
 */
function columnOrder(mode: DatePickerMode, hourCycle: 12 | 24): DatePickerColumnKey[] {
  const date: DatePickerColumnKey[] = ['day', 'month', 'year'];
  const time: DatePickerColumnKey[] = ['hour', 'minute'];
  if (hourCycle === 12) time.push('period');
  if (mode === 'date') return date;
  if (mode === 'time') return time;
  return [...date, ...time];
}

/** The five numbers any mode's value decomposes into. */
interface Fields {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

/**
 * Somewhere to start when the caller gives neither a value nor a default.
 *
 * `today` is a PROP and never `new Date()`, so that a story or a test can pin
 * it — a component that reads the clock cannot be rendered twice with the same
 * result. When even that is missing, this is the date the package falls back
 * to, the same one Calendar used before it.
 */
const FALLBACK_DATE = '2024-01-01';

/**
 * And a time. Arbitrary, but deliberately not midnight: a time picker that
 * opens on `00:00` reads as broken rather than as unset.
 */
const FALLBACK_TIME = '09:00';

/** What {@link decompose} falls back to for a value in the wrong shape. */
const FALLBACK_FIELDS: Fields = { year: 2024, month: 1, day: 1, hour: 9, minute: 0 };

export function defaultValueFor(mode: DatePickerMode, today: string | undefined): string {
  const date = today ?? FALLBACK_DATE;
  if (mode === 'date') return date;
  if (mode === 'time') return FALLBACK_TIME;
  return joinDateTime(date, FALLBACK_TIME);
}

/** A mode's value split into numbers, or `null` if it is not that mode's shape. */
export function decompose(mode: DatePickerMode, value: string): Fields | null {
  if (mode === 'time') {
    const time = parseTime(value);
    return time === null ? null : { year: 2000, month: 1, day: 1, ...time };
  }
  if (mode === 'date') {
    const date = parseIso(value);
    return date === null ? null : { ...date, hour: 0, minute: 0 };
  }
  const split = splitDateTime(value);
  if (split === null) return null;
  const date = parseIso(split.date);
  const time = parseTime(split.time);
  return date === null || time === null ? null : { ...date, ...time };
}

/** The inverse of {@link decompose}. */
export function compose(mode: DatePickerMode, fields: Fields): string {
  const date = isoFor(fields.year, fields.month, fields.day);
  const time = timeFor(fields.hour, fields.minute);
  if (mode === 'date') return date;
  if (mode === 'time') return time;
  return joinDateTime(date, time);
}

/**
 * February never has a 31st, so a day that survives a month change has to be
 * pulled back to one the new month has. 31 January plus a switch to February is
 * the 28th — where JS's own `Date` rolls forward to 3 March and a month change
 * silently skips February altogether.
 */
export function clampDay(fields: Fields): Fields {
  return { ...fields, day: Math.min(fields.day, daysInMonth(fields.year, fields.month)) };
}

/**
 * The earliest and latest values reachable with `fields` pinned down to and
 * including `level`, and everything after it free.
 *
 * This is what makes the range check exact. Asking "is 2026 out of range?" of a
 * single composed date is the wrong question — 2026 may be half in and half out
 * — so instead every field below the one being tested is pushed to its smallest
 * and then to its largest, and a row is forbidden only when even the most
 * generous completion misses the window entirely.
 */
function reachable(
  mode: DatePickerMode,
  fields: Fields,
  level: number,
): { low: string; high: string } {
  const order = FIELDS[mode];
  const low = { ...fields };
  const high = { ...fields };
  for (let i = level + 1; i < order.length; i++) {
    switch (order[i]) {
      case 'month':
        low.month = 1;
        high.month = 12;
        break;
      case 'day':
        low.day = 1;
        // Read from `high`, whose year and month are either pinned or have just
        // been widened above — the field order is what guarantees they are
        // settled before the day needs them.
        high.day = daysInMonth(high.year, high.month);
        break;
      case 'hour':
        low.hour = 0;
        high.hour = 23;
        break;
      case 'minute':
        low.minute = 0;
        high.minute = 59;
        break;
      default:
        break;
    }
  }
  return { low: compose(mode, low), high: compose(mode, high) };
}

/**
 * Can any value with `field` set to `candidate` fall inside `[min, max]`?
 *
 * A row that fails this is rendered struck through and refuses to be chosen —
 * the wheel's own `stepWheel` and `valueAtOffset` skip it, so neither the
 * keyboard nor a flick can land on it.
 */
function isReachable(
  mode: DatePickerMode,
  fields: Fields,
  field: DatePickerColumnKey,
  candidate: number,
  min: string | undefined,
  max: string | undefined,
): boolean {
  const order = FIELDS[mode];
  const level = order.indexOf(field);
  if (level === -1) return true;
  const pinned = clampDay({ ...fields, [field]: candidate });
  const { low, high } = reachable(mode, pinned, level);
  if (max !== undefined && low > max) return false;
  if (min !== undefined && high < min) return false;
  return true;
}

/** One wheel's worth of the picker. */
export interface DatePickerColumn {
  key: DatePickerColumnKey;
  /** The column's accessible name — "Year", "AM or PM". */
  label: string;
  width: number;
  items: WheelItem[];
  value: string;
  /** Commits this column and re-composes the whole value. */
  onValueChange: (next: string) => void;
  /** Hours and minutes wrap; a year does not. See `stepWheel`. */
  loop: boolean;
}

export interface DatePickerOwnProps {
  /** Which columns the picker shows, and which shape its value takes. */
  mode?: DatePickerMode | undefined;
  // `| undefined` on every optional is required, not noise:
  // `exactOptionalPropertyTypes` is on, and without it a leaf cannot spread a
  // possibly-undefined prop through.
  /** Controlled value, in this mode's shape. Pair with `onValueChange`. */
  value?: string | undefined;
  /** Uncontrolled starting value. Defaults to `today`, then to a fixed date. */
  defaultValue?: string | undefined;
  onValueChange?: ((next: string) => void) | undefined;
  /** Earliest selectable value, inclusive, in this mode's shape. */
  min?: string | undefined;
  /** Latest selectable value, inclusive. */
  max?: string | undefined;
  /** Minutes per step. Only values that divide an hour evenly. */
  minuteInterval?: MinuteInterval | undefined;
  /** 12 adds an AM/PM column. The stored value stays 24-hour either way. */
  hourCycle?: 12 | 24 | undefined;
  /**
   * "Today", as `YYYY-MM-DD`. A PROP rather than a `new Date()` call, so a
   * story or a test can pin it. Seeds the uncontrolled value and centres the
   * year column's window.
   */
  today?: string | undefined;
  disabled?: boolean | undefined;
  /** Submitted name. The web leaf renders a hidden input so a plain form post
   * carries the value; the native leaf has no form to post to and ignores it. */
  name?: string | undefined;
}

export interface DatePickerState {
  value: string;
  columns: DatePickerColumn[];
  groupId: string;
  /** Reads the whole selection aloud — "11 Mar 2026, 09:30". */
  summary: string;
}

/** How far the year column reaches when `min`/`max` do not say. */
const YEARS_BACK = 100;
const YEARS_FORWARD = 10;

export function useDatePickerState({
  mode = 'date',
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  minuteInterval = 1,
  hourCycle = 24,
  today,
}: DatePickerOwnProps): DatePickerState {
  const [current, setCurrent] = useControllableState<string>(
    value,
    defaultValue ?? defaultValueFor(mode, today),
    onValueChange,
  );
  const id = React.useId();

  // A value in the wrong shape is not a crash — a caller switching `mode` has
  // one for exactly one render. Fall back to the mode's own default rather than
  // rendering columns with nothing selected.
  //
  // Memoised on the VALUE, not rebuilt per render: `columns` below depends on
  // it, and a fresh object every render would rebuild six wheels' worth of rows
  // on every keystroke anywhere in the tree.
  const fields = React.useMemo(() => decompose(mode, current) ?? FALLBACK_FIELDS, [mode, current]);

  const commit = React.useCallback(
    (next: Fields) => {
      // Two corrections, in this order. The day is pulled into the new month
      // first, because a range clamp on 2026-02-31 would be comparing a date
      // that does not exist. Then the whole value is pulled inside the window:
      // a month can be selectable while some of its days are not, so choosing
      // March when the earliest allowed date is the 15th lands on the 15th
      // rather than somewhere forbidden.
      setCurrent(clampToRange(compose(mode, clampDay(next)), min, max));
    },
    [mode, min, max, setCurrent],
  );

  const { period } = to12Hour(fields.hour);

  const yearWindow = React.useMemo(() => {
    const anchor = parseIso(today ?? '')?.year ?? fields.year;
    const from = parseIso(min ?? '')?.year ?? anchor - YEARS_BACK;
    const to = parseIso(max ?? '')?.year ?? anchor + YEARS_FORWARD;
    // A `min` after a `max` is the caller's bug, but it must not produce an
    // empty column with nothing selectable at all.
    return { from: Math.min(from, to), to: Math.max(from, to) };
  }, [today, min, max, fields.year]);

  const columns = React.useMemo(() => {
    const mark = (
      key: DatePickerColumnKey,
      items: readonly DateWheelItem[],
      toNumber: (raw: string) => number,
    ): WheelItem[] =>
      items.map((item) =>
        isReachable(mode, fields, key, toNumber(item.value), min, max)
          ? { ...item }
          : { ...item, disabled: true },
      );

    const build = (key: DatePickerColumnKey): DatePickerColumn => {
      switch (key) {
        case 'year':
          return {
            key,
            label: COLUMN_LABEL[key],
            width: COLUMN_WIDTH[key],
            items: mark(key, yearItems(yearWindow.from, yearWindow.to), Number),
            value: pad4(fields.year),
            onValueChange: (next) => commit({ ...fields, year: Number(next) }),
            loop: false,
          };
        case 'month':
          return {
            key,
            label: COLUMN_LABEL[key],
            width: COLUMN_WIDTH[key],
            items: mark(key, monthItems(), Number),
            value: pad2(fields.month),
            onValueChange: (next) => commit({ ...fields, month: Number(next) }),
            loop: false,
          };
        case 'day':
          return {
            key,
            label: COLUMN_LABEL[key],
            width: COLUMN_WIDTH[key],
            // Derived from the CURRENT year and month, which is what stops 30
            // February from being a row at all rather than a row that is
            // merely refused.
            items: mark(key, dayItems(fields.year, fields.month), Number),
            value: pad2(fields.day),
            onValueChange: (next) => commit({ ...fields, day: Number(next) }),
            loop: false,
          };
        case 'hour':
          return {
            key,
            label: COLUMN_LABEL[key],
            width: COLUMN_WIDTH[key],
            items: mark(key, hourItems(hourCycle, period), Number),
            value: pad2(fields.hour),
            onValueChange: (next) => commit({ ...fields, hour: Number(next) }),
            loop: true,
          };
        case 'minute':
          return {
            key,
            label: COLUMN_LABEL[key],
            width: COLUMN_WIDTH[key],
            items: mark(key, minuteItems(minuteInterval), Number),
            // An interval the current minute does not sit on has to resolve to
            // a row that exists — down, so the picker never shows a later time
            // than the one it was given.
            value: pad2(snapMinute(fields.minute, minuteInterval)),
            onValueChange: (next) => commit({ ...fields, minute: Number(next) }),
            loop: true,
          };
        default:
          return {
            key: 'period',
            label: COLUMN_LABEL.period,
            width: COLUMN_WIDTH.period,
            // AM/PM is the hour column wearing a different hat, so its rows are
            // checked against the hour they would produce.
            items: mark('hour', periodItems(), (raw) =>
              to24Hour(to12Hour(fields.hour).hour, raw as Period),
            ),
            value: period,
            onValueChange: (next) =>
              commit({ ...fields, hour: to24Hour(to12Hour(fields.hour).hour, next as Period) }),
            loop: false,
          };
      }
    };

    return columnOrder(mode, hourCycle).map(build);
  }, [mode, hourCycle, minuteInterval, fields, min, max, period, yearWindow, commit]);

  return React.useMemo(
    () => ({
      value: current,
      columns,
      groupId: `${id}-group`,
      summary: summarise(mode, current, hourCycle),
    }),
    [current, columns, id, mode, hourCycle],
  );
}

/**
 * The whole selection in one line, for the group's accessible name and its live
 * region.
 *
 * Six separate listboxes announce six separate changes and never announce the
 * DATE. This is the sentence a screen-reader user actually needs, and it is
 * shared so both leaves say the same words about the same value.
 */
export function summarise(mode: DatePickerMode, value: string, hourCycle: 12 | 24): string {
  const fields = decompose(mode, value);
  if (fields === null) return value;

  const month = monthItems()[fields.month - 1]?.label ?? '';
  const date = `${fields.day} ${month} ${fields.year}`;
  if (mode === 'date') return date;

  const { hour, period } = to12Hour(fields.hour);
  const time =
    hourCycle === 24
      ? timeFor(fields.hour, fields.minute)
      : `${hour}:${pad2(fields.minute)} ${period}`;
  return mode === 'time' ? time : `${date}, ${time}`;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function pad4(value: number): string {
  return String(value).padStart(4, '0');
}
