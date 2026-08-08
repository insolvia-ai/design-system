// SHARED — `react` and Alert's props module only. No react-dom, no
// react-native.
//
// A toast is an Alert that shows up by itself and leaves by itself, so the
// intent set and the live-region rule are IMPORTED from alert.props rather
// than restated: "danger interrupts, success waits" is one decision, and
// having it in two places is having it twice.
//
// What is new here is a STORE. Every other component in this package is told
// what to render; a toast is asked for imperatively, from an event handler far
// from any JSX — which is why this is the one component with a hook-based API
// (`useToast`) alongside its parts.
import * as React from 'react';

import { alertRole, type AlertIntent } from '../alert/alert.props';

export type ToastIntent = AlertIntent;
export { alertRole as toastRole };

export interface ToastOptions {
  title: string;
  description?: string | undefined;
  intent?: ToastIntent | undefined;
  /**
   * Milliseconds before it dismisses itself. `0` means it stays until someone
   * removes it — for a failure the user has to act on.
   */
  duration?: number | undefined;
}

export interface ToastRecord extends ToastOptions {
  id: string;
  intent: ToastIntent;
  duration: number;
}

/**
 * Five seconds, which is the shortest duration that clears WCAG 2.2.1's
 * "enough time" guidance for a message a user must read. Anything a user must
 * ACT on should pass `duration: 0` instead of a longer number — a deadline the
 * user cannot see is not a UI.
 */
export const DEFAULT_TOAST_DURATION = 5000;

export const DEFAULT_TOAST_DISMISS_LABEL = 'Dismiss';

/** Names the region that holds the stack, for assistive tech. */
export const DEFAULT_VIEWPORT_LABEL = 'Notifications';

export interface ToastApi {
  /** Queues a toast and returns its id, so it can be updated or removed. */
  add: (options: ToastOptions) => string;
  /** Patches a toast in place — a pending upload becoming a finished one. */
  update: (id: string, patch: Partial<ToastOptions>) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export interface ToastStore {
  toasts: readonly ToastRecord[];
  api: ToastApi;
}

export const ToastContext = React.createContext<ToastStore | null>(null);

/**
 * The imperative handle. Throws outside a Provider rather than returning a
 * no-op: a toast that silently never appears is the kind of bug that survives
 * to production, because the call site looks fine.
 */
export function useToast(): ToastApi {
  const store = React.useContext(ToastContext);
  if (!store) throw new Error('useToast() must be called inside <Toast.Provider>');
  return store.api;
}

/**
 * The store both Providers run. One implementation, so the two platforms
 * cannot disagree about when a toast expires or what `update` does to a
 * running timer.
 */
export function useToastStore(): ToastStore {
  const [toasts, setToasts] = React.useState<readonly ToastRecord[]>([]);
  // A counter rather than a random id: ids only have to be unique within one
  // running store, and a counter is reproducible in tests.
  const nextId = React.useRef(0);
  const timers = React.useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const clearTimer = React.useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const remove = React.useCallback(
    (id: string) => {
      clearTimer(id);
      setToasts((current) => current.filter((toast) => toast.id !== id));
    },
    [clearTimer],
  );

  const schedule = React.useCallback(
    (id: string, duration: number) => {
      clearTimer(id);
      if (duration > 0)
        timers.current.set(
          id,
          setTimeout(() => remove(id), duration),
        );
    },
    [clearTimer, remove],
  );

  const add = React.useCallback(
    (options: ToastOptions): string => {
      const id = `toast-${nextId.current++}`;
      const record: ToastRecord = {
        ...options,
        id,
        intent: options.intent ?? 'info',
        duration: options.duration ?? DEFAULT_TOAST_DURATION,
      };
      setToasts((current) => [...current, record]);
      schedule(id, record.duration);
      return id;
    },
    [schedule],
  );

  const update = React.useCallback(
    (id: string, patch: Partial<ToastOptions>) => {
      setToasts((current) =>
        current.map((toast) =>
          toast.id === id
            ? {
                ...toast,
                ...patch,
                // `intent` and `duration` are optional on the patch and
                // REQUIRED on the record, so a bare spread would widen them to
                // `| undefined` (exactOptionalPropertyTypes is on) and let a
                // caller blank out a toast's intent by passing the key with
                // nothing in it. Coalescing keeps "not mentioned" and
                // "explicitly undefined" meaning the same thing: leave it.
                intent: patch.intent ?? toast.intent,
                duration: patch.duration ?? toast.duration,
              }
            : toast,
        ),
      );
      // A patched duration restarts the clock; leaving the old timer running
      // would dismiss the UPDATED message after the original message's time,
      // which is the surprising half of every "update a toast" bug.
      if (patch.duration !== undefined) schedule(id, patch.duration);
    },
    [schedule],
  );

  const clear = React.useCallback(() => {
    for (const timer of timers.current.values()) clearTimeout(timer);
    timers.current.clear();
    setToasts([]);
  }, []);

  // Unmounting with toasts in flight must not leave timers pointing at a dead
  // setState. Captured in a local because refs are nulled before cleanup runs
  // in some React versions.
  const pending = timers.current;
  React.useEffect(
    () => () => {
      for (const timer of pending.values()) clearTimeout(timer);
      pending.clear();
    },
    [pending],
  );

  const api = React.useMemo<ToastApi>(
    () => ({ add, update, remove, clear }),
    [add, update, remove, clear],
  );

  return React.useMemo(() => ({ toasts, api }), [toasts, api]);
}

/** Reads the stack for a Viewport. Throws for the same reason `useToast` does. */
export function useToastList(): ToastStore {
  const store = React.useContext(ToastContext);
  if (!store) throw new Error('<Toast.Viewport> must be rendered inside <Toast.Provider>');
  return store;
}
