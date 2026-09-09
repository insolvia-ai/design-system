// NATIVE LEAF — React Native primitives over @insolvia-ai/tokens.
//
// Mirrors Input's native leaf and, for the row itself, InputGroup's: a `View`
// draws the box (border, radius, invalid/disabled treatment, the design
// system's OWN focus ring via `useNativeFocusRing`), the `TextInput` inside it
// is bare and takes `flex: 1`. Colours and radii resolve at RENDER time
// (`useNativeColors`/`useNativeRadii`), never at module load — see
// native-theme.native.ts.
//
// PLATFORM SEAM, RECORDED ON PURPOSE. The web leaf draws its toggle as an
// inline SVG eye/eye-off glyph, because SVG is free on the DOM. React Native
// has no SVG primitive without a native dependency this package cannot
// declare (the same rule that keeps `Input` from shipping a `file` type — see
// input.props.ts). Rather than ship an icon font or a fake glyph drawn from
// `View`s, the native toggle is small `Text` reading "Show"/"Hide" — honest
// about what it is, and legible at every size. The two leaves therefore look
// different at the toggle; they still expose the identical contract
// (`accessibilityState.selected`, a label that flips with it).
//
// `accessibilityRole`: neither `"togglebutton"` (Android-only) nor `"switch"`
// (which reads as an on/off setting, not a momentary reveal) is portable
// across iOS and Android, so this uses the ordinary `"button"` role and
// carries the pressed state on `accessibilityState.selected` instead — the
// same shape VoiceOver and TalkBack both already understand for a toggle
// button with no dedicated role. Reported BOTH ways, the split
// icon-button.native.tsx and chip.native.tsx already document: `aria-pressed`
// alongside it, because react-native-web's DOM translation does not flatten
// `accessibilityState` into any `aria-*` attribute on its own.
import * as React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type TextInputProps,
} from 'react-native';

import { spacing } from '@insolvia-ai/tokens';

import { FieldContext } from '../field/field.props';
import { CONTROL_HEIGHT_PX, useInputState } from '../input/input.props';
import { useNativeFocusRing } from '../lib/native-focus';
import { useNativeColors, useNativeRadii } from '../lib/native-theme';
import { textScale, useNativeBodyFamily } from '../lib/native-typography';
import {
  DEFAULT_AUTO_COMPLETE,
  DEFAULT_HIDE_LABEL,
  DEFAULT_SHOW_LABEL,
  useRevealedState,
  type PasswordInputOwnProps,
} from './password-input.props';

export interface PasswordInputProps
  extends
    Omit<
      TextInputProps,
      'value' | 'defaultValue' | 'onChangeText' | 'editable' | 'secureTextEntry' | 'autoComplete'
    >,
    PasswordInputOwnProps {
  /** Names the control when it is not inside a `<Field.Root>`. */
  'aria-label'?: string | undefined;
}

export const PasswordInput = ({
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  readOnly = false,
  invalid = false,
  name: _name,
  placeholder,
  autoComplete = DEFAULT_AUTO_COMPLETE,
  revealed,
  defaultRevealed,
  onRevealedChange,
  showLabel = DEFAULT_SHOW_LABEL,
  hideLabel = DEFAULT_HIDE_LABEL,
  style,
  // Pulled out of `props` on purpose — `props` spreads LAST onto the
  // TextInput below, so a caller's own handler left in there would replace
  // the ring wiring outright instead of running alongside it.
  onFocus,
  onBlur,
  ...props
}: PasswordInputProps) => {
  const field = React.useContext(FieldContext);
  const c = useNativeColors();
  const r = useNativeRadii();
  const focus = useNativeFocusRing();
  const body = useNativeBodyFamily();
  const [text, setText] = useInputState({ value, defaultValue, onValueChange });
  const [isRevealed, setRevealed] = useRevealedState({
    revealed,
    defaultRevealed,
    onRevealedChange,
  });

  const isInvalid = invalid || (field?.invalid ?? false);
  const editable = !disabled && !readOnly;

  // Reported BOTH ways, the split icon-button.native.tsx and chip.native.tsx
  // document: `accessibilityState` for the real native platforms, and
  // `aria-pressed` — which has no react-native type, hence the contained
  // cast — for react-native-web, whose DOM prop translation does not flatten
  // `accessibilityState` into any `aria-*` attribute.
  const toggleProps = {
    accessibilityState: { selected: isRevealed, disabled },
    'aria-pressed': isRevealed,
  } as PressableProps;

  // `aria-describedby`/`aria-invalid` are web-only and outside RN's own
  // types; react-native-web forwards them to the DOM regardless. OMITTED
  // rather than set to undefined, so the control never points at an element
  // that does not exist — same shape as input.native.tsx.
  const webAria = {
    ...(field?.describedBy === undefined ? {} : { 'aria-describedby': field.describedBy }),
    ...(isInvalid ? { 'aria-invalid': true } : {}),
  } as TextInputProps;

  return (
    <View
      style={[
        styles.root,
        { height: CONTROL_HEIGHT_PX, borderRadius: r.md },
        {
          // No `opacity` dimming here — mirrors `input.native.tsx`, which
          // dims disabled text to `muted` and swaps the fill to `surfaceAlt`
          // but never fades the box. react-native-web renders a disabled
          // `TextInput` as `<input readonly aria-disabled="true">`, not a
          // real `disabled` attribute, so axe does NOT exempt it from
          // contrast the way a browser exempts a truly disabled control. An
          // `opacity` multiplier here blends the already-`muted` text down
          // further — 0.5 dropped it to ~2:1 against the page canvas, well
          // under the 4.5:1 floor. `muted` on `surfaceAlt` alone clears
          // 4.5:1 in both schemes, so the box only needs to swap colours.
          borderColor: isInvalid ? c.danger : c.line,
          backgroundColor: disabled ? c.surfaceAlt : c.card,
        },
        focus.ringStyle,
      ]}
    >
      <TextInput
        nativeID={field?.controlId}
        aria-labelledby={field?.labelId}
        aria-label={props['aria-label']}
        {...webAria}
        accessibilityState={{ disabled }}
        editable={editable}
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={c.muted}
        secureTextEntry={!isRevealed}
        // `secureTextEntry` alone leaves react-native-web's DOM `<input>`
        // without a `type` attribute at all while revealed — it only sets
        // `type="password"` when true, never `type="text"` for the opposite
        // case (see TextInput/index.js in react-native-web). Naming the mode
        // explicitly is what gives the revealed state its own `type="text"`,
        // matching the web leaf's real `<input type="text">`.
        inputMode="text"
        // RN capitalizes sentences by default, which turns a typed password
        // into a rejected one on the first character.
        autoCapitalize="none"
        autoCorrect={false}
        textContentType={autoComplete === 'new-password' ? 'newPassword' : 'password'}
        autoComplete={autoComplete === 'new-password' ? 'new-password' : 'current-password'}
        onFocus={(event) => {
          focus.focus();
          onFocus?.(event);
        }}
        onBlur={(event) => {
          focus.blur();
          onBlur?.(event);
        }}
        style={[styles.input, { fontFamily: body }, { color: disabled ? c.muted : c.ink }, style]}
        {...props}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isRevealed ? hideLabel : showLabel}
        {...toggleProps}
        disabled={disabled}
        onPress={() => setRevealed(!isRevealed)}
        style={styles.toggle}
      >
        {/* A word, not a glyph — "Show"/"Hide" is body copy and follows the family. */}
        <Text style={[styles.toggleLabel, { fontFamily: body, color: c.muted }]}>
          {isRevealed ? 'Hide' : 'Show'}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
  },
  toggle: {
    flexShrink: 0,
    justifyContent: 'center',
  },
  toggleLabel: { ...textScale.sm },
});
