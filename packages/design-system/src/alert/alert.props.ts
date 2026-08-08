// SHARED — `react` only (context). No react-dom, no react-native.
//
// What composes across platforms for an alert is the intent, the live-region
// decision, and the dismissal callback the Close part reaches for. What
// renders — a `<div role>` versus a `<View role>` — stays in the leaves.
import * as React from 'react';

export type AlertIntent = 'info' | 'success' | 'warning' | 'danger';

export interface AlertContextValue {
  intent: AlertIntent;
  /** Undefined means the alert is not dismissible; `Alert.Close` renders nothing. */
  onDismiss: (() => void) | undefined;
  dismissLabel: string;
}

export const AlertContext = React.createContext<AlertContextValue | null>(null);

export function useAlertContext(part: string): AlertContextValue {
  const ctx = React.useContext(AlertContext);
  if (!ctx) throw new Error(`Alert.${part} must be rendered inside <Alert.Root>`);
  return ctx;
}

/**
 * The ARIA live-region role for an intent — `alert` is assertive and
 * interrupts whatever a screen reader is saying; `status` is polite and waits.
 *
 * Shared because the choice is a design decision, not a platform detail, and
 * both leaves can express it: react-native-web maps RN's `role` prop straight
 * through, and `'status'` is in RN's own `Role` union. Interrupting someone
 * mid-sentence to say "Saved" is the failure this rule exists to prevent, so
 * only the two intents that describe something going wrong get `alert`.
 */
export function alertRole(intent: AlertIntent): 'alert' | 'status' {
  return intent === 'danger' || intent === 'warning' ? 'alert' : 'status';
}

/** The left stripe that carries the intent. Web class names; see the note below. */
export const stripeStyles: Record<AlertIntent, string> = {
  info: 'border-l-primary',
  success: 'border-l-success',
  warning: 'border-l-warning',
  danger: 'border-l-danger',
};

/**
 * The intent is a STRIPE, and the text stays `ink`/`muted`.
 *
 * Same constraint `badge.props.ts` documents at length: `warning` as a text
 * colour is 3.2:1 on `card` in light, and `success` is 3.5:1 in dark, so an
 * intent-coloured heading would fail the a11y gate in one scheme or the other.
 * A border has no text-contrast requirement, and the alert's own words say
 * what happened — colour is never the only carrier.
 */
export const DEFAULT_DISMISS_LABEL = 'Dismiss';
