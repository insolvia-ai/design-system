// SHARED — `react` only (context + useId). No react-dom, no react-native.
// What genuinely composes across platforms for a field is small and lives here:
// the id scheme, the context shape, and the `aria-describedby` string rule.
// Everything that renders (label/input vs Text/TextInput) and the child-presence
// scan (which keys off each leaf's OWN subcomponents) stays in the leaves — see
// the ergonomics note in index.ts.
import * as React from 'react';

export interface FieldContextValue {
  labelId: string;
  controlId: string;
  describedBy: string | undefined;
  invalid: boolean;
  name: string | undefined;
  descriptionId: string;
  errorId: string;

  /**
   * True while a control inside this Field is showing an overlay of its own —
   * an open Select list, today.
   *
   * It exists for STACKING, and only the native leaf reads it. React Native
   * gives every View its own stacking context, and react-native-web replicates
   * that deliberately (`zIndex: 0` on the base View style), so a `zIndex` set
   * inside a control can only order it against ITS OWN siblings — never past a
   * sibling of the Field that wraps it. An open Select therefore painted
   * underneath whatever followed the Field, which is the 0.7.1 bug returning
   * the moment the Select was wrapped in one.
   *
   * The fix has to be applied by the wrapper, not the control, which is why
   * this crosses the context boundary at all. `field.native.tsx` consumes it;
   * the web leaf ignores it, because a plain `position: relative` div with
   * `z-index: auto` starts no stacking context and never had the problem.
   *
   * Load-bearing on a REAL NATIVE DEVICE only, where the overlays render
   * inline. In a browser (react-native-web) the open overlay now portals to
   * `document.body` — `src/lib/overlay-portal.native.ts` — because this
   * elevation, reaching exactly one level, stopped at the first wrapper a
   * consumer added around the Field and the bug returned one level up. The
   * controls still signal it unconditionally; elevating a Field whose overlay
   * has left the tree is harmless.
   */
  controlOpen: boolean;

  /** Called by a control when its overlay opens or closes. See `controlOpen`. */
  setControlOpen: (open: boolean) => void;
}

export const FieldContext = React.createContext<FieldContextValue | null>(null);

export function useFieldContext(part: string): FieldContextValue {
  const ctx = React.useContext(FieldContext);
  if (!ctx) throw new Error(`Field.${part} must be rendered inside <Field.Root>`);
  return ctx;
}

export interface FieldIds {
  labelId: string;
  controlId: string;
  descriptionId: string;
  errorId: string;
}

/**
 * Stable id set for one field. Shared derivation, no DOM. It carries ids for
 * BOTH association directions because the platforms wire opposite ways: the
 * web leaf points the label at the control (`htmlFor={controlId}`), the
 * native leaf points the control back at the label
 * (`aria-labelledby={labelId}` — the pair react-native-web emits as a
 * correctly associated label/input).
 */
export function useFieldIds(): FieldIds {
  const id = React.useId();
  return {
    labelId: `${id}-label`,
    controlId: `${id}-control`,
    descriptionId: `${id}-description`,
    errorId: `${id}-error`,
  };
}

/**
 * Compose `aria-describedby` from ONLY the parts actually rendered — a dangling
 * reference to an absent id is its own a11y defect. Pure string rule, shared by
 * both leaves; computed during render so it is present in server-rendered HTML.
 */
export function composeDescribedBy(
  ids: FieldIds,
  hasDescription: boolean,
  hasError: boolean,
): string | undefined {
  return (
    [hasDescription ? ids.descriptionId : null, hasError ? ids.errorId : null]
      .filter(Boolean)
      .join(' ') || undefined
  );
}

/**
 * The open-overlay flag both Field roots own. A hook rather than raw
 * `useState` in each leaf so the two cannot drift, and so the reason for it
 * lives next to the `controlOpen` doc above rather than twice in the leaves.
 */
export function useFieldControlOpen(): {
  controlOpen: boolean;
  setControlOpen: (open: boolean) => void;
} {
  const [controlOpen, setControlOpen] = React.useState(false);
  return { controlOpen, setControlOpen };
}

export interface FieldRootOwnProps {
  /** The form control's `name`, applied to the control unless it sets its own. */
  name?: string;
  /** Marks the control invalid: sets `aria-invalid` and the danger border. */
  invalid?: boolean;
}
