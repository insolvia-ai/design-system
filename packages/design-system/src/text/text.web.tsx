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
  familyStyles,
  isHeadingVariant,
  toneStyles,
  variantFamily,
  variantStyles,
  variantWeight,
  weightStyles,
  type TextFamily,
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
  /**
   * Overrides the family the variant implies (`variantFamily`) — a heading in
   * the body face, or a run of `mono` for an id, a hash or a timestamp.
   * Changes the FACE only: size, weight and the heading role are the
   * variant's, and stay the variant's.
   */
  family?: TextFamily | undefined;
  /**
   * Keep the text on one line and elide the overflow.
   *
   * A PROP rather than a documented `className="truncate"`, for two reasons
   * that are really one. On this leaf it has to unseat `text-balance`, which
   * every heading variant carries and which used to beat `truncate` outright —
   * `cn` now settles that for both spellings, so the prop is the CLEAR way to
   * ask rather than the only working one. And on the native leaf a Tailwind
   * class means nothing at all: RN elides with `numberOfLines`, so a caller
   * who reached for `className` had written something that silently did
   * nothing on half the package's surfaces. The prop is the same request in
   * one word on both.
   */
  truncate?: boolean | undefined;
  /**
   * Let a `caption` sit INSIDE a line of text rather than on one of its own.
   *
   * WEB-ONLY, and in the same way `as` is: it is a statement about CSS
   * `display`, and React Native has no such control — a `<Text>` inside a
   * `<View>` is a block-level flex item there and a `<Text>` nested inside
   * another `<Text>` is inline, so on that leaf the caller expresses this by
   * where the element goes, not by a prop.
   *
   * `caption` is the one variant this reaches, because it is the one whose
   * ELEMENT is inline — see `variantElement`.
   */
  inline?: boolean | undefined;
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
  // A `<span>`, not a `<p>`, and that is not the same question as whether a
  // caption LAYS OUT as a block — see the `block` class below. A caption is
  // metadata that often sits inside running text, and `<p>` cannot nest inside
  // `<p>`: making this a paragraph would turn a legal composition into markup
  // the parser silently re-arranges. The element stays inline and the display
  // is set in CSS, which is the half a caller can still override.
  caption: 'span',
};

export const Text = React.forwardRef<HTMLElement, TextProps>(
  (
    {
      as,
      variant = 'body',
      tone = 'ink',
      weight,
      family,
      truncate,
      inline,
      className,
      children,
      ...props
    },
    ref,
  ) =>
    React.createElement(
      as ?? variantElement[variant],
      {
        ref,
        className: cn(
          // Resolved, not appended: `font-heading` and `font-mono` are not one
          // twMerge conflict group, so emitting both would leave the winner to
          // stylesheet order. text.props.ts's `variantFamily` note has the
          // measurement.
          familyStyles[family ?? variantFamily[variant]],
          variantStyles[variant],
          toneStyles[tone],
          weightStyles[weight ?? variantWeight[variant]],
          // A heading rendered as a non-heading element keeps its LOOK and
          // loses its structure — that is the point of `as`, and the caller
          // has taken responsibility for the outline by reaching for it.
          isHeadingVariant(variant) && 'text-balance',
          // `caption` is the one variant whose element is inline, so it is the
          // one that needs `block` in the class list to lay out the way every
          // other variant gets to for free from its element.
          //
          // IT DEFAULTS ON BECAUSE THE INLINE CASE IS THE RARE ONE. Two
          // captions, or a caption under a body line, ran together on one line
          // with nothing between them — a card read `Name0 references · 54
          // files` — and `truncate` did nothing, because an inline box has no
          // width to elide against. A consumer that had swept its own captions
          // for this found nine of eighty-eight genuinely inline. The default
          // was the exception; now `inline` is how to ask for it.
          variant === 'caption' && inline !== true && 'block',
          // AFTER `text-balance`, which is what lets `cn` drop it: the two set
          // the same underlying `text-wrap-mode` and cn.ts states the conflict.
          // This is the same utility a caller would write by hand, so the prop
          // and a bare `className="truncate"` cannot diverge.
          truncate === true && 'truncate',
          className,
        ),
        ...props,
      },
      children,
    ),
);
Text.displayName = 'Text';
