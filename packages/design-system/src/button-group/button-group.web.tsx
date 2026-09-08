// WEB LEAF — plain React DOM + Tailwind. `role="group"`, not a `<fieldset>`:
// nothing inside is a form control, there is no `<legend>`, and `aria-label`
// names the group instead — the same shape `toggle-group.web.tsx` uses for a
// SELECTION group; this one is ACTIONS, so there is no pressed state to
// convey.
//
// Root provides two contexts: the group-wide `ButtonGroupContext`
// (size/intent/disabled/attached/orientation, one value for every Item) and,
// per child, a `ButtonGroupPositionContext.Provider` carrying that ONE
// child's computed position — Root counts via `React.Children` and wraps each
// child individually, because a per-child value cannot live in the single
// group-wide context. Item reads both back.
import * as React from 'react';

import { cn } from '../lib/cn';
import {
  ButtonGroupContext,
  ButtonGroupPositionContext,
  buttonGroupItemClass,
  buttonGroupPosition,
  useButtonGroupContext,
  type ButtonGroupContextValue,
  type ButtonGroupRootOwnProps,
} from './button-group.props';

export interface ButtonGroupRootProps
  extends React.ComponentPropsWithoutRef<'div'>, ButtonGroupRootOwnProps {}

const ButtonGroupRoot = React.forwardRef<HTMLDivElement, ButtonGroupRootProps>(
  (
    {
      className,
      orientation = 'horizontal',
      attached = true,
      disabled = false,
      size = 'md',
      intent = 'secondary',
      label,
      children,
      ...props
    },
    ref,
  ) => {
    const ctx: ButtonGroupContextValue = React.useMemo(
      () => ({ orientation, attached, disabled, size, intent }),
      [orientation, attached, disabled, size, intent],
    );
    const items = React.Children.toArray(children).filter(React.isValidElement);
    const count = items.length;

    return (
      <ButtonGroupContext.Provider value={ctx}>
        <div
          ref={ref}
          role="group"
          aria-label={label}
          className={cn(
            'inline-flex',
            orientation === 'vertical' ? 'flex-col' : 'flex-row',
            attached ? undefined : 'gap-sm',
            className,
          )}
          {...props}
        >
          {items.map((item, index) => (
            <ButtonGroupPositionContext.Provider
              key={item.key ?? index}
              value={buttonGroupPosition(index, count)}
            >
              {item}
            </ButtonGroupPositionContext.Provider>
          ))}
        </div>
      </ButtonGroupContext.Provider>
    );
  },
);
ButtonGroupRoot.displayName = 'ButtonGroup.Root';

export type ButtonGroupItemProps = React.ComponentPropsWithoutRef<'button'>;

// A real `<button>`, styled with `buttonClass` — the sanctioned shared path
// for looking like a Button without importing Button's leaf (see the file
// header on button-group.props.ts). `type` defaults to "button" for the same
// reason Button's own leaf does: an Item inside a `<form>` must never submit
// by accident.
const ButtonGroupItem = React.forwardRef<HTMLButtonElement, ButtonGroupItemProps>(
  ({ className, disabled, type, ...props }, ref) => {
    const ctx = useButtonGroupContext();
    const position = React.useContext(ButtonGroupPositionContext);
    const isDisabled = ctx.disabled || Boolean(disabled);

    return (
      <button
        ref={ref}
        type={type ?? 'button'}
        disabled={isDisabled}
        data-position={position}
        className={buttonGroupItemClass({
          intent: ctx.intent,
          size: ctx.size,
          orientation: ctx.orientation,
          attached: ctx.attached,
          position,
          className,
        })}
        {...props}
      />
    );
  },
);
ButtonGroupItem.displayName = 'ButtonGroup.Item';

export const ButtonGroup = { Root: ButtonGroupRoot, Item: ButtonGroupItem };
