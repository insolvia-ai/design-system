// WEB LEAF — plain React DOM + Tailwind. A modal dialog anchored to an edge.
//
// Everything Dialog's web leaf does, this does: portal to document.body,
// `role="dialog"`/`aria-modal`, a hand-rolled focus trap with focus-return to
// the opener, Escape and backdrop-click dismissal, and a body scroll lock.
// Closed means unmounted, so the panel's MOUNT effects are its open effects.
//
// The panel is the only thing that differs, and `sideStyles` holds that.
import * as React from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../lib/cn';
import { disabledStyles, focusRing } from '../lib/styles';
import {
  DrawerRootContext,
  sideStyles,
  useDrawerRootContext,
  useDrawerState,
  type DrawerRootOwnProps,
  type DrawerSide,
} from './drawer.props';

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/** Keep Tab / Shift+Tab cycling inside the panel. Same walk as Dialog's. */
function trapTabKey(
  event: React.KeyboardEvent<HTMLDivElement>,
  panel: HTMLDivElement | null,
): void {
  if (!panel) return;
  const focusables = Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector));
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (!first || !last) {
    event.preventDefault();
    return;
  }
  const active = document.activeElement;
  if (event.shiftKey && (active === first || active === panel)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || active === panel)) {
    event.preventDefault();
    first.focus();
  }
}

export interface DrawerRootProps extends DrawerRootOwnProps {
  children?: React.ReactNode;
}

const DrawerRoot = ({
  open,
  defaultOpen,
  onOpenChange,
  side = 'right',
  children,
}: DrawerRootProps) => {
  const state = useDrawerState(open, defaultOpen, onOpenChange);
  const ctx = React.useMemo(() => ({ ...state, side }), [state, side]);
  return <DrawerRootContext.Provider value={ctx}>{children}</DrawerRootContext.Provider>;
};

const DrawerTrigger = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'>>(
  ({ className, onClick, ...props }, ref) => {
    const { open, setOpen } = useDrawerRootContext('Trigger');
    return (
      <button
        ref={ref}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) setOpen(true);
        }}
        className={cn('cursor-pointer', focusRing, disabledStyles, className)}
        {...props}
      />
    );
  },
);
DrawerTrigger.displayName = 'Drawer.Trigger';

const DrawerBackdrop = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, onClick, ...props }, ref) => {
    const { open, setOpen } = useDrawerRootContext('Backdrop');
    if (!open) return null;
    return createPortal(
      <div
        ref={ref}
        data-drawer-backdrop=""
        aria-hidden="true"
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) setOpen(false);
        }}
        className={cn('fixed inset-0 z-40 bg-ink/50', className)}
        {...props}
      />,
      document.body,
    );
  },
);
DrawerBackdrop.displayName = 'Drawer.Backdrop';

export interface DrawerPanelProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Overrides the Root's side for this panel. Rarely needed. */
  side?: DrawerSide | undefined;
}

const DrawerPanelImpl = React.forwardRef<HTMLDivElement, DrawerPanelProps>(
  ({ className, side: sideProp, children, onKeyDown, ...props }, ref) => {
    const { setOpen, titleId, descriptionId, side: rootSide } = useDrawerRootContext('Panel');
    const side = sideProp ?? rootSide;
    const panelRef = React.useRef<HTMLDivElement | null>(null);
    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        panelRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    let hasTitle = false;
    let hasDescription = false;
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      if (child.type === DrawerTitle) hasTitle = true;
      if (child.type === DrawerDescription) hasDescription = true;
    });

    React.useEffect(() => {
      const panel = panelRef.current;
      if (!panel) return undefined;
      const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      (panel.querySelector<HTMLElement>(focusableSelector) ?? panel).focus();
      return () => opener?.focus();
    }, []);

    React.useEffect(() => {
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previous;
      };
    }, []);

    return createPortal(
      <div
        ref={setRefs}
        role="dialog"
        aria-modal="true"
        aria-labelledby={hasTitle ? titleId : undefined}
        aria-describedby={hasDescription ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          if (event.key === 'Escape') {
            event.preventDefault();
            setOpen(false);
            return;
          }
          if (event.key === 'Tab') trapTabKey(event, panelRef.current);
        }}
        className={cn(
          'fixed z-50 flex flex-col gap-md overflow-auto border-line bg-card p-lg shadow-lg outline-none',
          sideStyles[side],
          className,
        )}
        {...props}
      >
        {children}
      </div>,
      document.body,
    );
  },
);
DrawerPanelImpl.displayName = 'Drawer.PanelImpl';

const DrawerPanel = React.forwardRef<HTMLDivElement, DrawerPanelProps>((props, ref) => {
  const { open } = useDrawerRootContext('Panel');
  if (!open) return null;
  return <DrawerPanelImpl ref={ref} {...props} />;
});
DrawerPanel.displayName = 'Drawer.Panel';

const DrawerTitle = React.forwardRef<HTMLHeadingElement, React.ComponentPropsWithoutRef<'h2'>>(
  ({ className, ...props }, ref) => {
    const { titleId } = useDrawerRootContext('Title');
    return (
      <h2
        ref={ref}
        id={titleId}
        className={cn('font-heading text-lg font-semibold text-ink', className)}
        {...props}
      />
    );
  },
);
DrawerTitle.displayName = 'Drawer.Title';

const DrawerDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<'p'>
>(({ className, ...props }, ref) => {
  const { descriptionId } = useDrawerRootContext('Description');
  return (
    <p
      ref={ref}
      id={descriptionId}
      className={cn('font-body text-sm text-muted', className)}
      {...props}
    />
  );
});
DrawerDescription.displayName = 'Drawer.Description';

const DrawerClose = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'>>(
  ({ className, onClick, ...props }, ref) => {
    const { setOpen } = useDrawerRootContext('Close');
    return (
      <button
        ref={ref}
        type="button"
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) setOpen(false);
        }}
        className={cn(
          'cursor-pointer self-start py-xs text-sm font-medium text-ink',
          focusRing,
          disabledStyles,
          className,
        )}
        {...props}
      />
    );
  },
);
DrawerClose.displayName = 'Drawer.Close';

export const Drawer = {
  Root: DrawerRoot,
  Trigger: DrawerTrigger,
  Backdrop: DrawerBackdrop,
  Panel: DrawerPanel,
  Title: DrawerTitle,
  Description: DrawerDescription,
  Close: DrawerClose,
};
