// WEB LEAF — plain React DOM + Tailwind.
//
// The Root draws the box: one border, one radius, one focus ring for the whole
// row. `focus-within:` rather than `focus-visible:` is the point — the thing
// that takes focus is the INPUT inside, and the ring has to appear around the
// group instead. `overflow-hidden` is what lets a square-cornered addon sit
// flush inside a rounded row without every addon needing to know which end it
// is on.
import * as React from 'react';

import { cn } from '../lib/cn';
import { InputGroupContext, type InputGroupRootOwnProps } from './input-group.props';

export interface InputGroupRootProps
  extends React.ComponentPropsWithoutRef<'div'>, InputGroupRootOwnProps {}

const InputGroupRoot = React.forwardRef<HTMLDivElement, InputGroupRootProps>(
  ({ className, invalid = false, disabled = false, children, ...props }, ref) => {
    // One value, so the memo has nothing to depend on — the row is `bare` and
    // that is the whole contract.
    const ctx = React.useMemo(() => ({ bare: true as const }), []);
    return (
      <InputGroupContext.Provider value={ctx}>
        <div
          ref={ref}
          className={cn(
            'flex w-full items-stretch overflow-hidden rounded-md border border-line bg-card',
            'focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 focus-within:ring-offset-bg',
            // The same 40px every plain text control draws; see input.props.ts.
            'h-10',
            invalid && 'border-danger',
            disabled && 'bg-surface-alt opacity-50',
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </InputGroupContext.Provider>
    );
  },
);
InputGroupRoot.displayName = 'InputGroup.Root';

export type InputGroupTextProps = React.ComponentPropsWithoutRef<'span'>;

/**
 * A static addon — a unit, a currency symbol, a domain suffix.
 *
 * Filled with `surface-alt` rather than separated by a divider line, because a
 * fill is one style both leaves render identically; a divider would need each
 * addon to know which end of the row it sits on.
 *
 * NOT a label. An addon reading "kg" does not name the field — a
 * `<Field.Label>` does — so this is plain text with no association wiring, and
 * it stays out of the accessible name on purpose.
 */
const InputGroupText = React.forwardRef<HTMLSpanElement, InputGroupTextProps>(
  ({ className, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'flex shrink-0 items-center whitespace-nowrap bg-surface-alt px-sm font-body text-sm text-muted',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  ),
);
InputGroupText.displayName = 'InputGroup.Text';

export const InputGroup = {
  Root: InputGroupRoot,
  Text: InputGroupText,
};
