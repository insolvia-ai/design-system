// WEB LEAF — plain React DOM + Tailwind, WAI-ARIA modal dialog. Shares the
// open/close machine and the title/description ids with the native leaf
// (dialog.props); what lives here is the DOM behavior: backdrop and popup
// portaled into document.body (react-dom is fine in a .web leaf — it is the
// web consumer's renderer), role="dialog"/aria-modal, a hand-rolled focus trap
// with focus-return to the opener, Escape + backdrop-click dismissal, and a
// body scroll lock. Closed means unmounted — nothing renders, no exit
// animation — so the popup's MOUNT effects are its open effects.
//
// The portal target is `document.body` unless `Dialog.Root` is handed a
// `container`. That prop exists because the Fullscreen API paints ONLY the
// fullscreen element's descendants: while some other element is fullscreen, a
// dialog portaled to the body is mounted, focused, keyboard-reachable and
// completely invisible. A consumer that puts a surface into fullscreen passes
// that element and the whole dialog — backdrop and popup — mounts inside it.
//
// POSITIONING IS UNCHANGED BY THE TARGET. Both parts are `position: fixed`,
// which resolves against the VIEWPORT wherever the element is mounted, and the
// UA gives a fullscreen element `position: fixed; inset: 0` — the same rect,
// so `fixed inset-0` and the centring translate still land where they read.
// The one thing that would move them is `transform`, `filter`, `perspective`,
// `contain` or `will-change` on the container or anything between it and the
// popup: any of those makes that element the containing block for fixed
// descendants. Keep them off the element you pass.
import * as React from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../lib/cn';
import { disabledStyles, focusRing } from '../lib/styles';
import {
  DialogRootContext,
  useDialogRootContext,
  useDialogState,
  type DialogRootOwnProps,
} from './dialog.props';

// What the trap and the initial-focus walk consider tabbable. Covers
// everything a dialog card actually renders; a bespoke widget can always opt
// itself in with tabindex="0". The popup's own tabindex="-1" is deliberately
// excluded — it is a focus TARGET of last resort, not a tab stop.
const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Keep Tab / Shift+Tab cycling inside the popup — a keydown walk over the
 * popup's focusable elements, no dependency needed. With nothing tabbable the
 * key is swallowed so focus stays parked on the popup itself.
 */
function trapTabKey(
  event: React.KeyboardEvent<HTMLDivElement>,
  popup: HTMLDivElement | null,
): void {
  if (!popup) return;
  const focusables = Array.from(popup.querySelectorAll<HTMLElement>(focusableSelector));
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (!first || !last) {
    event.preventDefault();
    return;
  }
  const active = document.activeElement;
  if (event.shiftKey && (active === first || active === popup)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || active === popup)) {
    event.preventDefault();
    first.focus();
  }
}

// The portal target, WEB-ONLY on purpose and deliberately a SECOND context
// rather than another member on DialogContextValue: `dialog.props.ts` is
// compiled by the native typecheck program too, which has no DOM lib, so an
// `HTMLElement` cannot live there. A portal target is DOM behavior, and DOM
// behavior is what a leaf owns.
const DialogPortalContext = React.createContext<HTMLElement | null>(null);

/** Where the parts portal: the Root's `container`, else `document.body`. */
function usePortalContainer(): HTMLElement {
  return React.useContext(DialogPortalContext) ?? document.body;
}

export interface DialogRootProps extends DialogRootOwnProps {
  children?: React.ReactNode;
  /**
   * Portal the backdrop and popup into this element instead of
   * `document.body` — for a consumer whose page can go fullscreen, where only
   * the fullscreen element's descendants are painted. Omitted or `null` is
   * today's behavior exactly.
   *
   * An ELEMENT, not a ref: the parts read it WHILE RENDERING, and a ref filled
   * by the same commit is still `null` on the render that mounts them — the
   * popup would portal to the body once and never move. Hold the node in
   * state (`useState<HTMLElement | null>`) and pass that.
   */
  container?: HTMLElement | null | undefined;
}

// Renders no element of its own — it is the state owner and context provider.
const DialogRoot = ({
  open,
  defaultOpen,
  onOpenChange,
  container = null,
  children,
}: DialogRootProps) => {
  const ctx = useDialogState(open, defaultOpen, onOpenChange);
  return (
    <DialogRootContext.Provider value={ctx}>
      <DialogPortalContext.Provider value={container}>{children}</DialogPortalContext.Provider>
    </DialogRootContext.Provider>
  );
};

const DialogTrigger = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'>>(
  ({ className, onClick, ...props }, ref) => {
    const { open, setOpen } = useDialogRootContext('Trigger');
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
DialogTrigger.displayName = 'Dialog.Trigger';

const DialogBackdrop = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, onClick, ...props }, ref) => {
    const { open, setOpen } = useDialogRootContext('Backdrop');
    const container = usePortalContainer();
    if (!open) return null;
    return createPortal(
      <div
        ref={ref}
        data-dialog-backdrop=""
        // Decorative scrim: hidden from the accessibility tree; clicking it is
        // the pointer path to dismissal (Escape is the keyboard path).
        aria-hidden="true"
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) setOpen(false);
        }}
        className={cn('fixed inset-0 z-40 bg-ink/50', className)}
        {...props}
      />,
      container,
    );
  },
);
DialogBackdrop.displayName = 'Dialog.Backdrop';

export type DialogPopupProps = React.ComponentPropsWithoutRef<'div'>;

// Mounted only while open, so its mount effects ARE the open effects: move
// focus in on open, return it to the opener on close, lock body scroll.
const DialogPopupImpl = React.forwardRef<HTMLDivElement, DialogPopupProps>(
  ({ className, children, onKeyDown, ...props }, ref) => {
    const { setOpen, titleId, descriptionId } = useDialogRootContext('Popup');
    const container = usePortalContainer();
    const popupRef = React.useRef<HTMLDivElement | null>(null);
    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        popupRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    // Same child-presence scan as Field.Root: aria-labelledby/-describedby
    // are composed from ONLY the parts actually rendered — a dangling
    // reference to an absent id is its own a11y defect. The scan compares
    // against THIS leaf's Title/Description identities.
    let hasTitle = false;
    let hasDescription = false;
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      if (child.type === DialogTitle) hasTitle = true;
      if (child.type === DialogDescription) hasDescription = true;
    });

    // Focus in on open (first focusable, else the popup itself), back to the
    // opener on close. The opener is whatever held focus at mount — for a
    // trigger-opened dialog that is the trigger, with no ref plumbing needed.
    React.useEffect(() => {
      const popup = popupRef.current;
      if (!popup) return undefined;
      const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      (popup.querySelector<HTMLElement>(focusableSelector) ?? popup).focus();
      return () => opener?.focus();
    }, []);

    // Body scroll lock while open; restore whatever was there on close. Stays
    // on the BODY whatever `container` is — the element that scrolls the page
    // is the body regardless of where the popup happens to be mounted.
    React.useEffect(() => {
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previous;
      };
    }, []);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key === 'Tab') trapTabKey(event, popupRef.current);
    };

    return createPortal(
      <div
        ref={setRefs}
        role="dialog"
        aria-modal="true"
        aria-labelledby={hasTitle ? titleId : undefined}
        aria-describedby={hasDescription ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={cn(
          // `max-w-md` is the 28rem container width — and for a long while it
          // was not. theme.css names its spacing steps with t-shirt sizes, and
          // Tailwind v4 resolves a named `max-w-*` from `--spacing-*` ahead of
          // its own `--container-*`, so `max-w-md` compiled to 16px: the card
          // collapsed below its own `p-lg` padding and every word wrapped onto
          // its own line. This read `max-w-[28rem]` to dodge that. theme.css now
          // holds the four width utilities on the container scale instead, so
          // the class can say what it means; `styles/theme.test.ts` is what
          // fails if the shadowing ever comes back.
          'fixed left-1/2 top-1/2 z-50 flex w-full max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-md rounded-lg bg-card p-lg shadow-lg outline-none',
          className,
        )}
        {...props}
      >
        {children}
      </div>,
      container,
    );
  },
);
DialogPopupImpl.displayName = 'Dialog.PopupImpl';

const DialogPopup = React.forwardRef<HTMLDivElement, DialogPopupProps>((props, ref) => {
  const { open } = useDialogRootContext('Popup');
  if (!open) return null;
  return <DialogPopupImpl ref={ref} {...props} />;
});
DialogPopup.displayName = 'Dialog.Popup';

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.ComponentPropsWithoutRef<'h2'>>(
  ({ className, ...props }, ref) => {
    const { titleId } = useDialogRootContext('Title');
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
DialogTitle.displayName = 'Dialog.Title';

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<'p'>
>(({ className, ...props }, ref) => {
  const { descriptionId } = useDialogRootContext('Description');
  return (
    <p
      ref={ref}
      id={descriptionId}
      className={cn('font-body text-sm text-muted', className)}
      {...props}
    />
  );
});
DialogDescription.displayName = 'Dialog.Description';

const DialogClose = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'>>(
  ({ className, onClick, ...props }, ref) => {
    const { setOpen } = useDialogRootContext('Close');
    return (
      <button
        ref={ref}
        type="button"
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) setOpen(false);
        }}
        // Typography and box, NOT just interaction styles.
        //
        // This used to be a bare button carrying only cursor/focus/disabled, on
        // the theory that Close is an unstyled slot a consumer fills through
        // `className`. The native leaf never agreed: it bakes in
        // `alignSelf: 'flex-start'`, 14px/500 and 4px of vertical padding. So
        // one design rendered as a 400px-wide centred 16px/400 button on web
        // and a 45px-wide left-hugging 14px/500 one on native — measured, in
        // the workbench. These four utilities ARE that native block, so the
        // two leaves now start from the same place. A consumer's `className`
        // still overrides, which is the part that was worth keeping.
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
DialogClose.displayName = 'Dialog.Close';

export const Dialog = {
  Root: DialogRoot,
  Trigger: DialogTrigger,
  Backdrop: DialogBackdrop,
  Popup: DialogPopup,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
};
