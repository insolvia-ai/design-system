// SHARED — `react` only (context). No react-dom, no react-native.
//
// A group joins a control to the text, icons or buttons beside it, and the
// join has to look like ONE control: a single border, a single radius, a
// single focus ring around the whole row. That means the control inside must
// stop drawing its own box — which is what this context tells it.
import * as React from 'react';

export interface InputGroupContextValue {
  /**
   * True for every descendant control. `Input` and `Textarea` read it and drop
   * their border, background, radius and height, leaving the Root to draw the
   * box around everything.
   *
   * WHY CONTEXT AND NOT A `bare` PROP THE CALLER PASSES. The caller would have
   * to remember it on every control, on both leaves, and forgetting produces a
   * double border — a defect that reads as "the design system is sloppy"
   * rather than "this call site is wrong". Context makes the group's own
   * invariant the group's own responsibility.
   */
  bare: true;
}

export const InputGroupContext = React.createContext<InputGroupContextValue | null>(null);

/**
 * The group a control finds itself in, or `null` when it stands alone.
 *
 * Returns null rather than throwing, unlike `useFieldContext`: an `Input`
 * outside a group is the normal case, not a composition error.
 */
export function useInputGroup(): InputGroupContextValue | null {
  return React.useContext(InputGroupContext);
}

export interface InputGroupRootOwnProps {
  /** Draws the row in its invalid state — the same danger border a control shows. */
  invalid?: boolean | undefined;
  disabled?: boolean | undefined;
}
