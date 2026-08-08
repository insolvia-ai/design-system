// WEB LEAF — plain React DOM + Tailwind.
//
// `as` is a closed union, not the usual open polymorphic generic. A generic
// `as` would let a caller pass any component and would push the whole prop
// surface through a conditional type — for a package whose central claim is
// that two leaves agree, that buys an escape hatch the native leaf can never
// honour (React Native has no `<section>`). The list below is every element a
// run of text here legitimately becomes.
import * as React from 'react';

import { cn } from '../lib/cn';
import {
  isHeadingVariant,
  toneStyles,
  variantStyles,
  variantWeight,
  weightStyles,
  type TextTone,
  type TextVariant,
  type TextWeight,
} from './text.props';

export type TextElement =
  'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'strong' | 'em' | 'label';

export interface TextProps extends React.ComponentPropsWithoutRef<'p'> {
  /** Overrides the element the variant would pick. See `variantElement`. */
  as?: TextElement | undefined;
  variant?: TextVariant | undefined;
  tone?: TextTone | undefined;
  /** Defaults to the variant's own weight (`variantWeight`). */
  weight?: TextWeight | undefined;
}

/**
 * The element each variant renders when `as` is not given.
 *
 * Lives in this leaf, not in `text.props.ts`: an HTML tag name is a web fact,
 * and the native leaf has no use for it. `display` is an `<h2>` rather than an
 * `<h1>` for the same reason `Card.Title` is an `<h3>` — a component cannot
 * know it is the only thing on the page, and a stray second `<h1>` is an
 * `axe` finding in whatever composes it.
 */
const variantElement: Record<TextVariant, TextElement> = {
  display: 'h2',
  heading: 'h3',
  title: 'h4',
  body: 'p',
  caption: 'span',
};

export const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ as, variant = 'body', tone = 'ink', weight, className, children, ...props }, ref) =>
    React.createElement(
      as ?? variantElement[variant],
      {
        ref,
        className: cn(
          variantStyles[variant],
          toneStyles[tone],
          weightStyles[weight ?? variantWeight[variant]],
          // A heading rendered as a non-heading element keeps its LOOK and
          // loses its structure — that is the point of `as`, and the caller
          // has taken responsibility for the outline by reaching for it.
          isHeadingVariant(variant) && 'text-balance',
          className,
        ),
        ...props,
      },
      children,
    ),
);
Text.displayName = 'Text';
