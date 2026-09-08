// NATIVE LEAF — RN primitives over @insolvia-ai/tokens. Colors resolve at
// render time; StyleSheet.create holds scheme-independent layout only.
//
// `Text` IS INLINE BY NATURE, unlike a `View`. Every other leaf in this
// package that hugs its content (Badge, Button, Chip…) has to say
// `alignSelf: 'flex-start'` because a React Native parent defaults to
// `alignItems: 'stretch'` and would otherwise stretch it — but that default
// only stretches flex children, and a bare `Text` never becomes one on its
// own. Nested inside another `Text` (the InParagraph story) it is exactly
// what running prose already is; rendered on its own it shrink-wraps its
// label without any style declaring so. So this leaf declares nothing for
// size, deliberately, matching the web leaf's plain inline `<a>`.
import * as React from 'react';
import { Linking, StyleSheet, Text, type TextProps } from 'react-native';

import { useNativeFocusRing } from '../lib/native-focus';
import { useNativeColors } from '../lib/native-theme';
import type { LinkTone, LinkUnderline } from './link.props';

export interface LinkProps extends Omit<TextProps, 'onPress'> {
  /** Destination, opened via `Linking.openURL` on press. Required. */
  href: string;
  /** Colour, with no semantics. Defaults to `'primary'`. */
  tone?: LinkTone | undefined;
  /**
   * Whether the underline shows. There is no hover on a touchscreen, so
   * `'hover'` reads the same as `'always'` here — see the platform note where
   * it is applied below. Defaults to `'always'`.
   */
  underline?: LinkUnderline | undefined;
  /**
   * Web-only decoration — the "↗" glyph, `target`/`rel` — has no RN
   * counterpart: `Linking.openURL` always leaves the app, and there is no
   * "tab" to open a second one of. Accepted here purely so one shared call
   * site typechecks against both leaves; it changes nothing about what this
   * leaf renders.
   */
  external?: boolean | undefined;
  /**
   * Renders `accessibilityState={{ disabled: true }}` (plus `aria-disabled`
   * for the browser-rendered case — see the comment where it is set below)
   * and makes a press a no-op. Unlike the web leaf, this does NOT remove the
   * leaf from the focus order: `Text` has no `focusable` prop to set (only
   * `Pressable`/`View` do), so a disabled native link stays reachable by
   * keyboard or switch control and is simply inert once reached.
   */
  disabled?: boolean | undefined;
  /**
   * Fires first on every press, disabled or not excepted — see `disabled`.
   * Same type as `TextProps['onPress']`, redeclared only to attach this doc.
   */
  onPress?: TextProps['onPress'];
  /**
   * Whether a press also opens `href` via `Linking.openURL`, after `onPress`
   * runs. Defaults to `true`; a caller doing its own navigation — an RN
   * consumer's own router — sets this `false` and handles the whole press
   * through `onPress` instead.
   */
  openOnPress?: boolean | undefined;
}

export const Link = ({
  style,
  href,
  tone = 'primary',
  underline = 'always',
  disabled = false,
  onPress,
  openOnPress = true,
  children,
  ...props
}: LinkProps) => {
  const c = useNativeColors();
  const focus = useNativeFocusRing();
  const toneColor: Record<LinkTone, string> = { primary: c.primary, ink: c.ink, muted: c.muted };

  // `onFocus`/`onBlur` are OUTSIDE RN's real `Text` type — Text.d.ts declares
  // neither; only `Pressable`/`TextInput` do, because a bare Text is not a
  // focusable control on a real device. react-native-web's Text forwards them
  // to the underlying DOM element anyway (its `forwardPropsList` includes
  // `focusProps`), which is the only place a KEYBOARD user actually focuses a
  // link this leaf renders, so the ring still has to wire up here. Opaque-cast
  // and spread, the same trick `breadcrumbs.native.tsx` uses for its web-only
  // `aria-current`: live at runtime, invisible to the type checker rather than
  // fought with it.
  const webFocusHandlers = { onFocus: focus.focus, onBlur: focus.blur } as object;

  return (
    <Text
      accessibilityRole="link"
      accessibilityState={{ disabled }}
      // `accessibilityState.disabled` is what a REAL device's screen reader
      // reads; react-native-web does not also derive `aria-disabled` from it
      // (that conversion is Pressable's own doing, not Text's — confirmed by
      // reading createDOMProps: `aria-disabled` only comes from an explicit
      // `aria-disabled`/`accessibilityDisabled` prop). Set it directly so a
      // browser-based test — and a browser-based screen reader — sees it too.
      aria-disabled={disabled ? true : undefined}
      {...webFocusHandlers}
      onPress={
        disabled
          ? undefined
          : (event) => {
              onPress?.(event);
              if (openOnPress) Linking.openURL(href);
            }
      }
      style={[
        // `underline === 'none'` is the only value with an on-device
        // difference; `'hover'` has nothing to defer to without a pointer, so
        // it draws the same as `'always'`.
        underline === 'none' ? styles.noUnderline : styles.underline,
        { color: toneColor[tone] },
        disabled ? styles.disabled : null,
        focus.ringStyle,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};
Link.displayName = 'Link';

const styles = StyleSheet.create({
  underline: { textDecorationLine: 'underline' },
  noUnderline: { textDecorationLine: 'none' },
  disabled: { opacity: 0.5 },
});
