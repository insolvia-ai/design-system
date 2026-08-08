// SHARED — `react`, `../lib/controllable` and DateInput's own shared module.
// No react-dom, no react-native.
//
// The whole calendar lives here: the month grid, the range check, and the
// keyboard grammar. The leaves render a table of buttons or a grid of
// Pressables and nothing else — the same division `select.props.ts` makes, and
// for the same reason: a date grid that stepped differently on one platform
// would be two calendars claiming to be one.
//
// `daysInMonth` and `isRealDate` come from DateInput rather than being
// restated. The two components are the typed and the pointed way to say the
// same thing, and they must agree about what a date IS.
import * as React from 'react';

import { daysInMonth, isRealDate } from '../date-input/date-input.props';
import { useControllableState } from '../lib/controllable';

/** An ISO `YYYY-MM-DD` date, or `null` for "nothing chosen". */
export type CalendarValue = string | null;

/** Zero-padded ISO for a year/month/day triple. `month` is 1-based. */
export function isoFor(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export interface CalendarDay {
  iso: string;
  day: number;
  /** False for the leading/trailing days borrowed from the neighbouring month. */
  inMonth: boolean;
}

/**
 * Monday-first weekday order.
 *
 * Not a locale-aware choice, and deliberately so: this package has one
 * hard-coded set of month names below too, and pretending otherwise — a
 * half-localised calendar that gets the weekday order right and the month
 * names wrong — is worse than being plainly English-only. A consumer needing
 * localisation is better served by their own calendar than by this one with a
 * locale prop bolted on.
 */
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

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

/** Monday = 0 … Sunday = 6, from JS's Sunday-first `getUTCDay`. */
function mondayIndex(year: number, month: number, day: number): number {
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}

/**
 * The six-week grid for a month, padded from the neighbouring months so every
 * row is full.
 *
 * ALWAYS SIX ROWS, even when five would do. A grid that changes height as you
 * page through the year moves the controls under it, and the button you were
 * about to press ends up somewhere else — the classic date-picker misclick.
 */
export function monthGrid(year: number, month: number): CalendarDay[][] {
  const lead = mondayIndex(year, month, 1);
  const inThis = daysInMonth(year, month);
  const previousMonth = month === 1 ? 12 : month - 1;
  const previousYear = month === 1 ? year - 1 : year;
  const inPrevious = daysInMonth(previousYear, previousMonth);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  const cells: CalendarDay[] = [];
  for (let i = lead; i > 0; i--) {
    const day = inPrevious - i + 1;
    cells.push({ iso: isoFor(previousYear, previousMonth, day), day, inMonth: false });
  }
  for (let day = 1; day <= inThis; day++) {
    cells.push({ iso: isoFor(year, month, day), day, inMonth: true });
  }
  let trailing = 1;
  while (cells.length < 42) {
    cells.push({ iso: isoFor(nextYear, nextMonth, trailing), day: trailing, inMonth: false });
    trailing++;
  }

  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < 42; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
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

/**
 * Outside `[min, max]`?
 *
 * String comparison, not Date arithmetic: zero-padded ISO dates sort
 * lexicographically in calendar order, which is the same trick
 * `date-input.props` uses for its range check — and it has no timezone to get
 * wrong.
 */
export function isOutOfRange(
  iso: string,
  min: string | undefined,
  max: string | undefined,
): boolean {
  if (min !== undefined && iso < min) return true;
  if (max !== undefined && iso > max) return true;
  return false;
}

/** Adds `days` to an ISO date, crossing months and years. */
export function shiftDays(iso: string, days: number): string {
  const parts = parseIso(iso);
  if (!parts) return iso;
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return isoFor(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

/**
 * Adds `months`, clamping the day to the target month's length — 31 January
 * plus one month is 28 February, not 3 March. JS's own Date rolls over, which
 * is how a "next month" button skips February entirely.
 */
export function shiftMonths(iso: string, months: number): string {
  const parts = parseIso(iso);
  if (!parts) return iso;
  const total = parts.year * 12 + (parts.month - 1) + months;
  const year = Math.floor(total / 12);
  const month = (total % 12) + 1;
  return isoFor(year, month, Math.min(parts.day, daysInMonth(year, month)));
}

export type CalendarIntent =
  | { kind: 'none' }
  /** Move the focused date without choosing. */
  | { kind: 'focus'; iso: string }
  | { kind: 'select'; iso: string };

/**
 * What a keypress means on the grid. The APG date-picker grammar: arrows by a
 * day or a week, PageUp/PageDown by a month, Home/End to the ends of the week,
 * Enter or Space to choose.
 */
export function calendarKeyIntent(key: string, focused: string): CalendarIntent {
  switch (key) {
    case 'ArrowLeft':
      return { kind: 'focus', iso: shiftDays(focused, -1) };
    case 'ArrowRight':
      return { kind: 'focus', iso: shiftDays(focused, 1) };
    case 'ArrowUp':
      return { kind: 'focus', iso: shiftDays(focused, -7) };
    case 'ArrowDown':
      return { kind: 'focus', iso: shiftDays(focused, 7) };
    case 'PageUp':
      return { kind: 'focus', iso: shiftMonths(focused, -1) };
    case 'PageDown':
      return { kind: 'focus', iso: shiftMonths(focused, 1) };
    case 'Home': {
      const parts = parseIso(focused);
      if (!parts) return { kind: 'none' };
      return {
        kind: 'focus',
        iso: shiftDays(focused, -mondayIndex(parts.year, parts.month, parts.day)),
      };
    }
    case 'End': {
      const parts = parseIso(focused);
      if (!parts) return { kind: 'none' };
      return {
        kind: 'focus',
        iso: shiftDays(focused, 6 - mondayIndex(parts.year, parts.month, parts.day)),
      };
    }
    case 'Enter':
    case ' ':
      return { kind: 'select', iso: focused };
    default:
      return { kind: 'none' };
  }
}

export interface CalendarOwnProps {
  value?: CalendarValue | undefined;
  defaultValue?: CalendarValue | undefined;
  onValueChange?: ((next: string) => void) | undefined;
  /** Earliest selectable date, ISO. */
  min?: string | undefined;
  /** Latest selectable date, ISO. */
  max?: string | undefined;
  /**
   * Which month to open on when nothing is selected. ISO; only the year and
   * month are read. Defaults to the month of `today`.
   */
  defaultMonth?: string | undefined;
  /**
   * "Today", as ISO. A PROP rather than a `new Date()` call, so a story or a
   * test can pin it — a component that reads the clock cannot be rendered
   * twice with the same result.
   */
  today?: string | undefined;
}

export interface CalendarState {
  value: CalendarValue;
  select: (iso: string) => void;
  /** The month on screen, as a first-of-month ISO date. */
  viewMonth: string;
  setViewMonth: (iso: string) => void;
  /** The date the roving tabindex sits on. */
  focused: string;
  setFocused: (iso: string) => void;
  weeks: CalendarDay[][];
  gridId: string;
  labelId: string;
}

export function useCalendarState({
  value,
  defaultValue = null,
  onValueChange,
  min,
  max,
  defaultMonth,
  today,
}: CalendarOwnProps): CalendarState {
  const [current, setCurrent] = useControllableState<CalendarValue>(
    value,
    defaultValue,
    onValueChange as ((next: CalendarValue) => void) | undefined,
  );

  // The anchor the view opens on: the chosen date, else the caller's month,
  // else today. Never the clock directly — see `today` above.
  const anchor = current ?? defaultMonth ?? today ?? '2024-01-01';
  const anchorParts = parseIso(anchor) ?? { year: 2024, month: 1, day: 1 };

  const [viewMonth, setViewMonth] = React.useState(isoFor(anchorParts.year, anchorParts.month, 1));
  const [focused, setFocused] = React.useState(anchor);
  const id = React.useId();

  const viewParts = parseIso(viewMonth) ?? anchorParts;
  const weeks = React.useMemo(
    () => monthGrid(viewParts.year, viewParts.month),
    [viewParts.year, viewParts.month],
  );

  const select = React.useCallback(
    (iso: string) => {
      if (isOutOfRange(iso, min, max)) return;
      setCurrent(iso);
      setFocused(iso);
      // Choosing a day borrowed from a neighbouring month pages the view to
      // it, so the selection is never left off screen.
      const parts = parseIso(iso);
      if (parts) setViewMonth(isoFor(parts.year, parts.month, 1));
    },
    [min, max, setCurrent],
  );

  const moveFocus = React.useCallback((iso: string) => {
    setFocused(iso);
    const parts = parseIso(iso);
    if (parts) setViewMonth(isoFor(parts.year, parts.month, 1));
  }, []);

  return React.useMemo(
    () => ({
      value: current,
      select,
      viewMonth,
      setViewMonth,
      focused,
      setFocused: moveFocus,
      weeks,
      gridId: `${id}-grid`,
      labelId: `${id}-label`,
    }),
    [current, select, viewMonth, focused, moveFocus, weeks, id],
  );
}

/** The visible month heading — "March 2026". */
export function monthLabel(iso: string): string {
  const parts = parseIso(iso);
  if (!parts) return '';
  return `${MONTH_NAMES[parts.month - 1]} ${parts.year}`;
}

/**
 * A day cell's accessible name — "5 March 2026".
 *
 * The visible text is just the number, and the number alone is not enough: a
 * six-week grid shows the neighbouring months' days too, so "5" appears TWICE
 * in most months and a screen-reader user has no way to tell which is which.
 * (It is also what made a test ambiguous, which is how this was noticed.)
 *
 * Day-first, and starting with the digits, so the accessible name CONTAINS the
 * visible label — WCAG 2.5.3 "Label in Name", which an ISO string like
 * `2026-03-05` would fail for every single-digit day.
 *
 * Shared, so both leaves announce the same words for the same square.
 */
export function dayLabel(iso: string): string {
  const parts = parseIso(iso);
  if (!parts) return iso;
  return `${parts.day} ${MONTH_NAMES[parts.month - 1]} ${parts.year}`;
}
