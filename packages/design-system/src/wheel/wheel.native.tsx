// NATIVE LEAF — RN primitives over the same shared geometry, keyboard grammar
// and fade (wheel.props). A `ScrollView` of `Pressable` rows, a selection band
// painted behind the middle one, and the same `rowOpacity` falloff the web leaf
// applies — one function, so the two columns cannot disagree about how a wheel
// looks.
//
// TWO PLATFORM SEAMS LIVE HERE, and both are the reason this leaf is not just
// the web leaf with different tags.
//
// 1. SNAPPING. React Native snaps through `snapToInterval`; the browser snaps
//    through CSS `scroll-snap-type`. react-native-web implements neither for a
//    plain ScrollView — it only wires scroll-snap up for `pagingEnabled` — and
//    it silently DROPS `snapToInterval` on the way to the DOM. So the prop is
//    passed for the device and the CSS is applied for the browser, chosen by
//    `Platform.OS`. Sending the CSS keys to a device instead would trip React
//    Native's own style validation.
//
// 2. SETTLING. `onMomentumScrollEnd` never fires under react-native-web: its
//    ScrollViewBase emits a final `onScroll` about 100ms after the last one and
//    nothing else. A debounce on `onScroll` therefore does the settling on both
//    platforms, and the device-only momentum callbacks are wired as well so a
//    real flick commits the moment it stops rather than a beat later. `settle`
//    is idempotent — it commits only when the row differs from the current
//    value — so being called twice costs nothing.
//
// This leaf is what a React Native consumer renders, including in a browser
// through react-native-web, so it is the one that has to be right.
import * as React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewProps,
} from 'react-native';

import { spacing } from '@insolvia-ai/tokens';

import { useNativeColors, useNativeRadii } from '../lib/native-theme';
import { textScale } from '../lib/native-typography';
import {
  ITEM_HEIGHT,
  offsetForIndex,
  rowOpacity,
  useWheelState,
  valueAtOffset,
  WHEEL_HEIGHT,
  WHEEL_PADDING,
  wheelKeyIntent,
  type WheelOwnProps,
} from './wheel.props';

export interface WheelProps extends Omit<ViewProps, 'children'>, WheelOwnProps {}

/** Applies a role react-native-web forwards but RN's own types do not admit. */
function webRole(role: string): Partial<ViewProps> {
  return { role } as unknown as Partial<ViewProps>;
}

/** Matches the web leaf's fallback debounce. See the header. */
const SETTLE_MS = 120;

/**
 * Scroll-snap belongs to the browser here and to `snapToInterval` on a device.
 * `Platform.select` collapses at module load, which is fine: neither arm holds
 * a colour, and the platform cannot change under a running app.
 */
const snapStyle = Platform.select({
  web: { scrollSnapType: 'y mandatory' } as object,
  default: {},
});
const snapRowStyle = Platform.select({
  web: { scrollSnapAlign: 'center' } as object,
  default: {},
});

export const Wheel = ({
  items,
  value,
  defaultValue,
  onValueChange,
  loop = false,
  label,
  disabled = false,
  style,
  ...props
}: WheelProps) => {
  const c = useNativeColors();
  const r = useNativeRadii();
  const state = useWheelState({ items, value, defaultValue, onValueChange });
  const {
    value: current,
    setValue,
    index,
    activeIndex,
    trackOffset,
    listId,
    optionId,
    type,
  } = state;

  const scrollerRef = React.useRef<ScrollView | null>(null);
  const offsetRef = React.useRef(0);

  // Keep the scroller pointing at the selected row.
  //
  // `animated: false`, and the web leaf's note owns the reason: react-native-web
  // turns `animated: true` into `behavior: 'smooth'`, which a browser CANCELS
  // inside the `scroll-snap-type: mandatory` container `snapStyle` applies —
  // leaving the column showing a value it no longer holds. A device would
  // animate this quite happily, but the two leaves agreeing is worth more than
  // an animation only one of them can have.
  React.useEffect(() => {
    scrollerRef.current?.scrollTo({ y: offsetForIndex(index), animated: false });
  }, [index]);

  const settle = React.useCallback(() => {
    if (disabled) return;
    const next = valueAtOffset(items, offsetRef.current);
    if (next === null) return;
    if (next !== current) {
      setValue(next);
      return;
    }
    // The row it stopped on resolves to the value already held — a flick that
    // landed on a FORBIDDEN row whose nearest allowed neighbour is the current
    // one. Nothing changes, so the effect above never runs, and the column
    // would sit parked on a struck-out row while the picker claims a different
    // date. Put it back by hand. Same fix, same words, in the web leaf.
    scrollerRef.current?.scrollTo({ y: offsetForIndex(index), animated: false });
  }, [items, current, index, setValue, disabled]);

  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(
    () => () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    },
    [],
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = event.nativeEvent.contentOffset.y;
    offsetRef.current = offset;
    trackOffset(offset);
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(settle, SETTLE_MS);
  };

  const handleKeyDown = (event: { key: string; preventDefault?: () => void }) => {
    if (disabled) return;
    const intent = wheelKeyIntent(event.key, items, current, loop);
    if (intent.kind === 'none') return;
    event.preventDefault?.();
    if (intent.kind === 'value') {
      setValue(intent.value);
      return;
    }
    const hit = type(intent.char);
    if (hit !== null) setValue(hit);
  };

  // `onKeyDown`, `tabIndex` and `aria-activedescendant` are web-only and
  // outside RN's types; react-native-web forwards all three and drops them on a
  // device. Contained here, as every other native leaf in this package does.
  const webOnly = {
    onKeyDown: handleKeyDown,
    tabIndex: disabled ? -1 : 0,
    'aria-activedescendant': optionId(current),
  } as object;

  return (
    <View style={[styles.root, disabled ? styles.disabled : null, style]} {...props}>
      {/* Behind the scroller, so the middle row's text keeps full contrast. */}
      <View
        pointerEvents="none"
        aria-hidden
        style={[styles.band, { borderRadius: r.md }, { backgroundColor: c.surfaceAlt }]}
      />

      <ScrollView
        ref={scrollerRef}
        nativeID={listId}
        {...webRole('listbox')}
        aria-label={label}
        aria-disabled={disabled}
        {...webOnly}
        scrollEnabled={!disabled}
        showsVerticalScrollIndicator={false}
        // Dropped by react-native-web; the CSS in `snapStyle` covers the
        // browser. See the header.
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="center"
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onScrollEndDrag={settle}
        onMomentumScrollEnd={settle}
        style={[styles.scroller, { borderRadius: r.md }, snapStyle]}
        contentContainerStyle={styles.content}
      >
        {items.map((item, itemIndex) => {
          const selected = item.value === current;
          return (
            <Pressable
              key={item.value}
              nativeID={optionId(item.value)}
              {...webRole('option')}
              {...({ 'aria-selected': selected } as object)}
              accessibilityLabel={item.label}
              aria-disabled={item.disabled}
              disabled={item.disabled === true || disabled}
              // Web-only, and BOTH parts are load-bearing.
              //
              // react-native-web gives every enabled Pressable `tabIndex="0"`,
              // so without this a datetime picker is about 150 tab stops and
              // the single-tab-stop-per-column contract the whole design rests
              // on is a claim only the web leaf honours. `onMouseDown` keeps
              // focus on the listbox that owns `aria-activedescendant`; the web
              // leaf's copy of this carries the full reasoning.
              {...({
                tabIndex: -1,
                onMouseDown: (event: { preventDefault?: () => void }) => event.preventDefault?.(),
              } as object)}
              onPress={() => setValue(item.value)}
              style={[
                styles.row,
                snapRowStyle,
                { opacity: rowOpacity(Math.abs(itemIndex - activeIndex)) },
              ]}
            >
              <Text
                style={[
                  styles.rowLabel,
                  { color: c.ink },
                  selected ? styles.rowSelected : null,
                  // A line rather than another opacity step: fading further
                  // would drop under the contrast floor `rowOpacity` documents,
                  // and WCAG 1.4.1 wants this state carried by more than
                  // colour.
                  item.disabled ? styles.rowUnavailable : null,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { height: WHEEL_HEIGHT, position: 'relative' },
  disabled: { opacity: 0.5 },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    // Centred by arithmetic rather than `top: '50%'` plus a transform: both
    // numbers are constants, so there is nothing for a percentage to buy.
    top: (WHEEL_HEIGHT - ITEM_HEIGHT) / 2,
    height: ITEM_HEIGHT,
  },
  scroller: { flexGrow: 0 },
  // The blank space that lets the first and last rows reach the middle.
  content: { paddingVertical: WHEEL_PADDING },
  row: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  rowLabel: { ...textScale.sm },
  rowSelected: { fontWeight: '500' },
  rowUnavailable: { textDecorationLine: 'line-through' },
});
