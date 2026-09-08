// SHARED — no react-dom / react-native / base-ui import. `react` and the
// button/lib modules only. ButtonGroup JOINS Buttons; it does not render one —
// a leaf may not import another component's leaf (see the component skill),
// so `buttonGroupItemClass` below imports `buttonClass` from
// `../button/button.props`, the same class-composition function Button's own
// web leaf calls, and layers the "joined" look on top of it: a shared border,
// only the outer corners rounded, adjoining borders collapsed by a 1px
// overlap. The string composition is platform-agnostic even though its
// output (Tailwind classes) is web-only — the same reasoning `buttonClass`
// itself is built on — so it lives here rather than in button-group.web.tsx.
//
// ButtonGroup is for ACTIONS, not a selection. `ToggleGroup` already exists
// for "pressing one changes a value"; this is "pressing one performs a
// thing" — Save/Cancel, a row of icon actions. That distinction is why there
// is no `value`/`onValueChange` anywhere below: an Item has nothing to be
// pressed INTO, only an `onClick`/`onPress` to fire.
import * as React from 'react';

import { buttonClass } from '../button/button.props';
import { cn } from '../lib/cn';

export type ButtonGroupOrientation = 'horizontal' | 'vertical';
export type ButtonGroupSize = 'sm' | 'md' | 'lg';

/**
 * A DELIBERATE SUBSET of `ButtonIntent`. `danger` is not here: a row of
 * buttons sharing one border reads as one control with one weight, and a
 * group is the wrong place to introduce Button's singular destructive fill
 * alongside ordinary actions — a caller wanting a destructive action reaches
 * for a lone `Button`, not a `ButtonGroup.Item`.
 */
export type ButtonGroupIntent = 'primary' | 'secondary' | 'ghost';

/** Where an Item sits in the row (or column): the outer two get rounded on their outside edge, the rest get none, and a lone Item gets both. */
export type ButtonGroupPosition = 'first' | 'middle' | 'last' | 'only';

/**
 * Where child `index` sits among `count` siblings. Pure arithmetic, shared by
 * both leaves so "first/middle/last/only" is computed once rather than by two
 * leaves that could drift apart.
 */
export function buttonGroupPosition(index: number, count: number): ButtonGroupPosition {
  if (count <= 1) return 'only';
  if (index === 0) return 'first';
  if (index === count - 1) return 'last';
  return 'middle';
}

export interface ButtonGroupContextValue {
  orientation: ButtonGroupOrientation;
  /** Joined borders (the default) vs. a plain evenly-spaced row. */
  attached: boolean;
  /** ORed with each Item's own `disabled` — an Item cannot opt out of a disabled group. */
  disabled: boolean;
  size: ButtonGroupSize;
  intent: ButtonGroupIntent;
}

export const ButtonGroupContext = React.createContext<ButtonGroupContextValue | null>(null);

export function useButtonGroupContext(): ButtonGroupContextValue {
  const ctx = React.useContext(ButtonGroupContext);
  if (!ctx) throw new Error('ButtonGroup.Item must be rendered inside <ButtonGroup.Root>');
  return ctx;
}

/**
 * A SECOND, narrower context carrying just one Item's computed position.
 * `ButtonGroupContext` is one value shared by the whole group; position
 * differs PER ITEM, so Root wraps each child in its own `Provider` (see
 * either leaf's `Root`) rather than trying to fit a per-child value into the
 * single group-wide context. The default (`'only'`) only ever shows if an
 * `Item` is rendered outside a `Root` entirely, which `useButtonGroupContext`
 * already rejects.
 */
export const ButtonGroupPositionContext = React.createContext<ButtonGroupPosition>('only');

export interface ButtonGroupRootOwnProps {
  /** Row (default) or column. */
  orientation?: ButtonGroupOrientation | undefined;
  /** Joined borders with only the outer corners rounded (default `true`). `false` is a plain `gap-sm` row — evenly spaced, each Item keeps its own full rounding. */
  attached?: boolean | undefined;
  /** Disables every Item that reads this group's context. */
  disabled?: boolean | undefined;
  /** The size every Item wears. Defaults to `md`. */
  size?: ButtonGroupSize | undefined;
  /** The emphasis every Item wears. Defaults to `secondary`. */
  intent?: ButtonGroupIntent | undefined;
  /** Names the group — there is no visible label otherwise. Web: `aria-label`. Native: `accessibilityLabel`. */
  label?: string | undefined;
}

export interface ButtonGroupItemClassOptions {
  intent: ButtonGroupIntent;
  size: ButtonGroupSize;
  orientation: ButtonGroupOrientation;
  attached: boolean;
  position: ButtonGroupPosition;
  className?: string | undefined;
}

/**
 * The Item's Tailwind classes: `buttonClass` for the button itself, plus the
 * "joined" treatment when `attached`. Detached is exactly `buttonClass` —
 * Root's own `gap-sm` does the spacing and nothing about a single button
 * changes.
 *
 * THE JOIN, spelled out once here rather than at each call site. A middle
 * Item loses all four corners (`rounded-none`); an end Item loses all four
 * and regains only its outer two (`rounded-none rounded-l-md`, say) — never a
 * bare `rounded-l-md` layered over `buttonClass`'s own `rounded-md`, which
 * would leave `cn()` holding two classes from DIFFERENT tailwind-merge
 * conflict groups (`rounded` vs. `rounded-l`) with no declared winner between
 * them. `rounded-none` first is what makes the winner deterministic:
 * Tailwind's generated stylesheet always places a `rounded-{side}-*` utility
 * after the plain `rounded`/`rounded-none` ones, so the side utility's two
 * longhands win over `rounded-none`'s shorthand for exactly the corners it
 * names, and `rounded-none` supplies the other two — verified against the
 * real compiler, not assumed. Every non-first, non-`only` Item also loses 1px
 * to `-ml-px`/`-mt-px` so its border sits exactly on its neighbour's rather
 * than doubling it, and `focus-visible:z-10` lifts a focused Item's ring
 * above the neighbour it would otherwise paint under.
 */
export function buttonGroupItemClass({
  intent,
  size,
  orientation,
  attached,
  position,
  className,
}: ButtonGroupItemClassOptions): string {
  if (!attached) {
    return buttonClass({ intent, size, className });
  }

  const vertical = orientation === 'vertical';
  const startRadius = vertical ? 'rounded-t-md' : 'rounded-l-md';
  const endRadius = vertical ? 'rounded-b-md' : 'rounded-r-md';
  const overlap = vertical ? '-mt-px' : '-ml-px';

  return cn(
    buttonClass({ intent, size }),
    'border border-line',
    position === 'only' ? 'rounded-md' : 'rounded-none',
    position === 'first' ? startRadius : null,
    position === 'last' ? endRadius : null,
    position !== 'first' && position !== 'only' ? overlap : null,
    'focus-visible:z-10',
    className,
  );
}
