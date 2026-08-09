// WEB LEAF — plain React DOM + Tailwind, following the APG date-picker grid:
// a `role="grid"` of `gridcell`s with a ROVING TABINDEX, so the whole month is
// one tab stop and the arrows move within it. Tabbing through 42 buttons to
// reach the 15th is the failure that pattern exists to prevent.
import * as React from 'react';

import { cn } from '../lib/cn';
import { disabledStyles, focusRing } from '../lib/styles';
import { isOutOfRange } from '../lib/date';
import {
  calendarKeyIntent,
  dayLabel,
  monthLabel,
  shiftMonths,
  useCalendarState,
  WEEKDAYS,
  type CalendarOwnProps,
} from './calendar.props';

export interface CalendarProps
  extends
    Omit<React.ComponentPropsWithoutRef<'div'>, 'defaultValue' | 'onChange'>,
    CalendarOwnProps {}

export const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  (
    { className, value, defaultValue, onValueChange, min, max, defaultMonth, today, ...props },
    ref,
  ) => {
    const state = useCalendarState({
      value,
      defaultValue,
      onValueChange,
      min,
      max,
      defaultMonth,
      today,
    });
    const { weeks, focused, setFocused, select, viewMonth, setViewMonth, gridId, labelId } = state;
    const gridRef = React.useRef<HTMLTableSectionElement | null>(null);

    // Follow the roving tabindex with real focus, but only once the user is
    // inside the grid — otherwise merely rendering the calendar would steal
    // focus from wherever the page had it.
    const insideRef = React.useRef(false);
    React.useEffect(() => {
      if (!insideRef.current) return;
      gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
    }, [focused]);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTableSectionElement>) => {
      const intent = calendarKeyIntent(event.key, focused);
      if (intent.kind === 'none') return;
      // Arrows would scroll the page and Space would too; Enter would submit a
      // surrounding form.
      event.preventDefault();
      if (intent.kind === 'focus') setFocused(intent.iso);
      else select(intent.iso);
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex w-max flex-col gap-sm rounded-lg border border-line bg-card p-md font-body text-sm text-ink',
          className,
        )}
        {...props}
      >
        <div className="flex items-center justify-between gap-sm">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setViewMonth(shiftMonths(viewMonth, -1))}
            className={cn(
              'flex size-8 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-surface-alt',
              focusRing,
              disabledStyles,
            )}
          >
            <span aria-hidden="true">&#8249;</span>
          </button>
          {/* `aria-live="polite"` so paging announces the new month. Without
              it a screen-reader user pressing "next" hears nothing at all. */}
          <span id={labelId} aria-live="polite" className="font-medium">
            {monthLabel(viewMonth)}
          </span>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setViewMonth(shiftMonths(viewMonth, 1))}
            className={cn(
              'flex size-8 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-surface-alt',
              focusRing,
              disabledStyles,
            )}
          >
            <span aria-hidden="true">&#8250;</span>
          </button>
        </div>

        <table id={gridId} role="grid" aria-labelledby={labelId} className="border-collapse">
          <thead>
            <tr>
              {WEEKDAYS.map((weekday) => (
                <th
                  key={weekday}
                  scope="col"
                  // The full name is what a screen reader should read; the
                  // three letters are what the column has room for.
                  abbr={weekday}
                  className="size-10 p-0 text-center text-xs font-semibold text-muted"
                >
                  {weekday}
                </th>
              ))}
            </tr>
          </thead>
          <tbody
            ref={gridRef}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              insideRef.current = true;
            }}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                insideRef.current = false;
              }
            }}
          >
            {weeks.map((week) => (
              <tr key={week[0]?.iso}>
                {week.map((day) => {
                  const selected = day.iso === state.value;
                  const disabled = isOutOfRange(day.iso, min, max);
                  const isFocused = day.iso === focused;
                  return (
                    <td key={day.iso} role="gridcell" aria-selected={selected} className="p-0">
                      <button
                        type="button"
                        // "5 March 2026", not "5" — the grid shows two 5s in
                        // most months. See `dayLabel`.
                        aria-label={dayLabel(day.iso)}
                        // The roving tabindex: exactly one cell is tabbable,
                        // and the arrows move which one.
                        tabIndex={isFocused ? 0 : -1}
                        aria-disabled={disabled ? true : undefined}
                        aria-current={day.iso === today ? 'date' : undefined}
                        onClick={() => {
                          if (!disabled) select(day.iso);
                        }}
                        className={cn(
                          'flex size-10 cursor-pointer items-center justify-center rounded-md',
                          !day.inMonth && 'text-muted',
                          selected && 'bg-primary font-medium text-primary-text',
                          !selected && !disabled && 'hover:bg-surface-alt',
                          disabled && 'cursor-not-allowed text-muted opacity-50',
                          focusRing,
                        )}
                      >
                        {day.day}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
);
Calendar.displayName = 'Calendar';
