// NATIVE LEAF — React Native's TextInput over @insolvia-ai/tokens.
//
// React Native 0.86's `role` prop (typed `Role`) includes `spinbutton`, and
// react-native-web renders it verbatim — the exact role the web leaf uses
// (`number-input.web.tsx`'s `role="spinbutton"`), so the two leaves agree
// under react-native-web instead of the field reporting as a slider. The
// increment/decrement gesture VoiceOver/TalkBack actually drive on a device
// is independent of that role: `accessibilityActions`/`onAccessibilityAction`
// carries it, the same pair `slider.native.tsx` uses for its drag. Applied to
// the `TextInput` itself rather than the row: the row is layout, the field is
// the one thing that is actually adjustable, and a screen-reader user still
// double-taps it to type digits the normal way.
//
// The `aria-value*` trio rides alongside `accessibilityValue` for the same
// reason `slider.native.tsx` carries both: react-native-web ignores the
// nested `accessibilityValue` object entirely, so without the trio the WEB
// build of a React Native consumer announces a spinner with no position.
import * as React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { spacing } from '@insolvia-ai/tokens';

import { FieldContext } from '../field/field.props';
import { CONTROL_HEIGHT_PX, keyboardTypeFor } from '../input/input.props';
import { useNativeFocusRing } from '../lib/native-focus';
import { useNativeColors, useNativeRadii } from '../lib/native-theme';
import { useNativeBodyFamily } from '../lib/native-typography';
import {
  DEFAULT_DECREMENT_LABEL,
  DEFAULT_INCREMENT_LABEL,
  DEFAULT_STEP,
  useNumberInputState,
  type NumberInputOwnProps,
} from './number-input.props';

export interface NumberInputProps
  extends
    Omit<
      TextInputProps,
      'value' | 'defaultValue' | 'onChangeText' | 'editable' | 'keyboardType' | 'style'
    >,
    NumberInputOwnProps {
  /** Names the control when it is not inside a `<Field.Root>`. */
  'aria-label'?: string | undefined;
  /**
   * Styles the OUTER box — the row holding the field and its steppers — and
   * so is a `ViewStyle`, not the `TextStyle` a `TextInput`'s own `style` is.
   * Inheriting `TextInputProps['style']` and handing it to a `View` typechecks
   * here only because this package's programs see `TextStyle` as a superset
   * of `ViewStyle`; a consumer whose program augments `TextStyle` (react-native-web's
   * typings widen `cursor`, for one) gets a hard error in its own build from
   * source this package published. Stating the truth keeps both compiling.
   */
  style?: StyleProp<ViewStyle> | undefined;
}

export const NumberInput = ({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  step = DEFAULT_STEP,
  disabled = false,
  readOnly = false,
  invalid = false,
  name: _name,
  placeholder,
  incrementLabel = DEFAULT_INCREMENT_LABEL,
  decrementLabel = DEFAULT_DECREMENT_LABEL,
  style,
  // PULLED OUT OF `props` ON PURPOSE — same reasoning as input.native.tsx: a
  // caller's own handler left in `props` (spread LAST) would replace the ring
  // and commit wiring outright rather than run alongside it.
  onFocus,
  onBlur,
  ...props
}: NumberInputProps) => {
  const field = React.useContext(FieldContext);
  const c = useNativeColors();
  const r = useNativeRadii();
  const focus = useNativeFocusRing();
  const body = useNativeBodyFamily();
  const state = useNumberInputState({ value, defaultValue, onValueChange, min, max, step });

  const isInvalid = invalid || (field?.invalid ?? false);
  const atMin = state.value !== null && min !== undefined && state.value <= min;
  const atMax = state.value !== null && max !== undefined && state.value >= max;
  const decDisabled = disabled || readOnly || atMin;
  const incDisabled = disabled || readOnly || atMax;

  // Same shape as input.native.tsx's `webAria`: web-only ARIA that has no RN
  // type, OMITTED rather than set to undefined so react-native-web never
  // points at an absent id or announces a value that is not there.
  const webAria = {
    ...(field?.describedBy === undefined ? {} : { 'aria-describedby': field.describedBy }),
    ...(isInvalid ? { 'aria-invalid': true } : {}),
    // Explicit, same as slider.native.tsx: `accessibilityState={{ disabled
    // }}` alone never reaches the DOM here — react-native-web's TextInput has
    // no `accessibilityState` handling at all (unlike Pressable, which reads
    // its OWN `disabled` prop), so without this the field's `aria-disabled`
    // stayed unset under react-native-web no matter what `disabled` was.
    ...(disabled ? { 'aria-disabled': true } : {}),
    'aria-valuemin': min,
    'aria-valuemax': max,
    ...(state.value === null ? {} : { 'aria-valuenow': state.value }),
  } as TextInputProps;

  return (
    <View
      style={[
        styles.row,
        { height: CONTROL_HEIGHT_PX, borderRadius: r.md },
        {
          borderColor: isInvalid ? c.danger : c.line,
          backgroundColor: disabled ? c.surfaceAlt : c.card,
          opacity: disabled ? 0.5 : 1,
        },
        focus.ringStyle,
        style,
      ]}
    >
      <TextInput
        nativeID={field?.controlId}
        aria-labelledby={field?.labelId}
        aria-label={props['aria-label']}
        {...webAria}
        role="spinbutton"
        accessibilityState={{ disabled }}
        accessibilityValue={{
          min,
          max,
          now: state.value ?? undefined,
        }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => {
          if (disabled || readOnly) return;
          if (event.nativeEvent.actionName === 'increment') state.stepBy('increment');
          else if (event.nativeEvent.actionName === 'decrement') state.stepBy('decrement');
        }}
        editable={!disabled && !readOnly}
        value={state.text}
        onChangeText={state.setText}
        placeholder={placeholder}
        placeholderTextColor={c.muted}
        keyboardType={keyboardTypeFor.number}
        onFocus={(event) => {
          focus.focus();
          state.focus();
          onFocus?.(event);
        }}
        onBlur={(event) => {
          focus.blur();
          state.commit();
          onBlur?.(event);
        }}
        style={[styles.input, { fontFamily: body }, { color: disabled ? c.muted : c.ink }]}
        {...props}
      />
      <NumberInputStepper
        label={decrementLabel}
        glyph="−"
        disabled={decDisabled}
        onPress={() => state.stepBy('decrement')}
      />
      <NumberInputStepper
        label={incrementLabel}
        glyph="+"
        disabled={incDisabled}
        onPress={() => state.stepBy('increment')}
      />
    </View>
  );
};

/**
 * One stepper button. A private helper, not a public compound part — the two
 * presses are the whole surface, and neither is something a caller composes
 * around.
 *
 * Its own `useNativeFocusRing()`, separate from the field's: the two buttons
 * and the text input are three independently-focusable controls in one row
 * (Tab order under react-native-web, or a TV remote), so each draws its own
 * ring rather than sharing the field's — the same one-ring-per-control shape
 * `icon-button.native.tsx` uses.
 */
function NumberInputStepper({
  label,
  glyph,
  disabled,
  onPress,
}: {
  label: string;
  glyph: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const c = useNativeColors();
  const focus = useNativeFocusRing();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      onFocus={focus.focus}
      onBlur={focus.blur}
      style={({ pressed }) => [
        styles.stepper,
        {
          borderLeftColor: c.line,
          backgroundColor: pressed && !disabled ? c.surfaceAlt : 'transparent',
        },
        disabled ? styles.stepperDisabled : null,
        focus.ringStyle,
      ]}
    >
      {/* No body family: −/+ is a glyph in a fixed box, not body copy — it keeps the platform face. */}
      <Text style={[styles.stepperGlyph, { color: disabled ? c.muted : c.ink }]}>{glyph}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    borderWidth: 1,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: spacing.sm,
    fontSize: 14,
  },
  stepper: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
  },
  stepperDisabled: {
    opacity: 0.4,
  },
  stepperGlyph: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
