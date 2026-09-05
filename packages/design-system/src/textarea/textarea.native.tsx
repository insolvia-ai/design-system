// NATIVE LEAF — a multiline TextInput over @insolvia-ai/tokens.
//
// Two RN details the web leaf never has to think about. `numberOfLines` sizes
// the box on Android and does nothing on iOS, so the height comes from
// `minHeightForRows` instead — shared, so both leaves agree what `rows={4}`
// means. And `textAlignVertical: 'top'` is required on Android, where a
// multiline input otherwise centres its first line vertically in the box.
import * as React from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { spacing } from '@insolvia-ai/tokens';

import { FieldContext } from '../field/field.props';
import { useInputGroup } from '../input-group/input-group.props';
import { useNativeFocusRing } from '../lib/native-focus';
import { useNativeColors, useNativeRadii } from '../lib/native-theme';
import { minHeightForRows, useTextareaState, type TextareaOwnProps } from './textarea.props';

export interface TextareaProps
  extends
    Omit<
      TextInputProps,
      'value' | 'defaultValue' | 'onChangeText' | 'editable' | 'multiline' | 'numberOfLines'
    >,
    TextareaOwnProps {
  /** Names the control when it is not inside a `<Field.Root>`. */
  'aria-label'?: string | undefined;
}

export const Textarea = ({
  value,
  defaultValue,
  onValueChange,
  rows = 3,
  disabled = false,
  invalid = false,
  name: _name,
  placeholder,
  style,
  // PULLED OUT OF `props` ON PURPOSE. `props` is spread LAST below, so a
  // caller's own handler left in there would replace the ring wiring outright
  // rather than run alongside it.
  onFocus,
  onBlur,
  ...props
}: TextareaProps) => {
  const field = React.useContext(FieldContext);
  const group = useInputGroup();
  const c = useNativeColors();
  const r = useNativeRadii();
  const focus = useNativeFocusRing();
  const [text, setText] = useTextareaState({ value, defaultValue, onValueChange });

  const isInvalid = invalid || (field?.invalid ?? false);

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
      multiline
      numberOfLines={rows}
      value={text}
      onChangeText={setText}
      placeholder={placeholder}
      placeholderTextColor={c.muted}
      onFocus={(event) => {
        focus.focus();
        onFocus?.(event);
      }}
      onBlur={(event) => {
        focus.blur();
        onBlur?.(event);
      }}
      style={[
        styles.base,
        { minHeight: minHeightForRows(rows), color: disabled ? c.muted : c.ink },
        group
          ? styles.bare
          : [
              styles.boxed,
              { borderRadius: r.md },
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
    paddingVertical: spacing.sm,
    fontSize: 14,
    // Android centres the first line of a multiline input without this.
    textAlignVertical: 'top',
  },
  boxed: { borderWidth: 1 },
  bare: { flex: 1, minWidth: 0, width: 'auto', backgroundColor: 'transparent' },
});
