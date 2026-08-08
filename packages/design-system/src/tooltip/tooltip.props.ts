// SHARED — `react` and `../lib/controllable` only. No react-dom, no
// react-native.
//
// The open/closed machine and the id scheme; everything about how a tooltip is
// SUMMONED diverges and stays in the leaves (see the note on `TooltipRootOwnProps`).
import * as React from 'react';

import { useControllableState } from '../lib/controllable';

export interface TooltipRootOwnProps {
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
}

export interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  tooltipId: string;
}

export const TooltipContext = React.createContext<TooltipContextValue | null>(null);

export function useTooltipContext(part: string): TooltipContextValue {
  const ctx = React.useContext(TooltipContext);
  if (!ctx) throw new Error(`Tooltip.${part} must be rendered inside <Tooltip.Root>`);
  return ctx;
}

export function useTooltipState(
  open: boolean | undefined,
  defaultOpen: boolean | undefined,
  onOpenChange: ((open: boolean) => void) | undefined,
): TooltipContextValue {
  const [isOpen, setOpen] = useControllableState<boolean>(open, defaultOpen ?? false, onOpenChange);
  const id = React.useId();
  return React.useMemo(
    () => ({ open: isOpen, setOpen, tooltipId: `${id}-tooltip` }),
    [isOpen, setOpen, id],
  );
}

/**
 * WHY THE TRIGGER GESTURE IS NOT SHARED.
 *
 * A tooltip on web appears on HOVER and on FOCUS — the focus half is not a
 * nicety, it is the only way a keyboard user ever sees one. On a touch screen
 * neither gesture exists: there is no pointer to hover and no focus ring to
 * land on, so the native leaf summons it with a long press, which is the
 * platform's own convention for "tell me more about this".
 *
 * Those are different gestures for one intent, and pretending otherwise would
 * mean either a web tooltip nobody can reach by keyboard or a native one
 * nobody can summon at all. What IS shared is everything after the gesture:
 * the state, the id, and the `aria-describedby` association — so the tooltip
 * describes its trigger identically on both platforms.
 *
 * Both leaves also close on Escape where Escape exists, which is a WCAG 1.4.13
 * requirement for content that appears on hover or focus.
 */
export const DESCRIBED_BY_NOTE = true;
