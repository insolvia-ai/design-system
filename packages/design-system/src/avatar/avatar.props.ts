// SHARED — `react` only (context + state). No react-dom, no react-native.
// Avatar's entire behavior model is the image-load status: `Image` reports
// its own load/error into it, `Fallback` renders whenever the status isn't
// `'loaded'`. Both leaves consume it verbatim; they differ only in the
// elements they render (`<img>`/`<span>` vs. `Image`/`View`+`Text`).
import * as React from 'react';

export type AvatarSize = 'sm' | 'md' | 'lg';

/** Fixed pixel box per size — shared so both leaves render identical boxes. */
export const avatarSizePx: Record<AvatarSize, number> = {
  sm: 24,
  md: 32,
  lg: 40,
};

export type AvatarImageStatus = 'idle' | 'loaded' | 'error';

export interface AvatarRootContextValue {
  imageStatus: AvatarImageStatus;
  setImageStatus: (status: AvatarImageStatus) => void;
}

export const AvatarRootContext = React.createContext<AvatarRootContextValue | null>(null);

export function useAvatarRootContext(part: string): AvatarRootContextValue {
  const ctx = React.useContext(AvatarRootContext);
  if (!ctx) throw new Error(`Avatar.${part} must be rendered inside <Avatar.Root>`);
  return ctx;
}

export interface AvatarRootOwnProps {
  /** Defaults to 'md' (32px). */
  size?: AvatarSize;
}

/**
 * The image-load state machine — pure React, identical on both platforms.
 * Starts `'idle'` (no image has resolved yet, so Fallback shows); `Image`
 * moves it to `'loaded'` or `'error'` from its own onLoad/onError.
 */
export function useAvatarImageStatus(): [AvatarImageStatus, (status: AvatarImageStatus) => void] {
  return React.useState<AvatarImageStatus>('idle');
}

/**
 * A stack of avatars — a crew, the people on a thread.
 *
 * The group carries the SIZE so the row cannot end up ragged: setting it once
 * on the group beats setting it identically on every child and hoping. A child
 * that names its own `size` still wins, because an explicit prop should never
 * be silently overruled.
 */
export interface AvatarGroupContextValue {
  size: AvatarSize;
}

export const AvatarGroupContext = React.createContext<AvatarGroupContextValue | null>(null);

/** Returns `null` outside a group — a lone Avatar is the normal case. */
export function useAvatarGroup(): AvatarGroupContextValue | null {
  return React.useContext(AvatarGroupContext);
}

export interface AvatarGroupOwnProps {
  size?: AvatarSize | undefined;
  /**
   * Show at most this many, with a `+N` counter for the rest. Omit to show
   * every one.
   */
  max?: number | undefined;
  /**
   * Names the group for assistive tech — "Crew", "Thread participants". A row
   * of avatars is a set, and a screen reader that reads five names with no
   * word for what they are is announcing a list of strangers.
   */
  label?: string | undefined;
}

/** How far each avatar after the first slides under the one before it. */
export const AVATAR_GROUP_OVERLAP_PX = 8;

/**
 * Splits a group's children into what is shown and what is counted.
 *
 * Shared, because "+2" appearing on one platform and "+3" on the other for the
 * same list is exactly the class of divergence this package exists to prevent
 * — and the arithmetic has an edge case worth pinning: with `max` equal to the
 * child count there is no overflow at all, and with `max` one less than it the
 * counter says "+1" rather than replacing the last avatar with a chip reading
 * "+1" that hides two.
 */
export function splitGroup<T>(
  items: readonly T[],
  max: number | undefined,
): {
  visible: readonly T[];
  overflow: number;
} {
  if (max === undefined || max >= items.length) return { visible: items, overflow: 0 };
  const safeMax = Math.max(0, max);
  return { visible: items.slice(0, safeMax), overflow: items.length - safeMax };
}
