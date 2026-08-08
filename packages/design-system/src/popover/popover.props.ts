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
}

export interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  contentId: string;
  titleId: string;
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
): PopoverContextValue {
  const [isOpen, setOpen] = useControllableState<boolean>(open, defaultOpen ?? false, onOpenChange);
  const id = React.useId();
  return React.useMemo(
    () => ({ open: isOpen, setOpen, contentId: `${id}-content`, titleId: `${id}-title` }),
    [isOpen, setOpen, id],
  );
}
