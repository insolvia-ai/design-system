// SHARED — imports `react` and `../lib/controllable` only. No react-dom, no
// react-native. A Stepper's cross-platform substance is: which step is
// active (controlled or uncontrolled, via the shared useControllableState
// helper), what status that gives every OTHER step, and whether a given step
// may be clicked at all. Every rendered node — the `<ol>` against a `View`,
// the circle against a filled `View` circle, the connecting line — stays in
// the leaves; only the shape of the state and its pure derivations are
// shared.
import * as React from 'react';

import { useControllableState } from '../lib/controllable';

export type StepperOrientation = 'horizontal' | 'vertical';

/**
 * `'completed' | 'active' | 'upcoming'` are DERIVED from a step's index
 * against the active one — see `deriveStatus`. `'error'` only ever comes from
 * an explicit `status` override on `Step`: nothing about an index can tell
 * Root a step failed.
 */
export type StepStatus = 'completed' | 'active' | 'upcoming' | 'error';

/** The `<ol>`/`View` landmark's accessible name when the caller supplies none. */
export const DEFAULT_STEPPER_LABEL = 'Progress';

export interface StepperRootOwnProps {
  /** The active step's index. Supplying this makes Stepper controlled —
   * pair it with `onActiveStepChange` and update it yourself in response. */
  activeStep?: number | undefined;
  /** The step active on first render, AND the seed `useControllableState`
   * needs even in controlled mode.
   * @default 0 */
  defaultActiveStep?: number | undefined;
  /** Fires with the index of the newly activated step, in both modes. */
  onActiveStepChange?: ((next: number) => void) | undefined;
  /** Row of circles-and-labels, or a column of them.
   * @default 'horizontal' */
  orientation?: StepperOrientation | undefined;
  /**
   * A step after the active one cannot be clicked, however `interactive` is
   * set — you cannot skip ahead of a flow you have not finished. Turn this
   * off for a flow whose steps may genuinely be visited in any order (a
   * settings wizard with no dependency between panels), where "after" has no
   * meaning to enforce.
   * @default true
   */
  linear?: boolean | undefined;
  /**
   * Lets a caller jump between steps by clicking/pressing one, rather than
   * only ever displaying progress. Off by default: most flows drive
   * `activeStep` themselves (a "Next" button elsewhere on the page), and a
   * Stepper that LOOKS clickable when it does nothing is worse than one that
   * plainly does not.
   * @default false
   */
  interactive?: boolean | undefined;
  /** Names the landmark. See `DEFAULT_STEPPER_LABEL`.
   * @default 'Progress' */
  label?: string | undefined;
}

export interface StepperRootContextValue {
  activeStep: number;
  setActiveStep: (next: number) => void;
  orientation: StepperOrientation;
  linear: boolean;
  interactive: boolean;
}

export const StepperRootContext = React.createContext<StepperRootContextValue | null>(null);

export function useStepperRootContext(part: string): StepperRootContextValue {
  const ctx = React.useContext(StepperRootContext);
  if (!ctx) throw new Error(`Stepper.${part} must be rendered inside <Stepper.Root>`);
  return ctx;
}

/**
 * A step's position within its Root: which one it is, and whether anything
 * comes after it. Private to this component — never exported from
 * `index.ts` — because nothing outside `Step` reads it.
 */
export interface StepperItemContextValue {
  index: number;
  last: boolean;
}

export const StepperItemContext = React.createContext<StepperItemContextValue | null>(null);

/**
 * WHY A CONTEXT PER ITEM, RATHER THAN `React.cloneElement` INJECTING HIDDEN
 * PROPS — the same call Timeline's Root makes, for the same reason. Root
 * already knows every Step's index the moment it maps over its children
 * (`React.Children.toArray`); wrapping each mapped child in its OWN
 * `<StepperItemContext.Provider>` keeps that value out of `StepProps`
 * entirely, so nothing a caller writes could collide with it, and `Step`
 * reads it with `useContext` exactly as `Tab` reads `TabsRootContext`.
 * `cloneElement` was the rejected alternative: it would mean `StepProps`
 * carrying an internal `index`/`last` field that has to type-check against
 * arbitrary `Step` usage.
 */
export function useStepperItemContext(): StepperItemContextValue {
  // Falls back to "first of one" rather than throwing — a `Step` rendered
  // outside `Root` (a snapshot in a test) still needs an index and a "last"
  // flag to derive a status and decide whether to draw a connector.
  return React.useContext(StepperItemContext) ?? { index: 0, last: true };
}

/**
 * The active-step state machine — pure React, identical on both platforms.
 * Controlled when `activeStep` is supplied, uncontrolled otherwise.
 */
export function useStepperState(
  activeStep: number | undefined,
  defaultActiveStep: number,
  onActiveStepChange: ((next: number) => void) | undefined,
): [number, (next: number) => void] {
  return useControllableState(activeStep, defaultActiveStep, onActiveStepChange);
}

/**
 * A step's status, purely from its position relative to the active one.
 * Never returns `'error'` — see `StepStatus`'s note. `Step` resolves its
 * FINAL status as `statusProp ?? deriveStatus(index, activeStep)`.
 */
export function deriveStatus(index: number, active: number): Exclude<StepStatus, 'error'> {
  if (index < active) return 'completed';
  if (index === active) return 'active';
  return 'upcoming';
}

/**
 * Whether a step may be clicked/pressed at all, given its FINAL status
 * (after any `error` override) and the root's `interactive`/`linear` flags.
 *
 * Linear mode only opens the door on a step that is `'completed'` — "a step
 * after the active one is not clickable" from the component's spec, checked
 * against STATUS rather than raw index so an earlier step that has been
 * marked `error` (no longer displaying as `'completed'`) is not clickable
 * either; re-visiting a failed step is exactly the case linear mode exists
 * to gate. Non-linear drops the status check entirely — every step, in every
 * state, is fair game, because there is no "ahead" to protect a caller from.
 */
export function isStepClickable(
  status: StepStatus,
  interactive: boolean,
  linear: boolean,
): boolean {
  if (!interactive) return false;
  if (!linear) return true;
  return status === 'completed';
}

/** `Step`'s own props, shared so a leaf's `StepProps` can extend it. */
export interface StepOwnProps {
  /** What the step is called. Required — a circle with nothing to announce
   * to a screen reader is not a step. */
  label: string;
  /** A line of detail under the label. */
  description?: string | undefined;
  /**
   * Overrides the status this step would otherwise DERIVE from its index vs.
   * the active one. The only value worth passing is `'error'` — every other
   * value is exactly what derivation would have produced anyway, so passing
   * one back is a caller re-stating a fact this component already computed.
   */
  status?: StepStatus | undefined;
  /** Adds an "Optional" caption next to the label — the WAI-ARIA-adjacent
   * convention for a step a flow can be completed without. */
  optional?: boolean | undefined;
  /** Replaces the step number with a custom glyph. Ignored on a `completed`
   * or `error` step: those already draw a dedicated check/`!` glyph, and a
   * caller's icon would contradict the one thing that glyph exists to say. */
  icon?: React.ReactNode;
}

/** The circle's fill/border/text per status. Web-only — the native leaf
 * resolves the same four states from `useNativeColors()` at render time,
 * because it needs actual colour VALUES, not class names. */
export const stepIndicatorClass: Record<StepStatus, string> = {
  completed: 'bg-primary text-primary-text',
  active: 'border-2 border-primary text-primary',
  upcoming: 'border-2 border-line text-muted',
  error: 'border-2 border-danger text-danger',
};

/** The label's text colour per status. Web-only, same reason as above. */
export const stepLabelClass: Record<StepStatus, string> = {
  completed: 'text-ink',
  active: 'text-ink font-medium',
  upcoming: 'text-muted',
  error: 'text-danger',
};

/**
 * The screen-reader-only suffix appended after a completed/errored step's
 * label — `null` for `active`/`upcoming`, which need no extra announcement
 * beyond `aria-current="step"` (active) or the plain label (upcoming).
 */
export function stepSrSuffix(status: StepStatus): string | null {
  if (status === 'completed') return ' (completed)';
  if (status === 'error') return ' (error)';
  return null;
}

/**
 * The native leaf's `accessibilityLabel` — RN has no `aria-current`/sr-only
 * text seam, so the whole announcement is one string, built here once so it
 * cannot drift between the leaf and its test. 1-INDEXED ("Step 1: …"): a
 * screen-reader user hears position the way a sighted one reads the number
 * in the circle, and `index` is 0-based internally for exactly the reason
 * every other 0-based index here is — it addresses `deriveStatus` and array
 * children, not a human.
 */
export function stepAccessibilityLabel(index: number, label: string, status: StepStatus): string {
  const statusWord = status === 'active' ? 'current' : status;
  return `Step ${index + 1}: ${label}, ${statusWord}`;
}
