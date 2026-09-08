// WEB LEAF — plain React DOM. A real `<a>`, forwardRef, `onClick` passed
// straight through with no interception of its own: this package knows
// nothing about routers (see the header note in link.props.ts), so a caller
// wrapping this in their own router's `<Link>` still gets to call
// `preventDefault()` on the click it hands this component.
import * as React from 'react';

import { cn } from '../lib/cn';
import { focusRing } from '../lib/styles';
import {
  EXTERNAL_GLYPH,
  EXTERNAL_HINT_TEXT,
  toneStyles,
  underlineStyles,
  type LinkTone,
  type LinkUnderline,
} from './link.props';

export interface LinkProps extends Omit<React.ComponentPropsWithoutRef<'a'>, 'href'> {
  /** Destination. Required — an anchor with nowhere to go is not a link. */
  href: string;
  /** Colour, with no semantics. Defaults to `'primary'`. */
  tone?: LinkTone | undefined;
  /** Whether the underline shows always, only on hover, or never. Defaults to `'always'`. */
  underline?: LinkUnderline | undefined;
  /**
   * Opens `href` in a new tab (`target="_blank" rel="noopener noreferrer"`)
   * and marks that for assistive tech: a decorative "↗" plus a
   * screen-reader-only "(opens in a new tab)" appended after it. The glyph
   * alone would be silent to a screen reader and the text alone invisible at
   * a glance — the pairing is what the WAI-ARIA practices call for on a link
   * that leaves the current tab.
   */
  external?: boolean | undefined;
  /**
   * Renders `aria-disabled="true"` and drops `href` entirely. An `<a>` with
   * no `href` falls out of the tab order on its own — that omission, not a
   * `disabled` attribute anchors do not have, is what makes this the correct
   * disabled anchor.
   */
  disabled?: boolean | undefined;
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  (
    {
      className,
      href,
      tone = 'primary',
      underline = 'always',
      external = false,
      disabled = false,
      rel,
      target,
      children,
      ...props
    },
    ref,
  ) => (
    <a
      ref={ref}
      // No `href` at all when disabled, rather than `href="#"` or an empty
      // string — see the JSDoc above.
      href={disabled ? undefined : href}
      aria-disabled={disabled ? true : undefined}
      target={external ? '_blank' : target}
      rel={external ? 'noopener noreferrer' : rel}
      className={cn(
        // `touch-manipulation`: skips the double-tap-to-zoom delay a mobile
        // browser otherwise inserts before every tap, on every pressable
        // surface this package draws — see the design-system-guidelines
        // skill's Touch section.
        'touch-manipulation rounded-sm font-body',
        toneStyles[tone],
        underlineStyles[underline],
        focusRing,
        disabled && 'pointer-events-none cursor-not-allowed opacity-50',
        className,
      )}
      {...props}
    >
      {children}
      {external ? (
        <>
          {' '}
          {/* Decorative — EXTERNAL_HINT_TEXT below carries the meaning. */}
          <span aria-hidden="true">{EXTERNAL_GLYPH}</span>
          {/* No shared visually-hidden component exists in this package yet
              (another component owns adding one), so this leaf writes its own
              `sr-only` span rather than wait on it. */}
          <span className="sr-only"> {EXTERNAL_HINT_TEXT}</span>
        </>
      ) : null}
    </a>
  ),
);
Link.displayName = 'Link';
