// WEB LEAF — plain React DOM + Tailwind. A row of `<Wheel>`s and a card around
// them; every decision about WHICH wheels and WHICH rows is in
// date-picker.props, shared verbatim with the native leaf.
//
// Reads Field's context when there is one, exactly as Select does.
import * as React from 'react';

import { FieldContext } from '../field/field.props';
import { cn } from '../lib/cn';
// The ONE place this package composes one component's leaf inside another's,
// and the explicit `.web` suffix is what makes it legal. The banned form is the
// EXTENSIONLESS `'../wheel/wheel'`: one specifier that must resolve `.web` here
// and `.native` in the sibling leaf, which no single bundler can do — so the
// workbench, rendering both panes in one browser, would silently show the same
// wheel twice. Naming the leaf outright cannot be resolved two ways.
import { Wheel } from '../wheel/wheel.web';
import {
  useDatePickerState,
  type DatePickerColumnKey,
  type DatePickerOwnProps,
} from './date-picker.props';

// `min`/`max` are Omit-ed from the div props because React declares them for
// numeric and native-date inputs, and here they are date STRINGS the shared
// range check compares lexicographically — the date meaning has to win. Same
// reasoning the old DateInput used, and Tabs.Root's `defaultValue`.
export interface DatePickerProps
  extends
    Omit<
      React.ComponentPropsWithoutRef<'div'>,
      'value' | 'defaultValue' | 'onChange' | 'min' | 'max'
    >,
    DatePickerOwnProps {}

/** Names the whole picker when nothing else does. */
const GROUP_LABEL = { date: 'Date', time: 'Time', datetime: 'Date and time' } as const;

/** The gap before a column, so the date group reads apart from the time group. */
function gapBefore(key: DatePickerColumnKey, previous: DatePickerColumnKey | undefined): boolean {
  return previous !== undefined && previous === 'year' && key === 'hour';
}

export const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(
  (
    {
      className,
      mode = 'date',
      value,
      defaultValue,
      onValueChange,
      min,
      max,
      minuteInterval = 1,
      hourCycle = 24,
      today,
      disabled = false,
      name: nameProp,
      ...props
    },
    ref,
  ) => {
    const field = React.useContext(FieldContext);
    const state = useDatePickerState({
      mode,
      value,
      defaultValue,
      onValueChange,
      min,
      max,
      minuteInterval,
      hourCycle,
      today,
    });
    const { columns, groupId, summary, value: current } = state;

    const invalid = field?.invalid ?? false;
    const name = nameProp ?? field?.name;

    return (
      <div
        ref={ref}
        id={field?.controlId}
        role="group"
        // A group inside a Field takes the Field's label; outside one it names
        // itself after the mode, unless the caller says otherwise.
        {...(field ? { 'aria-labelledby': field.labelId } : {})}
        aria-label={field ? undefined : (props['aria-label'] ?? GROUP_LABEL[mode])}
        aria-describedby={field?.describedBy}
        aria-invalid={invalid ? true : undefined}
        aria-disabled={disabled ? true : undefined}
        className={cn(
          'inline-flex w-max flex-col gap-sm rounded-lg border border-line bg-card p-md font-body text-ink',
          invalid && 'border-danger',
          className,
        )}
        {...props}
      >
        {/* Six columns say a date in fragments and never say the DATE. This
            line says the whole thing — visibly, which confirms the composition
            at a glance, and as a live region, which is the only way a
            screen-reader user hears anything but "March, selected". `summarise`
            is shared, so the native leaf says the same words. */}
        <p aria-live="polite" className="text-center text-sm font-medium">
          {summary}
        </p>

        <div id={groupId} className="flex items-stretch">
          {columns.map((column, index) => (
            <Wheel
              key={column.key}
              label={column.label}
              items={column.items}
              value={column.value}
              onValueChange={column.onValueChange}
              loop={column.loop}
              disabled={disabled}
              style={{ width: column.width }}
              className={cn(gapBefore(column.key, columns[index - 1]?.key) && 'ml-sm')}
            />
          ))}
        </div>

        {/* The wheels carry no name of their own: a form post should receive
            one composed value, not six fragments of it. Same shape the old
            DateInput and Select both use. */}
        {name === undefined ? null : <input type="hidden" name={name} value={current} />}
      </div>
    );
  },
);
DatePicker.displayName = 'DatePicker';
