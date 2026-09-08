// WEB LEAF — plain React DOM + Tailwind. A full-screen scrim, portaled into
// `document.body` exactly the way Dialog's Backdrop part does (dialog.web.tsx)
// — but unlike Dialog, this component IS the whole surface: there is no
// separate Popup, so the scrim and its centred content render as one element
// tree. Closed means unmounted (return null before the portal), so the mount
// effects below — the Escape listener, the body scroll lock — are the OPEN
// effects, same convention Dialog/Drawer use.
//
// No `role="dialog"`/`aria-modal` and no focus trap: the WAI-ARIA APG has no
// pattern for a bare backdrop (it has no title, and its content is typically
// just a Spinner), so this stays `role="presentation"` — decorative chrome,
// not a dialog surface. A `<div>` is never a keyboard target though, so the
// pointer dismissal path (a click anywhere on the scrim) is joined by a
// visually-hidden `<button>` for keyboard users, and Escape is wired straight
// to `document` since there is no focused popup element to hang a keydown
// handler off.
import * as React from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../lib/cn';
import type { BackdropOwnProps } from './backdrop.props';

export interface BackdropProps extends BackdropOwnProps {
  children?: React.ReactNode;
  /** Merged onto the scrim `<div>` — the same style escape hatch the native
   *  leaf offers through `style`. */
  className?: string | undefined;
}

export function Backdrop({
  open,
  onDismiss,
  invisible = false,
  children,
  className,
}: BackdropProps) {
  // Escape is the keyboard-only dismissal path — attached while open, and
  // harmless to attach even when `onDismiss` is undefined, since `onDismiss?.()`
  // is then a no-op (pressing does nothing, same as clicking the scrim).
  React.useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onDismiss]);

  // Body scroll lock while open, restored on close — the same technique
  // Dialog's/Drawer's popups use, duplicated rather than shared: it is three
  // lines, and this component's own presence already tracks `open` (there is
  // no separate mount-only-while-open part to hang it on).
  React.useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      role="presentation"
      data-state="open"
      onClick={onDismiss}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center overscroll-contain touch-manipulation transition-opacity motion-reduce:transition-none',
        invisible ? 'bg-transparent' : 'bg-overlay-scrim',
        className,
      )}
    >
      {onDismiss ? (
        // A bare `role="presentation"` div is never a tab stop, so the click
        // path above has no keyboard equivalent without this. `stopPropagation`
        // keeps a keyboard activation from also bubbling into the scrim's own
        // `onClick` and firing `onDismiss` twice.
        <button
          type="button"
          className="sr-only"
          onClick={(event) => {
            event.stopPropagation();
            onDismiss();
          }}
        >
          Dismiss
        </button>
      ) : null}
      {children !== undefined ? (
        // Stops propagation so a click on the content — the usual case being a
        // Spinner, which has nothing of its own to click — never reaches the
        // scrim's dismiss handler.
        <div onClick={(event) => event.stopPropagation()}>{children}</div>
      ) : null}
    </div>,
    document.body,
  );
}
