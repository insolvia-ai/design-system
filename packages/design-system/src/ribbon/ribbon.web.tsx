// WEB LEAF — plain React DOM + Tailwind.
//
// A ribbon is positioned against its CONTAINER, so the container has to
// establish a positioning context: `<Card.Root className="relative">` on web,
// a `position: 'relative'` View on native. Both leaves need it and neither can
// do it for the caller without taking over a box it does not own — so the
// requirement is documented on the prop instead of enforced.
import * as React from 'react';

import { cn } from '../lib/cn';
import { positionStyles, toneStyles, type RibbonPosition, type RibbonTone } from './ribbon.props';

export interface RibbonProps extends React.ComponentPropsWithoutRef<'span'> {
  tone?: RibbonTone | undefined;
  /**
   * Which corner of the nearest positioned ancestor to pin to. That ancestor
   * must be positioned (`relative`) or the ribbon escapes to the page.
   */
  position?: RibbonPosition | undefined;
}

export const Ribbon = React.forwardRef<HTMLSpanElement, RibbonProps>(
  ({ className, tone = 'primary', position = 'top-right', children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'absolute z-10 inline-flex items-center px-sm py-xs font-body text-xs font-semibold',
        toneStyles[tone],
        positionStyles[position],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  ),
);
Ribbon.displayName = 'Ribbon';
