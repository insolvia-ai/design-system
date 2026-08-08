// SHARED — `react`, `../lib/controllable` and Select's own shared module. No
// react-dom, no react-native.
//
// The whole wheel apart from the elements: its geometry, the value/offset
// conversion both leaves need to place a scroll position, the keyboard grammar,
// and the state. The leaves render a scroller of buttons or a ScrollView of
// Pressables and nothing else — the same division `select.props.ts` makes, and
// for the same reason: a wheel that stepped differently on one platform would
// be two wheels claiming to be one.
//
// WHY LISTBOX AND NOT SPINBUTTON. A column of ordered values reads like a
// spinbutton, and that was the first draft. It puts the arrow keys in direct
// conflict with the picture: APG says ArrowUp INCREASES a spinbutton's value,
// while a wheel's values ascend DOWNWARDS, so the correct spinbutton binding
// moves the highlight the opposite way from the key's arrow. A listbox has no
// such conflict — ArrowDown means the next option, which is the one below —
// and it is the pattern this package already implements once, in Select. Each
// column is a listbox, each row an option, and the selection is announced by
// `aria-selected` rather than by an `aria-valuetext` that has to be computed.
//
// THE SCROLLING IS AN ENHANCEMENT, NOT THE MECHANISM. Every row is a real
// button, arrows and Home/End move the selection, and typing digits jumps to a
// value. Scroll-snap sits on top of that. Two things fall out: the wheel is
// operable by keyboard alone, and it is testable at all — jsdom has no layout,
// so `scrollTop` and `scroll-snap-align` do nothing there, and a wheel that
// could ONLY be scrolled would be a wheel nothing in CI could drive.
import * as React from 'react';

import { useControllableState } from '../lib/controllable';
// Typeahead is Select's, reused rather than restated. `WheelItem` is
// structurally a `SelectOption`, so these apply unchanged, and the two controls
// must agree about what typing at a list MEANS — the same reasoning that had
// Calendar share DateInput's `daysInMonth` before either existed. Importing
// another component's SHARED module (never its leaf, never its barrel) is the
// allowed direction; see the package CLAUDE.md.
import { useTypeahead } from '../select/select.props';

export interface WheelItem {
  /** Stored value. Must be unique within one wheel. */
  value: string;
  /** Visible text, and what typeahead matches against. */
  label: string;
  /** Rendered dimmed, skipped by the keyboard, refused by a scroll landing. */
  disabled?: boolean;
}

/**
 * Row height, in px on web and dp on native.
 *
 * 44, the WCAG 2.5.5 target-size floor, because a row is directly tappable —
 * tapping the 3rd row down selects it, it does not merely scroll. The same
 * number Select's trigger and the old DateInput both landed on.
 */
export const ITEM_HEIGHT = 44;

/**
 * Rows visible at once. ODD on purpose: an even count has no middle row for the
 * selection band to sit on.
 */
export const VISIBLE_ITEMS = 5;

/** The rows above and below the selected one. */
export const PAD_ITEMS = (VISIBLE_ITEMS - 1) / 2;

/** A wheel's fixed height. Fixed so a column never resizes as its list does. */
export const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

/**
 * The blank space above the first row and below the last, so either can reach
 * the middle of the viewport. Without it the first and last values are
 * unreachable by scrolling — the single most common bug in a hand-rolled wheel.
 */
export const WHEEL_PADDING = ITEM_HEIGHT * PAD_ITEMS;

/** PageUp/PageDown move by one screenful. */
const PAGE_STEP = VISIBLE_ITEMS;

function indexOf(items: readonly WheelItem[], value: string): number {
  return items.findIndex((item) => item.value === value);
}

function wrap(index: number, length: number): number {
  return ((index % length) + length) % length;
}

/**
 * The first enabled item at or after `index`, walking in `direction`.
 *
 * When nothing is enabled that way it turns round and walks back, so a run of
 * disabled items at one end leaves the key working rather than dead — the
 * selection simply stops at the last thing it is allowed to be.
 */
function nearestEnabled(
  items: readonly WheelItem[],
  index: number,
  direction: 1 | -1,
  loop: boolean,
): string | null {
  for (let step = 0; step < items.length; step++) {
    const probe = loop ? wrap(index + step * direction, items.length) : index + step * direction;
    if (!loop && (probe < 0 || probe >= items.length)) break;
    const item = items[probe];
    if (item && !item.disabled) return item.value;
  }
  if (loop) return null;
  for (let step = 1; step < items.length; step++) {
    const probe = index - step * direction;
    if (probe < 0 || probe >= items.length) break;
    const item = items[probe];
    if (item && !item.disabled) return item.value;
  }
  return null;
}

/**
 * Move `value` by `delta` rows.
 *
 * `loop` WRAPS THE KEYBOARD, NOT THE SCROLL. Arrowing down off the end of the
 * minute wheel returns to `00`, which is what a clock ought to do; flicking it
 * with a finger still stops at `59`. True infinite scrolling means recycling
 * content under the scroller, and doing that twice — once in CSS scroll-snap
 * and once in a React Native ScrollView — is two different mechanisms that
 * would have to stay in step with no test able to see them drift. The keyboard
 * gets the affordance because the keyboard can have it honestly.
 */
export function stepWheel(
  items: readonly WheelItem[],
  value: string,
  delta: number,
  loop: boolean,
): string | null {
  if (items.length === 0) return null;
  const from = indexOf(items, value);
  const start = from === -1 ? 0 : from;
  const target = loop
    ? wrap(start + delta, items.length)
    : Math.min(items.length - 1, Math.max(0, start + delta));
  return nearestEnabled(items, target, delta >= 0 ? 1 : -1, loop);
}

export type WheelIntent =
  | { kind: 'none' }
  | { kind: 'value'; value: string }
  /** Not a navigation key — the caller should feed it to typeahead. */
  | { kind: 'typeahead'; char: string };

/**
 * What a keypress means on a wheel. Pure, so the grammar is one testable table
 * rather than two hand-written switch statements that drift apart — the leaves
 * differ only in how they HEAR the key (a DOM `onKeyDown`; on native,
 * react-native-web's forwarded one).
 *
 * PageUp/PageDown deliberately do not wrap even when `loop` is on: a page jump
 * that silently came out the other end would leave no sense of where the list
 * had got to.
 */
export function wheelKeyIntent(
  key: string,
  items: readonly WheelItem[],
  value: string,
  loop: boolean,
): WheelIntent {
  const move = (delta: number, wrapping = loop): WheelIntent => {
    const next = stepWheel(items, value, delta, wrapping);
    return next === null || next === value ? { kind: 'none' } : { kind: 'value', value: next };
  };

  switch (key) {
    case 'ArrowDown':
      return move(1);
    case 'ArrowUp':
      return move(-1);
    case 'PageDown':
      return move(PAGE_STEP, false);
    case 'PageUp':
      return move(-PAGE_STEP, false);
    case 'Home':
      return move(-items.length, false);
    case 'End':
      return move(items.length, false);
    default:
      // Every printable key types. `key.length === 1` is the standard test: it
      // excludes every named key ('Shift', 'ArrowUp', 'F3') and keeps the
      // digits this actually has to match.
      return key.length === 1 && key !== ' ' ? { kind: 'typeahead', char: key } : { kind: 'none' };
  }
}

/** Where the scroller must sit for row `index` to be centred. */
export function offsetForIndex(index: number): number {
  return index * ITEM_HEIGHT;
}

/**
 * Which row a scroll offset is currently over.
 *
 * Rounding rather than flooring, because the offset is only ever approximately
 * a multiple of the row height: a browser's scroll position is fractional, and
 * a React Native momentum stop lands within a pixel or so.
 */
export function indexAtOffset(items: readonly WheelItem[], offset: number): number {
  if (items.length === 0) return 0;
  return Math.min(items.length - 1, Math.max(0, Math.round(offset / ITEM_HEIGHT)));
}

/**
 * The value a settled scroll offset has landed on — or, if that row is
 * disabled, the nearest one it is allowed to land on instead. A leaf that gets
 * `null` back has an empty list and should do nothing.
 */
export function valueAtOffset(items: readonly WheelItem[], offset: number): string | null {
  if (items.length === 0) return null;
  return nearestEnabled(items, indexAtOffset(items, offset), 1, false);
}

/**
 * How solid a row is, `distance` rows from the middle of the wheel. This is
 * what makes a scroll-snap list read as a drum rather than a short list that
 * happens to scroll.
 *
 * IT BOTTOMS OUT AT 0.62, AND THE NUMBER IS NOT A TASTE CALL. Rows are painted
 * in `ink` on `card` — the highest-contrast pair the token set has, about 17:1
 * in either scheme — and fading ink towards the card colour walks that ratio
 * down. 0.62 is where it crosses 4.5:1, the WCAG 1.4.3 floor that `a11y.test:
 * 'error'` holds every story to. A prettier fade to nothing would take the
 * outer rows to roughly 2:1 and fail the gate on every story that renders a
 * wheel — the same trap `leaf-pair.tsx` documents for its own chrome.
 *
 * Shared, and applied identically by both leaves, because the alternative was
 * a CSS gradient on web and an interpolated `Animated` opacity on native: one
 * look reached two ways, which is precisely the divergence this package keeps
 * getting wrong. One pure function is also one that can be unit-tested.
 */
export function rowOpacity(distance: number): number {
  if (distance <= 0) return 1;
  if (distance === 1) return 0.8;
  return 0.62;
}

export interface WheelOwnProps {
  /** The rows, in the order they are shown and navigated. */
  items: readonly WheelItem[];
  // `| undefined` on every optional is required, not noise:
  // `exactOptionalPropertyTypes` is on, and without it a leaf cannot spread a
  // possibly-undefined prop through.
  /** Controlled value. Pair with `onValueChange`. */
  value?: string | undefined;
  /** Uncontrolled starting value. Defaults to the first row. */
  defaultValue?: string | undefined;
  onValueChange?: ((next: string) => void) | undefined;
  /** Wrap the KEYBOARD past either end. See {@link stepWheel}. */
  loop?: boolean | undefined;
  /** Names the column — "Year", "Hour". Required: a bare listbox has no name. */
  label: string;
  disabled?: boolean | undefined;
}

export interface WheelState {
  value: string;
  setValue: (next: string) => void;
  /** Where `value` sits in `items`. The leaves scroll to this. */
  index: number;
  /**
   * The row the wheel LOOKS like it is on, which is not always the one it is
   * on: mid-drag it is whatever has reached the middle, while `value` is still
   * the last committed one. The fade and the band read from this, so the
   * highlight tracks a finger instead of snapping into place afterwards.
   */
  activeIndex: number;
  /** Report a live scroll position. Cheap: it re-renders only on a row change. */
  trackOffset: (offset: number) => void;
  listId: string;
  optionId: (value: string) => string;
  /** Feed a printable character; returns the row to move to, or `null`. */
  type: (char: string) => string | null;
}

export function useWheelState({
  items,
  value,
  defaultValue,
  onValueChange,
}: Pick<WheelOwnProps, 'items' | 'value' | 'defaultValue' | 'onValueChange'>): WheelState {
  const fallback = defaultValue ?? items[0]?.value ?? '';
  const [current, setValue] = useControllableState<string>(value, fallback, onValueChange);
  const id = React.useId();

  // A value with no row is not a crash: the day wheel's list SHRINKS when the
  // month changes, so `31` is briefly a value February does not have. The
  // picker clamps its own composed value — see `clampDay` in
  // date-picker.props.ts — and this keeps the column pointing somewhere real in
  // the render that happens in between.
  const found = indexOf(items, current);
  const index = found === -1 ? 0 : found;

  // The committed row and the row under the middle of the viewport are the same
  // thing except while a finger is on the wheel. Keeping them apart is what
  // lets the value commit ONCE per gesture — on settle — while the highlight
  // still follows the drag.
  const [scrolledIndex, setScrolledIndex] = React.useState(index);
  React.useEffect(() => {
    setScrolledIndex(index);
  }, [index]);

  const trackOffset = React.useCallback(
    (offset: number) => {
      const next = indexAtOffset(items, offset);
      // Only on a ROW change. A scroll handler that set state on every frame
      // would re-render the whole column sixty times a second to move a
      // highlight that can only be in one of a few dozen places.
      setScrolledIndex((previous) => (previous === next ? previous : next));
    },
    [items],
  );

  const currentRef = React.useRef(current);
  currentRef.current = current;
  const type = useTypeahead(items, () => currentRef.current);

  return React.useMemo(
    () => ({
      value: current,
      setValue,
      index,
      activeIndex: Math.min(scrolledIndex, Math.max(0, items.length - 1)),
      trackOffset,
      listId: `${id}-list`,
      optionId: (rowValue: string) => `${id}-option-${rowValue}`,
      type: type.push,
    }),
    [current, setValue, index, scrolledIndex, items.length, trackOffset, id, type],
  );
}
