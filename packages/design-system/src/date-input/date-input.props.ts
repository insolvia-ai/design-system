// SHARED — `react`, `../lib/date` and DatePicker's own shared module. No
// react-dom, no react-native.
//
// The typed half of date entry: the mask, the validity check, the status a leaf
// renders from, and the open/closed state of the picker the calendar button
// summons. The leaves render an input, a button and a surface, and nothing else.
//
// WHY BOTH A MASK AND A PICKER. 0.12.0's first cut shipped the wheels alone and
// they are the wrong instrument on their own: a wheel is slower than typing for
// a date far from today — a registration from 2011, a departure logged in 2016
// — and a wheel has no empty state, so a field that means "nothing chosen yet"
// cannot say so. A masked field has the opposite problem: it is the fastest way
// to enter a date you already know and the worst way to answer "which Tuesday
// is that". Neither replaces the other, which is why this component is the
// field and `DatePicker` is what its button opens.
//
// The empty state comes back with the field. `''` and `'incomplete'` are both
// reachable again, and `DateStatus` is what tells them apart — see
// `onValueChange` below, which is the 0.6.0 lesson and still load-bearing.
//
// WHY THE VALUE IS A STRING, and why `min`/`max` are one lexicographic compare
// in every mode, is `../lib/date`'s header.
import * as React from 'react';

import { isOutOfRange, isRealDate, parseTime } from '../lib/date';
import { defaultValueFor, type DatePickerMode } from '../date-picker/date-picker.props';

/** Same three modes DatePicker has; this field is the typed way into them. */
export type DateInputMode = DatePickerMode;

/**
 * The fields a format may name, and how many digits each one takes.
 *
 * Case matters, and it is the one trap here: `MM` is a month and `mm` is a
 * minute. They are the same width, so a mix-up produces a mask that works and a
 * value that is wrong by months — which is why `parseFormat` scans for these
 * exactly rather than case-insensitively.
 */
const TOKENS = { YYYY: 4, MM: 2, DD: 2, HH: 2, mm: 2 } as const;

export type FormatToken = keyof typeof TOKENS;

/** The fields a mode must collect. A format naming any other set is rejected. */
const REQUIRED: Record<DateInputMode, FormatToken[]> = {
  date: ['YYYY', 'MM', 'DD'],
  time: ['HH', 'mm'],
  datetime: ['YYYY', 'MM', 'DD', 'HH', 'mm'],
};

/**
 * What each mode shows when the caller does not say.
 *
 * ISO order by default, because it is the order the value is STORED in and the
 * least ambiguous thing to show someone who has not been told which convention
 * a form uses. A caller wanting `MM/DD/YYYY` says so — see the `format` prop.
 *
 * The datetime default separates with a SPACE where the stored value uses `T`.
 * `2026-03-11T09:30` is the right thing to store — it is what sorts, and what
 * `../lib/date` is built around — and the wrong thing to show someone typing:
 * the `T` reads as a typo.
 */
export const DEFAULT_FORMAT: Record<DateInputMode, string> = {
  date: 'YYYY-MM-DD',
  time: 'HH:mm',
  datetime: 'YYYY-MM-DD HH:mm',
};

type Segment = { token: FormatToken } | { literal: string };

/**
 * Split a format into its fields and the punctuation between them.
 *
 * THE DISPLAY FORMAT IS PRESENTATION ONLY. `MM/DD/YYYY` and `DD.MM.YYYY` are
 * the same value stored the same way; all that changes is the order the digits
 * are typed and printed in. That separation is what keeps `min`/`max` a
 * lexicographic compare on the stored form no matter what the field looks like.
 *
 * A format that does not name exactly the fields its mode needs THROWS, rather
 * than quietly falling back to the default. It is a static prop, so the throw
 * lands the first time the component renders in development — the same bargain
 * `useFieldContext` makes — and the alternative is a field that silently
 * ignores what the caller asked for.
 */
export function parseFormat(mode: DateInputMode, format: string): Segment[] {
  const names = Object.keys(TOKENS) as FormatToken[];
  const segments: Segment[] = [];
  const seen: FormatToken[] = [];

  let at = 0;
  while (at < format.length) {
    const token = names.find((name) => format.startsWith(name, at));
    if (token) {
      segments.push({ token });
      seen.push(token);
      at += token.length;
      continue;
    }
    // Everything that is not a field is punctuation, one character at a time —
    // so `, ` between the date and the clock survives as two literals and
    // reprints exactly as it was written.
    segments.push({ literal: format[at] as string });
    at += 1;
  }

  const required = REQUIRED[mode];
  const ok = seen.length === required.length && required.every((name) => seen.includes(name));
  if (!ok) {
    throw new Error(
      `DateInput: format "${format}" does not fit mode "${mode}". It must name ` +
        `exactly ${required.join(', ')} — once each, in any order, with any ` +
        `punctuation between them. Note that MM is a month and mm is a minute.`,
    );
  }
  return segments;
}

/** The format a field is actually using. */
export function resolveFormat(mode: DateInputMode, format: string | undefined): string {
  return format ?? DEFAULT_FORMAT[mode];
}

function digitCount(segments: Segment[]): number {
  return segments.reduce((total, seg) => total + ('token' in seg ? TOKENS[seg.token] : 0), 0);
}

function digitsOf(text: string, segments: Segment[]): string {
  return text.replace(/\D/g, '').slice(0, digitCount(segments));
}

/**
 * Group digits into the format, emitting punctuation only once a digit follows.
 *
 * NEVER A TRAILING SEPARATOR, and that is what keeps Backspace working with no
 * previous-text bookkeeping: `2019-` is not a state the field can be in, so a
 * delete always removes a digit rather than a separator that regrouping would
 * immediately put back. An earlier version of this carried a special case for
 * that; it was unreachable by typing AND wrong when reached.
 */
function group(digits: string, segments: Segment[]): string {
  let out = '';
  let at = 0;
  for (const seg of segments) {
    if ('literal' in seg) {
      if (at >= digits.length) break;
      out += seg.literal;
      continue;
    }
    const part = digits.slice(at, at + TOKENS[seg.token]);
    if (part === '') break;
    out += part;
    at += part.length;
  }
  return out;
}

/** Re-mask arbitrary text into this format: keep the digits, regroup, done. */
export function maskFor(mode: DateInputMode, format: string | undefined, next: string): string {
  const segments = parseFormat(mode, resolveFormat(mode, format));
  return group(digitsOf(next, segments), segments);
}

/**
 * The value of each field in a complete entry, keyed by token. `null` if short.
 *
 * Keyed rather than positional, which is the whole reason a reordered format
 * works: the second group of `MM/DD/YYYY` is a day and the second group of
 * `YYYY-MM-DD` is a month, and only the token says which.
 */
function fieldsOf(text: string, segments: Segment[]): Partial<Record<FormatToken, number>> | null {
  const digits = digitsOf(text, segments);
  if (digits.length !== digitCount(segments)) return null;
  const out: Partial<Record<FormatToken, number>> = {};
  let at = 0;
  for (const seg of segments) {
    if (!('token' in seg)) continue;
    const width = TOKENS[seg.token];
    out[seg.token] = Number(digits.slice(at, at + width));
    at += width;
  }
  return out;
}

function pad(value: number, width: number): string {
  return String(value).padStart(width, '0');
}

/**
 * The stored value for complete, real text; `null` for anything else.
 *
 * Realness is computed from the numbers, never by constructing a `Date` —
 * `new Date('2019-02-30')` does not throw, it rolls over to March 2nd, which is
 * precisely the silent corruption to avoid.
 */
export function toValue(
  mode: DateInputMode,
  format: string | undefined,
  text: string,
): string | null {
  const segments = parseFormat(mode, resolveFormat(mode, format));
  const fields = fieldsOf(text, segments);
  if (fields === null) return null;

  const time = mode === 'date' ? null : `${pad(fields.HH ?? 0, 2)}:${pad(fields.mm ?? 0, 2)}`;
  if (time !== null && parseTime(time) === null) return null;
  if (mode === 'time') return time;

  const year = fields.YYYY ?? 0;
  const month = fields.MM ?? 0;
  const day = fields.DD ?? 0;
  if (!isRealDate(year, month, day)) return null;
  const date = `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
  return mode === 'date' ? date : `${date}T${time as string}`;
}

/** The display text for a stored value. The inverse of {@link toValue}. */
export function toText(mode: DateInputMode, format: string | undefined, value: string): string {
  const segments = parseFormat(mode, resolveFormat(mode, format));
  // Read the STORED order (always ISO), then print in the DISPLAY order. A
  // straight re-mask of the value's digits would be right only while the two
  // orders agree, which is exactly what `format` exists to break.
  const stored = /^(?:(\d{4})-(\d{2})-(\d{2}))?T?(?:(\d{2}):(\d{2}))?$/.exec(value);
  if (!stored) return '';
  const fields: Record<FormatToken, string | undefined> = {
    YYYY: stored[1],
    MM: stored[2],
    DD: stored[3],
    HH: stored[4],
    mm: stored[5],
  };

  let out = '';
  for (const seg of segments) {
    if ('literal' in seg) {
      out += seg.literal;
      continue;
    }
    const part = fields[seg.token];
    if (part === undefined) return '';
    out += part;
  }
  return out;
}

/**
 * The geometry of the button's icon, in px on web and dp on native.
 *
 * DRAWN FROM BOXES, not written as a character and not an SVG. React Native
 * renders no SVG without a dependency this package is forbidden to declare, so
 * the first cut reached for a text glyph — `▦` for a calendar — and it reads as
 * a grey noise square, which is worse than no icon at all. What BOTH platforms
 * genuinely have is a rectangle with a border, a radius and a background: a
 * bordered square with a solid bar across its top is a calendar, and a bordered
 * circle with two hands is a clock. Sharing the numbers here is what keeps the
 * two leaves drawing the same picture at the same size.
 *
 * Consumers with an icon set of their own pass `icon` and none of this is used.
 */
export const ICON = {
  /** Outer box, and the stroke it is drawn with. */
  size: 15,
  stroke: 1.5,
  radius: 3,
  /** The solid strip across the top of the calendar — its binding. */
  headerHeight: 3.5,
  /** Clock hands: the long one points up, the short one right. */
  handThickness: 1.5,
  handUp: 4,
  handRight: 3,
} as const;

/** Which icon a mode shows. `datetime` is a date first, so it takes the calendar. */
export function iconFor(mode: DateInputMode): 'calendar' | 'clock' {
  return mode === 'time' ? 'clock' : 'calendar';
}

/** The button's accessible name — the whole intent, since the glyph is decorative. */
export const OPEN_LABEL: Record<DateInputMode, string> = {
  date: 'Choose a date',
  time: 'Choose a time',
  datetime: 'Choose a date and time',
};

export type DateStatus =
  /** Nothing typed. Not an error — required-ness is the caller's rule. */
  | 'empty'
  /** Fewer digits than the mode needs. Not an error *yet*; still typing. */
  | 'incomplete'
  /** Enough digits, but no such moment — 2019-02-30, month 13, 25:00. */
  | 'invalid'
  /** A real moment outside `min`/`max`. */
  | 'out-of-range'
  | 'valid';

export function dateStatus(
  mode: DateInputMode,
  format: string | undefined,
  text: string,
  min?: string | undefined,
  max?: string | undefined,
): DateStatus {
  const segments = parseFormat(mode, resolveFormat(mode, format));
  const digits = digitsOf(text, segments);
  if (digits.length === 0) return 'empty';
  if (digits.length < digitCount(segments)) return 'incomplete';
  const value = toValue(mode, format, text);
  if (value === null) return 'invalid';
  return isOutOfRange(value, min, max) ? 'out-of-range' : 'valid';
}

/**
 * Whether a status should show as an error. `incomplete` deliberately does NOT:
 * marking a field invalid while someone is still typing the year is the
 * behaviour that trains people to ignore error styling.
 */
export function isErrorStatus(status: DateStatus): boolean {
  return status === 'invalid' || status === 'out-of-range';
}

export interface DateInputOwnProps {
  /** Which fields the mask accepts, and which wheels the button opens. */
  mode?: DateInputMode | undefined;
  /**
   * How the field READS and is typed — `MM/DD/YYYY`, `DD.MM.YYYY`,
   * `YYYY-MM-DD HH:mm`. Built from `YYYY`, `MM`, `DD`, `HH` and `mm` with any
   * punctuation between them; `MM` is a month and `mm` is a minute.
   *
   * PRESENTATION ONLY. The stored value is the same ISO string whatever this
   * says, which is what keeps `min`/`max` a lexicographic compare and what
   * lets one form show two conventions without two value types. Defaults to
   * the mode's ISO order.
   *
   * A format that does not name exactly the fields the mode needs throws — see
   * `parseFormat`.
   */
  format?: string | undefined;
  // `| undefined` on each optional because `exactOptionalPropertyTypes` is on.
  /** Controlled value in this mode's shape, or `''` for none. */
  value?: string | undefined;
  /** Uncontrolled starting value. */
  defaultValue?: string | undefined;
  /**
   * Fires with a complete, real, in-range value — or `''` for anything else,
   * including a half-typed one. A caller therefore never has to parse, and
   * cannot accidentally store `2019-02-3`.
   *
   * THE SECOND ARGUMENT IS NOT OPTIONAL DETAIL. `''` means two different
   * things: the field is empty, or the user is still typing. A caller that
   * autosaves cannot tell them apart from the value alone, and treating "still
   * typing" as "cleared" wipes a saved date the moment someone edits it — one
   * backspace on a saved `2020-01-15` reports `''`, and the save lands.
   * `status` is what distinguishes them: persist on `valid` and `empty`,
   * ignore `incomplete`.
   */
  onValueChange?: ((next: string, status: DateStatus) => void) | undefined;
  /** Earliest allowed value, inclusive, in this mode's shape. */
  min?: string | undefined;
  /** Latest allowed value, inclusive. */
  max?: string | undefined;
  /** Minutes per step in the picker's wheel. Typing is never restricted. */
  minuteInterval?: 1 | 5 | 10 | 15 | 30 | undefined;
  /** 12 gives the picker an AM/PM wheel. The stored value stays 24-hour. */
  hourCycle?: 12 | 24 | undefined;
  /**
   * "Today", as `YYYY-MM-DD`. A PROP rather than a `new Date()` call, so a
   * story or a test can pin it. It is where the picker opens when the field is
   * empty.
   */
  today?: string | undefined;
  disabled?: boolean | undefined;
  name?: string | undefined;
}

export interface DateInputState {
  /** What is on screen, masked. */
  text: string;
  setText: (next: string) => void;
  status: DateStatus;
  /** The last complete, valid, in-range value — `''` when there is none. */
  value: string;
  /** Is the picker showing? */
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Commit a value chosen in the picker, re-masking the field to match. */
  pick: (next: string) => void;
  /**
   * What the picker should show. The field's own value when it has one, else
   * `today` — so opening an EMPTY field lands on today rather than on whatever
   * fixed date the picker would otherwise default to.
   */
  pickerValue: string;
  rootId: string;
}

export function useDateInputState({
  mode = 'date',
  format,
  value,
  defaultValue = '',
  onValueChange,
  min,
  max,
  today,
}: DateInputOwnProps): DateInputState {
  // The TEXT is the state, not the value — they are not the same thing while
  // someone is mid-keystroke, and a controlled `value` that only accepts whole
  // dates cannot represent "2019-0". So text lives here, and a controlled
  // `value` seeds it and overrides it whenever the parent supplies a different
  // one than the field currently holds.
  const [text, setTextState] = React.useState(() => toText(mode, format, defaultValue));
  const [open, setOpen] = React.useState(false);
  const id = React.useId();

  const controlled = value !== undefined;
  const shownText =
    controlled && toValue(mode, format, text) !== value ? toText(mode, format, value) : text;

  const onChangeRef = React.useRef(onValueChange);
  React.useEffect(() => {
    onChangeRef.current = onValueChange;
  });

  // Changing `format` re-prints what is already there rather than dropping it.
  // The digits are the same digits; only their order and punctuation move, so
  // a form that switches convention must not clear the user's work.
  const formatRef = React.useRef(format);
  React.useEffect(() => {
    if (formatRef.current === format) return;
    const previous = formatRef.current;
    formatRef.current = format;
    setTextState((current) => {
      const stored = toValue(mode, previous, current);
      return stored === null ? '' : toText(mode, format, stored);
    });
  }, [mode, format]);

  const setText = React.useCallback(
    (next: string) => {
      const masked = maskFor(mode, format, next);
      setTextState(masked);
      const status = dateStatus(mode, format, masked, min, max);
      onChangeRef.current?.(
        status === 'valid' ? (toValue(mode, format, masked) ?? '') : '',
        status,
      );
    },
    [mode, format, min, max],
  );

  const pick = React.useCallback(
    (next: string) => {
      const printed = toText(mode, format, next);
      setTextState(printed);
      onChangeRef.current?.(next, dateStatus(mode, format, printed, min, max));
    },
    [mode, format, min, max],
  );

  const status = dateStatus(mode, format, shownText, min, max);
  const current = status === 'valid' ? (toValue(mode, format, shownText) ?? '') : '';

  return React.useMemo(
    () => ({
      text: shownText,
      setText,
      status,
      value: current,
      open,
      setOpen,
      pick,
      pickerValue: current === '' ? defaultValueFor(mode, today) : current,
      rootId: id,
    }),
    [shownText, setText, status, current, open, pick, mode, today, id],
  );
}
