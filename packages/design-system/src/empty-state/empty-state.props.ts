// SHARED — imports `react` only. No react-dom, no react-native.
//
// What composes across platforms for an empty state is small: the size axis,
// and the context that hands Root's generated title id and size down to
// Title. Everything else — which element, which a11y role — is a leaf
// decision, because a web `<h3 id>` + `aria-labelledby` and a native
// `accessibilityRole="header"` are different contracts, not different
// spellings of the same one (Tabs' id-vs-value split is the same call).
import * as React from 'react';

export type EmptyStateSize = 'sm' | 'md';

export interface EmptyStateRootContextValue {
  /**
   * Root's own `React.useId()` — the id `Title` renders itself under so Root
   * can point `aria-labelledby` at it. Generated in Root rather than Title:
   * Root is the element that needs to be LABELLED, and a consumer that never
   * renders `Title` should leave Root unlabelled rather than pointing at an id
   * nothing ever mounts. Native has no id/aria-labelledby concept at all — see
   * `empty-state.native.tsx` — so only the web leaf reads this field back.
   */
  titleId: string;
  size: EmptyStateSize;
}

export const EmptyStateRootContext = React.createContext<EmptyStateRootContextValue | null>(null);

export function useEmptyStateRootContext(part: string): EmptyStateRootContextValue {
  const ctx = React.useContext(EmptyStateRootContext);
  if (!ctx) throw new Error(`EmptyState.${part} must be rendered inside <EmptyState.Root>`);
  return ctx;
}

/**
 * Root's context value for one size. A single shared hook rather than each
 * leaf building the object inline, so the two cannot drift on what a
 * `React.useMemo` dependency list needs to include — the same reason
 * `tabs.props.ts` centralises `useTabsState`. Both leaves call this
 * unconditionally; the native leaf simply never reads `titleId` back off it,
 * the same way `tabs.native.tsx` never reads `rootId`.
 */
export function useEmptyStateRootState(size: EmptyStateSize): EmptyStateRootContextValue {
  const titleId = React.useId();
  return React.useMemo(() => ({ titleId, size }), [titleId, size]);
}

/**
 * Root's padding per size — web Tailwind classes. The native leaf maps the
 * same axis onto `spacing.lg`/`spacing.xl` itself (see `empty-state.native.tsx`);
 * kept there rather than here because a spacing TOKEN is not a plain string
 * and `*.props.ts` may not import `@insolvia-ai/tokens` (no package here
 * declares it as a dependency — see the design-system `CLAUDE.md`).
 */
export const rootPaddingStyles: Record<EmptyStateSize, string> = {
  sm: 'p-lg',
  md: 'p-xl',
};

/** Title's text size per size — web Tailwind; the native leaf's own record
 * maps the same axis onto `textScale.base`/`textScale.lg`. */
export const titleTextStyles: Record<EmptyStateSize, string> = {
  sm: 'text-base',
  md: 'text-lg',
};
