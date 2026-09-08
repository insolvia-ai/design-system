// NATIVE LEAF — React Native primitives over @insolvia-ai/tokens, faithful
// radio-group behaviour. Shares the exact value state with the web leaf
// (rating.props); what is reimplemented here is the a11y surface and the
// glyph: RN has no <button role="radio">, so each star is a Pressable with
// accessibilityRole="radio", and RN has no SVG without an extra dependency,
// so the star comes from the platform's own Unicode block instead: ★
// (U+2605, filled) and ☆ (U+2606, empty). The two leaves therefore draw the
// star from two different SOURCES — a self-computed vector path on web, a
// font glyph here — and are held to agreeing only on SIZE (`sizeBoxPx`,
// shared) and COLOUR (`c.primary` / `c.line`, the same tokens the web leaf's
// `text-primary`/`text-line` resolve to); the workbench's side-by-side panes
// are what actually verifies that agreement.
//
// NO HOVER. A touch surface has no pointer that can rest over a target
// without pressing it, so the web leaf's hover-preview state has no native
// equivalent — press-to-set/press-to-clear is the whole native interaction,
// the same platform seam every other :hover-bearing control in this package
// documents at its own leaf.
//
// NO KEYBOARD GRAMMAR EITHER. Roving tabIndex and arrow-key focus are
// DOM/keyboard concepts with no RN analogue — the same split
// radio-group.props.ts draws between its web and native leaves, and for the
// same reason: only the web leaf has a notion of tab order.
import * as React from 'react';
import { Pressable, Text, View, type ViewProps } from 'react-native';

import { useNativeFocusRing } from '../lib/native-focus';
import { useNativeColors } from '../lib/native-theme';
import {
  defaultFormatItemLabel,
  formatValueLabel,
  nextValueOnPress,
  sizeBoxPx,
  useRatingState,
  type RatingOwnProps,
  type RatingSize,
} from './rating.props';

export interface RatingProps extends Omit<ViewProps, 'style'>, RatingOwnProps {
  style?: ViewProps['style'];
}

/**
 * hitSlop that brings every box up to the WCAG 2.5.5 44pt floor. Unlike
 * IconButton (whose `md` box IS 44 and needs none), none of this control's
 * three boxes clear it alone, so every size gets a slop here rather than
 * only the smallest — `icon-button.native.tsx`'s `sizeHitSlop` is the same
 * idiom, sized per box instead of applied uniformly.
 */
const hitSlopFor: Record<RatingSize, number> = { sm: 12, md: 8, lg: 4 };

export function Rating({
  value,
  defaultValue = null,
  onValueChange,
  max = 5,
  size = 'md',
  readOnly = false,
  disabled = false,
  label = 'Rating',
  formatItemLabel = defaultFormatItemLabel,
  style,
  ...props
}: RatingProps) {
  const state = useRatingState(value, defaultValue, onValueChange);
  const c = useNativeColors();
  const box = sizeBoxPx[size];
  const items = React.useMemo(() => Array.from({ length: max }, (_, i) => i + 1), [max]);

  // readOnly renders a SINGLE labelled, decorative element — same reasoning
  // as the web leaf's `role="img"` branch: a value has no operable choices,
  // so nothing here should announce as a radio.
  if (readOnly) {
    return (
      <View
        accessibilityRole="image"
        accessibilityLabel={formatValueLabel(state.value, max)}
        // `inline-flex` on web hugs its content; the native equivalent is
        // `alignSelf: 'flex-start'` on a row, per this package's rule that a
        // native leaf must match its web leaf's intrinsic size.
        style={[{ flexDirection: 'row', gap: 2, alignSelf: 'flex-start' }, style]}
        {...props}
      >
        {items.map((n) => {
          const filled = n <= (state.value ?? 0);
          return (
            <Text
              key={n}
              accessible={false}
              style={{ fontSize: box, lineHeight: box, color: filled ? c.primary : c.line }}
            >
              {filled ? '★' : '☆'}
            </Text>
          );
        })}
      </View>
    );
  }

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={[{ flexDirection: 'row', gap: 2, alignSelf: 'flex-start' }, style]}
      {...props}
    >
      {items.map((n) => (
        <RatingItem
          key={n}
          checked={state.value === n}
          filled={n <= (state.value ?? 0)}
          disabled={disabled}
          box={box}
          hitSlop={hitSlopFor[size]}
          label={formatItemLabel(n)}
          onPress={() => {
            if (disabled) return;
            state.setValue(nextValueOnPress(state.value, n));
          }}
        />
      ))}
    </View>
  );
}

function RatingItem({
  checked,
  filled,
  disabled,
  box,
  hitSlop,
  label,
  onPress,
}: {
  checked: boolean;
  filled: boolean;
  disabled: boolean;
  box: number;
  hitSlop: number;
  label: string;
  onPress: () => void;
}) {
  const c = useNativeColors();
  // This package's ring rather than the browser's default blue one under
  // react-native-web — see lib/native-focus.native.ts. A star reached by
  // keyboard focus (Tab, on the web build) needs the same ring every other
  // focusable control in this package draws.
  const focus = useNativeFocusRing();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked, disabled }}
      accessibilityLabel={label}
      // Checked/disabled reported BOTH ways: `accessibilityState` for real
      // native platforms, and `aria-checked`/`aria-disabled` for
      // react-native-web, whose DOM prop translation does not flatten
      // `accessibilityState` into any `aria-*` attribute — see
      // radio-group.native.tsx's header comment for the full reasoning.
      aria-checked={checked}
      aria-disabled={disabled ? true : undefined}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={onPress}
      onFocus={focus.focus}
      onBlur={focus.blur}
      style={(pressState) => [
        {
          width: box,
          height: box,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : pressState.pressed ? 0.9 : 1,
        },
        focus.ringStyle,
      ]}
    >
      <Text style={{ fontSize: box, lineHeight: box, color: filled ? c.primary : c.line }}>
        {filled ? '★' : '☆'}
      </Text>
    </Pressable>
  );
}
