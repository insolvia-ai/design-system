// NATIVE LEAF — RN primitives over @insolvia-ai/tokens. Colors resolve at
// render time via useNativeColors(); StyleSheet.create holds scheme-
// independent layout only.
//
// NO FlatList. FlatList virtualizes a SCROLLING list, and virtualizing one
// needs either a fixed row height or an expensive per-item measurement pass
// — neither fits a grid whose tiles can be images of any aspect the caller
// hands it. This is also not what ImageList IS: it is a layout block meant
// to sit inside whatever the consumer's screen already scrolls, the same way
// the web leaf is a `<ul>` and not its own scroll container. A `View` with
// `flexDirection: 'row', flexWrap: 'wrap'` is the flex-only answer to what
// CSS Grid's `repeat(columns, 1fr)` does on web: every item claims its own
// share of the row's width and wraps onto the next line once it runs out.
import * as React from 'react';
import { Image, StyleSheet, Text, View, type ViewProps } from 'react-native';

import { spacing } from '@insolvia-ai/tokens';

import { useNativeColors, useNativeRadii } from '../lib/native-theme';
import { textScale } from '../lib/native-typography';
import {
  DEFAULT_COLUMNS,
  ImageListContext,
  useImageListContext,
  type ImageListGap,
  type ImageListItemBarOwnProps,
  type ImageListItemOwnProps,
  type ImageListVariant,
} from './image-list.props';

/** Native's dp equivalent of `gapClass` — lives here, not in the shared
 * props module, because it is the one map that needs `@insolvia-ai/tokens`;
 * see `stack.native.tsx` for the same split and the same reason. */
const gapValue: Record<ImageListGap, number> = {
  none: 0,
  xs: spacing.xs,
  sm: spacing.sm,
  md: spacing.md,
};

export interface ImageListRootProps extends ViewProps {
  columns?: number | undefined;
  gap?: ImageListGap | undefined;
  variant?: ImageListVariant | undefined;
  children?: React.ReactNode;
}

const ImageListRoot = ({
  columns = DEFAULT_COLUMNS,
  gap = 'sm',
  variant = 'standard',
  style,
  children,
  ...props
}: ImageListRootProps) => {
  const ctx = React.useMemo(() => ({ columns, variant }), [columns, variant]);
  return (
    <ImageListContext.Provider value={ctx}>
      <View role="list" style={[styles.root, { gap: gapValue[gap] }, style]} {...props}>
        {children}
      </View>
    </ImageListContext.Provider>
  );
};

export interface ImageListItemProps extends Omit<ViewProps, 'children'>, ImageListItemOwnProps {
  children?: React.ReactNode;
}

/**
 * One tile. `width` is the flex-wrap answer to a grid column: `100 /
 * columns`%, widened to `(100 * cols) / columns`% under `quilted` — the
 * same span `Item.cols` asks for on web, just spelled as a width instead of
 * a `grid-column`.
 *
 * `Item.rows` has NO native equivalent and is silently ignored here — a
 * wrapping flex row has no row TRACK to span the way a CSS grid does; making
 * a tile taller would only push every tile after it down by that much,
 * which is not what "spans two rows" means on web. `rows` still exists on
 * `ImageListItemOwnProps` because the type is shared with the web leaf,
 * where it does mean something.
 */
const ImageListItem = ({
  src,
  alt,
  rows: _rows = 1,
  cols = 1,
  style,
  children,
  ...props
}: ImageListItemProps) => {
  const { columns, variant } = useImageListContext('Item');
  const r = useNativeRadii();
  const decorative = alt === '';
  const effectiveCols = variant === 'quilted' ? cols : 1;
  // RN's `DimensionValue` only accepts a percentage as the template-literal
  // type `${number}%`, not a plain `string` — a bare template literal would
  // widen back to `string` and fail the `style` overload below.
  const widthPercent: `${number}%` = `${(100 * effectiveCols) / columns}%`;

  return (
    <View
      role="listitem"
      style={[styles.item, { width: widthPercent, borderRadius: r.md }, style]}
      {...props}
    >
      {/*
        THE NAME GOES ON THIS WRAPPER, NOT ON THE Image — measured, not
        assumed, and the same finding `card.native.tsx` documents in full:
        react-native-web renders an `Image` as a background-painted <View>
        with a zero-opacity <img> inside it, and only `alt` on THAT <img>
        (never `accessibilityLabel` on the Image) survives into a browser's
        accessibility tree. Naming a View we own instead gives exactly one
        named node instead of a roleless <div aria-label> (illegal per this
        package's own axe gate) doubled up with a second name on the hidden
        <img>. `alt` still goes to the Image below for a REAL device, where
        RN's own Image maps it to the accessibility label directly.
      */}
      <View
        {...(decorative ? {} : { role: 'img', accessibilityLabel: alt })}
        style={styles.imageBox}
      >
        <Image source={{ uri: src }} alt={alt} resizeMode="cover" style={styles.image} />
      </View>
      {children}
    </View>
  );
};

export interface ImageListItemBarProps extends ViewProps, ImageListItemBarOwnProps {
  actions?: React.ReactNode;
}

/**
 * The overlay caption — `overlayScrim`/`overlayInk`/`overlayMuted` are the
 * one set of tokens pinned to the SAME value in both colour schemes (see the
 * `$comment2` block in `tokens.json`), which is what keeps this legible over
 * an arbitrary image no matter which scheme the rest of the screen is in.
 */
const ImageListItemBar = ({
  title,
  subtitle,
  actions,
  position = 'bottom',
  style,
  ...props
}: ImageListItemBarProps) => {
  const c = useNativeColors();
  return (
    <View
      style={[
        styles.bar,
        position === 'bottom' ? styles.barBottom : styles.barTop,
        { backgroundColor: c.overlayScrim },
        style,
      ]}
      {...props}
    >
      <View style={styles.barText}>
        <Text numberOfLines={1} style={[styles.title, { color: c.overlayInk }]}>
          {title}
        </Text>
        {subtitle === undefined ? null : (
          <Text numberOfLines={1} style={[styles.subtitle, { color: c.overlayMuted }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {actions === undefined ? null : <View style={styles.barActions}>{actions}</View>}
    </View>
  );
};

export const ImageList = {
  Root: ImageListRoot,
  Item: ImageListItem,
  ItemBar: ImageListItemBar,
};

const styles = StyleSheet.create({
  root: { flexDirection: 'row', flexWrap: 'wrap' },
  item: { position: 'relative', overflow: 'hidden', aspectRatio: 1 },
  imageBox: { width: '100%', height: '100%' },
  image: { width: '100%', height: '100%' },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  barBottom: { bottom: 0 },
  barTop: { top: 0 },
  barText: { flex: 1, minWidth: 0 },
  barActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexShrink: 0 },
  title: { ...textScale.sm, fontWeight: '500' },
  subtitle: { ...textScale.xs },
});
