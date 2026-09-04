// NATIVE LEAF — React Native's Text over @insolvia-ai/tokens.
//
// RN has one text primitive and no element names, so `as` has no counterpart
// here: what the web leaf expresses by choosing `<h3>` vs `<p>`, this leaf
// expresses with `accessibilityRole="header"` — which is exactly the split
// `isHeadingVariant` exists to keep in one place. `inline` is web-only for the
// same reason: a <Text> inside a <View> is already a block-level flex item
// here and one nested inside another <Text> is already inline, so the caller
// says it by where the element goes. `truncate` DOES cross — RN elides with
// `numberOfLines` rather than with CSS, which is exactly why it had to become
// a prop instead of a documented class string.
//
// Colors resolve at render time from useNativeColors(); StyleSheet.create
// holds the scheme-independent size blocks alone. The FAMILY is resolved per
// render too — not because it follows the scheme (it does not) but because
// `family` overrides what the variant implies, and a StyleSheet block cannot
// be un-set from the outside.
import * as React from 'react';
import { StyleSheet, Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useNativeColors } from '../lib/native-theme';
import { textScale, useNativeHeadingFamily, useNativeMonoFamily } from '../lib/native-typography';
import {
  isHeadingVariant,
  variantFamily,
  variantWeight,
  type TextFamily,
  type TextTone,
  type TextVariant,
  type TextWeight,
} from './text.props';

export interface TextProps extends RNTextProps {
  variant?: TextVariant | undefined;
  tone?: TextTone | undefined;
  weight?: TextWeight | undefined;
  /** Overrides the family the variant implies. See `familyFont` below. */
  family?: TextFamily | undefined;
  /**
   * Keep the text on one line and elide the overflow — `numberOfLines={1}`,
   * which is how RN spells what the web leaf spells `truncate`. RN's default
   * `ellipsizeMode` is already `tail`, so the ellipsis needs no second prop.
   *
   * An explicit `numberOfLines` still wins: it is spread after this, so a
   * caller wanting two lines and an ellipsis says so directly.
   */
  truncate?: boolean | undefined;
  children?: React.ReactNode;
}

const weightValue: Record<TextWeight, '400' | '500' | '600'> = {
  regular: '400',
  medium: '500',
  semibold: '600',
};

/**
 * The three families, resolved through the seam that maps a role onto each
 * platform's own face — the web leaf's `font-heading`/`font-body`/`font-mono`
 * in this leaf's dialect.
 *
 * `body` is `undefined` ON PURPOSE, and it is not a gap: React Native has no
 * `font-body` to name, so body copy has always rendered the platform's own
 * sans here — which is what `--font-body`'s stack asks for anyway. Setting one
 * would change every existing native surface, which giving `Text` a family
 * control is not licence to do. See native-typography.native.ts.
 *
 * A FUNCTION of the resolved families rather than a module-level constant.
 * `Platform.select` resolves at module load and a family does not follow the
 * colour scheme, so this used to be safe to freeze — but a `ThemeProvider`'s
 * `fonts` override arrives through context, which a module-level map cannot
 * see.
 */
const familyFont = (heading: string, mono: string): Record<TextFamily, string | undefined> => ({
  heading,
  body: undefined,
  mono,
});

export const Text = ({
  variant = 'body',
  tone = 'ink',
  weight,
  family,
  truncate,
  style,
  children,
  ...props
}: TextProps) => {
  const c = useNativeColors();
  const heading = useNativeHeadingFamily();
  const mono = useNativeMonoFamily();
  // Three tones, for the contrast reason text.props.ts measures out.
  const toneColor: Record<TextTone, string> = {
    ink: c.ink,
    muted: c.muted,
    primary: c.primary,
  };

  return (
    <RNText
      // Only when it IS a heading — passing `undefined` would still be a prop
      // react-native-web has to reason about, and the roles differ per variant
      // rather than per component here.
      {...(isHeadingVariant(variant) ? ({ accessibilityRole: 'header' } as const) : {})}
      // Before `{...props}` on purpose — see the prop's doc comment.
      {...(truncate === true ? ({ numberOfLines: 1 } as const) : {})}
      style={[
        styles[variant],
        {
          color: toneColor[tone],
          fontWeight: weightValue[weight ?? variantWeight[variant]],
          // Resolved here rather than held in the StyleSheet block, so an
          // override REPLACES the variant's family instead of layering over
          // it — the same reason the web leaf resolves it before building its
          // class list.
          fontFamily: familyFont(heading, mono)[family ?? variantFamily[variant]],
        },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
};

// `display` and `heading` sit above the shared `textScale`, which stops at
// `lg` because no leaf needed bigger until this component existed. Their
// line heights follow the same ~1.4 ratio the scale uses rather than
// react-native-web's `line-height: normal` (~1.2), which is what made every
// native text block run shorter than its web twin — see native-typography.
// Size and line height only — the FAMILY moved out to `familyFont`, resolved
// per render so `family` can override what the variant implies.
const styles = StyleSheet.create({
  display: { fontSize: 30, lineHeight: 36 },
  heading: { fontSize: 24, lineHeight: 32 },
  title: { ...textScale.lg },
  body: { ...textScale.sm },
  caption: { ...textScale.xs },
});
