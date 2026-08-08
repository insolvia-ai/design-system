// NATIVE LEAF — RN primitives over @insolvia-ai/tokens. Pure surface, so the
// port is layout-only: no state or a11y wiring to share beyond card.props.
// Colors come from useNativeColors() at render time (scheme-aware); only the
// scheme-independent layout sits in StyleSheet.create.
import * as React from 'react';
import { Image, StyleSheet, Text, View, type ViewProps } from 'react-native';

import { radii, spacing } from '@insolvia-ai/tokens';

import { useNativeColors } from '../lib/native-theme';
import { headingFamily, textScale } from '../lib/native-typography';
import { CARD_IMAGE_HEIGHT, type CardElevation, type CardImageOwnProps } from './card.props';

export interface CardProps extends ViewProps {
  elevation?: CardElevation;
}

const CardRoot = ({ elevation = 'flat', style, ...props }: CardProps) => {
  const c = useNativeColors();
  return (
    <View
      style={[
        styles.root,
        { borderColor: c.line, backgroundColor: c.card },
        elevation === 'raised' ? styles.raised : null,
        style,
      ]}
      {...props}
    />
  );
};

const CardTitle = ({ children }: { children?: React.ReactNode }) => {
  const c = useNativeColors();
  return (
    <Text accessibilityRole="header" style={[styles.title, { color: c.ink }]}>
      {children}
    </Text>
  );
};

const CardBody = ({ children }: { children?: React.ReactNode }) => {
  const c = useNativeColors();
  return <Text style={[styles.body, { color: c.muted }]}>{children}</Text>;
};

const CardFooter = ({ style, ...props }: ViewProps) => (
  <View style={[styles.footer, style]} {...props} />
);

/**
 * A full-bleed image at the top of the card.
 *
 * The negative margins cancel `Card.Root`'s `padding: spacing.lg`, the same
 * job the web leaf's `-mx-lg -mt-lg` does — so this belongs FIRST inside the
 * Root on both platforms.
 *
 * `alt` still goes to the Image, because RN's own Image maps it to the
 * accessible name on a real device. What names it in a BROWSER is the wrapper
 * below — see the block comment there for the measurements behind that, and
 * `avatar.native.tsx` for the 0.8.3 bug that made this worth measuring.
 */
const CardImage = ({ src, alt, caption, height = CARD_IMAGE_HEIGHT }: CardImageOwnProps) => {
  const c = useNativeColors();
  const decorative = alt === '';

  return (
    <View style={styles.imageWrap}>
      {/*
        THE NAME GOES ON THIS WRAPPER, NOT ON THE IMAGE. Measured, not assumed
        — react-native-web renders an `Image` as a background-painted <div>
        with a zero-opacity <img> inside it, and the two props behave
        differently:

          alt="Ship"                → outer <div> unnamed, inner <img alt="">
          accessibilityLabel="Ship" → outer <div aria-label>, inner <img alt="Ship">

        So `alt` alone leaves the image decorative in a browser (the divergence
        Avatar shipped in 0.8.3), while `accessibilityLabel` names it TWICE:
        once on a generic <div>, where `aria-label` is a prohibited attribute
        that our own axe gate rejects, and once on the inner <img>.

        Putting `role="img"` on that outer div would make the attribute legal
        and leave the double naming in place. Naming a wrapper we own instead
        gives exactly one named node: this View is the image as far as
        assistive tech is concerned, and RNW's inner <img> stays decorative
        because nothing sets `accessibilityLabel` on the Image itself.

        `alt=""` is the explicit "nothing to announce", so it drops the role
        and the label rather than announcing an empty image.
      */}
      <View
        {...(decorative ? {} : ({ role: 'img', accessibilityLabel: alt } as Partial<ViewProps>))}
        style={styles.imageBox}
      >
        <Image
          source={{ uri: src }}
          alt={alt}
          resizeMode="cover"
          style={[styles.image, { height }]}
        />
      </View>
      {caption === undefined ? null : (
        <Text style={[styles.caption, { color: c.muted }]}>{caption}</Text>
      )}
    </View>
  );
};

export const Card = {
  Root: CardRoot,
  Image: CardImage,
  Title: CardTitle,
  Body: CardBody,
  Footer: CardFooter,
};

const styles = StyleSheet.create({
  root: {
    flexDirection: 'column',
    gap: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  raised: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  title: { fontFamily: headingFamily, ...textScale.lg, fontWeight: '600' },
  body: { ...textScale.sm },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingTop: spacing.sm },
  // Cancels the Root's padding, exactly as the web leaf's `-mx-lg -mt-lg`.
  imageWrap: {
    marginHorizontal: -spacing.lg,
    marginTop: -spacing.lg,
  },
  // The box that carries the accessible name; the radius lives here so the
  // clipped corners belong to the same element assistive tech sees.
  imageBox: {
    width: '100%',
    overflow: 'hidden',
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
  },
  image: {
    width: '100%',
    // The Root has no `overflow: hidden` (it would clip a Ribbon), so the
    // image rounds its own top corners to match the card's radius.
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
  },
  caption: { ...textScale.xs, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
});
