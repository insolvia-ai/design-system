// WEB LEAF — plain React DOM + Tailwind. A CSS-animated ring rather than an
// SVG: no markup to keep in sync with the native leaf, and `animate-spin` is
// already in Tailwind's own layer.
//
// `role="progressbar"` with no `aria-valuenow`, which is how ARIA spells
// "indeterminate" — the native leaf says the same thing through
// `accessibilityRole="progressbar"`, so both panes announce identically.
import * as React from 'react';

import { cn } from '../lib/cn';
import { DEFAULT_SPINNER_LABEL, sizeStyles, type SpinnerSize } from './spinner.props';

export interface SpinnerProps extends React.ComponentPropsWithoutRef<'span'> {
  size?: SpinnerSize | undefined;
  /** The accessible name. See `DEFAULT_SPINNER_LABEL`. */
  label?: string | undefined;
}

export const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ className, size = 'md', label = DEFAULT_SPINNER_LABEL, ...props }, ref) => (
    <span
      ref={ref}
      role="progressbar"
      aria-label={label}
      className={cn('inline-flex', className)}
      {...props}
    >
      {/* The ring itself is decorative: the name lives on the role above, and
          a second labelled node would be announced twice. `border-line` is the
          track, `border-t-primary` the moving arc. */}
      <span
        aria-hidden="true"
        className={cn('animate-spin rounded-pill border-line border-t-primary', sizeStyles[size])}
      />
    </span>
  ),
);
Spinner.displayName = 'Spinner';
