// SHARED — `react` and `../lib/controllable` only.
//
// A popover is a NON-MODAL surface anchored to its trigger: unlike Dialog it
// does not take focus hostage, does not lock scrolling and does not dim the
// page behind it. That distinction is the whole reason it exists alongside
// Dialog, and it is why the state here is just open/closed plus the ids the
// trigger and surface use to point at each other.
import * as React from 'react';

import { useControllableState } from '../lib/controllable';

export interface PopoverRootOwnProps {
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  /**
   * Open on hover and on focus, as a tooltip does, instead of on press — for
   * a preview card, a definition, anything a pointer user should get by
   * resting on the trigger rather than committing to a click.
   *
   * The focus half is not optional and comes with the hover half: a surface
   * that only hover can reach is one a keyboard user never sees (WCAG
   * 1.4.13, the same clause tooltip.props.ts cites). Pressing the trigger
   * still opens the popover, so a touch screen — which has no hover and no
   * focus ring to land on — gets it the way it always did. What changes on
   * press is that it no longer TOGGLES: a tap arrives as a hover first, and
   * a press that closed what its own hover just opened would be a popover
   * nobody could open by tapping.
   *
   * Dismissal: the pointer leaving the trigger and the popover together,
   * focus leaving them together, Escape, and — on web — a press outside.
   */
  openOnHover?: boolean | undefined;
}

export interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  contentId: string;
  titleId: string;
  openOnHover: boolean;
}

export const PopoverContext = React.createContext<PopoverContextValue | null>(null);

export function usePopoverContext(part: string): PopoverContextValue {
  const ctx = React.useContext(PopoverContext);
  if (!ctx) throw new Error(`Popover.${part} must be rendered inside <Popover.Root>`);
  return ctx;
}

export function usePopoverState(
  open: boolean | undefined,
  defaultOpen: boolean | undefined,
  onOpenChange: ((open: boolean) => void) | undefined,
  openOnHover: boolean = false,
): PopoverContextValue {
  const [isOpen, setOpen] = useControllableState<boolean>(open, defaultOpen ?? false, onOpenChange);
  const id = React.useId();
  return React.useMemo(
    () => ({
      open: isOpen,
      setOpen,
      contentId: `${id}-content`,
      titleId: `${id}-title`,
      openOnHover,
    }),
    [isOpen, setOpen, id, openOnHover],
  );
}

/**
 * How long the pointer may be off both the trigger and the popover before a
 * hover-opened popover closes. The popover hangs a small gap below its
 * trigger, and the pointer has to cross that gap to reach it: a leave that
 * closed at once would shut the popover on the way in. The delay is what
 * WCAG 1.4.13 calls "hoverable" — the pointer can be moved over the content
 * without it disappearing. The leaves own the timer; this is the number.
 */
export const HOVER_CLOSE_DELAY_MS = 150;

/**
 * The leave/enter pair a hover-opened popover needs, shared by both leaves:
 * leaving schedules a close, re-entering within the delay cancels it. Pure
 * React — timers, a ref — so it belongs here rather than being spelled twice.
 */
export function useHoverClose(ctx: PopoverContextValue): {
  onEnter: () => void;
  onLeave: () => void;
} {
  const { setOpen, openOnHover } = ctx;
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancel = React.useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);
  React.useEffect(() => cancel, [cancel]);
  return React.useMemo(
    () => ({
      onEnter: cancel,
      onLeave: () => {
        if (!openOnHover) return;
        cancel();
        timer.current = setTimeout(() => {
          timer.current = null;
          setOpen(false);
        }, HOVER_CLOSE_DELAY_MS);
      },
    }),
    [cancel, openOnHover, setOpen],
  );
}
