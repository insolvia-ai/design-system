// SHARED — no react-native / react-dom / base-ui import. `react` itself is
// fine (see the package rule): `React.Children.toArray` is pure React, not a
// renderer.
//
// This module holds the WEB half of the gap map only, not the native half.
// The whole reason Stack exists is that the spacing scale has a different
// UNIT per platform — Tailwind class names (`gap-md`) on web, `dp` numbers
// from `@insolvia-ai/tokens` (`spacing.md`) on native — so there is no single
// "gap value" to share between leaves, only a shared NAME. Grepping every
// `*.props.ts` in this package turns up none that import
// `@insolvia-ai/tokens`: that import belongs to the native leaf, alongside
// `useNativeColors`/`useNativeRadii`, not to shared code. So the native gap
// map lives in `stack.native.tsx`, next to the tokens import it needs, and
// this file keeps only the type unions plus the web class strings.
import * as React from 'react';

export type StackDirection = 'row' | 'column';
export type StackGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type StackAlign = 'start' | 'center' | 'end' | 'stretch';
export type StackJustify = 'start' | 'center' | 'end' | 'between';

export const directionClass: Record<StackDirection, string> = {
  row: 'flex-row',
  column: 'flex-col',
};

/** `none` maps to Tailwind's built-in `gap-0`, not a t-shirt step — there is
 * no `--spacing-none` token, `0` already says "no gap" in both scales. */
export const gapClass: Record<StackGap, string> = {
  none: 'gap-0',
  xs: 'gap-xs',
  sm: 'gap-sm',
  md: 'gap-md',
  lg: 'gap-lg',
  xl: 'gap-xl',
  xxl: 'gap-xxl',
};

export const alignClass: Record<StackAlign, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

export const justifyClass: Record<StackJustify, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
};

/**
 * Interleave `divider` between every pair of `children`, skipping null/
 * undefined/boolean entries so a conditionally-rendered child never leaves an
 * orphan divider at an edge or a doubled one in the middle.
 *
 * Shared rather than duplicated per leaf: `React.Children.toArray` already
 * drops null/undefined/false and assigns stable keys, which is exactly the
 * bookkeeping both leaves need and none of it is renderer-specific — it is
 * the same array whether it is about to be wrapped in `<div>`s or `<View>`s.
 */
export function withDividers(
  children: React.ReactNode,
  divider: React.ReactNode,
): React.ReactNode[] {
  const items = React.Children.toArray(children);
  if (!divider) return items;

  // `React.createElement`, not JSX — this module is a plain `.ts` file (no
  // renderer, no JSX pragma needed anywhere else in it), so this is the one
  // spot that has to spell out what JSX sugars over.
  return items.flatMap((child, i) =>
    i === 0
      ? [child]
      : [React.createElement(React.Fragment, { key: `divider-${i}` }, divider), child],
  );
}
