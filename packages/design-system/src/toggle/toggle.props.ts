// SHARED — imports `react`, `../lib/controllable`, and
// `../toggle-group/toggle-group.props` only. No react-dom, no react-native.
// This is the toggle's entire behavior model: standalone controlled/
// uncontrolled pressed state via `useControllableState`, OR — when rendered
// inside a `ToggleGroup.Root` and given a `value` — pressed state and
// toggling derived from the group instead. Both leaves consume it verbatim;
// they differ only in the elements and a11y surface they render. Mirrors
// `checkbox.props.ts`'s standalone-or-grouped shape.
import * as React from 'react';

import { useControllableState } from '../lib/controllable';
import { useToggleGroupContext, type ToggleSize } from '../toggle-group/toggle-group.props';

// Declared in the group's module so the group→toggle edge stays one-way; that
// file explains why. Re-exported here because this is the component the axis
// belongs to, and `ToggleSize` is what the barrel and every caller import.
export type { ToggleSize };

interface ToggleBaseProps {
  /** Controlled pressed state. Omit for uncontrolled (see `defaultPressed`). */
  pressed?: boolean | undefined;
  /** Pressed state on first render. Uncontrolled; omit for an unpressed start. */
  defaultPressed?: boolean | undefined;
  onPressedChange?: ((pressed: boolean) => void) | undefined;
  disabled?: boolean | undefined;
  /**
   * This toggle's membership value in an enclosing `ToggleGroup.Root`. When
   * both a `value` AND an ancestor group are present, the group's context
   * OVERRIDES standalone `pressed`/`defaultPressed`/`onPressedChange`
   * entirely — pressed is derived from group membership, and toggling
   * mutates the group's array via `onValueChange`, not local state. Omit
   * for a standalone toggle, even one rendered inside a group.
   */
  value?: string | undefined;
  /**
   * Overrides the size an enclosing `ToggleGroup.Root` set, or picks one for a
   * standalone toggle. Defaults to the group's, then to `md`.
   */
  size?: ToggleSize | undefined;
}

/**
 * Icon-only mode and the accessible name it requires, as ONE decision.
 *
 * A toggle whose only child is a glyph has no accessible name — the
 * name-from-content rule has no content to read — so `iconOnly` without a
 * `label` ships a control a screen reader announces as "button, pressed" and
 * nothing more. This union is what makes that state fail to COMPILE rather
 * than fail in someone's ear, exactly as `IconButton`'s required `label` does;
 * `icon-button.props.ts` argues out why that is worth a required prop.
 *
 * It is a union rather than two independent optional props because they are
 * not independent: `iconOnly` is the thing that removes the name, so it is the
 * thing that has to demand one back. A text toggle may still pass a `label` —
 * an "Bold" toggle whose visible child is a bold "B" is exactly that case.
 *
 * The cost is that `ToggleOwnProps` is a type alias rather than an interface,
 * so the leaves' own prop types are intersections rather than `extends`
 * clauses. That is a mechanical difference and the only one.
 */
export type ToggleLabelling =
  | {
      /**
       * Render as a square holding one glyph — the shape a view switch wants,
       * and the narrowest a toggle group gets. See `toggleIconSizeStyles`.
       */
      iconOnly?: false | undefined;
      /** An accessible name, when the visible child is not one. Optional here. */
      label?: string | undefined;
    }
  | { iconOnly: true; label: string };

export type ToggleOwnProps = ToggleBaseProps & ToggleLabelling;

export interface ToggleState {
  pressed: boolean;
  disabled: boolean;
  /** The size to render at: this toggle's own, else the group's, else `md`. */
  size: ToggleSize;
  /** Flip the pressed state — standalone state, or the enclosing group's selection. */
  toggle: () => void;
}

/**
 * The geometry, by size — Button's rows with the type step left out, because
 * both sizes are `text-sm` and the base string already says so.
 *
 * `md` IS `h-11` NOW, AND IT USED TO BE NOTHING. This component set no height
 * at all and landed at 36px from its padding, while every other `md` control
 * in the package — a Button, a Select trigger, a Wheel row — is 44, the WCAG
 * 2.5.5 target-size floor they each cite by name. Bottom-aligned in a form
 * row that is not a few pixels: each control's label sits above its own box,
 * so two heights put two labels on two lines, and a consumer was normalising
 * it in its own stylesheet. Adding a size axis without settling this would
 * have shipped an axis whose two ends disagreed about what they were matching.
 */
export const toggleSizeStyles: Record<ToggleSize, string> = {
  sm: 'h-8 gap-1.5 px-3',
  md: 'h-11 gap-2 px-4',
};

/**
 * The same two sizes as SQUARES, for `iconOnly` — `IconButton`'s boxes
 * exactly, so an icon-only toggle group and the icon buttons beside it in a
 * toolbar line up by construction rather than by two files agreeing.
 */
export const toggleIconSizeStyles: Record<ToggleSize, string> = {
  sm: 'size-8 p-0',
  md: 'size-11 p-0',
};

/**
 * Standalone-or-grouped pressed state, described in the comment above. A
 * group only takes over when it exists AND `value` is given — an ungrouped
 * toggle, or a grouped one without a `value`, is always standalone.
 */
export function useToggleState(
  pressed: boolean | undefined,
  defaultPressed: boolean | undefined,
  onPressedChange: ((pressed: boolean) => void) | undefined,
  disabled: boolean | undefined,
  value: string | undefined,
  size: ToggleSize | undefined,
): ToggleState {
  const group = useToggleGroupContext();
  const [standalonePressed, setStandalonePressed] = useControllableState<boolean>(
    pressed,
    defaultPressed ?? false,
    onPressedChange,
  );

  const inGroup = group !== null && value !== undefined;
  const resolvedPressed = inGroup ? group.value.includes(value) : standalonePressed;
  const resolvedDisabled = disabled || (inGroup && group.disabled);

  const toggle = React.useCallback(() => {
    if (resolvedDisabled) return;
    if (inGroup) {
      group.toggle(value);
    } else {
      setStandalonePressed(!standalonePressed);
    }
  }, [resolvedDisabled, inGroup, group, value, standalonePressed, setStandalonePressed]);

  return {
    pressed: resolvedPressed,
    disabled: resolvedDisabled,
    // The toggle's own size wins, then the group's, then `md`. Note this reads
    // the group whether or not `value` was given: `inGroup` gates the SELECTION
    // model, where a toggle without a value is genuinely standalone, but a
    // toggle sitting inside a group looks like part of it either way.
    size: size ?? group?.size ?? 'md',
    toggle,
  };
}
