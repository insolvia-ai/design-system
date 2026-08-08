// WEB LEAF — plain React DOM + Tailwind.
//
// Rendered INLINE and absolutely positioned rather than portaled, the way
// Select's list is: a tooltip is small, never scrolls, and belongs in the DOM
// beside the thing it describes so `aria-describedby` reads naturally.
//
// The trigger owns hover AND focus. Dropping the focus half is the classic
// tooltip defect — it makes the content unreachable by keyboard — and Escape
// dismissal is a WCAG 1.4.13 requirement for anything that appears on hover.
import * as React from 'react';

import { cn } from '../lib/cn';
import { disabledStyles, focusRing } from '../lib/styles';
import {
  TooltipContext,
  useTooltipContext,
  useTooltipState,
  type TooltipRootOwnProps,
} from './tooltip.props';

export interface TooltipRootProps extends TooltipRootOwnProps {
  children?: React.ReactNode;
}

const TooltipRoot = ({ open, defaultOpen, onOpenChange, children }: TooltipRootProps) => {
  const ctx = useTooltipState(open, defaultOpen, onOpenChange);
  return (
    <TooltipContext.Provider value={ctx}>
      {/* `inline-flex` + `relative` so the bubble positions against the
          trigger rather than the page. */}
      <span className="relative inline-flex">{children}</span>
    </TooltipContext.Provider>
  );
};

export type TooltipTriggerProps = React.ComponentPropsWithoutRef<'button'>;

const TooltipTrigger = React.forwardRef<HTMLButtonElement, TooltipTriggerProps>(
  ({ className, onMouseEnter, onMouseLeave, onFocus, onBlur, onKeyDown, ...props }, ref) => {
    const { open, setOpen, tooltipId } = useTooltipContext('Trigger');
    return (
      <button
        ref={ref}
        type="button"
        // `aria-describedby` and not `aria-labelledby`: a tooltip adds detail
        // to a control that already has a name. Pointed at only while the
        // bubble exists, so it never names an element that is not there.
        aria-describedby={open ? tooltipId : undefined}
        onMouseEnter={(event) => {
          onMouseEnter?.(event);
          setOpen(true);
        }}
        onMouseLeave={(event) => {
          onMouseLeave?.(event);
          setOpen(false);
        }}
        onFocus={(event) => {
          onFocus?.(event);
          setOpen(true);
        }}
        onBlur={(event) => {
          onBlur?.(event);
          setOpen(false);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          // WCAG 1.4.13: content shown on hover or focus must be dismissable
          // without moving the pointer or the focus.
          if (event.key === 'Escape') setOpen(false);
        }}
        className={cn('cursor-default', focusRing, disabledStyles, className)}
        {...props}
      />
    );
  },
);
TooltipTrigger.displayName = 'Tooltip.Trigger';

export type TooltipContentProps = React.ComponentPropsWithoutRef<'div'>;

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open, tooltipId } = useTooltipContext('Content');
    if (!open) return null;
    return (
      <div
        ref={ref}
        id={tooltipId}
        role="tooltip"
        className={cn(
          // `bg-ink`/`text-bg` is the one high-contrast inversion the tokens
          // guarantee in both schemes — the same pairing in reverse that
          // `ribbon.props.ts` reasons about.
          'absolute bottom-full left-1/2 z-20 mb-xs w-max max-w-[16rem] -translate-x-1/2',
          'rounded-md bg-ink px-sm py-xs font-body text-xs text-bg shadow-md',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
TooltipContent.displayName = 'Tooltip.Content';

export const Tooltip = {
  Root: TooltipRoot,
  Trigger: TooltipTrigger,
  Content: TooltipContent,
};
