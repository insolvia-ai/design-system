// WEB LEAF — plain React DOM + Tailwind. A `<span>` clipped with the standard
// sr-only pattern (Tailwind ships `sr-only`/`focus:not-sr-only` as a matched
// pair, so this leaf spends no CSS of its own defining the clip rect). The
// span, never a `<div>`: this wraps inline content — a label beside an icon,
// a word inside a sentence — and a block element here would insert a line
// break a sighted layout never asked for.
import * as React from 'react';

import { focusRing } from '../lib/styles';
import { cn } from '../lib/cn';
import type { VisuallyHiddenOwnProps } from './visually-hidden.props';

export interface VisuallyHiddenProps
  extends Omit<React.ComponentPropsWithoutRef<'span'>, 'children'>, VisuallyHiddenOwnProps {}

export const VisuallyHidden = React.forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  ({ className, focusable = false, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn('sr-only', focusable && cn('focus:not-sr-only', focusRing), className)}
      {...props}
    >
      {children}
    </span>
  ),
);
VisuallyHidden.displayName = 'VisuallyHidden';
