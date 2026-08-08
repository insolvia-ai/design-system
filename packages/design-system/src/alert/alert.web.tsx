// WEB LEAF — plain React DOM + Tailwind.
import * as React from 'react';

import { cn } from '../lib/cn';
import { disabledStyles, focusRing } from '../lib/styles';
import {
  AlertContext,
  alertRole,
  DEFAULT_DISMISS_LABEL,
  stripeStyles,
  useAlertContext,
  type AlertIntent,
} from './alert.props';

export interface AlertRootProps extends React.ComponentPropsWithoutRef<'div'> {
  intent?: AlertIntent | undefined;
  /** Omit to make the alert permanent — `Alert.Close` then renders nothing. */
  onDismiss?: (() => void) | undefined;
  /** Accessible name for the dismiss control. */
  dismissLabel?: string | undefined;
}

// The alert holds no open/closed state of its own: it renders while the
// consumer renders it, and `onDismiss` tells them to stop. A component that
// hid itself would be unable to come back for the next occurrence of the same
// error, which is the case that matters.
const AlertRoot = React.forwardRef<HTMLDivElement, AlertRootProps>(
  (
    {
      className,
      intent = 'info',
      onDismiss,
      dismissLabel = DEFAULT_DISMISS_LABEL,
      children,
      ...props
    },
    ref,
  ) => {
    const ctx = React.useMemo(
      () => ({ intent, onDismiss, dismissLabel }),
      [intent, onDismiss, dismissLabel],
    );
    return (
      <AlertContext.Provider value={ctx}>
        <div
          ref={ref}
          role={alertRole(intent)}
          className={cn(
            'flex w-full items-start gap-sm rounded-md border border-line border-l-4 bg-card p-md',
            stripeStyles[intent],
            className,
          )}
          {...props}
        >
          <div className="flex min-w-0 flex-1 flex-col gap-xs">{children}</div>
          {onDismiss ? (
            <button
              type="button"
              aria-label={dismissLabel}
              onClick={onDismiss}
              className={cn(
                'shrink-0 cursor-pointer rounded-sm px-xs font-body text-sm leading-none text-muted',
                focusRing,
                disabledStyles,
              )}
            >
              {/* MULTIPLICATION SIGN, not a lowercase x — the glyph is
                  decorative and the button's name comes from aria-label. */}
              <span aria-hidden="true">&#215;</span>
            </button>
          ) : null}
        </div>
      </AlertContext.Provider>
    );
  },
);
AlertRoot.displayName = 'Alert.Root';

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.ComponentPropsWithoutRef<'p'>>(
  ({ className, children, ...props }, ref) => (
    <p ref={ref} className={cn('font-body text-sm font-semibold text-ink', className)} {...props}>
      {children}
    </p>
  ),
);
AlertTitle.displayName = 'Alert.Title';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentPropsWithoutRef<'p'>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('font-body text-sm text-muted', className)} {...props} />
));
AlertDescription.displayName = 'Alert.Description';

/**
 * An explicit dismiss control INSIDE the alert body — for a "Dismiss" text
 * button beside an action, where `Root`'s corner × would read as the same
 * command twice. Renders nothing when the alert is not dismissible.
 */
const AlertClose = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<'button'>>(
  ({ className, onClick, children, ...props }, ref) => {
    const { onDismiss } = useAlertContext('Close');
    if (!onDismiss) return null;
    return (
      <button
        ref={ref}
        type="button"
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) onDismiss();
        }}
        className={cn(
          'cursor-pointer self-start py-xs font-body text-sm font-medium text-ink',
          focusRing,
          disabledStyles,
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
AlertClose.displayName = 'Alert.Close';

export const Alert = {
  Root: AlertRoot,
  Title: AlertTitle,
  Description: AlertDescription,
  Close: AlertClose,
};
