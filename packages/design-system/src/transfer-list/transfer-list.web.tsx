// WEB LEAF — plain React DOM + Tailwind. Shares its entire state model with
// the native leaf via transfer-list.props; what lives here is the DOM: two
// `<fieldset>`s (a `<legend>` per Material UI's own "Transfer List" pattern —
// this is a layout the APG has no named widget for, so plain form semantics
// carry it rather than an invented ARIA role) around `<ul role="list">`s of
// real `<input type="checkbox">` rows, and a middle column of plain buttons.
//
// REAL CHECKBOXES, not `Checkbox.Root` — a leaf may not import another
// component's leaf (see the design-system-component skill), and re-deriving
// `role="checkbox"` + `aria-checked` here would be the exact hand-rolled a11y
// surface a native `<input>` gives for free, including Space/click toggling
// with no key handler. The row's hit target is the wrapping `<label>`, so the
// input itself never needs its own padding.
import * as React from 'react';

import { buttonClass } from '../button/button.props';
import { cn } from '../lib/cn';
import { disabledStyles, focusRing } from '../lib/styles';
import {
  resolveLabels,
  useTransferListState,
  type TransferListOption,
  type TransferListOwnProps,
} from './transfer-list.props';

export interface TransferListProps
  extends
    Omit<React.ComponentPropsWithoutRef<'div'>, 'defaultValue' | 'onChange'>,
    TransferListOwnProps {}

export const TransferList = React.forwardRef<HTMLDivElement, TransferListProps>(
  (
    {
      className,
      options,
      value,
      defaultValue,
      onValueChange,
      labels: labelsProp,
      showMoveAll = true,
      disabled = false,
      orientation = 'horizontal',
      'aria-label': ariaLabel,
      ...props
    },
    ref,
  ) => {
    const labels = resolveLabels(labelsProp);
    const state = useTransferListState(options, value, defaultValue, onValueChange);
    const vertical = orientation === 'vertical';

    return (
      <div
        ref={ref}
        role="group"
        aria-label={ariaLabel ?? 'Transfer list'}
        className={cn('flex gap-md', vertical ? 'flex-col' : 'flex-row items-start', className)}
        {...props}
      >
        <Column
          label={labels.available}
          options={state.left}
          checked={state.checkedLeft}
          onToggle={state.toggleLeft}
          disabled={disabled}
        />

        <div
          className={cn(
            'flex shrink-0 gap-sm',
            vertical ? 'flex-row justify-center' : 'flex-col justify-center',
          )}
        >
          <button
            type="button"
            aria-label={labels.moveRight}
            disabled={disabled || !state.canMoveSelectedRight}
            onClick={state.moveSelectedRight}
            className={buttonClass({ intent: 'secondary', size: 'sm' })}
          >
            <span aria-hidden="true">›</span>
          </button>
          <button
            type="button"
            aria-label={labels.moveLeft}
            disabled={disabled || !state.canMoveSelectedLeft}
            onClick={state.moveSelectedLeft}
            className={buttonClass({ intent: 'secondary', size: 'sm' })}
          >
            <span aria-hidden="true">‹</span>
          </button>
          {showMoveAll && (
            <button
              type="button"
              aria-label={labels.moveAllRight}
              disabled={disabled || !state.canMoveAllRight}
              onClick={state.moveAllRight}
              className={buttonClass({ intent: 'secondary', size: 'sm' })}
            >
              <span aria-hidden="true">»</span>
            </button>
          )}
          {showMoveAll && (
            <button
              type="button"
              aria-label={labels.moveAllLeft}
              disabled={disabled || !state.canMoveAllLeft}
              onClick={state.moveAllLeft}
              className={buttonClass({ intent: 'secondary', size: 'sm' })}
            >
              <span aria-hidden="true">«</span>
            </button>
          )}
        </div>

        <Column
          label={labels.chosen}
          options={state.right}
          checked={state.checkedRight}
          onToggle={state.toggleRight}
          disabled={disabled}
        />
      </div>
    );
  },
);
TransferList.displayName = 'TransferList';

function Column({
  label,
  options,
  checked,
  onToggle,
  disabled,
}: {
  label: string;
  options: readonly TransferListOption[];
  checked: ReadonlySet<string>;
  onToggle: (value: string) => void;
  disabled: boolean;
}) {
  const checkedCount = options.reduce((n, option) => n + (checked.has(option.value) ? 1 : 0), 0);

  return (
    <fieldset className="min-w-0 flex-1 rounded-md" disabled={disabled}>
      <legend className="px-xs pb-xs text-sm font-medium text-ink">
        {label} ({checkedCount} selected / {options.length})
      </legend>
      <ul
        role="list"
        className="max-h-64 overflow-y-auto overscroll-contain rounded-md border border-line bg-card"
      >
        {options.map((option) => {
          const rowDisabled = disabled || (option.disabled ?? false);
          const isChecked = checked.has(option.value);
          return (
            <li key={option.value} data-state={isChecked ? 'checked' : 'unchecked'}>
              <label
                className={cn(
                  'flex touch-manipulation items-center gap-sm px-sm py-xs text-sm text-ink',
                  rowDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                )}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={rowDisabled}
                  onChange={() => onToggle(option.value)}
                  className={cn(
                    'h-4 w-4 shrink-0 touch-manipulation rounded-sm border border-line',
                    focusRing,
                    disabledStyles,
                  )}
                />
                <span className="truncate">{option.label}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
