// WEB LEAF — plain React DOM + Tailwind. No react-native. Vite resolves this.
import * as React from 'react';

import { iconButtonClass, type IconButtonOwnProps } from './icon-button.props';

// `aria-label` and `title` are Omit-ed from the button props because `label`
// owns both: leaving them open would let a caller name the control twice, and
// the two names would be free to disagree — the aria-label wins in the
// accessibility tree and the title is what a pointer user reads, so a
// disagreement is invisible to whoever wrote it. `children` is Omit-ed and
// re-declared REQUIRED (see IconButtonOwnProps).
export interface IconButtonProps
  extends
    Omit<React.ComponentPropsWithoutRef<'button'>, 'aria-label' | 'title' | 'children'>,
    IconButtonOwnProps {}

/**
 * A square, icon-only `<button>`. Anything that NAVIGATES is an `<a>` styled
 * with `iconButtonClass`, not this — the same split Button documents.
 */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, label, intent = 'ghost', size = 'md', pressed, type, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type ?? 'button'}
        aria-label={label}
        title={label}
        // `undefined` omits the attribute entirely rather than rendering
        // `aria-pressed="false"`, which would announce a toggle on a button
        // that is not one. See IconButtonOwnProps.pressed.
        aria-pressed={pressed}
        className={iconButtonClass({ intent, size, pressed, className })}
        {...props}
      />
    );
  },
);

IconButton.displayName = 'IconButton';
