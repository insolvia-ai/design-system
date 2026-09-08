// WEB LEAF — plain React DOM + Tailwind. A single filled `<div>` for
// `circle`/`rect` and for a one-line `text`; `lines` greater than 1 stacks
// that many boxes in a `gap-xs` column instead, the last one narrowed — see
// skeleton.props.ts for the sizing and paragraph-width math this leaf only
// applies.
//
// `children` is intentionally not part of the public prop type — a skeleton
// has no content of its own, only a box (or a stack of boxes) standing in
// for content that has not arrived. `aria-hidden` is likewise omitted from
// the extended DOM props rather than left overridable: see skeleton.props.ts
// for why this component stays silent for assistive tech.
import * as React from 'react';

import { cn } from '../lib/cn';
import {
  resolveHeight,
  resolveLineCount,
  resolveWidth,
  textLineWidth,
  variantRadiusClass,
  type SkeletonOwnProps,
} from './skeleton.props';

export interface SkeletonProps
  extends
    Omit<React.ComponentPropsWithoutRef<'div'>, 'aria-hidden' | 'children'>,
    SkeletonOwnProps {}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    { variant = 'text', width, height, lines, animation = 'pulse', className, style, ...props },
    ref,
  ) => {
    const w = resolveWidth(variant, width);
    const h = resolveHeight(variant, width, height);
    const count = resolveLineCount(variant, lines);
    const radius = variantRadiusClass[variant];
    // `animate-pulse` is Tailwind's own utility; `motion-reduce:` turns it off
    // for a caller with the OS "reduce motion" setting on — the same pairing
    // accordion.web.tsx's open/close transition uses.
    const pulse = animation === 'pulse' && 'animate-pulse motion-reduce:animate-none';

    if (count > 1) {
      return (
        <div
          ref={ref}
          aria-hidden="true"
          className={cn('flex flex-col gap-xs', pulse, className)}
          style={style}
          {...props}
        >
          {Array.from({ length: count }, (_, index) => (
            <span
              key={index}
              className={cn('block shrink-0 bg-surface-alt', radius)}
              style={{ width: textLineWidth(w, index, count), height: h }}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cn(
          'bg-surface-alt',
          radius,
          // Sizing seam: `text`/`rect` are block-level and stretch to fill
          // whatever they're placed in, exactly like a real paragraph or
          // media block would; `circle` hugs its own box, same as Badge and
          // Avatar's `inline-flex shrink-0` roots.
          variant === 'circle' && 'inline-flex shrink-0',
          pulse,
          className,
        )}
        style={{ width: w, height: h, ...style }}
        {...props}
      />
    );
  },
);
Skeleton.displayName = 'Skeleton';
