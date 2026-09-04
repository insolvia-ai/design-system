// WEB LEAF — plain React DOM + Tailwind.
//
// Inline and absolutely positioned, anchored to the trigger, like Select's
// list — not portaled like Dialog. A popover is non-modal: no focus trap, no
// scroll lock, no backdrop. What it does owe is the two dismissals a
// non-modal surface must have — Escape, and a pointer press outside it.
//
// NO `container` PROP, unlike Dialog, Drawer and AlertDialog. Those portal to
// `document.body` and so vanish when some other element is fullscreen — only a
// fullscreen element's descendants are painted — which is what their
// `container` prop aims elsewhere. This leaf never leaves the tree: the
// surface is `position: absolute` inside the Root's `relative` box, which is
// what anchors it to its own trigger. A popover whose trigger is inside the
// fullscreen element is therefore inside it too, with nothing to configure,
// and portaling it anywhere would break the anchoring outright — the offsets
// are measured from the Root, not the viewport. The test file pins that.
import * as React from 'react';

import { cn } from '../lib/cn';
import { disabledStyles, focusRing } from '../lib/styles';
import {
  PopoverContext,
  usePopoverContext,
  usePopoverState,
  type PopoverRootOwnProps,
} from './popover.props';

export interface PopoverRootProps extends PopoverRootOwnProps {
  children?: React.ReactNode;
}

const PopoverRoot = ({ open, defaultOpen, onOpenChange, children }: PopoverRootProps) => {
  const ctx = usePopoverState(open, defaultOpen, onOpenChange);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const { open: isOpen, setOpen } = ctx;

  // Outside-press dismissal. `pointerdown` rather than `click`, so a press
  // that starts outside dismisses even if the pointer is released elsewhere,
  // and so a drag-select inside the popover never counts as "outside".
  React.useEffect(() => {
    if (!isOpen) return undefined;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node | null)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [isOpen, setOpen]);

  return (
    <PopoverContext.Provider value={ctx}>
      <div
        ref={rootRef}
        // Escape is handled HERE, on the root, not on the Content.
        //
        // A popover does not move focus when it opens — that is what makes it
        // non-modal — so after clicking the trigger the keyboard is still ON
        // THE TRIGGER, and a handler bound to the surface never sees the
        // keystroke. The first draft did exactly that and Escape did nothing,
        // which the test caught. The root wraps both parts, so the event
        // bubbles here wherever focus happens to be.
        onKeyDown={(event) => {
          if (event.defaultPrevented || !isOpen) return;
          if (event.key === 'Escape') {
            event.preventDefault();
            setOpen(false);
          }
        }}
        className="relative inline-flex"
      >
        {children}
      </div>
    </PopoverContext.Provider>
  );
};

export type PopoverTriggerProps = React.ComponentPropsWithoutRef<'button'>;

const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ className, onClick, ...props }, ref) => {
    const { open, setOpen, contentId } = usePopoverContext('Trigger');
    return (
      <button
        ref={ref}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        // Only while the surface exists: it must name an element that is there.
        aria-controls={open ? contentId : undefined}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) setOpen(!open);
        }}
        className={cn('cursor-pointer', focusRing, disabledStyles, className)}
        {...props}
      />
    );
  },
);
PopoverTrigger.displayName = 'Popover.Trigger';

export interface PopoverContentProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Names the surface. Omit when a `Popover.Title` is rendered inside it. */
  label?: string | undefined;
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, label, children, onKeyDown, ...props }, ref) => {
    const { open, setOpen, contentId, titleId } = usePopoverContext('Content');
    if (!open) return null;

    // Same child-presence scan as Field.Root and Dialog.Popup: point at the
    // title only when a title is actually rendered, because a dangling
    // reference to an absent id is its own a11y defect.
    let hasTitle = false;
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === PopoverTitle) hasTitle = true;
    });

    return (
      <div
        ref={ref}
        id={contentId}
        // A non-modal dialog: `role="dialog"` WITHOUT `aria-modal`. Adding
        // aria-modal would tell a screen reader the rest of the page is inert
        // while it demonstrably is not — the page keeps scrolling and every
        // control behind stays clickable.
        role="dialog"
        aria-labelledby={hasTitle ? titleId : undefined}
        aria-label={hasTitle ? undefined : label}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          if (event.key === 'Escape') {
            event.preventDefault();
            setOpen(false);
          }
        }}
        className={cn(
          'absolute left-0 top-full z-20 mt-xs flex w-max max-w-[20rem] flex-col gap-sm',
          'rounded-lg border border-line bg-card p-md shadow-lg',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
PopoverContent.displayName = 'Popover.Content';

const PopoverTitle = React.forwardRef<HTMLHeadingElement, React.ComponentPropsWithoutRef<'h3'>>(
  ({ className, ...props }, ref) => {
    const { titleId } = usePopoverContext('Title');
    return (
      <h3
        ref={ref}
        id={titleId}
        className={cn('font-heading text-sm font-semibold text-ink', className)}
        {...props}
      />
    );
  },
);
PopoverTitle.displayName = 'Popover.Title';

const PopoverClose = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'>>(
  ({ className, onClick, ...props }, ref) => {
    const { setOpen } = usePopoverContext('Close');
    return (
      <button
        ref={ref}
        type="button"
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) setOpen(false);
        }}
        className={cn(
          'cursor-pointer self-start py-xs font-body text-sm font-medium text-ink',
          focusRing,
          disabledStyles,
          className,
        )}
        {...props}
      />
    );
  },
);
PopoverClose.displayName = 'Popover.Close';

export const Popover = {
  Root: PopoverRoot,
  Trigger: PopoverTrigger,
  Content: PopoverContent,
  Title: PopoverTitle,
  Close: PopoverClose,
};
