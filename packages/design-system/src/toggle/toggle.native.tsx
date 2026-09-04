// NATIVE LEAF — React Native primitives over @insolvia-ai/tokens. Shares the
// exact pressed-state model with the web leaf (toggle.props); what is
// reimplemented here is the a11y surface. react-native's own AccessibilityRole
// union DOES include `'togglebutton'`, but this package's only shipped target
// is the web build (react-native-web) — verified empirically against this repo's
// pinned react-native-web@0.21.2: it maps `'togglebutton'` straight through
// as a non-standard `role="togglebutton"`, which is not a real WAI-ARIA role
// (unlike `'switch'`/`'radio'`, which ARE, despite the same map not listing
// them either) and so gets NO computed accessible name from the Text child.
// `accessibilityRole` stays `'button'` instead — a role react-native-web
// resolves correctly, with the normal accessible-name-from-content rule.
// Pressed/disabled are reported BOTH ways, the same split
// radio-group.native.tsx and switch.native.tsx document: `accessibilityState`
// for real native platforms, and `aria-pressed` for react-native-web, which
// is what actually ships (web is the only target that ships today). This split
// matters because react-native-web's DOM prop translation in the installed
// version does NOT flatten `accessibilityState` into DOM attributes at all —
// relying on it alone would ship a web toggle with no pressed state exposed.
// Unlike `aria-checked`/`aria-disabled` (typed RN props those two leaves use
// directly), `aria-pressed` has no RN type at all, so it needs the same
// contained, documented cast Field's native leaf uses for
// `aria-describedby`/`aria-invalid`.
import * as React from 'react';
import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { spacing } from '@insolvia-ai/tokens';

import { useNativeFocusRing } from '../lib/native-focus';
import { useNativeColors, useNativeRadii } from '../lib/native-theme';
import { textScale } from '../lib/native-typography';
import { useToggleState, type ToggleOwnProps, type ToggleSize } from './toggle.props';

// The web leaf's `toggleSizeStyles` / `toggleIconSizeStyles` in this leaf's
// dialect. `md` is 44 on both — the WCAG 2.5.5 floor every other `md` control
// in the package holds, and which this component used to miss at 36; the props
// module records that change.
const sizeHeight: Record<ToggleSize, number> = { sm: 32, md: 44 };
const sizePadX: Record<ToggleSize, number> = { sm: spacing.sm, md: spacing.md };

/**
 * The 44dp hit area for the one size that is under it, exactly as
 * icon-button.native.tsx does it: `hitSlop` grows the touch area without
 * touching layout or paint, and there is no pointer query because a React
 * Native surface is a touchscreen. Only `iconOnly` needs it — a text toggle at
 * `sm` is 32 tall but as wide as its label, and RN cannot express a
 * height-only expansion without also guessing at the width.
 */
const iconHitSlop: Record<ToggleSize, number> = { sm: 6, md: 0 };

// `disabled` is Omit-ed from PressableProps: it declares `boolean | null |
// undefined`, ToggleOwnProps declares `boolean | undefined` — extending both
// interfaces with the same member name at two different (if overlapping)
// types is a hard TS error, not a style choice, so the component's own
// narrower type wins outright (the AccordionRootProps `defaultValue` Omit on
// the web leaf is the same idiom, for the same reason). `onPress` is
// Omit-ed too: this component owns press handling to drive the toggle.
//
// An INTERSECTION rather than an `interface … extends`, because ToggleOwnProps
// is a union — see the web leaf's note and toggle.props. `accessibilityLabel`
// is Omit-ed for the reason IconButton omits it: `label` owns the accessible
// name outright.
export type ToggleProps = Omit<
  PressableProps,
  'disabled' | 'onPress' | 'accessibilityLabel' | 'aria-label'
> &
  ToggleOwnProps & { children?: React.ReactNode };

export function Toggle({
  pressed,
  defaultPressed,
  onPressedChange,
  disabled,
  value,
  size,
  iconOnly = false,
  label,
  children,
  style,
  // PULLED OUT OF `props` ON PURPOSE. `props` is spread LAST below, so a
  // caller's own handler left in there would replace the ring wiring outright
  // rather than run alongside it.
  onFocus,
  onBlur,
  ...props
}: ToggleProps) {
  const state = useToggleState(pressed, defaultPressed, onPressedChange, disabled, value, size);
  // Colors resolve per render so the leaf follows the OS scheme; only the
  // scheme-independent layout lives at module level in StyleSheet.create.
  const c = useNativeColors();
  const r = useNativeRadii();
  // This package's ring rather than the browser's default blue one, which is
  // what react-native-web paints on an unringed Pressable — see
  // lib/native-focus.native.ts. The web leaf has always drawn the package ring;
  // until now the two panes disagreed on nothing but focus.
  const focus = useNativeFocusRing();

  // Web-only ARIA attribute, not in react-native's PressableProps type but
  // forwarded verbatim by react-native-web — see the file header.
  const webAria = { 'aria-pressed': state.pressed } as PressableProps;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: state.pressed, disabled: state.disabled }}
      // Required by the type when `iconOnly`; `undefined` sets no label at all
      // otherwise, so a text toggle keeps its name-from-content.
      accessibilityLabel={label}
      hitSlop={iconOnly ? iconHitSlop[state.size] : 0}
      {...webAria}
      disabled={state.disabled}
      onPress={() => state.toggle()}
      onFocus={(event) => {
        focus.focus();
        onFocus?.(event);
      }}
      onBlur={(event) => {
        focus.blur();
        onBlur?.(event);
      }}
      style={(pressableState) => [
        styles.base,
        { borderRadius: r.md },
        iconOnly
          ? { width: sizeHeight[state.size], height: sizeHeight[state.size] }
          : { height: sizeHeight[state.size], paddingHorizontal: sizePadX[state.size] },
        {
          backgroundColor: state.pressed ? c.primary : 'transparent',
          opacity: state.disabled ? 0.5 : pressableState.pressed ? 0.9 : 1,
        },
        focus.ringStyle,
        typeof style === 'function' ? style(pressableState) : style,
      ]}
      {...props}
    >
      <Text style={[styles.label, { color: state.pressed ? c.primaryText : c.ink }]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Height and horizontal padding moved OUT to the per-size blocks above; what
  // is left is scheme- and size-independent, which is all StyleSheet.create can
  // hold. `paddingVertical` is gone rather than kept: it was what produced the
  // old 36px height, and a fixed height plus vertical padding would fight.
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // Shrink-wrap, as the web leaf's `inline-flex` does. A React Native parent
    // defaults to `alignItems: 'stretch'`, so without this a TEXT toggle fills
    // its parent's width while the web one hugs its label — `iconOnly` already
    // escaped that through the definite width it sets per size, which is why
    // this only ever showed on half the component. See chip.native.tsx for the
    // long version.
    alignSelf: 'flex-start',
  },
  label: { ...textScale.sm, fontWeight: '500' },
});
