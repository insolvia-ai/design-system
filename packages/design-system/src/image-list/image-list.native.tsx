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
import { textScale, useNativeBodyFamily } from '../lib/native-typography';
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
  const gapPx = gapValue[gap];
  const ctx = React.useMemo(() => ({ columns, variant, gapPx }), [columns, variant, gapPx]);
  // THE GUTTER IS NEGATIVE MARGIN PLUS ITEM PADDING, NOT `columnGap` —
  // measured in the workbench, where three `33.33%` tiles plus two column
  // gaps came to more than a row and the third tile wrapped, so the native
  // pane showed two columns beside the web pane's three. A CSS grid takes
  // its gap out of the tracks; a wrapping flex row adds it on top of the
  // percentages. Pulling the row out by half a gap on each side and padding
  // every tile by the same half is the flex-only spelling of "N equal
  // columns with a gutter between them" — `rowGap` alone is safe because
  // rows have no percentage to overflow.
  return (
    <ImageListContext.Provider value={ctx}>
      <View
        role="list"
        style={[styles.root, { rowGap: gapPx, marginHorizontal: -gapPx / 2 }, style]}
        {...props}
      >
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
 * `Item.rows` shapes the tile but cannot pack it. The tile's aspect ratio is
 * `cols / rows`, so a 2×2 tile is a big square, a 2×1 a wide strip and a 1×2
 * a tall one — the same SHAPES the web grid draws. What a wrapping flex row
 * cannot do is flow the next tiles into the space beside a tall one: a CSS
 * grid has row tracks to place them in, flex has only the row the tall tile
 * sits on, so tiles after it start a fresh row underneath. Measured in the
 * workbench — the first draft pinned `aspectRatio: 1`, which turned every
 * widened tile into a square whatever `rows` said, and that was a wider
 * divergence than the packing one this leaf is honest about.
 */
const ImageListItem = ({
  src,
  alt,
  rows = 1,
  cols = 1,
  style,
  children,
  ...props
}: ImageListItemProps) => {
  const { columns, variant, gapPx = 0 } = useImageListContext('Item');
  const r = useNativeRadii();
  const decorative = alt === '';
  const effectiveCols = variant === 'quilted' ? cols : 1;
  const effectiveRows = variant === 'quilted' ? rows : 1;
  // RN's `DimensionValue` only accepts a percentage as the template-literal
  // type `${number}%`, not a plain `string` — a bare template literal would
  // widen back to `string` and fail the `style` overload below.
  const widthPercent: `${number}%` = `${(100 * effectiveCols) / columns}%`;

  return (
    <View
      role="listitem"
      style={[styles.cell, { width: widthPercent, paddingHorizontal: gapPx / 2 }, style]}
      {...props}
    >
      {/* The tile proper: the cell above is width + gutter, this is the box
          the image, the radius and an absolute `ItemBar` all measure against. */}
      <View
        style={[styles.item, { aspectRatio: effectiveCols / effectiveRows, borderRadius: r.md }]}
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
  const body = useNativeBodyFamily();
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
        <Text numberOfLines={1} style={[styles.title, { fontFamily: body, color: c.overlayInk }]}>
          {title}
        </Text>
        {subtitle === undefined ? null : (
          <Text
            numberOfLines={1}
            style={[styles.subtitle, { fontFamily: body, color: c.overlayMuted }]}
          >
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
  cell: {},
  item: { position: 'relative', overflow: 'hidden' },
  // ABSOLUTE FILL, NOT `height: '100%'`. The tile's height comes from
  // `aspectRatio` alone, which CSS does not count as a definite height, and
  // a percentage height against an indefinite parent resolves to `auto` in a
  // browser — 0 for a background-painted Image under react-native-web. Yoga
  // on a device resolves the same percentage against the aspect-ratio height,
  // so the two engines disagree about `height: '100%'` here and agree about
  // an absolutely positioned box, which is sized by its offsets on both.
  // Spelled out rather than `StyleSheet.absoluteFill`: that export is a
  // registered style id in this React Native's types, not a spreadable object.
  imageBox: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
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
