// NATIVE LEAF — React Native's TextInput over @insolvia-ai/tokens.
//
// Mirrors Textarea's and Select's native leaves, which is deliberate: the
// controls sitting next to each other in one form should not look like
// different species. Colors resolve at render time; StyleSheet.create keeps
// only the scheme-independent box.
import * as React from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { radii, spacing } from '@insolvia-ai/tokens';

import { FieldContext } from '../field/field.props';
import { useInputGroup } from '../input-group/input-group.props';
import { useNativeFocusRing } from '../lib/native-focus';
import { useNativeColors } from '../lib/native-theme';
import {
  CONTROL_HEIGHT_PX,
  isSecureType,
  keyboardTypeFor,
  useInputState,
  type InputOwnProps,
} from './input.props';

export interface InputProps
  extends
    Omit<
      TextInputProps,
      'value' | 'defaultValue' | 'onChangeText' | 'editable' | 'secureTextEntry'
    >,
    InputOwnProps {
  /** Names the control when it is not inside a `<Field.Root>`. */
  'aria-label'?: string | undefined;
}

export const Input = ({
  value,
  defaultValue,
  onValueChange,
  type = 'text',
  disabled = false,
  invalid = false,
  name: _name,
  placeholder,
  style,
  ...props
}: InputProps) => {
  const field = React.useContext(FieldContext);
  const group = useInputGroup();
  const c = useNativeColors();
  const focus = useNativeFocusRing();
  const [text, setText] = useInputState({ value, defaultValue, onValueChange });

  const isInvalid = invalid || (field?.invalid ?? false);

  // `aria-describedby` and `aria-invalid` are web-only and outside RN's own
  // types; react-native-web forwards them to the DOM regardless. OMITTED
  // rather than set to undefined, so the control never points at an element
  // that does not exist — the same shape Field's and DatePicker's native leaves
  // use.
  const webAria = {
    ...(field?.describedBy === undefined ? {} : { 'aria-describedby': field.describedBy }),
    ...(isInvalid ? { 'aria-invalid': true } : {}),
  } as TextInputProps;

  return (
    <TextInput
      nativeID={field?.controlId}
      aria-labelledby={field?.labelId}
      aria-label={props['aria-label']}
      {...webAria}
      accessibilityState={{ disabled }}
      editable={!disabled}
      value={text}
      onChangeText={setText}
      placeholder={placeholder}
      placeholderTextColor={c.muted}
      keyboardType={keyboardTypeFor[type]}
      secureTextEntry={isSecureType(type)}
      // `none` for email/url/password: RN capitalizes sentences by default,
      // which turns a typed address into a rejected one on the first character.
      autoCapitalize={type === 'text' || type === 'search' ? 'sentences' : 'none'}
      autoCorrect={type === 'text'}
      onFocus={(event) => {
        focus.focus();
        props.onFocus?.(event);
      }}
      onBlur={(event) => {
        focus.blur();
        props.onBlur?.(event);
      }}
      style={[
        styles.base,
        { height: CONTROL_HEIGHT_PX, color: disabled ? c.muted : c.ink },
        group
          ? // Inside a group the Root draws the box; the control keeps only
            // its text and its share of the row. `flex: 1` is what lets the
            // addons keep their intrinsic width.
            styles.bare
          : [
              styles.boxed,
              {
                borderColor: isInvalid ? c.danger : c.line,
                backgroundColor: disabled ? c.surfaceAlt : c.card,
              },
            ],
        focus.ringStyle,
        style,
      ]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    width: '100%',
    paddingHorizontal: spacing.sm,
    fontSize: 14,
  },
  boxed: {
    borderWidth: 1,
    borderRadius: radii.md,
  },
  bare: {
    flex: 1,
    minWidth: 0,
    width: 'auto',
    backgroundColor: 'transparent',
  },
});
