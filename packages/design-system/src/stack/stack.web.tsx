// WEB LEAF — plain React DOM + Tailwind. Always a `<div>`: polymorphism
// (`as="section" | "ul" | "nav"`) is deliberately out of scope. Stack's job
// is spacing, not semantics — a caller that needs a `<nav>` or a `<ul>`
// wraps a Stack in one rather than asking Stack to become one, which keeps
// this component's variant surface to the four axes below instead of a
// fifth that duplicates what a semantic wrapper already does for free.
//
// Block-level, like every other layout primitive here (Footer, Sidebar's
// panel) — it stretches to its parent's width and declares nothing, so
// there is no `inline-*`/`alignSelf` seam to keep in sync with the native
// leaf.
import * as React from 'react';

import { cn } from '../lib/cn';
import {
  alignClass,
  directionClass,
  gapClass,
  justifyClass,
  withDividers,
  type StackAlign,
  type StackDirection,
  type StackGap,
  type StackJustify,
} from './stack.props';

export interface StackProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Flex-direction. Defaults to `'column'`. */
  direction?: StackDirection | undefined;
  /** Spacing token between children. Defaults to `'md'`. */
  gap?: StackGap | undefined;
  /** Cross-axis alignment (`align-items`). Defaults to `'stretch'`. */
  align?: StackAlign | undefined;
  /** Main-axis alignment (`justify-content`). Defaults to `'start'`. */
  justify?: StackJustify | undefined;
  /** Allow children to wrap onto additional lines. Defaults to `false`. */
  wrap?: boolean | undefined;
  /**
   * Rendered between every pair of children — pass a `<Separator>`-like
   * element. Stack does not import `Separator` itself: it has no opinion on
   * what a divider looks like, only on where it goes, and importing it would
   * force every Stack consumer to pay for a component they may not use.
   */
  divider?: React.ReactNode;
}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  (
    {
      className,
      direction = 'column',
      gap = 'md',
      align = 'stretch',
      justify = 'start',
      wrap = false,
      divider,
      children,
      ...props
    },
    ref,
  ) => (
    <div
      ref={ref}
      className={cn(
        'flex',
        directionClass[direction],
        gapClass[gap],
        alignClass[align],
        justifyClass[justify],
        wrap ? 'flex-wrap' : null,
        className,
      )}
      {...props}
    >
      {divider ? withDividers(children, divider) : children}
    </div>
  ),
);
Stack.displayName = 'Stack';
