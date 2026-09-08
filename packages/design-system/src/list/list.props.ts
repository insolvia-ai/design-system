// SHARED — no react-native / react-dom / base-ui import. Pure data: the
// `dense`/`inset` axes are booleans with no state or a11y wiring of their own
// (the Badge/Link pattern — plain maps, no context needed for THEM), but
// `Root` is where a caller sets them and `Item`/`Divider` are where they have
// to be read, several JSX levels away. A context is the one piece of "state"
// this file owns, and it exists purely to avoid re-threading two booleans
// through every row a caller writes by hand.
import * as React from 'react';

export interface ListRootContextValue {
  /** Rows render at `dense` height (40) instead of the default (48). */
  dense: boolean;
  /** Rows pad from `pl-xl` instead of `px-md`, so a Leading-less row still
   *  lines up with icon rows elsewhere in the same list. */
  inset: boolean;
}

const DEFAULT_LIST_CONTEXT: ListRootContextValue = { dense: false, inset: false };

export const ListRootContext = React.createContext<ListRootContextValue>(DEFAULT_LIST_CONTEXT);

/**
 * Reads the nearest `List.Root`'s `dense`/`inset`, defaulting to `false` for
 * both rather than throwing outside a `Root` — unlike Sidebar's context (whose
 * `collapsed` a part cannot render sensibly without), every part here has a
 * safe, correct rendering with no `Root` in scope at all, so there is nothing
 * to guard.
 */
export function useListRowContext(): ListRootContextValue {
  return React.useContext(ListRootContext);
}

/**
 * Row min-height in px, read by the NATIVE leaf directly as a `StyleSheet`
 * number. The web leaf's `rowHeightStyles` below says the same thing as a
 * Tailwind utility — one pair of numbers, not two sources of truth for them.
 */
export const ROW_HEIGHT: Record<'normal' | 'dense', number> = { normal: 48, dense: 40 };

/** `min-h-*` per `ROW_HEIGHT`, in Tailwind's own numeric scale (`min-h-12` is
 *  48px, `min-h-10` is 40px) — never the t-shirt-suffixed form, which this
 *  package's ESLint config rejects because it resolves to a few px. */
export const rowHeightStyles: Record<'normal' | 'dense', string> = {
  normal: 'min-h-12',
  dense: 'min-h-10',
};

/** Row padding per `ListRootContextValue.inset`. */
export const rowPaddingStyles: Record<'normal' | 'inset', string> = {
  normal: 'px-md',
  inset: 'pl-xl pr-md',
};

/** The Leading/Trailing icon slot, in px — 24 on both leaves. */
export const SLOT_SIZE = 24;

/**
 * How far an inset `Divider` starts from the left edge, in px: a row's own
 * left padding (`spacing.md`, 16) plus the Leading slot (`SLOT_SIZE`, 24) plus
 * the row's `gap-md` (16) — the same 56 the web leaf spells as `ml-14`
 * (Tailwind's numeric scale, 14 × 4px). Lines the rule up under the TEXT
 * column instead of the icon column, matching where a Leading-less row's text
 * starts under `Root`'s own `inset`.
 */
export const DIVIDER_INSET_PX = 56;

export interface ListItemOwnProps {
  /**
   * Marks this row as the current selection. Web: `data-state="selected"` (a
   * style hook, since `aria-selected` is invalid on a `button` — the WAI-ARIA
   * spec restricts it to `option`/`row`/`gridcell`/etc, none of which this
   * row ever is) plus, ONLY when the row is an anchor (`href`), the real ARIA
   * signal for it: `aria-current="page"`. Native: `accessibilityState.selected`
   * plus the `aria-selected` prop react-native-web actually writes to the DOM
   * (`accessibilityState` alone never reaches it — the same gap
   * `radio-group.native.tsx` documents for `aria-checked`).
   */
  selected?: boolean | undefined;
  /**
   * Disables the row: a pressable row stops firing and (web `button`/native
   * `Pressable`) reports it through the platform's real disabled channel; a
   * `href` row drops its `href` instead, since an anchor has no `disabled`
   * attribute (`link.web.tsx` makes the same call, for the same reason).
   */
  disabled?: boolean | undefined;
}
