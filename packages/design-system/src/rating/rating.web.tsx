// WEB LEAF — plain React DOM + Tailwind, WAI-ARIA radio-group pattern
// (https://www.w3.org/WAI/ARIA/apg/patterns/radio/). Shares its value state
// and keyboard grammar with the native leaf via rating.props; what lives here
// is the DOM: role="radiogroup"/role="radio" on real <button>s, roving
// tabIndex + arrow-key focus management (same closest()/querySelectorAll()
// idiom radio-group.web.tsx and tabs.web.tsx use), and the hover preview.
//
// A <button role="radio"> PER STAR, NOT `<input type="radio">`. The rejected
// alternative cannot do either thing this component needs: a hover PREVIEW
// has to paint stars filled without committing a value, and a radio input's
// only visual state IS its checked-ness — there is no way to show "3 filled"
// while the checked one stays "2". And a native radio group has no
// ungrouped state to return to, so re-selecting the checked radio is a no-op
// in every browser — which is exactly the "click the current value again to
// clear" gesture this component needs. A `<button>` owns both plainly.
import * as React from 'react';

import { cn } from '../lib/cn';
import { coarseTouchTarget, disabledStyles, focusRing } from '../lib/styles';
import {
  STAR_PATH,
  defaultFormatItemLabel,
  formatValueLabel,
  nextValueOnPress,
  ratingItemTabIndex,
  ratingKeyIntent,
  sizeStyles,
  useRatingState,
  type RatingOwnProps,
} from './rating.props';

// `defaultValue` is Omit-ed because React's own `HTMLAttributes` already
// declares it (as a form-control value type: `string | number | readonly
// string[]`), and the rating's numeric-or-null meaning must win — same
// reasoning tabs.web.tsx and radio-group.web.tsx give for their own Root.
export interface RatingProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'defaultValue'>, RatingOwnProps {}

export const Rating = React.forwardRef<HTMLDivElement, RatingProps>(
  (
    {
      className,
      value,
      defaultValue = null,
      onValueChange,
      max = 5,
      size = 'md',
      readOnly = false,
      disabled = false,
      label = 'Rating',
      formatItemLabel = defaultFormatItemLabel,
      onMouseLeave,
      ...props
    },
    ref,
  ) => {
    const state = useRatingState(value, defaultValue, onValueChange);
    // Scratch UI state, not shared with the native leaf: hover has no touch
    // equivalent (see the file's native leaf for the platform-seam note), so
    // this lives only where a pointer's :hover exists.
    const [hoverValue, setHoverValue] = React.useState<number | null>(null);
    const items = React.useMemo(() => Array.from({ length: max }, (_, i) => i + 1), [max]);

    // readOnly renders a SINGLE labelled, decorative element — not a
    // radiogroup with radios nobody can operate. A disabled screen-reader
    // radio still announces "radio button" to AT; a value has no operable
    // choices at all, and `role="img"` says that plainly in one utterance
    // instead of `max` unreachable ones.
    if (readOnly) {
      return (
        <div
          ref={ref}
          role="img"
          aria-label={formatValueLabel(state.value, max)}
          data-readonly=""
          className={cn('inline-flex items-center gap-0.5', className)}
          {...props}
        >
          {items.map((n) => (
            <StarGlyph
              key={n}
              filled={n <= (state.value ?? 0)}
              className={cn(
                sizeStyles[size],
                n <= (state.value ?? 0) ? 'text-primary' : 'text-line',
              )}
            />
          ))}
        </div>
      );
    }

    const shown = hoverValue ?? state.value;

    const commit = (n: number) => {
      if (disabled) return;
      state.setValue(nextValueOnPress(state.value, n));
    };

    // Roving-tabindex focus follows the value: after a keypress moves it,
    // focus has to move with it, or Tab would leave the user on a star that
    // is no longer part of the tab order (radioItemTabIndex marks every
    // OTHER star -1). Queried by data-* + closest(), the same idiom every
    // other keyboard-driven leaf in this package uses instead of ref-passing.
    const focusItem = (event: React.KeyboardEvent<HTMLButtonElement>, target: number) => {
      const root = event.currentTarget.closest<HTMLElement>('[data-rating-root]');
      root?.querySelector<HTMLButtonElement>(`[data-rating-item="${target}"]`)?.focus();
    };

    return (
      <div
        ref={ref}
        role="radiogroup"
        aria-label={label}
        aria-disabled={disabled ? true : undefined}
        data-disabled={disabled ? '' : undefined}
        data-rating-root=""
        onMouseLeave={(event) => {
          onMouseLeave?.(event);
          setHoverValue(null);
        }}
        className={cn('inline-flex items-center gap-0.5', className)}
        {...props}
      >
        {items.map((n) => {
          const checked = state.value === n;
          const filled = n <= (shown ?? 0);
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={formatItemLabel(n)}
              disabled={disabled}
              tabIndex={ratingItemTabIndex(n, state.value)}
              data-rating-item={n}
              data-state={checked ? 'checked' : 'unchecked'}
              data-disabled={disabled ? '' : undefined}
              // Present on every star the CURRENT hover reaches, not just the
              // one under the pointer — "painting stars up to the hovered
              // index" is the whole preview.
              data-hover={hoverValue !== null && n <= hoverValue ? '' : undefined}
              onMouseEnter={() => {
                if (!disabled) setHoverValue(n);
              }}
              onClick={() => commit(n)}
              onKeyDown={(event) => {
                if (disabled) return;
                const intent = ratingKeyIntent(event.key, state.value, max);
                if (intent.kind === 'none') return;
                event.preventDefault();
                if (intent.kind === 'clear') {
                  state.setValue(null);
                  focusItem(event, 1);
                } else {
                  state.setValue(intent.value);
                  focusItem(event, intent.value);
                }
              }}
              className={cn(
                'flex items-center justify-center rounded-xs',
                sizeStyles[size],
                filled ? 'text-primary' : 'text-line',
                focusRing,
                'touch-manipulation',
                coarseTouchTarget,
                disabledStyles,
              )}
            >
              <StarGlyph filled={filled} className="size-full" />
            </button>
          );
        })}
      </div>
    );
  },
);
Rating.displayName = 'Rating';

/**
 * Filled vs. outlined via the fill mechanism, not a second path: `currentColor`
 * fill for a solid star, `fill="none"` + `currentColor` stroke for an empty
 * one — so the colour classes on the wrapping element (`text-primary` /
 * `text-line`) drive both the fill and the outline with no prop of their own.
 * Decorative in every context it is used from this file, so `aria-hidden`
 * unconditionally; the accessible name lives on the star's own button or on
 * the readOnly root, never on the glyph.
 */
function StarGlyph({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className}>
      {filled ? (
        <path d={STAR_PATH} fill="currentColor" />
      ) : (
        <path
          d={STAR_PATH}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
