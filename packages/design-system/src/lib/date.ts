// SHARED (src/lib) — the package's date and time arithmetic. Pure functions
// and const data; not even `react` is imported, because nothing here holds
// state. No renderer, per the src/lib fence in eslint.config.js.
//
// WHY THE VALUES ARE STRINGS. A form date is `YYYY-MM-DD`, a form time is
// `HH:mm`, and the two together are `YYYY-MM-DDTHH:mm` — no seconds, no zone.
// A date someone enters into a form is a calendar FACT rather than an instant.
// A `Date` is an instant: constructing one puts the value in a timezone it does
// not have, and the classic result is a date that shifts by a day depending on
// where the browser is. So no `Date` is constructed anywhere in this module,
// including for the leap-year check.
//
// The payoff runs through everything below. All three value shapes are
// fixed-width with the most significant field first, so STRING ORDER IS
// CHRONOLOGICAL ORDER — which is why `isOutOfRange` is a pair of `<`
// comparisons rather than any parsing at all.
//
// This module was extracted from `date-input.props.ts` and `calendar.props.ts`
// when those two components were replaced by DatePicker in 0.12.0. The logic
// and its reasoning are theirs, carried over rather than rewritten: it was
// correct, it was tested, and it outlived both of its original owners.

/* ------------------------------------------------------------------ dates */

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/**
 * Is this a date the calendar actually has? Computed from the numbers, never by
 * constructing a `Date` — `new Date('2019-02-30')` does not throw, it rolls
 * over to March 2nd, which is precisely the silent corruption to avoid.
 */
export function isRealDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;
  return day <= daysInMonth(year, month);
}

/** Zero-padded ISO for a year/month/day triple. `month` is 1-based. */
export function isoFor(year: number, month: number, day: number): string {
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
}

/** Parses an ISO date into its parts, or `null` if it is not a real date. */
export function parseIso(iso: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return isRealDate(year, month, day) ? { year, month, day } : null;
}

/* ------------------------------------------------------------------ times */

/**
 * Parses `HH:mm` into its parts, or `null` if it is not a real time of day.
 *
 * 24-hour ALWAYS, whatever a picker chooses to display. `hourCycle: 12` is a
 * presentation choice that adds an AM/PM column; it must never reach storage,
 * or "12:30" stops having one meaning.
 */
export function parseTime(text: string): { hour: number; minute: number } | null {
  const match = /^(\d{2}):(\d{2})$/.exec(text);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23) return null;
  if (minute < 0 || minute > 59) return null;
  return { hour, minute };
}

/** Zero-padded `HH:mm` for an hour/minute pair. */
export function timeFor(hour: number, minute: number): string {
  return `${pad(hour, 2)}:${pad(minute, 2)}`;
}

/**
 * A 24-hour hour as it reads on a 12-hour clock. Midnight and noon are both
 * "12", which is the one case an `h % 12` alone gets wrong (it gives 0).
 */
export function to12Hour(hour24: number): { hour: number; period: Period } {
  const period: Period = hour24 < 12 ? 'AM' : 'PM';
  const hour = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { hour, period };
}

/** The inverse of {@link to12Hour}. 12 AM is 0, 12 PM is 12. */
export function to24Hour(hour12: number, period: Period): number {
  const base = hour12 % 12;
  return period === 'PM' ? base + 12 : base;
}

export type Period = 'AM' | 'PM';

/* -------------------------------------------------------------- datetimes */

/**
 * Splits `YYYY-MM-DDTHH:mm` into its halves.
 *
 * Tolerant on input and strict on output: a value carrying seconds or a zone
 * (`2026-03-11T09:30:00Z`, which is what a `Date.toISOString()` round-trip
 * produces) keeps its date and its minutes and drops the rest, rather than
 * being rejected outright. A caller who hands this an instant gets the wall
 * clock they wrote down — see the module header for why no `Date` is involved.
 */
export function splitDateTime(value: string): { date: string; time: string } | null {
  const [date, rest] = value.split('T');
  if (date === undefined || rest === undefined) return null;
  if (parseIso(date) === null) return null;
  const time = rest.slice(0, 5);
  if (parseTime(time) === null) return null;
  return { date, time };
}

export function joinDateTime(date: string, time: string): string {
  return `${date}T${time}`;
}

/* ------------------------------------------------------------------ range */

/**
 * Outside `[min, max]`?
 *
 * String comparison, not arithmetic: every value shape this module produces is
 * zero-padded and most-significant-first, so it sorts in chronological order.
 * It also has no timezone to get wrong. Works unchanged for a date, a time and
 * a datetime, which is why the picker's range check is one function and not
 * three.
 */
export function isOutOfRange(
  value: string,
  min: string | undefined,
  max: string | undefined,
): boolean {
  if (min !== undefined && value < min) return true;
  if (max !== undefined && value > max) return true;
  return false;
}

/** `value` pulled inside `[min, max]`. Same string ordering as above. */
export function clampToRange(
  value: string,
  min: string | undefined,
  max: string | undefined,
): string {
  if (min !== undefined && value < min) return min;
  if (max !== undefined && value > max) return max;
  return value;
}

/* ------------------------------------------------------------ wheel items */

/**
 * One row of a wheel. Structurally identical to `SelectOption` on purpose —
 * see the note above `WheelItem` in `wheel.props.ts`.
 */
export interface DateWheelItem {
  value: string;
  label: string;
}

/**
 * The days a month actually has, as wheel rows.
 *
 * The list is DERIVED from the year and month rather than fixed at 31, which is
 * what stops 30 February from being reachable at all. The picker clamps the
 * selected day when this list shrinks under it — the same rule a "31 January
 * plus one month" calculation needs, where the answer is 28 February and JS's
 * own Date says 3 March.
 */
export function dayItems(year: number, month: number): DateWheelItem[] {
  return countFrom(1, daysInMonth(year, month)).map((day) => ({
    value: pad(day, 2),
    // The label is the bare number: a wheel column is already headed "Day",
    // and a zero-padded "05" reads as a code rather than a date.
    label: String(day),
  }));
}

/**
 * Months as wheel rows, labelled by their first three letters.
 *
 * ABBREVIATED, not "September". A wheel column is sized by its longest row, and
 * the full names would make the month column half again as wide as the other
 * four put together — which is what pushes a datetime picker off the side of a
 * phone. Three letters is also what this package's calendar already chose for
 * its weekday headers, and it is what typeahead matches: "sep" still lands on
 * September. Sliced from `MONTH_NAMES` rather than kept as a second list, so
 * there is nothing for the two to disagree about.
 */
export function monthItems(): DateWheelItem[] {
  return MONTH_NAMES.map((name, index) => ({
    value: pad(index + 1, 2),
    label: name.slice(0, 3),
  }));
}

/** Years from `from` to `to`, inclusive and ascending. */
export function yearItems(from: number, to: number): DateWheelItem[] {
  return countFrom(from, to).map((year) => ({ value: pad(year, 4), label: String(year) }));
}

/**
 * Hours as wheel rows. The VALUE is always the 24-hour number, whatever the
 * cycle — a 12-hour wheel changes only what is printed, so the AM/PM column can
 * stay a separate wheel and neither has to know how the other is stored.
 */
export function hourItems(hourCycle: 12 | 24, period: Period = 'AM'): DateWheelItem[] {
  if (hourCycle === 24) {
    return countFrom(0, 23).map((hour) => ({ value: pad(hour, 2), label: pad(hour, 2) }));
  }
  // 12 first, then 1–11: the order a 12-hour clock face runs in, and the order
  // the hour after 11 AM is 12 PM implies.
  return [12, ...countFrom(1, 11)].map((hour12) => ({
    value: pad(to24Hour(hour12, period), 2),
    label: String(hour12),
  }));
}

/**
 * Minutes at `interval` steps. An interval that does not divide 60 would make
 * the last step shorter than the rest, so the type only admits ones that do.
 */
export function minuteItems(interval: MinuteInterval): DateWheelItem[] {
  const items: DateWheelItem[] = [];
  for (let minute = 0; minute < 60; minute += interval) {
    items.push({ value: pad(minute, 2), label: pad(minute, 2) });
  }
  return items;
}

/** The steps that divide an hour evenly. See {@link minuteItems}. */
export type MinuteInterval = 1 | 5 | 10 | 15 | 30;

export function periodItems(): DateWheelItem[] {
  return [
    { value: 'AM', label: 'AM' },
    { value: 'PM', label: 'PM' },
  ];
}

/**
 * The nearest item value at or below `minute`, for a value that does not sit on
 * an interval boundary. A caller switching `minuteInterval` to 15 with `:07`
 * already selected must land somewhere real, and rounding DOWN never invents
 * time that has not happened.
 */
export function snapMinute(minute: number, interval: MinuteInterval): number {
  return Math.floor(minute / interval) * interval;
}

/* ----------------------------------------------------------------- shared */

function pad(value: number, width: number): string {
  return String(value).padStart(width, '0');
}

function countFrom(from: number, to: number): number[] {
  const out: number[] = [];
  for (let n = from; n <= to; n++) out.push(n);
  return out;
}
