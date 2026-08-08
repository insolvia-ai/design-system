// SHARED — imports `react` and the dialog's props module only (a props module
// importing another props module is fine: both are renderer-free, and the
// ESLint fence only bans renderers).
//
// A drawer IS a dialog — modal, focus-trapping, Escape-dismissable — that
// enters from an edge instead of the middle. So the state machine and id
// scheme are the dialog's verbatim, exactly as AlertDialog reuses them, and
// what is new here is only WHERE the panel sits. Its own context instance, so
// a Dialog nested inside a Drawer (or the reverse) can never cross-wire, and
// its own accessor so a misuse error names the right component.
import * as React from 'react';

import {
  useDialogState,
  type DialogContextValue,
  type DialogRootOwnProps,
} from '../dialog/dialog.props';

export type DrawerContextValue = DialogContextValue;

export type DrawerSide = 'left' | 'right' | 'top' | 'bottom';

export interface DrawerRootOwnProps extends DialogRootOwnProps {
  /** Which edge the panel enters from. Defaults to `right`. */
  side?: DrawerSide | undefined;
}

export const DrawerRootContext = React.createContext<
  (DrawerContextValue & { side: DrawerSide }) | null
>(null);

export function useDrawerRootContext(part: string): DrawerContextValue & { side: DrawerSide } {
  const ctx = React.useContext(DrawerRootContext);
  if (!ctx) throw new Error(`Drawer.${part} must be rendered inside <Drawer.Root>`);
  return ctx;
}

/** The dialog's machine, verbatim — one state convention, three anatomies. */
export const useDrawerState = useDialogState;

/** Panel geometry per edge. Web class names. */
export const sideStyles: Record<DrawerSide, string> = {
  left: 'inset-y-0 left-0 h-full w-full max-w-[20rem] border-r',
  right: 'inset-y-0 right-0 h-full w-full max-w-[20rem] border-l',
  top: 'inset-x-0 top-0 w-full max-h-[80vh] border-b',
  bottom: 'inset-x-0 bottom-0 w-full max-h-[80vh] border-t',
};

/** True for the edges that make a tall panel rather than a wide one. */
export function isVerticalEdge(side: DrawerSide): boolean {
  return side === 'left' || side === 'right';
}
