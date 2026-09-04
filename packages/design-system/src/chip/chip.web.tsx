// WEB LEAF — plain React DOM + Tailwind. No react-native. Vite resolves this.
import * as React from 'react';

import { chipClass, type ChipSize } from './chip.props';

export interface ChipProps extends React.ComponentPropsWithoutRef<'button'> {
  /**
   * Pressed state. OMIT IT ENTIRELY for a chip that is not a selection — the
   * leaves render no `aria-pressed` at all when it is `undefined`, because
   * `aria-pressed="false"` on a control that never toggles announces a toggle
   * that does not exist.
   *
   * CONTROLLED AND PRESENTATIONAL, like `IconButton`'s prop of the same name:
   * there is no `defaultPressed` and no `onPressedChange`. A chip's pressed
   * state is nearly always derived from something the caller already owns —
   * a route match, a filter array, a selection set — and a component that also
   * held its own copy would give a caller two answers to one question. A
   * control that genuinely owns its pressed state is `Toggle`.
   */
  pressed?: boolean;
  size?: ChipSize;
}

/**
 * A bordered, pressable label. Anything that NAVIGATES is an `<a>`/`<NavLink>`
 * styled with `chipClass`, not this — the same split Button documents, and the
 * case `chipClass`'s own comment works through.
 */
export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, pressed, size = 'md', type, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type ?? 'button'}
        // `undefined` omits the attribute rather than rendering
        // `aria-pressed="false"` — see the prop's doc comment.
        aria-pressed={pressed}
        className={chipClass({ pressed, size, className })}
        {...props}
      />
    );
  },
);

Chip.displayName = 'Chip';
