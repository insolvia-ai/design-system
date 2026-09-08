// WEB LEAF — plain React DOM + Tailwind. No CSS `columns`/`column-count`
// anywhere in here — see the rejected-alternative note at the top of
// masonry.props.ts for why. This renders `columns` explicit column `div`s and
// fills them from the shared `distribute` function, which is what keeps this
// leaf's item order identical to the native leaf's for the same props.
//
// Block-level, like every other layout primitive here (Stack, Footer): it
// stretches to its parent's width and declares nothing, so there is no
// `inline-*`/`alignSelf` seam to keep in sync with the native leaf.
import * as React from 'react';

import { cn } from '../lib/cn';
import { distribute, gapClass, type MasonryGap } from './masonry.props';

export interface MasonryProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Number of columns to distribute children into. Defaults to `3`, clamped to a minimum of `1`. */
  columns?: number | undefined;
  /** Spacing token between columns and between items within a column. Defaults to `'sm'`. */
  gap?: MasonryGap | undefined;
  /**
   * Column-major distribution instead of the default round-robin — fill the
   * first column top-to-bottom before moving to the next, the order CSS
   * multi-column would give for free. See `distribute` in `masonry.props.ts`
   * for the exact ordering either mode produces. Defaults to `false`.
   */
  sequential?: boolean | undefined;
  /**
   * Items to distribute. `null`/`undefined`/`boolean` children are skipped
   * rather than reserving an empty column slot.
   */
  children?: React.ReactNode;
}

export const Masonry = React.forwardRef<HTMLDivElement, MasonryProps>(
  ({ className, columns = 3, gap = 'sm', sequential = false, children, ...props }, ref) => {
    const groups = distribute(children, columns, sequential);

    return (
      <div
        ref={ref}
        className={cn('flex flex-row items-start', gapClass[gap], className)}
        {...props}
      >
        {groups.map((items, i) => (
          // `data-column` is the seam tests reach for — it names which bucket
          // `distribute` put each item in, without asserting on layout no
          // test here can compute.
          <div
            key={i}
            data-column={i}
            className={cn('flex min-w-0 flex-1 flex-col', gapClass[gap])}
          >
            {items}
          </div>
        ))}
      </div>
    );
  },
);
Masonry.displayName = 'Masonry';
