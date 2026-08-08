// WEB LEAF — plain React DOM + Tailwind.
import * as React from 'react';

import { cn } from '../lib/cn';
import { dotStyles, hasDot, sizeStyles, type BadgeIntent, type BadgeSize } from './badge.props';

export interface BadgeProps extends React.ComponentPropsWithoutRef<'span'> {
  intent?: BadgeIntent | undefined;
  size?: BadgeSize | undefined;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, intent = 'neutral', size = 'md', children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-pill bg-surface-alt font-body font-medium text-ink',
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {hasDot(intent) ? (
        // Decorative — the badge's own text carries the meaning. See the
        // contrast note in badge.props.ts for why intent is a dot at all.
        <span
          aria-hidden="true"
          className={cn('size-1.5 shrink-0 rounded-pill', dotStyles[intent])}
        />
      ) : null}
      {children}
    </span>
  ),
);
Badge.displayName = 'Badge';
