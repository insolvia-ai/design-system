// NATIVE LEAF — React Native primitives over @insolvia-ai/tokens.
//
// ONE hidden `TextInput` owns the value; `length` decorative boxes are drawn
// FROM it, not from state of their own. `length` separate `TextInput`s — the
// web leaf's shape — was the first instinct here and the wrong one, twice
// over. React Native has no equivalent of the DOM's own tab order or a
// `maxLength`-triggered "advance to the next field" primitive, so N inputs
// fighting over focus would have to be hand-wired exactly as fragile as the
// web leaf's ref-juggling, on a platform with fewer signals to do it with. And
// the whole reason to build this for a PHONE — `textContentType="oneTimeCode"`
// plus a platform-appropriate `autoComplete` (see below) — fills exactly ONE
// field in one motion when the OS reads an incoming SMS; it has no way to spread six
// characters across six separate inputs, so six inputs would simply not
// receive the autofill this component exists to support.
//
// The hidden input stays truly MOUNTED (`opacity: 0`, not `display: 'none'`
// or conditional rendering) — it has to remain focusable for the keyboard and
// the OS autofill to reach it at all, and it's laid absolutely over the whole
// row so a tap anywhere on the boxes lands on it directly; the wrapping
// `Pressable` calls `.focus()` too, as a second, explicit route to the same
// place for whatever a bare absolute overlay misses on a given platform.
import * as React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { spacing } from '@insolvia-ai/tokens';

import { FieldContext } from '../field/field.props';
import { CONTROL_HEIGHT_PX } from '../input/input.props';
import { useNativeColors, useNativeRadii } from '../lib/native-theme';
import { useNativeMonoFamily } from '../lib/native-typography';
import {
  acceptChar,
  normalizeChar,
  usePinInputState,
  type PinInputOwnProps,
} from './pin-input.props';

export interface PinInputProps
  extends
    Omit<TextInputProps, 'value' | 'defaultValue' | 'onChangeText' | 'maxLength' | 'editable'>,
    PinInputOwnProps {}

export const PinInput = ({
  length = 6,
  value: valueProp,
  defaultValue,
  onValueChange,
  onComplete,
  type = 'numeric',
  mask = false,
  disabled = false,
  invalid = false,
  name: _name,
  autoFocus = false,
  label = 'Verification code',
  style,
  onFocus,
  onBlur,
  ...props
}: PinInputProps) => {
  const field = React.useContext(FieldContext);
  const c = useNativeColors();
  const r = useNativeRadii();
  const mono = useNativeMonoFamily();
  const [value, setValue] = usePinInputState({
    length,
    value: valueProp,
    defaultValue,
    onValueChange,
    onComplete,
  });

  const isInvalid = invalid || (field?.invalid ?? false);
  const inputRef = React.useRef<TextInput>(null);
  const [focused, setFocused] = React.useState(false);
  const activeIndex = Math.min(value.length, length - 1);

  // The OS keyboard and SMS autofill can hand this MORE than one legal
  // character at once (autofill delivers the whole code in a single call), so
  // this filters and clips exactly like `distributePaste` does for a web
  // paste — it's the same "accept what's legal, drop the rest, never exceed
  // length" rule, just reached through `onChangeText` instead of a clipboard
  // event.
  const handleChangeText = (raw: string) => {
    const next = Array.from(raw)
      .filter((ch) => acceptChar(type, ch))
      .map((ch) => normalizeChar(type, ch))
      .join('')
      .slice(0, length);
    setValue(next);
  };

  // `aria-invalid`/`aria-disabled` are outside RN's own TextInputProps but ARE
  // what react-native-web forwards to the DOM — the same shape input.native.tsx
  // uses. `accessibilityState={{ disabled }}` below is NOT enough on its own:
  // react-native-web's TextInput never translates `accessibilityState` into
  // ARIA attributes (unlike View/Pressable), so without this the Disabled
  // story shipped a hidden input axe could not tell was disabled. Both are
  // omitted rather than set `false` so no attribute appears at all when
  // nothing is wrong.
  const webAria = {
    ...(isInvalid ? { 'aria-invalid': true } : {}),
    ...(disabled ? { 'aria-disabled': true } : {}),
  } as TextInputProps;

  return (
    <Pressable
      accessibilityRole="none"
      onPress={() => {
        if (!disabled) inputRef.current?.focus();
      }}
      style={[styles.row, style]}
    >
      {Array.from({ length }, (_, index) => {
        const ch = value[index] ?? '';
        const isActive = focused && index === activeIndex;
        return (
          <View
            key={index}
            accessible={false}
            style={[
              styles.box,
              {
                borderRadius: r.md,
                borderWidth: isActive ? 2 : 1,
                borderColor: isInvalid ? c.danger : isActive ? c.accent : c.line,
                backgroundColor: disabled ? c.surfaceAlt : c.card,
              },
            ]}
          >
            <Text style={[styles.glyph, { fontFamily: mono, color: disabled ? c.muted : c.ink }]}>
              {ch === '' ? '' : mask ? '•' : ch}
            </Text>
          </View>
        );
      })}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChangeText}
        maxLength={length}
        editable={!disabled}
        keyboardType={type === 'numeric' ? 'number-pad' : 'default'}
        // `none`, not `characters`, for numeric: capitalisation is meaningless
        // for digits and RN's default (`sentences`) would still fight a
        // one-time-code keyboard that has no letters to capitalise anyway.
        autoCapitalize={type === 'alphanumeric' ? 'characters' : 'none'}
        autoCorrect={false}
        spellCheck={false}
        textContentType="oneTimeCode"
        // One attribute, three platforms: Android reads `sms-otp`; iOS and
        // web (react-native-web forwards this verbatim as the DOM
        // `autocomplete` attribute, which is what axe's autocomplete-valid
        // rule validates) both want `one-time-code`.
        autoComplete={Platform.select({ android: 'sms-otp', default: 'one-time-code' })}
        autoFocus={autoFocus}
        accessibilityLabel={label}
        accessibilityHint={`${length}-character code`}
        accessibilityState={{ disabled }}
        {...webAria}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={styles.hiddenInput}
        {...props}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  // `position: 'relative'` is what lets `hiddenInput` below lay itself over
  // exactly this row. `alignSelf: 'flex-start'` hugs the boxes, matching the
  // web leaf's `inline-flex` — see CLAUDE.md's native-size rule: undeclared,
  // a React Native parent's default `alignItems: 'stretch'` would run this
  // the full width of whatever contains it.
  row: {
    position: 'relative',
    flexDirection: 'row',
    alignSelf: 'flex-start',
    gap: spacing.sm,
  },
  box: {
    height: CONTROL_HEIGHT_PX,
    width: CONTROL_HEIGHT_PX,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: { fontSize: 18 },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
  },
});
