// WEB LEAF — plain React DOM + Tailwind. One scrolling column: a CSS
// scroll-snap scroller of `role="option"` buttons, a selection band painted
// behind the middle row, and rows that fade with their distance from it.
//
// Focus stays on the SCROLLER, which is the listbox, and the selection is
// addressed through `aria-activedescendant` — the same shape `select.web.tsx`
// uses, so one key handler drives everything and the hundred-odd rows of a year
// wheel are one tab stop rather than a hundred.
//
// COMMITTING ON SETTLE, WITHOUT A GUARD FLAG. The obvious hazard here is the
// loop: a keypress moves the value, the effect scrolls to it, the scroll
// settles, and the settle handler commits again. It cannot happen, because the
// handler commits only when the settled row DIFFERS from the current value —
// and a scroll we performed ourselves settles exactly on it. That also gets the
// spring-back for free: settling on a disabled row yields the nearest enabled
// one, which differs, so it commits and the effect scrolls there.
import * as React from 'react';

import { cn } from '../lib/cn';
import { focusRing } from '../lib/styles';
import {
  ITEM_HEIGHT,
  offsetForIndex,
  rowOpacity,
  useWheelState,
  valueAtOffset,
  WHEEL_HEIGHT,
  WHEEL_PADDING,
  wheelKeyIntent,
  type WheelOwnProps,
} from './wheel.props';

export interface WheelProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'defaultValue' | 'onChange'>, WheelOwnProps {}

/** How long after the last scroll event a browser without `scrollend` counts as settled. */
const SETTLE_MS = 120;

export const Wheel = React.forwardRef<HTMLDivElement, WheelProps>(
  (
    {
      className,
      items,
      value,
      defaultValue,
      onValueChange,
      loop = false,
      label,
      disabled = false,
      style,
      ...props
    },
    ref,
  ) => {
    const state = useWheelState({ items, value, defaultValue, onValueChange });
    const {
      value: current,
      setValue,
      index,
      activeIndex,
      trackOffset,
      listId,
      optionId,
      type,
    } = state;

    const scrollerRef = React.useRef<HTMLDivElement | null>(null);

    // Keep the scroller pointing at the selected row.
    //
    // `behavior: 'auto'`, NEVER 'smooth', and this is not a style preference.
    // A smooth programmatic scroll inside a `scroll-snap-type: mandatory`
    // container is CANCELLED by the browser — it re-snaps to the target it is
    // already on and the scroll simply does not happen. Measured in Chrome on
    // this very component: `scrollTo({top: 88, behavior: 'smooth'})` left
    // `scrollTop` at 132; the same call with 'auto' landed on 88.
    //
    // The symptom is not a missing animation. The column stops following its
    // own value: choose March and the wheel goes on showing April, and the next
    // settle then reads the stale position back and COMMITS April, undoing the
    // choice. Nothing in this repo could have caught it — jsdom has no layout
    // and stubs `scrollTo` outright, tsc reads no CSS, and axe has no opinion
    // about scroll offsets. It was visible in the workbench, immediately.
    React.useEffect(() => {
      scrollerRef.current?.scrollTo({ top: offsetForIndex(index), behavior: 'auto' });
    }, [index]);

    const settle = React.useCallback(() => {
      const scroller = scrollerRef.current;
      if (!scroller || disabled) return;
      const next = valueAtOffset(items, scroller.scrollTop);
      if (next === null) return;
      if (next !== current) {
        setValue(next);
        return;
      }
      // The row it stopped on resolves to the value already held — which is
      // what happens when a flick lands on a FORBIDDEN row whose nearest
      // allowed neighbour is the current one. Nothing changes, so the effect
      // above never runs, and the column would sit parked on a struck-out row
      // while the picker claims a different date. Put it back by hand.
      scroller.scrollTo({ top: offsetForIndex(index), behavior: 'auto' });
    }, [items, current, index, setValue, disabled]);

    // `scrollend` is the right event and is not everywhere — Safari only
    // shipped it in 18.2 — so a debounce stands in where it is missing. Feature
    // detection rather than a UA check, and the timer is torn down with the
    // component so a pending settle cannot fire into an unmounted tree.
    const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasScrollEnd = typeof window !== 'undefined' && 'onscrollend' in window;
    React.useEffect(
      () => () => {
        if (timerRef.current !== null) clearTimeout(timerRef.current);
      },
      [],
    );

    const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
      trackOffset(event.currentTarget.scrollTop);
      if (hasScrollEnd) return;
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(settle, SETTLE_MS);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      const intent = wheelKeyIntent(event.key, items, current, loop);
      if (intent.kind === 'none') return;
      // Arrows and Page keys would otherwise scroll the nearest scrollable
      // ancestor — which, inside a Drawer, is the sheet the wheel sits in.
      event.preventDefault();
      if (intent.kind === 'value') {
        setValue(intent.value);
        return;
      }
      const hit = type(intent.char);
      if (hit !== null) setValue(hit);
    };

    return (
      <div
        ref={ref}
        className={cn('relative shrink-0', disabled && 'opacity-50', className)}
        // The caller's `style` merges over the height rather than replacing it,
        // which is what lets DatePicker set a column WIDTH without flattening
        // the wheel to nothing.
        style={{ height: WHEEL_HEIGHT, ...style }}
        {...props}
      >
        {/* The band sits BEHIND the scroller so the row's text stays on top of
            it at full contrast. An overlay tinted enough to be visible is an
            overlay dimming the one row that matters most. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-md bg-surface-alt"
          style={{ height: ITEM_HEIGHT }}
        />

        <div
          ref={scrollerRef}
          id={listId}
          role="listbox"
          aria-label={label}
          aria-activedescendant={optionId(current)}
          aria-disabled={disabled ? true : undefined}
          tabIndex={disabled ? -1 : 0}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          onScrollEnd={hasScrollEnd ? settle : undefined}
          className={cn(
            'relative h-full snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-md',
            // A scrollbar down the middle of a date picker is noise, and the
            // columns are narrow enough that it would sit on the numbers.
            '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            focusRing,
          )}
          style={{ paddingBlock: WHEEL_PADDING }}
        >
          {items.map((item, itemIndex) => {
            const selected = item.value === current;
            return (
              <button
                key={item.value}
                type="button"
                id={optionId(item.value)}
                role="option"
                aria-selected={selected}
                aria-disabled={item.disabled ? true : undefined}
                // One tab stop for the column: the listbox itself. Reaching the
                // fortieth row must not mean tabbing past thirty-nine buttons.
                tabIndex={-1}
                onMouseDown={(event) => {
                  // Keep focus on the LISTBOX, which is the element holding
                  // `aria-activedescendant`. A browser focuses a button on
                  // mousedown, and that would park focus on a `tabIndex={-1}`
                  // row: the arrow keys would then go nowhere, and the row
                  // wears the browser's own focus ring on top of the selection
                  // band — visible in the workbench as a stray blue outline
                  // that belongs to no token in this package.
                  event.preventDefault();
                }}
                onClick={() => {
                  // Tapping a row that is not centred selects it, rather than
                  // merely scrolling towards it. It is why the rows are 44px.
                  if (!item.disabled && !disabled) setValue(item.value);
                }}
                className={cn(
                  'flex w-full snap-center items-center justify-center px-sm font-body text-sm tabular-nums text-ink',
                  selected && 'font-medium',
                  // A row outside min/max is marked by a LINE, not by more
                  // fading. Another opacity step here would drop it under the
                  // contrast floor `rowOpacity` exists to stay above, and
                  // WCAG 1.4.1 wants the state carried by something other than
                  // colour anyway.
                  item.disabled ? 'cursor-not-allowed line-through' : 'cursor-pointer',
                )}
                style={{
                  height: ITEM_HEIGHT,
                  opacity: rowOpacity(Math.abs(itemIndex - activeIndex)),
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  },
);
Wheel.displayName = 'Wheel';
