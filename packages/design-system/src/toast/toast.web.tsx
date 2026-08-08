// WEB LEAF — plain React DOM + Tailwind.
//
// The Viewport portals to document.body so a toast is never clipped by an
// `overflow: hidden` ancestor and never inherits a transformed parent's
// coordinate space — the two ways a corner-pinned stack ends up somewhere
// other than the corner.
import * as React from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../lib/cn';
import { disabledStyles, focusRing } from '../lib/styles';
import {
  DEFAULT_TOAST_DISMISS_LABEL,
  DEFAULT_VIEWPORT_LABEL,
  ToastContext,
  toastRole,
  useToastList,
  useToastStore,
} from './toast.props';

export interface ToastProviderProps {
  children?: React.ReactNode;
}

/** Owns the store. Render once, above anything that calls `useToast()`. */
const ToastProvider = ({ children }: ToastProviderProps) => {
  const store = useToastStore();
  return <ToastContext.Provider value={store}>{children}</ToastContext.Provider>;
};

export interface ToastViewportProps extends React.ComponentPropsWithoutRef<'div'> {
  /** Names the region holding the stack. */
  label?: string | undefined;
  dismissLabel?: string | undefined;
}

const ToastViewport = React.forwardRef<HTMLDivElement, ToastViewportProps>(
  (
    {
      className,
      label = DEFAULT_VIEWPORT_LABEL,
      dismissLabel = DEFAULT_TOAST_DISMISS_LABEL,
      ...props
    },
    ref,
  ) => {
    const { toasts, api } = useToastList();

    return createPortal(
      <div
        ref={ref}
        // A named region, so a screen-reader user can navigate BACK to a toast
        // they half-heard. The live-region role sits on each toast rather than
        // here: a region that announced its own arrival would repeat every
        // message twice.
        role="region"
        aria-label={label}
        className={cn(
          'pointer-events-none fixed bottom-0 right-0 z-50 flex w-full max-w-[24rem] flex-col gap-sm p-md',
          className,
        )}
        {...props}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toastRole(toast.intent)}
            className={cn(
              // `pointer-events-auto` per toast, because the viewport itself
              // is click-through: a fixed strip across the corner would
              // otherwise swallow presses on whatever is under it, for as long
              // as the app runs.
              'pointer-events-auto flex items-start gap-sm rounded-md border border-line bg-card p-md shadow-lg',
              intentStripe[toast.intent],
            )}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-xs">
              <p className="font-body text-sm font-semibold text-ink">{toast.title}</p>
              {toast.description === undefined ? null : (
                <p className="font-body text-sm text-muted">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              aria-label={dismissLabel}
              onClick={() => api.remove(toast.id)}
              className={cn(
                'shrink-0 cursor-pointer rounded-sm px-xs font-body text-sm leading-none text-muted',
                focusRing,
                disabledStyles,
              )}
            >
              <span aria-hidden="true">&#215;</span>
            </button>
          </div>
        ))}
      </div>,
      document.body,
    );
  },
);
ToastViewport.displayName = 'Toast.Viewport';

// The same left stripe Alert uses, and for the same contrast reason: the
// intent cannot be carried by text colour without failing in one scheme.
const intentStripe = {
  info: 'border-l-4 border-l-primary',
  success: 'border-l-4 border-l-success',
  warning: 'border-l-4 border-l-warning',
  danger: 'border-l-4 border-l-danger',
} as const;

export const Toast = {
  Provider: ToastProvider,
  Viewport: ToastViewport,
};
