// SHARED — no react-native / react-dom / base-ui import. Pure TS: one prop
// pair, no events, no state, no ids — the litmus test in the package
// CLAUDE.md puts data this thin in a single shared file rather than a leaf
// pair, even though the two RENDERINGS below differ completely.
import type * as React from 'react';

/**
 * Content that assistive technology reads and sighted users never see — an
 * icon-only control's name, a table caption with no place in the visual
 * design, a live-region announcement with no visual counterpart.
 */
export interface VisuallyHiddenOwnProps {
  /** The text (or element tree) assistive technology announces. */
  children: React.ReactNode;
  /**
   * WEB ONLY. When true, the content becomes visible the moment it receives
   * focus — the "skip link" case, where a keyboard user needs to SEE the
   * control they just tabbed to, not just hear its name. Defaults to false,
   * because the ordinary case (an icon button's label, a table caption) must
   * stay hidden even while focused: the icon itself is the visible focus
   * target, and popping the label on top of it would be a second, unrequested
   * disclosure.
   *
   * Native has no focus-driven visibility to opt into — see the leaf for why
   * the prop is still accepted there.
   */
  focusable?: boolean | undefined;
}
